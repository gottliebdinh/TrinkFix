import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Modal, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import customersData from '../data/Kunden/customers.json';
import ordersData from '../data/Bestellungen/orders.json';

interface Customer {
  id: string;
  name: string;
  type: 'restaurant' | 'club' | 'bar';
  activityLevel: 'aktiv' | 'ruhend' | 'inaktiv' | 'passiv';
  status: string;
  group: string;
  country: string;
}

interface CustomerScreenProps {
  onBack: () => void;
  onAddCustomer?: () => void;
  initialActivityLevel?: string | null;
  onCustomerPress?: (customer: Customer) => void;
  newCustomers?: Customer[];
}

// Kundendaten aus CSV importiert - wird in der Komponente mit newCustomers kombiniert

const ACTIVITY_LEVELS = ['aktiv', 'ruhend', 'inaktiv', 'passiv'];
const CUSTOMER_STATUSES = [
  'Daten unvollständig',
  'Keine Einladung erstellt',
  'Einladung angenommen',
  'nicht angenommen',
  'hat bestellt',
  'gelöschte kunden',
  'nicht erlaubt zu bestellen'
];
const GROUPS = ['würzburg', 'mach1 gruppe', 'italiener', 'montag', 'dienstag'];
const AREA_OPTIONS = ['mit bereich', 'ohne bereich'];
const PRICE_OPTIONS = ['mit spezifischen preisen', 'ohne spezifische preisen'];

