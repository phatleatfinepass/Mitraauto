import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateLinePricing, normalizePricingRules, type ProductPricingRules } from '../../../utils/pricing';
import { getProductCommerceSnapshot } from '../../../utils/productCommerce';

export interface CartItem {
  id: string;
  product: any; // TireProduct or RimProduct
  quantity: number;
  price: number;
  base_price?: number;
  pricing_rules?: ProductPricingRules | null;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function resolveCartBasePrice(item: any) {
  const directBasePrice = Number(item?.base_price ?? item?.price);
  if (Number.isFinite(directBasePrice) && directBasePrice > 0) return directBasePrice;

  return getProductCommerceSnapshot(item?.product ?? item).baseUnitPriceExVatEur;
}

function resolveStockLimit(product: any) {
  const candidates = [
    product?.stock_quantity,
    product?.stock_qty,
    product?.available_quantity,
    product?.quantity,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }

  return null;
}

function clampCartQuantity(product: any, quantity: number) {
  const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
  const stockLimit = resolveStockLimit(product);
  return stockLimit ? Math.min(safeQuantity, stockLimit) : safeQuantity;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('mitra-auto-cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          const normalizedItems = parsed.map((item: any) => {
            const safeBasePrice = resolveCartBasePrice(item);
            return {
              ...item,
              price: safeBasePrice,
              base_price: safeBasePrice,
              pricing_rules: normalizePricingRules(item?.pricing_rules ?? item?.product?.pricing_rules ?? null),
            } as CartItem;
          });
          setItems(normalizedItems);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mitra-auto-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: any, quantity: number) => {
    setItems((prevItems) => {
      const requestedQuantity = clampCartQuantity(product, quantity);
      // Check if product already exists in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const safeBasePrice = resolveCartBasePrice({ ...existingItem, product });
        const nextQuantity = clampCartQuantity(product, existingItem.quantity + requestedQuantity);
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: nextQuantity,
          price: safeBasePrice,
          base_price: safeBasePrice,
          pricing_rules: normalizePricingRules(existingItem.pricing_rules ?? product.pricing_rules ?? null),
        };
        return updatedItems;
      } else {
        // Add new item to cart
        const safeBasePrice = resolveCartBasePrice(product);
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity: requestedQuantity,
          price: safeBasePrice,
          base_price: safeBasePrice,
          pricing_rules: normalizePricingRules(product.pricing_rules ?? null),
        };
        return [...prevItems, newItem];
      }
    });
    
    // Open cart drawer when item is added
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: clampCartQuantity(item.product, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const line = calculateLinePricing(
      item.base_price ?? item.price ?? 0,
      item.quantity,
      item.pricing_rules ?? null,
    );
    return sum + line.lineTotalEur;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
