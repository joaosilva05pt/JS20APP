<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_stats', function (Blueprint $table) {

            $table->id();

            // Jogador
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Evento/Jogo
            $table->foreignId('event_id')
                ->constrained('events')
                ->cascadeOnDelete();

            // Tipo jogo
            $table->string('tipo_jogo', 20)
                ->default('Oficial');

            // Estatísticas
            $table->integer('golos')
                ->default(0);

            $table->integer('assistencias')
                ->default(0);

            $table->integer('minutos_jogados')
                ->default(0);

            $table->integer('cartoes_amarelos')
                ->default(0);

            $table->integer('cartoes_vermelhos')
                ->default(0);

            // Mostrar dashboard
            $table->boolean('exibir_em_dashboard')
                ->default(true);

            // Data criação
            $table->timestamp('criado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('match_stats');
    }
};