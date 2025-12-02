import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, PanResponder, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ordersData from '../data/Bestellungen/orders.json';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Customer {
  id: string;
  name: string;
  type: 'restaurant' | 'club' | 'bar';
  activityLevel: 'aktiv' | 'ruhend' | 'inaktiv' | 'passiv';
  status: string;
  group: string;
  country: string;
  phone?: string;
  averageOrderValue?: number;
  orderFrequency?: string;
  revenueYTD?: number;
  salesRep?: string;
  deliveryDays?: string[];
  pricesVisible?: boolean;
  minOrderQuantity?: number;
  notificationsEnabled?: boolean;
}

interface CustomerDetailScreenProps {
  customer: Customer;
  onBack: () => void;
}

export default function CustomerDetailScreen({
  customer,
  onBack,
}: CustomerDetailScreenProps) {
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

  // Finde letzte Bestellungen für diesen Kunden
  const customerOrders = (ordersData as any[])
    .filter(order => order.customer === customer.name)
    .slice(0, 3);

  const getStatusLabelColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('bestellt')) {
      if (statusLower.includes('vor') && statusLower.includes('tag')) {
        const dayMatch = statusLower.match(/vor (\d+) tag/i);
        if (dayMatch) {
          const days = parseInt(dayMatch[1], 10);
          if (days <= 14) {
            return '#4CAF50';
          } else if (days <= 21) {
            return '#FFC107';
          } else if (days < 30) {
            return '#F44336';
          } else {
            return '#F44336';
          }
        }
      }
      
      if (statusLower.includes('vor') && statusLower.includes('monat')) {
        if (statusLower.includes('einem monat') || statusLower.includes('ein monat') || statusLower.includes('1 monat')) {
          return '#F44336';
        }
        
        const monthMatch = statusLower.match(/vor (\d+) monat/i);
        if (monthMatch) {
          const months = parseInt(monthMatch[1], 10);
          if (months < 3) {
            return '#F44336';
          } else {
            return '#9E9E9E';
          }
        }
        
        if (statusLower.includes('2 monat')) {
          return '#F44336';
        }
        
        if (statusLower.includes('3 monat') || statusLower.includes('4 monat') || 
            statusLower.includes('5 monat') || statusLower.includes('6 monat')) {
          return '#9E9E9E';
        }
      }
      
      if (statusLower.includes('vor') && (statusLower.includes('jahr') || statusLower.includes('jahre'))) {
        return '#9E9E9E';
      }
    }
    
    if (statusLower.includes('noch keine bestellung seit')) {
      if (statusLower.includes('tag')) {
        const dayMatch = statusLower.match(/seit (\d+) tag/i);
        if (dayMatch) {
          const days = parseInt(dayMatch[1], 10);
          if (days > 21) {
            return '#F44336';
          }
        }
      }
      
      if (statusLower.includes('monat') || statusLower.includes('jahr')) {
        return '#F44336';
      }
    }
    
    return '#9E9E9E';
  };

  const statusColor = getStatusLabelColor(customer.status);

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
              <Text style={styles.headerTitle}>Kundendetails</Text>
              <View style={styles.placeholder} />
            </View>
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Name, Label, Telefonnummer, Buttons */}
            <View style={styles.section}>
              <View style={styles.customerHeader}>
                <View style={styles.customerIconContainer}>
                  <Ionicons name="person" size={32} color="#2E2C55" />
                </View>
                <View style={styles.customerHeaderInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <View style={[styles.customerStatusLabel, { backgroundColor: statusColor }]}>
                    <Text style={styles.customerStatusText}>{customer.status}</Text>
                  </View>
                  {customer.phone && (
                    <View style={styles.phoneRow}>
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={styles.phoneText}>{customer.phone}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                  <Ionicons name="chatbubble-outline" size={24} color="#2E2C55" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                  <Ionicons name="person-add-outline" size={24} color="#2E2C55" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Statistik */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Statistik</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Durch. Bestellwert</Text>
                <Text style={styles.statValue}>{customer.averageOrderValue ? `€${customer.averageOrderValue.toFixed(2)}` : 'N/A'}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Bestellfrequenz</Text>
                <Text style={styles.statValue}>{customer.orderFrequency || 'N/A'}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Umsatz YTD</Text>
                <Text style={styles.statValue}>{customer.revenueYTD ? `€${customer.revenueYTD.toLocaleString('de-DE')}` : 'N/A'}</Text>
              </View>
            </View>

            {/* Letzte Bestellungen */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="receipt-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Letzte Bestellungen</Text>
              </View>
              {customerOrders.length === 0 ? (
                <Text style={styles.noDataText}>Noch keine Bestellung</Text>
              ) : (
                customerOrders.map((order, index) => (
                  <View key={index} style={styles.orderRow}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                      <Text style={styles.orderDate}>{order.orderDate}</Text>
                    </View>
                    <Text style={styles.orderItems}>{order.itemCount} Artikel</Text>
                  </View>
                ))
              )}
            </View>

            {/* Zugewiesener Vertriebsmitarbeiter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Zugewiesener Vertriebsmitarbeiter</Text>
              </View>
              <Text style={styles.infoText}>
                {customer.salesRep || 'Kein Vertriebsmitarbeiter zugewiesen'}
              </Text>
            </View>

            {/* Kundeneinstellungen */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="settings-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Kundeneinstellungen</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Liefertage</Text>
                <Text style={styles.settingValue}>
                  {customer.deliveryDays && customer.deliveryDays.length > 0 
                    ? customer.deliveryDays.join(', ') 
                    : 'Nicht festgelegt'}
                </Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Preise sichtbar</Text>
                <Text style={styles.settingValue}>
                  {customer.pricesVisible ? 'Ja' : 'Nein'}
                </Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Mindestbestellmenge</Text>
                <Text style={styles.settingValue}>
                  {customer.minOrderQuantity ? `${customer.minOrderQuantity}` : 'Nicht festgelegt'}
                </Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Gruppe</Text>
                <Text style={styles.settingValue}>
                  {customer.group || 'Standardgruppe'}
                </Text>
              </View>
            </View>

            {/* Benachrichtigung */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="notifications-outline" size={18} color="#666" />
                <Text style={styles.sectionTitle}>Benachrichtigung</Text>
              </View>
              <Text style={styles.infoText}>
                {customer.notificationsEnabled ? 'Aktiviert' : 'Nicht aktiviert'}
              </Text>
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
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerHeaderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 8,
  },
  customerStatusLabel: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  customerStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E2C55',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E2C55',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderItems: {
    fontSize: 14,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    color: '#2E2C55',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E2C55',
  },
});

