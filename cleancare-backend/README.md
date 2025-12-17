# CleanCare Backend

The backend service for the CleanCare platform, providing a secure API for the mobile application to interact with the database and external services.

##  Tech Stack

-   **Framework**: [NestJS](https://nestjs.com/) (Node.js)
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: TypeORM
-   **Authentication**: Firebase Admin SDK (Phone OTP verify) + JWT (Session)
-   **File Storage**: Cloudinary

##  Prerequisites

Ensure you have the following installed/configured:
-   **Node.js** (v18+)
-   **PostgreSQL** (Running locally or hosted)
-   **Firebase Project** (For Authentication)
-   **Cloudinary Account** (For image hosting)

##  Installation

1.  Navigate to the backend directory:
    ```bash
    cd cleancare-backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

##  Environment Configuration

Create a `.env` file in the root of `cleancare-backend` with the following variables:

```env
# Database Coonection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=cleancare_db

# JWT Security
JWT_SECRET=your_super_secret_jwt_key

# Firebase (Generate from Firebase Console -> Project Settings -> Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Cloudinary (Dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

##  Running the App

```bash
# development
$ npm run start

# watch mode (recommended for dev)
$ npm run start:dev

# production mode
$ npm run start:prod
```
The API will be available at `http://localhost:3000`.

##  Project Structure

-   `src/auth`: Login logic, JWT strategy, Firebase integration.
-   `src/users`: User entity (Citizens, Admins), Profile management.
-   `src/locations`: Core logic for Corporations, Zones, and Wards.
-   `src/complaints`: Complaint creation, listing, and status updates.
-   `src/admins`: Specific administrative actions (Hierarchy management).
-   `src/config`: Configuration service setup (TypeORM, Cloudinary).

##  Seeding Data
To populate the database with initial hierarchy (Corporations, Zones) and a Master Admin account, run the seeder endpoint (if configured) or check `src/admins/admins.service.ts` -> `seedFullHierarchy()`.

##  API Overview

-   **POST** `/auth/login`: Exchange Firebase token for backend JWT.
-   **GET** `/auth/profile`: Get logged-in user details.
-   **GET** `/locations/corporations`: Get full location tree.
-   **POST** `/complaints`: Create a new complaint.
-   **GET** `/complaints/my`: Get citizen's complaints.
-   **GET** `/admins`: List all admins (Master Admin view).
