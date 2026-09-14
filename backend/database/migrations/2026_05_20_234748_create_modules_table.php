<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {

            $table->id();

            // Nome visual
            $table->string('nome', 100)
                ->unique();

            // Slug sistema
            $table->string('slug', 50)
                ->unique();

            // Descrição
            $table->text('descricao')
                ->nullable();

            // Data criação
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
        Schema::dropIfExists('modules');
    }
};