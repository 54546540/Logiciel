import { Product, SaleTransaction } from '../types';
import { INITIAL_PRODUCTS, DEFAULT_CURRENCY } from '../data/initialProducts';

const PRODUCTS_KEY = 'cashier_products_dz_v4';
const LEGACY_PRODUCTS_KEY = 'cashier_products_dz_v3';
const SALES_KEY = 'cashier_sales_dz_v4';
const LEGACY_SALES_KEY = 'cashier_sales_dz_v3';
const STORE_NAME_KEY = 'cashier_store_name_dz_v2';
const CURRENCY_KEY = 'cashier_currency_dz_v2';

export function getStoredProducts(): Product[] {
  try {
    let data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      data = localStorage.getItem(LEGACY_PRODUCTS_KEY);
    }

    if (!data) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }

    const parsed: Product[] = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_PRODUCTS;
    }

    // Ensure all products have costPrice and stock
    const initialMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
    const migrated = parsed.map((p) => {
      let cost = p.costPrice;
      if (cost === undefined || cost === null || isNaN(cost)) {
        const foundInitial = initialMap.get(p.id);
        if (foundInitial && foundInitial.costPrice !== undefined) {
          cost = foundInitial.costPrice;
        } else {
          cost = Math.round(p.price * 0.7);
        }
      }

      let stock = p.stock;
      if (stock === undefined || stock === null || isNaN(stock)) {
        const foundInitial = initialMap.get(p.id);
        stock = foundInitial?.stock !== undefined ? foundInitial.stock : 25;
      }

      return {
        ...p,
        costPrice: cost,
        stock: Math.max(0, Math.floor(stock)),
      };
    });

    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(migrated));
    return migrated;
  } catch (err) {
    console.error('Failed to load products from storage:', err);
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save products:', err);
  }
}

export function getStoredSales(): SaleTransaction[] {
  try {
    let data = localStorage.getItem(SALES_KEY);
    if (!data) {
      data = localStorage.getItem(LEGACY_SALES_KEY);
    }
    if (!data) return [];
    const parsed: SaleTransaction[] = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // Ensure totalCost and totalProfit are populated
    const migrated = parsed.map((sale) => {
      let totalCost = sale.totalCost;
      let totalProfit = sale.totalProfit;

      if (totalCost === undefined || isNaN(totalCost)) {
        totalCost = sale.items.reduce((acc, it) => {
          const cost = it.customCostPrice ?? it.product.costPrice ?? Math.round(it.product.price * 0.7);
          return acc + cost * it.quantity;
        }, 0);
      }

      if (totalProfit === undefined || isNaN(totalProfit)) {
        totalProfit = Math.max(0, sale.total - totalCost);
      }

      return {
        ...sale,
        totalCost,
        totalProfit,
      };
    });

    return migrated;
  } catch (err) {
    console.error('Failed to load sales:', err);
    return [];
  }
}

export function saveStoredSales(sales: SaleTransaction[]): void {
  try {
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  } catch (err) {
    console.error('Failed to save sales:', err);
  }
}

export function getStoreConfig(): { name: string; currency: string } {
  try {
    const name = localStorage.getItem(STORE_NAME_KEY) || 'نظام كاشير المتجر';
    const currency = localStorage.getItem(CURRENCY_KEY) || DEFAULT_CURRENCY;
    return { name, currency };
  } catch {
    return { name: 'نظام كاشير المتجر', currency: DEFAULT_CURRENCY };
  }
}

export function saveStoreConfig(name: string, currency: string): void {
  try {
    localStorage.setItem(STORE_NAME_KEY, name);
    localStorage.setItem(CURRENCY_KEY, currency);
  } catch (err) {
    console.error('Failed to save store config:', err);
  }
}
