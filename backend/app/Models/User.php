<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes; // Adicionado para suportar o softDeletes da migração

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * Os atributos que podem ser preenchidos em massa (Mass Assignment).
     */
    protected $fillable = [
        'nome',
        'apelido',        
        'email',
        'password',
        'profissao_base',
        'data_nascimento',
        'genero',         //Essencial para os bloqueios e mercado de Agentes Livres
        'foto_perfil',
        'telemovel',
        'pais',          
        'localidade',     
        'primeiro_login',
        
    ];

    /**
     * Os atributos que devem ser escondidos nas respostas da API (JSON).
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * O mapeamento de tipos de atributos (Casts).
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed', // Garante segurança extra no Laravel ao manipular a password
        'primeiro_login' => 'boolean', // Garante que o Laravel converte 1/0 da BD para true/false no PHP
        'data_nascimento' => 'date',
    ];
}