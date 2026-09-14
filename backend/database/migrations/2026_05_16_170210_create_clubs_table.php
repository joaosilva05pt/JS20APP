<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clubs', function (Blueprint $table) {
            $table->id();

            // Identidade da Instituição
            $table->string('nome', 100)->unique();
            $table->string('sigla', 10)->nullable(); // (Ex: FCP, SCP, SLB)
            $table->string('emblema_url')->nullable();

            // Quem criou o clube
            $table->foreignId('criador_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Contactos Institucionais
            $table->string('email_clube', 100)->nullable(); 
            $table->string('contacto_oficial', 30)->nullable(); 

            // Localização
            $table->string('pais', 100);
            $table->string('localidade', 100)->nullable();

            // Histórico
            $table->date('data_fundacao')->nullable();

            // Laravel timestamps (Cria automaticamente created_at e updated_at, removido o criado_em)
            $table->timestamps();

            // Soft delete
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clubs');
    }
};