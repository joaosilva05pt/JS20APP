<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {

            $table->id();

            // Equipa
            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();

            // Autor do post
            $table->foreignId('autor_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Evento associado (convocatória/jogo)
            $table->foreignId('event_id')
                ->nullable()
                ->constrained('events')
                ->nullOnDelete();

            // Conteúdo
            $table->string('titulo', 150);

            $table->text('conteudo');

            // Imagem
            $table->string('imagem_url')
                ->nullable();

            // Tipo post
            $table->string('tipo', 30)
                ->default('Noticia');

            // Data criação
            $table->timestamp('criado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('posts');
    }
};