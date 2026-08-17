<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('battery_specs', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('brand_id')->nullable();
            $table->uuid('forklift_model_id')->nullable();

            $table->string('battery_code')->nullable();
            $table->string('battery_type');
            $table->integer('voltage')->nullable();
            $table->integer('capacity_ah')->nullable();
            $table->integer('cell_count')->nullable();

            $table->decimal('recommended_charge_hours', 5, 2)->nullable();

            $table->string('connector_type')->nullable();
            $table->text('notes')->nullable();

            // Untuk sinkronisasi Spreadsheet/n8n
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

            $table->index(['brand_id', 'forklift_model_id']);
            $table->index(['battery_type', 'voltage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('battery_specs');
    }
};
