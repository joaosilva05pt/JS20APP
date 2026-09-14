<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_comments', function (Blueprint $table) {

            $table->id();

            // Post associado
            $table->foreignId('post_id')
                ->constrained('posts')
                ->cascadeOnDelete();

            // Utilizador que comentou
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Comentário
            $table->text('comentario');

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
        Schema::dropIfExists('post_comments');
    }
};