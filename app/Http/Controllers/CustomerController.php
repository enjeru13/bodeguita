<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use Inertia\Inertia;
use Illuminate\Validation\Rule; // Usar Rule es más limpio para validaciones únicas

class CustomerController extends Controller
{
    public function index()
    {
        return Inertia::render('customers/index', [
            // Ordenamos por último creado para ver los nuevos arriba
            'customers' => Customer::latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            // Al poner nullable, si el frontend no envía el dato, no pasa nada.
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            // El documento es opcional, pero si lo escriben, no puede estar repetido
            'identity_document' => 'nullable|string|unique:customers,identity_document',
        ]);

        Customer::create($validated);

        return redirect()->back()->with('success', 'Cliente registrado correctamente.');
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            // Validamos que sea único, pero ignorando al cliente actual (para que no de error si no cambia su propia cédula)
            'identity_document' => [
                'nullable',
                'string',
                Rule::unique('customers', 'identity_document')->ignore($customer->id),
            ],
        ]);

        $customer->update($validated);

        return redirect()->back()->with('success', 'Cliente actualizado correctamente.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return redirect()->back()->with('success', 'Cliente eliminado correctamente.');
    }
}
