<?php

namespace Database\Seeders;

use App\Models\Cinema;
use App\Models\Movie;
use App\Models\Room;
use App\Models\Seat;
use App\Models\Showtime;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@cinema.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('Cinem@super2026'),
                'userType' => 3,
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@cinema.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'userType' => 2,
            ]
        );

        $cinema1 = Cinema::create(['name' => 'Mega Cineplex', 'location' => 'Yangon']);
        $cinema2 = Cinema::create(['name' => 'Starlight Cinema', 'location' => 'Mandalay']);

        $room1 = Room::create(['name' => 'Hall A', 'cinemaId' => $cinema1->cinemaId]);
        $room2 = Room::create(['name' => 'Hall B', 'cinemaId' => $cinema1->cinemaId]);
        $room3 = Room::create(['name' => 'Hall A', 'cinemaId' => $cinema2->cinemaId]);

        $seatLetters = ['A', 'B', 'C', 'D', 'E'];
        foreach ([$room1, $room2, $room3] as $room) {
            foreach ($seatLetters as $row) {
                for ($col = 1; $col <= 8; $col++) {
                    Seat::create([
                        'seatNumber' => $row . $col,
                        'isBooked' => false,
                        'seatType' => in_array($row, ['A', 'B']) ? 'Premium' : 'Standard',
                        'seatPrice' => in_array($row, ['A', 'B']) ? 15000 : 8000,
                        'roomId' => $room->roomId,
                    ]);
                }
            }
        }

        $movie1 = Movie::create(['title' => 'The Dark Knight', 'genre' => 'Action', 'description' => 'A masked vigilante protects Gotham from a dangerous criminal mastermind.', 'duration' => 152, 'rating' => 9.0]);
        $movie2 = Movie::create(['title' => 'Inception', 'genre' => 'Sci-Fi', 'description' => 'A skilled team enters dreams to plant an idea in a target’s mind.', 'duration' => 148, 'rating' => 8.8]);
        $movie3 = Movie::create(['title' => 'Your Name', 'genre' => 'Animation', 'description' => 'Two teenagers discover an extraordinary connection across time and place.', 'duration' => 106, 'rating' => 8.4]);
        $movie4 = Movie::create(['title' => 'Parasite', 'genre' => 'Thriller', 'description' => 'Two families become entangled through an unexpected and unsettling relationship.', 'duration' => 132, 'rating' => 8.5]);
        $movie5 = Movie::create(['title' => 'Interstellar', 'genre' => 'Sci-Fi', 'description' => 'Explorers travel beyond Earth in search of a future for humanity.', 'duration' => 169, 'rating' => 8.7]);

        Showtime::create(['date' => '2026-08-08', 'time' => '10:00:00', 'roomId' => $room1->roomId, 'movieId' => $movie1->movieId]);
        Showtime::create(['date' => '2026-08-08', 'time' => '14:00:00', 'roomId' => $room1->roomId, 'movieId' => $movie2->movieId]);
        Showtime::create(['date' => '2026-08-08', 'time' => '18:00:00', 'roomId' => $room1->roomId, 'movieId' => $movie3->movieId]);
        Showtime::create(['date' => '2026-08-09', 'time' => '11:00:00', 'roomId' => $room2->roomId, 'movieId' => $movie4->movieId]);
        Showtime::create(['date' => '2026-08-09', 'time' => '15:00:00', 'roomId' => $room2->roomId, 'movieId' => $movie5->movieId]);
        Showtime::create(['date' => '2026-08-09', 'time' => '20:00:00', 'roomId' => $room3->roomId, 'movieId' => $movie1->movieId]);
        Showtime::create(['date' => '2026-08-10', 'time' => '13:00:00', 'roomId' => $room3->roomId, 'movieId' => $movie2->movieId]);
    }
}
