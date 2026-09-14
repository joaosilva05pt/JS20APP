<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserAchievement extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'user_achievements';

    protected $fillable = [
        'user_id',
        'team_id',
        'titulo',
        'epoca',
        'descricao',
        'categoria',
        'tipo',
        'raridade',
        'icone_url',
        'data_conquista'
    ];

    // Atleta dono do troféu
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Escalão/Equipa onde o troféu foi conquistado
    public function equipa()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }
}