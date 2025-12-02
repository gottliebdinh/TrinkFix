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
  showDeleteButton?: boolean;
  onDelete?: (id: string) => void;
  showCommentButton?: boolean;
  onCommentPress?: (id: string) => void;
  hasComment?: boolean;
}

export default function ProductItem({
  item,
  quantity,
  isFavorite,
  onToggleFavorite,
  onUpdateQuantity,
  showDeleteButton = false,
  onDelete,
  showCommentButton = false,
  onCommentPress,
  hasComment = false,
}: ProductItemProps) {
  const id = item.data_id || item.Artikelname;

  // Berechne die Gesamtanzahl der Flaschen
  const calculateTotalBottles = () => {
    if (quantity === 0) return '';
    
    const unitTitle = item.unit_title || '';
    const unitValue = item.unit_value || '';
    
    // Extrahiere die Anzahl der Flaschen aus der Einheit
    let bottlesPerUnit = 1;
    let unitLabel = 'Fl'; // Standard Label
    
    // Prüfe auf "Ki (X Fl)" oder "Ki (X Dose)" Format
    const kiMatch = unitTitle.match(/Ki\s*\((\d+)\s*(?:Fl|Dose)\)/i);
    if (kiMatch) {
      bottlesPerUnit = parseInt(kiMatch[1], 10);
      unitLabel = 'Fl';
    }
    // Prüfe auf "Krt (X Fl)" Format
    else if (unitTitle.match(/Krt\s*\((\d+)\s*Fl\)/i)) {
      const krtMatch = unitTitle.match(/Krt\s*\((\d+)\s*Fl\)/i);
      if (krtMatch) {
        bottlesPerUnit = parseInt(krtMatch[1], 10);
        unitLabel = 'Fl';
      }
    }
    // Prüfe auf "Träger (X Fl)" Format
    else if (unitTitle.match(/Träger\s*\((\d+)\s*Fl\)/i)) {
      const traegerMatch = unitTitle.match(/Träger\s*\((\d+)\s*Fl\)/i);
      if (traegerMatch) {
        bottlesPerUnit = parseInt(traegerMatch[1], 10);
        unitLabel = 'Fl';
      }
    }
    // Prüfe auf "Tray (X Dosen)" Format
    else if (unitTitle.match(/Tray\s*\((\d+)\s*Dosen\)/i)) {
      const trayMatch = unitTitle.match(/Tray\s*\((\d+)\s*Dosen\)/i);
      if (trayMatch) {
        bottlesPerUnit = parseInt(trayMatch[1], 10);
        unitLabel = 'Dosen';
      }
    }
    // Prüfe auf "Fass" - Standard Fassgröße (z.B. 30l oder 50l, aber wir zeigen es als Fass an)
    else if (unitTitle.match(/^Fass$/i) || unitValue === 'fass') {
      bottlesPerUnit = 1;
      unitLabel = 'Fass';
    }
    // Bei "Fl", "Flasche" oder ähnlichem bleibt es bei 1
    else if (unitTitle.match(/^Fl\.?$|^FL$/i) || unitValue === 'fl' || unitValue === 'flasche') {
      bottlesPerUnit = 1;
      unitLabel = 'Fl';
    }
    // Bei "Flasche" (ausgeschrieben)
    else if (unitTitle.match(/^Flasche$/i) || unitValue === 'flasche') {
      bottlesPerUnit = 1;
      unitLabel = 'Fl';
    }
    // Bei "Kiste" ohne Anzahl
    else if (unitTitle.match(/^Kiste$/i) || unitValue === 'kiste') {
      bottlesPerUnit = 1;
      unitLabel = 'Kiste';
    }
    // Bei "Karton"
    else if (unitTitle.match(/^Karton$/i) || unitValue === 'karton') {
      bottlesPerUnit = 1;
      unitLabel = 'Karton';
    }
    // Bei "Tray" ohne Anzahl
    else if (unitTitle.match(/^Tray$/i) || unitValue === 'tray') {
      bottlesPerUnit = 1;
      unitLabel = 'Tray';
    }
    // Bei "Kanister"
    else if (unitTitle.match(/^Kanister$/i) || unitValue === 'kanister') {
      bottlesPerUnit = 1;
      unitLabel = 'Kanister';
    }
    
    const totalBottles = quantity * bottlesPerUnit;
    
    // Zeige immer an, wenn quantity > 0
    if (quantity > 0) {
      if (bottlesPerUnit > 1) {
        // Bei Kisten/Trägern etc. zeige Gesamtanzahl
        return `= ${totalBottles} ${unitLabel}`;
      } else {
        // Bei Einzelstücken zeige die Anzahl
        return `= ${quantity} ${unitLabel}`;
      }
    }
    
    return '';
  };

  const totalBottlesText = calculateTotalBottles();

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
          <View style={styles.headerActions}>
            {showCommentButton && (
              <TouchableOpacity 
                onPress={() => onCommentPress && onCommentPress(id)}
                style={styles.commentButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={hasComment ? "pencil" : "pencil-outline"} 
                  size={24} 
                  color={hasComment ? "#2E2C55" : "#666"} 
                />
              </TouchableOpacity>
            )}
            {showDeleteButton && onDelete ? (
              <TouchableOpacity 
                onPress={() => onDelete(id)}
                style={styles.favoriteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={22} 
                  color="#FF3B30" 
                />
              </TouchableOpacity>
            ) : (
              !showCommentButton && (
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
              )
            )}
          </View>
        </View>
        <View style={styles.productTypeRow}>
          <Text style={styles.productType}>
            {item.unit_title || item.unit_value || 'Flasche'}
            {item.volume_liters && ` • ${item.volume_liters}l`}
          </Text>
          {totalBottlesText ? (
            <Text style={styles.totalBottlesText}>{totalBottlesText}</Text>
          ) : null}
        </View>
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
    alignItems: 'center',
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
    alignSelf: 'center',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
    marginLeft: 8,
  },
  commentButton: {
    padding: 4,
    backgroundColor: 'transparent',
  },
  productTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    flex: 1,
  },
  cartControls: {
    marginTop: 'auto',
    alignSelf: 'flex-end',
  },
  totalBottlesText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
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

