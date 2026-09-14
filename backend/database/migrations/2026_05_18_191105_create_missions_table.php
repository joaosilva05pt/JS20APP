<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {

            $table->id();

            // Nome missão
            $table->string('titulo', 100);

            // Descrição
            $table->text('descricao')
                ->nullable();

            // Tipo
            $table->string('tipo', 20)
                ->default('Clube');

            // Categoria
            $table->string('categoria', 30);

            // XP recompensa
            $table->integer('pontos_recompensa')
                ->default(50);

            // Repetível
            $table->boolean('repetivel')
                ->default(false);

            // Criado em
            $table->timestamp('criado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('missions');
    }
};