<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Cambiamos de (15, 2) a (20, 6) para guardar micro-centavos de dólar
            $table->decimal('purchase_price', 20, 6)->change();
            $table->decimal('selling_price', 20, 6)->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Revertir a 2 decimales (causaría pérdida de datos de precisión)
            $table->decimal('purchase_price', 15, 2)->change();
            $table->decimal('selling_price', 15, 2)->change();
        });
    }
};
