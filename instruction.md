# Step-by-Step Implementation Instructions

Follow these chronological steps to build the Cinema E-Ticket Booking System.

---

## Phase 1: Backend Setup (Laravel API)

### Step 1.1: Project Initialization

1. Inside your development directory, scaffold a clean Laravel API project:
   ```bash
   composer create-project laravel/laravel cinema-api
   ```
   Open the project in your code editor and adjust the environment configuration (.env):

Code snippet
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cinema_eticketdb
DB_USERNAME=root
DB_PASSWORD=

APP_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173
Open Laragon/MySQL and create an empty database named cinema_eticketdb.

Step 1.2: Generate Scaffolding (Models, Migrations, Controllers)
Execute the batch commands sequentially to ensure files are generated without conflict:

Bash
php artisan make:model Cinema -mcr
php artisan make:model Room -mcr
php artisan make:model Movie -mcr
php artisan make:model Showtime -mcr
php artisan make:model Seat -mcr
php artisan make:model Booking -mcr
php artisan make:model Payment -mcr
php artisan make:model Invoice -mcr

# Create extra pivot migration for Many-to-Many relationship

php artisan make:migration create_booking_seat_table
Step 1.3: Migration Dependency Reordering
To prevent Foreign Key constraint errors (SQLSTATE[HY000] [2002]), modify the timestamps in your migration filenames inside database/migrations/ so they run in this precise logical order:

\_create_users_table.php

\_create_cinemas_table.php

\_create_rooms_table.php (Depends on Cinemas)

\_create_movies_table.php

\_create_showtimes_table.php (Depends on Rooms & Movies)

\_create_seats_table.php (Depends on Rooms)

\_create_bookings_table.php (Depends on Users & Showtimes)

\_create_booking_seat_table.php (Pivot table)

\_create_payments_table.php (Depends on Bookings)

\_create_invoices_table.php (Depends on Payments)

Copy definitions from requirement.md sections into their corresponding Schema::create blocks.
Execute the setup via:

Bash
php artisan migrate:fresh
Step 1.4: Establish Eloquent Relationships
Define model properties to enable structural querying (with()):

User: hasMany(Booking)

Cinema: hasMany(Room)

Room: belongsTo(Cinema), hasMany(Seat), hasMany(Showtime)

Movie: hasMany(Showtime)

Showtime: belongsTo(Movie), belongsTo(Room), hasMany(Booking)

Seat: belongsTo(Room), belongsToMany(Booking)

Booking: belongsTo(User), belongsTo(Showtime), belongsToMany(Seat), hasOne(Payment)

Payment: belongsTo(Booking), hasOne(Invoice)

Invoice: belongsTo(Payment)

Step 1.5: Build Essential API Controllers & API Routes
Expose business resources inside routes/api.php:

Auth Routes: /api/register, /api/login, /api/logout using Laravel Sanctum middleware protection.

Customer View Routes: GET requests for /api/movies, /api/movies/{id}, /api/showtimes, and /api/rooms/{id}/seats.

Transaction Route: POST request to /api/bookings handling ticket reservations, seat allocation state changes, and screenshot multi-part file uploads (payment_slip).

Admin Management Panel Routes: Protected resource pathways targeting admin CRUD controls for movies, scheduling, and billing verifications.

Phase 2: Frontend Setup (React Application)
Step 2.1: Project Scaffolding
In a separate root folder directory, generate your React build wrapper via Vite:

Bash
npm create vite@latest cinema-web -- --template react
cd cinema-web
npm install
Install Axios and any other required route navigation components:

Bash
npm install axios react-router-dom
Step 2.2: Configure Centralized Axios Base URL
Create an isolated API infrastructure configuration component (src/api/axios.js):

JavaScript
import axios from 'axios';

const api = axios.create({
baseURL: '[http://127.0.0.1:8000](http://127.0.0.1:8000)',
withCredentials: true // Essential for Sanctum cookie state compliance
});

export default api;
Step 2.3: Build Views & UI Layout components
Design key UI pages mapping directly to the Use Case flow:

Auth View: Forms capturing login credentials, saving Sanctum bearer tokens inside LocalStorage or Context states.

Movie Showcase: Dashboard hitting the /api/movies route to populate listing grids.

Showtime & Seat Selection Screen: A visual responsive component grouping row cells. Changes seat choices and totals dynamically.

Checkout Portal: Displays banking instructions for fake payment transfers and provides a dynamic <input type="file" /> wrapper to map uploaded proof slips into an outgoing HTML FormData object.

Customer Dashboard: Tabular presentation listing booking states along with receipts.

Phase 3: Integration & Local Deployment Testing
Execution Instructions
To test the interconnected ecosystem locally across your environment, run these processes concurrently inside individual terminals:

Database Service: Keep Laragon or MySQL running.

Backend Engine Server Instance:

Bash
cd cinema-api
php artisan config:clear
php artisan serve
(Running locally on http://127.0.0.1:8000)

Frontend Development Node:

Bash
cd cinema-web
npm run dev
