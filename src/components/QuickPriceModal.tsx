import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Edit3, TrendingUp, AlertTriangle } from 'lucide-react';
import { Product, formatPrice, calculateItemProfit } from '../types';

interface QuickPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdatePrice: (productId: string, newPrice: number, newCostPrice?: number) => void;
  currency: string;
}

export const QuickPriceModal: React.FC<QuickPriceModalProps> = ({
  isOpen,
  onClose,
  product,
  onUpdatePrice,
  currency,
}) => {
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [showCostEdit, setShowCostEdit] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setPrice(product.price.toString());
      setCostPrice(
        product.costPrice !== undefined
          ? product.costPrice.toString()
          : Math.round(product.price * 0.7).toString()
      );
    } else {
      setPrice('');
      setCostPrice('');
    }
    setShowCostEdit(false);
    setError('');
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const parsedPrice = parseFloat(price) || 0;
  const parsedCost = parseFloat(costPrice) || 0;
  const { profit, marginPercent } = calculateItemProfit(parsedPrice, parsedCost);
  const isLoss = parsedCost > parsedPrice && parsedPrice > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = parseFloat(price);
    if (isNaN(finalPrice) || finalPrice < 0) {
      setError('يرجى إدخال سعر صحيح (0 أو أكبر)');
      return;
    }
    const finalCost = parseFloat(costPrice);
    onUpdatePrice(
      product.id,
      finalPrice,
      !isNaN(finalCost) && finalCost >= 0 ? finalCost : undefined
    );
    onClose();
  };

  const adjustPrice = (amount: number) => {
    const current = parseFloat(price) || 0;
    const nextVal = Math.max(0, current + amount);
    setPrice(nextVal.toString());
    setError('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          className="relative w-full max-w-sm bg-[#16161b] border border-[#2e2e36] rounded-2xl p-4 sm:p-5 shadow-2xl text-white"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#2a2a30]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#25252d] border border-[#3f3f4a] flex items-center justify-center text-[#e5c058]">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">تعديل السعر والربح</h3>
                <p className="text-xs text-[#a1a1aa] truncate max-w-[200px]">
                  {product.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#25252d]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#d4d4d8]">
                  سعر إعادة البيع ({currency})
                </label>
                <span className="text-[11px] text-[#e5c058]">قابل للتعديل بحرية</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  autoFocus
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setError('');
                  }}
                  className="w-full text-center py-2.5 bg-[#202026] border-2 border-[#e5c058] rounded-xl text-2xl sm:text-3xl font-bold font-mono text-[#f3d57e] focus:outline-none"
                />
              </div>
            </div>

            {/* Profit margin live feedback */}
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                isLoss
                  ? 'bg-red-950/30 border-red-800/40 text-red-200'
                  : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isLoss ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <div>
                  <span className="text-[10px] text-[#a1a1aa] block leading-none">
                    سعر الشراء: {formatPrice(parsedCost)} {currency}
                  </span>
                  <span className="font-bold text-xs font-mono mt-0.5 block">
                    {isLoss ? 'خسارة: ' : 'صافي الربح: '}
                    {isLoss ? '-' : '+'}
                    {formatPrice(Math.abs(profit))} {currency}
                  </span>
                </div>
              </div>

              <div className="text-left font-mono">
                <button
                  type="button"
                  onClick={() => setShowCostEdit(!showCostEdit)}
                  className="text-[10px] text-[#e5c058] underline block"
                >
                  {showCostEdit ? 'إخفاء التكلفة' : 'تعديل التكلفة'}
                </button>
                <span
                  className={`font-bold text-[11px] ${
                    isLoss ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  هامش {marginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Optional Cost Price Quick Edit */}
            {showCostEdit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#1b1b22] border border-[#2e2e38] rounded-xl p-2.5 space-y-1"
              >
                <label className="text-[11px] text-[#a1a1aa] block font-semibold">
                  سعر الشراء (التكلفة بالجملة):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#141419] border border-[#3c3c4a] rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-[#e5c058] text-right"
                />
              </motion.div>
            )}

            {/* Quick +/- buttons adapted for Algerian Dinar denominations */}
            <div>
              <p className="text-[11px] text-[#71717a] mb-1.5 text-center">أزرار التعديل السريع:</p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustPrice(-100)}
                  className="py-1.5 rounded-lg bg-[#22222a] border border-[#383842] text-xs font-bold text-[#d4d4d8] hover:border-[#e5c058] hover:text-white"
                >
                  -100
                </button>
                <button
                  type="button"
                  onClick={() => adjustPrice(-50)}
                  className="py-1.5 rounded-lg bg-[#22222a] border border-[#383842] text-xs font-bold text-[#d4d4d8] hover:border-[#e5c058] hover:text-white"
                >
                  -50
                </button>
                <button
                  type="button"
                  onClick={() => adjustPrice(50)}
                  className="py-1.5 rounded-lg bg-[#22222a] border border-[#383842] text-xs font-bold text-[#d4d4d8] hover:border-[#e5c058] hover:text-white"
                >
                  +50
                </button>
                <button
                  type="button"
                  onClick={() => adjustPrice(100)}
                  className="py-1.5 rounded-lg bg-[#22222a] border border-[#383842] text-xs font-bold text-[#d4d4d8] hover:border-[#e5c058] hover:text-white"
                >
                  +100
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => adjustPrice(-500)}
                  className="py-1.5 rounded-lg bg-[#22222a] border border-[#383842] text-xs font-bold text-[#d4d4d8] hover:border-[#e5c058] hover:text-white"
                >
                  -500
                </button>
                <button
                  type="button"
                  onClick={() => adjustPrice(-10)}
                  className="py-1.5 rounded-lg bg-[#22222a] border border-[#383842] text-xs font-bold text-[#d4d4d8] hover:border-[#e5c058] hover:text-white"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => adjustPrice(10)}
                  className="py-1.5 rounded-lg bg-[#22222a] border border-[#383842] text-xs font-bold text-[#d4d4d8] hover:border-[#e5c058] hover:text-white"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => adjustPrice(500)}
                  className="py-1.5 rounded-lg bg-[#22222a] border border-[#383842] text-xs font-bold text-[#d4d4d8] hover:border-[#e5c058] hover:text-white"
                >
                  +500
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium text-center">{error}</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <motion.button
                id="confirm-quick-price-btn"
                type="submit"
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-2.5 rounded-xl bg-[#e5c058] hover:bg-[#d4af37] text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>حفظ السعر</span>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-[#22222a] border border-[#383842] text-[#d4d4d8] text-xs sm:text-sm font-semibold"
              >
                إلغاء
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
