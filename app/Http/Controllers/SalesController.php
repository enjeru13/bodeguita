<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Product;
use App\Models\Customer;
use App\Models\ExchangeRate;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesController extends Controller
{
    public function index()
    {
        return Inertia::render('pos/index', [
            'products' => Product::where('stock', '>', 0)->get(),
            'customers' => Customer::all(),
            'exchangeRates' => ExchangeRate::all()->pluck('rate', 'currency_code')
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'total_usd' => 'required|numeric|min:0',
            'total_ves' => 'required|numeric|min:0',
            'total_cop' => 'required|numeric|min:0',
            'paid_amount_usd' => 'nullable|numeric|min:0',
            'paid_amount_ves' => 'nullable|numeric|min:0',
            'paid_amount_cop' => 'nullable|numeric|min:0',
            'exchange_rate_ves' => 'required|numeric',
            'exchange_rate_cop' => 'required|numeric',
            'status' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $sale = Sale::create([
                'customer_id' => $validated['customer_id'],
                'total_usd' => $validated['total_usd'],
                'total_ves' => $validated['total_ves'],
                'total_cop' => $validated['total_cop'],
                'paid_amount_usd' => $validated['paid_amount_usd'] ?? $validated['total_usd'],
                'paid_amount_ves' => $validated['paid_amount_ves'] ?? $validated['total_ves'],
                'paid_amount_cop' => $validated['paid_amount_cop'] ?? $validated['total_cop'],
                'exchange_rate_ves' => $validated['exchange_rate_ves'],
                'exchange_rate_cop' => $validated['exchange_rate_cop'],
                'status' => $validated['status'] ?? 'completed',
            ]);

            foreach ($validated['items'] as $itemData) {
                $product = Product::lockForUpdate()->find($itemData['product_id']);

                if ($product->stock < $itemData['quantity']) {
                    throw new \Exception("Stock insuficiente para {$product->name}");
                }

                $saleItem = new SaleItem([
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'price_usd' => $product->selling_price,
                    'subtotal_usd' => $product->selling_price * $itemData['quantity'],
                ]);

                $sale->items()->save($saleItem);

                $product->decrement('stock', $itemData['quantity']);
            }

            return redirect()->back()->with('success', 'Venta procesada correctamente.');
        });
    }
}
