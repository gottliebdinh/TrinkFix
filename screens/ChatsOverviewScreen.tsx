import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, SafeAreaView, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import customersData from '../data/Kunden/customers.json';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface ChatMessage {
  id: string;
  sender: 'customer' | 'user';
  text: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  customer: Customer;
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
  unanswered: boolean;
  messages: ChatMessage[];
}

interface ChatsOverviewScreenProps {
  onBack: () => void;
  onChatPress?: (customer: Customer, messages: ChatMessage[]) => void;
  savedMessages?: {[key: string]: ChatMessage[]};
  readChats?: Set<string>;
  unansweredChats?: Set<string>;
  onChatRead?: (customerId: string) => void;
}

// Generiere fiktive Chats basierend auf echten Kunden
const generateFictionalChats = (): Chat[] => {
  // Alle Kunden verwenden - sicherstellen dass es ein Array ist
  const allCustomers = customersData as any[];
  const customers = Array.isArray(allCustomers) ? allCustomers : [];
  const now = new Date();
  
  // Trinkkartell-Nachricht als Konstante
  const TRINKKARTELL_MESSAGE = `Liebe Kundinnen und Kunden,

wir haben unsere Liefertage neu aufgeteilt, um unsere Touren effizienter zu gestalten und euch noch besser und planbarer beliefern zu können. 🚛✨

Bitte beachtet: Die neuen Liefertage gelten ab Kalenderwoche 34 (ab Montag, 18. August 2025)!

Hier die Übersicht nach Regionen:

📍 Fürth – Montag, Mittwoch, Donnerstag, Freitag
📍 Nürnberg – Täglich
📍 Forchheim – Montag und Mittwoch
📍 Bamberg – Montag und Freitag
📍 Ingolstadt + Bayreuth – Dienstag und Donnerstag
📍 Schwaig + Röthenbach + Behringersdorf – Montag und Dienstag
📍 Lauf – Dienstag und Mittwoch
📍 Schwabach – Montag und Mittwoch
📍 Velden + Hersbruck + Pommelsbrunn – Mittwoch
📍 Neumarkt + Würzburg – Donnerstag
📍 Heroldsberg – Donnerstag
📍 Zirndorf – Mittwoch
📍 Altdorf + Schwarzenbruck – Mittwoch
📍 Pleinfield + Brombachsee + Weißenburg – Montag und Mittwoch
📍 Amberg – Dienstag
📍 Erlangen – Montag bis Donnerstag

🔶 Büro- und Privatkunden: Lieferung nur noch Montag bis Donnerstag.

Bitte berücksichtigt die neuen Liefertage bei eurer Planung. 💡
Bei Fragen oder Unklarheiten sind wir wie immer gerne für euch da!

Vielen Dank für euer Vertrauen & eure Unterstützung – wir freuen uns auf die weitere Zusammenarbeit! 💙

Herzliche Grüße
Euer Trinkkartell Team 🙌`;

  const chatMessages: { [key: string]: string[] } = {
    unread: [
      "Hallo, wann können Sie uns beliefern?",
      "Wir brauchen dringend Nachschub für das Wochenende",
      "Können Sie die Bestellung für morgen bestätigen?",
      "Gibt es aktuelle Angebote?",
      "Wir haben eine Frage zu unserer letzten Bestellung",
      "Können Sie uns heute noch liefern?",
      "Wir benötigen dringend Bier für unsere Veranstaltung",
      "Ist die Bestellung bereits unterwegs?",
      "Können wir die Lieferzeit ändern?",
      "Wir haben ein Problem mit der letzten Lieferung",
      "Können Sie uns ein Angebot machen?",
      "Wir möchten unsere Bestellung erweitern",
      "Gibt es Rabatte bei größeren Mengen?",
      "Können Sie uns kontaktieren?",
      "Wir warten auf eine Rückmeldung",
    ],
    unanswered: [
      "Hallo, können Sie mir bitte antworten?",
      "Wir warten noch auf eine Rückmeldung",
      "Ist unsere Bestellung bestätigt?",
      "Können Sie uns bitte kontaktieren?",
    ],
  };
  
  return customers.map((customer, index) => {
    // Nur etwa 50 Chats als ungelesen markieren
    const isUnread = index < 50; // Nur die ersten 50 Chats sind ungelesen
    const isUnanswered = index >= 50 && index < 100 && (index - 50) % 3 === 0; // Etwa 17 unbeantwortete Chats nach den ungelesenen
    
    let lastMessage = "";
    let lastMessageTime: Date;
    
    // Generiere mehrere Nachrichten für den Chat
    const messages: ChatMessage[] = [];
    
    // Trinkkartell-Nachricht (immer zuerst)
    const trinkkartellMessageTime = new Date(now);
    trinkkartellMessageTime.setDate(trinkkartellMessageTime.getDate() - 7); // 7 Tage in der Vergangenheit
    
    if (isUnread || isUnanswered) {
      // Für ungelesene/unbeantwortete Chats: Füge Kunden-Nachricht(en) hinzu
      lastMessage = isUnread 
        ? chatMessages.unread[index % chatMessages.unread.length]
        : chatMessages.unanswered[index % chatMessages.unanswered.length];
      
      // Zufällige Zeit in den letzten 7 Tagen
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      lastMessageTime = new Date(now);
      lastMessageTime.setDate(lastMessageTime.getDate() - daysAgo);
      lastMessageTime.setHours(lastMessageTime.getHours() - hoursAgo);
      
      messages.push({
        id: 'trinkkartell-initial',
        sender: 'user',
        text: TRINKKARTELL_MESSAGE,
        timestamp: trinkkartellMessageTime,
      });
      
      messages.push({
        id: 'customer-1',
        sender: 'customer',
        text: lastMessage,
        timestamp: lastMessageTime,
      });
      
      // Für unbeantwortete Chats: Füge eine weitere Nachricht hinzu
      if (isUnanswered) {
        const earlierMessageTime = new Date(lastMessageTime);
        earlierMessageTime.setHours(earlierMessageTime.getHours() - 2);
        messages.push({
          id: 'customer-2',
          sender: 'customer',
          text: chatMessages.unanswered[(index + 1) % chatMessages.unanswered.length],
          timestamp: earlierMessageTime,
        });
      }
    } else {
      // Für answered Chats: Nur die Trinkkartell-Nachricht
      // Verwende die ersten Worte der Nachricht als Vorschau für die Chat-Liste
      const firstLine = TRINKKARTELL_MESSAGE.split('\n')[0];
      lastMessage = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
      lastMessageTime = trinkkartellMessageTime;
      
      messages.push({
        id: 'trinkkartell-initial',
        sender: 'user',
        text: TRINKKARTELL_MESSAGE,
        timestamp: trinkkartellMessageTime,
      });
    }
    
    return {
      id: customer.id,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
      lastMessage,
      lastMessageTime,
      unread: isUnread,
      unanswered: isUnanswered,
      messages: messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    };
  });
};

