import React, { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, PanResponder, Dimensions, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { productData } from '../data/json';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
}

interface Address {
  name: string;
  street: string;
  city: string;
  country: string;
}

interface Order {
  id: string;
  customer: string;
  orderDate: string;
  orderDateRaw: string;
  orderTime: string;
  orderNumber: string;
  deliveryDate: string;
  itemCount: string;
  email: string;
  fromAddress: Address;
  toAddress: Address;
  items: OrderItem[];
  cancelled?: boolean;
}

interface OrderDetailScreenProps {
  order: Order;
  onBack: () => void;
}

export default function OrderDetailScreen({
  order,
  onBack,
}: OrderDetailScreenProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Finde Produktbilder für die Artikel
  const getProductImage = (productName: string): string | null => {
    let imageUrl: string | null = null;
    
    Object.values(productData).forEach((categoryProducts) => {
      if (Array.isArray(categoryProducts)) {
        categoryProducts.forEach(product => {
          // Versuche exakte Übereinstimmung oder Teilübereinstimmung
          if (product.Artikelname && product.BildURL) {
            if (product.Artikelname === productName || 
                product.Artikelname.includes(productName) ||
                productName.includes(product.Artikelname.split(' ')[0])) {
              imageUrl = product.BildURL;
            }
          }
        });
      }
    });
    
    return imageUrl;
  };

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
              <Text style={styles.headerTitle}>Bestelldetails</Text>
              <View style={styles.placeholder} />
            </View>
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Von Adresse */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Von</Text>
              </View>
              <Text style={styles.addressName}>{order.fromAddress.name}</Text>
              <Text style={styles.addressText}>{order.fromAddress.street}</Text>
              <Text style={styles.addressText}>{order.fromAddress.city}</Text>
              <Text style={styles.addressText}>{order.fromAddress.country}</Text>
            </View>

            {/* Zu Adresse */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Zu</Text>
              </View>
              <Text style={styles.addressName}>{order.toAddress.name}</Text>
              <Text style={styles.addressText}>{order.toAddress.street}</Text>
              <Text style={styles.addressText}>{order.toAddress.city}</Text>
              <Text style={styles.addressText}>{order.toAddress.country}</Text>
            </View>

            {/* Bestelldatum */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Bestelldatum</Text>
              </View>
              <Text style={styles.infoText}>{order.orderDate}</Text>
            </View>

            {/* Lieferungsdatum */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Lieferungsdatum</Text>
              </View>
              <Text style={styles.infoText}>{order.deliveryDate}</Text>
            </View>

            {/* Bestellnummer */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="receipt-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Bestellnummer</Text>
              </View>
              <Text style={styles.infoText}>{order.orderNumber}</Text>
            </View>

            {/* Email */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="mail-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Email</Text>
              </View>
              <Text style={styles.infoText}>{order.email}</Text>
            </View>

            {/* Bestellliste */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cube-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Bestellliste</Text>
              </View>
              {order.items && order.items.map((item, index) => {
                const productImage = getProductImage(item.name);
                return (
                  <View key={index} style={styles.orderItem}>
                    {productImage ? (
                      <View style={styles.productImageContainer}>
                        <Image 
                          source={{ uri: productImage }} 
                          style={styles.productImage}
                          resizeMode="contain"
                        />
                      </View>
                    ) : (
                      <View style={styles.productImageContainer}>
                        <Ionicons name="cube-outline" size={24} color="#ccc" />
                      </View>
                    )}
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName}>{item.name}</Text>
                      <Text style={styles.orderItemDetails}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
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
    zIndex: 1100,
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E2C55',
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    color: '#2E2C55',
    marginBottom: 4,
    fontWeight: '500',
  },
  orderItemQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemQuantity: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  orderItemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

