import React, { useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Animated, PanResponder, Dimensions, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
}

interface Order {
  id: string;
  date: string;
  orderNumber: string;
  status: 'completed' | 'pending' | 'cancelled';
  total: number;
  items: OrderItem[];
}

interface OrderHistoryScreenProps {
  onBack: () => void;
  onOrderPress?: (order: Order) => void;
}

// Fiktive Bestellungsdaten
const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    date: '2024-01-15T14:30:00',
    orderNumber: 'ORD-2024-001',
    status: 'completed',
    total: 89.50,
    items: [
      { id: '1', productName: 'Krombacher Pils Alkoholfrei 20x0,5l', quantity: 2, unit: 'Kasten', price: 24.50 },
      { id: '2', productName: 'Warsteiner Premium Pils (0.5l)', quantity: 1, unit: 'Ki (20 Fl)', price: 18.90 },
      { id: '3', productName: 'Sternla Radler (0.5l)', quantity: 1, unit: 'Ki (20 Fl)', price: 21.60 },
    ],
  },
  {
    id: '2',
    date: '2024-01-10T09:15:00',
    orderNumber: 'ORD-2024-002',
    status: 'completed',
    total: 156.30,
    items: [
      { id: '1', productName: 'Pyraser Weizen (0.5l)', quantity: 3, unit: 'Ki (20 Fl)', price: 19.80 },
      { id: '2', productName: 'Glüh Gin (0,7l)', quantity: 2, unit: 'Fl', price: 28.50 },
      { id: '3', productName: 'Mahrs Bräu Pils (0.5l)', quantity: 2, unit: 'Ki (20 Fl)', price: 20.40 },
    ],
  },
  {
    id: '3',
    date: '2024-01-05T16:45:00',
    orderNumber: 'ORD-2024-003',
    status: 'completed',
    total: 234.20,
    items: [
      { id: '1', productName: 'Simon Bräu Weizen Hell (0.5l)', quantity: 4, unit: 'Ki (20 Fl)', price: 22.10 },
      { id: '2', productName: 'Adelholzener iso Kirsch PET (0.5l)', quantity: 2, unit: 'Ki (12 Fl)', price: 15.90 },
      { id: '3', productName: 'Rittmayer Kellerbier (0.5l)', quantity: 3, unit: 'Ki (20 Fl)', price: 19.50 },
      { id: '4', productName: 'Mönchshof Radler Blutorange', quantity: 2, unit: 'Ki', price: 21.80 },
    ],
  },
  {
    id: '4',
    date: '2023-12-28T11:20:00',
    orderNumber: 'ORD-2023-045',
    status: 'completed',
    total: 67.80,
    items: [
      { id: '1', productName: 'Pyraser Leicht Naturtrüb (0.5l)', quantity: 2, unit: 'Ki (20 Fl)', price: 18.90 },
      { id: '2', productName: 'Pyraser Radler (0.5l)', quantity: 1, unit: 'Ki (20 Fl)', price: 20.00 },
      { id: '3', productName: 'Savoia Americano Rosso (0,5l)', quantity: 1, unit: 'Fl', price: 10.00 },
    ],
  },
  {
    id: '5',
    date: '2023-12-20T13:00:00',
    orderNumber: 'ORD-2023-044',
    status: 'completed',
    total: 145.60,
    items: [
      { id: '1', productName: 'Mahrs Bräu Sommerpils (0.5l)', quantity: 3, unit: 'Ki (20 Fl)', price: 21.20 },
      { id: '2', productName: 'Warsteiner Premium Pils (0.5l)', quantity: 2, unit: 'Ki (20 Fl)', price: 18.90 },
      { id: '3', productName: 'Krombacher Pils Alkoholfrei 20x0,5l', quantity: 1, unit: 'Kasten', price: 24.50 },
    ],
  },
];

export default function OrderHistoryScreen({
  onBack,
  onOrderPress,
}: OrderHistoryScreenProps) {
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


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Abgeschlossen';
      case 'pending':
        return 'Ausstehend';
      case 'cancelled':
        return 'Storniert';
      default:
        return status;
    }
  };

  const getTotalItems = (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('de-DE', { month: 'long' });
    const year = date.getFullYear();
    return `${day}. ${month} ${year}`;
  };

  const renderOrder = useCallback(({ item: order }: { item: Order }) => {
    const totalItems = getTotalItems(order);
    const date = formatDate(order.date);
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => {
          if (onOrderPress) {
            onOrderPress(order);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.orderCardContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/trinkkartell.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.companyName}>Trinkkartell GmbH</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.orderDate}>{date}</Text>
            </View>
            <View style={styles.itemRow}>
              <Ionicons name="cube-outline" size={16} color="#666" />
              <Text style={styles.itemCount}>{totalItems} Artikel</Text>
            </View>
          </View>
          <View style={styles.truckIconContainer}>
            <Ionicons name="car-outline" size={24} color="#2E2C55" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [onOrderPress]);

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
              <Text style={styles.headerTitle}>Bestellhistorie</Text>
              <View style={styles.placeholder} />
            </View>
          </View>
          
          {MOCK_ORDERS.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Keine Bestellungen vorhanden</Text>
            </View>
          ) : (
            <FlatList
              data={MOCK_ORDERS}
              renderItem={renderOrder}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
            />
          )}
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
  placeholder: {
    width: 32,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  orderInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  truckIconContainer: {
    marginLeft: 12,
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});

