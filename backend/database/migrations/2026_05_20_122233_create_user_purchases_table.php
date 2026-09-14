<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_purchases', function (Blueprint $table) {

            $table->id();

            // Utilizador
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Item comprado
            $table->foreignId('item_id')
                ->constrained('shop_items')
                ->cascadeOnDelete();

            // Preço pago
            $table->integer('preco_pago');

            // Estado compra
            $table->string('estado', 20)
                ->default('Entregue');

            // Data compra
            $table->timestamp('data_compra')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('user_purchases');
    }
};