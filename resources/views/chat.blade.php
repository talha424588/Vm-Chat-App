<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <title>Document</title>
    <style>
        body {
            background: #eee;
        }

        .row {
            width: 70%;
        }

        .chat-list {
            padding: 0;
            font-size: .8rem;
        }

        .chat-list li {
            margin-bottom: 10px;
            overflow: auto;
            color: #ffffff;
            padding: 10px;
        }

        .chat-list .chat-img {
            float: left;
            width: 48px;
        }

        .chat-list .chat-img img {
            -webkit-border-radius: 50px;
            -moz-border-radius: 50px;
            border-radius: 50px;
            width: 100%;
        }

        .chat-list .chat-message {
            -webkit-border-radius: 50px;
            -moz-border-radius: 50px;
            border-radius: 50px;
            background: #5a99ee;
            display: inline-block;
            padding: 10px 20px;
            position: relative;
        }

        .chat-list .chat-message:before {
            content: "";
            position: absolute;
            top: 15px;
            width: 0;
            height: 0;
        }

        .chat-list .chat-message h5 {
            margin: 0 0 5px 0;
            font-weight: 600;
            line-height: 100%;
            font-size: .9rem;
        }

        .chat-list .chat-message p {
            line-height: 18px;
            margin: 0;
            padding: 0;
        }

        .chat-list .chat-body {
            margin-left: 20px;
            float: left;
            width: 70%;
        }

        .chat-list .in .chat-message:before {
            left: -12px;
            border-bottom: 20px solid transparent;
            border-right: 20px solid #5a99ee;
        }

        .chat-list .out .chat-img {
            float: right;
        }

        .chat-list .out .chat-body {
            float: right;
            margin-right: 20px;
            text-align: right;
        }

        .chat-list .out .chat-message {
            background: #fc6d4c;
        }

        .chat-list .out .chat-message:before {
            right: -12px;
            border-bottom: 20px solid transparent;
            border-left: 20px solid #fc6d4c;
        }

        .card .card-header:first-child {
            -webkit-border-radius: 0.3rem 0.3rem 0 0;
            -moz-border-radius: 0.3rem 0.3rem 0 0;
            border-radius: 0.3rem 0.3rem 0 0;
        }

        .card .card-header {
            background: #17202b;
            border: 0;
            font-size: 1rem;
            padding: .65rem 1rem;
            position: relative;
            font-weight: 600;
            color: #ffffff;
        }

        .content {
            margin-top: 40px;
            display: flex;
            justify-content: center;
        }

        #col-height {
            height: 600px;
            border: 2px solid;
            overflow-y: auto;
            border-radius: 12px;
        }

        .input-group {
            display: flex;
            margin-top: 10px;
        }

        .input-group input {
            flex-grow: 1;
            border-radius: 0;
            border-top-left-radius: 0.25rem;
            border-bottom-left-radius: 0.25rem;
            padding: 10px;
            border: 1px solid #ccc;
        }

        .input-group button {
            border-radius: 0;
            border-top-right-radius: 0.25rem;
            border-bottom-right-radius: 0.25rem;
            padding: 10px 20px;
            background-color: #5a99ee;
            border: 1px solid #5a99ee;
            color: white;
            font-weight: bold;
            cursor: pointer;
        }

        .input-group button:hover {
            background-color: #4a88d4;
            border-color: #4a88d4;
        }
    </style>
</head>

<body>
    <div class="container content">
        <div class="row justify-content-center">
            <div class="col-lg-6" id="col-height">
                <div class="card">
                    <div class="card-header">Chat</div>
                    <div class="card-body height3">
                        <ul class="chat-list" id="chat-section">
                            <li class="out">
                                <div class="chat-img">
                                    <img alt="Avatar" src="https://bootdey.com/img/Content/avatar/avatar1.png">
                                </div>
                                <div class="chat-body">
                                    <div class="chat-message">
                                        <h5>Jimmy Willams</h5>
                                        <p>Raw denim heard of them tofu master cleanse</p>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="input-group">
                <input type="text" id="chat-input" placeholder="Type your message here...">
                <button type="button" id="send-button" onclick="broadcast()">Send</button>
            </div>
        </div>
    </div>
</body>


<script src="{{ asset('build/assets/app-BKYbeYMS.js') }}"></script>


@vite(['resources/js/app.js'])
<script>
    var user = {!! json_encode(auth()->user()->only('id', 'name', 'email', 'unique_id')) !!};
    setTimeout(() => {
        window.Echo.channel('vmChat').listen('.Chat', (e) => {
                if (e.user.id == user.id) {
                    newMessage = `<li class="out">
                                <div class="chat-img">
                                    <img alt="Avatar" src="https://bootdey.com/img/Content/avatar/avatar1.png">
                                </div>
                                <div class="chat-body">
                                    <div class="chat-message">
                                        <h5>${e.user.name}</h5>
                                        <p>${e.message}</p>
                                    </div>
                                </div>
                            </li>;`
                    $("#chat-section").append(newMessage);
                } else {
                    newMessage = `<li class="int">
                                <div class="chat-img">
                                    <img alt="Avatar" src="https://bootdey.com/img/Content/avatar/avatar1.png">
                                </div>
                                <div class="chat-body">
                                    <div class="chat-message">
                                        <h5>${e.user.name}</h5>
                                        <p>${e.message}</p>
                                    </div>
                                </div>
                            </li>;`
                    $("#chat-section").append(newMessage);
                }

                console.log(e);

            })
            .error((error) => {
                console.error("Error:", error);
            })
    }, 1000);


    // function broadcast() {
    //     console.log("user", user);
    //     $.ajax({
    //         headers: {
    //             'X-CSRF-TOKEN': '{{ csrf_token() }}'
    //         },
    //         url: '{{ route('broadcast.chat') }}',
    //         type: 'POST',
    //         data: {
    //             user: user,
    //             msg: $("#chat-input").val(),
    //             reply_id: null,
    //             group_id: "i2R5WNL55XaFYOX"
    //         },
    //         success: function(data) {
    //             console.log(data.msg);
    //             document.getElementById('chat-input').value = "";
    //         }
    //     });
    // }

    function broadcast() {
        var message = document.getElementById('chat-input').value;
        if (message.trim() !== '') {
            console.log("Broadcasting message:", message);
            // Add your broadcast logic here
            // Example: send the message to your server or WebSocket
        }
        document.getElementById('chat-input').value = ''; // Clear the input field
    }

    // Listen for the Enter key press on the input field
    document.getElementById('chat-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent the default form submission behavior
            $.ajax({
            headers: {
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            url: '{{ route('broadcast.chat') }}',
            type: 'POST',
            data: {
                user: user,
                msg: $("#chat-input").val(),
                reply_id: null,
                group_id: "i2R5WNL55XaFYOX"
            },
            success: function(data) {
                console.log(data.msg);
                document.getElementById('chat-input').value = "";
            }
        });
        }
    });
</script>

</html>
