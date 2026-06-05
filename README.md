# Cinema E-Ticket Booking System

A modern, decoupled movie ticket booking application developed with a Laravel REST API backend and a React frontend.

## Features

- Interactive seat mapping and validation.
- Screenshot upload for manual payment checks.
- Comprehensive Admin control panel for approvals and scheduling.

## Local Installation Guide

### Backend Setup:

1. Clone the project and navigate to `cinema-api`.
2. Run `composer install`.
3. Configure your `.env` file with your Laragon MySQL credentials.
4. Run migrations: `php artisan migrate`.
5. Start the server: `php artisan serve`.

### Frontend Setup:

1. Navigate to `cinema-web`.
2. Run `npm install`.
3. Start the Vite development server: `npm run dev`.
