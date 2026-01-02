<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            // Cambiamos de (8,2) o (10,2) a (20,6) para soportar micro-centavos de dólar
            // cost_price es tu nueva columna, selling_price la de venta
            $table->decimal('cost_price', 20, 6)->change();
            $table->decimal('selling_price', 20, 6)->change();
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('cost_price', 10, 2)->change();
            $table->decimal('selling_price', 10, 2)->change();
        });
    }
};