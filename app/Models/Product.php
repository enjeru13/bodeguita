<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    // Asegúrate de que cost_price esté aquí y NO purchase_price
    protected $fillable = [
        'name',
        'description',
        'sku',
        'cost_price', // <--- Nombre real en la BD
        'selling_price',
        'stock',
    ];

    // Esto hace que cuando consultes el producto, incluya el campo 'purchase_price' virtualmente
    protected $appends = ['purchase_price'];

    // Este es el "Accessor" que crea el campo virtual
    public function getPurchasePriceAttribute()
    {
        return $this->attributes['cost_price'];
    }
}
