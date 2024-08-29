<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Chat\ChatController;
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

Route::get('/login', [LoginController::class, 'restrictMultipleLogin'])->name('login');
Route::get('/forgot-password', function () {
    return view('forgotPassword');
})->middleware('guest')->name('password.request');

Route::get('/reset-password/', [AuthController::class, 'resetPassword'])->middleware('guest')->name('password.reset');


// Route::post('/broadcast',[ChatController::class,'broadcastChat'])->name('broadcast.chat');
// Route::get('/chat',[ChatController::class,'store'])->name('store.chat');

// Auth::routes();
// Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');
