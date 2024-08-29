@extends('layouts.chat')
@section('content')
    <section class="h-100">
        <div class="container h-100">
            <div class="row justify-content-md-center align-items-center h-100">
                <div class="card-wrapper">
                    <!-- <div class="brand">
                        <img src="img/logo.jpg" alt="bootstrap 4 login page">
                    </div> -->
                    <div class="card fat ">
                        <div class="card-body mt-5">
                            <h4 class="card-title">Forgot Password</h4>
                            <form method="POST" action="{{ route('password.reset') }}">
                                @csrf
                                <div class="form-group">
                                    <label for="email">E-Mail Address</label>
                                    <input id="email" type="email"
                                        class="form-control @error('email') is-invalid @enderror" name="email"
                                        value="{{ $email ?? old('email') }}" required autocomplete="email" autofocus>
                                    @error('email')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror
                                    <div class="form-text text-muted">
                                        By clicking "Reset Password" we will send a password reset link
                                    </div>
                                </div>

                                <div class="form-group m-0">
                                    <button type="submit" class="btn loginbutton btn-block">
                                        Reset Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    @endsection
