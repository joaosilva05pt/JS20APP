<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlayerEvaluation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'avaliador_id',
        'evento_id',
        'nota_principal',
        'nota_remate',
        'nota_passe',
        'nota_velocidade',
        'nota_tecnica',
        'nota_defesa',
        'nota_mental',
        'pontos_positivos',
        'pontos_negativos',
        'observacoes_privadas',
        'data_avaliacao'
    ];

    public function jogador()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function avaliador()
    {
        return $this->belongsTo(User::class, 'avaliador_id');
    }

    public function evento()
    {
        return $this->belongsTo(Event::class, 'evento_id');
    }
}