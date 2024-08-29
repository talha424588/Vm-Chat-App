@extends('layouts.chat')

@section('content')
    <section class="h-100">


        <div class="container h-100">
            <div class="row justify-content-md-center h-100">
                <div class="card-wrapper">
                    <!-- <div class="brand">
                        <img src="img/logo.jpg" alt="logo">
                    </div> -->
                    <div class="card fat">
                        <div class="card-body">
                            <h4 class="card-title text-center">Hi, Welcome </h4>
                            <p class="text-center sub-title">Enter your email and password to sign in</p>
                            <form action="chat.html" method="POST" class="my-login-validation" novalidate="">
                                <div class="form-group">
                                    <label for="email">Email address</label>
                                    <input id="email" type="email" class="form-control" name="email" value=""
                                        required autofocus>

                                    <div class="invalid-feedback">
                                        Email is invalid
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="password">Password

                                    </label>
                                    <input id="password" type="password" class="form-control" name="password" required
                                        data-eye>
                                    <div class="invalid-feedback">
                                        Password is required
                                    </div>
                                </div>

                                <div class="form-group ">
                                    <div class="custom-checkbox custom-control text-center mt-4">
                                        <a href="forgot.html" class="forgot-password ">Forgot your password?</a>
                                    </div>
                                </div>

                                <div class="form-group m-0">
                                    <button type="submit" class="btn loginbutton btn-block">
                                        Login
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        <footer class="text-center  bg-white fixed-bottom" style="box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);">

            <!-- Copyright -->
            <div class="text-center p-3 ">
                <div class="d-flex justify-content-between">
                    <div class="Copyright-claim">
                        © 2024 VMChatter All Right Reserved
                    </div>
                    <div class="Copyright-claim-right">
                        <a class="text-body" style="padding-right: 50px;" href="https://mdbootstrap.com/">Privacy
                            Policy</a>

                        <a class="text-body" href="https://mdbootstrap.com/">Use of Terms</a>

                    </div>
                </div>



            </div>
            <!-- Copyright -->
        </footer>
    </section>
@endsection
