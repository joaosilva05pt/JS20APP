<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_evaluations', function (Blueprint $table) {

            $table->id();

            // Jogador avaliado
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Treinador avaliador
            $table->foreignId('avaliador_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Evento (treino/jogo)
            $table->foreignId('evento_id')
                ->constrained('events')
                ->cascadeOnDelete();

            // Nota geral
            $table->decimal('nota_principal', 4, 2);

            // Atributos
            $table->decimal('nota_remate', 4, 2)
                ->default(0);

            $table->decimal('nota_passe', 4, 2)
                ->default(0);

            $table->decimal('nota_velocidade', 4, 2)
                ->default(0);

            $table->decimal('nota_tecnica', 4, 2)
                ->default(0);

            $table->decimal('nota_defesa', 4, 2)
                ->default(0);

            $table->decimal('nota_mental', 4, 2)
                ->default(0);

            // Feedback
            $table->text('pontos_positivos')
                ->nullable();

            $table->text('pontos_negativos')
                ->nullable();

            $table->text('observacoes_privadas')
                ->nullable();

            // Data avaliação
            $table->timestamp('data_avaliacao')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft delete
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('player_evaluations');
    }
};