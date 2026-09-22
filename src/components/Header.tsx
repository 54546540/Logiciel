import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Package, Receipt, Store } from 'lucide-react';

interface HeaderProps {
  activeTab: 'cashier' | 'products' | 'sales';
  onTabChange: (tab: 'cashier' | 'products' | 'sales') => void;
  cartCount: number;
  storeName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  cartCount,
  storeName,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#121216]/95 backdrop-blur-md border-b border-[#2a2a30] px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Store Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f3d57e] to-[#c99e32] flex items-center justify-center text-black shadow-md shadow-amber-500/10 font-bold">
            <Store className="w-5 h-5 text-neutral-950" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide leading-tight">
              {storeName || 'كاشير المتجر'}
            </h1>
            <p className="text-xs text-[#a1a1aa] leading-none mt-0.5">
              نظام نقاط البيع السريع
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-[#1a1a20] p-1 rounded-xl border border-[#2e2e36]">
          <motion.button
            id="tab-cashier"
            whileTap={{ scale: 0.94 }}
            onClick={() => onTabChange('cashier')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
              activeTab === 'cashier'
                ? 'text-neutral-950 bg-[#e5c058] shadow-sm'
                : 'text-[#d4d4d8] hover:text-white hover:bg-[#25252d]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>الكاشير</span>
            {cartCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'cashier'
                    ? 'bg-neutral-950 text-[#f3d57e]'
                    : 'bg-[#e5c058] text-neutral-950'
                }`}
              >
                {cartCount}
              </span>
            )}
          </motion.button>

          <motion.button
            id="tab-products"
            whileTap={{ scale: 0.94 }}
            onClick={() => onTabChange('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
              activeTab === 'products'
                ? 'text-neutral-950 bg-[#e5c058] shadow-sm'
                : 'text-[#d4d4d8] hover:text-white hover:bg-[#25252d]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>المنتجات والأسعار</span>
          </motion.button>

          <motion.button
            id="tab-sales"
            whileTap={{ scale: 0.94 }}
            onClick={() => onTabChange('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
              activeTab === 'sales'
                ? 'text-neutral-950 bg-[#e5c058] shadow-sm'
                : 'text-[#d4d4d8] hover:text-white hover:bg-[#25252d]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>الفواتير</span>
          </motion.button>
        </nav>
      </div>
    </header>
  );
};
