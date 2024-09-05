
let getById = (id, parent) => parent ? parent.getElementById(id) : getById(id, document);
let getByClass = (className, parent) => parent ? parent.getElementsByClassName(className) : getByClass(className, document);

const socket = io('http://localhost:3000');
// Connect to the server

const DOM = {
    chatListArea: getById("chat-list-area"),
    messageArea: getById("message-area"),
    inputArea: getById("input-area"),
    chatList: getById("chat-list"),
    messages: getById("messages"),
    chatListItem: getByClass("chat-list-item"),
    messageAreaName: getById("name", this.messageArea),
    messageAreaPic: getById("pic", this.messageArea),
    messageAreaNavbar: getById("navbar", this.messageArea),
    messageAreaDetails: getById("details", this.messageAreaNavbar),
    messageAreaOverlay: getByClass("overlay", this.messageArea)[0],
    messageInput: getById("input"),
    profileSettings: getById("profile-settings"),
    profilePic: getById("profile-pic"),
    profilePicInput: getById("profile-pic-input"),
    inputName: getById("input-name"),
    username: getById("username"),
    displayPic: getById("display-pic"),
    groupId: getById("group-id"),
};
let userGroupList = [];

// document.addEventListener('DOMContentLoaded', async function (e) {

// const message = DOM.messageInput.value;
// var loginUser = {
//     id: document.getElementById("login_user_id").value,
//     name: document.getElementById("login_user_name").value,
//     unique_id: document.getElementById("login_user_unique_id").value,
//     email: document.getElementById("login_user_email").value
// }
// const sendButton = document.getElementById('input');
// const chatLog = document.getElementById('chat-log');

// sendButton.addEventListener('dblclick', () => {
//   const message = DOM.messageInput.value;
//   if (message) {
//     // Send the loginUser object along with the message
//     socket.emit('sendChatToServer', { message, loginUser });
//     chatInput.value = '';
//   }
// });

socket.on('sendChatToClient', (message) => {
    // console.log("message", message);
    //     console.log("loginUser", data.loginUser);
    //     const messageElement = document.createElement('div');
    //     messageElement.textContent = `${data.loginUser.name}: ${data.message}`;
    //     chatLog.appendChild(messageElement);
});


// });

let mClassList = (element) => {
    return {
        add: (className) => {
            element.classList.add(className);
            return mClassList(element);
        },
        remove: (className) => {
            element.classList.remove(className);
            return mClassList(element);
        },
        contains: (className, callback) => {
            if (element.classList.contains(className))
                callback(mClassList(element));
        }
    };
};

// 'areaSwapped' is used to keep track of the swapping
// of the main area between chatListArea and messageArea
// in mobile-view
let areaSwapped = false;

// 'chat' is used to store the current chat
// which is being opened in the message area
let chat = null;

// this will contain all the chats that is to be viewed
// in the chatListArea
let chatList = [];

// this will be used to store the date of the last message
// in the message area
let lastDate = "";

let populateChatList = async () => {
    chatList = [];
    let present = {};

    try {
        const id = document.getElementById("login_user_id").value;

        // Fetch groups with their messages
        const response = await fetch(`api/get-user-chat-groups?id=${encodeURIComponent(id)}`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            }
        });
        const result = await response.json();

        result.forEach(group => {
            let chat = {};
            chat.isGroup = true;
            chat.group = group;
            chat.group.access = [group.access];
            // chat.members = [group.access];
            chat.name = group.name;
            chat.unread = 0; // initialize unread count to 0

            if (group.group_messages && group.group_messages.length > 0) {
                // if the group has messages, process them
                group.group_messages.forEach(msg => {
                    chat.msg = msg;
                    chat.time = new Date(msg.time * 1000);

                    // Ensure unread is calculated correctly
                    const seenBy = msg.seen_by ? msg.seen_by.split(",").map(s => s.trim()) : [];
                    chat.unread += (msg.sender !== id && !seenBy.includes(id)) ? 1 : 0;
                });
            }

            if (present[chat.name] !== undefined) {
                // if the group is already in the chatList, update its unread count
                chatList[present[chat.name]].unread += chat.unread;
            } else {
                present[chat.name] = chatList.length;
                chatList.push(chat);
            }
        });
    } catch (error) {
        console.log("Error fetching chat groups:", error);
    }
};

