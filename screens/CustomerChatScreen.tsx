import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, PanResponder, Dimensions, Keyboard } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

interface CustomerChatScreenProps {
  customer: Customer;
  onBack: () => void;
  initialMessages?: ChatMessage[];
  onMessageSent?: (customerId: string, message: ChatMessage) => void;
  onChatOpened?: (customerId: string) => void;
  onShowAllChats?: () => void;
}

export default function CustomerChatScreen({
  customer,
  onBack,
  initialMessages,
  onMessageSent,
  onChatOpened,
  onShowAllChats,
}: CustomerChatScreenProps) {
  // Debug: Prüfe ob onShowAllChats übergeben wird
  console.log('CustomerChatScreen - onShowAllChats:', !!onShowAllChats);
  const [message, setMessage] = useState('');
  
  // Konvertiere initialMessages zu dem Format, das wir verwenden
  // Der Benutzer ist Trinkkartell (Vertriebsmitarbeiter), der Kunde ist der andere
  const convertMessages = (msgs?: ChatMessage[]) => {
    if (!msgs || msgs.length === 0) {
      return [
        {
          id: 'trinkkartell-initial',
          text: TRINKKARTELL_MESSAGE,
          isUser: true, // Trinkkartell (wir) schreibt rechts
          timestamp: new Date(),
          senderName: 'Trinkkartell',
        },
      ];
    }
    
    return msgs.map(msg => ({
      id: msg.id,
      text: msg.text,
      // 'user' bedeutet Trinkkartell (wir), 'customer' bedeutet der Kunde
      isUser: msg.sender === 'user', // Trinkkartell schreibt rechts
      timestamp: msg.timestamp,
      senderName: msg.sender === 'user' ? 'Trinkkartell' : customer.name,
    }));
  };
  
  const [messages, setMessages] = useState<Array<{ id: string; text: string; isUser: boolean; timestamp: Date; senderName?: string }>>(
    convertMessages(initialMessages)
  );
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Aktualisiere Nachrichten, wenn initialMessages sich ändert (z.B. wenn neue Nachrichten gesendet wurden)
  useEffect(() => {
    const converted = convertMessages(initialMessages);
    setMessages(converted);
    // Scrolle nach unten, wenn Nachrichten aktualisiert werden
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [initialMessages]);
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
  
  useEffect(() => {
    // Markiere Chat als geöffnet (nur einmal beim Mount)
    if (onChatOpened) {
      onChatOpened(customer.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const closeOverlay = () => {
    Keyboard.dismiss();
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
          Keyboard.dismiss();
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

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isUser: true, // Der Benutzer ist Trinkkartell (schreibt rechts)
        timestamp: new Date(),
        senderName: 'Trinkkartell', // Der Benutzer schreibt als Trinkkartell
      };
      
      // Füge Nachricht lokal hinzu
      setMessages(prev => [...prev, newMessage]);
      
      // Speichere die Nachricht für die Chat-Übersicht und persistiere sie
      // 'user' bedeutet, dass Trinkkartell (der Benutzer) geschrieben hat
      if (onMessageSent) {
        onMessageSent(customer.id, {
          id: newMessage.id,
          sender: 'user', // Der Benutzer schreibt als Trinkkartell
          text: newMessage.text,
          timestamp: newMessage.timestamp,
        });
      }
      
      // Scrolle nach unten, wenn eine neue Nachricht gesendet wird
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      setMessage('');
    }
  };

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
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>{customer.name}</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>
          
          <View style={styles.chatContainer}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageContainer,
                    msg.isUser && styles.messageContainerRight
                  ]}
                >
                  {msg.senderName && (
                    <Text style={[
                      styles.senderName,
                      msg.isUser && styles.senderNameRight
                    ]}>
                      {msg.senderName}
                    </Text>
                  )}
                  <View style={[
                    styles.messageBubble,
                    msg.isUser && styles.messageBubbleRight
                  ]}>
                    <Text style={[
                      styles.messageText,
                      msg.isUser && styles.messageTextRight
                    ]}>
                      {msg.text}
                    </Text>
                  </View>
                  <Text style={[
                    styles.messageTime,
                    msg.isUser && styles.messageTimeRight
                  ]}>
                    {msg.timestamp.toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))}
            </ScrollView>
            
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
            >
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nachricht schreiben..."
                    placeholderTextColor="#999"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={500}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                  onPress={sendMessage}
                  disabled={!message.trim()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="send" size={20} color={message.trim() ? "#fff" : "#ccc"} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    zIndex: 1200,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    height: SCREEN_HEIGHT * 0.95,
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
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2C55',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  chatsIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginRight: 4,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  messageContainerRight: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E2C55',
    marginBottom: 4,
    marginLeft: 4,
  },
  senderNameRight: {
    marginLeft: 0,
    marginRight: 4,
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageBubbleRight: {
    backgroundColor: '#2E2C55',
    borderColor: '#2E2C55',
  },
  messageText: {
    fontSize: 15,
    color: '#2E2C55',
    lineHeight: 22,
  },
  messageTextRight: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    marginLeft: 4,
  },
  messageTimeRight: {
    marginLeft: 0,
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 48,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2E2C55',
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E2C55',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0,
    elevation: 0,
  },
});

