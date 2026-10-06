# Phoenix Hotel & Suites — Room Booking & Management System (OOPS + RDBMS)

A full-stack 5-star luxury hotel room booking and management platform built with **React**, **TypeScript**, **Express**, and a normalized **Relational SQL Database** (`sql.js` / MySQL 3NF schema).

---

## 1. Setup & Run Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Full-Stack Development Server (Port 3000)**
   ```bash
   npm run dev
   ```
   The SQL database (`server/services/databaseService.ts`) automatically initializes all tables (`roles`, `users`, `guests`, `customers`, `admins`, `room_types`, `rooms`, `bookings`, `booking_rooms`, `services`, `payments`, `reviews`) and seeds initial data with bcrypt-hashed passwords.

3. **Build for Production**
   ```bash
   npm run build
   ```

---

## 2. Role-Based Portals & Seeded Database Accounts

All passwords are hashed using `bcrypt` in the database; no credentials are hardcoded in frontend JavaScript.

| Portal | Route | Role in DB | Seeded Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Guest Portal Login** | `/login` | `GUEST` (`customer`) | `guest@phoenixhotel.com` | `Customer@123` |
| **Guest Registration** | `/register` | `GUEST` (`customer`) | *(Create any new guest account)* | *(Min 6 chars)* |
| **Admin Portal Login** | `/admin/login` | `ADMIN` (`admin`) | `admin@phoenixhotel.com` | `Admin@123` |
| **Admin Dashboard** | `/admin/dashboard` | `ADMIN` (`admin`) | *(Protected by backend RBAC)* | — |

---

## 3. OOP Architecture & Encapsulation Demonstration

### Four Core OOP Pillars Implemented in `/server`

1. **Encapsulation**
   - **`User` (`server/models/User.ts`)**: `_passwordHash` and `_role` are `private`. Password verification is performed via `user.verifyPassword(plainText)`, and `toJSON()` excludes `_passwordHash`. No setter exists for `_role`, making privilege escalation after instantiation impossible.
   - **`AuthenticationService` (`server/services/authenticationService.ts`)**: Encapsulates `_jwtSecret`, `_saltRounds`, `_revokedTokens`, password hashing, JWT issuance, and role-isolated login methods (`loginGuest`, `loginAdmin`, `registerGuest`).
   - **`AuthorizationService` (`server/services/authorizationService.ts`)**: Encapsulates Role-Based Access Control (`assertAdminRole`, `getUserFromDatabase`, `assertPermission`), always querying the relational database (`users` joined with `roles`) as the single source of truth.
   - **`Booking`, `Room`, `Hotel` (`server/models/*.ts`)**: Use private fields and controlled getters/setters (`recalculateTotals()`, `cancel()`, `confirm()`, `markOccupied()`).

2. **Abstraction**
   - **`User` (`server/models/User.ts`)**: Abstract base class defining abstract methods `getDashboardUrl()`, `getPermissions()`, and `canAccessAdminPortal()`.
   - **`Payment` (`server/models/Payment.ts`)**: Abstract base class defining `processPayment()` and `getReceiptSummary()`.

3. **Inheritance**
   - **`Guest` (`Customer`) & `Admin` (`server/models/User.ts`)**: Inherit common identity state and verification logic from `User` while adding role-specific private attributes (`_address`, `_city` for `Guest`; `_department`, `_accessLevel` for `Admin`).
   - **`CashPayment` & `DemoCardPayment` (`server/models/Payment.ts`)**: Extend `Payment`.

4. **Polymorphism**
   - `canAccessAdminPortal()` returns `false` on `Guest` instances and `true` on `Admin` instances.
   - `getPermissions()` and `getDashboardUrl()` behave polymorphically depending on the runtime `User` subclass hydrated by `AuthorizationService`.

---

## 4. Security Verification & Why Guests Cannot Access Admin Functionality

1. **Guest Portal Login (`/login`)**: Authenticates `GUEST` users via `POST /api/auth/login`.
2. **Admin Portal Login (`/admin/login`)**: Calls `POST /api/auth/admin/login` (`AuthenticationService.loginAdmin`). If a guest attempts to log in at `/admin/login` using valid guest credentials, `userModel.canAccessAdminPortal()` returns `false` and the backend responds with **`403 Forbidden`**.
3. **Manual URL Navigation (`/admin/dashboard`)**: `AdminDashboard.tsx` calls `GET /api/auth/admin/verify` on mount. Unauthenticated users are redirected to `/admin/login`, and `GUEST` users receive a **`403 Forbidden`** screen.
4. **Direct Admin API Requests**: Every admin endpoint (`POST/PUT/DELETE /api/rooms`, `/api/room-types`, `PUT /api/bookings/:id/status`, `GET /api/customers`, `GET /api/reports/*`) is protected by `authenticateToken` and `requireAdmin`, which invoke `AuthorizationService.assertAdminRole()` to verify the `ADMIN` role directly against the database on every request.
