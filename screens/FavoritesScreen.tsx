import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { productData } from '../data/json';
import ProductItem from '../components/ProductItem';

interface FavoritesScreenProps {
  favorites: Set<string>;
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
  cart,
  onToggleFavorite,
  onUpdateQuantity,
  onBack,
  searchQuery,
  onSearchChange,
  onHeaderCartPress,
}: FavoritesScreenProps) {
  // Sammle alle favorisierten Produkte aus allen Kategorien
  const favoriteProducts = useMemo(() => {
    const allProducts: Product[] = [];
    Object.values(productData).forEach((categoryProducts) => {
      if (Array.isArray(categoryProducts)) {
        allProducts.push(...categoryProducts);
      }
    });
    
    return allProducts.filter(product => {
      const id = product.data_id || product.Artikelname;
      return favorites.has(id);
    });
  }, [favorites]);

  // Filtere Produkte basierend auf Suchanfrage
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return favoriteProducts;
    }
    const query = searchQuery.toLowerCase();
    return favoriteProducts.filter(item =>
      item.Artikelname?.toLowerCase().includes(query)
    );
  }, [favoriteProducts, searchQuery]);

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
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favoriten</Text>
        <Text style={styles.headerSubtitle}>{filteredProducts.length} Artikel</Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Produkt suchen..."
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
          renderItem={renderProductItem}
          keyExtractor={(item) => item.data_id || item.Artikelname || ''}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E2C55',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E2C55',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
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
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 10,
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
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
});

