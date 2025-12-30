<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\ExchangeRate;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->startOfDay();

        $today_sales_usd = (float) Sale::where('created_at', '>=', $today)->sum('total_usd');
        $today_sales_cop = (float) Sale::where('created_at', '>=', $today)->sum('total_cop');
        $today_sales_ves = (float) Sale::where('created_at', '>=', $today)->sum('total_ves');
        $exchange_rates = ExchangeRate::all()->pluck('rate', 'currency_code');

        if ($today_sales_cop == 0 && $today_sales_usd > 0) {
            $today_sales_cop = $today_sales_usd * ($exchange_rates['COP'] ?? 0);
        }
        if ($today_sales_ves == 0 && $today_sales_usd > 0) {
            $today_sales_ves = $today_sales_usd * ($exchange_rates['VES'] ?? 0);
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'today_sales_usd' => $today_sales_usd,
                'today_sales_cop' => $today_sales_cop,
                'today_sales_ves' => $today_sales_ves,
                'today_sales_count' => Sale::where('created_at', '>=', $today)->count(),
                'total_products' => Product::count(),
                'low_stock_count' => Product::where('stock', '<', 10)->count(),
                'total_customers' => Customer::count(),
            ],
            'low_stock_products' => Product::where('stock', '<', 10)
                ->orderBy('stock', 'asc')
                ->take(5)
                ->get(),
            'recent_sales' => Sale::with('customer')
                ->latest()
                ->take(3)
                ->get()
                ->map(function ($sale) use ($exchange_rates) {
                    if ($sale->total_cop == 0 && $sale->total_usd > 0) {
                        $sale->total_cop = $sale->total_usd * ($exchange_rates['COP'] ?? 0);
                    }
                    if ($sale->total_ves == 0 && $sale->total_usd > 0) {
                        $sale->total_ves = $sale->total_usd * ($exchange_rates['VES'] ?? 0);
                    }
                    return $sale;
                }),
            'exchange_rates' => $exchange_rates
        ]);
    }
}
