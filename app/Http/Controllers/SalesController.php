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
            'exchangeRates' => ExchangeRate::all()->pluck('rate', 'currency_code'),
            'pendingOrders' => Sale::with(['customer', 'items.product'])
                ->where('status', 'order_pending')
                ->latest()
                ->get()
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

        // 2. Verificar si la deuda se ha saldado (Lógica multi-moneda)
        // Calculamos el equivalente total pagado en USD usando las tasas de la venta
        $totalPaidUSD = $sale->paid_amount_usd +
            ($sale->paid_amount_cop / ($sale->exchange_rate_cop ?: 1)) +
            ($sale->paid_amount_ves / ($sale->exchange_rate_ves ?: 1));

        // Consideramos saldada si el pago equivalente es >= al total en USD (con margen de 0.01 USD)
        if ($totalPaidUSD >= ($sale->total_usd - 0.01)) {
            $sale->status = 'completed';
            
            // Para consistencia visual, si está saldada, aseguramos que los campos reflejen el total
            // Esto evita que en el resumen financiero siga apareciendo una micro-deuda por decimales
            $sale->paid_amount_cop = $sale->total_cop;
            $sale->paid_amount_usd = $sale->total_usd;
            $sale->paid_amount_ves = $sale->total_ves;
        }

        $sale->save();

        $sale->payments()->create([
            'amount' => $amount,
            'currency' => $currency,
            'exchange_rate' => ($currency === 'COP') ? $sale->exchange_rate_cop : (($currency === 'VES') ? $sale->exchange_rate_ves : 1),
        ]);

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

            // Calcular el equivalente total pagado en USD actualmente
            $currentPaidUSD = $sale->paid_amount_usd +
                ($sale->paid_amount_cop / ($sale->exchange_rate_cop ?: 1)) +
                ($sale->paid_amount_ves / ($sale->exchange_rate_ves ?: 1));

            $debtUSD = $sale->total_usd - $currentPaidUSD;

            if ($debtUSD <= 0.01) {
                continue; // Ya está saldada
            }

            // Convertimos la deuda USD a la moneda del pago actual
            // Usamos la tasa de la venta para mantener consistencia con los totales guardados
            $rate = ($currency === 'COP') ? $sale->exchange_rate_cop : 
                    (($currency === 'VES') ? $sale->exchange_rate_ves : 1);
            
            $debtInPaymentCurrency = $debtUSD * $rate;

            if ($remainingAmount >= ($debtInPaymentCurrency - 0.01)) {
                // Pagar completamente esta deuda
                $paidField = 'paid_amount_' . strtolower($currency);
                $sale->$paidField += ($currency === 'COP') ? round($debtInPaymentCurrency) : $debtInPaymentCurrency;
                $remainingAmount -= $debtInPaymentCurrency;

                $sale->status = 'completed';
                // Sincronizamos totales para evitar residuos decimales
                $sale->paid_amount_cop = $sale->total_cop;
                $sale->paid_amount_usd = $sale->total_usd;
                $sale->paid_amount_ves = $sale->total_ves;
                $salesPaid++;
            } else {
                // Pago parcial
                $paidField = 'paid_amount_' . strtolower($currency);
                $sale->$paidField += $remainingAmount;
                $remainingAmount = 0;
                $salesPartiallyPaid++;
            }

            // Registrar en el historial de pagos (Calculamos el delta pagado en este paso)
            $sale->payments()->create([
                'amount' => $sale->$paidField - $sale->getOriginal($paidField),
                'currency' => $currency,
                'exchange_rate' => $rate,
            ]);

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
            'order_id' => 'nullable|exists:sales,id',
        ]);

        return DB::transaction(function () use ($validated) {
            // Si viene de un pedido online, lo eliminamos para que no quede duplicado
            if (!empty($validated['order_id'])) {
                Sale::where('id', $validated['order_id'])->delete();
            }

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

            // Registrar pagos iniciales si los hay
            if ($sale->paid_amount_usd > 0) {
                $sale->payments()->create([
                    'amount' => $sale->paid_amount_usd,
                    'currency' => 'USD',
                    'exchange_rate' => 1,
                ]);
            }
            if ($sale->paid_amount_cop > 0) {
                $sale->payments()->create([
                    'amount' => $sale->paid_amount_cop,
                    'currency' => 'COP',
                    'exchange_rate' => $sale->exchange_rate_cop,
                ]);
            }
            if ($sale->paid_amount_ves > 0) {
                $sale->payments()->create([
                    'amount' => $sale->paid_amount_ves,
                    'currency' => 'VES',
                    'exchange_rate' => $sale->exchange_rate_ves,
                ]);
            }

            return redirect()->back()->with('success', 'Venta procesada correctamente.');
        });
    }

    public function rejectOrder(Sale $sale)
    {
        if ($sale->status !== 'order_pending') {
            return back()->with('error', 'Solo se pueden rechazar pedidos pendientes.');
        }

        $sale->items()->delete();
        $sale->delete();

        return back()->with('success', 'Pedido rechazado y eliminado.');
    }
}
