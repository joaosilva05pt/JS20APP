<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_modules', function (Blueprint $table) {

            $table->id();

            // Equipa
            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();

            // Módulo
            $table->foreignId('module_id')
                ->constrained('modules')
                ->cascadeOnDelete();

            // Ativo/inativo
            $table->boolean('ativo')
                ->default(true);

            // Última atualização
            $table->timestamp('atualizado_em')
                ->useCurrent();

            // Evita duplicados
            $table->unique([
                'team_id',
                'module_id'
            ]);

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_modules');
    }
};