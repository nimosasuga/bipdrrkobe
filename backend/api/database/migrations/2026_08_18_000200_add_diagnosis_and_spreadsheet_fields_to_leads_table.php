<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignUuid('diagnosis_id')
                ->nullable()
                ->unique()
                ->after('id')
                ->constrained('diagnoses')
                ->nullOnDelete();

            $table->string('source', 50)->default('bip')->after('status');
            $table->string('spreadsheet_sync_status', 20)->default('pending')->after('source');
            $table->timestampTz('spreadsheet_synced_at')->nullable()->after('spreadsheet_sync_status');
            $table->text('spreadsheet_sync_error')->nullable()->after('spreadsheet_synced_at');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['diagnosis_id']);
            $table->dropUnique(['diagnosis_id']);
            $table->dropColumn([
                'diagnosis_id',
                'source',
                'spreadsheet_sync_status',
                'spreadsheet_synced_at',
                'spreadsheet_sync_error',
            ]);
        });
    }
};
