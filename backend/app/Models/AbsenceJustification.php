<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AbsenceJustification extends Model
{
    protected $table = 'absence_justifications';
    public $timestamps = false;

    protected $fillable = [
        'attendance_id', 'motivo', 'anexo_url', 'estado_aprovacao', 'comentario_staff', 'submetido_em'
    ];
}