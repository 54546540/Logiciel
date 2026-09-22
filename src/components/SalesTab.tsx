import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt,
  Calendar,
  CreditCard,
  Banknote,
  Printer,
  X,
  Eye,
  TrendingUp,
  ShoppingCart,
  Coins,
  Percent,
  Clock,
  Filter,
} from 'lucide-react';
import { SaleTransaction, formatPrice } from '../types';

interface SalesTabProps {
  sales: SaleTransaction[];
  currency: string;
  storeName: string;
}

type DateFilterType = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export const SalesTab: React.FC<SalesTabProps> = ({
  sales,
  currency,
  storeName,
}) => {
  const [selectedSale, setSelectedSale] = useState<SaleTransaction | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [customDate, setCustomDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Filter sales based on chosen date filter
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterdayObj = new Date(now);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const currentYearMonth = todayStr.slice(0, 7); // YYYY-MM

    return sales.filter((s) => {
      const saleDate = new Date(s.date);
      const saleDateStr = s.date.slice(0, 10);

      switch (dateFilter) {
        case 'today':
          return saleDateStr === todayStr;
        case 'yesterday':
          return saleDateStr === yesterdayStr;
        case 'week':
          return saleDate >= sevenDaysAgo && saleDate <= now;
        case 'month':
          return saleDateStr.startsWith(currentYearMonth);
        case 'custom':
          return saleDateStr === customDate;
        case 'all':
        default:
          return true;
      }
    });
  }, [sales, dateFilter, customDate]);

  // Financial statistics calculation for the filtered period
  const stats = useMemo(() => {
    const count = filteredSales.length;
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

    const totalCost = filteredSales.reduce((acc, s) => {
      if (s.totalCost !== undefined && !isNaN(s.totalCost)) {
        return acc + s.totalCost;
      }
      // Fallback if older sale without totalCost
      const cost = s.items.reduce((itemSum, it) => {
        const itemCost =
          it.customCostPrice ??
          it.product.costPrice ??
          Math.round(it.product.price * 0.7);
        return itemSum + itemCost * it.quantity;
      }, 0);
      return acc + cost;
    }, 0);

    const totalProfit = Math.max(0, totalRevenue - totalCost);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrder = count > 0 ? totalRevenue / count : 0;

    return {
      count,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      averageOrder,
    };
  }, [filteredSales]);

  const handlePrint = () => {
    window.print();
  };

  const formatDateDisplay = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const day = d.getDate();
      const monthNames = [
        'جانفي',
        'فيفري',
        'مارس',
        'أفريل',
        'ماي',
        'جوان',
        'جويلية',
        'أوت',
        'سبتمبر',
        'أكتوبر',
        'نوفمبر',
        'ديسمبر',
      ];
      const month = monthNames[d.getMonth()] || d.getMonth() + 1;
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return {
        dateStr: `${day} ${month} ${year}`,
        timeStr: `${hours}:${minutes}`,
      };
    } catch {
      return { dateStr: isoString.slice(0, 10), timeStr: '' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 pt-3 pb-20 space-y-4">
      {/* Date Filter Bar */}
      <div className="bg-[#16161c] border border-[#2b2b34] rounded-2xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#e5c058]" />
            <span className="text-xs font-bold text-white">تاريخ وفترة المبيعات:</span>
          </div>
          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-[#202028] border border-[#3c3c48] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#e5c058]"
            />
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'yesterday', label: 'البارحة' },
            { id: 'week', label: 'آخر 7 أيام' },
            { id: 'month', label: 'هذا الشهر' },
            { id: 'custom', label: 'تاريخ مخصص' },
            { id: 'all', label: 'جميع الأوقات' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id as DateFilterType)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all font-semibold ${
                dateFilter === f.id
                  ? 'bg-[#e5c058] text-neutral-950 shadow-sm'
                  : 'bg-[#1f1f26] text-[#a1a1aa] border border-[#2d2d38] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Metrics Cards (Calculates Sales, Costs, and Net Profits) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Revenue */}
        <div className="bg-[#16161c] border border-[#2b2b34] rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-1.5">
            <span className="text-xs font-semibold">إجمالي المبيعات</span>
            <TrendingUp className="w-4 h-4 text-[#e5c058]" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black font-mono text-[#f3d57e]">
              {formatPrice(stats.totalRevenue)}
            </div>
            <span className="text-[10px] text-[#a1a1aa] font-bold">{currency}</span>
          </div>
        </div>

        {/* Total Profit (Net Profit) */}
        <div className="bg-[#121c17] border border-emerald-800/40 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-xs font-bold">صافي الربح المحقق</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black font-mono text-emerald-300">
              +{formatPrice(stats.totalProfit)}
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-400/80 font-bold mt-0.5">
              <span>{currency}</span>
              <span>هامش {stats.profitMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Wholesale Cost */}
        <div className="bg-[#16161c] border border-[#2b2b34] rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-1.5">
            <span className="text-xs font-semibold">تكلفة الشراء الأصلية</span>
            <Coins className="w-4 h-4 text-[#a1a1aa]" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black font-mono text-[#d4d4d8]">
              {formatPrice(stats.totalCost)}
            </div>
            <span className="text-[10px] text-[#71717a] font-bold">{currency}</span>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="bg-[#16161c] border border-[#2b2b34] rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-1.5">
            <span className="text-xs font-semibold">عدد العمليات</span>
            <Receipt className="w-4 h-4 text-[#e5c058]" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black font-mono text-white">
              {stats.count}
            </div>
            <span className="text-[10px] text-[#a1a1aa] font-medium">عملية بيع</span>
          </div>
        </div>
      </div>

      {/* Transaction History Table / Cards */}
      <div className="bg-[#141419] border border-[#26262e] rounded-2xl overflow-hidden">
        <div className="p-3.5 border-b border-[#26262e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#e5c058]" />
            <h3 className="text-sm font-bold text-white">
              سجل فواتير البيع ({filteredSales.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#a1a1aa]">مرتبة حسب التاريخ والوقت</span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="py-14 text-center text-[#71717a] text-xs px-4">
            لا توجد أي مبيعات مسجلة في هذه الفترة المحددة. جرب تغيير فلتر التاريخ من الأعلى.
          </div>
        ) : (
          <div className="divide-y divide-[#22222a]">
            {filteredSales.map((sale) => {
              const { dateStr, timeStr } = formatDateDisplay(sale.date);
              const saleProfit =
                sale.totalProfit !== undefined
                  ? sale.totalProfit
                  : Math.max(
                      0,
                      sale.total -
                        sale.items.reduce((acc, it) => {
                          const cost =
                            it.customCostPrice ??
                            it.product.costPrice ??
                            Math.round(it.product.price * 0.7);
                          return acc + cost * it.quantity;
                        }, 0)
                    );

              return (
                <div
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#1a1a21] cursor-pointer transition-colors select-none"
                >
                  {/* Left Info: ID, Date, and items summary */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#202028] border border-[#32323e] flex items-center justify-center text-[#e5c058] shrink-0">
                      {sale.paymentMethod === 'cash' ? (
                        <Banknote className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-white font-mono">
                          {sale.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#24242e] text-[#a1a1aa]">
                          {sale.paymentMethod === 'cash' ? 'نقداً' : 'بطاقة CIB'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#71717a]">
                        <span className="flex items-center gap-1 text-[#a1a1aa]">
                          <Calendar className="w-3 h-3 text-[#e5c058]" />
                          <span>{dateStr}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#a1a1aa]">
                          <Clock className="w-3 h-3" />
                          <span>{timeStr}</span>
                        </span>
                        <span>•</span>
                        <span>{sale.items.reduce((s, i) => s + i.quantity, 0)} قطعة</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Info: Sale Amount & Profit Earned */}
                  <div className="text-left font-mono">
                    <div className="text-sm sm:text-base font-black text-[#f3d57e]">
                      {formatPrice(sale.total)}{' '}
                      <span className="text-[10px] font-bold text-[#d4d4d8]">{currency}</span>
                    </div>

                    <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1 mt-0.5">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{formatPrice(saleProfit)} {currency} ربح</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sale Details & Profit Modal */}
      {selectedSale && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#16161c] border border-[#2f2f38] rounded-2xl p-4 sm:p-5 shadow-2xl text-white max-h-[92vh] flex flex-col overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#292931]">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#e5c058]" />
                    <span>تفاصيل العملية #{selectedSale.id}</span>
                  </h3>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                    {formatDateDisplay(selectedSale.date).dateStr} الساعة{' '}
                    {formatDateDisplay(selectedSale.date).timeStr}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#25252d]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items Breakdown with Cost & Profit */}
              <div className="mt-3 space-y-2">
                <span className="text-xs font-semibold text-[#d4d4d8] block">
                  السلع المباعة وهامش الربح في كل صنف:
                </span>
                <div className="bg-[#111115] border border-[#26262f] rounded-xl divide-y divide-[#22222a] overflow-hidden">
                  {selectedSale.items.map((item, idx) => {
                    const price = item.customPrice ?? item.product.price;
                    const cost =
                      item.customCostPrice ??
                      item.product.costPrice ??
                      Math.round(item.product.price * 0.7);
                    const itemTotal = price * item.quantity;
                    const itemProfit = (price - cost) * item.quantity;

                    return (
                      <div
                        key={idx}
                        className="p-3 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-semibold text-white block text-sm font-sans truncate">
                            {item.product.name}
                          </span>
                          <span className="text-[11px] text-[#a1a1aa] mt-0.5 block">
                            سعر البيع: {formatPrice(price)} {currency} × {item.quantity} ={' '}
                            {formatPrice(itemTotal)} {currency}
                          </span>
                          <span className="text-[10px] text-[#71717a] block">
                            سعر الشراء: {formatPrice(cost)} {currency} للقطعة
                          </span>
                        </div>

                        <div className="text-left shrink-0">
                          <span className="text-xs font-bold text-[#f3d57e] block">
                            {formatPrice(itemTotal)} {currency}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 block mt-0.5">
                            +{formatPrice(itemProfit)} {currency} ربح
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Totals for this invoice */}
              <div className="mt-3 p-3.5 bg-[#1b1b22] border border-[#2e2e38] rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#a1a1aa]">
                  <span>إجمالي سعر الشراء (التكلفة):</span>
                  <span>
                    {formatPrice(
                      selectedSale.totalCost ??
                        selectedSale.items.reduce((acc, it) => {
                          const cost =
                            it.customCostPrice ??
                            it.product.costPrice ??
                            Math.round(it.product.price * 0.7);
                          return acc + cost * it.quantity;
                        }, 0)
                    )}{' '}
                    {currency}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-sm text-[#f3d57e] pt-1.5 border-t border-[#292934]">
                  <span>إجمالي البيع المستلم:</span>
                  <span>
                    {formatPrice(selectedSale.total)} {currency}
                  </span>
                </div>

                <div className="flex justify-between text-emerald-400 font-bold text-xs bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/40">
                  <span className="flex items-center gap-1 font-sans">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>صافي الربح المسجل:</span>
                  </span>
                  <span>
                    +
                    {formatPrice(
                      selectedSale.totalProfit ??
                        Math.max(
                          0,
                          selectedSale.total -
                            (selectedSale.totalCost ??
                              selectedSale.items.reduce((acc, it) => {
                                const cost =
                                  it.customCostPrice ??
                                  it.product.costPrice ??
                                  Math.round(it.product.price * 0.7);
                                return acc + cost * it.quantity;
                              }, 0))
                        )
                    )}{' '}
                    {currency}
                  </span>
                </div>

                {selectedSale.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between text-[#a1a1aa] pt-1">
                      <span>المدفوع نقداً:</span>
                      <span>
                        {formatPrice(selectedSale.cashReceived)} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#86efac] font-bold">
                      <span>الباقي للزبون:</span>
                      <span>
                        {formatPrice(selectedSale.change)} {currency}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 rounded-xl bg-[#25252e] hover:bg-[#2f2f3a] border border-[#3b3b47] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-[#a1a1aa]" />
                  <span>طباعة الفاتورة</span>
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="py-2.5 px-5 rounded-xl bg-[#e5c058] hover:bg-[#d4af37] text-neutral-950 text-xs font-bold transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
