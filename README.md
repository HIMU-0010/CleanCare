# CleanCare - Smart Waste Management System

CleanCare is a comprehensive digital platform designed to bridge the gap between citizens and city waste management authorities. It enables efficient complaint reporting, real-time tracking, and administrative oversight through a hierarchical management system.

##  Repository Structure

The project is divided into two main components:

- **`cleancare-backend/`**  
  A robust RESTful API built with **NestJS**, handling authentication, data persistence, and business logic.
- **`cleancare-mobile/`**  
  A cross-platform mobile application built with **React Native (Expo)**, serving both Citizens (reporting) and Admins (management).

## 🚀 Key Features

###  Authentication & Security
- **Phone-based Login**: Secure authentication using Firebase OTP.
- **Role-Based Access Control (RBAC)**:
  - **Citizen (`USER`)**: Report issues, track status.
  - **Ward Admin (`WARD_ADMIN`)**: Manage waste issues within a specific ward.
  - **Super Admin (`SUPER_ADMIN`)**: Oversee multiple zones within a corporation.
  - **Master Admin (`MASTER_ADMIN`)**: Full system control, including creating corporations and assigning admins.

###  Location Hierarchy
The system maps the city structure dynamically:
`Corporation` -> `Zone` -> `Ward`

###  Applications
1.  **Citizen App**:
    -   Sign up with accurate location (Corporation/Ward).
    -   Report waste issues with photos and GPS location.
    -   Track complaint status (Pending, In Progress, Resolved).
2.  **Admin Dashboard**:
    -   **Hierarchical View**: Visualize the entire city admin structure.
    -   **Management**: Create and assign admins to specific jurisdictions.
    -   **Status Updates**: Update the status of reported complaints.

##  Technology Stack

### Backend
-   **Framework**: [NestJS](https://nestjs.com/)
-   **Database**: PostgreSQL (via TypeORM)
-   **Auth**: Firebase Admin SDK & Passport-JWT
-   **Storage**: Cloudinary (Image uploads)

### Frontend (Mobile)
-   **Framework**: [React Native](https://reactnative.dev/)
-   **Tooling**: [Expo](https://expo.dev/)
-   **Navigation**: React Navigation
-   **Styling**: StyleSheet

##  Getting Started

To get the system running locally, you need to set up both the backend and the frontend.

1.  **Backend Setup**: Go to [`cleancare-backend/README.md`](./cleancare-backend/README.md) for database connection and API startup instructions.
2.  **frontend Setup**: Go to [`cleancare-mobile/README.md`](./cleancare-mobile/README.md) for app configuration and simulation.

## 🚀 Happy Coding!!
