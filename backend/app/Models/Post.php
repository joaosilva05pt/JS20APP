<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'posts';

    protected $fillable = [
        'team_id',
        'autor_id',
        'event_id',
        'titulo',
        'conteudo',
        'imagem_url',
        'tipo'
    ];

    // O autor do post
    public function autor()
    {
        return $this->belongsTo(User::class, 'autor_id');
    }

    // Um post tem várias respostas/comentários
    public function comentarios()
    {
        return $this->hasMany(PostComment::class, 'post_id')->orderBy('criado_em', 'asc');
    }
}