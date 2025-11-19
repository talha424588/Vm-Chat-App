<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CloseExternalEntryInfo extends Model
{
    use HasFactory;

    protected $table = 'close_external_entry_info';

    protected $fillable = [
        'entry_id',
        'closed_by_id',
        'closed_by_name',
        'closed_by_media',
        'traverlers_name'
    ];

    protected $casts = [
        'entry_id' => 'integer',
        'closed_by_id' => 'integer',
    ];
}
