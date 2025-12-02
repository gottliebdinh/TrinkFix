import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';

interface ProductItemProps {
  item: Product;
  quantity: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onUpdateQuantity: (id: string, change: number) => void;
}

export default function ProductItem({
  item,
  quantity,
  isFavorite,
  onToggleFavorite,
  onUpdateQuantity,
}: ProductItemProps) {
  const id = item.data_id || item.Artikelname;

  return (
    <View style={styles.productItem}>
      <Image
        source={{ uri: item.BildURL || 'https://via.placeholder.com/80' }}
        style={styles.productImage}
        resizeMode="contain"
        defaultSource={require('../assets/icon.png')}
      />
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.Artikelname}
          </Text>
          <TouchableOpacity 
            onPress={() => onToggleFavorite(id)}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={22} 
              color={isFavorite ? "#FF3B30" : "#999"} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.productType}>
          {item.unit_title || item.unit_value || 'Flasche'}
          {item.volume_liters && ` • ${item.volume_liters}l`}
        </Text>
        <View style={styles.cartControls}>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(id, -1)}
              disabled={quantity === 0}
            >
              <Ionicons 
                name="remove" 
                size={18} 
                color={quantity === 0 ? "#ccc" : "#2E2C55"} 
              />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(id, 1)}
            >
              <Ionicons 
                name="add" 
                size={18} 
                color="#2E2C55" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  productItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 14,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    color: '#2E2C55',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  productType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    marginBottom: 8,
  },
  cartControls: {
    marginTop: 'auto',
    alignSelf: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
    minWidth: 30,
    textAlign: 'center',
    marginHorizontal: 8,
  },
});

