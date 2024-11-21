<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $table = "groups";

    public function groupMessages()
    {
        return $this->hasOne(GroupMessage::class, 'group_id', 'group_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'access');
    }

    public function getUsersAttribute()
    {
        $userIds = explode(',', $this->access);
        return User::whereIn('id', $userIds)->get();
    }

    // public function users_with_access()
    // {
    //     return $this->belongsToMany(User::class, 'user', 'id', 'id')
    //         ->whereRaw("FIND_IN_SET(user.id, access) > 0");
    // }
    public function users_with_access()
    {
        return $this->belongsToMany(User::class, 'groups', 'id', 'access')
            ->whereRaw("FIND_IN_SET(user.id, groups.access) > 0");
    }
}
