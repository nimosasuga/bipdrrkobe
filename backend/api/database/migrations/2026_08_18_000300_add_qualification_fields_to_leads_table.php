<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('qualification_status')->default('pending')->after('lead_score');
            $table->string('qualification_version')->nullable()->after('qualification_status');
            $table->text('qualification_reason')->nullable()->after('qualification_version');
            $table->timestamp('qualified_at')->nullable()->after('qualification_reason');
            $table->text('qualification_error')->nullable()->after('qualified_at');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'qualification_status',
                'qualification_version',
                'qualification_reason',
                'qualified_at',
                'qualification_error',
            ]);
        });
    }
};
