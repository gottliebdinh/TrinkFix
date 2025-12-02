import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Animated, PanResponder, Dimensions, Keyboard, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { productData } from '../data/json';
import { categories } from '../data/categories';
import ProductItem from '../components/ProductItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CheckoutScreenProps {
  cart: { [key: string]: number };
  cartComments: { [key: string]: string };
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onUpdateQuantity: (id: string, change: number) => void;
  onBack: () => void;
  zIndex?: number;
}

export default function CheckoutScreen({
  cart,
  cartComments,
  favorites,
  onToggleFavorite,
  onUpdateQuantity,
  onBack,
  zIndex = 1001,
}: CheckoutScreenProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('TRINKKARTELL GmbH\nMusterstraße 123\n12345 Musterstadt');
  const [deliveryNote, setDeliveryNote] = useState('');

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

  // Sammle alle Produkte aus dem Warenkorb
  const cartProducts = React.useMemo(() => {
    const products: Product[] = [];
    Object.entries(productData).forEach(([csvFile, categoryProducts]) => {
      if (!Array.isArray(categoryProducts)) return;
      
      categoryProducts.forEach(product => {
        const id = product.data_id || product.Artikelname;
        if (cart[id] && cart[id] > 0) {
          products.push(product);
        }
      });
    });
    return products;
  }, [cart]);

  const totalItems = React.useMemo(() => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  }, [cart]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getNextAvailableDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

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
              <Text style={styles.headerTitle}>Bestellung abschließen</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Lieferung/Abholung Auswahl */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Art der Bestellung</Text>
              <View style={styles.deliveryTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.deliveryTypeButton,
                    deliveryType === 'delivery' && styles.deliveryTypeButtonActive
                  ]}
                  onPress={() => setDeliveryType('delivery')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="car-outline" 
                    size={24} 
                    color={deliveryType === 'delivery' ? '#fff' : '#2E2C55'} 
                  />
                  <Text style={[
                    styles.deliveryTypeText,
                    deliveryType === 'delivery' && styles.deliveryTypeTextActive
                  ]}>
                    Lieferung
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deliveryTypeButton,
                    deliveryType === 'pickup' && styles.deliveryTypeButtonActive
                  ]}
                  onPress={() => setDeliveryType('pickup')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="storefront-outline" 
                    size={24} 
                    color={deliveryType === 'pickup' ? '#fff' : '#2E2C55'} 
                  />
                  <Text style={[
                    styles.deliveryTypeText,
                    deliveryType === 'pickup' && styles.deliveryTypeTextActive
                  ]}>
                    Abholung
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Datumsauswahl */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datum auswählen</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#2E2C55" />
                <Text style={styles.dateButtonText}>
                  {selectedDate ? formatDate(selectedDate) : 'Datum auswählen'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Lieferadresse */}
            {deliveryType === 'delivery' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lieferadresse</Text>
                <View style={styles.addressDisplay}>
                  <Text style={styles.addressText}>{deliveryAddress}</Text>
                </View>
              </View>
            )}

            {/* Notiz an Lieferanten */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notiz an Lieferanten</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Optional: Hinweise für die Lieferung..."
                placeholderTextColor="#999"
                value={deliveryNote}
                onChangeText={setDeliveryNote}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Bestellübersicht */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bestellübersicht</Text>
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>
                  {totalItems} {totalItems === 1 ? 'Artikel' : 'Artikel'}
                </Text>
              </View>
              {cartProducts.map((product) => {
                const id = product.data_id || product.Artikelname;
                const quantity = cart[id] || 0;
                const comment = cartComments[id] || '';
                return (
                  <View key={id} style={styles.summaryItemContainer}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryItemName} numberOfLines={1}>
                        {product.Artikelname}
                      </Text>
                      <Text style={styles.summaryItemQuantity}>x{quantity}</Text>
                    </View>
                    {comment ? (
                      <View style={styles.summaryItemComment}>
                        <Ionicons name="chatbubble-outline" size={14} color="#999" />
                        <Text style={styles.summaryItemCommentText}>{comment}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Bestätigen Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedDate || (deliveryType === 'delivery' && !deliveryAddress.trim())) && styles.confirmButtonDisabled
              ]}
              onPress={() => {
                if (selectedDate && (deliveryType === 'pickup' || deliveryAddress.trim())) {
                  // Hier kann später die Bestellbestätigung erfolgen
                  console.log('Bestellung bestätigen', {
                    deliveryType,
                    selectedDate,
                    deliveryAddress,
                    deliveryNote,
                    cart,
                  });
                }
              }}
              disabled={!selectedDate || (deliveryType === 'delivery' && !deliveryAddress.trim())}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Bestellung bestätigen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Datumsauswahl Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Datum auswählen</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#2E2C55" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dateList}>
              {getNextAvailableDates().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateOption,
                    selectedDate && selectedDate.getTime() === date.getTime() && styles.dateOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setShowDatePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dateOptionText,
                    selectedDate && selectedDate.getTime() === date.getTime() && styles.dateOptionTextSelected
                  ]}>
                    {formatDate(date)}
                  </Text>
                  {selectedDate && selectedDate.getTime() === date.getTime() && (
                    <Ionicons name="checkmark-circle" size={20} color="#2E2C55" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 12,
  },
  deliveryTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  deliveryTypeButtonActive: {
    backgroundColor: '#2E2C55',
    borderColor: '#2E2C55',
  },
  deliveryTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E2C55',
  },
  deliveryTypeTextActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2E2C55',
  },
  addressDisplay: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
  },
  addressText: {
    fontSize: 16,
    color: '#2E2C55',
    lineHeight: 24,
  },
  noteInput: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#2E2C55',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  summaryContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
  },
  summaryItemContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  summaryItemQuantity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E2C55',
  },
  summaryItemComment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingLeft: 2,
    gap: 6,
  },
  summaryItemCommentText: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  footer: {
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
  confirmButton: {
    backgroundColor: '#2E2C55',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    maxHeight: '70%',
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
  dateList: {
    maxHeight: 400,
  },
  dateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateOptionSelected: {
    backgroundColor: '#f5f5f5',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#2E2C55',
  },
  dateOptionTextSelected: {
    fontWeight: '600',
  },
});

