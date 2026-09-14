<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_user_roles', function (Blueprint $table) {

            $table->id();

            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('cargo', [
                'Treinador',
                'Treinador_Adjunto',
                'Departamento_Medico',
                'Nutricionista',
                'Staff_Equipa',
                'Jogador'
            ]);

            $table->integer('numero_camisola')->nullable();

            $table->timestamp('criado_em')->useCurrent();

            $table->timestamps();

            $table->softDeletes();

            $table->unique(['team_id', 'user_id', 'cargo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_user_roles');
    }
};