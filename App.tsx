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
import OffersScreen from './screens/OffersScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import SalesAppScreen from './screens/SalesAppScreen';
import CustomerScreen from './screens/CustomerScreen';
import CustomerDetailScreen from './screens/CustomerDetailScreen';
import CustomerChatScreen from './screens/CustomerChatScreen';
import AddCustomerScreen from './screens/AddCustomerScreen';
import OrdersScreen from './screens/OrdersScreen';
import ChatsOverviewScreen from './screens/ChatsOverviewScreen';

// Generiere Dummy-Items für Bestellungen ohne Items
const generateDummyItems = (count: number) => {
  const dummyItems: Array<{ name: string; quantity: number; unit: string }> = [];
  
  // Sammle alle Produkte aus productData
  const allProducts: Array<{ Artikelname: string; unit_title?: string }> = [];
  Object.values(productData).forEach((categoryProducts) => {
    if (Array.isArray(categoryProducts)) {
      categoryProducts.forEach(product => {
        if (product && product.Artikelname && product.Artikelname.trim()) {
          allProducts.push(product);
        }
      });
    }
  });
  
  // Wenn keine Produkte gefunden wurden, verwende Standard-Dummy-Items
  if (allProducts.length === 0) {
    const defaultItems = [
      { name: 'Krombacher Pils', quantity: 2, unit: 'Kasten' },
      { name: 'Warsteiner Premium Pils', quantity: 1, unit: 'Ki (20 Fl)' },
      { name: 'Pyraser Weizen', quantity: 1, unit: 'Ki (20 Fl)' },
      { name: 'Mönchshof Radler Blutorange', quantity: 1, unit: 'Ki' },
      { name: 'Glüh Gin', quantity: 1, unit: 'Fl' },
    ];
    return defaultItems.slice(0, Math.min(count, defaultItems.length));
  }
  
  // Wähle zufällige Produkte aus
  const selectedProducts = allProducts
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, allProducts.length));
  
  selectedProducts.forEach((product) => {
    const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 Stück
    const unit = product.unit_title || 'Fl';
    
    dummyItems.push({
      name: product.Artikelname.trim(),
      quantity: quantity,
      unit: unit,
    });
  });
  
  return dummyItems;
};

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
  const [showShoppingListProductView, setShowShoppingListProductView] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showSalesApp, setShowSalesApp] = useState(false);
  const [showCustomerScreen, setShowCustomerScreen] = useState(false);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [showCustomerChat, setShowCustomerChat] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showAddCustomerScreen, setShowAddCustomerScreen] = useState(false);
  const [showOrdersScreen, setShowOrdersScreen] = useState(false);
  const [showChatsOverview, setShowChatsOverview] = useState(false);
  const [chatMessages, setChatMessages] = useState<{[key: string]: Array<{id: string; sender: 'customer' | 'user'; text: string; timestamp: Date}>}>({});
  const [readChats, setReadChats] = useState<Set<string>>(new Set());
  const [unansweredChats, setUnansweredChats] = useState<Set<string>>(new Set());
  const [newCustomers, setNewCustomers] = useState<any[]>([]);
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);
  const [initialFilter, setInitialFilter] = useState<string | null>(null);
  const [initialActivityLevelFilter, setInitialActivityLevelFilter] = useState<string | null>(null);

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
    setShowShoppingListProductView(false);
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
        // Synchronisiere mit Einkaufsliste: Wenn Produkt in Einkaufsliste ist, setze Menge auf 0
        setShoppingList(prevShoppingList => {
          if (prevShoppingList[id] !== undefined) {
            return { ...prevShoppingList, [id]: 0 };
          }
          return prevShoppingList;
        });
        return rest;
      }
      // Synchronisiere mit Einkaufsliste: Wenn Produkt in Einkaufsliste ist, aktualisiere Menge
      setShoppingList(prevShoppingList => {
        if (prevShoppingList[id] !== undefined) {
          return { ...prevShoppingList, [id]: newQty };
        }
        return prevShoppingList;
      });
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
      // Wenn change === 0, bedeutet das "hinzufügen zur Einkaufsliste"
      if (change === 0) {
        // Prüfe die zentral verwaltete Menge (Warenkorb)
        const cartQty = cart[id] || 0;
        // Setze die Einkaufsliste-Menge immer auf die Warenkorb-Menge (zentral verwaltet)
        // Wenn Produkt nicht im Warenkorb ist, bleibt es bei 0
        return { ...prev, [id]: cartQty };
      }
      
      // Normale Logik für Änderungen
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + change);
      // WICHTIG: Bei Menge 0 NICHT löschen - nur durch Mülleimer wird gelöscht
      // Das Löschen wird durch onDelete (Mülleimer) gehandhabt
      
      // Synchronisiere mit Warenkorb: Aktualisiere Warenkorb-Menge entsprechend
      setCart(prevCart => {
        const cartQty = prevCart[id] || 0;
        // Berechne die Differenz zwischen alter und neuer Einkaufsliste-Menge
        const diff = newQty - currentQty;
        const newCartQty = Math.max(0, cartQty + diff);
        
        if (newCartQty === 0) {
          const { [id]: _, ...rest } = prevCart;
          // Entferne auch den Kommentar, wenn der Artikel entfernt wird
          setCartComments(prevComments => {
            const { [id]: __, ...restComments } = prevComments;
            return restComments;
          });
          return rest;
        }
        return { ...prevCart, [id]: newCartQty };
      });
      
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

  const removeFromShoppingList = (id: string) => {
    setShoppingList(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setShoppingListComments(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
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
      {!showSalesApp && (
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
        onOffersPress={() => {
          setShowOffers(true);
        }}
        onOrderHistoryPress={() => {
          setShowOrderHistory(true);
        }}
        onSalesAppPress={() => {
          setShowSalesApp(true);
        }}
        favoritesCount={favorites.size}
        cartCount={Object.keys(cart).length}
        shoppingListCount={Object.keys(shoppingList).length}
        />
      )}
      {showSalesApp && !showCustomerScreen && !showOrdersScreen && !showChatsOverview && (
        <SalesAppScreen
          onBack={() => setShowSalesApp(false)}
          onCustomerPress={() => {
            setInitialActivityLevelFilter(null);
            setShowCustomerScreen(true);
          }}
          onShowInactiveCustomers={() => {
            setInitialActivityLevelFilter('inaktiv');
            setShowCustomerScreen(true);
          }}
          onOrdersPress={() => {
            setShowOrdersScreen(true);
          }}
          onChatPress={() => {
            setShowChatsOverview(true);
          }}
          onInactiveCustomersPress={() => {
            // TODO: Navigate to inactive customers screen
            console.log('Inactive customers pressed');
          }}
        />
      )}
      {showCustomerScreen && !showAddCustomerScreen && (
        <CustomerScreen
          onBack={() => {
            setInitialActivityLevelFilter(null);
            setShowCustomerScreen(false);
          }}
          onAddCustomer={() => {
            setShowAddCustomerScreen(true);
          }}
          initialActivityLevel={initialActivityLevelFilter}
          newCustomers={newCustomers}
          onCustomerPress={(customer) => {
            setSelectedCustomer(customer);
            setShowCustomerDetail(true);
          }}
        />
      )}
      {showCustomerScreen && showCustomerDetail && selectedCustomer && (
        <CustomerDetailScreen
          customer={selectedCustomer}
          onBack={() => {
            setShowCustomerDetail(false);
            setSelectedCustomer(null);
          }}
          onShowAllOrders={(customerName) => {
            setOrdersSearchQuery(customerName);
            setShowCustomerDetail(false);
            setSelectedCustomer(null);
            setShowCustomerScreen(false);
            setShowOrdersScreen(true);
          }}
          onChatPress={(customer) => {
            setShowCustomerChat(true);
          }}
          onOrderPress={(order) => {
            // Generiere fiktive Daten, falls Felder fehlen
            const today = new Date();
            const orderDate = new Date(today);
            orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 7)); // 0-7 Tage in der Vergangenheit
            const deliveryDate = new Date(orderDate);
            deliveryDate.setDate(deliveryDate.getDate() + 2); // 2 Tage später
            
            const formatDate = (date: Date) => {
              const days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
              const dayName = days[date.getDay()];
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = String(date.getFullYear()).slice(-2);
              return `${dayName} ${day}.${month}.${year}`;
            };
            
            const formatDateWithTime = (date: Date) => {
              const days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
              const dayName = days[date.getDay()];
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = String(date.getFullYear()).slice(-2);
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${dayName} ${day}.${month}.${year} ${hours}:${minutes}`;
            };
            
            // Generiere fiktive Bestellnummer im Format "ORD YYYY-XXX"
            const generateOrderNumber = () => {
              const year = today.getFullYear();
              const orderNum = Math.floor(Math.random() * 999) + 1;
              return `ORD ${year}-${String(orderNum).padStart(3, '0')}`;
            };
            
            // Stelle sicher, dass alle Felder vorhanden sind (auch wenn leer)
            const orderWithItems = {
              ...order,
              orderDate: (order.orderDate && order.orderDate.trim()) || (order.orderDateRaw && order.orderDateRaw.trim()) || formatDateWithTime(orderDate),
              deliveryDate: (order.deliveryDate && order.deliveryDate.trim()) || formatDate(deliveryDate),
              orderNumber: (order.orderNumber && order.orderNumber.trim()) || generateOrderNumber(),
              email: (order.email && order.email.trim()) || `${(order.customer || 'kunde').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}@example.com`,
              fromAddress: order.fromAddress || {
                name: 'Trinkkartell GmbH',
                street: 'Industriestraße 78',
                city: '97074 Würzburg',
                country: 'Deutschland'
              },
              toAddress: order.toAddress || {
                name: order.customer || 'Kunde',
                street: 'Hauptstraße 12',
                city: '97070 Würzburg',
                country: 'Deutschland'
              },
              items: order.items && order.items.length > 0 
                ? order.items 
                : generateDummyItems(order.itemCount ? parseInt(order.itemCount) : 5)
            };
            setSelectedOrder(orderWithItems);
            setShowOrderDetail(true);
          }}
        />
      )}
      {((showCustomerScreen && showCustomerChat) || (showSalesApp && showCustomerChat)) && selectedCustomer && (
        <CustomerChatScreen
          customer={selectedCustomer}
          initialMessages={chatMessages[selectedCustomer.id]}
          onBack={() => {
            setShowCustomerChat(false);
          }}
          onMessageSent={(customerId, message) => {
            setChatMessages(prev => {
              const existingMessages = prev[customerId] || [];
              // Prüfe, ob die Nachricht bereits existiert (verhindere Duplikate)
              const messageExists = existingMessages.some(m => m.id === message.id);
              if (messageExists) {
                return prev;
              }
              return {
                ...prev,
                [customerId]: [...existingMessages, message],
              };
            });
            // Entferne aus "unbeantwortet", da jetzt geantwortet wurde
            setUnansweredChats(prev => {
              const newSet = new Set(prev);
              newSet.delete(customerId);
              return newSet;
            });
            // Markiere als gelesen, da der Benutzer die letzte Nachricht geschrieben hat
            setReadChats(prev => new Set(prev).add(customerId));
          }}
          onChatOpened={(customerId) => {
            // Markiere Chat als gelesen beim Öffnen
            setReadChats(prev => new Set(prev).add(customerId));
            // Wenn letzte Nachricht vom Kunden ist, markiere als unbeantwortet
            const messages = chatMessages[customerId];
            if (messages && messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              if (lastMessage.sender === 'customer') {
                setUnansweredChats(prev => new Set(prev).add(customerId));
              }
            }
          }}
        />
      )}
      {showAddCustomerScreen && (
        <AddCustomerScreen
          onBack={() => setShowAddCustomerScreen(false)}
          onSave={(customerData) => {
            // Erstelle neuen Kunden mit allen notwendigen Feldern
            const newCustomer = {
              id: `new-${Date.now()}`,
              name: customerData.customerName || '',
              type: 'restaurant' as const,
              activityLevel: 'aktiv' as const,
              status: 'Noch keine Bestellung',
              group: customerData.selectedGroup || '',
              country: customerData.countryCode || 'Deutschland',
              phone: customerData.phoneNumber || '',
              email: customerData.email || '',
              toAddress: {
                name: customerData.customerName || '',
                street: customerData.street || '',
                number: '',
                postalCode: customerData.zipCode || '',
                city: customerData.city || '',
                country: customerData.countryCode || 'Deutschland',
              },
              averageOrderValue: 0,
              orderFrequency: 'Unbekannt',
              revenueYTD: 0,
              salesRep: null,
              deliveryDays: Array.from(customerData.deliveryDays || []),
              pricesVisible: customerData.showPrices || false,
              minOrderQuantity: parseInt(customerData.minOrderQuantity || '0', 10),
              notificationsEnabled: false,
            };
            
            // Füge neuen Kunden zur Liste hinzu
            setNewCustomers(prev => [...prev, newCustomer]);
            setShowAddCustomerScreen(false);
          }}
        />
      )}
      {showOrdersScreen && (
        <OrdersScreen
          onBack={() => {
            setShowOrdersScreen(false);
            setOrdersSearchQuery('');
          }}
          onOrderPress={(order) => {
            setSelectedOrder(order);
            setShowOrderDetail(true);
          }}
          initialSearchQuery={ordersSearchQuery}
        />
      )}
      {((showOrdersScreen && showOrderDetail && selectedOrder && !showOrderHistory) ||
        (showCustomerScreen && showCustomerDetail && showOrderDetail && selectedOrder)) && (
        <OrderDetailScreen
          order={selectedOrder}
          onBack={() => {
            setShowOrderDetail(false);
            setSelectedOrder(null);
          }}
        />
      )}
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
          zIndex={showShoppingList ? 1100 : showOffers ? 1100 : 1000}
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
          zIndex={showShoppingList ? 1200 : showOffers ? 1200 : 1001}
        />
      )}
      {/* ProductListScreen als Overlay über HomeScreen */}
      {selectedCategory && !showShoppingListProductView && (
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
      {/* ChatsOverviewScreen für Vertrieb */}
      {showSalesApp && showChatsOverview && (
        <ChatsOverviewScreen
          onBack={() => setShowChatsOverview(false)}
          savedMessages={chatMessages}
          readChats={readChats}
          unansweredChats={unansweredChats}
          onChatRead={(customerId) => {
            // Markiere Chat als gelesen
            setReadChats(prev => new Set(prev).add(customerId));
            // Wenn letzte Nachricht vom Kunden ist, markiere als unbeantwortet
            const messages = chatMessages[customerId];
            if (messages && messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              if (lastMessage.sender === 'customer') {
                setUnansweredChats(prev => new Set(prev).add(customerId));
              }
            }
          }}
          onChatPress={(customer, messages) => {
            setSelectedCustomer(customer);
            // Speichere die Nachrichten für diesen Kunden, falls noch nicht vorhanden
            setChatMessages(prev => {
              if (!prev[customer.id]) {
                return {
                  ...prev,
                  [customer.id]: messages,
                };
              }
              return prev;
            });
            setShowCustomerChat(true);
          }}
        />
      )}
      {/* OffersScreen als Overlay über HomeScreen */}
      {showOffers && (
        <OffersScreen
          onBack={() => setShowOffers(false)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          cart={cart}
          onUpdateQuantity={updateQuantity}
          shoppingList={shoppingList}
          onUpdateShoppingListQuantity={updateShoppingListQuantity}
          onHeaderCartPress={() => {
            setShowCart(true);
          }}
        />
      )}
      {/* ShoppingListScreen als Overlay über HomeScreen */}
      {showShoppingList && (
        <ShoppingListScreen
          shoppingList={shoppingList}
          shoppingListComments={shoppingListComments}
          onUpdateQuantity={updateShoppingListQuantity}
          onRemoveFromShoppingList={removeFromShoppingList}
          onUpdateComment={updateShoppingListComment}
          onBack={() => setShowShoppingList(false)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cart={cart}
          onHeaderCartPress={() => {
            setShowCart(true);
          }}
          onUpdateCartQuantity={updateQuantity}
          onAddProduct={() => {
            setShowShoppingListProductView(true);
            setSelectedCategory(null);
            setProducts([]);
            const allCategory = categories.find(cat => cat.id === 'all');
            if (allCategory) {
              loadCategoryData(allCategory);
            }
          }}
        />
      )}
      {/* ProductListScreen für Einkaufsliste */}
      {showShoppingListProductView && (
        <ProductListScreen
          category={selectedCategory || categories.find(cat => cat.id === 'all')!}
          products={products}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBack={() => {
            setShowShoppingListProductView(false);
            setSelectedCategory(null);
            setProducts([]);
          }}
          favorites={favorites}
          favoritesOrder={favoritesOrder}
          cart={cart}
          shoppingList={shoppingList}
          onToggleFavorite={toggleFavorite}
          onUpdateQuantity={updateQuantity}
          onUpdateShoppingListQuantity={updateShoppingListQuantity}
          shouldFocusSearch={false}
          initialFilter={null}
          shoppingListMode={true}
          zIndex={1001}
        />
      )}
      {/* OrderHistoryScreen als Overlay über HomeScreen */}
      {showOrderHistory && (
        <OrderHistoryScreen
          onBack={() => setShowOrderHistory(false)}
          onOrderPress={(order) => {
            // Konvertiere OrderHistory-Format zu OrderDetail-Format
            const today = new Date();
            const orderDate = order.date ? new Date(order.date) : new Date(today);
            const deliveryDate = new Date(orderDate);
            deliveryDate.setDate(deliveryDate.getDate() + 2);
            
            const formatDate = (date: Date) => {
              const days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
              const dayName = days[date.getDay()];
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = String(date.getFullYear()).slice(-2);
              return `${dayName} ${day}.${month}.${year}`;
            };
            
            const formatDateWithTime = (date: Date) => {
              const days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
              const dayName = days[date.getDay()];
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = String(date.getFullYear()).slice(-2);
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${dayName} ${day}.${month}.${year} ${hours}:${minutes}`;
            };
            
            // Konvertiere Items-Format
            const convertedItems = order.items ? order.items.map((item: any) => ({
              name: item.productName || item.name || 'Unbekanntes Produkt',
              quantity: item.quantity || 0,
              unit: item.unit || 'Fl'
            })) : [];
            
            const convertedOrder = {
              id: order.id || '',
              customer: 'Trinkkartell GmbH',
              orderDate: formatDateWithTime(orderDate),
              orderDateRaw: formatDate(orderDate),
              orderTime: String(orderDate.getHours()).padStart(2, '0') + ':' + String(orderDate.getMinutes()).padStart(2, '0'),
              orderNumber: order.orderNumber || `ORD ${orderDate.getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
              deliveryDate: formatDate(deliveryDate),
              itemCount: String(convertedItems.length),
              email: 'info@trinkkartell.de',
              fromAddress: {
                name: 'Trinkkartell GmbH',
                street: 'Industriestraße 78',
                city: '97074 Würzburg',
                country: 'Deutschland'
              },
              toAddress: {
                name: 'Trinkkartell GmbH',
                street: 'Industriestraße 78',
                city: '97074 Würzburg',
                country: 'Deutschland'
              },
              items: convertedItems.length > 0 ? convertedItems : generateDummyItems(5),
              cancelled: order.status === 'cancelled'
            };
            
            setSelectedOrder(convertedOrder);
            setShowOrderDetail(true);
          }}
        />
      )}
      {/* OrderDetailScreen als Overlay über OrderHistoryScreen */}
      {showOrderHistory && showOrderDetail && selectedOrder && (
        <OrderDetailScreen
          order={selectedOrder}
          onBack={() => {
            setShowOrderDetail(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </>
  );
}
