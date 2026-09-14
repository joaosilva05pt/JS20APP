<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lineup_players', function (Blueprint $table) {

            $table->id();

            // Lineup
            $table->foreignId('lineup_id')
                ->constrained('match_lineups')
                ->cascadeOnDelete();

            // Jogador
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Posição
            $table->string('posicao_sigla', 5)
                ->nullable();

            // Coordenadas
            $table->decimal('pos_x', 5, 2)
                ->nullable();

            $table->decimal('pos_y', 5, 2)
                ->nullable();

            // Estatuto
            $table->string('estatuto', 20)
                ->default('Titular');

            // Evita jogador duplicado na lineup
            $table->unique([
                'lineup_id',
                'user_id'
            ]);

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('lineup_players');
    }
};