// Hilfsfunktion: Finde Nachrichten für einen bestimmten Kunden basierend auf ID oder Name
export const getChatMessagesForCustomer = (customerId: string, customerName: string): ChatMessage[] => {
  const chats = generateFictionalChats();
  
  // Versuche zuerst nach ID zu finden
  let chat = chats.find(c => c.customer.id === customerId);
  
  // Falls nicht gefunden, versuche nach Name zu finden (normalisiert)
  if (!chat) {
    const normalizedName = customerName.toLowerCase().trim();
    chat = chats.find(c => {
      const chatName = c.customer.name.toLowerCase().trim();
      return chatName === normalizedName || 
             chatName.includes(normalizedName) || 
             normalizedName.includes(chatName);
    });
  }
  
  // Wenn Chat gefunden, gib die Nachrichten zurück
  if (chat) {
    return chat.messages;
  }
  
  // Falls kein Chat gefunden, gib leeres Array zurück (CustomerChatScreen zeigt dann die Trinkkartell-Nachricht)
  return [];
};

export default function ChatsOverviewScreen({
  onBack,
  onChatPress,
  savedMessages = {},
  readChats = new Set(),
  unansweredChats = new Set(),
  onChatRead,
}: ChatsOverviewScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'unread' | 'unanswered' | 'all'>('unread');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [baseChats] = useState<Chat[]>(generateFictionalChats());
  
  // Merge gespeicherte Nachrichten mit den Basis-Chats
  const chats = useMemo(() => {
    return baseChats.map(chat => {
      const savedChatMessages = savedMessages[chat.customer.id];
      const isRead = readChats.has(chat.customer.id);
      const isUnanswered = unansweredChats.has(chat.customer.id);
      
      if (savedChatMessages && savedChatMessages.length > 0) {
        // Verwende gespeicherte Nachrichten, aber behalte die Chat-Metadaten
        const lastSavedMessage = savedChatMessages[savedChatMessages.length - 1];
        const lastMessageFromCustomer = lastSavedMessage.sender === 'customer';
        const lastMessageFromUser = lastSavedMessage.sender === 'user';
        
        return {
          ...chat,
          messages: savedChatMessages,
          lastMessage: lastSavedMessage.text,
          lastMessageTime: lastSavedMessage.timestamp,
          // Ungelesen: wenn letzte Nachricht vom Kunden ist UND nicht gelesen wurde
          unread: lastMessageFromCustomer && !isRead,
          // Unbeantwortet: wenn letzte Nachricht vom Kunden ist UND gelesen wurde aber nicht beantwortet
          unanswered: lastMessageFromCustomer && isRead && isUnanswered,
        };
      }
      
      // Wenn keine gespeicherten Nachrichten, verwende Basis-Chat-Status
      // Aber berücksichtige, ob der Chat bereits gelesen wurde
      const lastMessage = chat.messages && chat.messages.length > 0 
        ? chat.messages[chat.messages.length - 1] 
        : null;
      const lastMessageFromCustomer = lastMessage && lastMessage.sender === 'customer';
      
      return {
        ...chat,
        unread: !!(lastMessageFromCustomer && !isRead),
        unanswered: !!(lastMessageFromCustomer && isRead && isUnanswered),
      };
    });
  }, [baseChats, savedMessages, readChats, unansweredChats]);
  
  const filteredChats = useMemo(() => {
    let filtered = chats;
    
    // Standard-Verhalten mit Tabs
    if (activeTab === 'unread') {
      filtered = filtered.filter(chat => chat.unread);
    } else if (activeTab === 'unanswered') {
      filtered = filtered.filter(chat => chat.unanswered);
    }
    
    // Filter nach Suchanfrage
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat =>
        chat.customer.name.toLowerCase().includes(query) ||
        chat.lastMessage.toLowerCase().includes(query)
      );
    }
    
    // Sortiere nach Zeit (neueste zuerst)
    return filtered.sort((a, b) => 
      b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
  }, [chats, activeTab, searchQuery]);

  // Kunden für neuen Chat filtern
  const filteredCustomersForNewChat = useMemo(() => {
    const query = newChatSearchQuery.toLowerCase().trim();
    if (!query) return (customersData as Customer[]);
    
    return (customersData as Customer[]).filter(c => 
      c.name.toLowerCase().includes(query)
    );
  }, [newChatSearchQuery]);
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Gestern';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('de-DE', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  };
  
  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => {
        // Markiere Chat als gelesen beim Öffnen
        if (onChatRead && item.unread) {
          onChatRead(item.customer.id);
        }
        // Wenn letzte Nachricht vom Kunden ist, markiere als unbeantwortet
        if (item.messages && item.messages.length > 0) {
          const lastMessage = item.messages[item.messages.length - 1];
          if (lastMessage.sender === 'customer') {
            // Wird in App.tsx behandelt
          }
        }
        onChatPress && onChatPress(item.customer, item.messages);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.chatItemContent}>
        <View style={styles.chatIconContainer}>
          <Ionicons name="person" size={24} color="#2E2C55" />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer.name}
            </Text>
            <Text style={styles.messageTime}>{formatTime(item.lastMessageTime)}</Text>
          </View>
          <View style={styles.chatMessageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unread && (
              <View style={styles.unreadBadge}>
                <View style={styles.unreadBadgeDot} />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.safeAreaTop}>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#2E2C55" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kunden suchen..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
              onPress={() => setActiveTab(activeTab === 'unread' ? 'all' : 'unread')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
                Ungelesen
              </Text>
              {chats.filter(c => c.unread).length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {chats.filter(c => c.unread).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'unanswered' && styles.tabActive]}
              onPress={() => setActiveTab(activeTab === 'unanswered' ? 'all' : 'unanswered')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'unanswered' && styles.tabTextActive]}>
                Unbeantwortet
              </Text>
              {chats.filter(c => c.unanswered).length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {chats.filter(c => c.unanswered).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
      </View>
      
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Keine Chats gefunden' : 'Keine Chats'}
            </Text>
          </View>
        }
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
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
  filterButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2E2C55',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#2E2C55',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    color: '#2E2C55',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  chatItem: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2C55',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  chatMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadBadge: {
    marginLeft: 8,
  },
  unreadBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});

