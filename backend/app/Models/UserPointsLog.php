<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserPointsLog extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'user_points_log';

    protected $fillable = [
        'user_id',
        'pontos',
        'motivo',
        'referencia_id',
        'referencia_tipo'
    ];

    // Jogador dono dos pontos
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relação Polimórfica para identificar a origem do ganho (Mission, Match, Event, etc.)
    public function referencia()
    {
        return $this->morphTo();
    }
}