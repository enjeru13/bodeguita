<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('paid_amount_usd', 15, 2)->default(0)->after('total_cop');
            $table->decimal('paid_amount_ves', 15, 4)->default(0)->after('paid_amount_usd');
            $table->decimal('paid_amount_cop', 15, 4)->default(0)->after('paid_amount_ves');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['paid_amount_usd', 'paid_amount_ves', 'paid_amount_cop']);
        });
    }
};
