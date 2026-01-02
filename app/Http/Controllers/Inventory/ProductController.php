<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ExchangeRate; // Importamos el modelo de tasas
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('inventory/index', [
            // Usamos latest() para traer los últimos creados primero
            'products' => Product::latest()->get(),

            // Pasamos las tasas para que el frontend haga los cálculos en tiempo real
            'exchangeRates' => ExchangeRate::all()->pluck('rate', 'currency_code')
        ]);
    }

    public function store(Request $request)
    {
        // 1. Validamos usando los nombres que vienen del formulario (React)
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'nullable|string|unique:products,sku',
            'purchase_price' => 'required|numeric|min:0', // El front envía 'purchase_price'
            'selling_price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        // 2. Mapeamos manual para guardar en la BD como 'cost_price'
        Product::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'sku' => $validated['sku'],
            'stock' => $validated['stock'],
            'selling_price' => $validated['selling_price'],

            // AQUÍ ESTÁ EL TRUCO: Guardamos el 'purchase_price' del input en 'cost_price' de la DB
            'cost_price' => $validated['purchase_price'],
        ]);

        return redirect()->back()->with('success', 'Producto creado correctamente.');
    }

    public function update(Request $request, Product $inventory)
    {
        // Nota: Laravel inyecta el modelo en $inventory basado en la ruta {inventory}

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            // Excluimos el ID actual para que no de error de "SKU ya existe" al editar el mismo producto
            'sku' => 'nullable|string|unique:products,sku,' . $inventory->id,
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        // 3. Actualizamos mapeando manualmente
        $inventory->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'sku' => $validated['sku'],
            'stock' => $validated['stock'],
            'selling_price' => $validated['selling_price'],
            'cost_price' => $validated['purchase_price'], // Mapeo
        ]);

        return redirect()->back()->with('success', 'Producto actualizado correctamente.');
    }

    public function destroy(Product $inventory)
    {
        $inventory->delete();

        return redirect()->back()->with('success', 'Producto eliminado correctamente.');
    }
}
