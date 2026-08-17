<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charger_specs', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('brand_id')->nullable();
            $table->uuid('forklift_model_id')->nullable();

            $table->string('charger_code')->nullable();
            $table->string('charger_type')->nullable();

            $table->integer('input_voltage')->nullable();
            $table->integer('output_voltage')->nullable();
            $table->decimal('output_current_a', 8, 2)->nullable();

            $table->string('compatible_battery_type')->nullable();

            $table->text('notes')->nullable();

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

            $table->index(['brand_id', 'forklift_model_id']);
            $table->index('output_voltage');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charger_specs');
    }
};
