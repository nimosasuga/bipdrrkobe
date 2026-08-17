<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('funnel_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_key')->unique();
            $table->string('session_id', 100)->index();
            $table->uuid('diagnosis_id')->nullable()->index();
            $table->uuid('lead_id')->nullable()->index();
            $table->string('event', 60)->index();
            $table->string('source', 50)->default('bip')->index();
            $table->jsonb('metadata_json')->nullable();
            $table->timestamps();

            $table->foreign('diagnosis_id')
                ->references('id')
                ->on('diagnoses')
                ->nullOnDelete();

            $table->foreign('lead_id')
                ->references('id')
                ->on('leads')
                ->nullOnDelete();

            $table->index(['event', 'created_at']);
            $table->index(['session_id', 'event']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('funnel_events');
    }
};
