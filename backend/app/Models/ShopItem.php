<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ShopItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'shop_items';

    protected $fillable = [
        'nome',
        'descricao',
        'preco_pontos',
        'tipo',
        'stock',
        'imagem_url',
        'ativo'
    ];

    // Histórico de compras geradas por este item
    public function compras()
    {
        return $this->hasMany(UserPurchase::class, 'item_id');
    }
}