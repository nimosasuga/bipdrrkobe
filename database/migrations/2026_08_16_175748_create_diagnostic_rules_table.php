<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // NULL = rule dapat berlaku secara global
            $table->uuid('brand_id')->nullable();
            $table->uuid('forklift_model_id')->nullable();

            $table->string('category');
            $table->string('symptom_key');

            $table->jsonb('conditions_json')->nullable();

            $table->string('probable_cause');
            $table->string('severity')->default('medium');

            $table->text('reason')->nullable();
            $table->text('recommended_action')->nullable();

            $table->integer('confidence_base')->default(50);
            $table->integer('priority')->default(100);

            // Untuk Spreadsheet/n8n
            $table->string('source')->default('manual');
            $table->string('source_ref')->nullable()->unique();
            $table->timestamp('source_updated_at')->nullable();

            $table->boolean('active')->default(true);

            $table->timestamps();

            $table->foreign('brand_id')
                ->references('id')
                ->on('brands')
                ->nullOnDelete();

            $table->foreign('forklift_model_id')
                ->references('id')
                ->on('forklift_models')
                ->nullOnDelete();

            $table->index(['category', 'symptom_key']);
            $table->index(['brand_id', 'forklift_model_id']);
            $table->index(['active', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_rules');
    }
};
