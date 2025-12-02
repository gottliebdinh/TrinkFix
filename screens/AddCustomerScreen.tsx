import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface AddCustomerScreenProps {
  onBack: () => void;
  onSave?: (customerData: any) => void;
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const CURRENCIES = ['€', 'Pfund', 'Franc', 'Danish'];
const GROUPS = ['würzburg', 'mach1 gruppe', 'italiener', 'montag', 'dienstag'];

export default function AddCustomerScreen({
  onBack,
  onSave,
}: AddCustomerScreenProps) {
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [deliveryDays, setDeliveryDays] = useState<Set<string>>(new Set());
  const [pickupDays, setPickupDays] = useState<Set<string>>(new Set());
  const [showPrices, setShowPrices] = useState(false);
  const [clientBlocked, setClientBlocked] = useState(false);
  const [currency, setCurrency] = useState('€');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const toggleDeliveryDay = (day: string) => {
    const newDays = new Set(deliveryDays);
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setDeliveryDays(newDays);
  };

  const togglePickupDay = (day: string) => {
    const newDays = new Set(pickupDays);
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setPickupDays(newDays);
  };

  const handleSave = () => {
    if (!customerName || !email || !customerNumber) {
      // TODO: Show error message
      return;
    }

    const customerData = {
      customerName,
      email,
      customerNumber,
      phoneNumber,
      clientBlocked,
      address: {
        street,
        zipCode,
        city,
        countryCode,
      },
      group: selectedGroup,
      deliveryDays: Array.from(deliveryDays),
      pickupDays: Array.from(pickupDays),
      showPrices,
      currency,
      minOrderValue,
      minOrderQuantity,
      deliveryFee,
      internalNotes,
    };

    if (onSave) {
      onSave(customerData);
    }
    onBack();
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
              <Text style={styles.logoText}>Neuen Kunden anlegen</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Pflichtfelder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pflichtfelder</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kundenname *</Text>
            <TextInput
              style={styles.input}
              placeholder="Kundenname eingeben"
              placeholderTextColor="#999"
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Email eingeben"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kundennummer *</Text>
            <TextInput
              style={styles.input}
              placeholder="Kundennummer eingeben"
              placeholderTextColor="#999"
              value={customerNumber}
              onChangeText={setCustomerNumber}
            />
          </View>
        </View>

        {/* Client blockiert */}
        <View style={styles.section}>
          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setClientBlocked(!clientBlocked)}
              activeOpacity={0.7}
            >
              {clientBlocked && <Ionicons name="checkmark" size={20} color="#2E2C55" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Client blockiert (kann nicht bestellen)</Text>
          </View>
        </View>

        {/* Kontakt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontakt</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefonnummer</Text>
            <TextInput
              style={styles.input}
              placeholder="Telefonnummer eingeben"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Lieferadresse */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lieferadresse</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Straße</Text>
            <TextInput
              style={styles.input}
              placeholder="Straße eingeben"
              placeholderTextColor="#999"
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>PLZ</Text>
              <TextInput
                style={styles.input}
                placeholder="PLZ"
                placeholderTextColor="#999"
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Ort</Text>
              <TextInput
                style={styles.input}
                placeholder="Ort"
                placeholderTextColor="#999"
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ländercode</Text>
            <TextInput
              style={styles.input}
              placeholder="Ländercode eingeben"
              placeholderTextColor="#999"
              value={countryCode}
              onChangeText={setCountryCode}
            />
          </View>
        </View>

        {/* Gruppe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gruppe</Text>
          
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => setShowGroupModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectButtonText, !selectedGroup && styles.placeholderText]}>
              {selectedGroup || 'Gruppe auswählen'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Liefertage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liefertage</Text>
          <View style={styles.daysContainer}>
            {WEEKDAYS.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton, 
                  deliveryDays.has(day) && styles.dayButtonActive,
                  index === WEEKDAYS.length - 1 && { marginRight: 0 }
                ]}
                onPress={() => toggleDeliveryDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayButtonText, deliveryDays.has(day) && styles.dayButtonTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Abholtage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abholtage</Text>
          <View style={styles.daysContainer}>
            {WEEKDAYS.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton, 
                  pickupDays.has(day) && styles.dayButtonActive,
                  index === WEEKDAYS.length - 1 && { marginRight: 0 }
                ]}
                onPress={() => togglePickupDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayButtonText, pickupDays.has(day) && styles.dayButtonTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Artikelpreise */}
        <View style={styles.section}>
          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setShowPrices(!showPrices)}
              activeOpacity={0.7}
            >
              {showPrices && <Ionicons name="checkmark" size={20} color="#2E2C55" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Artikelpreise anzeigen</Text>
          </View>
        </View>

        {/* Währung */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Währung</Text>
          
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => setShowCurrencyModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.selectButtonText}>{currency}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Bestellwerte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bestellwerte</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Minimaler Bestellwert</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimaler Bestellwert"
              placeholderTextColor="#999"
              value={minOrderValue}
              onChangeText={setMinOrderValue}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Minimale Bestellmenge</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimale Bestellmenge"
              placeholderTextColor="#999"
              value={minOrderQuantity}
              onChangeText={setMinOrderQuantity}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Liefergebühr</Text>
            <TextInput
              style={styles.input}
              placeholder="Liefergebühr"
              placeholderTextColor="#999"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Interne Hinweise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interne Hinweise</Text>
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Interne Hinweise eingeben"
            placeholderTextColor="#999"
            value={internalNotes}
            onChangeText={setInternalNotes}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Speichern</Text>
        </TouchableOpacity>
      </View>

      {/* Gruppe Modal */}
      <Modal
        visible={showGroupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gruppe auswählen</Text>
              <TouchableOpacity onPress={() => setShowGroupModal(false)}>
                <Ionicons name="close" size={24} color="#2E2C55" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {GROUPS.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedGroup(group);
                    setShowGroupModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{group}</Text>
                  {selectedGroup === group && (
                    <Ionicons name="checkmark" size={20} color="#2E2C55" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Währung Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Währung auswählen</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={24} color="#2E2C55" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={styles.modalItem}
                  onPress={() => {
                    setCurrency(curr);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{curr}</Text>
                  {currency === curr && (
                    <Ionicons name="checkmark" size={20} color="#2E2C55" />
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
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2C55',
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
    paddingBottom: 100,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E2C55',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#2E2C55',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#2E2C55',
  },
  placeholderText: {
    color: '#999',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 4,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#2E2C55',
    borderColor: '#2E2C55',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2E2C55',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#2E2C55',
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
  saveButton: {
    backgroundColor: '#2E2C55',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2C55',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#2E2C55',
  },
});

