<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('levels_config', function (Blueprint $table) {

            $table->id();

            // Número nível
            $table->integer('nivel_numero')
                ->unique();

            // Nome nível
            $table->string('titulo_nivel', 50);

            // XP necessário
            $table->integer('pontos_necessarios');

            // Descrição/recompensa
            $table->string('descricao_recompensa', 255)
                ->nullable();

            // Data criação
            $table->timestamp('criado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('levels_config');
    }
};