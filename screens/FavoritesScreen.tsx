import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, FlatList, ScrollView, Animated, PanResponder, Dimensions, Keyboard, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { productData } from '../data/json';
import ProductItem from '../components/ProductItem';
import { categories } from '../data/categories';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FavoritesScreenProps {
  favorites: Set<string>;
  favoritesOrder: string[];
  onUpdateFavoritesOrder: (newOrder: string[]) => void;
  cart: { [key: string]: number };
  onToggleFavorite: (id: string) => void;
  onUpdateQuantity: (id: string, change: number) => void;
  onBack: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onHeaderCartPress?: () => void;
}

export default function FavoritesScreen({
  favorites,
  favoritesOrder,
  onUpdateFavoritesOrder,
  cart,
  onToggleFavorite,
  onUpdateQuantity,
  onBack,
  searchQuery,
  onSearchChange,
  onHeaderCartPress,
}: FavoritesScreenProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [selectedFilters, setSelectedFilters] = React.useState<Set<string>>(new Set());
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  
  useEffect(() => {
    // Animation beim Öffnen
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const closeOverlay = () => {
    // Keyboard sofort schließen
    Keyboard.dismiss();
    
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onBack();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Nur am oberen Bereich (Header/DragHandle) reagieren
        return gestureState.y0 < 80;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Nur nach unten ziehen und nur im oberen Bereich
        return gestureState.dy > 5 && gestureState.y0 < 80;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (evt, gestureState) => {
        // Nur nach unten ziehen erlauben
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          opacity.setValue(1 - gestureState.dy / SCREEN_HEIGHT);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Wenn mehr als 150px nach unten gezogen, schließen
        if (gestureState.dy > 150) {
          // Keyboard sofort schließen
          Keyboard.dismiss();
          
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: SCREEN_HEIGHT,
              useNativeDriver: true,
              tension: 50,
              friction: 10,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onBack();
          });
        } else {
          // Zurück zur ursprünglichen Position
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 10,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;
  
  // Filtere "Alle Artikel" aus der Filterliste
  const filterCategories = useMemo(() => {
    return categories.filter(cat => cat.id !== 'all');
  }, []);

  const toggleFilter = (categoryId: string) => {
    setSelectedFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(categoryId)) {
        newFilters.delete(categoryId);
      } else {
        newFilters.add(categoryId);
      }
      return newFilters;
    });
  };
  // Sammle alle favorisierten Produkte aus allen Kategorien und sortiere nach Reihenfolge
  const favoriteProducts = useMemo(() => {
    const allProducts: Product[] = [];
    Object.values(productData).forEach((categoryProducts) => {
      if (Array.isArray(categoryProducts)) {
        allProducts.push(...categoryProducts);
      }
    });
    
    const favoriteProductsList = allProducts.filter(product => {
      const id = product.data_id || product.Artikelname;
      return favorites.has(id);
    });
    
    // Sortiere nach favoritesOrder
    return favoriteProductsList.sort((a, b) => {
      const idA = a.data_id || a.Artikelname;
      const idB = b.data_id || b.Artikelname;
      const indexA = favoritesOrder.indexOf(idA);
      const indexB = favoritesOrder.indexOf(idB);
      
      // Wenn beide in der Reihenfolge sind, sortiere nach Index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // Wenn nur A in der Reihenfolge ist, kommt A zuerst
      if (indexA !== -1) return -1;
      // Wenn nur B in der Reihenfolge ist, kommt B zuerst
      if (indexB !== -1) return 1;
      // Wenn keiner in der Reihenfolge ist, alphabetisch sortieren
      return (a.Artikelname || '').localeCompare(b.Artikelname || '');
    });
  }, [favorites, favoritesOrder]);

  // Filtere nach ausgewählten Filter-Kategorien
  const filterCategoryFilteredProducts = useMemo(() => {
    if (selectedFilters.size === 0) {
      return favoriteProducts;
    }
    
    // Erstelle ein Set aller Produkt-IDs aus den ausgewählten Filter-Kategorien
    const filterProductIds = new Set<string>();
    
    selectedFilters.forEach(filterCategoryId => {
      const filterCategory = categories.find(cat => cat.id === filterCategoryId);
      if (filterCategory && filterCategory.csvFile !== 'all') {
        const categoryProducts = productData[filterCategory.csvFile as keyof typeof productData];
        if (Array.isArray(categoryProducts)) {
          categoryProducts.forEach(p => {
            const id = p.data_id || p.Artikelname;
            filterProductIds.add(id);
          });
        }
      }
    });
    
    // Filtere Produkte, die in mindestens einer der ausgewählten Filter-Kategorien sind
    return favoriteProducts.filter(p => {
      const id = p.data_id || p.Artikelname;
      return filterProductIds.has(id);
    });
  }, [favoriteProducts, selectedFilters]);

  // Filtere zusätzlich nach Suchanfrage
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return filterCategoryFilteredProducts;
    }
    const query = searchQuery.toLowerCase();
    return filterCategoryFilteredProducts.filter(item =>
      item.Artikelname?.toLowerCase().includes(query)
    );
  }, [filterCategoryFilteredProducts, searchQuery]);

  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const itemAnimations = useRef<Map<string, Animated.Value>>(new Map());
  const itemLayouts = useRef<Map<string, { y: number; height: number }>>(new Map());

  const handleItemLayout = (itemId: string, y: number, height: number) => {
    itemLayouts.current.set(itemId, { y, height });
  };

  const getItemAnimation = (itemId: string) => {
    if (!itemAnimations.current.has(itemId)) {
      itemAnimations.current.set(itemId, new Animated.Value(0));
    }
    return itemAnimations.current.get(itemId)!;
  };

  const animateSwap = (itemId1: string, itemId2: string, direction: 'up' | 'down', onComplete: () => void) => {
    const layout1 = itemLayouts.current.get(itemId1);
    const layout2 = itemLayouts.current.get(itemId2);

    if (!layout1 || !layout2) {
      // Fallback if layouts are missing
      onComplete();
      return;
    }

    const anim1 = getItemAnimation(itemId1);
    const anim2 = getItemAnimation(itemId2);
    
    setAnimatingItems(new Set([itemId1, itemId2]));
    
    // Setze beide Animationen auf Startwert
    anim1.setValue(0);
    anim2.setValue(0);
    
    // Margin zwischen den Items
    const MARGIN = 12;
    
    // Berechne Distanzen basierend auf Höhen
    // Wenn direction 'up': Item1 (unten) geht nach oben über Item2 (oben)
    // Item1 bewegt sich um -(height2 + margin)
    // Item2 bewegt sich um +(height1 + margin)
    
    // Wenn direction 'down': Item1 (oben) geht nach unten über Item2 (unten)
    // Item1 bewegt sich um +(height2 + margin)
    // Item2 bewegt sich um -(height1 + margin)
    
    let dist1 = 0;
    let dist2 = 0;
    
    if (direction === 'up') {
      dist1 = -(layout2.height + MARGIN);
      dist2 = layout1.height + MARGIN;
    } else {
      dist1 = layout2.height + MARGIN;
      dist2 = -(layout1.height + MARGIN);
    }
    
    // Beide Items animieren
    Animated.parallel([
      Animated.spring(anim1, {
        toValue: dist1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(anim2, {
        toValue: dist2,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Zurück auf 0 setzen
      anim1.setValue(0);
      anim2.setValue(0);
      setAnimatingItems(new Set());
      // Rufe Callback auf, um die Position zu aktualisieren
      onComplete();
    });
  };

  const handleMoveUp = (itemId: string, currentIndex: number) => {
    if (currentIndex === 0) return;
    
    const currentOrder = filteredProducts.map(p => p.data_id || p.Artikelname);
    const itemIndex = currentOrder.indexOf(itemId);
    
    if (itemIndex !== -1 && itemIndex > 0) {
      const previousItemId = currentOrder[itemIndex - 1];
      
      // Erstelle neue Reihenfolge
      const newOrder = [...currentOrder];
      [newOrder[itemIndex - 1], newOrder[itemIndex]] = [newOrder[itemIndex], newOrder[itemIndex - 1]];
      
      // Starte Animation und aktualisiere Position erst nach Abschluss
      animateSwap(itemId, previousItemId, 'up', () => {
        // Aktualisiere favoritesOrder nach Animation
        const allFavoritesOrder = [...favoritesOrder];
        const filteredIds = new Set(currentOrder);
        const remainingOrder = allFavoritesOrder.filter(id => !filteredIds.has(id));
        const updatedOrder = [...newOrder, ...remainingOrder];
        onUpdateFavoritesOrder(updatedOrder);
      });
    }
  };

  const handleMoveDown = (itemId: string, currentIndex: number) => {
    if (currentIndex === filteredProducts.length - 1) return;
    
    const currentOrder = filteredProducts.map(p => p.data_id || p.Artikelname);
    const itemIndex = currentOrder.indexOf(itemId);
    
    if (itemIndex !== -1 && itemIndex < currentOrder.length - 1) {
      const nextItemId = currentOrder[itemIndex + 1];
      
      // Erstelle neue Reihenfolge
      const newOrder = [...currentOrder];
      [newOrder[itemIndex], newOrder[itemIndex + 1]] = [newOrder[itemIndex + 1], newOrder[itemIndex]];
      
      // Starte Animation und aktualisiere Position erst nach Abschluss
      animateSwap(itemId, nextItemId, 'down', () => {
        // Aktualisiere favoritesOrder nach Animation
        const allFavoritesOrder = [...favoritesOrder];
        const filteredIds = new Set(currentOrder);
        const remainingOrder = allFavoritesOrder.filter(id => !filteredIds.has(id));
        const updatedOrder = [...newOrder, ...remainingOrder];
        onUpdateFavoritesOrder(updatedOrder);
      });
    }
  };

  const renderProductItem = useCallback(({ item, index }: { item: Product; index: number }) => {
    const id = item.data_id || item.Artikelname;
    const quantity = cart[id] || 0;
    const isFavorite = favorites.has(id);
    const isAnimating = animatingItems.has(id);
    const animValue = getItemAnimation(id);

    return (
      <Animated.View
        style={[
          styles.productItemWrapper,
          {
            transform: [{ translateY: animValue }],
            zIndex: isAnimating ? 1000 : 1,
            opacity: isAnimating ? 0.9 : 1,
          }
        ]}
      >
        <View style={styles.arrowContainer}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => handleMoveUp(id, index)}
            disabled={index === 0 || isAnimating}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chevron-up" 
              size={20} 
              color={index === 0 || isAnimating ? "#ccc" : "#2E2C55"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => handleMoveDown(id, index)}
            disabled={index === filteredProducts.length - 1 || isAnimating}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={index === filteredProducts.length - 1 || isAnimating ? "#ccc" : "#2E2C55"} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.productItemContent}>
          <ProductItem
            item={item}
            quantity={quantity}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onUpdateQuantity={onUpdateQuantity}
          />
        </View>
      </Animated.View>
    );
  }, [cart, favorites, onToggleFavorite, onUpdateQuantity, filteredProducts.length, handleMoveUp, handleMoveDown, animatingItems]);

  return (
    <View style={styles.overlayContainer}>
      <TouchableOpacity 
        activeOpacity={1}
        onPress={closeOverlay}
        style={styles.backdropTouchable}
      >
        <Animated.View 
          style={[
            styles.backdrop,
            {
              opacity: opacity,
            }
          ]}
        />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: translateY }],
          }
        ]}
      >
        <View style={styles.safeArea}>
          <StatusBar style="auto" />
          <View style={styles.dragHandle} {...panResponder.panHandlers} />
          <View style={styles.header} {...panResponder.panHandlers}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={closeOverlay} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#2E2C55" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Favoriten suchen..."
                placeholderTextColor="#777"
                value={searchQuery}
                onChangeText={onSearchChange}
              />
            </View>
          </View>
          {onHeaderCartPress && (
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={onHeaderCartPress}
              activeOpacity={0.7}
            >
              <Ionicons name="cart" size={28} color="#2E2C55" />
              {Object.keys(cart).length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{Object.keys(cart).length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
        {/* Filter Bereich */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={styles.filterIconButton}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={20} color="#2E2C55" />
          </TouchableOpacity>
          
          {/* Anzeige der ausgewählten Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.selectedFiltersContainer}
            contentContainerStyle={styles.selectedFiltersContent}
          >
            {selectedFilters.size > 0 ? (
              Array.from(selectedFilters).map(filterId => {
                const filterCategory = categories.find(cat => cat.id === filterId);
                if (!filterCategory) return null;
                return (
                  <TouchableOpacity
                    key={filterId}
                    style={styles.filterChip}
                    onPress={() => toggleFilter(filterId)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.filterChipText}>{filterCategory.name}</Text>
                    <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.noFiltersText}>Keine Filter aktiv</Text>
            )}
          </ScrollView>
        </View>
      </View>
      
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {favorites.size === 0 
              ? 'Noch keine Favoriten' 
              : 'Keine Favoriten gefunden'}
          </Text>
          <Text style={styles.emptySubtext}>
            {favorites.size === 0
              ? 'Markiere Artikel als Favorit, um sie hier zu sehen'
              : 'Versuche eine andere Suche'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={({ item, index }) => renderProductItem({ item, index })}
          keyExtractor={(item) => item.data_id || item.Artikelname || ''}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          initialNumToRender={10}
          windowSize={5}
          removeClippedSubviews={false}
          nestedScrollEnabled={true}
          extraData={favoritesOrder}
          style={styles.flatList}
        />
      )}
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kategorien filtern</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#2E2C55" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScrollView} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={styles.filterLabelsContainer}>
                {filterCategories.map(filterCategory => {
                  const isSelected = selectedFilters.has(filterCategory.id);
                  return (
                    <TouchableOpacity
                      key={filterCategory.id}
                      style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                      onPress={() => toggleFilter(filterCategory.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterLabelText, isSelected && styles.filterLabelTextSelected]}>
                        {filterCategory.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalClearButton}
                onPress={() => {
                  setSelectedFilters(new Set());
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalClearButtonText}>Alle zurücksetzen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalApplyButtonText}>Anwenden</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.95,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#2E2C55',
    padding: 0,
  },
  cartButton: {
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    gap: 12,
  },
  filterIconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFiltersContainer: {
    flex: 1,
  },
  selectedFiltersContent: {
    gap: 8,
    alignItems: 'center',
  },
  noFiltersText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e8e8f0',
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: '#2E2C55',
    fontWeight: '500',
  },
  filterChipClose: {
    marginLeft: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E2C55',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  filterLabelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginVertical: -5,
    width: '100%',
  },
  filterLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    marginHorizontal: 5,
    marginVertical: 5,
    minHeight: 40,
  },
  filterLabelSelected: {
    backgroundColor: '#e8e8f0',
    borderColor: '#2E2C55',
    borderWidth: 2,
  },
  filterLabelText: {
    fontSize: 15,
    color: '#2E2C55',
    fontWeight: '500',
    lineHeight: 20,
  },
  filterLabelTextSelected: {
    fontWeight: '600',
  },
  filterLabelCheck: {
    marginLeft: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalClearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalApplyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2E2C55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  productItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  arrowContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 8,
    justifyContent: 'center',
    minHeight: 100,
  },
  arrowButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productItemContent: {
    flex: 1,
  },
});

