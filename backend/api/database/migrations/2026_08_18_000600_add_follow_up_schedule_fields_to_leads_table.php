<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->timestamp('last_follow_up_at')->nullable()->index();
            $table->timestamp('next_follow_up_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->dropIndex(['last_follow_up_at']);
            $table->dropIndex(['next_follow_up_at']);
            $table->dropColumn(['last_follow_up_at', 'next_follow_up_at']);
        });
    }
};
