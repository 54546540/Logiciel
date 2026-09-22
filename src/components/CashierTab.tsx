import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  PlusCircle,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Barcode,
  Camera,
  TrendingUp,
  Coins,
} from 'lucide-react';
import { Product, CartItem, formatPrice, calculateItemProfit } from '../types';

interface CashierTabProps {
  products: Product[];
  cart: CartItem[];
  currency: string;
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onUpdateCartItemPrice: (productId: string, customPrice: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onOpenAddProduct: () => void;
  onOpenQuickPriceEdit: (product: Product) => void;
  onOpenCheckout: () => void;
  onOpenScanner: () => void;
}

export const CashierTab: React.FC<CashierTabProps> = ({
  products,
  cart,
  currency,
  onAddToCart,
  onUpdateCartQuantity,
  onUpdateCartItemPrice,
  onRemoveFromCart,
  onClearCart,
  onOpenAddProduct,
  onOpenQuickPriceEdit,
  onOpenCheckout,
  onOpenScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [editingCartItemPriceId, setEditingCartItemPriceId] = useState<string | null>(null);
  const [tempCartPrice, setTempCartPrice] = useState<string>('');

  // Extract all categories dynamically from the products list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['الكل', ...Array.from(set)];
  }, [products]);

  // Filter products by search query and category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));

