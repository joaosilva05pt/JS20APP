<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {

            $table->id();

            // Evento
            $table->foreignId('event_id')
                ->constrained('events')
                ->cascadeOnDelete();

            // Utilizador
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Estado presença
            $table->string('estado', 30)
                ->default('Ausente');

            // Minutos atraso
            $table->integer('minutos_atraso')
                ->default(0);

            // Validado pelo staff
            $table->boolean('validado_por_staff')
                ->default(false);

            // Registo
            $table->timestamp('registado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();

            // Não duplicar presença
            $table->unique(['event_id', 'user_id']);
        });}

    public function down(): void
    {Schema::dropIfExists('attendance');
    }
};