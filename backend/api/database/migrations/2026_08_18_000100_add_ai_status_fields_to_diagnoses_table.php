<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diagnoses', function (Blueprint $table) {
            $table->string('ai_status', 20)->default('pending')->index();
            $table->unsignedSmallInteger('ai_attempts')->default(0);
            $table->text('ai_error')->nullable();
            $table->timestampTz('ai_last_attempt_at')->nullable();
        });

        DB::table('diagnoses')
            ->whereNotNull('ai_analyzed_at')
            ->update([
                'ai_status' => 'completed',
                'ai_attempts' => 1,
                'ai_last_attempt_at' => DB::raw('ai_analyzed_at'),
            ]);
    }

    public function down(): void
    {
        Schema::table('diagnoses', function (Blueprint $table) {
            $table->dropIndex(['ai_status']);
            $table->dropColumn([
                'ai_status',
                'ai_attempts',
                'ai_error',
                'ai_last_attempt_at',
            ]);
        });
    }
};
