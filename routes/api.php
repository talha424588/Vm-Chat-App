<?php

use App\Events\Chat;
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


Route::group(['middleware' => ['auth:web']], function() {

    //Groups Routes
    Route::get('get-user-chat-groups',[GroupController::class,'getUserChatGroup']);

    //Chats Routes
    Route::get('search-groups-chat-messages',[ChatController::class,'searchGroupMessages']);
    Route::get('get-groups-messages-by-group-id',[ChatController::class,'getUserAllGroupsMessages']);

    Route::get('/messages', [ChatController::class, 'index']);
    Route::get('auth/token/verify', [AuthController::class, 'verifyToken']);

});
Route::post('/messages', [ChatController::class, 'store']);
Route::delete('/message/delete/{id}', [ChatController::class, 'delete']);
Route::post('/message/seen-by/update', [ChatController::class, 'updateMessageReadStatus']);
Route::get('/message/seen-by/{id}', [ChatController::class, 'getMessageReadStatus']);

//Route::post('login',[AuthController::class,'login']);
