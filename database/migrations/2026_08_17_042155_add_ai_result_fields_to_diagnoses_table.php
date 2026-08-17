<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diagnoses', function (Blueprint $table) {
            $table->text('ai_summary')->nullable();

            $table->jsonb('ai_probable_causes')->nullable();
            $table->jsonb('ai_technical_findings')->nullable();
            $table->jsonb('ai_recommended_actions')->nullable();
            $table->jsonb('ai_limitations')->nullable();

            $table->string('ai_urgency')->nullable();
            $table->integer('ai_confidence')->nullable();

            $table->timestamp('ai_analyzed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('diagnoses', function (Blueprint $table) {
            $table->dropColumn([
                'ai_summary',
                'ai_probable_causes',
                'ai_technical_findings',
                'ai_recommended_actions',
                'ai_limitations',
                'ai_urgency',
                'ai_confidence',
                'ai_analyzed_at',
            ]);
        });
    }
};
