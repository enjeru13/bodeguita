<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('total_usd', 20, 6)->change();
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('price_usd', 20, 6)->change();
            $table->decimal('subtotal_usd', 20, 6)->change();
        });
    }

    public function down()
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('total_usd', 15, 2)->change();
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('price_usd', 15, 2)->change();
            $table->decimal('subtotal_usd', 15, 2)->change();
        });
    }
};
