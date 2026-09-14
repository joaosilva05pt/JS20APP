<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_invitations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('clube_id')->constrained('clubs')->cascadeOnDelete();
            $table->foreignId('equipa_id')->nullable()->constrained('teams')->cascadeOnDelete();
            $table->foreignId('user_convidado_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('convidado_por_id')->nullable()->constrained('users')->nullOnDelete();
            
         
            $table->string('cargo', 50)->nullable();

            $table->string('resposta_clube', 20)->default('Pendente');
            $table->string('resposta_equipa', 20)->default('Pendente');
            $table->string('token_convite', 100)->unique();
            $table->timestamp('data_envio')->useCurrent();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }
};