      const matchCat =
        selectedCategory === 'الكل' || p.category === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Direct exact/first match if searching to quickly inspect price
  const searchDirectMatch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return filteredProducts.length > 0 ? filteredProducts[0] : null;
  }, [filteredProducts, searchQuery]);

  // Calculate totals and profits
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => {
    const price = item.customPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const totalCartCost = cart.reduce((sum, item) => {
    const cost =
      item.customCostPrice ??
      item.product.costPrice ??
      Math.round(item.product.price * 0.7);
    return sum + cost * item.quantity;
  }, 0);

  const totalCartProfit = Math.max(0, totalCartAmount - totalCartCost);
  const totalCartMargin =
    totalCartAmount > 0 ? (totalCartProfit / totalCartAmount) * 100 : 0;

  const handleSaveCartItemPrice = (productId: string) => {
    const val = parseFloat(tempCartPrice);
    if (!isNaN(val) && val >= 0) {
      onUpdateCartItemPrice(productId, val);
    }
    setEditingCartItemPriceId(null);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] pb-32 md:pb-12 max-w-4xl mx-auto px-3.5 pt-3">
      {/* Top Search, Scanner Trigger & Fast Action Bar */}
      <div className="space-y-2.5 mb-3">
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <input
              id="search-product-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اسم السلعة، الكود أو السعر..."
              className="w-full pl-9 pr-10 py-3 bg-[#18181f] border border-[#2e2e38] rounded-xl text-white placeholder-[#71717a] text-xs sm:text-sm focus:outline-none focus:border-[#e5c058] focus:ring-1 focus:ring-[#e5c058] transition-colors"
            />
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#a1a1aa] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[#71717a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Barcode Scanner Button (Camera & Douchette) */}
          <motion.button
            id="open-barcode-scanner-btn"
            whileTap={{ scale: 0.95 }}
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-3 rounded-xl bg-[#1e1d17] border border-[#e5c058]/60 text-[#f3d57e] hover:bg-[#28251c] font-bold text-xs shrink-0 transition-colors shadow-sm"
            title="مسح كود السلعة عبر الكاميرا أو الدوشات"
          >
            <Barcode className="w-4 h-4 text-[#e5c058]" />
            <span className="hidden sm:inline">مسح باركود</span>
            <span className="sm:hidden">سكان</span>
          </motion.button>

          {/* Add product button */}
          <motion.button
            id="add-product-quick-btn"
            whileTap={{ scale: 0.95 }}
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-3 rounded-xl bg-[#22222a] border border-[#393944] text-[#f3d57e] hover:border-[#e5c058] font-bold text-xs shrink-0 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#e5c058]" />
            <span className="hidden sm:inline">سلعة جديدة</span>
          </motion.button>
        </div>

        {/* Quick Price Check Banner (When searching) */}
        {searchQuery && searchDirectMatch && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#1f1d14] to-[#17171d] border border-[#e5c058]/50 rounded-xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#e5c058]/20 flex items-center justify-center text-[#f3d57e] shrink-0 font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-[#a1a1aa] block leading-none">
                  النتيجة الأقرب: {searchDirectMatch.category}
                </span>
                <span className="text-sm font-bold text-white leading-tight">
                  {searchDirectMatch.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                  ربح: +
                  {formatPrice(
                    searchDirectMatch.price -
                      (searchDirectMatch.costPrice ??
                        Math.round(searchDirectMatch.price * 0.7))
                  )}{' '}
                  {currency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenQuickPriceEdit(searchDirectMatch)}
                title="تعديل السعر"
                className="flex items-center gap-1 bg-[#252530] hover:bg-[#2e2e3a] border border-[#3e3e4c] text-xs px-2.5 py-1.5 rounded-lg text-[#f3d57e] font-mono font-bold transition-colors"
              >
                <span>{formatPrice(searchDirectMatch.price)} {currency}</span>
                <Edit2 className="w-3 h-3 text-[#a1a1aa]" />
              </button>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  onAddToCart(searchDirectMatch);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#e5c058] text-neutral-950 font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>إضافة</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Category Pills (Responsive horizontal scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#e5c058] text-neutral-950 font-bold shadow-sm'
                  : 'bg-[#1a1a20] text-[#a1a1aa] border border-[#2b2b34] hover:text-white hover:border-[#3a3a46]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Product Catalog Grid */}
      <div className="flex-1">
        {filteredProducts.length === 0 ? (
          <div className="py-14 text-center border border-dashed border-[#2b2b34] rounded-2xl bg-[#141418] p-6">
            <p className="text-sm font-semibold text-[#d4d4d8]">
              لا توجد سلع أو منتجات مطابقة لـ "{searchQuery}"
            </p>
            <p className="text-xs text-[#71717a] mt-1 mb-4">
              يمكنك كتابة اسم المنتج وتحديد سعر شرائه وسعر بيعه بحرية
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAddProduct}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e5c058] text-neutral-950 font-bold text-xs shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة هذا المنتج الآن</span>
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((i) => i.product.id === product.id);
              const cost =
                product.costPrice !== undefined
                  ? product.costPrice
                  : Math.round(product.price * 0.7);
              const { profit, marginPercent } = calculateItemProfit(product.price, cost);

              return (
                <motion.div
                  key={product.id}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative bg-[#17171d] hover:bg-[#1c1c23] border rounded-xl p-3 flex flex-col justify-between transition-all select-none ${
                    inCartItem
                      ? 'border-[#e5c058]/80 shadow-md shadow-amber-500/5'
                      : 'border-[#2a2a32] hover:border-[#3e3e4c]'
                  }`}
                >
                  {/* Card Header & Category */}
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] text-[#8e8e93] font-medium truncate max-w-[85px]">
                        {product.category || 'عام'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQuickPriceEdit(product);
                        }}
                        title="تعديل السعر بحرية"
                        className="opacity-70 hover:opacity-100 p-1 -m-1 text-[#a1a1aa] hover:text-[#f3d57e]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-tight min-h-[2.4rem] line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Profit Tag */}
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-emerald-400 font-semibold">
                      <TrendingUp className="w-2.5 h-2.5" />
                      <span>ربح: +{formatPrice(profit)} {currency}</span>
                    </div>
                  </div>

                  {/* Price & Add to Cart Action */}
                  <div className="mt-2.5 pt-2 border-t border-[#26262e] flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-black font-mono text-[#f3d57e]">
                        {formatPrice(product.price)}
                      </div>
                      <span className="text-[9px] text-[#71717a] font-bold block">
                        {currency}
                      </span>
                    </div>

                    {/* Add / Stepper Button */}
                    {inCartItem ? (
                      <div className="flex items-center bg-[#252530] border border-[#e5c058] rounded-lg p-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateCartQuantity(product.id, inCartItem.quantity - 1);
                          }}
                          className="w-6 h-6 flex items-center justify-center text-white hover:text-red-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-mono font-bold text-[#f3d57e]">
                          {inCartItem.quantity}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className="w-6 h-6 flex items-center justify-center text-white hover:text-[#f3d57e]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onAddToCart(product)}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#24242e] hover:bg-[#e5c058] border border-[#393946] hover:border-[#e5c058] text-[#f3d57e] hover:text-neutral-950 font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden sm:inline">إضافة</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart & Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#121217]/95 backdrop-blur-md border-t border-[#26262e] shadow-2xl">
        <div className="max-w-4xl mx-auto px-3.5 py-2.5">
          {/* Expanded Cart Drawer */}
          <AnimatePresence>
            {isCartExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pb-3 border-b border-[#26262e] mb-2.5"
              >
                <div className="flex items-center justify-between py-1 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      محتويات السلة الحالية ({totalCartCount} قطعة)
                    </span>
                    {totalCartProfit > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-mono font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>صافي الربح: +{formatPrice(totalCartProfit)} {currency}</span>
                      </span>
                    )}
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={onClearCart}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>تفريغ السلة</span>
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#71717a]">
                    السلة فارغة حالياً. انقر على أي منتج لإضافته.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#1e1e26]">
                    {cart.map((item) => {
                      const effectivePrice = item.customPrice ?? item.product.price;
                      const cost =
                        item.customCostPrice ??
                        item.product.costPrice ??
                        Math.round(item.product.price * 0.7);
                      const itemProfit = (effectivePrice - cost) * item.quantity;
                      const isEditingPrice = editingCartItemPriceId === item.product.id;

                      return (
                        <div
                          key={item.product.id}
                          className="pt-1.5 flex items-center justify-between text-xs gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-white block truncate">
                              {item.product.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isEditingPrice ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={tempCartPrice}
                                    onChange={(e) => setTempCartPrice(e.target.value)}
                                    className="w-20 px-1.5 py-0.5 bg-[#252530] border border-[#e5c058] rounded text-xs font-mono font-bold text-[#f3d57e]"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveCartItemPrice(item.product.id)}
                                    className="p-1 bg-[#e5c058] text-neutral-950 rounded text-xs"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCartItemPriceId(null)}
                                    className="p-1 bg-[#2d2d38] text-[#a1a1aa] rounded text-xs"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingCartItemPriceId(item.product.id);
                                    setTempCartPrice(effectivePrice.toString());
                                  }}
                                  className="text-[11px] font-mono text-[#f3d57e] hover:underline flex items-center gap-1"
                                  title="انقر لتعديل السعر لهذا الطلب بحرية"
                                >
                                  <span>{formatPrice(effectivePrice)} {currency}</span>
                                  <Edit2 className="w-3 h-3 text-[#a1a1aa]" />
                                </button>
                              )}
                              <span className="text-[10px] text-[#71717a] font-mono">
                                (المجموع: {formatPrice(effectivePrice * item.quantity)} {currency})
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono">
                                +{formatPrice(itemProfit)} د.ج ربح
                              </span>
                            </div>
                          </div>

                          {/* Stepper & Delete */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center bg-[#252530] border border-[#393945] rounded-lg p-0.5">
                              <button
                                onClick={() =>
                                  onUpdateCartQuantity(item.product.id, item.quantity - 1)
                                }
                                className="w-6 h-6 flex items-center justify-center text-[#d4d4d8] hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-mono font-bold text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  onUpdateCartQuantity(item.product.id, item.quantity + 1)
                                }
                                className="w-6 h-6 flex items-center justify-center text-[#d4d4d8] hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => onRemoveFromCart(item.product.id)}
                              className="p-1.5 text-[#71717a] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bar Control */}
          <div className="flex items-center justify-between gap-3">
            {/* Toggle Drawer & Total Info with Profit */}
            <button
              onClick={() => setIsCartExpanded(!isCartExpanded)}
              className="flex items-center gap-2.5 text-right p-1 rounded-xl hover:bg-[#1e1e26] transition-colors"
            >
              <div className="relative w-10 h-10 rounded-xl bg-[#22222a] border border-[#383844] flex items-center justify-center text-[#e5c058]">
                <ShoppingCart className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#e5c058] text-neutral-950 font-bold text-[10px] rounded-full flex items-center justify-center shadow-sm">
                    {totalCartCount}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#a1a1aa] font-medium">المجموع والحساب</span>
                  {isCartExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#a1a1aa]" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-[#a1a1aa]" />
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-lg font-black font-mono text-[#f3d57e]">
                    {formatPrice(totalCartAmount)}{' '}
                    <span className="text-xs font-bold text-[#d4d4d8]">{currency}</span>
                  </span>
                  {totalCartAmount > 0 && (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      (+{formatPrice(totalCartProfit)} ربح)
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Checkout Action Button */}
            <motion.button
              id="checkout-btn"
              whileTap={{ scale: 0.96 }}
              disabled={cart.length === 0}
              onClick={onOpenCheckout}
              className={`flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                cart.length > 0
                  ? 'bg-[#e5c058] hover:bg-[#d4af37] text-neutral-950 shadow-lg shadow-amber-500/10 cursor-pointer'
                  : 'bg-[#25252e] text-[#71717a] cursor-not-allowed'
              }`}
            >
              <span>دفع وحساب ({totalCartCount})</span>
              <ArrowRight className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
