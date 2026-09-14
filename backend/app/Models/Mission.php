<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mission extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'missions';

    protected $fillable = [
        'titulo',
        'descricao',
        'tipo',
        'categoria',
        'pontos_recompensa',
        'repetivel'
    ];

    // Jogadores vinculados a esta missão através da tabela pivot
    public function utilizadores()
    {
        return $this->hasMany(UserMission::class, 'mission_id');
    }
}