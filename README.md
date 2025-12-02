# TrinkFix

Eine moderne React Native App für iPhone und Android.

## Voraussetzungen

Bevor du startest, stelle sicher, dass folgende Tools installiert sind:

### Allgemein
- **Node.js** (Version 18 oder höher)
- **npm** oder **yarn**
- **Git**

### Für iOS Entwicklung (nur macOS)
- **Xcode** (über App Store)
- **CocoaPods**: `sudo gem install cocoapods`
- **iOS Simulator** (wird mit Xcode installiert)

### Für Android Entwicklung
- **Android Studio**
- **Android SDK** (wird mit Android Studio installiert)
- **Java Development Kit (JDK)** 17 oder höher
- **Android Emulator** (über Android Studio)

## Installation

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Für iOS (nur macOS):**
   ```bash
   cd ios
   pod install
   cd ..
   ```

## Entwicklung

### App starten

```bash
npm start
```

Dies startet den Expo Development Server. Du kannst dann:

- **Für iOS**: `npm run ios` oder drücke `i` im Terminal
- **Für Android**: `npm run android` oder drücke `a` im Terminal
- **Für Web**: `npm run web` oder drücke `w` im Terminal

### Mit physischem Gerät testen

1. Installiere die **Expo Go** App auf deinem iPhone oder Android Gerät:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Starte den Development Server mit `npm start`

3. Scanne den QR-Code mit:
   - **iOS**: Kamera App
   - **Android**: Expo Go App

## Projektstruktur

```
TrinkFix/
├── App.tsx          # Hauptkomponente der App
├── app.json         # Expo Konfiguration
├── assets/          # Bilder und Icons
├── index.ts         # Entry Point
└── package.json     # Dependencies und Scripts
```

## Nützliche Befehle

- `npm start` - Startet den Expo Development Server
- `npm run ios` - Startet die App im iOS Simulator
- `npm run android` - Startet die App im Android Emulator
- `npm run web` - Startet die App im Browser

## Nächste Schritte

- Beginne mit der Entwicklung in `App.tsx`
- Füge neue Screens und Komponenten hinzu
- Installiere zusätzliche Expo Packages nach Bedarf

## Dokumentation

- [Expo Dokumentation](https://docs.expo.dev/)
- [React Native Dokumentation](https://reactnative.dev/)
- [TypeScript Dokumentation](https://www.typescriptlang.org/)

