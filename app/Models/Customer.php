<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'identity_document',
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
