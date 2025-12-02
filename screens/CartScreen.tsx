import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, ScrollView, Animated, PanResponder, Dimensions, Keyboard, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { productData } from '../data/json';
import { categories } from '../data/categories';
import ProductItem from '../components/ProductItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CartScreenProps {
  cart: { [key: string]: number };
  cartComments: { [key: string]: string };
  onUpdateQuantity: (id: string, change: number) => void;
  onUpdateComment: (id: string, comment: string) => void;
  onBack: () => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCheckout?: () => void;
  zIndex?: number;
}

export default function CartScreen({
  cart,
  cartComments,
  onUpdateQuantity,
  onUpdateComment,
  onBack,
  favorites,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  onCheckout,
  zIndex = 1000,
}: CartScreenProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

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

  // Gruppiere Produkte nach Kategorien
  const cartProductsByCategory = useMemo(() => {
    const categoryMap: { [categoryId: string]: { category: typeof categories[0], products: Product[] } } = {};
    
    // Sammle alle Produkte aus dem Warenkorb und gruppiere nach Kategorien
    Object.entries(productData).forEach(([csvFile, categoryProducts]) => {
      if (!Array.isArray(categoryProducts)) return;
      
      // Finde die Kategorie für diese CSV-Datei
      const category = categories.find(cat => cat.csvFile === csvFile);
      if (!category || category.id === 'all') return;
      
      // Filtere nur Produkte, die im Warenkorb sind (quantity > 0)
      const cartProductsInCategory = categoryProducts.filter(product => {
        const id = product.data_id || product.Artikelname;
        return cart[id] && cart[id] > 0;
      });
      
      // Nur Kategorien hinzufügen, die tatsächlich Produkte im Warenkorb haben
      if (cartProductsInCategory.length > 0) {
        categoryMap[category.id] = { category, products: cartProductsInCategory };
      }
    });
    
    // Filtere nach Suchanfrage, wenn vorhanden
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      Object.keys(categoryMap).forEach(categoryId => {
        categoryMap[categoryId].products = categoryMap[categoryId].products.filter(item =>
          item.Artikelname?.toLowerCase().includes(query)
        );
        // Entferne Kategorien ohne Produkte nach Filterung
        if (categoryMap[categoryId].products.length === 0) {
          delete categoryMap[categoryId];
        }
      });
    }
    
    // Sortiere Kategorien nach der Reihenfolge in categories
    const sortedCategories = Object.values(categoryMap).sort((a, b) => {
      const indexA = categories.findIndex(cat => cat.id === a.category.id);
      const indexB = categories.findIndex(cat => cat.id === b.category.id);
      return indexA - indexB;
    });
    
    return sortedCategories;
  }, [cart, searchQuery]);

  // Berechne Gesamtsumme
  const totalItems = useMemo(() => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  }, [cart]);

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

  return (
    <View style={[styles.overlayContainer, { zIndex }]}>
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
                    placeholder="Warenkorb durchsuchen..."
                    placeholderTextColor="#777"
                    value={searchQuery}
                    onChangeText={onSearchChange}
                  />
                </View>
              </View>
            </View>
            {totalItems > 0 && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalText}>
                  {totalItems} {totalItems === 1 ? 'Artikel' : 'Artikel'}
                </Text>
              </View>
            )}
          </View>
          
          {cartProductsByCategory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {Object.keys(cart).length === 0 
                  ? 'Warenkorb ist leer' 
                  : 'Keine Artikel gefunden'}
              </Text>
              <Text style={styles.emptySubtext}>
                {Object.keys(cart).length === 0
                  ? 'Füge Artikel zum Warenkorb hinzu, um sie hier zu sehen'
                  : 'Versuche eine andere Suche'}
              </Text>
            </View>
              ) : (
                <>
                  <FlatList
                    data={cartProductsByCategory}
                    renderItem={({ item: categoryGroup }) => (
                      <View style={styles.categorySection}>
                        <Text style={styles.categoryTitle}>{categoryGroup.category.name}</Text>
                        {categoryGroup.products.map((product) => {
                          const id = product.data_id || product.Artikelname;
                          const quantity = cart[id] || 0;
                          const comment = cartComments[id] || '';
                          return (
                            <View key={id} style={styles.productWrapper}>
                              <ProductItem
                                item={product}
                                quantity={quantity}
                                isFavorite={favorites.has(id)}
                                onToggleFavorite={onToggleFavorite}
                                onUpdateQuantity={onUpdateQuantity}
                                showDeleteButton={true}
                                onDelete={(itemId) => onUpdateQuantity(itemId, -quantity)}
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
                    extraData={cart}
                  />
                  {totalItems > 0 && (
                    <View style={styles.floatingButtonContainer}>
                      <TouchableOpacity
                        style={styles.floatingButton}
                        onPress={() => {
                          if (onCheckout) {
                            onCheckout();
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.floatingButtonText}>Bestellung abschließen</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
    paddingBottom: 12,
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
  totalContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Platz für den Floating Button
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
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
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
  },
  floatingButton: {
    backgroundColor: '#2E2C55',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

