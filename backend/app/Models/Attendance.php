<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $table = 'attendance';
    public $timestamps = false; 

    protected $fillable = [
        'event_id', 'user_id', 'estado', 'minutos_atraso', 'validado_por_staff', 'registado_em'
    ];
}