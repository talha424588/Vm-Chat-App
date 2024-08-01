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


Route::group(['middleware' => ['auth:sanctum','extract.user.id']], function() {

    //Groups Routes
    Route::get('get-user-chat-groups',[GroupController::class,'getUserChatGroup']);

    //Chats Routes
    Route::get('search-groups-chat-messages',[ChatController::class,'searchGroupMessages']);
    Route::get('get-groups-messages-by-group-id',[ChatController::class,'getUserAllGroupsMessages']);
});

Route::post('login',[AuthController::class,'login']);

Route::post('/send-message', function (Request $request) {
    $user = new User();
    $user->id = $request->input('user.id');
    $user->name = $request->input('user.name');

    $message = $request->input('message');

    broadcast(new Chat($user, $message));

    return response()->json(['message' => 'Message sent successfully']);
});
