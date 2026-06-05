# Product Requirement Document (PRD) - Cinema E-Ticket Booking System

## 1. Project Overview

This project is a decoupled Cinema E-Ticket Booking System designed for educational/portfolio purposes. It separates business logic and persistence into a Headless Laravel REST API, while providing a dynamic, reactive user experience via a React frontend.

---

## 2. System Architecture & Tech Stack

- **Architecture:** Decoupled (Separated Backend API & Frontend SPA)
- **Backend Framework:** Laravel 11 (API Mode)
- **Authentication:** Laravel Sanctum (Token-Based Stateless Auth)
- **Frontend Framework:** React 18+ (Vite Template)
- **HTTP Client:** Axios (for API communication)
- **Database:** MySQL 8.0+ (Local Environment managed via Laragon)

---

## 3. Functional Requirements (Based on Use Case Diagram)

### 3.1 Customer (User) Features

- **Register / Login:** Secure authentication using email and password.
- **View Movies & Movie Details:** Browse ongoing ("Now Showing") and upcoming movies along with metadata (genre, duration, rating).
- **Book Ticket:** Select preferred options sequentially:
  - `include` **Select Cinema & Room:** Filter where the movie is screened.
  - `include` **Select Seat:** Interactive seat selection grid matching the room layout.
  - `include` **Make Payment:** Manual bank/wallet transfer with a required file upload option (Screenshot/Payment Slip).
- **Generate / View Invoice:** (`extend` from Payment) Users can view or print a generated receipt post-payment.
- **View Booking History:** Access records of all current and historical bookings with their confirmation status.
- **Logout:** Invalidate current Sanctum auth tokens.

### 3.2 Admin Features

- **Manage Cinemas & Rooms:** CRUD operations for theater locations and distinct screening rooms.
- **Manage Movies:** CRUD operations for updating movie archives.
- **Manage Showtimes:** Schedule dates, times, prices, and room assignments for specific movies.
- **Manage Bookings & Payments:** Overview panel to inspect incoming screenshot slips, approve/reject transactions, and update ticket statuses.
- **View Users:** Monitor customer profiles and registered users.

---

## 4. Database Schema (Relational Representation of Class Diagram)

### 4.1 `users`

- `userId` (PK, BigInt, AutoIncrement)
- `name` (String)
- `email` (String, Unique)
- `password` (String)
- `userType` (Integer: 1 = Customer, 2 = Admin)

### 4.2 `cinemas`

- `cinemaId` (PK, BigInt, AutoIncrement)
- `name` (String)
- `location` (String)

### 4.3 `rooms`

- `roomId` (PK, BigInt, AutoIncrement)
- `name` (String)
- `cinemaId` (FK linked to `cinemas.cinemaId`, Cascade Delete)

### 4.4 `movies`

- `movieId` (PK, BigInt, AutoIncrement)
- `title` (String)
- `genre` (String)
- `duration` (Integer)
- `rating` (Float)

### 4.5 `showtimes`

- `showtimeId` (PK, BigInt, AutoIncrement)
- `date` (Date)
- `time` (Time)
- `roomId` (FK linked to `rooms.roomId`, Cascade Delete)
- `movieId` (FK linked to `movies.movieId`, Cascade Delete)

### 4.6 `seats`

- `seatId` (PK, BigInt, AutoIncrement)
- `seatNumber` (String)
- `isBooked` (Boolean, Default: false)
- `seatType` (String)
- `seatPrice` (Integer)
- `roomId` (FK linked to `rooms.roomId`, Cascade Delete)

### 4.7 `bookings`

- `bookingId` (PK, BigInt, AutoIncrement)
- `bookingDate` (Date)
- `status` (String: pending, confirmed, cancelled)
- `userId` (FK linked to `users.userId`, Cascade Delete)
- `showtimeId` (FK linked to `showtimes.showtimeId`, Cascade Delete)

### 4.8 `booking_seat` (Pivot Table)

- `id` (PK, BigInt, AutoIncrement)
- `bookingId` (FK linked to `bookings.bookingId`, Cascade Delete)
- `seatId` (FK linked to `seats.seatId`, Cascade Delete)

### 4.9 `payments`

- `paymentId` (PK, BigInt, AutoIncrement)
- `amount` (Double)
- `paymentMethod` (String)
- `paymentStatus` (String: pending, approved, rejected)
- `paymentSlipUrl` (String, Nullable)
- `bookingId` (FK, Unique, linked to `bookings.bookingId`, Cascade Delete)

### 4.10 `invoices`

- `invoiceId` (PK, BigInt, AutoIncrement)
- `totalAmount` (Double)
- `generatedDate` (Date)
- `paymentId` (FK, Unique, linked to `payments.paymentId`, Cascade Delete)
