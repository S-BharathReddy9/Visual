# 📱 TrackWise - Android App & APK Guide

**TrackWise** is your personal daily expense and work/to-do tracker. It is configured as both an **Android Capacitor Native Project** (to generate a standalone `.apk`) and an **Installable Progressive Web App (PWA)** (for instant 1-tap installation directly from Google Chrome on your Android phone).

---

## ⚡ Option 1: Instant Install on Android (Recommended - No Heavy SDK Needed)

You can run and install TrackWise on your Android phone immediately:

1. **Start the local network server**:
   In your project directory (`c:\Academics\Tracking`), run:
   ```bash
   npm run dev -- --host
   ```
2. **Open on your Android phone**:
   - Ensure your Android phone is connected to the same Wi-Fi network as your computer.
   - Look at the terminal output for the Network URL (e.g. `http://10.198.130.233:5173/` or your local IP).
   - Open that URL in **Google Chrome** on your phone.
3. **Install to Home Screen & App Drawer**:
   - Tap the **"Android"** button in the top right or the install banner.
   - Or tap the Chrome 3-dot menu (⋮) at the top-right and select **"Install app"** or **"Add to Home screen"**.
   - The app will install with its custom glowing TrackWise app icon, launch in full-screen standalone mode (no browser URL bar), and work completely offline!

---

## 📦 Option 2: Generate Standalone Android `.apk` (Capacitor)

The complete native Android project has already been generated in the [`android/`](file:///c:/Academics/Tracking/android) directory with Capacitor.

### Prerequisites:
- Java JDK (already installed on your machine)
- Android Studio or Android SDK command line tools

### Steps to Build the APK:

1. **Build & Sync Latest Code**:
   ```bash
   npm run cap:sync
   ```
   *(This builds the web assets into `dist/` and updates the Android project assets).*

2. **Open in Android Studio (Easiest)**:
   ```bash
   npm run cap:open
   ```
   - Android Studio will open the [`android/`](file:///c:/Academics/Tracking/android) project.
   - Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   - Once finished, Android Studio will show a popup with a **"locate"** link to your `app-debug.apk`!

3. **Or Build Directly via Command Line (Gradle)**:
   ```cmd
   cd android
   gradlew.bat assembleDebug
   ```
   Your compiled APK installer will be located at:
   ```
   android\app\build\outputs\apk\debug\app-debug.apk
   ```

4. **Install on Phone**:
   - Send `app-debug.apk` to your phone (via WhatsApp, Google Drive, Telegram, or USB cable).
   - Tap on the APK file on your Android phone and select **"Install"**.

---

## ✨ Key Features in TrackWise

1. **Daily Expense Tracking**:
   - Track every transaction with amount, merchant/description, category, date, and notes.
   - **Payment Labels**: Track exactly how you paid:
     - ⚡ **UPI** (Google Pay, PhonePe, Paytm)
     - 💵 **Cash** (Paper currency)
     - 💳 **Debit Card** (Direct bank swipe)
     - 💳 **Credit Card** (Postpaid)
     - 🏦 **Net Banking** (NEFT / IMPS)
     - 🔄 **Other**
   - Quick Amount Chips: Instant one-tap additions (+₹50, +₹100, +₹200, +₹500, +₹1000).

2. **Budget Limits & Live Alerts**:
   - Configure custom daily and monthly budget caps in **Settings**.
   - Dynamic alert status:
     - 🟢 **Safe & On Track**: Below 75% daily spend.
     - 🟡 **Approaching Limit**: 75% – 99% daily spend.
     - 🔴 **Budget Exceeded Alert**: 100%+ spent with exact overspend indicator.

3. **Daily Work & TO-DO List**:
   - Add tasks with priority levels: 🔥 High, ⚡ Medium, 🌿 Low.
   - Categorize by Work 💼, Study 📚, Personal 🧘, Errands 🛒.
   - **Recurring Daily Habits & Work**:
     - Toggle "Recurring Daily Habit" to track daily routines (e.g. morning plan, workout, standup).
     - Keeps a live **🔥 Streak counter** that automatically resets every morning for that day's checklist while preserving streaks!
   - Confetti animation and tactile feedback upon task completion.

4. **Visual Analytics & Breakdowns**:
   - **Donut Chart**: Spending distribution by payment mode (UPI vs Cash vs Debit Card).
   - **Donut Chart**: Spending distribution by category (Food, Commute, Groceries, etc.).
   - **7-Day Trend Bar Chart**: Recent daily spend with your daily budget limit guideline.
   - **Monthly Budget Meter**: Current month spend vs monthly budget.

5. **Offline & Data Backup**:
   - 100% offline persistence using LocalStorage & Service Worker.
   - Export and import your entire database in clean JSON format at any time in **Settings**.
