@extends('layouts.chat')
@section('content')
    <section class="h-100">


        <div class="container">
            <div class="row justify-content-md-center">
                <div class="card-wrapper">
                    <!-- <div class="brand">
                                            <img src="img/logo.jpg" alt="logo">
                                        </div> -->
                    <div class="card fat">
                        <div class="card-body">
                            <h4 class="card-title text-center">Hi, Welcome </h4>
                            <p class="text-center sub-title">Enter your email and password to sign in</p>
                            <form method="POST" action="{{ route('login') }}">
                                @csrf
                                <div class="form-group">
                                    <label for="email">{{ __('Email Address') }}</label>
                                    <input id="email" type="email"
                                        class="form-control @error('email') is-invalid @enderror" name="email"
                                        value="{{ old('email') }}" required autocomplete="email" autofocus>

                                    @error('email')
                                        <div class="alert alert-danger my-2">{{ $message }}</div>
                                    @enderror
                                </div>

                                <div class="form-group">
                                    <label for="password">{{ __('Password') }}</label>
                                    <input id="password" type="password" class="form-control" name="password" required
                                        data-eye>
                                    @error('password')
                                        <div class="alert alert-danger my-2">{{ $message }}</div>
                                    @enderror
                                </div>

                                <div class="form-group ">
                                    <div class="custom-checkbox custom-control text-center mt-4">
                                        @if (Route::has('password.request'))
                                            <a href="{{ route('password.request') }}" class="forgot-password ">Forgot your
                                                password?</a>
                                        @endif
                                    </div>
                                </div>

                                <div class="form-group m-0">
                                    <button type="submit" class="btn loginbutton btn-block">
                                        {{ __('Login') }}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    @endsection
