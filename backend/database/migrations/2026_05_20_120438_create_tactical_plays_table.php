<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tactical_plays', function (Blueprint $table) {

            $table->id();

            // Equipa
            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();

            // Criador
            $table->foreignId('criador_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Conteúdo
            $table->string('titulo', 100);

            $table->text('descricao')
                ->nullable();

            // Categoria
            $table->string('categoria', 30)
                ->default('Ataque');

            // Estado publicação
            $table->string('estado', 30)
                ->default('Publicada');

            // Data criação
            $table->timestamp('criado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('tactical_plays');
    }
};