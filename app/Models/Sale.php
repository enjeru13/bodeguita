<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'customer_id',
        'total_usd',
        'total_ves',
        'total_cop',
        'paid_amount_usd',
        'paid_amount_ves',
        'paid_amount_cop',
        'exchange_rate_ves',
        'exchange_rate_cop',
        'status',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}
