<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LevelsConfig extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'levels_config';

    protected $fillable = [
        'nivel_numero',
        'titulo_nivel',
        'pontos_necessarios',
        'descricao_recompensa'
    ];
}