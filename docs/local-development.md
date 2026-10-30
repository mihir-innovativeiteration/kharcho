# Kharcho Local Development & Setup Guide

This guide covers setting up and running the Kharcho mobile application and the backend API server.

---

## 1. Prerequisites

- **Node.js**: v18 or later (v20+ recommended)
- **npm** or **bun**
- **MySQL**: 8.0+ (Local service, Docker container, or cloud instance e.g. PlanetScale, AWS RDS)
- **Expo Go** or an Android/iOS emulator / physical device.

---

## 2. Backend Setup (`d:\kharcho\api`)

### Step 1: Install Dependencies
```bash
cd d:\kharcho\api
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `api/.env`:
```ini
NODE_ENV=development
PORT=5000
DATABASE_URL="mysql://kharcho_user:password@localhost:3306/kharcho"
JWT_ACCESS_SECRET="your-at-least-32-chars-development-secret-key-12345"
JWT_ACCESS_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_DAYS=30
RESET_TOKEN_EXPIRES_HOURS=1
VERIFY_TOKEN_EXPIRES_HOURS=24
CORS_ORIGIN="*"
GOOGLE_CLIENT_ID=""
APP_BASE_URL="http://localhost:5000"
```

### Step 3: Run Database Migrations
Ensure MySQL is running with the specified database created:
```sql
CREATE DATABASE IF NOT EXISTS kharcho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Apply Prisma migrations:
```bash
npx prisma migrate dev --name init
```
Or execute the pre-generated migration SQL:
```bash
mysql -u kharcho_user -p kharcho < prisma/migrations/20261027000000_init/migration.sql
```

### Step 4: Run Tests
```bash
npm test
```
Runs 26 automated unit and integration tests across crypto, JWT, Google token verification, and full auth endpoints.

### Step 5: Start the Backend Server
```bash
npm run dev
```
The server will start at `http://localhost:5000` (Health check at `http://localhost:5000/api/v1/health`).

---

## 3. Mobile Setup (`d:\kharcho`)

### Step 1: Install Dependencies
```bash
cd d:\kharcho
npm install
```

### Step 2: Configure API URL for Your Device
The mobile app defaults to `http://localhost:5000/api/v1` for web and iOS simulators.

When testing on **Android Emulator** or a **Physical Device**:
- **Android Emulator**: Uses `http://10.0.2.2:5000/api/v1` (the host machine's loopback address inside the Android emulator network).
- **Physical Device**: Use your local Wi-Fi IP address (e.g., `http://192.168.1.100:5000/api/v1`).
- You can specify this by adding `EXPO_PUBLIC_API_URL` to a root `.env`:
  ```ini
  EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api/v1
  ```

### Step 3: Run Diagnostics & Linting
```bash
npx eslint .          # 0 errors, 0 warnings
npx tsc --noEmit      # Strict TypeScript check
npx expo-doctor       # Expo SDK compatibility diagnostics (20/20 checks)
```

### Step 4: Start the Mobile App
```bash
npx expo start
```
- Press `a` to open in Android Emulator.
- Press `i` to open in iOS Simulator.
- Press `w` to open in Web browser.
- Scan the QR code using Expo Go on your physical Android/iOS phone.
