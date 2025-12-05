# BestellKartell

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
BestellKartell/
├── App.tsx          # Hauptkomponente der App
├── app.json         # Expo Konfiguration
├── assets/          # Bilder und Icons
├── index.ts         # Entry Point
└── package.json     # Dependencies und Scripts
```

## IPA Build für iOS

Um eine IPA-Datei für iOS zu erstellen, gibt es mehrere Möglichkeiten:

### Option 1: EAS Build (Cloud) - Empfohlen

1. **EAS CLI installieren:**
   ```bash
   npm install -g eas-cli
   ```

2. **Bei Expo anmelden:**
   ```bash
   eas login
   ```

3. **IPA Build starten:**
   ```bash
   # Für TestFlight/App Store (Production Build)
   eas build --platform ios --profile production
   
   # Für interne Tests (Preview Build)
   eas build --platform ios --profile preview
   ```

4. **Build herunterladen:**
   Nach dem Build kannst du die IPA-Datei von der EAS Build-Seite herunterladen.

### Option 2: EAS Build (Lokal) - Auf deinem Mac

1. **Voraussetzungen:**
   - macOS mit Xcode installiert
   - Apple Developer Account
   - EAS CLI installiert: `npm install -g eas-cli`

2. **Lokalen Build starten:**
   ```bash
   eas build --platform ios --profile production --local
   ```

   Dies erstellt die IPA-Datei lokal auf deinem Mac.

### Option 3: Manuell mit Xcode (Erweiterte Option)

1. **Expo Prebuild ausführen:**
   ```bash
   npx expo prebuild
   ```

2. **Xcode Projekt öffnen:**
   ```bash
   open ios/TrinkFix.xcworkspace
   ```

3. **In Xcode:**
   - Wähle "Any iOS Device" als Ziel
   - Product → Archive
   - Nach dem Archivieren: "Distribute App"
   - Wähle "Ad Hoc" oder "App Store Connect"
   - Exportiere die IPA-Datei

### Build-Profile in eas.json

Die folgenden Profile sind konfiguriert:
- `production`: Für App Store Veröffentlichung
- `preview`: Für interne Tests (Ad Hoc)
- `preview-manual`: Manuelle Verteilung
- `development`: Development Build mit Expo Dev Client

## Nützliche Befehle

- `npm start` - Startet den Expo Development Server
- `npm run ios` - Startet die App im iOS Simulator
- `npm run android` - Startet die App im Android Emulator
- `npm run web` - Startet die App im Browser
- `eas build --platform ios` - Erstellt iOS Build

## Nächste Schritte

- Beginne mit der Entwicklung in `App.tsx`
- Füge neue Screens und Komponenten hinzu
- Installiere zusätzliche Expo Packages nach Bedarf

## Dokumentation

- [Expo Dokumentation](https://docs.expo.dev/)
- [React Native Dokumentation](https://reactnative.dev/)
- [TypeScript Dokumentation](https://www.typescriptlang.org/)

