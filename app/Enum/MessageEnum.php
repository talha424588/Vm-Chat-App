<?php

namespace App\Enum;

enum MessageEnum: string
{
    case NEW = 'New';
    case MOVE = 'Move';
    case CORRECTION = 'Correction';
    case EDIT = 'Edited';
}
