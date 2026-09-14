<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserPurchase extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'user_purchases';

    protected $fillable = [
        'user_id',
        'item_id',
        'preco_pago',
        'estado'
    ];

    // Jogador que efetuou a compra
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Item que foi comprado
    public function item()
    {
        return $this->belongsTo(ShopItem::class, 'item_id');
    }
}