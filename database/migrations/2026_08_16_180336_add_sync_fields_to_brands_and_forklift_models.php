<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->string('source')->default('manual');
            $table->string('source_ref')->nullable()->unique();
            $table->timestamp('source_updated_at')->nullable();
        });

        Schema::table('forklift_models', function (Blueprint $table) {
            $table->string('source')->default('manual');
            $table->string('source_ref')->nullable()->unique();
            $table->timestamp('source_updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('forklift_models', function (Blueprint $table) {
            $table->dropColumn([
                'source',
                'source_ref',
                'source_updated_at',
            ]);
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->dropColumn([
                'source',
                'source_ref',
                'source_updated_at',
            ]);
        });
    }
};
