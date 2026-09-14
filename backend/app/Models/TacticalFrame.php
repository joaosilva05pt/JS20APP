<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TacticalFrame extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tactical_frames';

    protected $fillable = [
        'play_id',
        'ordem_frame',
        'tipo_pino',
        'pino_identificador',
        'label',
        'coord_x',
        'coord_y',
        'acao_nota'
    ];

    public function play()
    {
        return $this->belongsTo(TacticalPlay::class, 'play_id');
    }
}