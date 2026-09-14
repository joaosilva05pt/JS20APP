<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MatchStat extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'match_stats';

    protected $fillable = [
        'user_id',
        'event_id',
        'tipo_jogo',
        'golos',
        'assistencias',
        'minutos_jogados',
        'cartoes_amarelos',
        'cartoes_vermelhos',
        'exibir_em_dashboard'
    ];

    public function jogador()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function evento()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }
}