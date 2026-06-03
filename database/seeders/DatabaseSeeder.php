<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\ExchangeRate;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- USUARIO ADMIN DEMO ---
        User::firstOrCreate(
            ['email' => 'demo@bodeguita.com'],
            [
                'name' => 'Admin Demo',
                'password' => bcrypt('demo1234'),
                'email_verified_at' => now(),
            ]
        );

        // --- TASAS DE CAMBIO ---
        ExchangeRate::updateOrCreate(['currency_code' => 'VES'], ['rate' => 46.50]);
        ExchangeRate::updateOrCreate(['currency_code' => 'COP'], ['rate' => 4200.00]);

        $vesRate = 46.50;
        $copRate = 4200.00;

        // --- CLIENTES ---
        $clientes = [
            ['name' => 'María González',    'identity_document' => 'V-12345678'],
            ['name' => 'Carlos Rodríguez',  'identity_document' => 'V-87654321'],
            ['name' => 'Ana Martínez',      'identity_document' => 'C-11223344'],
            ['name' => 'Luis Pérez',        'identity_document' => 'V-55667788'],
        ];
        foreach ($clientes as $c) {
            Customer::firstOrCreate(['identity_document' => $c['identity_document']], ['name' => $c['name']]);
        }

        // --- PRODUCTOS ---
        $productos = [
            ['sku' => 'HPAN01', 'name' => 'Harina PAN 1kg',       'cost_price' => 0.90, 'selling_price' => 1.20, 'stock' => 50],
            ['sku' => 'ARZ01',  'name' => 'Arroz Primor 1kg',      'cost_price' => 1.10, 'selling_price' => 1.50, 'stock' => 30],
            ['sku' => 'ACT01',  'name' => 'Aceite Corona 1L',      'cost_price' => 2.00, 'selling_price' => 2.80, 'stock' => 25],
            ['sku' => 'AZU01',  'name' => 'Azúcar 1kg',            'cost_price' => 0.80, 'selling_price' => 1.10, 'stock' => 40],
            ['sku' => 'PAS01',  'name' => 'Pasta Promesa 500g',    'cost_price' => 0.60, 'selling_price' => 0.90, 'stock' => 60],
            ['sku' => 'SAL01',  'name' => 'Sal Cristal 1kg',       'cost_price' => 0.30, 'selling_price' => 0.50, 'stock' => 80],
            ['sku' => 'CAF01',  'name' => 'Café Fama 500g',        'cost_price' => 3.50, 'selling_price' => 4.50, 'stock' => 20],
            ['sku' => 'MAR01',  'name' => 'Margarina Mavesa 500g', 'cost_price' => 1.20, 'selling_price' => 1.70, 'stock' => 35],
            ['sku' => 'JAB01',  'name' => 'Jabón Lux x3',         'cost_price' => 1.50, 'selling_price' => 2.20, 'stock' => 8],  // stock bajo
            ['sku' => 'ATN01',  'name' => 'Atún Fiesta 170g',     'cost_price' => 1.80, 'selling_price' => 2.50, 'stock' => 6],  // stock bajo
        ];
        foreach ($productos as $p) {
            Product::updateOrCreate(['sku' => $p['sku']], $p);
        }

        // --- VENTAS COMPLETADAS (historial) ---
        $maria    = Customer::where('identity_document', 'V-12345678')->first();
        $carlos   = Customer::where('identity_document', 'V-87654321')->first();
        $ana      = Customer::where('identity_document', 'C-11223344')->first();
        $luis     = Customer::where('identity_document', 'V-55667788')->first();

        $harina   = Product::where('sku', 'HPAN01')->first();
        $arroz    = Product::where('sku', 'ARZ01')->first();
        $aceite   = Product::where('sku', 'ACT01')->first();
        $azucar   = Product::where('sku', 'AZU01')->first();
        $pasta    = Product::where('sku', 'PAS01')->first();
        $cafe     = Product::where('sku', 'CAF01')->first();

        $this->crearVenta($maria, [
            ['product' => $harina, 'qty' => 3],
            ['product' => $aceite, 'qty' => 1],
        ], $copRate, $vesRate, 'completed', '-5 days');

        $this->crearVenta($carlos, [
            ['product' => $arroz,  'qty' => 2],
            ['product' => $azucar, 'qty' => 2],
            ['product' => $pasta,  'qty' => 3],
        ], $copRate, $vesRate, 'completed', '-3 days');

        $this->crearVenta($ana, [
            ['product' => $cafe,   'qty' => 1],
            ['product' => $harina, 'qty' => 2],
        ], $copRate, $vesRate, 'completed', '-2 days');

        $this->crearVenta(null, [
            ['product' => $arroz,  'qty' => 1],
            ['product' => $pasta,  'qty' => 2],
        ], $copRate, $vesRate, 'completed', '-1 day');

        // --- VENTAS PENDIENTES (deudas) ---
        $this->crearVenta($luis, [
            ['product' => $aceite, 'qty' => 2],
            ['product' => $cafe,   'qty' => 1],
        ], $copRate, $vesRate, 'pending', '-4 days', paidCop: 5000);

        $this->crearVenta($maria, [
            ['product' => $arroz,  'qty' => 3],
            ['product' => $azucar, 'qty' => 1],
        ], $copRate, $vesRate, 'pending', '-1 day', paidCop: 0);
    }

    private function crearVenta(
        $customer,
        array $items,
        float $copRate,
        float $vesRate,
        string $status,
        string $dateOffset,
        float $paidCop = null
    ): void {
        $totalUsd = collect($items)->sum(fn($i) => $i['product']->selling_price * $i['qty']);
        $totalCop = collect($items)->sum(fn($i) => round($i['product']->selling_price * $i['qty'] * $copRate));
        $totalVes = $totalUsd * $vesRate;

        $paid = $paidCop ?? $totalCop;
        $paidUsd = round($paid / $copRate, 2);
        $paidVes = round($paidUsd * $vesRate, 2);

        $sale = Sale::create([
            'customer_id'       => $customer?->id,
            'total_usd'         => $totalUsd,
            'total_cop'         => $totalCop,
            'total_ves'         => $totalVes,
            'paid_amount_cop'   => $status === 'completed' ? $totalCop : $paid,
            'paid_amount_usd'   => $status === 'completed' ? $totalUsd : $paidUsd,
            'paid_amount_ves'   => $status === 'completed' ? $totalVes : $paidVes,
            'exchange_rate_cop' => $copRate,
            'exchange_rate_ves' => $vesRate,
            'status'            => $status,
            'created_at'        => now()->modify($dateOffset),
            'updated_at'        => now()->modify($dateOffset),
        ]);

        foreach ($items as $i) {
            SaleItem::create([
                'sale_id'     => $sale->id,
                'product_id'  => $i['product']->id,
                'quantity'    => $i['qty'],
                'price_usd'   => $i['product']->selling_price,
                'subtotal_usd' => $i['product']->selling_price * $i['qty'],
            ]);
            $i['product']->decrement('stock', $i['qty']);
        }

        // Registrar pago inicial
        if ($paid > 0) {
            $sale->payments()->create([
                'amount'        => $status === 'completed' ? $totalCop : $paid,
                'currency'      => 'COP',
                'exchange_rate' => $copRate,
            ]);
        }
    }
}