export default function CustomerScreen({
  onBack,
  onAddCustomer,
  initialActivityLevel,
  onCustomerPress,
  newCustomers = [],
}: CustomerScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedActivityLevels, setSelectedActivityLevels] = useState<Set<string>>(
    initialActivityLevel ? new Set([initialActivityLevel]) : new Set()
  );
  const [selectedCustomerStatuses, setSelectedCustomerStatuses] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [showOver10Orders, setShowOver10Orders] = useState<boolean>(false);
  
  // Kombiniere CSV-Kunden mit neuen Kunden
  const allCustomers = useMemo(() => {
    const csvCustomers = (customersData as Customer[]);
    return [...newCustomers, ...csvCustomers];
  }, [newCustomers]);

  // Berechne Bestellanzahl pro Kunde
  const customerOrderCounts = useMemo(() => {
    const counts: { [customerName: string]: number } = {};
    const orders = ordersData as any[];
    
    orders.forEach(order => {
      if (order.customer && !order.cancelled) {
        const customerName = order.customer;
        counts[customerName] = (counts[customerName] || 0) + 1;
      }
    });
    
    return counts;
  }, []);

  // Hilfsfunktion: Bestellanzahl für einen Kunden abrufen
  const getOrderCount = (customerName: string): number => {
    return customerOrderCounts[customerName] || 0;
  };

  const toggleFilter = (filterSet: Set<string>, setFilterSet: (set: Set<string>) => void, value: string) => {
    const newSet = new Set(filterSet);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setFilterSet(newSet);
  };

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
        // "vor einem Monat" oder "vor ein Monat" oder "vor 1 monat"
        if (statusLower.includes('einem monat') || statusLower.includes('ein monat') || statusLower.includes('1 monat')) {
          return 'inaktiv';
        }
        
        // Extrahiere die Anzahl der Monate
        const monthMatch = statusLower.match(/vor (\d+) monat/i);
        if (monthMatch) {
          const months = parseInt(monthMatch[1], 10);
          if (months < 3) {
            return 'inaktiv'; // 1-2 Monate
          } else {
            return 'passiv'; // 3+ Monate
          }
        }
        
        // "vor 2 monaten" oder ähnlich
        if (statusLower.includes('2 monat')) {
          return 'inaktiv';
        }
        
        // 3 Monate oder mehr
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
      // Tage
      if (statusLower.includes('tag')) {
        const dayMatch = statusLower.match(/seit (\d+) tag/i);
        if (dayMatch) {
          const days = parseInt(dayMatch[1], 10);
          if (days > 21) {
            return 'inaktiv';
          }
        }
      }
      
      // Monate oder Jahre - immer inaktiv/passiv
      if (statusLower.includes('monat')) {
        return 'inaktiv';
      }
      if (statusLower.includes('jahr')) {
        return 'passiv';
      }
    }
    
    // Standard: passiv für alle anderen Status
    return 'passiv';
  };

  // Filtere Kunden basierend auf Suchanfrage und Filtern
  const filteredCustomers = useMemo(() => {
    let filtered = allCustomers;

    // Suche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(query)
      );
    }

    // Aktivitätslevel - basierend auf Status-Text
    if (selectedActivityLevels.size > 0) {
      filtered = filtered.filter(customer => {
        const activityLevel = getActivityLevelFromStatus(customer.status);
        return selectedActivityLevels.has(activityLevel);
      });
    }

    // Kundenstatus
    if (selectedCustomerStatuses.size > 0) {
      filtered = filtered.filter(customer => 
        selectedCustomerStatuses.has(customer.status)
      );
    }

    // Gruppen
    if (selectedGroups.size > 0) {
      filtered = filtered.filter(customer => 
        selectedGroups.has(customer.group)
      );
    }

    // Land
    if (selectedCountry) {
      filtered = filtered.filter(customer => 
        customer.country === selectedCountry
      );
    }

    // Über 10 mal bestellt Filter
    if (showOver10Orders) {
      filtered = filtered.filter(customer => {
        const orderCount = getOrderCount(customer.name);
        return orderCount > 10;
      });
    }

    // Sortiere: Nur spezifische Kunden (Moggi, mach1 Club GmbH, Babylon Kino am Stadtpark) mit über 10 Bestellungen zuerst
    const allowedCustomersForLabel = ['Moggi', 'mach1 Club GmbH', 'Babylon Kino am Stadtpark'];
    
    filtered.sort((a, b) => {
      const orderCountA = getOrderCount(a.name);
      const orderCountB = getOrderCount(b.name);
      const hasOver10A = orderCountA > 10 && allowedCustomersForLabel.includes(a.name);
      const hasOver10B = orderCountB > 10 && allowedCustomersForLabel.includes(b.name);
      
      // Wenn beide über 10 Bestellungen haben und in der Whitelist sind, sortiere nach Anzahl (höchste zuerst)
      if (hasOver10A && hasOver10B) {
        return orderCountB - orderCountA;
      }
      
      // Wenn nur A über 10 Bestellungen hat und in der Whitelist ist, kommt A zuerst
      if (hasOver10A) return -1;
      
      // Wenn nur B über 10 Bestellungen hat und in der Whitelist ist, kommt B zuerst
      if (hasOver10B) return 1;
      
      // Wenn keiner über 10 Bestellungen hat oder nicht in der Whitelist ist, behalte die ursprüngliche Reihenfolge
      return 0;
    });

    return filtered;
  }, [searchQuery, selectedActivityLevels, selectedCustomerStatuses, selectedGroups, selectedCountry, showOver10Orders, customerOrderCounts]);

  const getStatusLabelColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    // Prüfe ob es ein Bestelldatum gibt
    if (statusLower.includes('bestellt')) {
      // Tage: Grün wenn <= 14 Tage, Gelb wenn 15-30 Tage, Rot wenn > 21 Tage
      if (statusLower.includes('vor') && statusLower.includes('tag')) {
        const dayMatch = statusLower.match(/vor (\d+) tag/i);
        if (dayMatch) {
          const days = parseInt(dayMatch[1], 10);
          if (days <= 14) {
            return '#4CAF50'; // Grün
          } else if (days <= 21) {
            return '#FFC107'; // Gelb (zwischen 14 und 21 Tagen)
          } else if (days < 30) {
            return '#F44336'; // Rot (mehr als 21 Tage aber weniger als 1 Monat - inaktiv)
          } else {
            return '#F44336'; // Rot (>= 30 Tage, also >= 1 Monat)
          }
        }
      }
      
      // Monate: Rot wenn 1-2 Monate, Grau ab 3 Monaten
      if (statusLower.includes('vor') && statusLower.includes('monat')) {
        // "vor einem Monat" oder "vor ein Monat"
        if (statusLower.includes('einem monat') || statusLower.includes('ein monat') || statusLower.includes('1 monat')) {
          return '#F44336'; // Rot
        }
        
        // Extrahiere die Anzahl der Monate
        const monthMatch = statusLower.match(/vor (\d+) monat/i);
        if (monthMatch) {
          const months = parseInt(monthMatch[1], 10);
          if (months < 3) {
            return '#F44336'; // Rot (1-2 Monate)
          } else {
            return '#9E9E9E'; // Grau (3+ Monate)
          }
        }
        
        // "vor 2 monaten" oder ähnlich
        if (statusLower.includes('2 monat')) {
          return '#F44336'; // Rot
        }
        
        // 3 Monate oder mehr
        if (statusLower.includes('3 monat') || statusLower.includes('4 monat') || 
            statusLower.includes('5 monat') || statusLower.includes('6 monat')) {
          return '#9E9E9E'; // Grau
        }
      }
      
      // Jahre: immer Grau
      if (statusLower.includes('vor') && (statusLower.includes('jahr') || statusLower.includes('jahre'))) {
        return '#9E9E9E'; // Grau
      }
    }
    
    // "Noch keine Bestellung seit" - Rot wenn mehr als 21 Tage
    if (statusLower.includes('noch keine bestellung seit')) {
      // Tage
      if (statusLower.includes('tag')) {
        const dayMatch = statusLower.match(/seit (\d+) tag/i);
        if (dayMatch) {
          const days = parseInt(dayMatch[1], 10);
          if (days > 21) {
            return '#F44336'; // Rot (inaktiv)
          }
        }
      }
      
      // Monate oder Jahre - immer rot (inaktiv)
      if (statusLower.includes('monat') || statusLower.includes('jahr')) {
        return '#F44336'; // Rot
      }
    }
    
    // Standard: Grau für alle anderen Status
    return '#9E9E9E';
  };

  const renderCustomer = ({ item: customer }: { item: Customer }) => {
    const statusColor = getStatusLabelColor(customer.status);
    const orderCount = getOrderCount(customer.name);
    const hasOver10Orders = orderCount > 10;
    
    // Whitelist: Nur diese Kunden sollen das Label "Über 10 mal bestellt" anzeigen
    const allowedCustomersForLabel = ['Moggi', 'mach1 Club GmbH', 'Babylon Kino am Stadtpark'];
    const shouldShowLabel = hasOver10Orders && allowedCustomersForLabel.includes(customer.name);
    
    return (
      <TouchableOpacity 
        style={styles.customerItem} 
        activeOpacity={0.7}
        onPress={() => onCustomerPress && onCustomerPress(customer)}
      >
        <View style={styles.customerIconContainer}>
          <Ionicons name="person" size={24} color="#2E2C55" />
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <View style={styles.labelsContainer}>
            <View style={[styles.customerStatusLabel, { backgroundColor: statusColor }]}>
              <Text style={styles.customerStatusText} numberOfLines={1}>{customer.status}</Text>
            </View>
            {shouldShowLabel && (
              <View style={styles.over10OrdersLabel}>
                <Ionicons name="trophy" size={14} color="#fff" />
                <Text style={styles.over10OrdersText}>Über 10 mal bestellt</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <SafeAreaView style={styles.safeAreaTop}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#2E2C55" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Kunden</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Kunden suchen..."
                placeholderTextColor="#777"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterIconButton}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="filter" size={20} color="#2E2C55" />
            </TouchableOpacity>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.selectedFiltersContainer}
              contentContainerStyle={styles.selectedFiltersContent}
            >
              {selectedActivityLevels.size > 0 || selectedCustomerStatuses.size > 0 || selectedGroups.size > 0 || selectedArea || selectedPrice || selectedCountry ? (
                <>
                  {Array.from(selectedActivityLevels).map(level => {
                    const getActivityColor = () => {
                      switch (level) {
                        case 'aktiv':
                          return '#4CAF50'; // Grün
                        case 'ruhend':
                          return '#FFC107'; // Gelb
                        case 'inaktiv':
                          return '#F44336'; // Rot
                        case 'passiv':
                          return '#9E9E9E'; // Grau
                        default:
                          return '#2E2C55';
                      }
                    };
                    const activityColor = getActivityColor();
                    return (
                      <TouchableOpacity
                        key={level}
                        style={styles.filterChip}
                        onPress={() => toggleFilter(selectedActivityLevels, setSelectedActivityLevels, level)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.activityColorDot, { backgroundColor: activityColor }]} />
                        <Text style={styles.filterChipText}>{level}</Text>
                        <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                      </TouchableOpacity>
                    );
                  })}
                  {Array.from(selectedCustomerStatuses).map(status => (
                    <TouchableOpacity
                      key={status}
                      style={styles.filterChip}
                      onPress={() => toggleFilter(selectedCustomerStatuses, setSelectedCustomerStatuses, status)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{status}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  ))}
                  {Array.from(selectedGroups).map(group => (
                    <TouchableOpacity
                      key={group}
                      style={styles.filterChip}
                      onPress={() => toggleFilter(selectedGroups, setSelectedGroups, group)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{group}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  ))}
                  {selectedArea && (
                    <TouchableOpacity
                      style={styles.filterChip}
                      onPress={() => setSelectedArea(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{selectedArea}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  )}
                  {selectedPrice && (
                    <TouchableOpacity
                      style={styles.filterChip}
                      onPress={() => setSelectedPrice(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{selectedPrice}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  )}
                  {selectedCountry && (
                    <TouchableOpacity
                      style={styles.filterChip}
                      onPress={() => setSelectedCountry('')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{selectedCountry}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text style={styles.noFiltersText}>Keine Filter aktiv</Text>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
      
      {filteredCustomers.length > 0 ? (
        <FlatList
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          data={filteredCustomers}
          renderItem={renderCustomer}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Keine Kunden gefunden</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={onAddCustomer}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Neuen Kunden anlegen</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#2E2C55" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {/* Aktivitätslevel */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Aktivitätslevel</Text>
                <View style={styles.filterLabelsContainer}>
                  {ACTIVITY_LEVELS.map(level => {
                    const isSelected = selectedActivityLevels.has(level);
                    const getActivityColor = () => {
                      switch (level) {
                        case 'aktiv':
                          return '#4CAF50'; // Grün
                        case 'ruhend':
                          return '#FFC107'; // Gelb
                        case 'inaktiv':
                          return '#F44336'; // Rot
                        case 'passiv':
                          return '#9E9E9E'; // Grau
                        default:
                          return '#2E2C55';
                      }
                    };
                    const activityColor = getActivityColor();
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                        onPress={() => toggleFilter(selectedActivityLevels, setSelectedActivityLevels, level)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.activityColorDot, { backgroundColor: activityColor }]} />
                        <Text style={[styles.filterLabelText, isSelected && styles.filterLabelTextSelected]}>
                          {level}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Kundenstatus */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kundenstatus</Text>
                <View style={styles.filterLabelsContainer}>
                  {CUSTOMER_STATUSES.map(status => {
                    const isSelected = selectedCustomerStatuses.has(status);
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                        onPress={() => toggleFilter(selectedCustomerStatuses, setSelectedCustomerStatuses, status)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterLabelText, isSelected && styles.filterLabelTextSelected]}>
                          {status}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Gruppen */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Gruppen</Text>
                <View style={styles.filterLabelsContainer}>
                  {GROUPS.map(group => {
                    const isSelected = selectedGroups.has(group);
                    return (
                      <TouchableOpacity
                        key={group}
                        style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                        onPress={() => toggleFilter(selectedGroups, setSelectedGroups, group)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterLabelText, isSelected && styles.filterLabelTextSelected]}>
                          {group}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Kundenkriterien */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kundenkriterien</Text>
                
                <View style={styles.criteriaSubsection}>
                  <Text style={styles.criteriaSubtitle}>Bereich</Text>
                  <View style={styles.filterLabelsContainer}>
                    {AREA_OPTIONS.map(option => {
                      const isSelected = selectedArea === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                          onPress={() => setSelectedArea(isSelected ? null : option)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.filterLabelText, isSelected && styles.filterLabelTextSelected]}>
                            {option}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.criteriaSubsection}>
                  <Text style={styles.criteriaSubtitle}>Spezifische Preise</Text>
                  <View style={styles.filterLabelsContainer}>
                    {PRICE_OPTIONS.map(option => {
                      const isSelected = selectedPrice === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                          onPress={() => setSelectedPrice(isSelected ? null : option)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.filterLabelText, isSelected && styles.filterLabelTextSelected]}>
                            {option}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Land */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Land</Text>
                <View style={styles.filterLabelsContainer}>
                  <TouchableOpacity
                    style={[styles.filterLabel, selectedCountry === 'Deutschland' && styles.filterLabelSelected]}
                    onPress={() => setSelectedCountry(selectedCountry === 'Deutschland' ? '' : 'Deutschland')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterLabelText, selectedCountry === 'Deutschland' && styles.filterLabelTextSelected]}>
                      Deutschland
                    </Text>
                    {selectedCountry === 'Deutschland' && (
                      <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterModalClearButton}
                onPress={() => {
                  setSelectedActivityLevels(new Set());
                  setSelectedCustomerStatuses(new Set());
                  setSelectedGroups(new Set());
                  setSelectedArea(null);
                  setSelectedPrice(null);
                  setSelectedCountry('');
                  setShowOver10Orders(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.filterModalClearButtonText}>Alle zurücksetzen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterModalApplyButton}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterModalApplyButtonText}>Anwenden</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 32,
    padding: 4,
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
    width: 32,
  },
  searchContainer: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#2E2C55',
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  customerItem: {
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
  customerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  customerInfo: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E2C55',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  customerStatusLabel: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  over10OrdersLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 4,
    shadowColor: '#9C27B0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#7B1FA2',
  },
  over10OrdersText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  customerStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '400',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButton: {
    backgroundColor: '#2E2C55',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    gap: 12,
  },
  filterIconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFiltersContainer: {
    flex: 1,
  },
  selectedFiltersContent: {
    gap: 8,
    alignItems: 'center',
  },
  noFiltersText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e8e8f0',
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: '#2E2C55',
    fontWeight: '500',
  },
  filterChipClose: {
    marginLeft: 2,
  },
  over10OrdersFilterChip: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  over10OrdersFilterLabel: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1.5,
    borderColor: '#9C27B0',
  },
  over10OrdersFilterLabelSelected: {
    backgroundColor: '#E1BEE7',
    borderWidth: 1.5,
    borderColor: '#9C27B0',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 12,
  },
  filterLabelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginVertical: -5,
    width: '100%',
  },
  filterLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 5,
    marginVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  activityColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  filterLabelSelected: {
    backgroundColor: '#e8e8f0',
    borderColor: '#2E2C55',
  },
  filterLabelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterLabelTextSelected: {
    color: '#2E2C55',
    fontWeight: '600',
  },
  filterLabelCheck: {
    marginLeft: 8,
  },
  criteriaSubsection: {
    marginBottom: 16,
  },
  criteriaSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  countryInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#2E2C55',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  filterModalClearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterModalClearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  filterModalApplyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2E2C55',
    alignItems: 'center',
  },
  filterModalApplyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

