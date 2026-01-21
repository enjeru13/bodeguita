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

    public function addPayment(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|in:COP,USD,VES',
        ]);

        $amount = $validated['amount'];
        $currency = $validated['currency'];

        // 1. Actualizar el monto pagado según la moneda
        if ($currency === 'COP') {
            $sale->paid_amount_cop += $amount;
        } elseif ($currency === 'USD') {
            $sale->paid_amount_usd += $amount;
        } elseif ($currency === 'VES') {
            $sale->paid_amount_ves += $amount;
        }

        // 2. Verificar si la deuda se ha saldado
        // Usamos una pequeña tolerancia para evitar problemas de decimales
        $isPaidCOP = $sale->paid_amount_cop >= ($sale->total_cop - 50);
        $isPaidUSD = $sale->paid_amount_usd >= ($sale->total_usd - 0.1);

        if ($isPaidCOP || $isPaidUSD) {
            // Cambiamos el estado a 'completed' para que salga de la lista de pendientes
            $sale->status = 'completed';
        }

        $sale->save();

        return redirect()->back()->with('success', 'Abono registrado correctamente.');
    }

    public function payCustomerDebt(Request $request, $customerId)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|in:COP,USD,VES',
        ]);

        $amount = $validated['amount'];
        $currency = $validated['currency'];

        // Obtener todas las ventas pendientes del cliente, ordenadas por fecha (más antiguas primero)
        $pendingSales = Sale::where('customer_id', $customerId)
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();

        if ($pendingSales->isEmpty()) {
            return redirect()->back()->with('error', 'No hay ventas pendientes para este cliente.');
        }

        $remainingAmount = $amount;
        $salesPaid = 0;
        $salesPartiallyPaid = 0;

        // Algoritmo de distribución inteligente
        foreach ($pendingSales as $sale) {
            if ($remainingAmount <= 0) {
                break;
            }

            // Calcular la deuda restante según la moneda
            $totalField = 'total_' . strtolower($currency);
            $paidField = 'paid_amount_' . strtolower($currency);

            $debt = $sale->$totalField - $sale->$paidField;

            if ($debt <= 0) {
                continue; // Esta venta ya está pagada en esta moneda
            }

            if ($remainingAmount >= $debt) {
                // Pagar completamente esta venta
                $sale->$paidField += $debt;
                $remainingAmount -= $debt;

                // Verificar si está completamente pagada en todas las monedas
                $isPaidCOP = $sale->paid_amount_cop >= ($sale->total_cop - 50);
                $isPaidUSD = $sale->paid_amount_usd >= ($sale->total_usd - 0.1);
                $isPaidVES = $sale->paid_amount_ves >= ($sale->total_ves - 50);

                if ($isPaidCOP || $isPaidUSD || $isPaidVES) {
                    $sale->status = 'completed';
                    $salesPaid++;
                }
            } else {
                // Pago parcial
                $sale->$paidField += $remainingAmount;
                $remainingAmount = 0;
                $salesPartiallyPaid++;
            }

            $sale->save();
        }

        // Mensaje de éxito personalizado
        $message = "Pago procesado correctamente. ";
        if ($salesPaid > 0) {
            $message .= "$salesPaid venta(s) saldada(s) completamente. ";
        }
        if ($salesPartiallyPaid > 0) {
            $message .= "$salesPartiallyPaid venta(s) abonada(s) parcialmente.";
        }

        return redirect()->back()->with('success', $message);
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
