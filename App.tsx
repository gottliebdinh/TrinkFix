import React, { useState, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { productData } from './data/json';
import { categories } from './data/categories';
import { Category, Product } from './types';
import HomeScreen from './screens/HomeScreen';
import ProductListScreen from './screens/ProductListScreen';
import FavoritesScreen from './screens/FavoritesScreen';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [showFavorites, setShowFavorites] = useState(false);
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);
  const [initialFilter, setInitialFilter] = useState<string | null>(null);

  // Berechne Gesamtanzahl aller Artikel mit useMemo
  const totalProducts = useMemo(() => {
    try {
      return Object.values(productData).reduce((sum, products) => {
        if (Array.isArray(products)) {
          return sum + products.length;
        }
        return sum;
      }, 0);
    } catch (error) {
      console.error('Error calculating total products:', error);
      return 0;
    }
  }, []);
  
  // Aktualisiere die Anzahl für "Alle Artikel" mit useMemo
  const updatedCategories = useMemo(() => {
    return categories.map(cat => 
      cat.id === 'all' ? { ...cat, count: totalProducts } : cat
    );
  }, [totalProducts]);

  const loadCategoryData = async (category: Category) => {
    setLoading(true);
    // Kurze Verzögerung, damit der Spinner angezeigt werden kann
    setTimeout(() => {
      try {
        // Lade immer alle Produkte
        const allProducts: Product[] = [];
        Object.values(productData).forEach((categoryProducts) => {
          if (Array.isArray(categoryProducts)) {
            allProducts.push(...categoryProducts);
          }
        });
        setProducts(allProducts);
        setSelectedCategory(category);
      } catch (error) {
        console.error('Error loading JSON:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 10);
  };

  const handleCategoryPress = (category: Category) => {
    setShouldFocusSearch(false); // Kein Auto-Focus bei Kategorieklick
    // Setze die Kategorie als initialen Filter, wenn es nicht "Alle Artikel" ist
    if (category.id !== 'all') {
      setInitialFilter(category.id);
    } else {
      setInitialFilter(null);
    }
    // Öffne immer "Alle Artikel" mit dem entsprechenden Filter
    const allCategory = categories.find(cat => cat.id === 'all');
    if (allCategory) {
      loadCategoryData(allCategory);
    }
  };

  const handleBackPress = () => {
    setSelectedCategory(null);
    setProducts([]);
    setSearchQuery('');
    setShowFavorites(false);
    setShouldFocusSearch(false);
    setInitialFilter(null);
  };

  const handleSearchFocus = () => {
    // Öffne "Alle Artikel" wenn Suchfeld fokussiert wird
    const allCategory = categories.find(cat => cat.id === 'all');
    if (allCategory && !selectedCategory) {
      setShouldFocusSearch(true); // Auto-Focus aktivieren
      loadCategoryData(allCategory);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + change);
      if (newQty === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  // Home Screen mit Kategorien - immer im Hintergrund
  return (
    <>
      <StatusBar style="auto" />
      <HomeScreen
        categories={updatedCategories}
        onCategoryPress={handleCategoryPress}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchFocus={handleSearchFocus}
        isProductListOpen={!!selectedCategory}
        onFavoritesPress={() => {
          setShowFavorites(true);
        }}
        onCartPress={() => {
          // TODO: Navigate to cart screen
          console.log('Einkaufsliste öffnen');
        }}
        onHeaderCartPress={() => {
          // TODO: Navigate to cart screen
          console.log('Warenkorb öffnen');
        }}
        favoritesCount={favorites.size}
        cartCount={Object.keys(cart).length}
      />
      {/* FavoritesScreen als Overlay über HomeScreen */}
      {showFavorites && (
        <FavoritesScreen
          favorites={favorites}
          cart={cart}
          onToggleFavorite={toggleFavorite}
          onUpdateQuantity={updateQuantity}
          onBack={handleBackPress}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onHeaderCartPress={() => {
            // TODO: Navigate to cart screen
            console.log('Warenkorb öffnen');
          }}
        />
      )}
      {/* ProductListScreen als Overlay über HomeScreen */}
      {selectedCategory && (
        <ProductListScreen
          category={selectedCategory}
          products={products}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBack={handleBackPress}
          favorites={favorites}
          cart={cart}
          onToggleFavorite={toggleFavorite}
          onUpdateQuantity={updateQuantity}
          onHeaderCartPress={() => {
            // TODO: Navigate to cart screen
            console.log('Warenkorb öffnen');
          }}
          shouldFocusSearch={shouldFocusSearch}
          initialFilter={initialFilter}
        />
      )}
    </>
  );
}
