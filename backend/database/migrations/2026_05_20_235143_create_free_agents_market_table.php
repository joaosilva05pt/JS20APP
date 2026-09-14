<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('free_agents_market', function (Blueprint $table) {

            $table->id();

            // Jogador
            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            // Posições
            $table->string('posicao_principal', 50)
                ->nullable();

            $table->string('posicao_secundaria', 50)
                ->nullable();

            // Vídeo highlights
            $table->string('video_url', 255)
                ->nullable();

            // Perfil público
            $table->boolean('visibilidade_publica')
                ->default(true);

            // Bio atleta
            $table->text('bio_desportiva')
                ->nullable();

            // Região interesse
            $table->string('regiao_interesse', 100)
                ->nullable();

            // Última atualização
            $table->timestamp('atualizado_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('free_agents_market');
    }
};