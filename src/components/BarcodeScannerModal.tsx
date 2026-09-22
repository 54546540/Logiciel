import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Plus,
  Zap,
  Volume2,
  Keyboard,
  Barcode,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Product, formatPrice } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product) => void;
  onAddNewWithBarcode?: (barcode: string) => void;
  currency: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductScanned,
  onAddNewWithBarcode,
  currency,
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [continuousMode, setContinuousMode] = useState(true);
  const [scanFeedbackMsg, setScanFeedbackMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  // Scanner lifecycle references
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const startPromiseRef = useRef<Promise<null> | null>(null);
  const shouldStopRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const lastScanTimeRef = useRef<number>(0);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound synthesizer for feedback
  const playBeep = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (err) {
      console.warn('AudioContext not allowed or supported', err);
    }
  };

  const handleBarcodeDetected = useCallback(
    (code: string) => {
      const now = Date.now();
      // Debounce duplicate scans within 1.5 seconds
      if (now - lastScanTimeRef.current < 1500 && lastScannedCode === code) {
        return;
      }
      lastScanTimeRef.current = now;
      setLastScannedCode(code);
      playBeep();

      // Look for product by barcode or id
      const cleanCode = code.trim().toLowerCase();
      const found = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === cleanCode) ||
          p.id.toLowerCase() === cleanCode
      );

      if (found) {
        setMatchedProduct(found);
        setScanFeedbackMsg(`تمت إضافة: ${found.name}`);
        onProductScanned(found);

        if (!continuousMode) {
          if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
          autoCloseTimerRef.current = setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setTimeout(() => {
            setScanFeedbackMsg(null);
          }, 2500);
        }
      } else {
        setMatchedProduct(null);
        setScanFeedbackMsg(`الرمز [${code}] غير مسجل في قائمة المنتجات`);
      }
    },
    [continuousMode, lastScannedCode, onClose, onProductScanned, products]
  );

  // Safely stop and clear Html5Qrcode instance without throwing or breaking transitions
  const stopAndClearScanner = useCallback(async () => {
    shouldStopRef.current = true;
    const scanner = scannerInstanceRef.current;
    const pendingStart = startPromiseRef.current;

    // Detach references immediately so no concurrent calls occur
    scannerInstanceRef.current = null;
    startPromiseRef.current = null;

    if (!scanner) return;

    try {
      // If start() is currently in progress, we MUST await it to finish its transition first!
      if (pendingStart) {
        try {
          await pendingStart;
        } catch {
          // If start rejected, transition was automatically cancelled by html5-qrcode
        }
      }

      // Check current state safely
      let isActuallyScanning = false;
      try {
        const state = scanner.getState();
        isActuallyScanning =
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED;
      } catch {
        isActuallyScanning = false;
      }

      if (isActuallyScanning) {
        try {
          await scanner.stop();
        } catch (stopErr) {
          console.warn('Handled scanner stop warning:', stopErr);
        }
      }

      try {
        scanner.clear();
      } catch {
        // Ignore clear errors if container is already unmounted
      }
    } catch (err) {
      console.warn('Scanner cleanup warning:', err);
    }
  }, []);

  // Modal open/close camera lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    if (!isOpen) {
      stopAndClearScanner();
      setLastScannedCode(null);
      setMatchedProduct(null);
      setScanFeedbackMsg(null);
      setScannerError(null);
      setIsScanning(false);
      return;
    }

    shouldStopRef.current = false;
    setScannerError(null);
    setIsScanning(false);

    const containerId = 'barcode-scanner-viewfinder';

    // Wait a tick for the DOM modal container to mount
    const timer = setTimeout(() => {
      if (!isMountedRef.current || shouldStopRef.current) return;

      const containerEl = document.getElementById(containerId);
      if (!containerEl) {
        console.warn('Viewfinder container not found in DOM');
        return;
      }

      try {
        const scanner = new Html5Qrcode(containerId, { verbose: false });
        scannerInstanceRef.current = scanner;

        // Custom responsive qrbox sizing
        const qrBoxConfig = (viewfinderWidth: number, viewfinderHeight: number) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          const w = Math.max(180, Math.floor(minDim * 0.78));
          const h = Math.max(120, Math.floor(w * 0.58));
          return { width: w, height: h };
        };

        const startPromise = scanner.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: qrBoxConfig,
            aspectRatio: 1.45,
          },
          (decodedText) => {
            if (isMountedRef.current && !shouldStopRef.current) {
              handleBarcodeDetected(decodedText);
            }
          },
          () => {
            // Ignore frame decode errors
          }
        );

        startPromiseRef.current = startPromise;

        startPromise
          .then(() => {
            startPromiseRef.current = null;
            if (isMountedRef.current && !shouldStopRef.current) {
              setIsScanning(true);
            } else {
              // User closed while camera was starting
              stopAndClearScanner();
            }
          })
          .catch((err) => {
            startPromiseRef.current = null;
            console.warn('Camera start error handled:', err);
            if (isMountedRef.current && !shouldStopRef.current) {
              setScannerError(
                'تعذر تشغيل الكاميرا. يرجى التأكد من منح الإذن لاستخدام الكاميرا أو استخدام قارئ الباركود اليدوي.'
              );
            }
          });
      } catch (err) {
        console.error('Html5Qrcode initialization error:', err);
        setScannerError('حدث خطأ أثناء تهيئة أداة الكاميرا.');
      }
    }, 200);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      stopAndClearScanner();
    };
  }, [isOpen, handleBarcodeDetected, stopAndClearScanner]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  const handleClose = () => {
    stopAndClearScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-[#16161c] border border-[#2e2e38] rounded-2xl p-4 sm:p-5 shadow-2xl text-white flex flex-col max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#292932]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#25252e] border border-[#3e3e4a] flex items-center justify-center text-[#e5c058]">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>أداة مسح الباركود</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e5c058]/20 text-[#f3d57e] font-normal">
                  كاميرا ودوشات
                </span>
              </h3>
              <p className="text-[11px] text-[#a1a1aa]">وجه الكاميرا نحو باركود السلعة</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#25252e]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="mt-3 relative rounded-xl overflow-hidden bg-black border border-[#33333e] flex flex-col items-center justify-center min-h-[220px]">
          {/* Viewfinder element for Html5Qrcode */}
          <div id="barcode-scanner-viewfinder" className="w-full h-full min-h-[200px]" />

          {/* Scan animation line over camera */}
          {isScanning && !scannerError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-36 border-2 border-[#e5c058]/80 rounded-lg relative overflow-hidden shadow-[0_0_15px_rgba(229,192,88,0.2)]">
                {/* Laser scanning beam */}
                <motion.div
                  animate={{ y: [0, 136, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#f3d57e] to-transparent shadow-[0_0_8px_#f3d57e]"
                />
                {/* Corner brackets */}
                <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#e5c058]" />
                <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#e5c058]" />
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#e5c058]" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#e5c058]" />
              </div>
              <span className="text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded-full mt-2 backdrop-blur-xs font-mono">
                ضع الخط فوق كود السلعة
              </span>
            </div>
          )}

          {/* Error or Fallback Message */}
          {scannerError && (
            <div className="p-4 text-center max-w-xs space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-amber-200">{scannerError}</p>
              <p className="text-[11px] text-[#a1a1aa]">
                يمكنك استخدام حقل إدخال الكود أدناه أو ربط قارئ باركود خارجي (دوشات USB أو بلوتوث).
              </p>
            </div>
          )}
        </div>

        {/* Quick Scanner Settings Bar */}
        <div className="mt-2.5 flex items-center justify-between text-xs px-1">
          <button
            type="button"
            onClick={() => setContinuousMode(!continuousMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              continuousMode
                ? 'bg-[#e5c058]/20 text-[#f3d57e] border border-[#e5c058]/40'
                : 'bg-[#202028] text-[#a1a1aa] border border-[#2e2e38]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>المسح المتواصل: {continuousMode ? 'مفعّل' : 'قطعة واحدة'}</span>
          </button>

          <span className="text-[11px] text-[#71717a] flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            <span>صوت التنبيه جاهز</span>
          </span>
        </div>

        {/* Real-time Result Banner */}
        {scanFeedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-2.5 p-3 rounded-xl border text-xs flex items-center justify-between ${
              matchedProduct
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                : 'bg-amber-950/40 border-amber-700/50 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {matchedProduct ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="font-bold block leading-tight">{scanFeedbackMsg}</span>
                {matchedProduct && (
                  <span className="text-[10px] text-emerald-300 font-mono mt-0.5 block">
                    السعر: {formatPrice(matchedProduct.price)} {currency} • الربح:{' '}
                    {formatPrice(
                      matchedProduct.price -
                        (matchedProduct.costPrice ?? Math.round(matchedProduct.price * 0.7))
                    )}{' '}
                    {currency}
                  </span>
                )}
              </div>
            </div>

            {!matchedProduct && lastScannedCode && onAddNewWithBarcode && (
              <button
                onClick={() => {
                  handleClose();
                  onAddNewWithBarcode(lastScannedCode);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#e5c058] text-neutral-950 font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>إضافة المنتج</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Manual / Douchette Input (Works seamlessly with USB / Bluetooth barcode scanners) */}
        <form onSubmit={handleManualSubmit} className="mt-3 pt-3 border-t border-[#25252e]">
          <label className="text-xs font-semibold text-[#d4d4d8] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-[#a1a1aa]" />
              <span>إدخال الكود يدوياً أو بواسطة الدوشات (Scanner):</span>
            </span>
            <span className="text-[10px] text-[#a1a1aa]">يدعم الدوشات مباشرة</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="أدخل كود السلعة أو امسح بالدوشات..."
              className="flex-1 px-3 py-2 bg-[#202026] border border-[#33333d] rounded-xl text-white placeholder-[#71717a] text-xs font-mono focus:outline-none focus:border-[#e5c058]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#2b2b35] hover:bg-[#343440] border border-[#3d3d4b] text-white text-xs font-bold transition-colors"
            >
              بحث وإضافة
            </button>
          </div>
        </form>

        {/* Footer note */}
        <div className="mt-3 text-center">
          <p className="text-[11px] text-[#71717a]">
            إذا كنت تملك جهاز قارئ باركود (Douchette USB/Bluetooth)، يمكنك مسح الباركود مباشرة في أي وقت دون فتح الكاميرا!
          </p>
        </div>
      </motion.div>
    </div>
  );
};