let viewChatList = () => {
    if (chatList.length === 0) {
        console.log("No chats to display.");
        return;
    }

    cn

    DOM.chatList.innerHTML = "";
    chatList
        .sort((a, b) => {
            if (a.time && b.time) {
                return mDate(b.time).subtract(a.time);
            } else if (a.time) {
                return -1;
            } else if (b.time) {
                return 1;
            } else {
                return 0;
            }
        })
        .forEach((elem, index) => {
            let statusClass = elem.msg && elem.msg.status < 2 ? "far" : "fas";
            let unreadClass = elem.unread ? "unread" : "";
            if (elem.isGroup) {
                const latestMessage = elem.group.group_messages && elem.group.group_messages.length > 0 ? elem.group.group_messages[elem.group.group_messages.length - 1] : null;
                const messageText = latestMessage ? latestMessage.msg : "No messages";
                const senderName = latestMessage && latestMessage.user ? latestMessage.user.name : "";
                const timeText = elem.time ? mDate(elem.time).chatListFormat() : "No messages";
                DOM.chatList.innerHTML += `
<input type="hidden" id="group-id" value="${elem.group.group_id}"></input>
            <div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom ${unreadClass}" onclick="generateMessageArea(this, ${index})">
              <img src="${elem.group.pic ? elem.group.pic : 'https://static.vecteezy.com/system/resources/previews/012/574/694/non_2x/people-linear-icon-squad-illustration-team-pictogram-group-logo-icon-illustration-vector.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
              <div class="w-50">
                <div class="name list-user-name">${elem.group.name}</div>
                <div class="small last-message">${elem.isGroup ? senderName + ": " : ""}${messageText}</div>
              </div>

              <div class="flex-grow-1 text-right">
                <div class="small time">${timeText}</div>
                ${elem.unread ? "<div class=\"badge badge-success badge-pill small\" id=\"unread-count\">" + elem.unread + "</div>" : ""}
              </div>
            </div>`;
            }
        });
};

let generateChatList = async () => {
    await populateChatList();
    viewChatList();
};


let addDateToMessageArea = (date) => {
    DOM.messages.innerHTML += `
	<div class="mx-auto my-2  text-dark small py-1 px-2 rounded"  style="visibility: hidden;">
		//${date}
	</div>
	`;
};
let addunreadToMessageArea = {
    addUnread: function () {

        DOM.messages.innerHTML += `
 <div class="notification-wrapper">
  <div class="unread-messages">
        1 UNREAD MESSAGES
    </div>
</div>
<div class="icon-container">
<div class="notification-count">1</div>
					<div class="icon"><svg width="16" height="9" viewBox="0 0 16 9" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M0.344159 0.344159C0.56459 0.123794 0.863519 0 1.17521 0C1.4869 0 1.78583 0.123794 2.00626 0.344159L7.82479 6.16269L13.6433 0.344159C13.865 0.130039 14.1619 0.0115592 14.4701 0.0142373C14.7783 0.0169155 15.0732 0.140538 15.2911 0.358478C15.509 0.576418 15.6327 0.871238 15.6353 1.17944C15.638 1.48764 15.5195 1.78457 15.3054 2.00626L8.65584 8.65584C8.43541 8.87621 8.13648 9 7.82479 9C7.5131 9 7.21417 8.87621 6.99374 8.65584L0.344159 2.00626C0.123794 1.78583 0 1.4869 0 1.17521C0 0.863519 0.123794 0.564591 0.344159 0.344159Z" fill="#687780"/>
				</svg></div> <!-- This is a down arrow symbol -->
				</div>
        `;
    }
};


function makeformatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    // Check if the date is today
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        // Format for the same day
        const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleTimeString('en-US', optionsTime).replace(':00', ''); // Removing seconds
    } else {
        // Format for a different day
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// setTimeout(() => {
//     window.Echo.channel('vmChat').listen('.Chat', (message) => {
socket.on('sendChatToClient', (message) => {
    addMessageToMessageArea(message);
});
//     })
//         .error((error) => {
//             console.error("Error:", error);
//         })
// }, 1000);


let addMessageToMessageArea = (message) => {
    console.log("asdasdas", message);
    let msgDate = mDate(message.time).getDate();
    if (lastDate != msgDate) {
        addDateToMessageArea(msgDate);
        lastDate = msgDate;
    }

    // var alert_message = msg.read_status;

    // if (alert_message == 1) {
    //     addunreadToMessageArea.addUnread();
    // }

    // let sendStatus = `<i class="${msg.status < 2 ? "far" : "fas"} fa-check-circle"></i>`;

    let profileImage = `<img src="${message.user?.pic ?? "assets/images/Alsdk120asdj913jk.jpg"}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px; width:50px;">`;
    // Find sender name
    let senderName = message.user.name;

    DOM.messages.innerHTML += `
	<div class="ml-3">
	  ${message.user.id == user.id ? '' : profileImage}
	  <div class="">
		<div class="align-self-${message.user.id == user.id ? 'end self' : 'start'} d-flex flex-row align-items-center
		  p-1 my-1 mx-3 rounded message-item ${message.user.id == user.id ? 'right-nidle' : 'left-nidle'}" data-message-id="${message.id}">
		  <div style="margin-top:-4px">
			<div class="shadow-sm" style="background:${message.user.id == user.id ? '#dcf8c6' : 'white'}; padding:10px; border-radius:5px;">
			  ${message.msg ?? message.message}
			</div>
			<div>
			  <div style="color: #463C3C; font-size:14px; font-weight:400; margin-top: 10px; width: 100%; background-color: transparent;">
				<span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">${senderName}</span> |
				<span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">(${makeformatDate(new Date(message.message ? message.time : message.time * 1000))})</span> |
				<span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">
				  <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" data-toggle="modal" data-target="#seenModal">Seen</a>
				</span> |
				<span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">
				  <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration:
				  underline; color: #666;" id="reply-link" onclick="showReply()" data-message-id="${message.id}">Reply</a>
				</span> |
				<span>
				  <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" data-toggle="modal" data-target="#deleteModal">Delete</a>
				</span>
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	</div>
	`;


    DOM.messages.scrollTo(0, DOM.messages.scrollHeight);


};


let generateMessageArea = (elem, chatIndex) => {
    chat = chatList[chatIndex];


    mClassList(DOM.inputArea).contains("d-none", (elem) => elem.remove("d-none").add("d-flex"));
    mClassList(DOM.messageAreaOverlay).add("d-none");

    [...DOM.chatListItem].forEach((elem) => mClassList(elem).remove("active"));

    mClassList(elem).contains("unread", () => {
        MessageUtils.changeStatusById({
            isGroup: chat.isGroup,
            id: chat.isGroup ? chat.group.id : chat.contact.id
        });
        mClassList(elem).remove("unread");
        mClassList(elem.querySelector("#unread-count")).add("d-none");
    });

    if (window.innerWidth <= 575) {
        mClassList(DOM.chatListArea).remove("d-flex").add("d-none");
        mClassList(DOM.messageArea).remove("d-none").add("d-flex");
        areaSwapped = true;
    } else {
        mClassList(elem).add("active");
    }

    DOM.messageAreaName.innerHTML = chat.name;
    DOM.messageAreaPic.src = chat.isGroup ? chat.group.pic : chat.contact.pic;

    if (chat.isGroup) {
        let memberNames = chat.group.users_with_access.map(member => member.id === user.id ? "You" : member.name);
        DOM.messageAreaDetails.innerHTML = `${memberNames}`;
    }
    // else {
    //     DOM.messageAreaDetails.innerHTML = `last seen ${mDate(chat.contact.lastSeen).lastSeenFormat()}`;
    // }

    let msgs = chat.isGroup ? chat.group.group_messages : [];

    DOM.messages.innerHTML = "";

    lastDate = "";
    msgs
        .sort((a, b) => mDate(a.time).subtract(b.time))
        .forEach((msg) => addMessageToMessageArea(msg));
};

let showChatList = () => {
    if (areaSwapped) {
        mClassList(DOM.chatListArea).remove("d-none").add("d-flex");
        mClassList(DOM.messageArea).remove("d-flex").add("d-none");
        areaSwapped = false;
    }
};

let sendMessage = () => {
    var loginUser = {
        id: document.getElementById("login_user_id").value,
        name: document.getElementById("login_user_name").value,
        unique_id: document.getElementById("login_user_unique_id").value,
        email: document.getElementById("login_user_email").value
    }
    let value = DOM.messageInput.value;
    if (value === "") return;
    let msg = {
        user: loginUser,
        message: value,
        reply_id: '',
        group_id: document.getElementById('group-id').value,
        type: "message",
        time: mDate().toString(),
    };
    socket.emit('sendChatToServer', msg)
    DOM.messageInput.value = "";
    // $.ajax({
    //     headers: {
    //         'X-CSRF-TOKEN': csrfToken
    //     },
    //     url: broadcastChatRoute,
    //     type: 'POST',
    //     data: msg,
    //     success: function (data) {
    //         DOM.messageInput.value = "";
    //     }
    // });

    // addMessageToMessageArea(msg);
    generateChatList();
};

let showProfileSettings = () => {
    DOM.profileSettings.style.left = 0;
    DOM.profilePic.src = user.pic;
    DOM.inputName.value = user.name;
};

let hideProfileSettings = () => {
    DOM.profileSettings.style.left = "-110%";
    DOM.username.innerHTML = user.name;
};

window.addEventListener("resize", e => {
    if (window.innerWidth > 575) showChatList();
});

let init = () => {
    DOM.username.innerHTML = user.name;
    DOM.displayPic.src = user.pic;
    DOM.profilePic.stc = user.pic;
    DOM.profilePic.addEventListener("click", () => DOM.profilePicInput.click());
    DOM.profilePicInput.addEventListener("change", () => console.log(DOM.profilePicInput.files[0]));
    DOM.inputName.addEventListener("blur", (e) => user.name = e.target.value);
    generateChatList();

    console.log("Click the Image at top-left to open settings.");
};

init();







//Code to send the message
const voiceIcon = document.getElementById('voice-icon');
const voiceSvg = document.getElementById('voice-svg');
const chatInputContainer = document.querySelector('.chat-input-container');

const stickerMenu = document.getElementById('sticker-menu');
const chatInput = document.querySelector('.chat-input');
const fileIcon = document.getElementById('file-icon');
const fileInput = document.getElementById('file-input');

let mediaRecorder;
let chunks = [];

const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            chatInputContainer.classList.add('recording-active');
            voiceIcon.classList.add('recording');

            // Change SVG to pause icon
            voiceSvg.innerHTML = `
				<circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61"/>
<path d="M11.6667 9C11.2246 9 10.8007 9.18061 10.4882 9.5021C10.1756 9.82359 10 10.2596 10 10.7143V19.2857C10 19.7404 10.1756 20.1764 10.4882 20.4979C10.8007 20.8194 11.2246 21 11.6667 21C12.1087 21 12.5326 20.8194 12.8452 20.4979C13.1577 20.1764 13.3333 19.7404 13.3333 19.2857V10.7143C13.3333 10.2596 13.1577 9.82359 12.8452 9.5021C12.5326 9.18061 12.1087 9 11.6667 9ZM18.3333 9C17.8913 9 17.4674 9.18061 17.1548 9.5021C16.8423 9.82359 16.6667 10.2596 16.6667 10.7143V19.2857C16.6667 19.7404 16.8423 20.1764 17.1548 20.4979C17.4674 20.8194 17.8913 21 18.3333 21C18.7754 21 19.1993 20.8194 19.5118 20.4979C19.8244 20.1764 20 19.7404 20 19.2857V10.7143C20 10.2596 19.8244 9.82359 19.5118 9.5021C19.1993 9.18061 18.7754 9 18.3333 9Z" fill="white"/>

			`;

            mediaRecorder.ondataavailable = event => {
                chunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                audio.play();

                // Create a download link for the recorded audio
                const downloadLink = document.createElement('a');
                downloadLink.href = audioUrl;
                downloadLink.download = 'recording.wav';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

                chunks = [];
                chatInputContainer.classList.remove('recording-active');
                voiceIcon.classList.remove('recording');

                // Change SVG back to voice icon
                voiceSvg.innerHTML = `
					<circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61"/>
					<path d="M15.125 17.2143C16.8146 17.2143 18.1684 15.8504 18.1684 14.1607L18.1786 8.05357C18.1786 6.36393 16.8146 5 15.125 5C13.4354 5 12.0714 6.36393 12.0714 8.05357V14.1607C12.0714 15.8504 13.4354 17.2143 15.125 17.2143ZM20.5196 14.1607C20.5196 17.2143 17.9343 19.3518 15.125 19.3518C12.3157 19.3518 9.73036 17.2143 9.73036 14.1607H8C8 17.6316 10.7686 20.502 14.1071 21.0007V24.3393H16.1429V21.0007C19.4814 20.5121 22.25 17.6418 22.25 14.1607H20.5196Z" fill="white"/>
				`;
            };

            stream.oninactive = () => {
                mediaRecorder.stop();
            };
        })
        .catch(error => {
            console.error('Error accessing media devices.', error);
            chatInputContainer.classList.remove('recording-active');
            voiceIcon.classList.remove('recording');

            // Change SVG back to voice icon
            voiceSvg.innerHTML = `
				<circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61"/>
				<path d="M15.125 17.2143C16.8146 17.2143 18.1684 15.8504 18.1684 14.1607L18.1786 8.05357C18.1786 6.36393 16.8146 5 15.125 5C13.4354 5 12.0714 6.36393 12.0714 8.05357V14.1607C12.0714 15.8504 13.4354 17.2143 15.125 17.2143ZM20.5196 14.1607C20.5196 17.2143 17.9343 19.3518 15.125 19.3518C12.3157 19.3518 9.73036 17.2143 9.73036 14.1607H8C8 17.6316 10.7686 20.502 14.1071 21.0007V24.3393H16.1429V21.0007C19.4814 20.5121 22.25 17.6418 22.25 14.1607H20.5196Z" fill="white"/>
				`;
        });
};

voiceIcon.addEventListener('mousedown', () => {
    startRecording();
});

voiceIcon.addEventListener('mouseup', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
});

voiceIcon.addEventListener('touchstart', () => {
    startRecording();
});

voiceIcon.addEventListener('touchend', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
});



// Open file input dialog when clicking on file icon
fileIcon.addEventListener('click', () => {
    fileInput.click();
});

// Handle selected files
fileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    // Process files here (e.g., upload or preview)
    console.log('Selected files:', files);
});



// on enter send the message
document.getElementById('input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission or other default actions
        sendMessage();
    }
});



