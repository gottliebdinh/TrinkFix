import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Animated, PanResponder, Dimensions, Keyboard, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { productData } from '../data/json';
import ProductItem from '../components/ProductItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OffersScreenProps {
  onBack: () => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  cart: { [key: string]: number };
  onUpdateQuantity: (id: string, change: number) => void;
  shoppingList?: { [key: string]: number };
  onUpdateShoppingListQuantity?: (id: string, change: number) => void;
  onHeaderCartPress?: () => void;
}

// Liste der Angebotsprodukte mit Referenznummern für präzise Zuordnung
const OFFER_PRODUCTS = [
  { name: 'Krombacher Pils Alkoholfrei 20x0,5l', ref: '3494' },
  { name: 'Savoia Americano Rosso (0,5l)', ref: '2128' },
  { name: 'Warsteiner Premium Pils (0.5l)', ref: '3173' },
  { name: 'Sternla Radler (0.5l)', ref: '3121' },
  { name: 'Mönchshof Radler Blutorange', ref: '3571' },
  { name: 'Pyraser Leicht Naturtrüb (0.5l)', ref: '3192' },
  { name: 'Pyraser Weizen (0.5l)', ref: '3305' },
  { name: 'Pyraser Radler (0.5l)', ref: '3430' },
  { name: 'Glüh Gin (0,7l)', ref: '13176' },
  { name: 'Mahrs Bräu Pils (0.5l)', ref: '3130' },
  { name: 'Simon Bräu Weizen Hell (0.5l)', ref: '3249' },
  { name: 'Adelholzener iso Kirsch PET (0.5l)', ref: '8293' },
  { name: 'Rittmayer Kellerbier (0.5l)', ref: '3117' },
  { name: 'Mahrs Bräu Sommerpils (0.5l)', ref: '3355' },
];

const DESCRIPTION_TEXT = `Jetzt gibt's für euch ausgewählte Produkte zu unschlagbaren Konditionen, aber nur solange der Vorrat reicht. Von Klassikern bis hin zu echten Geheimtipps – alles dabei, was das Herz durstig macht. TRINKKARTELL`;

export default function OffersScreen({
  onBack,
  favorites,
  onToggleFavorite,
  cart,
  onUpdateQuantity,
  shoppingList,
  onUpdateShoppingListQuantity,
  onHeaderCartPress,
}: OffersScreenProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  // Finde alle Angebotsprodukte in productData - NUR die spezifizierten Produkte
  const offerProducts = useMemo(() => {
    const foundProducts: (Product & { sortIndex: number })[] = [];
    const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Erstelle ein Set aller gefundenen IDs, um Duplikate zu vermeiden
    const foundIds = new Set<string>();
    
    // Für jedes Angebotsprodukt suche das entsprechende Produkt
    OFFER_PRODUCTS.forEach((offerProduct, index) => {
      let matchedProduct: Product | null = null;
      let bestMatchScore = 0;
      
      // Durchsuche alle Kategorien
      Object.values(productData).forEach((categoryProducts) => {
        if (Array.isArray(categoryProducts)) {
          categoryProducts.forEach(product => {
            const productName = normalizeName(product.Artikelname || '');
            const productRef = product.ref || '';
            const normalizedOffer = normalizeName(offerProduct.name);
            const id = product.data_id || product.Artikelname;
            
            // Überspringe bereits gefundene Produkte
            if (foundIds.has(id)) return;
            
            let matchScore = 0;
            
            // Zuerst prüfe Referenznummer (genaueste Zuordnung) - Score 100
            if (productRef && offerProduct.ref && productRef === offerProduct.ref) {
              matchScore = 100;
            }
            // Dann prüfe exakter Name-Match - Score 90
            else if (productName === normalizedOffer) {
              matchScore = 90;
            }
            // Dann prüfe ob der Angebotsname im Produktnamen enthalten ist - Score 70
            else if (productName.includes(normalizedOffer) && normalizedOffer.length > 15) {
              matchScore = 70;
            }
            // Prüfe ob der Produktname im Angebotsnamen enthalten ist - Score 60
            else if (normalizedOffer.includes(productName) && productName.length > 15) {
              matchScore = 60;
            }
            
            // Wenn dieser Match besser ist als der bisherige, verwende ihn
            if (matchScore > bestMatchScore) {
              matchedProduct = product;
              bestMatchScore = matchScore;
            }
          });
        }
      });
      
      // Wenn Produkt gefunden, füge es hinzu
      if (matchedProduct && bestMatchScore >= 60) {
        const id = matchedProduct.data_id || matchedProduct.Artikelname;
        if (id && !foundIds.has(id)) {
          foundIds.add(id);
          foundProducts.push({ ...matchedProduct, sortIndex: index });
        }
      }
    });
    
    // Sortiere nach der Reihenfolge in OFFER_PRODUCTS
    return foundProducts.sort((a, b) => a.sortIndex - b.sortIndex).map(({ sortIndex, ...product }) => product);
  }, []);

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
        showAddToShoppingList={false}
      />
    );
  }, [cart, favorites, onToggleFavorite, onUpdateQuantity]);

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
              <Text style={styles.headerTitle}>Angebote</Text>
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
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Bild */}
            <Image
              source={require('../assets/events/KartellDeals.jpeg')}
              style={styles.dealsImage}
              resizeMode="cover"
            />
            
            {/* Beschreibung */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{DESCRIPTION_TEXT}</Text>
            </View>
            
            {/* Produktliste */}
            {offerProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="pricetag-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Keine Angebote verfügbar</Text>
              </View>
            ) : (
              <View style={styles.productsContainer}>
                <Text style={styles.productsTitle}>Angebotsprodukte</Text>
                {offerProducts.map((product) => {
                  const id = product.data_id || product.Artikelname;
                  return (
                    <View key={id} style={styles.productWrapper}>
                      {renderProductItem({ item: product })}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
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
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2C55',
    flex: 1,
    textAlign: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dealsImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 20,
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 15,
    color: '#2E2C55',
    lineHeight: 22,
    textAlign: 'center',
  },
  productsContainer: {
    marginTop: 8,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 16,
  },
  productWrapper: {
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});

