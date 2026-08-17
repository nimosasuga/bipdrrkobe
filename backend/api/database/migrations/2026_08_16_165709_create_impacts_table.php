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
        Schema::create('impacts', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->uuid('diagnosis_id');
    $table->foreign('diagnosis_id')
        ->references('id')
        ->on('diagnoses')
        ->cascadeOnDelete();

    $table->double('downtime_hours_month')->default(0);
    $table->double('charging_waste_hours')->default(0);
    $table->integer('maintenance_count_year')->default(0);
    $table->double('productivity_loss_percent')->default(0);

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('impacts');
    }
};
