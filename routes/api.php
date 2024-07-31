<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Chat\ChatController;
use App\Http\Controllers\Chat\GroupController;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/


Route::group(['middleware' => ['auth:sanctum','extract.user.id']], function() {

    //Groups Routes
    Route::get('get-user-chat-groups',[GroupController::class,'getUserChatGroup']);

    //Chats Routes
    Route::get('search-groups-chat-messages',[ChatController::class,'searchGroupMessages']);
    Route::get('get-groups-messages-by-group-id',[ChatController::class,'getUserAllGroupsMessages']);
});

Route::post('login',[AuthController::class,'login']);
