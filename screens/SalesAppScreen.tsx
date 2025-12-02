import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SalesAppScreenProps {
  onBack: () => void;
  onCustomerPress?: () => void;
  onOrdersPress?: () => void;
  onChatPress?: () => void;
  onInactiveCustomersPress?: () => void;
}

export default function SalesAppScreen({
  onBack,
  onCustomerPress,
  onOrdersPress,
  onChatPress,
  onInactiveCustomersPress,
}: SalesAppScreenProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarTranslateX = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;
  const sidebarOverlayOpacity = useRef(new Animated.Value(0)).current;

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
      
      {/* Inaktive Kunden Section */}
      <View style={styles.inactiveSection}>
        <TouchableOpacity 
          style={styles.inactiveHeader}
          onPress={onInactiveCustomersPress}
          activeOpacity={0.7}
        >
          <Ionicons name="person-remove-outline" size={20} color="#2E2C55" />
          <Text style={styles.inactiveHeaderText}>Inaktive Kunden</Text>
        </TouchableOpacity>
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
    paddingVertical: 12,
  },
  inactiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  inactiveHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E2C55',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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

