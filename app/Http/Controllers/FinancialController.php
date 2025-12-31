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
        $total_usd = (float) Sale::sum('total_usd');
        $total_cop = (float) Sale::sum('total_cop');
        $total_ves = (float) Sale::sum('total_ves');
        $today_usd = (float) Sale::whereDate('created_at', today())->sum('total_usd');
        $today_cop = (float) Sale::whereDate('created_at', today())->sum('total_cop');
        $today_ves = (float) Sale::whereDate('created_at', today())->sum('total_ves');

        $total_paid_cop = (float) Sale::sum('paid_amount_cop');
        $total_paid_usd = (float) Sale::sum('paid_amount_usd');
        $total_debt_cop = (float) Sale::where('status', 'pending')->get()->sum(fn($s) => $s->total_cop - $s->paid_amount_cop);
        $total_debt_usd = (float) Sale::where('status', 'pending')->get()->sum(fn($s) => $s->total_usd - $s->paid_amount_usd);

        $cop_rate = (float) (ExchangeRate::where('currency_code', 'COP')->first()?->rate ?? 3650);
        $ves_rate = (float) (ExchangeRate::where('currency_code', 'VES')->first()?->rate ?? 520);

        if ($total_cop == 0 && $total_usd > 0)
            $total_cop = $total_usd * $cop_rate;
        if ($today_cop == 0 && $today_usd > 0)
            $today_cop = $today_usd * $cop_rate;
        if ($total_ves == 0 && $total_usd > 0)
            $total_ves = $total_usd * $ves_rate;
        if ($today_ves == 0 && $today_usd > 0)
            $today_ves = $today_usd * $ves_rate;

        return Inertia::render('financial/index', [
            'sales' => Sale::with(['customer', 'items.product'])->latest()->get()->map(function ($sale) use ($cop_rate, $ves_rate) {
                if ($sale->total_cop == 0 && $sale->total_usd > 0) {
                    $sale->total_cop = $sale->total_usd * $cop_rate;
                }
                if ($sale->total_ves == 0 && $sale->total_usd > 0) {
                    $sale->total_ves = $sale->total_usd * $ves_rate;
                }
                return $sale;
            }),
            'exchangeRates' => ExchangeRate::all(),
            'summary' => [
                'total_usd' => $total_usd,
                'total_cop' => $total_cop,
                'total_ves' => $total_ves,
                'total_sales' => Sale::count(),
                'today_sales' => Sale::whereDate('created_at', today())->count(),
                'today_total_usd' => $today_usd,
                'today_total_cop' => $today_cop,
                'today_total_ves' => $today_ves,
                'total_paid_cop' => $total_paid_cop,
                'total_paid_usd' => $total_paid_usd,
                'total_debt_cop' => $total_debt_cop,
                'total_debt_usd' => $total_debt_usd,
                'net_worth_cop' => $total_paid_cop + $total_debt_cop,
            ],
            'debtors' => Sale::where('status', 'pending')
                ->with('customer')
                ->get()
                ->groupBy('customer_id')
                ->map(function ($sales) {
                    $customer = $sales->first()->customer;
                    return [
                        'customer_id' => $customer->id ?? 0,
                        'customer_name' => $customer->name ?? 'Cliente Eventual',
                        'total_debt_cop' => (float) $sales->sum(fn($s) => $s->total_cop - $s->paid_amount_cop),
                        'total_debt_usd' => (float) $sales->sum(fn($s) => $s->total_usd - $s->paid_amount_usd),
                        'sale_count' => $sales->count(),
                    ];
                })->values()
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
