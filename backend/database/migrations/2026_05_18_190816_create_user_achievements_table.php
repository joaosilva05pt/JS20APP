<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_achievements', function (Blueprint $table) {

            $table->id();

            // Jogador
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Equipa associada
            $table->foreignId('team_id')
                ->nullable()
                ->constrained('teams')
                ->nullOnDelete();

            // Título conquista
            $table->string('titulo', 100);

            // Época
            $table->string('epoca', 10)
                ->nullable();

            // Descrição
            $table->text('descricao')
                ->nullable();

            // Categoria
            $table->string('categoria', 30)
                ->default('Estatística');

            // Tipo prémio
            $table->string('tipo', 30)
                ->default('Trofeu');

            // Raridade
            $table->string('raridade', 30)
                ->default('Bronze');

            // Ícone
            $table->string('icone_url')
                ->nullable();

            // Data conquista
            $table->timestamp('data_conquista')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('user_achievements');
    }
};