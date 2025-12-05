import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, Animated, PanResponder, Dimensions, Keyboard, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { productData } from '../data/json';
import { categories } from '../data/categories';
import ProductItem from '../components/ProductItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fuzzy Search Funktionen (gleiche wie in ProductListScreen)
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
};

const isSimilar = (query: string, productName: string, threshold: number = 0.6): boolean => {
  const queryLower = query.toLowerCase().trim();
  const productLower = productName.toLowerCase().trim();
  
  if (productLower.includes(queryLower) || queryLower.includes(productLower)) {
    return true;
  }
  
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const productWords = productLower.split(/\s+/).filter(w => w.length > 2);
  
  for (const queryWord of queryWords) {
    for (const productWord of productWords) {
      const similarity = calculateSimilarity(queryWord, productWord);
      if (similarity >= threshold) {
        return true;
      }
    }
  }
  
  const overallSimilarity = calculateSimilarity(queryLower, productLower);
  return overallSimilarity >= threshold;
};

interface ShoppingListScreenProps {
  shoppingList: { [key: string]: number };
  shoppingListComments: { [key: string]: string };
  onUpdateQuantity: (id: string, change: number) => void;
  onRemoveFromShoppingList?: (id: string) => void;
  onUpdateComment: (id: string, comment: string) => void;
  onBack: () => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddProduct?: () => void;
  cart?: { [key: string]: number };
  onHeaderCartPress?: () => void;
  onUpdateCartQuantity?: (id: string, change: number) => void;
}

