<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_missions', function (Blueprint $table) {

            $table->id();

            // Utilizador
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Missão
            $table->foreignId('mission_id')
                ->constrained('missions')
                ->cascadeOnDelete();

            // Estado missão
            $table->string('estado', 30)
                ->default('Em_Progresso');

            // Progresso atual
            $table->integer('progresso_atual')
                ->default(0);

            // Objetivo final
            $table->integer('objetivo_final')
                ->default(1);

            // Data conclusão
            $table->timestamp('data_conclusao')
                ->nullable();

            // Evita duplicados
            $table->unique([
                'user_id',
                'mission_id'
            ]);

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('user_missions');
    }
};