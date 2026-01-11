# CleanCare - Smart Waste Management Platform

![License](https://img.shields.io/badge/license-UNLICENSED-blue)
![Status](https://img.shields.io/badge/status-active-success)

**CleanCare** is a comprehensive, production-ready civic technology platform designed to modernize waste management. It bridges the gap between citizens reporting local issues and the administrative authorities responsible for resolving them, creating a transparent, hierarchical, and efficient workflow.

---

##  Table of Contents

- [Project Overview](#-project-overview)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [How It Works](#-how-it-works)
- [Deployment](#-deployment)
- [Future Roadmap](#-future-roadmap)

---

##  Project Overview

### The Problem
Traditional waste management systems suffer from lack of transparency, difficulty in tracking complaints, and inefficient communication between ground-level workers and high-level administrators.

### The Solution: CleanCare
A full-stack ecosystem consisting of a **Mobile App** (for Citizens and Admins) and a **Robust Backend API** that provides:
-   **Real-time reporting** with geolocation and visual evidence.
-   **Hierarchical Management** (Ward -> Zone -> Corporation) ensuring accountability.
-   **Live Tracking** of complaint resolution status.
-   **Workforce Management** for administrators.

---

##  System Architecture

The CleanCare system is built on a modern, scalable architecture:

1.  **Mobile Client (Frontend)**: A React Native app that serves two distinct personas:
    *   **Citizen**: Reports issues, tracks status, receives notifications.
    *   **Admin**: Views dashboard, updates status, manages sub-admins.
2.  **API Gateway (Backend)**: A NestJS server acting as the central brain, handling:
    *   Authentication & Authorization (RBAC).
    *   Business Logic (Complaint routing, Hierarchy validation).
    *   Data Persistence.
3.  **Database**: PostgreSQL for structured, relational data (Users, Complaints, Locations).
4.  **External Services**:
    *   **Firebase**: Handles Phone Authentication (OTP) and Push Notifications (FCM).
    *   **Cloudinary**: Optimizes and stores uploaded media (images/videos).

---

##  Tech Stack

### Backend
*   **Framework**: [NestJS](https://nestjs.com/) (Node.js) - Modular, testable, and scalable.
*   **Language**: TypeScript
*   **Database**: PostgreSQL
*   **ORM**: TypeORM
*   **Auth**: Firebase Admin SDK + Passport (JWT)
*   **Storage**: Cloudinary
*   **Container**: Docker & Docker Compose

### Frontend
*   **Framework**: [React Native](https://reactnative.dev/)
*   **Platform**: [Expo](https://expo.dev/) (Managed Workflow)
*   **Navigation**: React Navigation v6
*   **Maps**: `react-native-maps` (Google Maps API)
*   **State/API**: Axios, React Hooks
*   **Styling**: Custom StyleSheet (Performance optimized)

---

##  Project Structure

This repository is set up as a multi-root workspace containing both the backend and mobile codebases.

```text
CleanCare/
├── cleancare-backend/     # The NestJS API Server
│   ├── src/
│   ├── docker-compose.yml
│   └── ...
│
├── cleancare-mobile/      # The React Native Expo App
│   ├── src/
│   ├── app.json
│   └── ...
│
└── README.md              # You are here
```

---

##  Getting Started

To run the full system locally, you need to set up both the backend and frontend.

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL (Local or Docker)
*   Expo Go App (on mobile device)
*   Git

### Step 1: Start the Backend

1.  Navigate to the backend folder:
    ```bash
    cd cleancare-backend
    ```
2.  Install dependencies and start the server:
    ```bash
    npm install
    npm run start:dev
    ```
3.  *Ensure your `.env` is configured (Database, Firebase, Cloudinary).*
    *   [View Backend Setup Guide](./cleancare-backend/README.md)

### Step 2: Start the Mobile App

1.  Open a new terminal and navigate to the mobile folder:
    ```bash
    cd cleancare-mobile
    ```
2.  Install dependencies and start Expo:
    ```bash
    npm install
    npx expo start
    ```
3.  *Scan the QR code with your phone.*
    *   [View Frontend Setup Guide](./cleancare-mobile/README.md)

---

##  How It Works (Example Flow)

1.  **Citizen Reports**: A user logs in via OTP, snaps a photo of uncollected garbage, pins the location on the map, and submits.
2.  **Backend Processing**: The API receives the data, uploads the image to Cloudinary, determines the correct **Ward** based on location, and saves the complaint to PostgreSQL.
3.  **Notification**: The system identifies the **Ward Admin** responsible for that area and sends a push notification via Firebase.
4.  **Admin Action**: The Ward Admin taps the notification, views the complaint on their dashboard, assigns a cleanup crew, and marks it as "In Progress".
5.  **Resolution**: Once cleaned, the Admin uploads a "After" photo and marks it "Resolved". The Citizen gets a final notification and can rate the service.

---

##  Deployment

*   **Backend**: Included `Dockerfile` allows instant deployment to any container orchestration platform (DigitalOcean, AWS ECS, Google Cloud Run). Use `docker-compose up -d` for a production-ready stack with Nginx.
*   **Frontend**: Can be built into `.apk` (Android) and `.ipa` (iOS) using **EAS Build** provided by Expo.

---

##  Future Roadmap

*   [ ] **Analytics Dashboard**: Web-based view for high-level officials to see city-wide cleanliness metrics.
*   [ ] **Offline Mode**: Enhanced offline queuing for citizens in low-connectivity areas.
*   [ ] **Chat Support**: Direct communication channel between citizens and assigned admins.
*   [ ] **Machine Learning**: Auto-categorization of waste based on image analysis.

---

Made with ❤️ for a Cleaner City.
