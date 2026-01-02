<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('products', function (Blueprint $table) {
        // Eliminamos la columna vieja que causa el conflicto
        $table->dropColumn('purchase_price');
    });
}

public function down()
{
    Schema::table('products', function (Blueprint $table) {
        // En caso de revertir, la volvemos a crear
        $table->decimal('purchase_price', 10, 2)->nullable();
    });
}
};
