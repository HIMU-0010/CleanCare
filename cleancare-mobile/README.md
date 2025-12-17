# CleanCare Mobile App

A cross-platform React Native application built with Expo, empowering citizens to report waste issues and administrators to manage their jurisdictions.

##  Tech Stack

-   **Framework**: [React Native](https://reactnative.dev/)
-   **Platform**: [Expo](https://expo.dev/)
-   **Navigation**: React Navigation (Stack)
-   **Map Integration**: React Native Maps
-   **HTTP Client**: Axios

##  Prerequisites

-   **Node.js** (v18+)
-   **Expo Go**: Installed on your physical Android/iOS device.
-   **Android Studio / Xcode**: (Optional) For running on simulators.

##  Installation

1.  Navigate to the mobile directory:
    ```bash
    cd cleancare-mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

##  Configuration

### API Connection
The app needs to know where the backend is running.
Open `src/config/api.ts` and update the `API_URL`:

```typescript
// For Android Emulator
export const API_URL = 'http://10.0.2.2:3000'; 

// For Physical Device (Replace with your PC's Local IP)
export const API_URL = 'http://192.168.x.x:3000';
```
> **Note**: Ensure your phone is on the same Wi-Fi network as your PC if using a physical device.

### Firebase Setup
Ensure `src/config/firebase.ts` (or equivalent config file) is populated with your Firebase Public Config (API Key, Auth Domain, etc.) for OTP to work.

##  Running the App

Start the Expo development server:

```bash
npx expo start
```

-   **Scan the QR Code** with the *Expo Go* app on your phone.
-   Press `a` to open in Android Emulator.
-   Press `w` to open in Web (limited functionality).

##  Features & Screens

### 1. Citizen Flow
-   **Login**: Phone number OTP verification.
-   **Signup**: Select Name and Residence (Corporation -> Ward).
-   **Home**: View recent complaints and a "+ New" button.
-   **New Complaint**:
    -   Take/Select Photo.
    -   Select "Residence" (default) or "Custom Location".
    -   Submit.

### 2. Admin Flow
-   **Dashboard**: Overview of stats (Total, Pending, Resolved).
-   **Manage Admins** (`Master Admin` & `Super Admin`):
    -   Hierarchical Tree View: Corp -> Zone -> Super Admins -> Wards -> Ward Admins.
    -   Collapsible sections for cleaner UI.
    -   Super Admins only see their assigned Zones.
-   **Detailed View**: Click any admin to see details.
-   **Create Admin**: Master Admin can assign roles and jurisdictions seamlessly.

##  Troubleshooting

-   **Network Error**: Check if `API_URL` is correct and your firewall allows connections on port 3000.
-   **Expo Error**: Clear cache with `npx expo start -c`.
