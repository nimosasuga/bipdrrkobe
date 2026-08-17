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
        Schema::create('diagnoses', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('session_id')->index();

    $table->uuid('model_id');
    $table->foreign('model_id')
        ->references('id')
        ->on('forklift_models')
        ->cascadeOnDelete();

    $table->string('battery_type');
    $table->integer('umur_battery');
    $table->integer('shift');
    $table->integer('jam_operasi');

    $table->jsonb('answers_json');

    $table->integer('health_score');
    $table->jsonb('causes_json')->nullable();
    $table->integer('confidence')->nullable();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('diagnoses');
    }
};
