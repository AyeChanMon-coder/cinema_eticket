<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Seat;
use App\Models\Showtime;
use App\Models\User;
use App\Models\UserNotification;
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

    public function test_unpaid_seat_hold_expires_after_fifteen_minutes_without_deleting_history(): void
    {
        [$booking] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            null,
            now()->addMinutes(15),
        );

        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', true);

        Carbon::setTestNow(now()->addMinutes(14)->addSeconds(59));
        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', true);

        Carbon::setTestNow(now()->addSecond());
        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', false);

        $this->assertDatabaseHas('bookings', ['bookingId' => $booking->bookingId, 'status' => 'cancelled']);
        $this->assertDatabaseHas('booking_seat', ['bookingId' => $booking->bookingId, 'seatId' => $this->firstSeat->seatId]);
    }

    public function test_expired_hold_notifies_all_admins_and_superadmins(): void
    {
        $superadmin = User::create([
            'name' => 'Superadmin',
            'email' => 'seat-superadmin@example.com',
            'password' => 'password',
            'userType' => 3,
        ]);
        [$booking] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            null,
            now()->subSecond(),
        );

        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")->assertOk();

        $adminNotification = UserNotification::where('userId', $this->admin->userId)->firstOrFail();
        $superadminNotification = UserNotification::where('userId', $superadmin->userId)->firstOrFail();
        $this->assertSame('Seat hold expired', $adminNotification->title);
        $this->assertNull($adminNotification->paymentId);
        $this->assertNull($superadminNotification->paymentId);
        $this->assertStringContainsString("Booking #{$booking->bookingId}", $adminNotification->message);

        $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Seat hold expired');
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

    public function test_submitted_payment_remains_reviewable_after_the_original_hold_deadline(): void
    {
        [$booking, $payment] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            'pending',
            now()->subSecond(),
        );

        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', true);

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/admin/payments/{$payment->paymentId}/status", ['paymentStatus' => 'approved'])
            ->assertOk()
            ->assertJsonPath('paymentStatus', 'approved');

        $this->assertDatabaseHas('bookings', ['bookingId' => $booking->bookingId, 'status' => 'confirmed']);
        $this->assertDatabaseHas('payments', ['paymentId' => $payment->paymentId, 'paymentStatus' => 'approved']);
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
        [$hold] = $this->createBooking(
            $this->secondShowtime,
            $this->firstSeat,
            'pending',
            null,
            now()->addMinutes(15),
        );

        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/payments', $this->paymentPayload($hold))
            ->assertCreated();

        Carbon::setTestNow(now()->addMinutes(16));
        $this->getJson("/api/showtimes/{$this->secondShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', true);
        $this->assertDatabaseHas('bookings', ['bookingId' => $hold->bookingId, 'status' => 'pending', 'holdExpiresAt' => null]);

        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseHas('seats', ['seatId' => $this->firstSeat->seatId, 'isBooked' => true]);
    }

    public function test_new_pending_payment_notifies_every_admin_and_superadmin(): void
    {
        $superadmin = User::create([
            'name' => 'Superadmin',
            'email' => 'seat-payment-superadmin@example.com',
            'password' => 'password',
            'userType' => 3,
        ]);

        [$hold] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            null,
            now()->addMinutes(15),
        );
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/payments', $this->paymentPayload($hold))
            ->assertCreated();
        $paymentId = $response->json('paymentId');
        $adminNotification = UserNotification::where('userId', $this->admin->userId)->firstOrFail();
        $superadminNotification = UserNotification::where('userId', $superadmin->userId)->firstOrFail();

        $this->assertSame('New booking payment', $adminNotification->title);
        $this->assertSame($paymentId, $adminNotification->paymentId);
        $this->assertSame($paymentId, $superadminNotification->paymentId);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'New booking payment');

        $this->assertDatabaseHas('user_notifications', [
            'userId' => $superadmin->userId,
            'paymentId' => $paymentId,
            'isRead' => false,
        ]);
    }

    public function test_payment_submission_rejects_a_seat_from_another_room(): void
    {
        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/bookings/hold', [
                'showtimeId' => $this->firstShowtime->showtimeId,
                'seatIds' => [$this->otherRoomSeat->seatId],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'One or more selected seats do not belong to this showtime room.');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_payment_submission_after_hold_expiry_is_rejected_and_releases_the_seat(): void
    {
        [$booking] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            null,
            now()->subSecond(),
        );

        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/payments', $this->paymentPayload($booking))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Your 15-minute seat hold has expired. Please select your seats again.');

        $this->assertDatabaseHas('bookings', ['bookingId' => $booking->bookingId, 'status' => 'cancelled']);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_customer_cannot_submit_payment_for_another_users_seat_hold(): void
    {
        [$booking] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'pending',
            null,
            now()->addMinutes(15),
        );
        $otherCustomer = User::create([
            'name' => 'Other customer',
            'email' => 'seat-other-customer@example.com',
            'password' => 'password',
            'userType' => 1,
        ]);

        $this->actingAs($otherCustomer, 'sanctum')
            ->postJson('/api/payments', $this->paymentPayload($booking))
            ->assertForbidden();

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_customer_can_create_a_fifteen_minute_seat_hold_before_payment_submission(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/bookings/hold', [
                'showtimeId' => $this->firstShowtime->showtimeId,
                'seatIds' => [$this->firstSeat->seatId],
            ])
            ->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('seats.0.seatId', $this->firstSeat->seatId);

        $bookingId = $response->json('bookingId');
        $booking = Booking::findOrFail($bookingId);
        $this->assertTrue($booking->holdExpiresAt->equalTo(now()->addMinutes(15)));

        $this->getJson("/api/showtimes/{$this->firstShowtime->showtimeId}/seats")
            ->assertOk()
            ->assertJsonPath('0.isBooked', true);
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

    public function test_admin_booking_list_returns_newest_booking_first(): void
    {
        [$olderBooking] = $this->createBooking($this->firstShowtime, $this->firstSeat, 'cancelled');
        [$newerBooking] = $this->createBooking($this->secondShowtime, $this->firstSeat, 'cancelled');

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/bookings')
            ->assertOk()
            ->assertJsonPath('0.bookingId', $newerBooking->bookingId)
            ->assertJsonPath('1.bookingId', $olderBooking->bookingId);
    }

    public function test_admin_movie_cinema_payment_method_user_and_payment_lists_show_newest_first(): void
    {
        $now = now();
        $newCinemaId = DB::table('cinemas')->insertGetId([
            'name' => 'New Cinema',
            'location' => 'Yangon',
            'created_at' => $now,
            'updated_at' => $now,
        ], 'cinemaId');
        $newMovieId = DB::table('movies')->insertGetId([
            'title' => 'New Movie',
            'genre' => 'Comedy',
            'description' => 'New movie',
            'duration' => 90,
            'rating' => 7,
            'created_at' => $now,
            'updated_at' => $now,
        ], 'movieId');
        $newPaymentMethod = PaymentMethod::create([
            'code' => 'SEAT_NEW',
            'name' => 'New payment method',
            'isActive' => true,
            'sortOrder' => 99,
        ]);
        $newUser = User::create([
            'name' => 'Newest Customer',
            'email' => 'seat-newest-customer@example.com',
            'password' => 'password',
            'userType' => 1,
        ]);
        [$olderBooking, $olderPayment] = $this->createBooking(
            $this->firstShowtime,
            $this->firstSeat,
            'confirmed',
            'approved',
        );
        [$newerBooking, $newerPayment] = $this->createBooking(
            $this->secondShowtime,
            $this->firstSeat,
            'confirmed',
            'approved',
        );

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/movies')
            ->assertOk()
            ->assertJsonPath('0.movieId', $newMovieId);

        $this->getJson('/api/admin/cinemas')
            ->assertOk()
            ->assertJsonPath('0.cinemaId', $newCinemaId);

        $this->getJson('/api/admin/payment-methods')
            ->assertOk()
            ->assertJsonPath('0.paymentMethodId', $newPaymentMethod->paymentMethodId);

        $this->getJson('/api/admin/users?type=users')
            ->assertOk()
            ->assertJsonPath('0.userId', $newUser->userId);

        $this->getJson('/api/admin/bookings')
            ->assertOk()
            ->assertJsonPath('0.bookingId', $newerBooking->bookingId)
            ->assertJsonPath('1.bookingId', $olderBooking->bookingId);

        $this->getJson('/api/admin/payments')
            ->assertOk()
            ->assertJsonPath('0.paymentId', $newerPayment->paymentId)
            ->assertJsonPath('1.paymentId', $olderPayment->paymentId);
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

    private function paymentPayload(Booking $booking): array
    {
        return [
            'bookingId' => $booking->bookingId,
            'amount' => 1000,
            'paymentMethodId' => $this->paymentMethod->paymentMethodId,
            'paymentSlip' => UploadedFile::fake()->createWithContent(
                'payment.png',
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lqAAAAAASUVORK5CYII=', true)
            ),
        ];
    }
}
