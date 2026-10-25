# Student Attendance Management Mobile Application

A cross-platform React Native mobile application engineered for colleges and universities to automate student registration, daily roll call marking, dynamic percentage calculation, examination defaulter detection (<75%), persistent offline storage, and analytical reporting.

---

## 🌟 Key Features

1. **Student Registration & Directory**
   - Register students with Full Name, unique Roll Number/ID, Batch/Class, Email, Phone, and Gender.
   - Live search by Name or Roll Number.
   - Filter directory by Class / Batch.
   - Full CRUD operations (Add, View Profile, Edit, Delete).
   - In-app Demo Data generator for instant evaluation.

2. **Attendance Marking & Roll Call Register**
   - Date selector (defaults to current date, quick previous/next day navigation).
   - Class/Batch selector.
   - Subject / Course Topic assignment.
   - Individual student status toggles: **Present (P)**, **Absent (A)**, **Late (L)**.
   - Bulk action buttons: *Mark All Present*, *Mark All Absent*, *Clear*.
   - Live header metrics: Total, Present, Absent, Late, and Current Session Rate.
   - Persistent storage with edit & update capability for previously marked sessions.

3. **Percentage Calculation & Defaulter Engine**
   - Academic attendance percentage calculation:
     $$\text{Attendance \%} = \frac{\text{Present} + 0.5 \times \text{Late}}{\text{Total Sessions}} \times 100$$
   - Color-coded compliance thresholds:
     - 🟢 **Safe ($\ge 75\%$)**: Eligible for semester examinations.
     - 🟡 **Warning ($65\% - 74.9\%$)**: At risk.
     - 🔴 **Critical Shortage ($< 65\%$)**: Examination defaulter.
   - **Consecutive Recovery Calculator**: Dynamically calculates the exact number of consecutive classes a student must attend to cross the 75% threshold!

4. **Analytics & Reports**
   - **Date-Wise Reports**: Session breakdown with status filters (All, Present, Absent, Late).
   - **Student Rankings**: Ranked leaderboard of students by cumulative percentage.
   - **Defaulters Report**: Filtered list of students with attendance shortage for college administration.
   - **Export & Share**: Direct export and sharing of reports via native Share dialog (WhatsApp, Email, Drive, etc.).

5. **Persistent Local Storage**
   - Powered by `@react-native-async-storage/async-storage`.
   - Complete offline functionality with zero external database dependencies.
   - Built-in data backup and demo data seeding.

---

## 📱 React Native Concepts Demonstrated

- **Functional Components & React Hooks**: `useState`, `useEffect`, `useCallback`, `useContext`.
- **Global State Architecture**: React Context API (`AttendanceContext`) providing reactive updates across all navigation stacks.
- **Modern Navigation**: React Navigation 7 (`@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`).
- **High-Performance List Views**: `FlatList` with `keyExtractor`, `ListEmptyComponent`, and horizontal scrolling.
- **Modular Design**: Reusable components (`StatCard`, `ProgressBar`, `AttendanceStatusBadge`, `SearchBar`, `EmptyState`, `Header`).
- **Device APIs**: React Native `Share` API, `Linking` API (phone calls, email), `Platform` adaptations, `KeyboardAvoidingView`.

---

## 📂 Project Architecture

```
student-attendance-app/
├── assets/                  # Icons and splash images
├── src/
│   ├── constants/
│   │   ├── colors.js        # Design tokens and theme colors
│   │   └── defaultData.js   # Mock students and sample attendance generator
│   ├── context/
│   │   └── AttendanceContext.js # Central reactive state provider
│   ├── services/
│   │   └── storageService.js    # AsyncStorage CRUD and analytics engine
│   ├── components/
│   │   ├── Header.js            # Universal screen header
│   │   ├── StatCard.js          # Metric cards
│   │   ├── AttendanceStatusBadge.js # P/A/L status badges
│   │   ├── ProgressBar.js       # Dynamic threshold progress indicator
│   │   ├── SearchBar.js         # Search input with clear action
│   │   └── EmptyState.js        # Fallback view for empty datasets
│   ├── screens/
│   │   ├── DashboardScreen.js       # Summary analytics, metrics & actions
│   │   ├── MarkAttendanceScreen.js  # Interactive roll-call register
│   │   ├── StudentsScreen.js        # Student directory and search
│   │   ├── AddEditStudentScreen.js  # Student registration form
│   │   ├── StudentDetailScreen.js   # Profile, history & recovery formula
│   │   └── ReportsScreen.js         # Date-wise, Rankings, Defaulters & Share
│   └── navigation/
│       └── AppNavigator.js          # Bottom tabs and stack router
├── docs/
│   └── PROJECT_REPORT.md    # Full Academic Project Report
├── App.js                   # Root entry component
├── app.json                 # Expo app configuration
└── package.json             # Project dependencies
```

---

## 🚀 How to Run the Application

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go App on your mobile device (Android / iOS)

### Step 1: Navigate to Project Directory
```powershell
cd D:\1.MCA-PROJECTS\student-attendance-app
```

### Step 2: Start Expo Development Server
```powershell
npx expo start
```

### Step 3: Launch on Your Preferred Platform
- **On Physical Mobile Phone (Expo Go Sandbox)**:
  1. Open the **Expo Go** app on your phone.
  2. Scan the QR code displayed in the terminal.
- **On Web Browser**:
  - Press `w` in the terminal to launch the web preview in your browser (`http://localhost:8081`).
- **On Android Emulator**:
  - Press `a` in the terminal (requires Android Studio installed).

---

## 📦 How to Build Standalone APK (Install Directly on Phone)

To install the app permanently on your Android phone as a standalone app with its own home screen icon and 100% offline support (no laptop needed):

1. **Log in to Expo:**
   ```powershell
   npx eas-cli login
   ```
2. **Build Standalone APK:**
   ```powershell
   npx eas-cli build -p android --profile preview
   ```
3. Scan the generated QR code or open the download link to install the `.apk` on your phone!

---

## 📑 Included MCA Project Reports

- 📄 **10-Page Academic Project Report:** [`docs/StudentAttendanceApp_10Page_Report.docx`](docs/StudentAttendanceApp_10Page_Report.docx)
- 📄 **Comprehensive Detailed Report:** [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md)
- 📄 **Original Full Report:** [`docs/StudentAttendanceApp_Report.docx`](docs/StudentAttendanceApp_Report.docx)

---

## 🎓 Academic Evaluation Tips

1. When testing the app, click **"Demo Data"** on the Dashboard. This immediately loads 10 students across *MCA 1st Year* and *MCA 2nd Year* along with 8 days of realistic attendance history.
2. Visit the **Reports** tab and switch to **Defaulters** to showcase the examination eligibility detection and consecutive classes recovery algorithm to the examiner.
3. Test adding a new student in the **Students** tab, mark today's roll call in the **Mark Attendance** tab, and observe the live percentage update on the **Dashboard**.
