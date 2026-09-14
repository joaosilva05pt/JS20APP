<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_items', function (Blueprint $table) {

            $table->id();

            // Nome item
            $table->string('nome', 100);

            // Descrição
            $table->text('descricao')
                ->nullable();

            // Preço em pontos
            $table->integer('preco_pontos');

            // Tipo item
            $table->string('tipo', 30)
                ->default('Cosmetico');

            // Stock
            $table->integer('stock')
                ->default(-1);

            // Imagem
            $table->string('imagem_url', 255)
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
        });}

    public function down(): void
    {Schema::dropIfExists('shop_items');
    }
};