<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Chat\ChatController;
use App\Http\Controllers\Chat\GroupController;
use App\Http\Controllers\MailController;
use App\Http\Controllers\UserController;
use App\Services\FirebaseService;
use Illuminate\Support\Facades\Auth;
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

Auth::routes();

Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest');
Route::get('/forgot-password', function () {
    return view('forgotPassword');
})->middleware('guest')->name('password.request');

Route::get('/reset-password/', [AuthController::class, 'resetPassword'])->middleware('guest')->name('password.reset');

Route::get('/', [ChatController::class, 'index'])->name('chat')->middleware('auth');

Route::post('/broadcast', [ChatController::class, 'broadcastChat'])->name('broadcast.chat');


Route::group(['middleware' => ['auth:web']], function () {

    // user

    Route::post("/user/update/{token}" , [UserController::class, 'updateUserFcmToken']);

    //Groups Routes
    Route::get('get-user-chat-groups', [GroupController::class, 'getUserChatGroup']);
    Route::get('search-group-by-name/{query}', [GroupController::class, 'getChatGroupsByName']);
    Route::get('get-unread-chat-groups', [GroupController::class, 'getUnreadMessageGroups']);
    Route::get('get-group-by-id/{id}', [GroupController::class, 'getGroupById']);


    //Chats Routes
    Route::get('search-groups-chat-messages', [ChatController::class, 'searchGroupMessages']);

    // Route::get('?{group_id}', [ChatController::class, 'openChatGroup']);

    Route::get('get-groups-messages-by-group-id', [ChatController::class, 'getUserAllGroupsMessages']);

    Route::get('/messages', [ChatController::class, 'index']);
    Route::get('auth/token/verify', [AuthController::class, 'verifyToken']);

    Route::delete('/message/delete/{id}', [ChatController::class, 'delete']);
    Route::post('/message/seen-by/update', [ChatController::class, 'updateMessageReadStatus']);
    Route::get('/message/seen-by/{id}', [ChatController::class, 'getMessageReadStatus']);
    Route::get('message/search/{query}/{groupId}/{offset}/{limit}', [ChatController::class, 'searchMessage']);
    Route::get('message/restore/{id}/', [ChatController::class, 'restoreMessage']);
    Route::POST('/logout', [AuthController::class, 'logout'])->name("logout");
    Route::get("/message/detail/{id}" , [ChatController::class, 'getMessageDetails']);
    Route::post("/message/update" , [ChatController::class, 'updateGroupMessage']);
    Route::post("/message/correction" , [ChatController::class, 'messageCorrection']);
    Route::post("/alert-email" , [MailController::class, 'sendAlertMail']);
    Route::get('/view/doc', [ChatController::class,'viewDocument'])->name('view-doc');
    Route::post("/update_user_profile",[UserController::class,'updateUserProfile']);
});

Route::post('/messages/move', [ChatController::class, 'moveMessages']);


Route::post('/messages', [ChatController::class, 'store']);
// Route::get('/chat',[ChatController::class,'store'])->name('store.chat');

// Auth::routes();
// Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');


Route::get("/accessToken", [FirebaseService::class, 'sendMessageNotification']);



Route::get('/send-notification', [FirebaseService::class, 'sendNotification']);


