<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TacticalPlay extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tactical_plays';

    protected $fillable = [
        'team_id',
        'criador_id',
        'titulo',
        'descricao',
        'categoria',
        'estado'
    ];

    // Uma jogada tem múltiplos frames/momentos de animação
    public function frames()
    {
        return $this->hasMany(TacticalFrame::class, 'play_id')->orderBy('ordem_frame', 'asc');
    }

    // Quem desenhou a jogada
    public function criador()
    {
        return $this->belongsTo(User::class, 'criador_id');
    }
}