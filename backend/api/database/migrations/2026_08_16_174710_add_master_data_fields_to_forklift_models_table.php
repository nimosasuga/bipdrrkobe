<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('forklift_models', function (Blueprint $table) {
    $table->uuid('brand_id')->nullable()->after('id');

    $table->string('model_code')->nullable();
    $table->string('category')->nullable();

    $table->integer('capacity_kg')->nullable();

    $table->integer('battery_voltage')->nullable();
    $table->integer('battery_capacity_ah')->nullable();

    $table->string('default_battery_type')->nullable();

    $table->text('notes')->nullable();

    $table->boolean('active')->default(true);

    $table->foreign('brand_id')
        ->references('id')
        ->on('brands')
        ->nullOnDelete();

    $table->index(['brand_id', 'model_code']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('forklift_models', function (Blueprint $table) {
    $table->dropForeign(['brand_id']);
    $table->dropIndex(['brand_id', 'model_code']);

    $table->dropColumn([
        'brand_id',
        'model_code',
        'category',
        'capacity_kg',
        'battery_voltage',
        'battery_capacity_ah',
        'default_battery_type',
        'notes',
        'active',
    ]);
});
    }
};
