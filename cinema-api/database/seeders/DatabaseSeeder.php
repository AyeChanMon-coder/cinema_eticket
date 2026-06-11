<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        User::updateOrCreate(
            ['email' => 'superadmin@cinema.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('Cinem@super2026'), // Strong Password
                'userType' => 3,
            ]
        );
    }
}
