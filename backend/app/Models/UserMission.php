<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserMission extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'user_missions';

    protected $fillable = [
        'user_id',
        'mission_id',
        'estado',
        'progresso_atual',
        'objetivo_final',
        'data_conclusao'
    ];

    // Jogador que está a cumprir a missão
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Desafio de referência
    public function missao()
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }
}