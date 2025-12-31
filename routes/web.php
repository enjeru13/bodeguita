<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redirect;
use App\Http\Controllers\SalesController; // Importante importar esto

Route::get('/', function () {
    return Redirect::route('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::resource('inventory', \App\Http\Controllers\Inventory\ProductController::class)->names([
        'index' => 'inventory.index',
        'create' => 'inventory.create',
        'store' => 'inventory.store',
        'edit' => 'inventory.edit',
        'update' => 'inventory.update',
        'destroy' => 'inventory.destroy',
    ]);

    Route::resource('customers', \App\Http\Controllers\CustomerController::class);

    Route::get('pos', [\App\Http\Controllers\SalesController::class, 'index'])->name('pos.index');
    Route::post('pos', [\App\Http\Controllers\SalesController::class, 'store'])->name('pos.store');
    Route::post('sales/{sale}/payment', [SalesController::class, 'addPayment'])->name('sales.payment');

    Route::get('financial', [\App\Http\Controllers\FinancialController::class, 'index'])->name('financial.index');
    Route::post('exchange-rates', [\App\Http\Controllers\FinancialController::class, 'updateRates'])->name('exchange-rates.update');
});

require __DIR__ . '/settings.php';
