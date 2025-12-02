import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Modal, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

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
}

// Fiktive Kundendaten
const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'La Dolce Vita', type: 'restaurant', activityLevel: 'aktiv', status: 'hat bestellt', group: 'italiener', country: 'Deutschland' },
  { id: '2', name: 'Biergarten am Main', type: 'restaurant', activityLevel: 'aktiv', status: 'hat bestellt', group: 'würzburg', country: 'Deutschland' },
  { id: '3', name: 'Club Matrix', type: 'club', activityLevel: 'aktiv', status: 'hat bestellt', group: 'mach1 gruppe', country: 'Deutschland' },
  { id: '4', name: 'Bar Central', type: 'bar', activityLevel: 'ruhend', status: 'Einladung angenommen', group: 'montag', country: 'Deutschland' },
  { id: '5', name: 'Ristorante Bella', type: 'restaurant', activityLevel: 'aktiv', status: 'hat bestellt', group: 'italiener', country: 'Deutschland' },
  { id: '6', name: 'Nightclub Eclipse', type: 'club', activityLevel: 'inaktiv', status: 'nicht angenommen', group: 'dienstag', country: 'Deutschland' },
  { id: '7', name: 'Cocktail Lounge', type: 'bar', activityLevel: 'passiv', status: 'Daten unvollständig', group: 'würzburg', country: 'Deutschland' },
  { id: '8', name: 'Trattoria Toscana', type: 'restaurant', activityLevel: 'aktiv', status: 'hat bestellt', group: 'italiener', country: 'Deutschland' },
  { id: '9', name: 'Beer Garden', type: 'bar', activityLevel: 'aktiv', status: 'hat bestellt', group: 'würzburg', country: 'Deutschland' },
  { id: '10', name: 'Disco Inferno', type: 'club', activityLevel: 'ruhend', status: 'Einladung angenommen', group: 'mach1 gruppe', country: 'Deutschland' },
  { id: '11', name: 'Pizzeria Napoli', type: 'restaurant', activityLevel: 'aktiv', status: 'hat bestellt', group: 'italiener', country: 'Deutschland' },
  { id: '12', name: 'Rooftop Bar', type: 'bar', activityLevel: 'aktiv', status: 'hat bestellt', group: 'montag', country: 'Deutschland' },
  { id: '13', name: 'Jazz Club', type: 'club', activityLevel: 'inaktiv', status: 'nicht erlaubt zu bestellen', group: 'dienstag', country: 'Deutschland' },
  { id: '14', name: 'Steakhouse Premium', type: 'restaurant', activityLevel: 'aktiv', status: 'hat bestellt', group: 'würzburg', country: 'Deutschland' },
  { id: '15', name: 'Sports Bar', type: 'bar', activityLevel: 'ruhend', status: 'Keine Einladung erstellt', group: 'mach1 gruppe', country: 'Deutschland' },
];

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
}: CustomerScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedActivityLevels, setSelectedActivityLevels] = useState<Set<string>>(new Set());
  const [selectedCustomerStatuses, setSelectedCustomerStatuses] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const toggleFilter = (filterSet: Set<string>, setFilterSet: (set: Set<string>) => void, value: string) => {
    const newSet = new Set(filterSet);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setFilterSet(newSet);
  };

  // Filtere Kunden basierend auf Suchanfrage und Filtern
  const filteredCustomers = useMemo(() => {
    let filtered = MOCK_CUSTOMERS;

    // Suche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(query)
      );
    }

    // Aktivitätslevel
    if (selectedActivityLevels.size > 0) {
      filtered = filtered.filter(customer => 
        selectedActivityLevels.has(customer.activityLevel)
      );
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

    return filtered;
  }, [searchQuery, selectedActivityLevels, selectedCustomerStatuses, selectedGroups, selectedCountry]);

  const renderCustomer = ({ item: customer }: { item: Customer }) => (
    <TouchableOpacity style={styles.customerItem} activeOpacity={0.7}>
      <View style={styles.customerIconContainer}>
        <Ionicons name="person" size={24} color="#2E2C55" />
      </View>
      <Text style={styles.customerName}>{customer.name}</Text>
    </TouchableOpacity>
  );

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
                  {Array.from(selectedActivityLevels).map(level => (
                    <TouchableOpacity
                      key={level}
                      style={styles.filterChip}
                      onPress={() => toggleFilter(selectedActivityLevels, setSelectedActivityLevels, level)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{level}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  ))}
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
    alignItems: 'center',
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
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E2C55',
    flex: 1,
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

