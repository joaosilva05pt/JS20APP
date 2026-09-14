<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tactical_frames', function (Blueprint $table) {

            $table->id();

            // Jogada tática
            $table->foreignId('play_id')
                ->constrained('tactical_plays')
                ->cascadeOnDelete();

            // Ordem frame
            $table->integer('ordem_frame');

            // Tipo pino
            $table->string('tipo_pino', 20);

            // Identificador
            $table->string('pino_identificador', 50);

            // Texto mostrado
            $table->string('label', 5)
                ->nullable();

            // Coordenadas
            $table->decimal('coord_x', 5, 2);

            $table->decimal('coord_y', 5, 2);

            // Nota ação
            $table->string('acao_nota', 100)
                ->nullable();

            // Evita duplicados
            $table->unique([
                'play_id',
                'ordem_frame',
                'pino_identificador'
            ]);

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('tactical_frames');
    }
};