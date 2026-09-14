<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    // 🔥 Garante que todos estes campos estão aqui declarados:
    protected $fillable = [
        'user_id',
        'registado_por_id',
        'tipo_lesao',
        'gravidade',
        'estado_prontidao',
        'data_inicio',
        'data_regresso_prevista',
        'notas_tratamento',
        'privado'
    ];

    public function jogador()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function profissional()
    {
        return $this->belongsTo(User::class, 'registado_por_id');
    }
}