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
                ->take(3)
                ->get(),
            'top_customers' => Customer::select(
                    'customers.id',
                    'customers.name',
                    DB::raw('COUNT(sales.id) as total_orders'),
                    DB::raw('SUM(sales.total_usd) as total_spent_usd'),
                    DB::raw('SUM(sales.total_cop) as total_spent_cop'),
                    DB::raw('SUM(sales.total_ves) as total_spent_ves')
                )
                ->join('sales', 'customers.id', '=', 'sales.customer_id')
                ->groupBy('customers.id', 'customers.name')
                ->orderByDesc('total_spent_cop')
                ->take(3)
                ->get()
                ->map(function ($customer) use ($exchange_rates) {
                    if ($customer->total_spent_cop == 0 && $customer->total_spent_usd > 0) {
                        $customer->total_spent_cop = $customer->total_spent_usd * ($exchange_rates['COP'] ?? 0);
                    }
                    if ($customer->total_spent_ves == 0 && $customer->total_spent_usd > 0) {
                        $customer->total_spent_ves = $customer->total_spent_usd * ($exchange_rates['VES'] ?? 0);
                    }
                    return $customer;
                }),
            'exchange_rates' => $exchange_rates,
            'notes' => \App\Models\Note::with('user')
                ->orderBy('is_pinned', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
        ]);
    }
}
