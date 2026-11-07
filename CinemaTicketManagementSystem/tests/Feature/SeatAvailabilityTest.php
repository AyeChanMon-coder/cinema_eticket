<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Seat;
use App\Models\Showtime;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SeatAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private User $admin;

    private int $roomId;

    private int $otherRoomId;

    private Showtime $firstShowtime;

    private Showtime $secondShowtime;

    private Seat $firstSeat;

    private Seat $otherRoomSeat;

    private PaymentMethod $paymentMethod;

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
        $this->roomId = $this->createRoom($cinemaId, 'Room 1');
        $this->otherRoomId = $this->createRoom($cinemaId, 'Room 2');

        $movieId = DB::table('movies')->insertGetId([
            'title' => 'Test Movie',
            'genre' => 'Drama',
            'description' => 'Test movie',
            'duration' => 100,
            'rating' => 8,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'movieId');
        $this->firstShowtime = $this->createShowtime($movieId, $this->roomId, '12:30:00');
        $this->secondShowtime = $this->createShowtime($movieId, $this->roomId, '13:30:00');

        $this->firstSeat = Seat::create([
            'seatNumber' => 'A1',
            'isBooked' => true,
            'seatType' => 'Standard',
            'seatPrice' => 1000,
            'status' => 1,
            'roomId' => $this->roomId,
        ]);
        $this->otherRoomSeat = Seat::create([
            'seatNumber' => 'A1',
            'isBooked' => false,
            'seatType' => 'Standard',
            'seatPrice' => 1000,
            'status' => 0,
            'roomId' => $this->otherRoomId,
        ]);

        $this->customer = User::create([
            'name' => 'Customer',
            'email' => 'seat-customer@example.com',
            'password' => 'password',
            'userType' => 1,
        ]);
        $this->admin = User::create([
            'name' => 'Admin',
            'email' => 'seat-admin@example.com',
            'password' => 'password',
            'userType' => 2,
        ]);
        $this->paymentMethod = PaymentMethod::create([
            'code' => 'SEAT_TEST',
            'name' => 'Test payment',
            'isActive' => true,
        ]);
        Storage::fake('public');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_seat_availability_is_scoped_to_the_selected_showtime(): void
    {
        $this->createBooking($this->firstShowtime, $this->firstSeat, 'confirmed');

        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', true);

        $this->getJson("/api/showtimes/{$this->secondShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', false);

        $this->assertDatabaseHas('seats', ['seatId' => $this->firstSeat->seatId, 'isBooked' => true]);
    }

    public function test_pending_booking_holds_seat_for_fifteen_minutes_then_expires_without_deleting_history(): void
    {
        [$booking, $payment] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            'pending',
            now()->addMinutes(15),
        );

        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', true);

        Carbon::setTestNow(now()->addMinutes(15));
        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', false);

        $this->assertDatabaseHas('bookings', ['bookingId' => $booking->bookingId, 'status' => 'cancelled']);
        $this->assertDatabaseHas('payments', ['paymentId' => $payment->paymentId, 'paymentStatus' => 'expired']);
        $this->assertDatabaseHas('booking_seat', ['bookingId' => $booking->bookingId, 'seatId' => $this->firstSeat->seatId]);
    }

    public function test_cancelled_and_rejected_bookings_release_seats_but_keep_their_seat_records(): void
    {
        [$booking, $payment] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            'pending',
            now()->addMinutes(15),
        );

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/admin/payments/{$payment->paymentId}/status", ['paymentStatus' => 'rejected'])
            ->assertOk();

        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', false);

        $this->assertDatabaseHas('bookings', ['bookingId' => $booking->bookingId, 'status' => 'cancelled']);
        $this->assertDatabaseHas('payments', ['paymentId' => $payment->paymentId, 'paymentStatus' => 'rejected']);
        $this->assertDatabaseHas('booking_seat', ['bookingId' => $booking->bookingId, 'seatId' => $this->firstSeat->seatId]);
    }

    public function test_expired_payment_cannot_be_approved_and_keeps_booking_history(): void
    {
        [$booking, $payment] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            'pending',
            now()->subSecond(),
        );

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/admin/payments/{$payment->paymentId}/status", ['paymentStatus' => 'approved'])
            ->assertUnprocessable();

        $this->assertDatabaseHas('bookings', ['bookingId' => $booking->bookingId, 'status' => 'cancelled']);
        $this->assertDatabaseHas('payments', ['paymentId' => $payment->paymentId, 'paymentStatus' => 'expired']);
        $this->assertDatabaseHas('booking_seat', ['bookingId' => $booking->bookingId, 'seatId' => $this->firstSeat->seatId]);
    }

    public function test_admin_booking_delete_cancels_without_deleting_booking_or_seat_history(): void
    {
        [$booking, $payment] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            'pending',
            now()->addMinutes(15),
        );

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/admin/bookings/{$booking->bookingId}")
            ->assertNoContent();

        $this->assertDatabaseHas('bookings', ['bookingId' => $booking->bookingId, 'status' => 'cancelled']);
        $this->assertDatabaseHas('payments', ['paymentId' => $payment->paymentId, 'paymentStatus' => 'cancelled']);
        $this->assertDatabaseHas('booking_seat', ['bookingId' => $booking->bookingId, 'seatId' => $this->firstSeat->seatId]);
    }

    public function test_payment_submission_allows_a_seat_booked_for_another_showtime_and_rechecks_same_showtime(): void
    {
        $this->createBooking($this->firstShowtime, $this->firstSeat, 'confirmed');

        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/payments', $this->paymentPayload($this->secondShowtime, $this->firstSeat))
            ->assertCreated();

        $this->postJson('/api/payments', $this->paymentPayload($this->secondShowtime, $this->firstSeat))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'One or more selected seats are no longer available for this showtime.');

        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseHas('seats', ['seatId' => $this->firstSeat->seatId, 'isBooked' => true]);
    }

    public function test_payment_submission_rejects_a_seat_from_another_room(): void
    {
        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/payments', $this->paymentPayload($this->firstShowtime, $this->otherRoomSeat))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'One or more selected seats do not belong to this showtime room.');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_admin_booking_creation_uses_showtime_specific_availability(): void
    {
        $this->createBooking($this->firstShowtime, $this->firstSeat, 'confirmed');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/bookings', [
                'bookingDate' => now()->toDateString(),
                'status' => 'pending',
                'userId' => $this->customer->userId,
                'showtimeId' => $this->firstShowtime->showtimeId,
                'seatIds' => [$this->firstSeat->seatId],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'One or more selected seats are no longer available for this showtime.');

        $this->assertDatabaseCount('bookings', 1);
    }

    private function createRoom(int $cinemaId, string $name): int
    {
        $now = now();

        return DB::table('rooms')->insertGetId([
            'name' => $name,
            'cinemaId' => $cinemaId,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'roomId');
    }

    private function createShowtime(int $movieId, int $roomId, string $time): Showtime
    {
        $now = now();
        $showtimeId = DB::table('showtimes')->insertGetId([
            'date' => '2026-11-07',
            'time' => $time,
            'roomId' => $roomId,
            'movieId' => $movieId,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'showtimeId');

        return Showtime::findOrFail($showtimeId);
    }

    private function createBooking(
        Showtime $showtime,
        Seat $seat,
        string $status,
        ?string $paymentStatus = null,
        ?Carbon $holdExpiresAt = null,
    ): array {
        $booking = Booking::create([
            'bookingDate' => now()->toDateString(),
            'status' => $status,
            'userId' => $this->customer->userId,
            'showtimeId' => $showtime->showtimeId,
            'holdExpiresAt' => $holdExpiresAt,
        ]);
        $booking->seats()->attach($seat->seatId);

        $payment = null;
        if ($paymentStatus) {
            $payment = Payment::create([
                'amount' => 1000,
                'paymentMethod' => $this->paymentMethod->name,
                'paymentMethodId' => $this->paymentMethod->paymentMethodId,
                'paymentStatus' => $paymentStatus,
                'bookingId' => $booking->bookingId,
            ]);
        }

        return [$booking, $payment];
    }

    private function paymentPayload(Showtime $showtime, Seat $seat): array
    {
        return [
            'showtimeId' => $showtime->showtimeId,
            'seatIds' => [$seat->seatId],
            'amount' => 1000,
            'paymentMethodId' => $this->paymentMethod->paymentMethodId,
            'paymentSlip' => UploadedFile::fake()->createWithContent(
                'payment.png',
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lqAAAAAASUVORK5CYII=', true)
            ),
        ];
    }
}
