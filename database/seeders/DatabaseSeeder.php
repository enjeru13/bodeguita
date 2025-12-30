<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Admin Bodeguita',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Initial Exchange Rates
        \App\Models\ExchangeRate::updateOrCreate(['currency_code' => 'VES'], ['rate' => 520.00]);
        \App\Models\ExchangeRate::updateOrCreate(['currency_code' => 'COP'], ['rate' => 3650.00]);

        // Default Customer
        \App\Models\Customer::firstOrCreate(
            ['identity_document' => '00000000'],
            ['name' => 'Cliente Eventual']
        );

        // Initial Products
        \App\Models\Product::updateOrCreate(
            ['sku' => 'HPAN01'],
            [
                'name' => 'Harina PAN',
                'description' => 'Harina de maíz precocida 1kg',
                'purchase_price' => 0.90,
                'selling_price' => 1.20,
                'stock' => 50,
            ]
        );

        \App\Models\Product::updateOrCreate(
            ['sku' => 'ARZ01'],
            [
                'name' => 'Arroz Primor',
                'description' => 'Arroz blanco tipo I 1kg',
                'purchase_price' => 1.10,
                'selling_price' => 1.50,
                'stock' => 30,
            ]
        );
    }
}
