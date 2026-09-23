import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  Tag,
  Barcode,
  Layers,
  TrendingUp,
  AlertTriangle,
  Camera,
  Coins,
  Boxes,
  Plus,
} from 'lucide-react';
import { Product, formatPrice, calculateItemProfit } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'> | Product) => void;
  initialProduct?: Product | null;
  currency: string;
  initialBarcode?: string;
  onOpenScanner?: () => void;
}

const COMMON_CATEGORIES = [
  'عام',
  'ملابس وأزياء',
  'إلكترونيات وهواتف',
  'عطور وكوسميتيك',
  'مواد غذائية',
  'خردوات ولوازم',
  'مكتبة وأدوات',
  'أحذية وحقائب',
  'قطع غيار',
  'خدمات وصيانة',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  currency,
  initialBarcode,
  onOpenScanner,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(''); // سعر البيع
  const [costPrice, setCostPrice] = useState(''); // سعر الشراء / التكلفة
  const [stock, setStock] = useState('20'); // كمية المخزون
  const [category, setCategory] = useState('عام');
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setPrice(initialProduct.price.toString());
      setCostPrice(
        initialProduct.costPrice !== undefined
          ? initialProduct.costPrice.toString()
          : Math.round(initialProduct.price * 0.7).toString()
      );
      setStock(
        initialProduct.stock !== undefined ? initialProduct.stock.toString() : '20'
      );
      setCategory(initialProduct.category || 'عام');
      setBarcode(initialProduct.barcode || '');
    } else {
      setName('');
      setPrice('');
      setCostPrice('');
      setStock('20');
      setCategory('عام');
      setBarcode(initialBarcode || '');
    }
    setError('');
  }, [initialProduct, initialBarcode, isOpen]);

  // Realtime profit calculation
  const numericPrice = parseFloat(price) || 0;
  const numericCost = parseFloat(costPrice) || 0;
  const { profit, marginPercent } = calculateItemProfit(numericPrice, numericCost);
  const isLoss = numericCost > numericPrice && numericPrice > 0;

  const handleAddStock = (amount: number) => {
    const current = parseInt(stock, 10) || 0;
    setStock(Math.max(0, current + amount).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى كتابة اسم المنتج أو السلعة');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('يرجى كتابة سعر بيع صحيح (0 أو أكثر)');
      return;
    }

    const parsedCost = parseFloat(costPrice);
    const finalCost =
      !isNaN(parsedCost) && parsedCost >= 0 ? parsedCost : Math.round(parsedPrice * 0.7);

    const parsedStock = parseInt(stock, 10);
    const finalStock = !isNaN(parsedStock) && parsedStock >= 0 ? parsedStock : 0;

    if (initialProduct) {
      onSave({
        ...initialProduct,
        name: name.trim(),
        price: parsedPrice,
        costPrice: finalCost,
        stock: finalStock,
        category: category.trim() || 'عام',
        barcode: barcode.trim(),
        updatedAt: Date.now(),
      });
    } else {
      onSave({
        name: name.trim(),
        price: parsedPrice,
        costPrice: finalCost,
        stock: finalStock,
        category: category.trim() || 'عام',
        barcode: barcode.trim(),
        updatedAt: Date.now(),
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#16161b] border border-[#2e2e36] rounded-2xl p-4 sm:p-5 shadow-2xl text-white max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#2a2a30]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#25252d] border border-[#3f3f4a] flex items-center justify-center text-[#e5c058]">
                <Tag className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {initialProduct ? 'تعديل السلعة والمخزون' : 'إضافة سلعة ومخزون جديد'}
              </h2>
            </div>
            <button
              id="close-product-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#25252d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-[#d4d4d8] mb-1">
                اسم السلعة / الخدمة <span className="text-[#e5c058]">*</span>
              </label>
              <input
                id="product-name-input"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اكتب اسم المنتج (مثال: قميص قطني، حليب، شاحن، زيت...)"
                className="w-full px-3.5 py-2.5 bg-[#202026] border border-[#33333d] rounded-xl text-white placeholder-[#71717a] text-xs sm:text-sm focus:outline-none focus:border-[#e5c058] focus:ring-1 focus:ring-[#e5c058] transition-colors"
              />
            </div>

            {/* Price & Cost Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Cost Price */}
              <div className="bg-[#1b1b23] border border-[#2d2d38] rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#a1a1aa] flex items-center gap-1">
                    <Coins className="w-3 h-3 text-[#a1a1aa]" />
                    <span>سعر الشراء (التكلفة)</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="product-cost-input"
                    type="number"
                    step="any"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-2 bg-[#141419] border border-[#383844] rounded-lg text-white font-mono text-base font-bold placeholder-[#555] focus:outline-none focus:border-[#e5c058] text-right"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#8e8e93] font-bold">
                    {currency}
                  </span>
                </div>
                <span className="text-[10px] text-[#71717a] mt-1 block">سعر الجملة</span>
              </div>

              {/* Selling Price */}
              <div className="bg-[#1f1d18] border border-[#e5c058]/40 rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#f3d57e] flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#e5c058]" />
                    <span>سعر البيع للزبون</span>
                  </label>
                  <span className="text-[10px] text-[#e5c058]">*</span>
                </div>
                <div className="relative">
                  <input
                    id="product-price-input"
                    type="number"
                    step="any"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-2 bg-[#141419] border border-[#e5c058]/80 rounded-lg text-[#f3d57e] font-mono text-base font-black placeholder-[#555] focus:outline-none focus:border-[#e5c058] text-right"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#e5c058] font-bold">
                    {currency}
                  </span>
                </div>
                <span className="text-[10px] text-[#a1a1aa] mt-1 block">سعر إعادة البيع</span>
              </div>
            </div>

            {/* Dynamic Profit Calculation Card */}
            {(numericPrice > 0 || numericCost > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isLoss
                    ? 'bg-red-950/30 border-red-800/40 text-red-200'
                    : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isLoss ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <span className="text-[11px] text-[#a1a1aa] block">
                      {isLoss ? 'خسارة في القطعة:' : 'الربح الصافي في كل قطعة:'}
                    </span>
                    <span className="text-sm font-black font-mono">
                      {isLoss ? '-' : '+'}
                      {formatPrice(Math.abs(profit))} {currency}
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-[10px] text-[#a1a1aa] block">هامش الربح</span>
                  <span
                    className={`font-bold text-xs ${
                      isLoss ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {marginPercent.toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            )}

            {/* Stock Quantity Section (Automated Decrement on Sales) */}
            <div className="bg-[#181820] border border-[#2f2f3d] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-[#e5c058]" />
                  <span>كمية المخزون المتاحة حالياً</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  ينقص تلقائياً عند كل بيع
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="product-stock-input"
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#131317] border border-[#393946] rounded-lg text-white font-mono text-base font-bold text-center focus:outline-none focus:border-[#e5c058]"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#a1a1aa]">
                    قطعة
                  </span>
                </div>

                {/* Quick Add Presets */}
                <div className="flex items-center gap-1">
                  {[5, 10, 20, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAddStock(amt)}
                      className="px-2 py-1.5 rounded-lg bg-[#252530] hover:bg-[#323242] border border-[#3e3e50] text-[#f3d57e] text-xs font-mono font-semibold transition-colors flex items-center gap-0.5"
                      title={`زيادة +${amt} للمخزون`}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{amt}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-[#71717a] mt-1.5">
                عند إتمام أي طلب بيع كاشير، سيتم خصم العدد المباع مباشرة من هذا الرصيد.
              </p>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-[#d4d4d8] mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#a1a1aa]" />
                <span>القسم أو النشاط التجاري</span>
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {COMMON_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2 py-0.5 rounded-lg text-xs transition-colors ${
                      category === cat
                        ? 'bg-[#e5c058]/20 border border-[#e5c058] text-[#f3d57e] font-semibold'
                        : 'bg-[#22222a] border border-[#33333d] text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                id="product-category-input"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="أو اكتب نشاط / قسم متجرك الخاص..."
                className="w-full px-3 py-1.5 bg-[#202026] border border-[#33333d] rounded-xl text-white placeholder-[#71717a] text-xs focus:outline-none focus:border-[#e5c058] transition-colors"
              />
            </div>

            {/* Barcode / Reference with Scan Trigger */}
            <div>
              <label className="block text-xs font-semibold text-[#d4d4d8] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-[#a1a1aa]" />
                  <span>كود السلعة / الباركود (اختياري)</span>
                </span>
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="text-[11px] text-[#e5c058] hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    <span>مسح بالكاميرا</span>
                  </button>
                )}
              </label>
              <div className="relative flex items-center">
                <input
                  id="product-barcode-input"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="مثال: 6131001 أو رمز القطعة..."
                  className="w-full px-3 py-2 bg-[#202026] border border-[#33333d] rounded-xl text-white placeholder-[#71717a] text-xs focus:outline-none focus:border-[#e5c058] transition-colors font-mono"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <motion.button
                id="save-product-btn"
                type="submit"
                whileTap={{ scale: 0.96 }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#e5c058] hover:bg-[#d4af37] text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-colors"
              >
                <Check className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
                <span>{initialProduct ? 'حفظ التعديلات' : 'إضافة السلعة للمتجر'}</span>
              </motion.button>
              <motion.button
                id="cancel-product-btn"
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-[#22222a] hover:bg-[#2b2b34] text-[#d4d4d8] border border-[#33333d] text-xs sm:text-sm font-semibold transition-colors"
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
