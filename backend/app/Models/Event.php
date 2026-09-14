<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    
    const CREATED_AT = 'criado_em';
    const UPDATED_AT = null; 

    /**
     * Os atributos que podem ser preenchidos em massa (Mass Assignment)
     */
    protected $fillable = [
        'team_id',
        'titulo',
        'descricao',
        'tipo',
        'tipo_jogo',
        'data_inicio',
        'data_fim',
        'localizacao',
        'foco_tecnico',
        'terminado'
    ];
             
    /**
     * RELAÇÕES DO ELOQUENT
     */

    // 1. Um evento pertence a uma Equipa (Escalão)
    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    // 2. Um evento tem várias marcações de presença (Attendance)
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'event_id');
    }
}