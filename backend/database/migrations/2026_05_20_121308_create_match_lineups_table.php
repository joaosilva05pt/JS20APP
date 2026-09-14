<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_lineups', function (Blueprint $table) {

            $table->id();

            // Evento/Jogo
            $table->foreignId('event_id')
                ->constrained('events')
                ->cascadeOnDelete();

            // Equipa
            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();

            // Sistema tático
            $table->string('sistema_tatico', 10)
                ->default('4-3-3');

            // Instruções
            $table->text('instrucoes_gerais')
                ->nullable();

            // Data criação
            $table->timestamp('criado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_lineups');
    }
};