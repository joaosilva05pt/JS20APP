<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_records', function (Blueprint $table) {

            $table->id();

            // Jogador lesionado
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Médico/Fisioterapeuta
            $table->foreignId('registado_por_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Lesão
            $table->string('tipo_lesao', 100);

            // Gravidade
            $table->string('gravidade', 20)
                ->default('Leve');

            // Estado prontidão
            $table->string('estado_prontidao', 20)
                ->default('Inapto');

            // Datas
            $table->date('data_inicio');

            $table->date('data_regresso_prevista')
                ->nullable();

            // Notas médicas
            $table->text('notas_tratamento')
                ->nullable();

            // Privacidade
            $table->boolean('privado')
                ->default(true);

            // Atualização
            $table->timestamp('atualizado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('medical_records');
    }
};