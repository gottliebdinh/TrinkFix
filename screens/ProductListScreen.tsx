import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, FlatList, Animated, PanResponder, Dimensions, Keyboard, Modal, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Category, Product } from '../types';
import ProductItem from '../components/ProductItem';
import { productData } from '../data/json';
import { categories } from '../data/categories';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const searchInputRef = React.createRef<TextInput>();

interface ProductListScreenProps {
  category: Category;
  products: Product[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBack: () => void;
  favorites: Set<string>;
  cart: { [key: string]: number };
  onToggleFavorite: (id: string) => void;
  onUpdateQuantity: (id: string, change: number) => void;
  onHeaderCartPress?: () => void;
  shouldFocusSearch?: boolean;
}

export default function ProductListScreen({
  category,
  products,
  loading,
  searchQuery,
  onSearchChange,
  onBack,
  favorites,
  cart,
  onToggleFavorite,
  onUpdateQuantity,
  onHeaderCartPress,
  shouldFocusSearch = false,
}: ProductListScreenProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filtere "Alle Artikel" aus der Filterliste
  const filterCategories = useMemo(() => {
    return categories.filter(cat => cat.id !== 'all');
  }, []);

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
    ]).start(() => {
      // Fokussiere das Suchfeld nur wenn shouldFocusSearch true ist
      if (shouldFocusSearch) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    });
  }, [shouldFocusSearch]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Nur am oberen Bereich (Header) reagieren
        return gestureState.y0 < 100;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Nur nach unten ziehen
        return gestureState.dy > 0 && gestureState.y0 < 100;
      },
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
  const renderProductItem = useCallback(({ item }: { item: Product }) => {
    const id = item.data_id || item.Artikelname;
    const quantity = cart[id] || 0;
    const isFavorite = favorites.has(id);

    return (
      <ProductItem
        item={item}
        quantity={quantity}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onUpdateQuantity={onUpdateQuantity}
      />
    );
  }, [cart, favorites, onToggleFavorite, onUpdateQuantity]);

  // Filtere Produkte nach Kategorie
  const categoryFilteredProducts = useMemo(() => {
    if (category.csvFile === 'all') {
      return products;
    }
    
    // Finde die Produkte der ausgewählten Kategorie
    const categoryProducts = productData[category.csvFile as keyof typeof productData];
    if (!Array.isArray(categoryProducts)) {
      return [];
    }
    
    // Erstelle ein Set der Artikelnamen aus der Kategorie für schnelles Lookup
    const categoryProductIds = new Set(
      categoryProducts.map(p => p.data_id || p.Artikelname)
    );
    
    // Filtere alle Produkte nach der Kategorie
    return products.filter(p => {
      const id = p.data_id || p.Artikelname;
      return categoryProductIds.has(id);
    });
  }, [products, category]);

  // Filtere nach ausgewählten Filter-Kategorien
  const filterCategoryFilteredProducts = useMemo(() => {
    if (selectedFilters.size === 0) {
      return categoryFilteredProducts;
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
    return categoryFilteredProducts.filter(p => {
      const id = p.data_id || p.Artikelname;
      return filterProductIds.has(id);
    });
  }, [categoryFilteredProducts, selectedFilters]);

  // Filtere zusätzlich nach Suchanfrage
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return filterCategoryFilteredProducts;
    const lowerQuery = searchQuery.toLowerCase();
    return filterCategoryFilteredProducts.filter(p => 
      p.Artikelname?.toLowerCase().includes(lowerQuery)
    );
  }, [filterCategoryFilteredProducts, searchQuery]);

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
        {...panResponder.panHandlers}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="auto" />
          <View style={styles.dragHandle} />
          <View style={styles.header}>
          <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={closeOverlay} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#2E2C55" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Produkt suchen..."
                placeholderTextColor="#777"
                value={searchQuery}
                onChangeText={onSearchChange}
                autoFocus={false}
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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item, index) => item.data_id || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
              )}
            </SafeAreaView>
          </Animated.View>
          
          {/* Filter Modal */}
          <Modal
            visible={showFilterModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowFilterModal(false)}
          >
            <View style={styles.modalOverlay}>
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
                
                <View style={styles.modalScrollContainer}>
                  <ScrollView 
                    style={styles.modalScrollView} 
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.filterLabelsContainer}>
                      {filterCategories.length > 0 ? (
                        filterCategories.map(filterCategory => {
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
                        })
                      ) : (
                        <Text style={styles.noCategoriesText}>Keine Kategorien verfügbar</Text>
                      )}
                    </View>
                  </ScrollView>
                </View>
                
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
    paddingTop: 16,
    paddingBottom: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
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
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  modalScrollContainer: {
    flex: 1,
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
  noCategoriesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
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
});

