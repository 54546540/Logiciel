export interface Product {
  id: string;
  name: string;
  price: number; // سعر البيع للزبون (إعادة البيع)
  costPrice?: number; // سعر الشراء / التكلفة الأصلية بالجملة
  stock?: number; // كمية المخزون المتاحة حالياً
  category?: string;
  barcode?: string;
  updatedAt?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number; // سعر بيع مخصص للطلبية إذا تم تعديله
  customCostPrice?: number;
}

export interface SaleTransaction {
  id: string;
  date: string; // ISO string with timestamp
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number; // إجمالي تكلفة السلع في العملية
  totalProfit: number; // صافي الربح = total - totalCost
  cashReceived: number;
  change: number;
  paymentMethod: 'cash' | 'card';
}

export function formatPrice(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  if (Number.isInteger(amount)) {
    return amount.toLocaleString('fr-DZ');
  }
  return amount.toLocaleString('fr-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Utility to calculate profit for a single item
export function calculateItemProfit(price: number, costPrice?: number): {
  profit: number;
  marginPercent: number;
} {
  const cost = costPrice !== undefined && !isNaN(costPrice) ? costPrice : 0;
  const profit = price - cost;
  const marginPercent = price > 0 ? (profit / price) * 100 : 0;
  return { profit, marginPercent };
}

// Stock status helper
export function getStockStatus(stock?: number): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  label: string;
  shortLabel: string;
  badgeClass: string;
} {
  if (stock === undefined || stock === null) {
    return {
      status: 'in_stock',
      label: 'متوفر',
      shortLabel: 'متوفر',
      badgeClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    };
  }
  if (stock <= 0) {
    return {
      status: 'out_of_stock',
      label: 'نفذ من المخزون',
      shortLabel: 'نفذ 0',
      badgeClass: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
    };
  }
  if (stock <= 5) {
    return {
      status: 'low_stock',
      label: `متبقي ${stock} فقط (قليل)`,
      shortLabel: `${stock} متبقي`,
      badgeClass: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
    };
  }
  return {
    status: 'in_stock',
    label: `${stock} في المخزون`,
    shortLabel: `${stock} متوفر`,
    badgeClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
  };
}
