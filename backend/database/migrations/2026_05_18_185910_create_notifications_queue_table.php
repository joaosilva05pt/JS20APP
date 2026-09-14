<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications_queue', function (Blueprint $table) {

            $table->id();

            // Utilizador destino
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Conteúdo
            $table->string('titulo', 100);

            $table->text('mensagem');

            // Categoria
            $table->string('categoria', 30);

            // Estado
            $table->boolean('lida')
                ->default(false);

            $table->boolean('enviada')
                ->default(false);

            // Agendamento
            $table->timestamp('data_agendada')
                ->useCurrent();

            // Deep link
            $table->string('link_destino', 100)
                ->nullable();

            // Criado em
            $table->timestamp('criado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('notifications_queue');
    }
};