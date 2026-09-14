<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubInvitation extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'club_invitations';

    protected $fillable = [
        'clube_id',
        'equipa_id',
        'user_convidado_id',
        'convidado_por_id',
        'cargo', 
        'resposta_clube',
        'resposta_equipa',
        'token_convite',
        'data_envio'
    ];

    // O clube para o qual está a ser convidado
    public function club()
    {
        return $this->belongsTo(Club::class, 'clube_id');
    }

    // A equipa para a qual está a ser convidado (opcional, pode ser só para a estrutura do clube)
    public function team()
    {
        return $this->belongsTo(Team::class, 'equipa_id');
    }

    // O jogador/staff que vai receber o convite
    public function convidado()
    {
        return $this->belongsTo(User::class, 'user_convidado_id');
    }

    // O Dirigente/Treinador que enviou o convite
    public function remetente()
    {
        return $this->belongsTo(User::class, 'convidado_por_id');
    }
}