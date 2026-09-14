<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            
            // Identidade do Utilizador
            $table->string('nome', 50);
            $table->string('apelido', 50);
            $table->string('email', 100)->unique();
            $table->date('data_nascimento')->nullable();
            
            // Género obrigatório diretamente na tabela principal
            $table->string('genero', 20); 

            $table->string('foto_perfil', 255)->nullable()->after('genero');
            $table->string('telemovel', 20)->nullable()->after('foto_perfil');
            
            // Localização
            $table->string('pais', 50)->nullable();
            $table->string('localidade', 100)->nullable();

            // Segurança
            $table->string('password');

            // Profissão/Perfil base (Ex: Atleta, Treinador, Adepto)
            $table->string('profissao_base', 50);

            // UX Flow
            $table->boolean('primeiro_login')->default(true);

            // Laravel Timestamps e SoftDeletes
            $table->timestamps();
            $table->softDeletes();

            $table->rememberToken();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};