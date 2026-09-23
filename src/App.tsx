import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { CashierTab } from './components/CashierTab';
import { ProductsTab } from './components/ProductsTab';
import { SalesTab } from './components/SalesTab';
import { ProductFormModal } from './components/ProductFormModal';
import { QuickPriceModal } from './components/QuickPriceModal';
import { CheckoutModal } from './components/CheckoutModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { Product, CartItem, SaleTransaction } from './types';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredSales,
  saveStoredSales,
  getStoreConfig,
} from './utils/storage';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cashier' | 'products' | 'sales'>('cashier');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [storeConfig] = useState(getStoreConfig());

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prefilledBarcode, setPrefilledBarcode] = useState<string>('');

  const [isQuickPriceModalOpen, setIsQuickPriceModalOpen] = useState(false);
  const [quickPriceProduct, setQuickPriceProduct] = useState<Product | null>(null);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  // Quick toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'warning'>('info');

  // Initialize data
  useEffect(() => {
    const loadedProducts = getStoredProducts();
    const loadedSales = getStoredSales();
    setProducts(loadedProducts);
    setSales(loadedSales);
  }, []);

  // Save products when modified
  const updateProductsState = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
  };

  // Show a temporary banner toast
  const showToast = (msg: string, type: 'info' | 'warning' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    const currentStock = product.stock !== undefined ? product.stock : 20;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    if (currentStock <= 0) {
      showToast(`تنبيه: مخزون "${product.name}" منتهي (0 قطعة)`, 'warning');
    } else if (currentStock <= 3) {
      showToast(`مخزون منخفض: متبقي ${currentStock} فقط من "${product.name}"`, 'warning');
    } else {
      showToast(`تمت إضافة "${product.name}" إلى السلة`);
    }
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleUpdateCartItemPrice = (productId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, customPrice: newPrice } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Product CRUD
  const handleSaveProduct = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) {
      // Editing existing product
      const updated = products.map((p) =>
        p.id === productData.id ? (productData as Product) : p
      );
      updateProductsState(updated);

      // Also update in cart if present
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productData.id
            ? {
                ...item,
                product: productData as Product,
                customPrice: undefined,
              }
            : item
        )
      );
      showToast(`تم تحديث بيانات "${productData.name}" والمخزون`);
    } else {
      // Adding new product
      const newProd: Product = {
        ...productData,
        id: 'p_' + Date.now().toString().slice(-6),
        updatedAt: Date.now(),
      };
      const updated = [newProd, ...products];
      updateProductsState(updated);
      showToast(`تمت إضافة "${newProd.name}" برصيد ${newProd.stock ?? 0} قطعة للمخزون`);
    }
    setEditingProduct(null);
    setPrefilledBarcode('');
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    updateProductsState(updated);
    handleRemoveFromCart(productId);
    showToast('تم حذف السلعة من المتجر');
  };

  // Dedicated Stock Updater (from ProductsTab)
  const handleUpdateStock = (productId: string, newStock: number) => {
    const target = products.find((p) => p.id === productId);
    const updated = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            stock: Math.max(0, newStock),
            updatedAt: Date.now(),
          }
        : p
    );
    updateProductsState(updated);

    // Update cart product snapshot as well
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              product: {
                ...item.product,
                stock: Math.max(0, newStock),
              },
            }
          : item
      )
    );

    showToast(`تم تحديث مخزون "${target?.name || ''}" إلى ${newStock} قطعة`);
  };

  // Price & Cost & Stock Updater (from QuickPriceModal & inline edits)
  const handleUpdatePrice = (
    productId: string,
    newPrice: number,
    newCostPrice?: number,
    newStock?: number
  ) => {
    const updated = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            price: newPrice,
            costPrice: newCostPrice !== undefined ? newCostPrice : p.costPrice,
            stock: newStock !== undefined ? Math.max(0, newStock) : p.stock,
            updatedAt: Date.now(),
          }
        : p
    );
    updateProductsState(updated);

    // Also update product reference in cart
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              product: {
                ...item.product,
                price: newPrice,
                costPrice:
                  newCostPrice !== undefined ? newCostPrice : item.product.costPrice,
                stock: newStock !== undefined ? Math.max(0, newStock) : item.product.stock,
              },
              customPrice: undefined,
            }
          : item
      )
    );
    showToast('تم حفظ التعديلات بنجاح');
  };

  // Checkout & Automated Stock Decrement
  const handleCompleteSale = (newSale: SaleTransaction) => {
    // 1. Decrement stock for all sold items automatically
    const updatedProducts = products.map((prod) => {
      const soldItem = newSale.items.find((item) => item.product.id === prod.id);
      if (soldItem) {
        const currentStock = prod.stock !== undefined ? prod.stock : 20;
        const newStock = Math.max(0, currentStock - soldItem.quantity);
        return {
          ...prod,
          stock: newStock,
          updatedAt: Date.now(),
        };
      }
      return prod;
    });

    updateProductsState(updatedProducts);

    // 2. Persist sales history
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    saveStoredSales(updatedSales);
    setCart([]);

    // Check for any newly depleted stock to alert user
    const depleted = updatedProducts.filter((p) => {
      const sold = newSale.items.some((it) => it.product.id === p.id);
      return sold && (p.stock ?? 0) <= 0;
    });

    if (depleted.length > 0) {
      showToast(`تم البيع • تنبيه: نفذ مخزون "${depleted[0].name}"`, 'warning');
    } else {
      showToast('تمت عملية البيع بنجاح وخصم المخزون أوتوماتيكياً');
    }
  };

  // Calculate cart total for checkout
  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.customPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // Hardware Barcode Scanner (Douchette) Global Detection
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const scanned = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = '';

        if (scanned.length >= 3) {
          const match = products.find(
            (p) =>
              (p.barcode && p.barcode.toLowerCase() === scanned.toLowerCase()) ||
              p.id.toLowerCase() === scanned.toLowerCase()
          );

          if (match) {
            handleAddToCart(match);
            e.preventDefault();
          } else if (!isInput) {
            showToast(`كود الباركود [${scanned}] غير مسجل`, 'warning');
          }
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (elapsed > 70) {
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [products]);

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-[#f4f4f5] flex flex-col font-sans select-none">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        storeName={storeConfig.name}
      />

      {/* Floating Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 backdrop-blur-md border ${
              toastType === 'warning'
                ? 'bg-[#241717] border-rose-500/80 text-rose-300'
                : 'bg-[#1e1d16] border-[#e5c058]/80 text-[#f3d57e]'
            }`}
          >
            {toastType === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#e5c058]" />
            )}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area with Page Transitions */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'cashier' && (
            <motion.div
              key="cashier"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <CashierTab
                products={products}
                cart={cart}
                currency={storeConfig.currency}
                onAddToCart={handleAddToCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onUpdateCartItemPrice={handleUpdateCartItemPrice}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onOpenQuickPriceEdit={(p) => {
                  setQuickPriceProduct(p);
                  setIsQuickPriceModalOpen(true);
                }}
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setPrefilledBarcode('');
                  setIsProductModalOpen(true);
                }}
                onOpenScanner={() => setIsScannerModalOpen(true)}
                onOpenCheckout={() => setIsCheckoutModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <ProductsTab
                products={products}
                currency={storeConfig.currency}
                onAddProduct={() => {
                  setEditingProduct(null);
                  setPrefilledBarcode('');
                  setIsProductModalOpen(true);
                }}
                onEditProduct={(p) => {
                  setEditingProduct(p);
                  setPrefilledBarcode('');
                  setIsProductModalOpen(true);
                }}
                onDeleteProduct={handleDeleteProduct}
                onUpdatePrice={(id, price) => handleUpdatePrice(id, price)}
                onUpdateStock={handleUpdateStock}
              />
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <SalesTab
                sales={sales}
                currency={storeConfig.currency}
                storeName={storeConfig.name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
          setPrefilledBarcode('');
        }}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
        initialBarcode={prefilledBarcode}
        currency={storeConfig.currency}
        onOpenScanner={() => {
          setIsProductModalOpen(false);
          setIsScannerModalOpen(true);
        }}
      />

      {/* Quick Price & Stock Editor Modal */}
      <QuickPriceModal
        isOpen={isQuickPriceModalOpen}
        onClose={() => {
          setIsQuickPriceModalOpen(false);
          setQuickPriceProduct(null);
        }}
        product={quickPriceProduct}
        currency={storeConfig.currency}
        onUpdatePrice={handleUpdatePrice}
      />

      {/* Checkout and Receipt Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cart}
        subtotal={cartSubtotal}
        currency={storeConfig.currency}
        storeName={storeConfig.name}
        onCompleteSale={handleCompleteSale}
      />

      {/* Camera & Douchette Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        products={products}
        onProductScanned={(p) => {
          handleAddToCart(p);
        }}
        onAddNewWithBarcode={(code) => {
          setPrefilledBarcode(code);
          setEditingProduct(null);
          setIsProductModalOpen(true);
        }}
        currency={storeConfig.currency}
      />
    </div>
  );
};
