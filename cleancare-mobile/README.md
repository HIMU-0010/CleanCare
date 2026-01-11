# CleanCare Mobile

The official mobile application for **CleanCare**, a smart waste management and civic issue resolution platform. Built with **React Native** and **Expo**, this app delivers a seamless experience for both Citizens (`reporting issues`) and Administrators (`managing workforce and resolution`).

##  Key Features

### For Citizens
*   **Easy Reporting**: Intuitively file complaints with photos/videos and precise location pinning.
*   **Real-time Tracking**: Monitor the status of filed complaints from "Submitted" to "Resolved".
*   **Push Notifications**: Receive instant updates when a complaint status changes.
*   **Authentication**: Secure login via Phone OTP (Firebase) or Social Auth.

### For Admins
*   **Mobile Dashboard**: At-a-glance view of pending, in-progress, and resolved complaints.
*   **Workforce Management**: Assign tasks and update statuses on the go.
*   **Evidence Upload**: Upload proof of resolution (images/videos) directly from the field.
*   **Role-Specific Views**: Tailored interfaces for Ward Admins, Master Admins, and Super Admins.

## 🛠 Tech Stack

*   **Framework**: [React Native](https://reactnative.dev/) via [Expo](https://expo.dev/) (Managed Workflow)
*   **Language**: TypeScript
*   **Navigation**: React Navigation (Stack, Bottom Tabs)
*   **Maps**: `react-native-maps` (Google Maps integration)
*   **Networking**: Axios
*   **Authentication**: Firebase Auth (Phone Provider)
*   **Notifications**: Expo Notifications + Firebase Cloud Messaging (FCM)

---

##  Prerequisites

*   **Node.js** (v18+)
*   **Expo Go App** installed on your physical device (iOS/Android) OR Android Studio/Xcode for emulators.
*   **CleanCare Backend** running locally or deployed.

##  Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cleancare-mobile.git
    cd cleancare-mobile
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory to point to your backend:

    ```env
    # IMPORTANT: Use your computer's Local IP (e.g., 192.168.x.x), NOT localhost.
    # localhost on the phone refers to the phone itself.
    EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
    ```

##  Running the App

1.  **Start the Expo Development Server:**
    ```bash
    npx expo start
    ```

2.  **Run on Device/Emulator:**
    *   **Physical Device**: Scan the QR code displayed in the terminal using the **Expo Go** app (Android) or Camera app (iOS).
    *   **Android Emulator**: Press `a` in the terminal.
    *   **iOS Simulator**: Press `i` in the terminal (macOS only).

---

##  Connecting to Backend

The app is configured to communicate with the CleanCare Backend via the URL defined in `EXPO_PUBLIC_API_URL`.

**File**: `src/config/api.ts`

> [!WARNING]
> If you are running the backend locally:
> Ensure both your phone and computer are on the **same Wi-Fi network**.
> Do **not** use `localhost` in the specific `EXPO_PUBLIC_API_URL`. Use your machine's local IP address (e.g., `192.168.0.105`).

---

##  Project Structure

```text
src/
├── config/         # App configuration (API, Firebase)
├── navigation/     # Navigation stacks (Root, Auth, Main)
├── screens/
│   ├── auth/       # Login, Register, OTP screens
│   ├── citizen/    # Home, New Complaint, History
│   └── admin/      # Dashboard, Complaint Details, Workforce
├── components/     # Reusable UI components (Buttons, Cards, Inputs)
├── services/       # API integration services (Auth, Complaints)
├── styles/         # Global theme and style definitions
└── utils/          # Helper functions (Date formatting, Validation)
```

##  Credentials & Keys

*   **Firebase Config**: Currently located in `src/config/firebase.ts`. Ensure your Firebase project is set up with Phone Authentication enabled.
*   **Google Maps API Key**: Configure in `app.json` under `android.config.googleMaps.apiKey` and `ios.config.googleMapsApiKey`.

##  Contribution

1.  Fork the repo.
2.  Create a fresh branch.
3.  Make your UI/UX improvements.
4.  Submit a Pull Request!
