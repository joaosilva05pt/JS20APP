<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();

            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();

            $table->string('titulo', 100);

            $table->text('descricao')->nullable();

            $table->enum('tipo', ['Treino', 'Jogo', 'Estagio', 'Reuniao'])
                ->default('Treino');

            $table->enum('tipo_jogo', ['Oficial', 'Amigavel', 'Nao_Aplicavel'])
                ->default('Nao_Aplicavel');

            $table->timestamp('data_inicio');

            $table->timestamp('data_fim');

            $table->string('localizacao')->nullable();

            $table->string('foco_tecnico', 100)->nullable();

            //COLUNA DE CONTROLO DO EVENTO
            $table->boolean('terminado')->default(false);

            $table->timestamp('criado_em')->useCurrent();

            $table->timestamps();

            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};