import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): Promise<void>;
  increment(id: string): Promise<void>;
  decrement(id: string): Promise<void>;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const prs = await AsyncStorage.getItem('@GoMarketplace:products');
      if (prs) setProducts(JSON.parse(prs));
    }

    loadProducts();
  }, [setProducts]);

  const increment = useCallback(
    async id => {
      const produtoIndex = products.findIndex(pr => pr.id === id);
      if (produtoIndex < 0) return;
      products[produtoIndex].quantity += 1;
      setProducts([...products]);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify([...products]),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const produtoIndex = products.findIndex(pr => pr.id === id);
      if (produtoIndex < 0) return;
      products[produtoIndex].quantity -= 1;
      if (products[produtoIndex].quantity === 0) {
        const produtosDelete = products.filter(pr => pr.id !== id);
        setProducts([...produtosDelete]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...produtosDelete]),
        );
      } else {
        setProducts([...products]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...products]),
        );
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const produtoIndex = products.findIndex(pr => pr.id === product.id);
      if (produtoIndex > -1) {
        await increment(product.id);
        return;
      }
      const newProduct = {
        ...product,
        quantity: 1,
      };
      setProducts([...products, newProduct]);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify([...products, newProduct]),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
