<?php

namespace App\Providers;

use App\Repositories\ChatRepository;
use App\Repositories\GroupRepository;
use Illuminate\Support\ServiceProvider;
use App\Repositories\UserRepository;
use App\Services\ChatService;
use App\Services\GroupService;
use App\Services\UserService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepository::class, UserService::class);
        $this->app->bind(GroupRepository::class, GroupService::class);
        $this->app->bind(ChatRepository::class, ChatService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
