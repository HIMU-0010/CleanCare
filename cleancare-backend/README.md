# CleanCare Backend

The robust and scalable backend system for the **CleanCare** platform, designed to streamline waste management and civic issue resolution. This API serves as the central hub for the CleanCare mobile application, managing citizens, administrators, complaints, and location hierarchies.

##  Key Features

*   **Role-Based Access Control (RBAC)**: Secure access for Citizens, Ward Admins, Master Admins, and Super Admins.
*   **Authentication**: Hybrid authentication using **Firebase Phone Auth** (for OTP verification) and **JWT** (for session management).
*   **Complaint Management**: Full lifecycle tracking of complaints from creation to resolution, including media uploads (images/video) via **Cloudinary**.
*   **Location Hierarchy**: Structured management of Corporations, Zones, and Wards to ensure complaints are routed to the correct authorities.
*   **Real-time Notifications**: Integrated push notifications using **Firebase Cloud Messaging (FCM)** to keep users updated on complaint status.
*   **Content Management**: Dynamic management of emergency contacts, government calendars, and public gallery posts.
*   **Admin Dashboard**: comprehensive endpoints for analytics and workforce management.

##  Tech Stack

*   **Framework**: [NestJS](https://nestjs.com/) (Node.js) - For modular and scalable architecture.
*   **Language**: TypeScript - For type safety and maintainability.
*   **Database**: PostgreSQL - Relational database for structured data.
*   **ORM**: TypeORM - For efficient database interaction.
*   **File Storage**: Cloudinary - For optimized media storage and delivery.
*   **Notifications**: Firebase Cloud Messaging (FCM).
*   **Containerization**: Docker & Docker Compose.

---

##  Prerequisites

Before running the project, ensure you have the following installed:

*   **Node.js** (v18 or higher)
*   **npm** or **yarn**
*   **PostgreSQL** (running locally or via Docker)
*   **Firebase Project** (for Auth & Notifications)
*   **Cloudinary Account** (for media storage)

##  Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cleancare-backend.git
    cd cleancare-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

##  Environment Configuration

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

**Required Variables:**

```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=cleancare_db
# Or use complete URL:
DATABASE_URL=postgresql://user:pass@localhost:5432/cleancare_db

# Security
JWT_SECRET=your_super_complex_jwt_secret_key

# Firebase (Get these from Project Settings -> Service Accounts in Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Cloudinary (Get these from Cloudinary Dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

##  Running the Server

**Development Mode:**
```bash
npm run start:dev
```
The server will start at `http://localhost:3000`.

**Production Build:**
```bash
npm run build
npm run start:prod
```

**Using Docker:**
```bash
docker-compose up --build
```

---

##  Connecting the Frontend

To connect the CleanCare mobile app to this backend:

1.  Ensure your mobile device/emulator is on the same network as your backend computer (if running locally).
2.  Update the **API Base URL** in your frontend configuration files (e.g., `src/constants.ts` or `.env` in the mobile repo).
3.  **Local Development**: Use your computer's local IP address (e.g., `http://192.168.1.5:3000`), NOT `localhost` (which refers to the phone itself).

---

##  API Documentation

### **Authentication (`/auth`)**

*   `POST /auth/login`: Authenticate using a Firebase token (obtained via phone OTP) to receive a backend JWT.
*   `POST /auth/register`: Register a new citizen account.
*   `GET /auth/profile`: Retrieve the currently logged-in user's profile.
*   `PATCH /auth/profile`: Update user profile details.

### **Complaints (`/complaints`)**

*   `POST /complaints`: Submit a new complaint (supports `multipart/form-data` for media).
*   `GET /complaints`: List all complaints for the logged-in user.
*   `GET /complaints/:id`: Get detailed view of a specific complaint.
*   `PATCH /complaints/:id/status`: **(Admin)** Update complaint status (e.g., `IN_PROGRESS`, `RESOLVED`) and add resolution proof.
*   `PATCH /complaints/:id/rate`: **(Citizen)** Rate and review a resolved complaint.
*   `GET /complaints/ward`: **(Admin)** Get all complaints within the assigned ward.
*   `GET /complaints/hierarchy`: **(Master Admin)** Filter complaints by Corporation, Zone, or Ward.

### **Admin Management (`/admins`)**

*   `POST /admins/create`: **(Master Admin)** Create a new admin account (Ward/Zone admin).
*   `GET /admins`: List all admins.
*   `PATCH /admins/:id/status`: specialized endpoint to activate/deactivate admin accounts.

### **Locations (`/locations`)**

*   `GET /locations/corporations`: Get list of all corporations.
*   `GET /locations/corporations/:id/zones`: Get zones under a corporation.
*   `GET /locations/zones/:id/wards`: Get wards under a zone.
*   `POST /locations/bulk`: **(Master Admin)** Bulk import hierarchy data.

### **Content (`/content`)**

*   `GET /content/contacts`: List emergency contacts.
*   `GET /content/gallery`: List public gallery posts.
*   `POST /content/gallery`: **(Master Admin)** Create a new gallery post.
*   `GET /content/calendar`: Get the current government calendar.

### **Notifications (`/notifications`)**

*   `POST /notifications/register-token`: Register an FCM push token for the device.
*   `GET /notifications/history`: Get notification history for the user.

---

##  Deployment

The project includes a `Dockerfile` and `docker-compose.yml` for easy deployment.

**Steps:**
1.  Configure environment variables on your VPS/Cloud Server.
2.  Run `docker-compose up -d --build`.
3.  (Optional) Configure Nginx as a reverse proxy for SSL termination (configuration template provided in `/nginx`).

##  Contribution

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
