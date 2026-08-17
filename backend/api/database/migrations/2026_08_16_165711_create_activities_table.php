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
        Schema::create('activities', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->uuid('lead_id')->nullable();
    $table->foreign('lead_id')
        ->references('id')
        ->on('leads')
        ->nullOnDelete();

    $table->string('event');
    $table->jsonb('metadata_json')->nullable();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
