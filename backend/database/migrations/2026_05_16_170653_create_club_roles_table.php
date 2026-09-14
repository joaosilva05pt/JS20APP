<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_roles', function (Blueprint $table) {

            $table->id();

            // Clube
            $table->foreignId('club_id')
                ->constrained('clubs')
                ->cascadeOnDelete();

            // Utilizador
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Cargo
            $table->string('cargo', 50);

            // Mandato
            $table->date('data_inicio')
                ->default(DB::raw('CURRENT_DATE'));

            $table->date('data_fim')
                ->nullable();

            // Ativo
            $table->boolean('ativo')
                ->default(true);

            // Data criação
            $table->timestamp('criado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });

        // Índice único:
        // Só pode existir 1 Presidente ativo por clube

        DB::statement("
            CREATE UNIQUE INDEX idx_unico_presidente_ativo
            ON club_roles (club_id)
            WHERE cargo = 'Presidente'
            AND ativo = TRUE
        ");
    }

    public function down(): void
    {
        DB::statement("
            DROP INDEX IF EXISTS idx_unico_presidente_ativo
        ");

        Schema::dropIfExists('club_roles');
    }
};