import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Barcode,
  Tag,
  Package,
  Check,
  X,
  TrendingUp,
  Coins,
  Boxes,
  AlertTriangle,
} from 'lucide-react';
import { Product, formatPrice, calculateItemProfit, getStockStatus } from '../types';

interface ProductsTabProps {
  products: Product[];
  currency: string;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdatePrice: (productId: string, newPrice: number) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  currency,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdatePrice,
  onUpdateStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState<string>('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [inlineStockValue, setInlineStockValue] = useState<string>('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['الكل', ...Array.from(cats)];
  }, [products]);

  // Overall stock analytics
  const stockStats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter((p) => (p.stock ?? 0) <= 0).length;
    const lowStock = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;
    const inStock = products.filter((p) => (p.stock ?? 0) > 5).length;
    return { total, outOfStock, lowStock, inStock };
  }, [products]);

  // Filtered
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query));

      const matchCat =
        selectedCategory === 'الكل' || p.category === selectedCategory;

      const currentStock = p.stock !== undefined ? p.stock : 20;
      let matchStock = true;
      if (stockFilter === 'out_of_stock') {
        matchStock = currentStock <= 0;
      } else if (stockFilter === 'low_stock') {
        matchStock = currentStock > 0 && currentStock <= 5;
      } else if (stockFilter === 'in_stock') {
        matchStock = currentStock > 5;
      }

      return matchSearch && matchCat && matchStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const handleStartInlineEdit = (product: Product) => {
    setInlineEditingId(product.id);
    setInlinePriceValue(product.price.toString());
  };

  const handleSaveInlineEdit = (productId: string) => {
    const newPrice = parseFloat(inlinePriceValue);
    if (!isNaN(newPrice) && newPrice >= 0) {
      onUpdatePrice(productId, newPrice);
    }
    setInlineEditingId(null);
  };

  const handleStartStockEdit = (product: Product) => {
    setEditingStockId(product.id);
    setInlineStockValue((product.stock ?? 0).toString());
  };

  const handleSaveStockEdit = (productId: string) => {
    const newStock = parseInt(inlineStockValue, 10);
    if (!isNaN(newStock) && newStock >= 0) {
      onUpdateStock(productId, newStock);
    }
    setEditingStockId(null);
  };

  const handleQuickAddStock = (productId: string, currentStock: number, addAmount: number) => {
    const newStock = Math.max(0, currentStock + addAmount);
    onUpdateStock(productId, newStock);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 pt-3 pb-20 space-y-3.5">
      {/* Search & Add Action Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id="search-products-list-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، الباركود أو القسم..."
            className="w-full pl-9 pr-10 py-3 bg-[#18181f] border border-[#2e2e38] rounded-xl text-white placeholder-[#71717a] text-sm focus:outline-none focus:border-[#e5c058] transition-colors"
          />
          <Search className="w-5 h-5 text-[#a1a1aa] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[#71717a] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <motion.button
          id="add-new-product-main-btn"
          whileTap={{ scale: 0.96 }}
          onClick={onAddProduct}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#e5c058] hover:bg-[#d4af37] text-neutral-950 font-bold text-xs sm:text-sm shrink-0 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>إضافة سلعة ومخزون</span>
        </motion.button>
      </div>

      {/* Stock Overview Dashboard Chips */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setStockFilter('all')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            stockFilter === 'all'
              ? 'bg-[#22222d] border-[#e5c058] text-white shadow-sm'
              : 'bg-[#15151b] border-[#292934] text-[#a1a1aa] hover:text-white'
          }`}
        >
          <span className="text-[10px] block font-semibold">كل السلع</span>
          <span className="text-base font-black font-mono text-white">{stockStats.total}</span>
        </button>

        <button
          onClick={() => setStockFilter('in_stock')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            stockFilter === 'in_stock'
              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
              : 'bg-[#15151b] border-[#292934] text-[#a1a1aa] hover:text-white'
          }`}
        >
          <span className="text-[10px] text-emerald-400 block font-semibold">متوفر بكثرة</span>
          <span className="text-base font-black font-mono text-emerald-400">
            {stockStats.inStock}
          </span>
        </button>

        <button
          onClick={() => setStockFilter('low_stock')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            stockFilter === 'low_stock'
              ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
              : 'bg-[#15151b] border-[#292934] text-[#a1a1aa] hover:text-white'
          }`}
        >
          <span className="text-[10px] text-amber-400 block font-semibold">مخزون منخفض (≤5)</span>
          <span className="text-base font-black font-mono text-amber-400">
            {stockStats.lowStock}
          </span>
        </button>

        <button
          onClick={() => setStockFilter('out_of_stock')}
          className={`p-2.5 rounded-xl border text-center transition-all ${
            stockFilter === 'out_of_stock'
              ? 'bg-rose-950/40 border-rose-500 text-white shadow-sm'
              : 'bg-[#15151b] border-[#292934] text-[#a1a1aa] hover:text-white'
          }`}
        >
          <span className="text-[10px] text-rose-400 block font-semibold">نفذ المخزون</span>
          <span className="text-base font-black font-mono text-rose-400">
            {stockStats.outOfStock}
          </span>
        </button>
      </div>

      {/* Category Badges Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#e5c058] text-neutral-950 font-bold shadow-sm'
                : 'bg-[#18181f] text-[#a1a1aa] border border-[#282830] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Stats Bar */}
      <div className="flex items-center justify-between text-xs text-[#a1a1aa] px-1">
        <span>
          السلع المعروضة: <strong className="text-white font-mono">{filteredProducts.length}</strong>
        </span>
        <span className="text-[11px] text-[#e5c058]">
          ينقص المخزون أوتوماتيكياً عند كل بيع • يمكنك زيادة الرصيد بزر واحد
        </span>
      </div>

      {/* Products List */}
      <div className="bg-[#141419] border border-[#26262e] rounded-2xl overflow-hidden divide-y divide-[#22222a]">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center p-4">
            <Package className="w-10 h-10 text-[#383844] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#d4d4d8]">لا توجد منتجات مطابقة لهذا الفلتر</p>
            <p className="text-xs text-[#71717a] mt-1 mb-3">
              جرب تغيير خيارات البحث أو تصفية المخزون
            </p>
            <button
              onClick={onAddProduct}
              className="px-4 py-2 rounded-xl bg-[#e5c058] text-neutral-950 font-bold text-xs"
            >
              إضافة سلعة الآن
            </button>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isInlineEditing = inlineEditingId === product.id;
            const isEditingStock = editingStockId === product.id;
            const cost =
              product.costPrice !== undefined
                ? product.costPrice
                : Math.round(product.price * 0.7);
            const { profit, marginPercent } = calculateItemProfit(product.price, cost);
            const currentStock = product.stock !== undefined ? product.stock : 20;
            const stockInfo = getStockStatus(currentStock);

            return (
              <div
                key={product.id}
                className="p-3.5 hover:bg-[#181820] transition-colors grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
              >
                {/* Product Name & Category */}
                <div className="sm:col-span-4 flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#1f1f27] border border-[#2f2f3c] flex items-center justify-center text-[#e5c058] shrink-0 mt-0.5">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#22222b] text-[#a1a1aa] border border-[#2f2f3a]">
                        {product.category || 'عام'}
                      </span>
                      {product.barcode && (
                        <span className="text-[11px] font-mono text-[#71717a] flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-[#a1a1aa]" />
                          {product.barcode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Controls (Current Stock & Restock Quick Buttons) */}
                <div className="sm:col-span-3 flex flex-col items-start sm:items-center justify-center bg-[#17171f] sm:bg-transparent p-2 sm:p-0 rounded-xl border border-[#262633] sm:border-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Boxes className="w-3.5 h-3.5 text-[#e5c058]" />
                    <span className="text-[10px] text-[#a1a1aa] font-semibold">المخزون الحالي:</span>
                  </div>

                  {isEditingStock ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        autoFocus
                        value={inlineStockValue}
                        onChange={(e) => setInlineStockValue(e.target.value)}
                        className="w-16 px-1.5 py-0.5 bg-[#202028] border border-[#e5c058] rounded text-xs font-mono font-bold text-center text-white"
                      />
                      <button
                        onClick={() => handleSaveStockEdit(product.id)}
                        className="p-1 bg-[#e5c058] text-neutral-950 rounded font-bold"
                        title="حفظ الرصيد"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => setEditingStockId(null)}
                        className="p-1 bg-[#2b2b34] text-[#a1a1aa] rounded"
                        title="إلغاء"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartStockEdit(product)}
                        title="انقر لتعديل كمية المخزون يدوياً"
                        className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold border transition-transform hover:scale-105 ${stockInfo.badgeClass}`}
                      >
                        {stockInfo.label}
                      </button>

                      {/* Quick Restock Buttons (+5 / +10) */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickAddStock(product.id, currentStock, 5)}
                          className="px-1.5 py-0.5 rounded bg-[#22222d] hover:bg-[#2e2e3d] text-[#e5c058] text-[11px] font-mono font-bold border border-[#373748]"
                          title="إضافة 5 قطع للمخزون"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleQuickAddStock(product.id, currentStock, 10)}
                          className="px-1.5 py-0.5 rounded bg-[#22222d] hover:bg-[#2e2e3d] text-[#e5c058] text-[11px] font-mono font-bold border border-[#373748]"
                          title="إضافة 10 قطع للمخزون"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing & Profit Columns */}
                <div className="sm:col-span-3 flex items-center justify-between sm:justify-around bg-[#181820] sm:bg-transparent p-2 sm:p-0 rounded-xl border border-[#25252e] sm:border-0">
                  {/* Selling Price */}
                  <div className="text-center">
                    <span className="text-[10px] text-[#e5c058] block font-bold">
                      سعر البيع:
                    </span>
                    {isInlineEditing ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          autoFocus
                          value={inlinePriceValue}
                          onChange={(e) => setInlinePriceValue(e.target.value)}
                          className="w-20 px-1.5 py-0.5 bg-[#23232c] border border-[#e5c058] rounded text-xs font-mono font-bold text-[#f3d57e] text-center focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveInlineEdit(product.id)}
                          className="p-1 bg-[#e5c058] text-neutral-950 rounded font-bold"
                          title="حفظ"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>
                        <button
                          onClick={() => setInlineEditingId(null)}
                          className="p-1 bg-[#2b2b34] text-[#a1a1aa] rounded"
                          title="إلغاء"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartInlineEdit(product)}
                        title="انقر لتعديل سعر البيع مباشرة"
                        className="text-sm font-mono font-black text-[#f3d57e] hover:underline flex items-center gap-1 mx-auto"
                      >
                        <span>{formatPrice(product.price)} {currency}</span>
                        <Edit2 className="w-3 h-3 text-[#a1a1aa]" />
                      </button>
                    )}
                  </div>

                  {/* Profit per unit */}
                  <div className="text-left font-mono">
                    <span className="text-[10px] text-emerald-400 block font-bold flex items-center gap-0.5 justify-end">
                      <TrendingUp className="w-2.5 h-2.5" />
                      <span>الربح في القطعة:</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-300">
                      +{formatPrice(profit)} {currency}
                    </span>
                    <span className="text-[9px] text-emerald-400/80 block">
                      ({marginPercent.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="sm:col-span-2 flex items-center justify-end gap-1.5 pt-1 sm:pt-0">
                  <button
                    onClick={() => onEditProduct(product)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1f1f27] hover:bg-[#282833] border border-[#333342] text-[#d4d4d8] hover:text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#e5c058]" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => setProductToDelete(product)}
                    className="p-1.5 text-[#71717a] hover:text-red-400 hover:bg-[#251515] rounded-lg transition-colors"
                    title="حذف السلعة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#16161c] border border-[#2e2e38] rounded-2xl p-5 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-2">تأكيد حذف السلعة</h3>
            <p className="text-xs text-[#a1a1aa] mb-4">
              هل أنت متأكد من حذف <strong className="text-white">"{productToDelete.name}"</strong> من قائمة المنتجات؟
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-[#22222a] border border-[#33333d] text-[#d4d4d8] text-xs font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
