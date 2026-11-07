<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_list_only_returns_unread_notifications_for_the_authenticated_user(): void
    {
        $user = User::create([
            'name' => 'Customer',
            'email' => 'notification-customer@example.com',
            'password' => 'password',
            'userType' => 1,
        ]);
        $otherUser = User::create([
            'name' => 'Other customer',
            'email' => 'notification-other@example.com',
            'password' => 'password',
            'userType' => 1,
        ]);

        $unread = UserNotification::create([
            'userId' => $user->userId,
            'title' => 'Unread',
            'message' => 'Unread notification',
            'isRead' => false,
        ]);
        $read = UserNotification::create([
            'userId' => $user->userId,
            'title' => 'Read',
            'message' => 'Read notification',
            'isRead' => true,
        ]);
        UserNotification::create([
            'userId' => $otherUser->userId,
            'title' => 'Other user',
            'message' => 'Another user notification',
            'isRead' => false,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.notificationId', $unread->notificationId);

        $this->assertDatabaseHas('user_notifications', ['notificationId' => $read->notificationId]);
    }

    public function test_opened_notification_stays_in_history_but_is_removed_from_the_list(): void
    {
        $user = User::create([
            'name' => 'Customer',
            'email' => 'notification-read@example.com',
            'password' => 'password',
            'userType' => 1,
        ]);
        $notification = UserNotification::create([
            'userId' => $user->userId,
            'title' => 'Payment approved',
            'message' => 'Your payment has been approved.',
            'isRead' => false,
        ]);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/notifications/{$notification->notificationId}/read")
            ->assertOk()
            ->assertJsonPath('isRead', true);

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(0);

        $this->assertDatabaseHas('user_notifications', [
            'notificationId' => $notification->notificationId,
            'isRead' => true,
        ]);
    }

    public function test_admin_can_read_owned_admin_notification_without_deleting_it(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'notification-admin@example.com',
            'password' => 'password',
            'userType' => 2,
        ]);
        $notification = UserNotification::create([
            'userId' => $admin->userId,
            'title' => 'New booking payment',
            'message' => 'Payment review is required.',
            'isRead' => false,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.notificationId', $notification->notificationId);

        $this->patchJson("/api/admin/notifications/{$notification->notificationId}/read")
            ->assertOk()
            ->assertJsonPath('isRead', true);

        $this->getJson('/api/admin/notifications')->assertOk()->assertJsonCount(0);
        $this->assertDatabaseHas('user_notifications', [
            'notificationId' => $notification->notificationId,
            'isRead' => true,
        ]);
    }
}
