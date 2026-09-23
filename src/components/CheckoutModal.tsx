import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CreditCard,
  Banknote,
  Printer,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Coins,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { CartItem, SaleTransaction, formatPrice } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  onCompleteSale: (sale: SaleTransaction) => void;
  currency: string;
  storeName?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  onCompleteSale,
  currency,
  storeName,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<SaleTransaction | null>(null);

  if (!isOpen) return null;

  const total = subtotal;
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate total cost and total profit
  const totalCost = cartItems.reduce((sum, item) => {
    const cost =
      item.customCostPrice ??
      item.product.costPrice ??
      Math.round(item.product.price * 0.7);
    return sum + cost * item.quantity;
  }, 0);

  const totalProfit = Math.max(0, total - totalCost);
  const profitMarginPercent = total > 0 ? (totalProfit / total) * 100 : 0;

  const numericCash = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'cash' ? Math.max(0, numericCash - total) : 0;
  const isCashSufficient = paymentMethod !== 'cash' || numericCash >= total || !cashReceived;

  // Preset quick cash buttons adapted for Algerian Dinar (100, 200, 500, 1000, 2000 د.ج)
  const getCashPresets = () => {
    const presets: number[] = [total];
    const rounded100 = Math.ceil(total / 100) * 100;
    if (rounded100 > total && !presets.includes(rounded100)) presets.push(rounded100);
    const rounded500 = Math.ceil(total / 500) * 500;
    if (rounded500 > total && !presets.includes(rounded500)) presets.push(rounded500);
    const rounded1000 = Math.ceil(total / 1000) * 1000;
    if (rounded1000 > total && !presets.includes(rounded1000)) presets.push(rounded1000);
    const rounded2000 = Math.ceil(total / 2000) * 2000;
    if (rounded2000 > total && !presets.includes(rounded2000)) presets.push(rounded2000);
    return Array.from(new Set(presets)).slice(0, 4);
  };

  const handleFinish = () => {
    const newSale: SaleTransaction = {
      id: 'INV-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      items: [...cartItems],
      subtotal,
      discount: 0,
      total,
      totalCost,
      totalProfit,
      cashReceived: paymentMethod === 'cash' ? (numericCash > 0 ? numericCash : total) : total,
      change: paymentMethod === 'cash' ? (numericCash >= total ? change : 0) : 0,
      paymentMethod,
    };

    setCompletedSale(newSale);
    onCompleteSale(newSale);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCloseAll = () => {
    setCompletedSale(null);
    setCashReceived('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#16161c] border border-[#2f2f38] rounded-2xl p-4 sm:p-5 shadow-2xl text-white max-h-[92vh] flex flex-col overflow-y-auto"
        >
          {/* If sale is completed, show receipt */}
          {completedSale ? (
            <div className="flex flex-col items-center text-center space-y-3.5 py-1">
              <div className="w-12 h-12 rounded-full bg-[#e5c058]/20 border border-[#e5c058] flex items-center justify-center text-[#f3d57e]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">تم تأكيد وحساب البيع بنجاح!</h3>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  رقم الفاتورة: {completedSale.id} • {new Date(completedSale.date).toLocaleDateString('ar-DZ')} {new Date(completedSale.date).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Automatic Stock Decrement Notification Banner */}
              <div className="w-full bg-[#16231c] border border-emerald-800/60 rounded-xl p-2.5 flex items-center gap-2 text-right">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-[11px] text-emerald-200">
                  <span className="font-bold block">تم تحديث المخزون أوتوماتيكياً:</span>
                  <span>تم خصم {completedSale.items.reduce((s, i) => s + i.quantity, 0)} قطعة بنجاح من أرصدة السلع.</span>
                </div>
              </div>

              {/* Receipt summary card */}
              <div className="w-full bg-[#111114] border border-[#2b2b34] rounded-xl p-3.5 text-xs text-right space-y-2 font-mono">
                <div className="flex justify-between text-[#a1a1aa]">
                  <span>عدد السلع:</span>
                  <span>{completedSale.items.reduce((s, i) => s + i.quantity, 0)} قطعة</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#f3d57e] pt-1.5 border-t border-[#25252d]">
                  <span>إجمالي البيع:</span>
                  <span>{formatPrice(completedSale.total)} {currency}</span>
                </div>

                {/* Profit indicator in receipt */}
                <div className="flex justify-between text-emerald-400 font-bold bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>صافي الربح المسجل:</span>
                  </span>
                  <span>+{formatPrice(completedSale.totalProfit)} {currency}</span>
                </div>

                {completedSale.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between text-[#a1a1aa] pt-1">
                      <span>المدفوع نقداً:</span>
                      <span>{formatPrice(completedSale.cashReceived)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-[#86efac] font-bold">
                      <span>الباقي للزبون:</span>
                      <span>{formatPrice(completedSale.change)} {currency}</span>
                    </div>
                  </>
                )}
                {completedSale.paymentMethod === 'card' && (
                  <div className="flex justify-between text-[#93c5fd]">
                    <span>طريقة الدفع:</span>
                    <span>بطاقة بنكية / ذهبية (CIB)</span>
                  </div>
                )}
              </div>

              <div className="w-full flex items-center gap-2 pt-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 rounded-xl bg-[#25252e] hover:bg-[#2e2e38] border border-[#3b3b47] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-[#a1a1aa]" />
                  <span>طباعة وصل الاستلام</span>
                </button>
                <button
                  onClick={handleCloseAll}
                  className="flex-1 py-2.5 rounded-xl bg-[#e5c058] hover:bg-[#d4af37] text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>عملية بيع جديدة</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#292932]">
                <div>
                  <h3 className="text-base font-bold text-white">إتمام الحساب والدفع</h3>
                  <p className="text-xs text-[#a1a1aa]">{storeName || 'متجري'}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#25252d]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount & Profit Summary */}
              <div className="mt-3.5 p-3.5 bg-[#1b1b22] border border-[#32323c] rounded-xl text-center space-y-2">
                <div>
                  <span className="text-xs text-[#a1a1aa] block">المبلغ الإجمالي المستحق</span>
                  <div className="text-3xl font-black font-mono text-[#f3d57e] mt-0.5">
                    {formatPrice(total)}{' '}
                    <span className="text-base font-bold text-[#e5c058]">{currency}</span>
                  </div>
                </div>

                {/* Profit Breakdown Banner */}
                <div className="pt-2 border-t border-[#292934] flex items-center justify-between text-xs font-mono px-1">
                  <span className="text-[#a1a1aa] flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>التكلفة: {formatPrice(totalCost)} {currency}</span>
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>الربح: +{formatPrice(totalProfit)} {currency} ({profitMarginPercent.toFixed(0)}%)</span>
                  </span>
                </div>

                {/* Stock Deduction Note */}
                <div className="pt-2 border-t border-[#292934] flex items-center justify-between text-[11px] text-[#a1a1aa]">
                  <span className="flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-[#e5c058]" />
                    <span>تأثير المخزون:</span>
                  </span>
                  <span className="text-[#f3d57e] font-mono font-semibold">
                    سيتم خصم {totalItemCount} قطعة أوتوماتيكياً
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="mt-3.5">
                <label className="block text-xs font-semibold text-[#d4d4d8] mb-1.5">
                  طريقة الدفع:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-[#e5c058]/15 border-[#e5c058] text-[#f3d57e]'
                        : 'bg-[#202026] border-[#31313a] text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>نقداً (كاش)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-[#e5c058]/15 border-[#e5c058] text-[#f3d57e]'
                        : 'bg-[#202026] border-[#31313a] text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>بطاقة ذهبية / CIB</span>
                  </button>
                </div>
              </div>

              {/* Cash handling section */}
              {paymentMethod === 'cash' && (
                <div className="mt-3 space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#d4d4d8] mb-1">
                      المبلغ المستلم من الزبون ({currency}):
                    </label>
                    <input
                      id="cash-received-input"
                      type="number"
                      step="any"
                      min="0"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder={total.toString()}
                      className="w-full px-3.5 py-2.5 bg-[#202026] border border-[#363642] rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-[#e5c058] text-right"
                    />
                  </div>

                  {/* Preset Quick Cash Buttons */}
                  <div>
                    <span className="text-[11px] text-[#71717a] block mb-1">
                      فئات نقدية سريعة:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {getCashPresets().map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCashReceived(preset.toString())}
                          className="px-2.5 py-1 rounded-lg bg-[#22222a] border border-[#383842] text-xs font-mono font-bold text-[#d4d4d8] hover:border-[#e5c058] hover:text-[#f3d57e] transition-colors"
                        >
                          {formatPrice(preset)} {currency}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change calculation */}
                  {numericCash > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs ${
                        numericCash >= total
                          ? 'bg-[#15241b] border-emerald-800/40 text-emerald-200'
                          : 'bg-red-950/30 border-red-800/40 text-red-300'
                      }`}
                    >
                      <span className="font-sans font-semibold">
                        {numericCash >= total ? 'المتبقي (الصرف للزبون):' : 'المبلغ غير كافٍ:'}
                      </span>
                      <span className="text-sm font-black">
                        {numericCash >= total
                          ? `${formatPrice(change)} ${currency}`
                          : `ينقص ${formatPrice(total - numericCash)} ${currency}`}
                      </span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  id="confirm-checkout-btn"
                  onClick={handleFinish}
                  disabled={!isCashSufficient}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    isCashSufficient
                      ? 'bg-[#e5c058] hover:bg-[#d4af37] text-neutral-950 shadow-lg shadow-amber-500/10'
                      : 'bg-[#262630] text-[#71717a] cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-neutral-950" />
                  <span>تأكيد البيع وخصم المخزون</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-[#22222a] border border-[#383842] text-[#d4d4d8] text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
