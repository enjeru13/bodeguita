<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Sale;
use App\Models\ExchangeRate;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinancialController extends Controller
{
    public function index()
    {
        $cop_rate = (float) (ExchangeRate::where('currency_code', 'COP')->first()?->rate ?? 3650);
        $ves_rate = (float) (ExchangeRate::where('currency_code', 'VES')->first()?->rate ?? 520);

        // Optimizamos la carga de ventas: solo las últimas 100 para el historial rápido
        $sales = Sale::with(['customer', 'items.product', 'payments'])
            ->latest()
            ->take(100)
                ->get();

        // Totales Generales con SQL para máxima velocidad
        $totals = Sale::selectRaw('
            SUM(total_usd) as total_usd,
            SUM(total_ves) as total_ves,
            SUM(total_cop) as total_cop,
            SUM(paid_amount_usd) as total_paid_usd,
            SUM(paid_amount_cop) as total_paid_cop,
            COUNT(*) as total_sales
        ')->first();

        // Totales de Hoy
        $todayTotals = Sale::whereDate('created_at', today())->selectRaw('
            COUNT(*) as today_sales,
            SUM(total_usd) as today_total_usd,
            SUM(total_ves) as today_total_ves,
            SUM(total_cop) as today_total_cop
        ')->first();

        // Deudas (solo ventas pending)
        $debtTotals = Sale::where('status', 'pending')->selectRaw('
            SUM(total_usd - paid_amount_usd) as total_debt_usd,
            SUM(total_cop - paid_amount_cop) as total_debt_cop
        ')->first();

        $lowStockProducts = Product::where('stock', '<=', 10)->get();

        $summary = [
            'total_usd' => (float) ($totals->total_usd ?? 0),
            'total_cop' => (float) ($totals->total_cop ?? 0),
            'total_ves' => (float) ($totals->total_ves ?? 0),
            'total_sales' => (int) ($totals->total_sales ?? 0),
            'today_sales' => (int) ($todayTotals->today_sales ?? 0),
            'today_total_usd' => (float) ($todayTotals->today_total_usd ?? 0),
            'today_total_cop' => (float) ($todayTotals->today_total_cop ?? 0),
            'today_total_ves' => (float) ($todayTotals->today_total_ves ?? 0),
            'total_paid_cop' => (float) ($totals->total_paid_cop ?? 0),
            'total_paid_usd' => (float) ($totals->total_paid_usd ?? 0),
            'total_debt_cop' => (float) ($debtTotals->total_debt_cop ?? 0),
            'total_debt_usd' => (float) ($debtTotals->total_debt_usd ?? 0),
            'net_worth_cop' => (float) (($totals->total_paid_cop ?? 0) + ($debtTotals->total_debt_cop ?? 0)),
            'low_stock_count' => $lowStockProducts->count(),
            'low_stock_products' => $lowStockProducts,
        ];

        return Inertia::render('financial/index', [
            'sales' => $sales,
            'exchangeRates' => ExchangeRate::all(),
            'summary' => $summary,
            'debtors' => Sale::where('status', 'pending')
                ->selectRaw('
                    customer_id,
                    SUM(total_usd - paid_amount_usd) as total_debt_usd,
                    COUNT(*) as sale_count,
                    MAX(exchange_rate_cop) as last_rate_cop
                ')
                ->groupBy('customer_id')
                ->with('customer')
                ->get()
                ->map(function ($d) use ($cop_rate) {
                    return [
                        'customer_id' => $d->customer_id ?? 0,
                        'customer_name' => $d->customer?->name ?? 'Cliente Eventual',
                        'total_debt_usd' => (float) $d->total_debt_usd,
                        'total_debt_cop' => (float) ($d->total_debt_usd * ($d->last_rate_cop ?: $cop_rate)),
                        'sale_count' => $d->sale_count,
                    ];
                })->values(),
            'recentPayments' => \App\Models\Payment::with('sale.customer')->latest()->take(50)->get(),
            'chartData' => Sale::where('created_at', '>=', now()->subDays(14))
                ->selectRaw('DATE(created_at) as date, SUM(total_usd) as total_usd, SUM(total_cop) as total_cop')
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get()
        ]);
    }

    public function updateRates(Request $request)
    {
        $validated = $request->validate([
            'rates' => 'required|array',
            'rates.*.currency_code' => 'required|string',
            'rates.*.rate' => 'required|numeric|min:0',
            // Este campo viene del checkbox en el frontend
            'freeze_cop_prices' => 'boolean' 
        ]);

        // 1. Capturamos la tasa ANTERIOR de COP antes de hacer cualquier cambio
        $oldCopRate = ExchangeRate::where('currency_code', 'COP')->value('rate');

        // 2. Actualizamos las tasas en la base de datos
        foreach ($validated['rates'] as $rateData) {
            ExchangeRate::where('currency_code', $rateData['currency_code'])
                ->update(['rate' => $rateData['rate']]);
        }

        // 3. LÓGICA DE REAJUSTE DE PRECIOS
        // Buscamos cuál es la NUEVA tasa de COP que acabamos de recibir
        $newCopRate = collect($validated['rates'])->firstWhere('currency_code', 'COP')['rate'] ?? null;

        // Solo ejecutamos si:
        // A) El usuario marcó el checkbox "freeze_cop_prices"
        // B) Tenemos tasa vieja y tasa nueva
        // C) La tasa realmente cambió (no es igual a la anterior)
        if ($request->input('freeze_cop_prices') && $oldCopRate && $newCopRate && $oldCopRate != $newCopRate) {
            
            // Calculamos el factor. 
            // Si Old=4000 y New=3650 -> Factor = 1.09 (El precio USD subirá)
            // Si Old=3650 y New=4000 -> Factor = 0.91 (El precio USD bajará)
            $adjustmentFactor = $oldCopRate / $newCopRate;

            // Actualizamos TODOS los productos de una sola vez
            // Multiplicamos el precio actual en USD por el factor
            Product::query()->update([
                'selling_price' => DB::raw("selling_price * $adjustmentFactor")
            ]);
        }

        $message = 'Tasas actualizadas.';
        if ($request->input('freeze_cop_prices') && $oldCopRate != $newCopRate) {
            $message .= ' Los precios base en USD se han ajustado para mantener el valor en COP.';
        }

        return redirect()->back()->with('success', $message);
    }
}
