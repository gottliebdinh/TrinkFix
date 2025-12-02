import React, { useState, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { productData } from './data/json';
import { categories } from './data/categories';
import { Category, Product } from './types';
import HomeScreen from './screens/HomeScreen';
import ProductListScreen from './screens/ProductListScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import ChatScreen from './screens/ChatScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesOrder, setFavoritesOrder] = useState<string[]>([]);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [cartComments, setCartComments] = useState<{[key: string]: string}>({});
  const [shoppingList, setShoppingList] = useState<{[key: string]: number}>({});
  const [shoppingListComments, setShoppingListComments] = useState<{[key: string]: string}>({});
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showChat, setShowChat] = useState(false);
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
    setShowCart(false);
    setShowShoppingList(false);
    setShowCheckout(false);
    setShowChat(false);
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
        // Entferne aus der Reihenfolge
        setFavoritesOrder(prevOrder => prevOrder.filter(favId => favId !== id));
      } else {
        newFavorites.add(id);
        // Füge am Ende der Reihenfolge hinzu (nicht sofort oben)
        setFavoritesOrder(prevOrder => [...prevOrder, id]);
      }
      return newFavorites;
    });
  };

  const updateFavoritesOrder = (newOrder: string[]) => {
    setFavoritesOrder(newOrder);
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + change);
      if (newQty === 0) {
        const { [id]: _, ...rest } = prev;
        // Entferne auch den Kommentar, wenn der Artikel entfernt wird
        setCartComments(prevComments => {
          const { [id]: __, ...restComments } = prevComments;
          return restComments;
        });
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const updateCartComment = (id: string, comment: string) => {
    setCartComments(prev => {
      if (comment.trim() === '') {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: comment };
    });
  };

  const updateShoppingListQuantity = (id: string, change: number) => {
    setShoppingList(prev => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + change);
      if (newQty === 0) {
        const { [id]: _, ...rest } = prev;
        setShoppingListComments(prevComments => {
          const { [id]: __, ...restComments } = prevComments;
          return restComments;
        });
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const updateShoppingListComment = (id: string, comment: string) => {
    setShoppingListComments(prev => {
      if (comment.trim() === '') {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: comment };
    });
  };

  const addShoppingListToCart = (shoppingListItems: {[key: string]: number}) => {
    setCart(prev => {
      const newCart = { ...prev };
      Object.entries(shoppingListItems).forEach(([id, quantity]) => {
        newCart[id] = (newCart[id] || 0) + quantity;
      });
      return newCart;
    });
    // Kommentare auch übernehmen
    setCartComments(prev => {
      const newComments = { ...prev };
      Object.entries(shoppingListComments).forEach(([id, comment]) => {
        if (comment && shoppingListItems[id]) {
          newComments[id] = comment;
        }
      });
      return newComments;
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
          setShowCart(true);
        }}
        onShoppingListPress={() => {
          setShowShoppingList(true);
        }}
        onHeaderCartPress={() => {
          setShowCart(true);
        }}
        onChatPress={() => {
          setShowChat(true);
        }}
        favoritesCount={favorites.size}
        cartCount={Object.keys(cart).length}
        shoppingListCount={Object.keys(shoppingList).length}
      />
      {/* FavoritesScreen als Overlay über HomeScreen */}
      {showFavorites && (
        <FavoritesScreen
          favorites={favorites}
          favoritesOrder={favoritesOrder}
          onUpdateFavoritesOrder={updateFavoritesOrder}
          cart={cart}
          onToggleFavorite={toggleFavorite}
          onUpdateQuantity={updateQuantity}
          onBack={handleBackPress}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onHeaderCartPress={() => {
            setShowCart(true);
          }}
        />
      )}
      {/* CartScreen als Overlay über HomeScreen */}
      {showCart && (
        <CartScreen
          cart={cart}
          cartComments={cartComments}
          onUpdateQuantity={updateQuantity}
          onUpdateComment={updateCartComment}
          onBack={() => setShowCart(false)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCheckout={() => {
            setShowCheckout(true);
          }}
        />
      )}
      {/* CheckoutScreen als Overlay über CartScreen */}
      {showCheckout && (
        <CheckoutScreen
          cart={cart}
          cartComments={cartComments}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onUpdateQuantity={updateQuantity}
          onBack={() => {
            setShowCheckout(false);
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
          favoritesOrder={favoritesOrder}
          cart={cart}
          shoppingList={shoppingList}
          onToggleFavorite={toggleFavorite}
          onUpdateQuantity={updateQuantity}
          onUpdateShoppingListQuantity={updateShoppingListQuantity}
          onHeaderCartPress={() => {
            // Schließe ProductListScreen und öffne CartScreen
            setSelectedCategory(null);
            setProducts([]);
            setShouldFocusSearch(false);
            setInitialFilter(null);
            setShowCart(true);
          }}
          shouldFocusSearch={shouldFocusSearch}
          initialFilter={initialFilter}
        />
      )}
      {/* ChatScreen als Overlay über HomeScreen */}
      {showChat && (
        <ChatScreen
          onBack={() => setShowChat(false)}
        />
      )}
      {/* ShoppingListScreen als Overlay über HomeScreen */}
      {showShoppingList && (
        <ShoppingListScreen
          shoppingList={shoppingList}
          shoppingListComments={shoppingListComments}
          onUpdateQuantity={updateShoppingListQuantity}
          onUpdateComment={updateShoppingListComment}
          onBack={() => setShowShoppingList(false)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={addShoppingListToCart}
        />
      )}
    </>
  );
}
