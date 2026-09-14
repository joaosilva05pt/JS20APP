<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_points_log', function (Blueprint $table) {

            $table->id();

            // Utilizador
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Pontos ganhos/perdidos
            $table->integer('pontos');

            // Motivo
            $table->string('motivo', 255)
                ->nullable();

            // Sistema polimórfico
            $table->unsignedBigInteger('referencia_id')
                ->nullable();

            $table->string('referencia_tipo', 30)
                ->nullable();

            // Data registo
            $table->timestamp('data_ganho')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('user_points_log');
    }
};