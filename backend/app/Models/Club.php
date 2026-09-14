<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Club extends Model
{
    use HasFactory, SoftDeletes;

    // Dizemos ao Laravel exatamente qual é a tabela
    protected $table = 'clubs';

    protected $fillable = [
        'nome',
        'sigla',            // Essencial para abreviações (Ex: FCP, SCP)
        'emblema_url',
        'criador_id',
        'email_clube',      //  Contacto institucional do clube
        'contacto_oficial', // Telefone da secretaria
        'pais',
        'localidade',
        'data_fundacao',
        
    ];

    public $timestamps = true;

    // O utilizador que fundou o clube
    public function criador()
    {
        return $this->belongsTo(User::class, 'criador_id');
    }

    // Um clube tem várias equipas
    public function teams()
    {
        return $this->hasMany(Team::class, 'club_id');
    }

    // A equipa de direção (Presidente, Vices, etc)
    public function roles()
    {
        return $this->hasMany(ClubRole::class, 'club_id');
    }
}