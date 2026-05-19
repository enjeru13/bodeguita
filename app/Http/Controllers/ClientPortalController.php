<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Sale;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientPortalController extends Controller
{
    public function showLogin()
    {
        if (session()->has('client_id')) {
            return redirect()->route('client.dashboard');
        }
        return Inertia::render('client/login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'identity_document' => 'required|string',
        ]);

        $customer = Customer::where('identity_document', $request->identity_document)->first();

        if (!$customer) {
            return back()->withErrors(['identity_document' => 'Cédula no encontrada en el sistema.']);
        }

        session(['client_id' => $customer->id, 'client_name' => $customer->name]);

        return redirect()->route('client.dashboard');
    }

    public function logout()
    {
        session()->forget(['client_id', 'client_name']);
        return redirect()->route('client.login');
    }

    public function dashboard()
    {
        $clientId = session('client_id');
        if (!$clientId) return redirect()->route('client.login');

        $customer = Customer::findOrFail($clientId);
        
        $sales = Sale::with(['items.product', 'payments'])
            ->where('customer_id', $clientId)
            ->latest()
            ->get();

        $totalDebtCop = Sale::where('customer_id', $clientId)
            ->where('status', 'pending')
            ->get()
            ->sum(fn($s) => $s->total_cop - $s->paid_amount_cop);

        $totalDebtUsd = Sale::where('customer_id', $clientId)
            ->where('status', 'pending')
            ->get()
            ->sum(fn($s) => $s->total_usd - $s->paid_amount_usd);

        return Inertia::render('client/dashboard', [
            'customer' => $customer,
            'sales' => $sales,
            'totalDebtCop' => $totalDebtCop,
            'totalDebtUsd' => $totalDebtUsd,
            'products' => Product::where('stock', '>', 0)->get(),
            'exchangeRates' => \App\Models\ExchangeRate::all()->pluck('rate', 'currency_code'),
        ]);
    }

    public function storeOrder(Request $request)
    {
        $clientId = session('client_id');
        if (!$clientId) return response()->json(['error' => 'No autorizado'], 401);

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        // Calcular totales basados en precios actuales
        $totalUsd = 0;
        $itemsData = [];

        foreach ($request->items as $item) {
            $product = Product::find($item['id']);
            $subtotalUsd = $product->selling_price * $item['quantity'];
            $totalUsd += $subtotalUsd;

            $itemsData[] = [
                'product_id' => $product->id,
                'quantity' => $item['quantity'],
                'price_usd' => $product->selling_price,
                'subtotal_usd' => $subtotalUsd,
            ];
        }

        // Tasas actuales (podemos usar las de la base de datos o fijas)
        $vesRate = \App\Models\ExchangeRate::where('currency_code', 'VES')->first()->rate ?? 1;
        $copRate = \App\Models\ExchangeRate::where('currency_code', 'COP')->first()->rate ?? 1;

        $sale = Sale::create([
            'customer_id' => $clientId,
            'total_usd' => $totalUsd,
            'total_ves' => $totalUsd * $vesRate,
            'total_cop' => $totalUsd * $copRate,
            'paid_amount_usd' => 0,
            'paid_amount_ves' => 0,
            'paid_amount_cop' => 0,
            'exchange_rate_ves' => $vesRate,
            'exchange_rate_cop' => $copRate,
            'status' => 'order_pending', // Nuevo estado
        ]);

        foreach ($itemsData as $item) {
            $sale->items()->create($item);
        }

        return back()->with('success', '¡Pedido enviado con éxito!');
    }
}
