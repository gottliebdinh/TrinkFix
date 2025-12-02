import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, PanResponder, Dimensions } from 'react-native';
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

interface CustomerChatScreenProps {
  customer: Customer;
  onBack: () => void;
}

export default function CustomerChatScreen({
  customer,
  onBack,
}: CustomerChatScreenProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; isUser: boolean; timestamp: Date; senderName?: string }>>([
    {
      id: 'trinkkartell-initial',
      text: TRINKKARTELL_MESSAGE,
      isUser: false,
      timestamp: new Date(),
      senderName: 'Trinkkartell',
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);
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
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

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

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isUser: true,
        timestamp: new Date(),
        senderName: 'Trinkkartell',
      };
      setMessages(prev => [...prev, newMessage]);
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
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{customer.name}</Text>
                {customer.phone && (
                  <Text style={styles.headerSubtitle}>{customer.phone}</Text>
                )}
              </View>
              <View style={styles.placeholder} />
            </View>
          </View>
          
          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={true}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageContainer,
                    msg.isUser ? styles.userMessageContainer : styles.customerMessageContainer,
                  ]}
                >
                  {msg.senderName && (
                    <Text style={styles.messageSender}>{msg.senderName}</Text>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      msg.isUser ? styles.userMessage : styles.customerMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.isUser ? styles.userMessageText : styles.customerMessageText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        msg.isUser ? styles.userMessageTime : styles.customerMessageTime,
                      ]}
                    >
                      {msg.timestamp.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nachricht schreiben..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
              />
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
    zIndex: 1200,
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2C55',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    width: 32,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
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
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  customerMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2E2C55',
    borderBottomRightRadius: 4,
  },
  customerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  customerMessageText: {
    color: '#2E2C55',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  customerMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2E2C55',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});

