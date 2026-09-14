<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubRole extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'club_roles';

    protected $fillable = [
        'club_id',
        'user_id',
        'cargo',
        'data_inicio',
        'data_fim',
        'ativo',
        'criado_em'
    ];

    protected $casts = [
        'ativo' => 'boolean',
        'data_inicio' => 'date',
        'data_fim' => 'date',
    ];

    // O utilizador que tem este cargo
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // O clube a que este cargo pertence
    public function club()
    {
        return $this->belongsTo(Club::class, 'club_id');
    }
}