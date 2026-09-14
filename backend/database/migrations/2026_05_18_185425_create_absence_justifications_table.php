<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('absence_justifications', function (Blueprint $table) {

            $table->id();

            // Presença associada
            $table->foreignId('attendance_id')
                ->constrained('attendance')
                ->cascadeOnDelete();

            // Motivo da justificação
            $table->text('motivo');

            // Anexo (atestado/foto/pdf)
            $table->string('anexo_url')
                ->nullable();

            // Estado aprovação
            $table->string('estado_aprovacao', 30)
                ->default('Pendente');

            // Comentário do staff
            $table->text('comentario_staff')
                ->nullable();

            // Data submissão
            $table->timestamp('submetido_em')
                ->useCurrent();

            // Laravel timestamps
            $table->timestamps();

            // Soft deletes
            $table->softDeletes();
        });}

    public function down(): void
    {Schema::dropIfExists('absence_justifications');
    }
};