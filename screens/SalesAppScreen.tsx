import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Animated, Dimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import customersData from '../data/Kunden/customers.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Customer {
  id: string;
  name: string;
  type: 'restaurant' | 'club' | 'bar';
  activityLevel: 'aktiv' | 'ruhend' | 'inaktiv' | 'passiv';
  status: string;
  group: string;
  country: string;
}

interface SalesAppScreenProps {
  onBack: () => void;
  onCustomerPress?: () => void;
  onOrdersPress?: () => void;
  onChatPress?: () => void;
  onInactiveCustomersPress?: () => void;
  onShowInactiveCustomers?: () => void;
}

export default function SalesAppScreen({
  onBack,
  onCustomerPress,
  onOrdersPress,
  onChatPress,
  onInactiveCustomersPress,
  onShowInactiveCustomers,
}: SalesAppScreenProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarTranslateX = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;
  const sidebarOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Bestimme das Aktivitätslevel basierend auf dem Status-Text
  const getActivityLevelFromStatus = (status: string): string => {
    const statusLower = status.toLowerCase();
    
    // Prüfe ob es ein Bestelldatum gibt
    if (statusLower.includes('bestellt')) {
      // Tage: aktiv wenn <= 14, ruhend wenn 15-20, inaktiv wenn >= 21
      if (statusLower.includes('vor') && statusLower.includes('tag')) {
        const dayMatch = statusLower.match(/vor (\d+) tag/i);
        if (dayMatch) {
          const days = parseInt(dayMatch[1], 10);
          if (days <= 14) {
            return 'aktiv';
          } else if (days <= 20) {
            return 'ruhend';
          } else {
            return 'inaktiv';
          }
        }
      }
      
      // Monate: inaktiv wenn 1-2 Monate, passiv ab 3 Monaten
      if (statusLower.includes('vor') && statusLower.includes('monat')) {
        if (statusLower.includes('einem monat') || statusLower.includes('ein monat') || statusLower.includes('1 monat')) {
          return 'inaktiv';
        }
        
        const monthMatch = statusLower.match(/vor (\d+) monat/i);
        if (monthMatch) {
          const months = parseInt(monthMatch[1], 10);
          if (months < 3) {
            return 'inaktiv';
          } else {
            return 'passiv';
          }
        }
        
        if (statusLower.includes('2 monat')) {
          return 'inaktiv';
        }
        
        if (statusLower.includes('3 monat') || statusLower.includes('4 monat') || 
            statusLower.includes('5 monat') || statusLower.includes('6 monat')) {
          return 'passiv';
        }
      }
      
      // Jahre: immer passiv
      if (statusLower.includes('vor') && (statusLower.includes('jahr') || statusLower.includes('jahre'))) {
        return 'passiv';
      }
    }
    
    // "Noch keine Bestellung seit" - inaktiv wenn mehr als 21 Tage
    if (statusLower.includes('noch keine bestellung seit')) {
      if (statusLower.includes('tag')) {
        const dayMatch = statusLower.match(/seit (\d+) tag/i);
        if (dayMatch) {
          const days = parseInt(dayMatch[1], 10);
          if (days > 21) {
            return 'inaktiv';
          }
        }
      }
      
      if (statusLower.includes('monat')) {
        return 'inaktiv';
      }
      if (statusLower.includes('jahr')) {
        return 'passiv';
      }
    }
    
    return 'passiv';
  };

  // Finde die ersten 3 inaktiven Kunden
  const inactiveCustomers = useMemo(() => {
    const allCustomers = customersData as Customer[];
    const inactive = allCustomers
      .filter(customer => getActivityLevelFromStatus(customer.status) === 'inaktiv')
      .slice(0, 3);
    return inactive;
  }, []);

  useEffect(() => {
    if (showSidebar) {
      Animated.parallel([
        Animated.spring(sidebarTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }),
        Animated.timing(sidebarOverlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(sidebarTranslateX, {
          toValue: -SCREEN_WIDTH * 0.8,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }),
        Animated.timing(sidebarOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSidebar]);

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <SafeAreaView style={styles.safeAreaTop}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowSidebar(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={28} color="#2E2C55" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>VERTRIEBSAPP</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Inaktive Kunden Section */}
        <View style={styles.inactiveSection}>
        <View style={styles.inactiveHeaderRow}>
          <TouchableOpacity 
            style={styles.inactiveHeader}
            onPress={onInactiveCustomersPress}
            activeOpacity={0.7}
          >
            <Ionicons name="person-remove-outline" size={20} color="#2E2C55" />
            <Text style={styles.inactiveHeaderText}>Inaktive Kunden</Text>
          </TouchableOpacity>
          {onShowInactiveCustomers && (
            <TouchableOpacity 
              onPress={onShowInactiveCustomers}
              activeOpacity={0.7}
            >
              <Text style={styles.moreLink}>Mehr anzeigen</Text>
            </TouchableOpacity>
          )}
        </View>
        {inactiveCustomers.length > 0 && (
          <View style={styles.inactiveCustomersList}>
            {inactiveCustomers.map((customer) => {
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
                <View key={customer.id} style={styles.inactiveCustomerItem}>
                  <View style={styles.inactiveCustomerIconContainer}>
                    <Ionicons name="person" size={24} color="#2E2C55" />
                  </View>
                  <View style={styles.inactiveCustomerContent}>
                    <Text style={styles.inactiveCustomerName} numberOfLines={2}>{customer.name}</Text>
                    <View style={[styles.inactiveCustomerStatusLabel, { backgroundColor: statusColor }]}>
                      <Text style={styles.inactiveCustomerStatusText} numberOfLines={1}>{customer.status}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Schnellaktionen</Text>
        <TouchableOpacity 
          style={styles.menuCard}
          onPress={onCustomerPress}
          activeOpacity={0.7}
        >
          <View style={styles.menuCardIcon}>
            <Ionicons name="people-outline" size={32} color="#2E2C55" />
          </View>
          <Text style={styles.menuCardTitle}>Kunde</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={onOrdersPress}
          activeOpacity={0.7}
        >
          <View style={styles.menuCardIcon}>
            <Ionicons name="receipt-outline" size={32} color="#2E2C55" />
          </View>
          <Text style={styles.menuCardTitle}>Bestellungen</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={onChatPress}
          activeOpacity={0.7}
        >
          <View style={styles.menuCardIcon}>
            <Ionicons name="chatbubble-outline" size={32} color="#2E2C55" />
          </View>
          <Text style={styles.menuCardTitle}>Chat</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
      
      {/* Sidebar Overlay */}
      {showSidebar && (
        <>
          <Animated.View 
            style={[
              styles.sidebarOverlay,
              {
                opacity: sidebarOverlayOpacity,
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.sidebarOverlayTouchable}
              activeOpacity={1}
              onPress={closeSidebar}
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.sidebar,
              {
                transform: [{ translateX: sidebarTranslateX }],
              }
            ]}
          >
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Menü</Text>
              <TouchableOpacity 
                onPress={closeSidebar}
                style={styles.sidebarCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#2E2C55" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sidebarContent}>
              <TouchableOpacity 
                style={styles.sidebarItem}
                onPress={() => {
                  closeSidebar();
                  onBack();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={24} color="#2E2C55" />
                <Text style={styles.sidebarItemText}>Zu Kunden Sicht</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  safeAreaTop: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  header: {
    backgroundColor: '#fff',
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
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
    marginLeft: 4,
    width: 40,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E2C55',
    textAlign: 'center',
  },
  placeholder: {
    position: 'absolute',
    right: 0,
    width: 40,
  },
  inactiveSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    marginBottom: 16,
  },
  inactiveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inactiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  moreLink: {
    fontSize: 14,
    color: '#2E2C55',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  inactiveHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E2C55',
    textAlign: 'center',
  },
  inactiveCustomersList: {
    marginTop: 12,
  },
  inactiveCustomerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveCustomerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  inactiveCustomerContent: {
    flex: 1,
  },
  inactiveCustomerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E2C55',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  inactiveCustomerStatusLabel: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  inactiveCustomerStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E2C55',
    marginBottom: 16,
    textAlign: 'left',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
  menuCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2C55',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebarOverlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.8,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E2C55',
  },
  sidebarCloseButton: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 20,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sidebarItemText: {
    fontSize: 16,
    color: '#2E2C55',
    marginLeft: 16,
    fontWeight: '500',
  },
});

