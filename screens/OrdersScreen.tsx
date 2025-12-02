import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Modal, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ordersData from '../data/Bestellungen/orders.json';

interface Order {
  id: string;
  customer: string;
  orderDate: string;
  orderDateRaw: string;
  orderTime: string;
  orderNumber: string;
  deliveryDate: string;
  itemCount: string;
  internalTags: string;
  cancelled?: boolean;
}

interface OrdersScreenProps {
  onBack: () => void;
  onOrderPress?: (order: Order) => void;
  initialSearchQuery?: string;
}

const ORDER_DATES = ['letzte 2h', 'letzte 7 tage', 'letzte 4 wochen', 'diesen monat', 'letzten 6 monat', 'letztes jahr'];
const DELIVERY_DATES = ['nächsten 7 tage', 'morgen', 'übermorgen', 'heute', 'letzten 7 tage', 'diesen monat', 'letzten 6 monate', 'letztes jahr'];
const ORDERED_BY = ['vom kunden bestellt', 'vom lieferanten bestellt', 'über inbox bestellt'];
const INTERNAL_TAGS = ['storno'];
const CANCELLATION = ['storniert', 'nicht storniert'];
const GROUPS = ['würzburg', 'mach1 gruppe', 'italiener', 'montag', 'dienstag'];

