<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_team_visits', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->foreignId('team_id')->constrained()->onDelete('cascade');
        $table->timestamp('last_visited_at')->useCurrent()->useCurrentOnUpdate();
        
        // Garante que só há uma linha por par (utilizador, equipa)
        $table->unique(['user_id', 'team_id']);
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_team_visits');
    }
};
