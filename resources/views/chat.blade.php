<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>VM Chat</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css"
        integrity="sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.0.10/css/all.css"
        integrity="sha384-+d0P83n9kaQMCwj8F4RJB66tzIwOKmrdb46+porD/OvrJ+37WqIM7UoBtwHO6Nlg" crossorigin="anonymous">
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://www.gstatic.com/firebasejs/7.7.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/7.7.0/firebase-storage.js"></script>
    <script src="https://www.gstatic.com/firebasejs/7.7.0/firebase-messaging.js"></script>
    <script src="https://cdn.tiny.cloud/1/6hun1luhhppu7pkwfe4vetbftca09vpcny2aoik7l4fmmlcf/tinymce/6/tinymce.min.js"
        referrerpolicy="origin"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" crossorigin="anonymous">
    <link rel="stylesheet" href="{{ asset('assets/css/viewer.css') }}">
    <style>
        .audio-message {
            display: flex;
            align-items: center;
            width: 239px;
        }

        .avatar {
            margin-right: 10px;
        }

        .avatar img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
        }

        .audio-content {
            flex: 1;
            padding-top: 14px;
            padding-right: 10px;
        }

        .audio-controls {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }

        .play-button {
            background: none;
            border: none;
            cursor: pointer;
            margin-right: 10px;
        }

        .playbutton {
            background: none;
            border: none;
            cursor: pointer;
            margin-right: 10px;
        }

        .audio-progress {
            width: 100%;
            background-color: #f0f0f0;
            border-radius: 10px;
            height: 5px;
            cursor: pointer;
            position: relative;
        }

        .progress-filled {
            height: 5px;
            background-color: #34b7f1;
            border-radius: 10px;
            width: 0%;
        }

        .audio-duration {
            font-size: 12px;
            color: #555;
            text-align: left;
            margin-top: 5px;
        }

        .audio-time {
            font-size: 12px;
            color: #888;
            text-align: right;
        }

        .audio-time-container {
            display: flex;
            justify-content: space-between;

            margin-left: 30px;
        }

        .selected-message {
            background-color: #E8E9EA;/ Change background color / padding: 2px;
            transition: background-color 0.3s ease;/ Smooth transition effect /
        }

        #action-bar {
            display: flex;
            justify-content: space-between;/ Distributes space between items / align-items: center;/ Vertically centers items / height: 62px;
        }

        #selected-count {
            margin-right: auto;/ Pushes the SVG to the right / font-size: 16px;
        }


        .selected-message {
            background-color: #E8E9EA;/ Change background color / padding: 2px;
            transition: background-color 0.3s ease;/ Smooth transition effect /
        }

        #action-bar {
            display: flex;
            justify-content: space-between;/ Distributes space between items / align-items: center;/ Vertically centers items / height: 62px;
        }

        #selected-count {
            margin-right: auto;/ Pushes the SVG to the right / font-size: 16px;
        }

        .selected-user {
            background-color: #f8f9fa;
            border-top: 1px solid #ddd;
            padding: 10px;
            display: none !important;/ Initially hidden /
        }


        .selected-username {
            font-weight: bold;
            font-size: 16px;
        }

        .btn-success {
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chat-list-item {
            cursor: pointer;
            display: flex;
            align-items: center;/ This will vertically center the radio button / transition: background-color 0.3s ease;
        }

        .chat-list-item:hover {
            background-color: #f0f0f0;
        }

        .chat-radio {
            margin-right: 10px;/ Space between radio button and profile image / width: 18px;/ Adjust size of radio button / height: 18px;
        }

        .name {
            font-weight: bold;
            font-size: 16px;
        }

        .last-message {
            color: #888;
            font-size: 14px;
        }

        .auto-resize-textarea {
            overflow: hidden;
        }
    </style>
</head>

<body>
    <div class="container-fluid" id="main-container">
        <div class="row h-100">
            <div class="col-12 col-sm-5 col-md-4 d-flex flex-column h-100" id="chat-list-area"
                style="position:relative;">

                <!-- Navbar -->

                <div class="row d-flex flex-row align-items-center p-2" id="navbar">
                    <img alt="Profile Photo" class="img-fluid rounded-circle profile_img" id="display-pic">
                    <div class="username-container">
                        <div class="text-dark font-weight-bold" id="username"></div>
                        <small class="text-muted">Online</small>
                    </div>

                    <div class="nav-item dropdown ml-auto">
                        <button type="button" class="btn loginbutton btn-block" id="logout"
                            onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                            Logout
                        </button>

                        <form id="logout-form" class="d-none" action="{{ route('logout') }}" method="POST">
                            @csrf
                        </form>
                    </div>
                </div>
                <div>

                    <div class="search-bar">
                        <i class="fa fa-search"></i>
                        <input type="text" placeholder="Search" id="search_group">
                    </div>

                    <div class="buttons">
                        <button class="button active" onclick="display_chat('all')">All</button>
                        <button class="button" onclick="display_chat('unread')">Unread</button>

                        <!--- <button class="button active">All</button>
                            <button class="button" id="unread">Unread</button>
                            {{-- <button class="button">Groups</button> --}}--->
                    </div>


                </div>
                <!-- Chat List -->
                <div class="row chat-row">
                    <div class="col-md-12 chat_list_view" id="chat-list" style="overflow:auto;"></div>
                    <div class="col-md-12 chat_list_view" id="chat-list-unread" style="overflow:auto; display:none;">
                        Unread List </div>
                    <div class="col-md-12 chat_list_view" id="messagesList" style="overflow:auto;"></div>
                </div>


                <!-- Profile Settings -->
                <div class="d-flex flex-column w-100 h-100" id="profile-settings">
                    <div class="row d-flex flex-row align-items-center p-2 m-0"
                        style="background:#009688; min-height:65px;">
                        <i class="fas fa-arrow-left p-2 mx-3 my-1 text-dark" style="font-size: 1.5rem; cursor: pointer;"
                            onclick="hideProfileSettings()"></i>
                        <div class="text-dark font-weight-bold">Profile</div>
                    </div>
                    <div class="d-flex flex-column" style="overflow:auto;">
                        <img alt="Profile Photo" class="img-fluid rounded-circle my-5 justify-self-center mx-auto"
                            id="profile-pic">
                        <input type="file" id="profile-pic-input" class="d-none">
                        <div class="bg-white px-3 py-2">
                            <div class="text-muted mb-2"><label for="input-name">Your Name</label></div>
                            <input type="text" name="name" id="input-name"
                                class="w-100 border-0 py-2 profile-input">
                        </div>
                        <div class="text-muted p-3 small">
                            This is not your username or pin. This name will be visible to your WhatsApp contacts.
                        </div>
                        <div class="bg-white px-3 py-2">
                            <div class="text-muted mb-2"><label for="input-about">About</label></div>
                            <input type="text" name="name" id="input-about" value=""
                                class="w-100 border-0 py-2 profile-input">
                        </div>
                    </div>

                </div>
            </div>

            <!-- Message Area -->
            <div class="d-none d-sm-flex flex-column col-12 col-sm-7 col-md-8 p-0 h-100" id="message-area">

                <div class="w-100 h-100 overlay"></div>

                <!-- Navbar -->
                <div id="side_navbar">

                    <div class="back-arrow" onclick="showChatList()">
                        <i class="fas fa-arrow-left"></i>
                    </div>


                    <a href="#"><img
                            src="https://static.vecteezy.com/system/resources/previews/012/574/694/non_2x/people-linear-icon-squad-illustration-team-pictogram-group-logo-icon-illustration-vector.jpg"
                            alt="Profile Photo" class="profile-pic" id="pic"></a>

                    <div class="profile-details">
                        <div class="name" id="name">User Name</div>
                        <div class="details" id="details">Details here</div>
                    </div>

                    <!-- Search Icon -->
                    <div class="search-icon" id="search-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="search-icon" id="search-icon-mobile">
                        <i class="fas fa-search"></i>
                    </div>

                    {{-- <div class="d-none serach_div" id="serach_div">
                        <div class="row flex-row search-header">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M0 17C0 18.7 1.3 20 3 20H17C18.7 20 20 18.7 20 17V9H0V17ZM17 2H15V1C15 0.4 14.6 0 14 0C13.4 0 13 0.4 13 1V2H7V1C7 0.4 6.6 0 6 0C5.4 0 5 0.4 5 1V2H3C1.3 2 0 3.3 0 5V7H20V5C20 3.3 18.7 2 17 2Z"
                                    fill="#687780" />
                            </svg>
                            &nbsp;&nbsp;<input type="search" placeholder="Search messages" class="search-input"
                                id="messsage_search_query">
                        </div>
                    </div> --}}
                </div>

                <div id="spinner" class="lazy_spinner"></div>

                <div class="d-flex flex-column chat_list_messages" id="messages">

                </div>

                <!-- New Code To Move Message -->

                <div class="chat-input-container" id="action-bar" style="display:none;">
                    &nbsp;&nbsp;&nbsp;
                    <svg width="14" height="14" id="cancel-icon" viewBox="0 0 14 14" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12.9966L13 1M1 1L13 12.9966" stroke="#687780" stroke-width="2"
                            stroke-linecap="round" />
                    </svg>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<div id="selected-count">Selected Messages: 0</div>
                    <svg width="31" height="31" id="openModalTrigger" viewBox="0 0 31 31" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61" />
                        <path d="M15.5 12V8L23.5 16L15.5 24V20H7.5V12H15.5Z" fill="white" />
                    </svg>
                </div>

                <div class="modal fade" id="chatModal" tabindex="-1" role="dialog" aria-labelledby="ModalLabel"
                    aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered" role="document">
                        <div class="modal-content" style="height:630px">
                            <div class="modal-header"
                                style="background-color: #1DAB61; font-size: 18px; font-weight: 400;">
                                <h5 class="modal-title" style="color:white;">Move message to</h5>
                                <button type="button" style="color:white;" class="close" data-bs-dismiss="modal"
                                    aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body" style="padding: 0px !important;" id="moveModal">
                                <div class="search-header" style="padding: 10px 9px 12px 0px; border-bottom: 0px;">
                                    <input type="search" placeholder="Search messages" class="search-input"
                                        style="width: 100%;">
                                </div>
                                <div class="recent-chat" style="padding: 0px 0px 0px 10px; text-align: left;">
                                    <span style="font-weight: bold; display: block; margin-bottom: 5px;">Recent
                                        Chat</span>
                                </div>
                                <!-- Chat list items -->
                                <div id="chat-list2" style="height:420px; overflow-y:scroll">

                                </div>
                                <!-- <div class="d-flex flex-row w-100 p-2 border-bottom unread align-items-center">
                        <input type="radio" name="chatSelection" class="chat-radio" style="margin-right: 10px;" onclick="selectUsertosend('Programmers')">
                        <img src="images/0923102932_aPRkoW.jpg" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
                        <div class="w-50">
                            <div class="name list-user-name">Programmers</div>
                            <div class="small last-message">message or status is here </div>
                        </div>
                    </div>

                    <div class="d-flex flex-row w-100 p-2 border-bottom unread align-items-center">
                        <input type="radio" name="chatSelection" class="chat-radio" style="margin-right: 10px;" onclick="selectUsertosend('Developers')">
                        <img src="images/0923102932_aPRkoW.jpg" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
                        <div class="w-50">
                            <div class="name list-user-name">Developers</div>
                            <div class="small last-message">message or status is here </div>
                        </div>
                    </div> -->

                            </div>

                            <!-- Bottom section for selected user display -->
                            <div id="selected-usertosend"
                                class="selected-user d-flex align-items-center justify-content-between"
                                style="padding: 10px; background-color: #F0F2F5; border-top: 1px solid #ddd; display: none;">
                                <span id="selected-username" class="selected-username"></span>
                                <!-- Hidden inputs to store message IDs and group ID -->
                                <input type="hidden" name="messages_ids" id="messages_ids">
                                <input type="hidden" name="group_to_move_message" id="group_to_move_message">

                                <!-- SVG element that triggers the post action -->
                                <svg width="31" height="31" id="MoveMessagetoGroup" viewBox="0 0 31 31"
                                    fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61"></circle>
                                    <path d="M15.5 12V8L23.5 16L15.5 24V20H7.5V12H15.5Z" fill="white"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <!---new code is above that line --->

                <div id="emoji-picker-wrapper"></div>
                <!-- Input -->
                <div class=" " id="input-area">

                    <div id="reply-div"
                        style="padding-right:30px; padding-left:30px; padding-top:10px; display: none;">
                        <div id="quoted-message" class="quoted-message">
                            <div class="quoted-content">
                                <span class="sender-name">Siraj</span>
                                <p class="quoted-text">Hello, this is testing</p>
                            </div>
                            <span class="close-quoted" onclick="removeQuotedMessage()">✖</span>
                        </div>
                    </div>


                    <div id="correction-div" style=" display: none;">
                        <div id="quoted-messages" class="quoted-message">
                            <div class="quoted-content">
                                <span class="sender-name">Siraj</span>
                                <p class="quoted-text">Hello, this is testing</p>
                            </div>
                            <span class="close-quoted" onclick="removecorrectionMessage()">✖</span>
                        </div>
                    </div>

                    <!---Edit Message Area Start-->
                    <div id="editMessageDiv"
                        style="padding-right:30px; padding-left:30px; padding-top:10px; display:none;">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="cursor" onclick="removeEditMessage()" style="margin-right: auto;">✖</span>
                            <div
                                class="align-self-end self d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item right-nidle">
                                <div style="margin-top:-4px">
                                    <div class="shadow-sm EditmessageContent"
                                        style="background:#dcf8c6; padding:10px; border-radius:5px;">
                                        ${messageContent}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!---Edit Message Area Start-->
                    <div id="editMessageDiv"
                        style="padding-right:30px; padding-left:30px; padding-top:10px;display:none;">

                        <div class="">
                            <div
                                class="align-self-end self d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item right-nidle">
                                <div style="margin-top:-4px">
                                    <div class="shadow-sm EditmessageContent"
                                        style="background:#dcf8c6; padding:10px; border-radius:5px;">
                                        ${messageContent}
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    <!---Edit Message Area End-->

                    <!-- <div id="action-bar-parent" style="overflow-y:auto;overflow-x:hidden"> -->
                    <div class="chat-input-container d-flex justify-self-end align-items-center flex-row" id="reply-area">




                        <div class="icon-container" id="scrollBottomBtn" style="display: none;">
                            <div class=" notification-count" id="notification-count"></div>
                            <div class="icon" style="font-size: 24px !important;"><svg width="40"
                                    height="10" viewBox="0 0 16 9" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M0.344159 0.344159C0.56459 0.123794 0.863519 0 1.17521 0C1.4869 0 1.78583 0.123794 2.00626 0.344159L7.82479 6.16269L13.6433 0.344159C13.865 0.130039 14.1619 0.0115592 14.4701 0.0142373C14.7783 0.0169155 15.0732 0.140538 15.2911 0.358478C15.509 0.576418 15.6327 0.871238 15.6353 1.17944C15.638 1.48764 15.5195 1.78457 15.3054 2.00626L8.65584 8.65584C8.43541 8.87621 8.13648 9 7.82479 9C7.5131 9 7.21417 8.87621 6.99374 8.65584L0.344159 2.00626C0.123794 1.78583 0 1.4869 0 1.17521C0 0.863519 0.123794 0.564591 0.344159 0.344159Z"
                                        fill="#687780" />
                                </svg></div> <!-- This is a down arrow symbol -->
                        </div>

                        <textarea id="input" class="chat-input auto-resize-textarea" rows="1" cols="62"
                            placeholder="Type a message"></textarea>
                        <div class="chat-action-icons" id="chat_action">
                            <i class="chat-icon chat_action_file" style="padding-left: 3px; ">
                                <svg id="file-icon" width="23" height="20" viewBox="0 0 23 20"
                                    fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                        d="M7 2C5.67392 2 4.40215 2.52678 3.46447 3.46447C2.52678 4.40215 2 5.67392 2 7V13C2 13.2652 1.89464 13.5196 1.70711 13.7071C1.51957 13.8946 1.26522 14 1 14C0.734784 14 0.48043 13.8946 0.292893 13.7071C0.105357 13.5196 0 13.2652 0 13V7C-1.36979e-08 6.08075 0.18106 5.1705 0.532843 4.32122C0.884626 3.47194 1.40024 2.70026 2.05025 2.05025C2.70026 1.40024 3.47194 0.884626 4.32122 0.532843C5.17049 0.18106 6.08075 0 7 0C7.91925 0 8.8295 0.18106 9.67878 0.532843C10.5281 0.884626 11.2997 1.40024 11.9497 2.05025C12.5998 2.70026 13.1154 3.47194 13.4672 4.32122C13.8189 5.1705 14 6.08075 14 7V15C14 16.3261 13.4732 17.5979 12.5355 18.5355C11.5979 19.4732 10.3261 20 9 20C7.67392 20 6.40215 19.4732 5.46447 18.5355C4.52678 17.5979 4 16.3261 4 15V7C4 6.20435 4.31607 5.44129 4.87868 4.87868C5.44129 4.31607 6.20435 4 7 4C7.79565 4 8.55871 4.31607 9.12132 4.87868C9.68393 5.44129 10 6.20435 10 7V15C10 15.2652 9.89464 15.5196 9.70711 15.7071C9.51957 15.8946 9.26522 16 9 16C8.73478 16 8.48043 15.8946 8.29289 15.7071C8.10536 15.5196 8 15.2652 8 15V7C8 6.73478 7.89464 6.48043 7.70711 6.29289C7.51957 6.10536 7.26522 6 7 6C6.73478 6 6.48043 6.10536 6.29289 6.29289C6.10536 6.48043 6 6.73478 6 7V15C6 15.7956 6.31607 16.5587 6.87868 17.1213C7.44129 17.6839 8.20435 18 9 18C9.79565 18 10.5587 17.6839 11.1213 17.1213C11.6839 16.5587 12 15.7956 12 15V7C12 5.67392 11.4732 4.40215 10.5355 3.46447C9.59785 2.52678 8.32608 2 7 2Z"
                                        fill="#687780" />
                                </svg>
                            </i>
                            <i class="chat-icon chat_action_capture">
                                <svg id="captureid" width="31" height="20" viewBox="0 0 19 23"
                                    fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M20 2.6087H16.987L15.5054 0.386957C15.4261 0.267991 15.3186 0.170438 15.1925 0.102941C15.0664 0.0354437 14.9256 8.58749e-05 14.7826 0H7.82609C7.68307 8.58749e-05 7.54229 0.0354437 7.41621 0.102941C7.29012 0.170438 7.18263 0.267991 7.10326 0.386957L5.62065 2.6087H2.6087C1.91683 2.6087 1.25329 2.88354 0.764069 3.37276C0.274844 3.86199 0 4.52552 0 5.21739V17.3913C0 18.0832 0.274844 18.7467 0.764069 19.2359C1.25329 19.7252 1.91683 20 2.6087 20H20C20.6919 20 21.3554 19.7252 21.8446 19.2359C22.3339 18.7467 22.6087 18.0832 22.6087 17.3913V5.21739C22.6087 4.52552 22.3339 3.86199 21.8446 3.37276C21.3554 2.88354 20.6919 2.6087 20 2.6087ZM20.8696 17.3913C20.8696 17.6219 20.778 17.8431 20.6149 18.0062C20.4518 18.1693 20.2306 18.2609 20 18.2609H2.6087C2.37807 18.2609 2.1569 18.1693 1.99382 18.0062C1.83075 17.8431 1.73913 17.6219 1.73913 17.3913V5.21739C1.73913 4.98677 1.83075 4.76559 1.99382 4.60252C2.1569 4.43944 2.37807 4.34783 2.6087 4.34783H6.08696C6.23015 4.34792 6.37116 4.31265 6.49745 4.24514C6.62373 4.17764 6.7314 4.07999 6.81087 3.96087L8.2913 1.73913H14.3163L15.7978 3.96087C15.8773 4.07999 15.985 4.17764 16.1112 4.24514C16.2375 4.31265 16.3785 4.34792 16.5217 4.34783H20C20.2306 4.34783 20.4518 4.43944 20.6149 4.60252C20.778 4.76559 20.8696 4.98677 20.8696 5.21739V17.3913ZM11.3043 6.08696C10.3584 6.08696 9.43377 6.36745 8.64727 6.89297C7.86078 7.41849 7.24778 8.16543 6.88579 9.03934C6.52381 9.91325 6.4291 10.8749 6.61364 11.8026C6.79817 12.7303 7.25367 13.5825 7.92253 14.2514C8.59139 14.9202 9.44357 15.3757 10.3713 15.5603C11.299 15.7448 12.2607 15.6501 13.1346 15.2881C14.0085 14.9261 14.7554 14.3131 15.2809 13.5266C15.8065 12.7401 16.087 11.8155 16.087 10.8696C16.0855 9.60158 15.5812 8.38594 14.6846 7.48934C13.788 6.59274 12.5723 6.08839 11.3043 6.08696ZM11.3043 13.913C10.7024 13.913 10.114 13.7345 9.61348 13.4001C9.11298 13.0657 8.72289 12.5904 8.49254 12.0343C8.26219 11.4781 8.20192 10.8662 8.31935 10.2758C8.43678 9.68543 8.72665 9.14314 9.15228 8.7175C9.57792 8.29186 10.1202 8.002 10.7106 7.88457C11.301 7.76713 11.9129 7.8274 12.469 8.05776C13.0252 8.28811 13.5005 8.6782 13.8349 9.1787C14.1693 9.6792 14.3478 10.2676 14.3478 10.8696C14.3478 11.6767 14.0272 12.4509 13.4564 13.0216C12.8857 13.5924 12.1115 13.913 11.3043 13.913Z"
                                        fill="#687780" />

                                </svg></i>
                            <i id="voice-icon" class="chat-icon chat_action_voice">


                                <svg id="voice-svg" width="31" height="30" style="margin-top:8px"
                                    viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61" />
                                    <path
                                        d="M15.125 17.2143C16.8146 17.2143 18.1684 15.8504 18.1684 14.1607L18.1786 8.05357C18.1786 6.36393 16.8146 5 15.125 5C13.4354 5 12.0714 6.36393 12.0714 8.05357V14.1607C12.0714 15.8504 13.4354 17.2143 15.125 17.2143ZM20.5196 14.1607C20.5196 17.2143 17.9343 19.3518 15.125 19.3518C12.3157 19.3518 9.73036 17.2143 9.73036 14.1607H8C8 17.6316 10.7686 20.502 14.1071 21.0007V24.3393H16.1429V21.0007C19.4814 20.5121 22.25 17.6418 22.25 14.1607H20.5196Z"
                                        fill="white" />
                                </svg>
                            </i>
                        </div>
                        <div class="chat-action-icons" id="Editreply-area" style="display:none; margin-left: 5px;">
                            <i id="send-message-btn" class="chat-icon">
                                <svg width="31" height="30" viewBox="0 0 31 31" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61" />
                                    <path
                                        d="M22.4355 8.33332L5.11261 12.4775C4.93818 12.5193 4.77916 12.6096 4.65403 12.7381C4.5289 12.8666 4.44279 13.028 4.40569 13.2035C4.3686 13.3789 4.38204 13.5613 4.44446 13.7295C4.50688 13.8976 4.61571 14.0446 4.75833 14.1534L8.52702 17.0255L15.9931 14.5851L11.9722 21.3327L13.9464 25.6403C14.0206 25.8039 14.1399 25.943 14.2903 26.0413C14.4407 26.1397 14.6159 26.1931 14.7956 26.1955C14.9753 26.1979 15.1519 26.149 15.3048 26.0547C15.4577 25.9603 15.5806 25.8244 15.6591 25.6628L23.5073 9.67331C23.5867 9.51179 23.6184 9.33102 23.5989 9.15212C23.5793 8.97323 23.5092 8.8036 23.3968 8.66306C23.2844 8.52252 23.1343 8.41689 22.9641 8.35849C22.7938 8.3001 22.6105 8.29137 22.4355 8.33332Z"
                                        fill="white" />
                                </svg>
                            </i>
                        </div>
                        <div class="chat-action-icons" id="message-reply-area" style="display:none; margin-left: 5px;">


                        <i id="send-reply-btn" onclick="sendMessageReply()" class="chat-icon">

                         <svg width="31" height="30" viewBox="0 0 31 31" fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                             <circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61" />
                                <path
                                d="M22.4355 8.33332L5.11261 12.4775C4.93818 12.5193 4.77916 12.6096 4.65403 12.7381C4.5289 12.8666 4.44279 13.028 4.40569 13.2035C4.3686 13.3789 4.38204 13.5613 4.44446 13.7295C4.50688 13.8976 4.61571 14.0446 4.75833 14.1534L8.52702 17.0255L15.9931 14.5851L11.9722 21.3327L13.9464 25.6403C14.0206 25.8039 14.1399 25.943 14.2903 26.0413C14.4407 26.1397 14.6159 26.1931 14.7956 26.1955C14.9753 26.1979 15.1519 26.149 15.3048 26.0547C15.4577 25.9603 15.5806 25.8244 15.6591 25.6628L23.5073 9.67331C23.5867 9.51179 23.6184 9.33102 23.5989 9.15212C23.5793 8.97323 23.5092 8.8036 23.3968 8.66306C23.2844 8.52252 23.1343 8.41689 22.9641 8.35849C22.7938 8.3001 22.6105 8.29137 22.4355 8.33332Z"
                                 fill="white" />
                            </svg>

                        </i>
                        </div>

                        <div class="chat-action-icons" id="correctionreply-area"
                            style="display:none; margin-left:4px !important; ">
                            <i id="correction-send-message-btn" class="chat-icon">

                                <svg width="31" height="30" viewBox="0 0 31 31" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61" />
                                    <path
                                        d="M22.4355 8.33332L5.11261 12.4775C4.93818 12.5193 4.77916 12.6096 4.65403 12.7381C4.5289 12.8666 4.44279 13.028 4.40569 13.2035C4.3686 13.3789 4.38204 13.5613 4.44446 13.7295C4.50688 13.8976 4.61571 14.0446 4.75833 14.1534L8.52702 17.0255L15.9931 14.5851L11.9722 21.3327L13.9464 25.6403C14.0206 25.8039 14.1399 25.943 14.2903 26.0413C14.4407 26.1397 14.6159 26.1931 14.7956 26.1955C14.9753 26.1979 15.1519 26.149 15.3048 26.0547C15.4577 25.9603 15.5806 25.8244 15.6591 25.6628L23.5073 9.67331C23.5867 9.51179 23.6184 9.33102 23.5989 9.15212C23.5793 8.97323 23.5092 8.8036 23.3968 8.66306C23.2844 8.52252 23.1343 8.41689 22.9641 8.35849C22.7938 8.3001 22.6105 8.29137 22.4355 8.33332Z"
                                        fill="white" />
                                </svg>

                            </i>
                        </div>

                    </div>
                    <!-- </div> -->
                    <input type="hidden" class="number" id="correction_message_id">
                    <input type="hidden" class="number" id="edit_message_id">
                    <input type="file" id="hidden-file-input" name="photo" accept=".jpg, .jpeg, .png" />

                    <!-- Hidden file input for multiple files -->
                    <input type="file" id="file-input" multiple accept=".pdf, .doc, .docx">

                </div>
            </div>
            {{-- Message Search Bar --}}
            <div id="sidebar" class="sidebar-closed col-md-4">
                <div class="header-shadow">
                    <div class="row d-flex flex-row align-items-center" id="navbar"
                        style="padding:21px !important;">
                        <button id="close-sidebar" class="close-button">&times;</button>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="font-size:16px; font-weight: 400;">Search
                            messages</span>
                    </div>

                    <div class="row flex-row search-header">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M0 17C0 18.7 1.3 20 3 20H17C18.7 20 20 18.7 20 17V9H0V17ZM17 2H15V1C15 0.4 14.6 0 14 0C13.4 0 13 0.4 13 1V2H7V1C7 0.4 6.6 0 6 0C5.4 0 5 0.4 5 1V2H3C1.3 2 0 3.3 0 5V7H20V5C20 3.3 18.7 2 17 2Z"
                                fill="#687780" />
                        </svg>
                        &nbsp;&nbsp;<input type="search" placeholder="Search messages" class="search-input"
                            id="messsage_search_query">
                    </div>

                </div>
                <div class="search-results" id="search-results">
                    <!-- Sample results -->
                    <div class="result-item">

                    </div>
                </div>
            </div>
        </div>
    </div>
    </div>

    <!--Delete Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="deleteModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">

                <div class="modal-body">
                    <img src="{{ asset('assets/svg/message-delete.gif') }}" alt="" height="78.32px">
                    <h5>Are you sure you want to delete?</h5>
                    <p class="not-recover">This action cannot be undone.</p>
                    <button type="button" class="btn btn-delete">Delete</button> &nbsp;&nbsp;&nbsp;
                    <button type="button" class="btn btn-cancel" id="btn-close"
                        data-dismiss="modal">Cancel</button>
                </div>
            </div>
        </div>
    </div>
    <!-- something went wrong modal -->
    <div class="modal fade" id="wentWrong" tabindex="-1" role="dialog" aria-labelledby="wentWrontModal"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">

                <div class="modal-body">
                    <img src="{{ asset('assets/svg/danger-5732_256.gif') }}" alt="" height="78.32px">
                    <h5>Internet Connection Lost !!!</h5>
                    <button type="button" class="btn btn-cancel" id="btn-close" data-bs-dismiss="modal">Ok</button>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade" id="notAllowed" tabindex="-1" role="dialog" aria-labelledby="notAllowed"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">

                <div class="modal-body">
                    <img src="{{ asset('assets/svg/danger-5732_256.gif') }}" alt="" height="78.32px">
                    <h5>Move Message To Same Group Not Allowed</h5>
                    <button type="button" class="btn btn-cancel" id="btn-close"
                        data-bs-dismiss="modal">Ok</button>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade" id="notAllowed" tabindex="-1" role="dialog" aria-labelledby="notAllowed"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">

                <div class="modal-body">
                    <img src="{{ asset('assets/svg/danger-5732_256.gif') }}" alt="" height="78.32px">
                    <h5>Move Message To Same Group Not Allowed</h5>
                    <button type="button" class="btn btn-cancel" id="btn-close"
                        data-bs-dismiss="modal">Ok</button>
                </div>
            </div>
        </div>
    </div>
    <!--Seen Modal -->
    <!-- <div class="modal fade" id="seenModal" tabindex="-1" role="dialog" aria-labelledby="seenModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">

                <div class="modal-body">
                    <img src="{{ asset('assets/svg/message-seen.gif') }}" alt="" height="78.32px">
                    <h5>Users who have seen this message:</h5>
                    {{-- <p class="not-recover" id="is_read">awais-designer, VM-UST-SA, Talha Dev</p> --}}
                    <p class="not-recover" id="is_read"></p>
                    <button type="button" class="btn btn-cancel" data-bs-dismiss="modal" id="close-modal-btn">Ok</button>
                </div>
            </div>
        </div>
    </div> -->
    <div class="modal fade" id="seenModal" tabindex="-1" role="dialog" aria-labelledby="seenModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">

                <div class="modal-body">
                    <img src="{{ asset('assets/svg/message-seen.gif') }}" alt="" height="78.32px">
                    <h5>Users who have seen this message:</h5>
                    <p class="not-recover" id="is_read"></p>
                    <button type="button" class="btn btn-cancel" data-dismiss="modal">ok</button>
                </div>
            </div>
        </div>
    </div>
    <!-- File Size Modal -->
    <div class="modal fade" id="filesizealeart" tabindex="-1" role="dialog" aria-labelledby="fileModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">

                <div class="modal-body">
                    <img src="{{ asset('assets/svg/danger-5732_256.gif') }}" alt="" height="78px">

                    <h5>Unable to send file!</h5>
                    <p class="not-recover">The file you have selected is larger than 5 MB</p>
                    <button type="button" class="btn btn-cancel" data-bs-dismiss="modal">Ok</button>

                </div>

            </div>
        </div>
    </div>
    <input type="hidden" value="{{ Auth::user()->id }}" id="login_user_id">
    <input type="hidden" value="{{ Auth::user()->name }}" id="login_user_name">
    <input type="hidden" value="{{ Auth::user()->unique_id }}" id="login_user_unique_id">
    <input type="hidden" value="{{ Auth::user()->email }}" id="login_user_email">
    <input type="hidden" value="{{ Auth::user()->fcm_token }}" id="login_user_fcm_token">
    <input type="hidden" value="{{ Auth::user()->seen_privacy }}" id="login_user_seen_privacy">
    <input type="hidden" value="{{ Auth::user()->role }}" id="login_user_role">

    <style>
        .hidden {
            display: none !important;
        }

        div#chat-list-unread {
            text-align: center;
            margin-top: 60px;
        }
    </style>

    </style>

    <script>
        function display_chat(type) {
            const chatList = document.getElementById('chat-list');
            const chatItems = chatList.getElementsByClassName('chat-list-item');
            const alertDiv = document.getElementById('chat-list-unread');
            const buttons = document.querySelectorAll('.buttons .button');
            buttons.forEach(button => {
                button.classList.remove('active');
            });

            if (type === 'unread') {
                buttons[1].classList.add('active');
            } else {
                buttons[0].classList.add('active');
            }

            let hasUnreadMessages = false;

            for (let i = 0; i < chatItems.length; i++) {
                const unreadCountElement = chatItems[i].getElementsByClassName('badge-success')[0];
                let unreadCount = 0;


                if (unreadCountElement && unreadCountElement.style.display !== 'none') {
                    unreadCount = parseInt(unreadCountElement.innerText);
                }


                if (unreadCount > 0) {
                    hasUnreadMessages = true;
                    chatItems[i].style.setProperty('display', 'block');
                }

                else if (type === 'unread') {
                    chatItems[i].style.setProperty('display', 'none', 'important');
                }

                else {
                    chatItems[i].style.setProperty('display', 'block');
                }
            }


            if (type === 'unread' && !hasUnreadMessages) {
                chatList.style.display = 'none';
                alertDiv.style.display = 'block';
                alertDiv.innerHTML = 'No unread messages are available.';
            } else {
                alertDiv.style.display = 'none';
                chatList.style.display = 'block';
            }
        }
    </script>


    <script type="module">
        import {
            Picker
        } from 'https://esm.sh/emoji-picker-element@1.18.2';

        $(document).ready(function() {
            const picker = new Picker({
                locale: 'en'
            });
            const emojiPickerWrapper = document.getElementById('emoji-picker-wrapper');
            emojiPickerWrapper.appendChild(picker);

            const input = document.getElementById('input');
            const emojiBtn = document.getElementById('sticker-icon');

            let isPickerVisible = false;

            emojiBtn.addEventListener('click', () => {
                isPickerVisible = !isPickerVisible;

                if (isPickerVisible) {
                    emojiPickerWrapper.style.position =
                        'fixed';
                    emojiPickerWrapper.style.top = 'auto';
                    emojiPickerWrapper.style.bottom =
                        '8%';
                    emojiPickerWrapper.style.left = '34%';

                    emojiPickerWrapper.style.display = 'block';
                } else {
                    emojiPickerWrapper.style.display = 'none';
                }
            });

            picker.addEventListener('emoji-click', event => {
                const emoji = event.detail.emoji.unicode;
                const inputField = input
                const start = inputField.selectionStart;
                const end = inputField.selectionEnd;
                inputField.value = inputField.value.substring(0, start) + emoji + inputField.value
                    .substring(end);
                inputField.selectionStart = inputField.selectionEnd = start + emoji.length;
                inputField.focus();
            });

            $(document).click((event) => {
                if (!emojiPickerWrapper.contains(event.target) && !emojiBtn.contains(event.target)) {
                    emojiPickerWrapper.style.display = 'none';
                    isPickerVisible = false;
                }
            });
        });
    </script>

    <!-- Your JavaScript -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const textarea = document.querySelector('.chat-input');
            const fileIcon = document.querySelector('#file-icon');
            const chaticon = document.querySelector('#captureid');

            function updateFileIconVisibility() {
                if (textarea.value.trim() === "") {
                    fileIcon.style.visibility = 'visible';
                    chaticon.style.visibility = 'visible';
                } else {
                    fileIcon.style.visibility = 'hidden'; // Hide the file-icon when textarea has text
                    chaticon.style.visibility = 'hidden';
                }
            }


            textarea.addEventListener('input', function() {

                textarea.style.height = 'auto';
                textarea.style.height = (textarea.scrollHeight) + 'px';


                updateFileIconVisibility();
            });

            // Event listener for focus on textarea
            textarea.addEventListener('focus', function() {
                updateFileIconVisibility();
            });

            textarea.addEventListener('blur', function() {
                updateFileIconVisibility();
            });
        });
    </script>
    <script src="{{ asset('assets/js/filesize-aleart.js') }}"></script>
    <script src="{{ asset('assets/js/sidemodel.js') }}"></script>
    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
        integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous">
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.0/umd/popper.min.js"
        integrity="sha384-cs/chFZiN24E4KMATLdqdvsezGxaGsi4hLGOzlXwp5UZB1LY//20VyM2taTB4QvJ" crossorigin="anonymous">
    </script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/js/bootstrap.min.js"
        integrity="sha384-uefMccjFJAIv6A+rW+L4AHf99KvxDjWSu1z9VI8SKNVmz4sk7buKt/6v9KI65qnm" crossorigin="anonymous">
    </script>
    <script src="{{ asset('assets/js/date-utils.js') }}"></script>
    <script src="{{ asset('assets/js/script.js') }}"></script>
    <script src="{{ asset('assets/js/viewer.js') }}"></script>

    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        var csrfToken = '{{ csrf_token() }}';
        var broadcastChatRoute = '{{ route('broadcast.chat') }}';
    </script>
    <script></script>

    {{-- One Signal --}}
    <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" async=""></script>
    {{-- <script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async=""></script> --}}

    <!-- Include jQuery -->
    <!-- {{-- <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script> --}} -->
    <!-- Include Bootstrap JS -->

</body>

</html>