export default function ShoppingListScreen({
  shoppingList,
  shoppingListComments,
  onUpdateQuantity,
  onRemoveFromShoppingList,
  onUpdateComment,
  onBack,
  favorites,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  onAddProduct,
  cart = {},
  onHeaderCartPress,
  onUpdateCartQuantity,
}: ShoppingListScreenProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);

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
        return gestureState.y0 < 80;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 5 && gestureState.y0 < 80;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          opacity.setValue(1 - gestureState.dy / SCREEN_HEIGHT);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 150) {
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

  // Filtere Kategorien für Filter-Modal
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

  // Sammle alle Produkte aus der Einkaufsliste mit ihrer Kategorie
  const shoppingListProducts = useMemo(() => {
    const productsWithCategory: Array<{ product: Product; category: typeof categories[0] }> = [];
    
    Object.entries(productData).forEach(([csvFile, categoryProducts]) => {
      if (!Array.isArray(categoryProducts)) return;
      
      const category = categories.find(cat => cat.csvFile === csvFile);
      if (!category || category.id === 'all') return;
      
      categoryProducts.forEach(product => {
        const id = product.data_id || product.Artikelname;
        // Zeige alle Produkte an, die in der Einkaufsliste sind (auch mit Menge 0)
        if (shoppingList[id] !== undefined) {
          productsWithCategory.push({ product, category });
        }
      });
    });
    
    return productsWithCategory;
  }, [shoppingList]);

  // Filtere nach ausgewählten Filter-Kategorien
  const filterCategoryFilteredProducts = useMemo(() => {
    if (selectedFilters.size === 0) {
      return shoppingListProducts;
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
    return shoppingListProducts.filter(({ product }) => {
      const id = product.data_id || product.Artikelname;
      return filterProductIds.has(id);
    });
  }, [shoppingListProducts, selectedFilters]);

  // Filtere zusätzlich nach Suchanfrage mit Fuzzy Search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return filterCategoryFilteredProducts;
    }
    
    const query = searchQuery.trim();
    const lowerQuery = query.toLowerCase();
    
    // Zuerst exakte Treffer suchen
    const exactMatches = filterCategoryFilteredProducts.filter(({ product }) =>
      product.Artikelname?.toLowerCase().includes(lowerQuery)
    );
    
    // Wenn exakte Treffer gefunden wurden, diese zurückgeben
    if (exactMatches.length > 0) {
      return exactMatches;
    }
    
    // Wenn keine exakten Treffer, Fuzzy Search verwenden
    const fuzzyMatches = filterCategoryFilteredProducts
      .map(({ product }) => ({
        item: { product },
        similarity: product.Artikelname ? calculateSimilarity(lowerQuery, product.Artikelname.toLowerCase()) : 0,
        isSimilar: product.Artikelname ? isSimilar(query, product.Artikelname, 0.5) : false
      }))
      .filter(item => item.isSimilar)
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.item);
    
    return fuzzyMatches;
  }, [filterCategoryFilteredProducts, searchQuery]);

  // Gruppiere gefilterte Produkte nach Kategorien
  const shoppingListProductsByCategory = useMemo(() => {
    const categoryMap: { [categoryId: string]: { category: typeof categories[0], products: Product[] } } = {};
    
    filteredProducts.forEach(({ product, category }) => {
      if (!categoryMap[category.id]) {
        categoryMap[category.id] = { category, products: [] };
      }
      categoryMap[category.id].products.push(product);
    });
    
    const sortedCategories = Object.values(categoryMap).sort((a, b) => {
      const indexA = categories.findIndex(cat => cat.id === a.category.id);
      const indexB = categories.findIndex(cat => cat.id === b.category.id);
      return indexA - indexB;
    });
    
    return sortedCategories;
  }, [filteredProducts]);

  const totalItems = useMemo(() => {
    return Object.values(shoppingList).reduce((sum, quantity) => sum + quantity, 0);
  }, [shoppingList]);

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
                placeholder="Einkaufsliste suchen..."
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
          
          {shoppingListProductsByCategory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {Object.keys(shoppingList).length === 0 
                  ? 'Einkaufsliste ist leer' 
                  : 'Keine Artikel gefunden'}
              </Text>
              <Text style={styles.emptySubtext}>
                {Object.keys(shoppingList).length === 0
                  ? 'Plane Deine Einkäufe und füge sie hier hinzu'
                  : 'Versuche eine andere Suche'}
              </Text>
              {onAddProduct && (
                <TouchableOpacity
                  style={styles.addProductButton}
                  onPress={onAddProduct}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addProductButtonText}>Produkt hinzufügen</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <FlatList
                data={shoppingListProductsByCategory}
                renderItem={({ item: categoryGroup }) => (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>{categoryGroup.category.name}</Text>
                    {categoryGroup.products.map((product) => {
                      const id = product.data_id || product.Artikelname;
                      const quantity = shoppingList[id] || 0;
                      const comment = shoppingListComments[id] || '';
                      return (
                        <View key={id} style={styles.productWrapper}>
                          <ProductItem
                            item={product}
                            quantity={quantity}
                            isFavorite={favorites.has(id)}
                            onToggleFavorite={onToggleFavorite}
                            onUpdateQuantity={(itemId, change) => {
                              // Aktualisiere Einkaufsliste (synchronisiert automatisch mit Warenkorb)
                              onUpdateQuantity(itemId, change);
                            }}
                            showDeleteButton={true}
                            onDelete={(itemId) => {
                              // Entferne komplett aus Einkaufsliste
                              if (onRemoveFromShoppingList) {
                                onRemoveFromShoppingList(itemId);
                              } else {
                                onUpdateQuantity(itemId, -quantity);
                              }
                            }}
                            showCommentButton={true}
                            onCommentPress={(itemId) => {
                              setSelectedProductId(itemId);
                              setCommentText(comment);
                              setCommentModalVisible(true);
                            }}
                            hasComment={!!comment}
                          />
                          {comment ? (
                            <View style={styles.commentContainer}>
                              <Text style={styles.commentText}>{comment}</Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
                keyExtractor={(item) => item.category.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                initialNumToRender={5}
                windowSize={5}
                removeClippedSubviews={false}
                nestedScrollEnabled={true}
                style={styles.flatList}
                extraData={shoppingList}
              />
              <View style={styles.floatingButtonContainer}>
                {onAddProduct && (
                  <TouchableOpacity
                    style={styles.addProductFloatingButton}
                    onPress={onAddProduct}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle" size={20} color="#2E2C55" />
                    <Text style={styles.addProductFloatingButtonText}>Produkt hinzufügen</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Animated.View>
      
      {/* Kommentar Modal */}
      <Modal
        visible={commentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setCommentModalVisible(false);
            }}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kommentar hinzufügen</Text>
              <TouchableOpacity 
                onPress={() => {
                  Keyboard.dismiss();
                  setCommentModalVisible(false);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#2E2C55" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Kommentar eingeben..."
              placeholderTextColor="#999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              numberOfLines={4}
              autoFocus
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setCommentModalVisible(false);
                  setCommentText('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => {
                  if (selectedProductId) {
                    onUpdateComment(selectedProductId, commentText);
                  }
                  Keyboard.dismiss();
                  setCommentModalVisible(false);
                  setCommentText('');
                  setSelectedProductId(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSaveButtonText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <TouchableOpacity 
            style={styles.filterModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.filterModalContent}>
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
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    height: SCREEN_HEIGHT * 0.95,
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
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8f0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  noFiltersText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 0,
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
  totalContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E2C55',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
  addProductButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2C55',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productWrapper: {
    marginBottom: 12,
  },
  commentContainer: {
    marginTop: -4,
    padding: 12,
    paddingTop: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2E2C55',
  },
  commentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 12,
  },
  addProductFloatingButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 2,
    borderColor: '#2E2C55',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  addProductFloatingButtonText: {
    color: '#2E2C55',
    fontSize: 18,
    fontWeight: '600',
  },
  floatingButton: {
    backgroundColor: '#2E2C55',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonIcon: {
    marginRight: 4,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  flatList: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
  commentInput: {
    minHeight: 120,
    padding: 16,
    fontSize: 16,
    color: '#2E2C55',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    margin: 20,
    marginBottom: 0,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#2E2C55',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2E2C55',
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  filterModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  filterModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterModalContent: {
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

