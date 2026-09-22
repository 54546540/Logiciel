export interface Product {
  id: string;
  name: string;
  price: number; // سعر البيع للزبون (إعادة البيع)
  costPrice?: number; // سعر الشراء / التكلفة الأصلية بالجملة
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
