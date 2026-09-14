<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class NutritionGuide extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'nutrition_guides';

    protected $fillable = [
        'team_id',
        'criador_id',
        'titulo',
        'conteudo_texto',
        'anexo_url',
        'tipo'
    ];

    // O profissional ou staff que criou a ementa
    public function criador()
    {
        return $this->belongsTo(User::class, 'criador_id');
    }

    // A equipa vinculada
    public function equipa()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }
}