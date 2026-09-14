<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Team extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'teams';

    protected $fillable = [
        'club_id',
        'criada_por_id',
        'escalao',
        'genero',
        'epoca_desportiva',
        'arquivada',
        'criado_em'
    ];

    protected $casts = [
        'arquivada' => 'boolean', // Garante que o PHP lê como true/false
    ];

    // A que clube pertence esta equipa?
    public function club()
    {
        return $this->belongsTo(Club::class, 'club_id');
    }

    // Quem criou a equipa no sistema
    public function criador()
    {
        return $this->belongsTo(User::class, 'criada_por_id');
    }

    // O Plantel e Equipa Técnica (A ponte para a tabela team_user_roles)
    public function membros()
    {
        return $this->hasMany(TeamUserRole::class, 'team_id');
    }
}