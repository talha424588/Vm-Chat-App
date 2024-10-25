@extends('layouts.chat')
@section('content')
<section class="h-100 d-flex justify-content-center align-items-center"> <!-- Ensuring vertical and horizontal centering -->
    <div class="container">
        <div class="row justify-content-center"> <!-- Horizontal centering for different screen sizes -->
            <div class="col-md-6 col-lg-5 col-xl-4 mx-auto"> <!-- Adjust column size for responsiveness -->
                <div class="card mb-5 mt-4 custom-shadow"> <!-- Adding shadow for a better look -->
                <div class="card-body">
                            <h4 class="card-title text-center">Hi, Welcome </h4>
                            <p class="text-center sub-title">Enter your email and password to sign in</p>
                            <form method="POST" action="{{ route('login') }}">
                                @csrf
                                <div class="form-group">
                                    <label for="email">{{ __('Email Address') }}</label>
                                    <div class="eye-div">
                                        <i class="login-icons">
                                        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 5L11 8.5L16 5" stroke="#687780" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M1 13V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H19C19.5304 1 20.0391 1.21071 20.4142 1.58579C20.7893 1.96086 21 2.46957 21 3V13C21 13.5304 20.7893 14.0391 20.4142 14.4142C20.0391 14.7893 19.5304 15 19 15H3C2.46957 15 1.96086 14.7893 1.58579 14.4142C1.21071 14.0391 1 13.5304 1 13Z" stroke="#687780" stroke-width="1.5"/>
                                        </svg>
                                        </i>
                                    <input id="email" type="email"
                                        class="login-form-control @error('email') is-invalid @enderror" name="email"
                                        value="{{ old('email') }}" required autocomplete="email" autofocus placeholder="Email@example.com">
                                    </div>
                                    @error('email')
                                        <div class="alert alert-danger my-2">{{ $message }}</div>
                                    @enderror
                                </div>

                                <div class="form-group">
                                    <label for="password">{{ __('Password') }}</label>
                                    <input id="password" type="password" class="login-form-control" name="password" required
                                        data-eye placeholder="Password">
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
</section>
@endsection