export default function OrdersScreen({
  onBack,
  onOrderPress,
  initialSearchQuery = '',
}: OrdersScreenProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedOrderDate, setSelectedOrderDate] = useState<string | null>(null);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null);
  const [selectedOrderedBy, setSelectedOrderedBy] = useState<string | null>(null);
  const [selectedInternalTags, setSelectedInternalTags] = useState<Set<string>>(new Set());
  const [selectedCancellation, setSelectedCancellation] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  
  // Custom date range states
  const [showOrderDateCalendar, setShowOrderDateCalendar] = useState(false);
  const [showDeliveryDateCalendar, setShowDeliveryDateCalendar] = useState(false);
  const [orderDateStart, setOrderDateStart] = useState<Date | null>(null);
  const [orderDateEnd, setOrderDateEnd] = useState<Date | null>(null);
  const [deliveryDateStart, setDeliveryDateStart] = useState<Date | null>(null);
  const [deliveryDateEnd, setDeliveryDateEnd] = useState<Date | null>(null);
  const [calendarType, setCalendarType] = useState<'order' | 'delivery'>('order');

  const toggleFilter = (filterSet: Set<string>, setFilterSet: (set: Set<string>) => void, value: string) => {
    const newSet = new Set(filterSet);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setFilterSet(newSet);
  };

  // Parse Datum aus deutschem Format (z.B. "Di., 02.12.25")
  const parseGermanDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    try {
      // Entferne Wochentag und extrahiere Datum (z.B. "02.12.25")
      const dateMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{2})/);
      if (!dateMatch) return null;
      
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // Monate sind 0-indexiert
      const year = 2000 + parseInt(dateMatch[3], 10);
      
      return new Date(year, month, day);
    } catch {
      return null;
    }
  };

  // Prüfe ob Datum in Zeitraum liegt
  const isDateInRange = (date: Date | null, start: Date | null, end: Date | null): boolean => {
    if (!date) return false;
    if (start && end) {
      return date >= start && date <= end;
    }
    if (start) {
      return date >= start;
    }
    if (end) {
      return date <= end;
    }
    return false;
  };

  // Berechne Datum basierend auf Filteroption
  const getDateFromFilter = (filter: string, isOrderDate: boolean): { start: Date | null, end: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'letzte 2h':
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        return { start: twoHoursAgo, end: now };
      case 'letzte 7 tage':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return { start: sevenDaysAgo, end: today };
      case 'letzte 4 wochen':
        const fourWeeksAgo = new Date(today);
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        return { start: fourWeeksAgo, end: today };
      case 'diesen monat':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: today };
      case 'letzten 6 monat':
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return { start: sixMonthsAgo, end: today };
      case 'letztes jahr':
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return { start: oneYearAgo, end: today };
      case 'nächsten 7 tage':
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        return { start: today, end: sevenDaysLater };
      case 'morgen':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { start: tomorrow, end: tomorrow };
      case 'übermorgen':
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        return { start: dayAfterTomorrow, end: dayAfterTomorrow };
      case 'heute':
        return { start: today, end: today };
      case 'letzten 7 tage':
        const lastSevenDays = new Date(today);
        lastSevenDays.setDate(lastSevenDays.getDate() - 7);
        return { start: lastSevenDays, end: today };
      case 'diesen monat':
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: thisMonthStart, end: today };
      case 'letzten 6 monate':
        const lastSixMonths = new Date(today);
        lastSixMonths.setMonth(lastSixMonths.getMonth() - 6);
        return { start: lastSixMonths, end: today };
      case 'letztes jahr':
        const lastYear = new Date(today);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        return { start: lastYear, end: today };
      default:
        return { start: null, end: null };
    }
  };

  // Filtere Bestellungen basierend auf Suchanfrage und Filtern
  const filteredOrders = useMemo(() => {
    const orders = ordersData as Order[];
    let filtered = orders;

    // Suche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        (order.customer || '').toLowerCase().includes(query) ||
        (order.orderNumber || '').toLowerCase().includes(query)
      );
    }

    // Filter: Storniert
    if (selectedCancellation) {
      if (selectedCancellation === 'storniert') {
        filtered = filtered.filter(order => 
          order.cancelled || (order.internalTags && order.internalTags.toLowerCase().includes('storno'))
        );
      } else if (selectedCancellation === 'nicht storniert') {
        filtered = filtered.filter(order => 
          !order.cancelled && (!order.internalTags || !order.internalTags.toLowerCase().includes('storno'))
        );
      }
    }

    // Filter: Bestelldatum
    if (selectedOrderDate || orderDateStart || orderDateEnd) {
      if (orderDateStart || orderDateEnd) {
        // Benutzerdefinierte Termine
        filtered = filtered.filter(order => {
          const orderDate = parseGermanDate(order.orderDateRaw || '');
          return isDateInRange(orderDate, orderDateStart, orderDateEnd);
        });
      } else if (selectedOrderDate) {
        // Vordefinierte Filter
        const { start, end } = getDateFromFilter(selectedOrderDate, true);
        filtered = filtered.filter(order => {
          const orderDate = parseGermanDate(order.orderDateRaw || '');
          return isDateInRange(orderDate, start, end);
        });
      }
    }

    // Filter: Lieferdatum
    if (selectedDeliveryDate || deliveryDateStart || deliveryDateEnd) {
      if (deliveryDateStart || deliveryDateEnd) {
        // Benutzerdefinierte Termine
        filtered = filtered.filter(order => {
          const deliveryDate = parseGermanDate(order.deliveryDate || '');
          return isDateInRange(deliveryDate, deliveryDateStart, deliveryDateEnd);
        });
      } else if (selectedDeliveryDate) {
        // Vordefinierte Filter
        const { start, end } = getDateFromFilter(selectedDeliveryDate, false);
        filtered = filtered.filter(order => {
          const deliveryDate = parseGermanDate(order.deliveryDate || '');
          return isDateInRange(deliveryDate, start, end);
        });
      }
    }

    return filtered;
  }, [searchQuery, selectedOrderDate, selectedDeliveryDate, selectedOrderedBy, selectedInternalTags, selectedCancellation, selectedGroups, orderDateStart, orderDateEnd, deliveryDateStart, deliveryDateEnd]);

  const renderOrder = ({ item: order }: { item: Order }) => {
    const isCancelled = order.cancelled || (order.internalTags && order.internalTags.toLowerCase().includes('storno'));
    
    return (
      <TouchableOpacity 
        style={styles.orderItem} 
        activeOpacity={0.7}
        onPress={() => onOrderPress && onOrderPress(order)}
      >
        <View style={styles.orderIconContainer}>
          <Ionicons name="receipt" size={24} color="#2E2C55" />
        </View>
        <View style={styles.orderInfo}>
          <View style={styles.orderHeaderRow}>
            <Text style={styles.orderCustomerName} numberOfLines={1}>{order.customer}</Text>
            {isCancelled && (
              <View style={styles.cancelledLabel}>
                <Text style={styles.cancelledLabelText}>Storniert</Text>
              </View>
            )}
          </View>
          <View style={styles.orderDetails}>
            <View style={styles.orderDetailRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.orderDetailText}>{order.deliveryDate}</Text>
            </View>
            <View style={styles.orderDetailRow}>
              <Ionicons name="cube-outline" size={14} color="#666" />
              <Text style={styles.orderDetailText}>{order.itemCount} Artikel</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Calendar functions
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDateSelect = (date: Date) => {
    if (calendarType === 'order') {
      if (!orderDateStart) {
        // First click: set start date
        setOrderDateStart(date);
      } else if (!orderDateEnd) {
        // Second click: set end date
        if (date < orderDateStart) {
          // If end date is before start date, swap them
          setOrderDateEnd(orderDateStart);
          setOrderDateStart(date);
        } else {
          setOrderDateEnd(date);
        }
        // Keep calendar open so user can see the selection
      } else {
        // Both dates set: reset and start new selection
        setOrderDateStart(date);
        setOrderDateEnd(null);
      }
    } else {
      if (!deliveryDateStart) {
        // First click: set start date
        setDeliveryDateStart(date);
      } else if (!deliveryDateEnd) {
        // Second click: set end date
        if (date < deliveryDateStart) {
          // If end date is before start date, swap them
          setDeliveryDateEnd(deliveryDateStart);
          setDeliveryDateStart(date);
        } else {
          setDeliveryDateEnd(date);
        }
        // Keep calendar open so user can see the selection
      } else {
        // Both dates set: reset and start new selection
        setDeliveryDateStart(date);
        setDeliveryDateEnd(null);
      }
    }
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    
    const startDate = calendarType === 'order' ? orderDateStart : deliveryDateStart;
    const endDate = calendarType === 'order' ? orderDateEnd : deliveryDateEnd;

    const changeMonth = (direction: 'prev' | 'next') => {
      const newDate = new Date(currentMonth);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentMonth(newDate);
    };

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.calendarNavButton}>
            <Ionicons name="chevron-back" size={24} color="#2E2C55" />
          </TouchableOpacity>
          <Text style={styles.calendarMonthText}>{monthName}</Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.calendarNavButton}>
            <Ionicons name="chevron-forward" size={24} color="#2E2C55" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarWeekDays}>
          {weekDays.map(day => (
            <View key={day} style={styles.calendarWeekDay}>
              <Text style={styles.calendarWeekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarDays}>
          {days.map((date, index) => {
            if (date === null) {
              return <View key={`empty-${index}`} style={styles.calendarDay} />;
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateOnly = new Date(date);
            dateOnly.setHours(0, 0, 0, 0);
            const isToday = dateOnly.getTime() === today.getTime();
            const isStart = startDate && date.toDateString() === startDate.toDateString();
            const isEnd = endDate && date.toDateString() === endDate.toDateString();
            const isSelected = isStart || isEnd;
            const isInRange = startDate && endDate && date >= startDate && date <= endDate && !isStart && !isEnd;

            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.calendarDay,
                  isToday && !isSelected && !isInRange && styles.calendarDayToday,
                  isInRange && !isStart && !isEnd && styles.calendarDayInRange,
                  isStart && styles.calendarDayStart,
                  isEnd && styles.calendarDayEnd,
                ]}
                onPress={() => handleDateSelect(date)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.calendarDayText,
                  isToday && !isSelected && !isInRange && styles.calendarDayTextToday,
                  (isStart || isEnd) && styles.calendarDayTextSelected,
                ]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {(startDate || endDate) && (
          <View style={styles.calendarDateRange}>
            <Text style={styles.calendarDateRangeText}>
              {startDate ? `Von: ${formatDate(startDate)}` : 'Von: -'} 
              {'  '}
              {endDate ? `Bis: ${formatDate(endDate)}` : 'Bis: -'}
            </Text>
            <TouchableOpacity
              style={styles.calendarClearButton}
              onPress={() => {
                if (calendarType === 'order') {
                  setOrderDateStart(null);
                  setOrderDateEnd(null);
                  setSelectedOrderDate(null);
                } else {
                  setDeliveryDateStart(null);
                  setDeliveryDateEnd(null);
                  setSelectedDeliveryDate(null);
                }
                setShowOrderDateCalendar(false);
                setShowDeliveryDateCalendar(false);
              }}
            >
              <Text style={styles.calendarClearButtonText}>Zurücksetzen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
              <Text style={styles.logoText}>Bestellungen</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Bestellung suchen..."
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
              {selectedOrderDate || selectedDeliveryDate || selectedOrderedBy || selectedInternalTags.size > 0 || selectedCancellation || selectedGroups.size > 0 || orderDateStart || orderDateEnd || deliveryDateStart || deliveryDateEnd ? (
                <>
                  {selectedOrderDate && (
                    <TouchableOpacity
                      style={styles.filterChip}
                      onPress={() => {
                        setSelectedOrderDate(null);
                        setOrderDateStart(null);
                        setOrderDateEnd(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{selectedOrderDate}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  )}
                  {(orderDateStart || orderDateEnd) && (
                    <TouchableOpacity
                      style={styles.filterChip}
                      onPress={() => {
                        setOrderDateStart(null);
                        setOrderDateEnd(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>
                        Bestelldatum: {orderDateStart ? formatDate(orderDateStart) : '-'} - {orderDateEnd ? formatDate(orderDateEnd) : '-'}
                      </Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  )}
                  {selectedDeliveryDate && (
                    <TouchableOpacity
                      style={styles.filterChip}
                      onPress={() => {
                        setSelectedDeliveryDate(null);
                        setDeliveryDateStart(null);
                        setDeliveryDateEnd(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{selectedDeliveryDate}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  )}
                  {(deliveryDateStart || deliveryDateEnd) && (
                    <TouchableOpacity
                      style={styles.filterChip}
                      onPress={() => {
                        setDeliveryDateStart(null);
                        setDeliveryDateEnd(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>
                        Lieferdatum: {deliveryDateStart ? formatDate(deliveryDateStart) : '-'} - {deliveryDateEnd ? formatDate(deliveryDateEnd) : '-'}
                      </Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  )}
                  {selectedOrderedBy && (
                    <TouchableOpacity
                      style={styles.filterChip}
                      onPress={() => setSelectedOrderedBy(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{selectedOrderedBy}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  )}
                  {Array.from(selectedInternalTags).map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={styles.filterChip}
                      onPress={() => toggleFilter(selectedInternalTags, setSelectedInternalTags, tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{tag}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  ))}
                  {selectedCancellation && (
                    <TouchableOpacity
                      style={styles.filterChip}
                      onPress={() => setSelectedCancellation(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipText}>{selectedCancellation}</Text>
                      <Ionicons name="close-circle" size={16} color="#2E2C55" style={styles.filterChipClose} />
                    </TouchableOpacity>
                  )}
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
                </>
              ) : (
                <Text style={styles.noFiltersText}>Keine Filter aktiv</Text>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
      
      {filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Keine Bestellungen gefunden</Text>
        </View>
      )}

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
              {/* Bestelldatum */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionTitleRow}>
                  <Text style={styles.filterSectionTitle}>Bestelldatum</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCalendarType('order');
                      setShowOrderDateCalendar(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.customDateLink}>
                      {orderDateStart || orderDateEnd ? `${orderDateStart ? formatDate(orderDateStart) : '-'} - ${orderDateEnd ? formatDate(orderDateEnd) : '-'}` : 'benutzerdefinierte Termine'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.filterLabelsContainer}>
                  {ORDER_DATES.map(date => {
                    const isSelected = selectedOrderDate === date;
                    return (
                      <TouchableOpacity
                        key={date}
                        style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                        onPress={() => {
                          setSelectedOrderDate(isSelected ? null : date);
                          setOrderDateStart(null);
                          setOrderDateEnd(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterLabelText, isSelected && styles.filterLabelTextSelected]}>
                          {date}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Lieferdatum */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionTitleRow}>
                  <Text style={styles.filterSectionTitle}>Lieferdatum</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCalendarType('delivery');
                      setShowDeliveryDateCalendar(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.customDateLink}>
                      {deliveryDateStart || deliveryDateEnd ? `${deliveryDateStart ? formatDate(deliveryDateStart) : '-'} - ${deliveryDateEnd ? formatDate(deliveryDateEnd) : '-'}` : 'benutzerdefinierte Termine'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.filterLabelsContainer}>
                  {DELIVERY_DATES.map(date => {
                    const isSelected = selectedDeliveryDate === date;
                    return (
                      <TouchableOpacity
                        key={date}
                        style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                        onPress={() => {
                          setSelectedDeliveryDate(isSelected ? null : date);
                          setDeliveryDateStart(null);
                          setDeliveryDateEnd(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterLabelText, isSelected && styles.filterLabelTextSelected]}>
                          {date}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Bestellt von */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Bestellt von</Text>
                <View style={styles.filterLabelsContainer}>
                  {ORDERED_BY.map(option => {
                    const isSelected = selectedOrderedBy === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                        onPress={() => setSelectedOrderedBy(isSelected ? null : option)}
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

              {/* Interne Tags */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Interne Tags</Text>
                <View style={styles.filterLabelsContainer}>
                  {INTERNAL_TAGS.map(tag => {
                    const isSelected = selectedInternalTags.has(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                        onPress={() => toggleFilter(selectedInternalTags, setSelectedInternalTags, tag)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterLabelText, isSelected && styles.filterLabelTextSelected]}>
                          {tag}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color="#2E2C55" style={styles.filterLabelCheck} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Stornierung */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Stornierung</Text>
                <View style={styles.filterLabelsContainer}>
                  {CANCELLATION.map(option => {
                    const isSelected = selectedCancellation === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
                        onPress={() => setSelectedCancellation(isSelected ? null : option)}
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
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterModalClearButton}
                onPress={() => {
                  setSelectedOrderDate(null);
                  setSelectedDeliveryDate(null);
                  setSelectedOrderedBy(null);
                  setSelectedInternalTags(new Set());
                  setSelectedCancellation(null);
                  setSelectedGroups(new Set());
                  setOrderDateStart(null);
                  setOrderDateEnd(null);
                  setDeliveryDateStart(null);
                  setDeliveryDateEnd(null);
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
          
          {/* Calendar Overlay inside Filter Modal */}
          {(showOrderDateCalendar || showDeliveryDateCalendar) && (
            <View style={styles.calendarOverlay}>
              <TouchableOpacity
                style={styles.calendarOverlayBackdrop}
                activeOpacity={1}
                onPress={() => {
                  setShowOrderDateCalendar(false);
                  setShowDeliveryDateCalendar(false);
                }}
              />
              <View style={styles.calendarModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {(() => {
                    const startDate = calendarType === 'order' ? orderDateStart : deliveryDateStart;
                    const endDate = calendarType === 'order' ? orderDateEnd : deliveryDateEnd;
                    if (!startDate) {
                      return 'Anfang auswählen';
                    } else if (!endDate) {
                      return 'Ende auswählen';
                    } else {
                      return 'Datum auswählen';
                    }
                  })()}
                </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowOrderDateCalendar(false);
                      setShowDeliveryDateCalendar(false);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#2E2C55" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.calendarScrollView} contentContainerStyle={styles.calendarScrollContent}>
                  {renderCalendar()}
                </ScrollView>
              </View>
            </View>
          )}
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
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#2E2C55',
    padding: 0,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  orderItem: {
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
  orderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  orderInfo: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  orderCustomerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E2C55',
    flex: 1,
  },
  cancelledLabel: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  cancelledLabelText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  orderDetails: {
    flexDirection: 'column',
    gap: 4,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDetailText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
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
  filterSectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 12,
  },
  customDateLink: {
    fontSize: 14,
    color: '#2E2C55',
    textDecorationLine: 'underline',
    fontWeight: '500',
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
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    justifyContent: 'flex-end',
  },
  calendarOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 2001,
  },
  calendarScrollView: {
    maxHeight: '100%',
  },
  calendarScrollContent: {
    paddingBottom: 20,
  },
  calendarContainer: {
    padding: 16,
    paddingBottom: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E2C55',
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },
  calendarDayToday: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: '#1976d2',
    borderRadius: 20,
  },
  calendarDayStart: {
    backgroundColor: '#1976d2',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  calendarDayEnd: {
    backgroundColor: '#1976d2',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  calendarDayInRange: {
    backgroundColor: '#e3f2fd',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#2E2C55',
  },
  calendarDayTextToday: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarDateRange: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarDateRangeText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  calendarClearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  calendarClearButtonText: {
    fontSize: 14,
    color: '#2E2C55',
    fontWeight: '500',
  },
});

