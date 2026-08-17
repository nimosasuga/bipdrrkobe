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
        Schema::create('leads', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->string('nama');
    $table->string('perusahaan');
    $table->string('kota');
    $table->string('whatsapp');

    $table->integer('jumlah_forklift')->default(1);
    $table->string('model');
    $table->string('battery_type');
    $table->text('masalah_text')->nullable();
    $table->integer('jam_operasional')->nullable();

    $table->integer('health_score')->nullable();

    $table->string('lead_score')->default('cold');
    $table->text('ai_summary')->nullable();

    $table->string('session_id')->index();

    $table->string('status')->default('new');

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
