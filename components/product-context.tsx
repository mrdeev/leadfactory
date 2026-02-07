"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

interface ProductContextValue {
  products: Product[];
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  refreshProducts: () => Promise<void>;
  isLoading: boolean;
}

const ProductContext = React.createContext<ProductContextValue>({
  products: [],
  selectedProduct: null,
  setSelectedProduct: () => {},
  refreshProducts: async () => {},
  isLoading: true,
});

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadProducts = React.useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      setProducts(data as Product[]);
      if (!selectedProduct) {
        const defaultProduct = data.find((p: Product) => p.is_default) || data[0];
        setSelectedProduct(defaultProduct as Product);
      }
    } else {
      const defaultProduct = await createDefaultProduct();
      if (defaultProduct) {
        setProducts([defaultProduct]);
        setSelectedProduct(defaultProduct);
      }
    }
    setIsLoading(false);
  }, [selectedProduct]);

  React.useEffect(() => {
    loadProducts();
  }, []);

  const refreshProducts = React.useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  const createDefaultProduct = async (): Promise<Product | null> => {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: "My First Product",
        is_default: true,
        description: "Your first AI sales agent product",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating default product:", error);
      return null;
    }

    return data as Product;
  };

  return (
    <ProductContext.Provider
      value={{ products, selectedProduct, setSelectedProduct, refreshProducts, isLoading }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  return React.useContext(ProductContext);
}
