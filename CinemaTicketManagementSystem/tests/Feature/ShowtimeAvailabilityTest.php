<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ShowtimeAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    private int $roomId;

    private int $futureShowtimeId;

    private int $mixedFutureShowtimeId;

    private int $startedShowtimeId;

    private int $oldMovieId;

    private int $futureMovieId;

    private int $mixedMovieId;

    private int $unscheduledMovieId;

    private int $archivedBookingId;

    private User $customer;

    private User $admin;

    private int $seatId;

    private int $paymentMethodId;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.timezone' => 'Asia/Yangon']);
        Carbon::setTestNow(Carbon::parse('2026-11-07 12:00:00', 'Asia/Yangon'));

        $now = now();
        $cinemaId = DB::table('cinemas')->insertGetId([
            'name' => 'Test Cinema',
            'location' => 'Yangon',
            'created_at' => $now,
            'updated_at' => $now,
        ], 'cinemaId');
        $this->roomId = DB::table('rooms')->insertGetId([
            'name' => 'Room 1',
            'cinemaId' => $cinemaId,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'roomId');
        $this->oldMovieId = $this->createMovie('Past-only movie');
        $this->futureMovieId = $this->createMovie('Upcoming movie');
        $this->mixedMovieId = $this->createMovie('Past and future movie');
        $this->unscheduledMovieId = $this->createMovie('Unscheduled movie');
        $this->startedShowtimeId = $this->createShowtime($this->oldMovieId, '11:59:00');
        $this->futureShowtimeId = $this->createShowtime($this->futureMovieId, '12:01:00');
        $this->createShowtime($this->mixedMovieId, '11:30:00');
        $this->mixedFutureShowtimeId = $this->createShowtime($this->mixedMovieId, '12:30:00');

        $this->customer = User::create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => 'password',
            'userType' => 1,
        ]);
        $this->admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
            'userType' => 2,
        ]);

        $this->archivedBookingId = DB::table('bookings')->insertGetId([
            'bookingDate' => '2026-11-06',
            'status' => 'confirmed',
            'userId' => $this->customer->userId,
            'showtimeId' => $this->startedShowtimeId,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'bookingId');
        $this->seatId = DB::table('seats')->insertGetId([
            'seatNumber' => 'A1',
            'isBooked' => false,
            'seatType' => 'Standard',
            'seatPrice' => 1000,
            'status' => 0,
            'roomId' => $this->roomId,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'seatId');
        $this->paymentMethodId = DB::table('payment_methods')->insertGetId([
            'code' => 'TEST',
            'name' => 'Test payment',
            'isActive' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'paymentMethodId');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_public_lists_hide_expired_movies_while_admin_and_history_remain(): void
    {
        $response = $this->getJson('/api/movies');

        $response->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['movieId' => $this->futureMovieId])
            ->assertJsonFragment(['movieId' => $this->mixedMovieId])
            ->assertJsonFragment(['showtimeId' => $this->futureShowtimeId])
            ->assertJsonFragment(['showtimeId' => $this->mixedFutureShowtimeId])
            ->assertJsonMissing(['movieId' => $this->oldMovieId])
            ->assertJsonMissing(['movieId' => $this->unscheduledMovieId]);

        $this->getJson('/api/showtimes')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['showtimeId' => $this->futureShowtimeId])
            ->assertJsonFragment(['showtimeId' => $this->mixedFutureShowtimeId]);

        $adminResponse = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/movies');
        $adminResponse->assertOk()->assertJsonCount(4);

        $this->assertDatabaseHas('movies', ['movieId' => $this->oldMovieId]);
        $this->assertDatabaseHas('movies', ['movieId' => $this->unscheduledMovieId]);
        $this->assertDatabaseHas('showtimes', ['showtimeId' => $this->startedShowtimeId]);
        $this->assertDatabaseHas('bookings', ['bookingId' => $this->archivedBookingId]);
    }

    public function test_started_showtimes_reject_customer_and_admin_bookings(): void
    {
        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/bookings/hold', [
                'showtimeId' => $this->startedShowtimeId,
                'seatIds' => [$this->seatId],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This showtime has already started.');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/bookings', [
                'bookingDate' => '2026-11-07',
                'status' => 'pending',
                'userId' => $this->customer->userId,
                'showtimeId' => $this->startedShowtimeId,
                'seatIds' => [$this->seatId],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This showtime has already started.');

        $this->assertDatabaseCount('bookings', 1);
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseHas('bookings', ['bookingId' => $this->archivedBookingId]);
    }

    public function test_showtime_at_exact_start_time_is_not_bookable_but_future_showtime_is(): void
    {
        $atStartShowtimeId = $this->createShowtime($this->futureMovieId, '12:00:00');
        Storage::fake('public');
        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/bookings/hold', [
                'showtimeId' => $atStartShowtimeId,
                'seatIds' => [$this->seatId],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This showtime has already started.');

        $hold = $this->postJson('/api/bookings/hold', [
            'showtimeId' => $this->futureShowtimeId,
            'seatIds' => [$this->seatId],
        ])->assertCreated();
        $this->postJson('/api/payments', [
            'bookingId' => $hold->json('bookingId'),
            'amount' => 1000,
            'paymentMethodId' => $this->paymentMethodId,
            'paymentSlip' => $this->fakePaymentSlip(),
        ])->assertCreated();
    }

    private function createMovie(string $title): int
    {
        $now = now();

        return DB::table('movies')->insertGetId([
            'title' => $title,
            'genre' => 'Drama',
            'description' => 'Test movie',
            'duration' => 100,
            'rating' => 8,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'movieId');
    }

    private function fakePaymentSlip(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            'payment.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lqAAAAAASUVORK5CYII=', true)
        );
    }

    private function createShowtime(int $movieId, string $time): int
    {
        $now = now();

        return DB::table('showtimes')->insertGetId([
            'date' => '2026-11-07',
            'time' => $time,
            'roomId' => $this->roomId,
            'movieId' => $movieId,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'showtimeId');
    }
}
