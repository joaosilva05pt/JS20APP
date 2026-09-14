<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {

            $table->id();

            // Clube da equipa
            $table->foreignId('club_id')
                ->constrained('clubs')
                ->cascadeOnDelete();

            // Quem criou a equipa
            $table->foreignId('criada_por_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Escalão
            $table->string('escalao', 20);

            // Género
            $table->string('genero', 20);

            // Época
            $table->string('epoca_desportiva', 10)
                ->default('2025/2026');

            // Arquivada
            $table->boolean('arquivada')
                ->default(false);

            // Data criação personalizada
            $table->timestamp('criado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};