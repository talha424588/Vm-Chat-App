<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Chat\ChatController;
use App\Http\Controllers\Chat\GroupController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest');
Route::get('/forgot-password', function () {
    return view('forgotPassword');
})->middleware('guest')->name('password.request');

Route::get('/reset-password/', [AuthController::class, 'resetPassword'])->middleware('guest')->name('password.reset');

Route::get('/', [ChatController::class, 'index'])->name('chat')->middleware('auth');

Route::post('/broadcast',[ChatController::class,'broadcastChat'])->name('broadcast.chat');


Route::group(['middleware' => ['auth:web']], function() {

    //Groups Routes
    Route::get('get-user-chat-groups',[GroupController::class,'getUserChatGroup']);

    //Chats Routes
    Route::get('search-groups-chat-messages',[ChatController::class,'searchGroupMessages']);
    Route::get('get-groups-messages-by-group-id',[ChatController::class,'getUserAllGroupsMessages']);

    Route::get('/messages', [ChatController::class, 'index']);
    Route::get('auth/token/verify', [AuthController::class, 'verifyToken']);

Route::post('/messages', [ChatController::class, 'store']);
Route::delete('/message/delete/{id}', [ChatController::class, 'delete']);
Route::post('/message/seen-by/update', [ChatController::class, 'updateMessageReadStatus']);
Route::get('/message/seen-by/{id}', [ChatController::class, 'getMessageReadStatus']);
});
// Route::get('/chat',[ChatController::class,'store'])->name('store.chat');

// Auth::routes();
// Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');
