<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeamUserRole extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'team_user_roles';

    protected $fillable = [
        'team_id',
        'user_id',
        'cargo',
        'numero_camisola',
        'criado_em'
    ];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}