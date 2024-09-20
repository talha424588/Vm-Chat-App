
let getById = (id, parent) => parent ? parent.getElementById(id) : getById(id, document);
let getByClass = (className, parent) => parent ? parent.getElementsByClassName(className) : getByClass(className, document);

const socket = io('http://localhost:3000');

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
    groupId: null,
    activeChatIndex: null,
    unique_id: document.getElementById("login_user_unique_id").value,
};
let user = {

    id: parseInt(document.getElementById("login_user_id").value),
    name: document.getElementById("login_user_name").value,
    unique_id: document.getElementById("login_user_unique_id").value,
    email: document.getElementById("login_user_email").value,
    pic: "assets/images/profile-picture.webp"
};
let userGroupList = [];

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


let areaSwapped = false;

let chat = null;

let chatList = [];
let pagnicateChatList = [];

let lastDate = "";
let offset = 0;
let isLoadingMore = false;
let currentPage = 1;
let loading = false;

let populateGroupList = async () => {
    chatList = [];
    let present = {};

    try {
        const id = document.getElementById("login_user_id").value;
        const unique_id = document.getElementById("login_user_unique_id").value;

        const response = await fetch(`get-user-chat-groups?id=${encodeURIComponent(id)}&page=1`, {
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
            chat.unread = 0;

            if (group.group_messages && group.group_messages.length > 0) {
                group.group_messages.reverse().forEach(msg => {
                    chat.msg = msg;
                    chat.time = new Date(msg.time * 1000);

                    const seenBy = msg.seen_by ? msg.seen_by.split(",").map(s => s.trim()) : [];
                    chat.unread += (msg.sender !== unique_id && !seenBy.includes(unique_id)) ? 1 : 0;
                });
            }

            if (present[chat.name] !== undefined) {
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
                let messageText = null;
                if (latestMessage != undefined && 'type' in latestMessage) {
                    if (latestMessage.type === "File" || latestMessage.type === "Image" || latestMessage.type === "Audio") {
                        console.log("latestMessage", latestMessage);
                        messageText = latestMessage.media_name;
                    }
                    else {
                        messageText = latestMessage.msg;
                    }
                }
                else {
                    messageText = "No messages";
                }

                const senderName = latestMessage && latestMessage.user ? latestMessage.user.name : "";
                const timeText = elem.time ? mDate(elem.time).chatListFormat() : "No messages";
                DOM.chatList.innerHTML += `
            <input type="hidden" id="group-id" value="${elem.group.group_id}"></input>
            <div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom ${unreadClass}" data-group-id="${elem.group.group_id}" onclick="generateMessageArea(this, ${index})">
              <img src="${elem.group.pic ? elem.group.pic : 'https://static.vecteezy.com/system/resources/previews/012/574/694/non_2x/people-linear-icon-squad-illustration-team-pictogram-group-logo-icon-illustration-vector.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
              <div class="w-50">
                <div class="name list-user-name">${elem.group.name}</div>
                <div class="small last-message">${elem.isGroup ? senderName + ": " : ""}${messageText}</div>
              </div>

              <div class="flex-grow-1 text-right">
                <div class="small time">${timeText}</div>
                ${elem.unread > 0 ? "<div class=\"badge badge-success badge-pill small\" id=\"unread-count\">" + elem.unread + "</div>" : ""}
              </div>
            </div>`;
            }
        });

};

let generateChatList = async () => {
    await populateGroupList();
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

    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleTimeString('en-US', optionsTime).replace(':00', '');
    } else {
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

//     window.Echo.channel('vmChat').listen('.Chat', (message) => {
// Client-side code
socket.on('deleteMessage', (messageId) => {
    var messageElement = $('[data-message-id="' + messageId + '"]').closest('.ml-3');
    if (messageElement) {
        messageElement.remove();
        viewChatList();
    }
    else {
        viewChatList();
    }
});
socket.on('updateGroupMessages', (messageId) => {
    const groupId = DOM.groupId;
    if (DOM.groupId != null || DOM.groupId != undefined) {
        const group = chatList.find(group => group.group.group_id === groupId);
        if (group) {
            const messageIndex = group.group.group_messages.findIndex(message => message.id === messageId);
            if (messageIndex !== -1) {
                group.group.group_messages.splice(messageIndex, 1);
                group.unread -= 1
            }
            viewChatList();
        }
    }
    else {
        const group = chatList.find(group => {
            return group.group.group_messages.find(message => message.id === messageId);
        });
        if (group) {
            const messageIndex = group.group.group_messages.findIndex(message => message.id === messageId);
            if (messageIndex !== -1) {
                group.group.group_messages.splice(messageIndex, 1);
                group.unread -= 1
            }
            viewChatList();
        }
    }
});

socket.on('sendChatToClient', (message) => {

    let unique_id = document.getElementById("login_user_unique_id").value;

    const groupId = message.group_id;
    let groupToUpdate = chatList.find(chat => chat.group.group_id === message.group_id);
    if (groupToUpdate && groupToUpdate.group.group_id === DOM.groupId) {
        groupToUpdate.group.group_messages.push(message);
        groupToUpdate.msg = message;
        groupToUpdate.time = new Date(message.time * 1000);
        const seenBy = message.seen_by ? message.seen_by.split(",").map(s => s.trim()) : [];
        if (message.sender !== unique_id && !seenBy.includes(unique_id)) {
            groupToUpdate.unread += 1;
        }
        chatList.sort((a, b) => {
            if (a.time && b.time) {
                return new Date(b.time) - new Date(a.time);
            } else if (a.time) {
                return -1;
            } else if (b.time) {
                return 1;
            } else {
                return 0;
            }
        });
        viewChatList();
        addMessageToMessageArea(message);
    } else {
        groupToUpdate.group.group_messages.push(message);
        groupToUpdate.msg = message;
        groupToUpdate.time = new Date(message.time * 1000);
        const seenBy = message.seen_by ? message.seen_by.split(",").map(s => s.trim()) : [];
        if (message.sender !== unique_id && !seenBy.includes(unique_id)) {
            groupToUpdate.unread += 1;
        }
        chatList.sort((a, b) => {
            if (a.time && b.time) {
                return new Date(b.time) - new Date(a.time);
            } else if (a.time) {
                return -1;
            } else if (b.time) {
                return 1;
            } else {
                return 0;
            }
        });
        viewChatList();
    }
});

let addMessageToMessageArea = (message) => {
    console.log("message", message);
    let msgDate = mDate(message.time).getDate();

    if (lastDate !== msgDate) {
        addDateToMessageArea(msgDate);
        lastDate = msgDate;
    }

    let profileImage = `<img src="${message.user?.pic ?? 'assets/images/Alsdk120asdj913jk.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px; width:50px;">`;
    let senderName = message.user.name;

    // Determine the message content based on the message type
    let messageContent;
    if (message.type === 'File') {
        messageContent = `
            <div class="file-message">
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                        <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                    </svg>
                </div>
                <div class="file-details">
                    <p class="file-name">${message.media_name}</p>

                </div>
                <a href="${message.message ?? message.msg}" target="_blank" download="${message.media_name}" class="download-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                    </svg>
                </a>
            </div>
        `;
    } else if (message.type === 'Image') {
        messageContent = `
            <img src="${message.message ?? message.msg}" style="height:222px; width:54;">
        `;
    } else if (message.type === 'Message' || message.type === null) {
        messageContent = message.message ?? message.msg;
    }
    else if (message.type === 'Audio') {
        messageContent = `
        <p>${message.media_name}</p>
            <p>${message.message ?? message.msg}</p>
        `;
    }

    // Append the message content to the message area
    DOM.messages.innerHTML += `
        <div class="ml-3">
            ${message.user.id == user.id ? '' : profileImage}
            <div class="">
                <div class="align-self-${message.user.id == user.id ? 'end self' : 'start'} d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item ${message.user.id == user.id ? 'right-nidle' : 'left-nidle'}" data-message-id="${message.id}">
                    <div style="margin-top:-4px">
                        <div class="shadow-sm" style="background:${message.user.id == user.id ? '#dcf8c6' : 'white'}; padding:10px; border-radius:5px;">
                            ${messageContent}
                        </div>
                        <div>
                            <div style="color: #463C3C; font-size:14px; font-weight:400; margin-top: 10px; width: 100%; background-color: transparent;">
                                <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">${senderName}</span> |
                                <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">(${makeformatDate(new Date(message.time * 1000))})</span> |
                                <span>
                                    <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" data-toggle="modal" data-target="#seenModal" data-message-id="${message.id}">Seen</a>
                                </span> |
                                <span>
                                    <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" id="reply-link" onclick="showReply()" data-message-id="${message.id}">Reply</a>
                                </span> |
                                <span>
                                    <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
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


// DOM.messages.addEventListener('scroll', () => {
//     if (DOM.messages.scrollTop === 0) {
//         fetchNextPageMessages();
//     }
// });
// const fetchNextPageMessages = async () => {
//     currentPage++;

//     // Get the current scroll height before loading new messages
//     const currentScrollHeight = DOM.messages.scrollHeight;

//     const response = await fetch(`get-groups-messages-by-group-id?groupId=${encodeURIComponent(chat.group.group_id)}&page=${currentPage}`, {
//       method: 'GET',
//       headers: {
//         'content-type': 'application/json'
//       }
//     });

//     const nextPageMessages = await response.json();

//     pagnicateChatList.data = [...nextPageMessages.data, ...pagnicateChatList.data];

//     // Clear the current message area
//     DOM.messages.innerHTML = '';

//     pagnicateChatList.data.reverse().forEach((msg) => {
//         // Add each message to the DOM (message area)
//         addMessageToMessageArea(msg);
//     });

//     DOM.messages.scrollTop = DOM.messages.scrollHeight - currentScrollHeight;

// };

let generateMessageArea = async (elem, chatIndex) => {

    pagnicateChatList = [];
    chat = chatList[chatIndex];

    DOM.activeChatIndex = chatIndex;

    DOM.messages.innerHTML = '';

    // DOM.groupId = chat.group.group_id;
    DOM.groupId = elem.dataset.groupId;

    mClassList(DOM.inputArea).contains("d-none", (elem) => elem.remove("d-none").add("d-flex"));
    mClassList(DOM.messageAreaOverlay).add("d-none");

    [...DOM.chatListItem].forEach((elem) => mClassList(elem).remove("active"));

    // update read status of each using message utils from
    // mClassList(elem).contains("unread", () => {
    //     MessageUtils.changeStatusById({
    //         isGroup: chat.isGroup,
    //         id: chat.isGroup ? chat.group.id : chat.contact.id
    //     });
    //     mClassList(elem).remove("unread");
    //     mClassList(elem.querySelector("#unread-count")).add("d-none");
    // });

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

    const response = await fetch(`get-groups-messages-by-group-id?groupId=${encodeURIComponent(DOM.groupId)}&page=1`, {
        method: 'GET',
        headers: {
            'content-type': 'application/json'
        }
    });
    pagnicateChatList = await response.json();

    const ids = pagnicateChatList.data.map(item => item.id);

    try {
        const response = await fetch("message/seen-by/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({ ids }),
        });

        const readMessageResponse = await response.json();
    } catch (error) {
        console.log(error);
    }

    lastDate = "";
    pagnicateChatList.data.reverse()
        .forEach((msg) => addMessageToMessageArea(msg));
};

let showChatList = () => {
    if (areaSwapped) {
        mClassList(DOM.chatListArea).remove("d-none").add("d-flex");
        mClassList(DOM.messageArea).remove("d-flex").add("d-none");
        areaSwapped = false;
    }
};

let sendMessage = (type = 'Message', mediaName = null) => {
    var loginUser = {
        id: document.getElementById("login_user_id").value,
        name: document.getElementById("login_user_name").value,
        unique_id: document.getElementById("login_user_unique_id").value,
        email: document.getElementById("login_user_email").value
    }
    let value = DOM.messageInput.value;
    if (value === "") return;
    let csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    let msg = {
        user: loginUser,
        message: value,
        reply_id: '',
        group_id: DOM.groupId,
        type: type,
        mediaName: mediaName,
        time: Math.floor(Date.now() / 1000),
        csrf_token: csrfToken
    };
    socket.emit('sendChatToServer', msg);
    DOM.messageInput.value = "";
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
    const firebaseConfig = {
        apiKey: "AIzaSyA8spaZnrsTPHRM-c-Cvybu6fJD-o8CMAQ",
        authDomain: "vm-chat-5c18d.firebaseapp.com",
        projectId: "vm-chat-5c18d",
        storageBucket: "vm-chat-5c18d.appspot.com",
        messagingSenderId: "644255696505",
        appId: "1:644255696505:web:72499c9aa2772cdc2836a8"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig); // Initialize Firebase app
    }

    console.log("Click the Image at top-left to open settings.");
};

init();

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

                const ref = firebase.storage().ref("audio/" + DOM.unique_id);
                const mediaName = "recording.wav";
                const metadata = {
                    contentType: 'audio/wav'
                };
                const task = ref.child(mediaName).put(blob, metadata);
                task
                    .then(snapshot => snapshot.ref.getDownloadURL())
                    .then(url => {
                        console.log(url);
                        DOM.messageInput.value = url;
                        sendMessage("Audio", mediaName);
                    })
                    .catch(error => console.error(error));


                // const downloadLink = document.createElement('a');
                // downloadLink.href = audioUrl;
                // downloadLink.download = 'recording.wav';
                // document.body.appendChild(downloadLink);
                // downloadLink.click();
                // document.body.removeChild(downloadLink);

                chunks = [];
                chatInputContainer.classList.remove('recording-active');
                voiceIcon.classList.remove('recording');

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


fileIcon.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (event) => {

    const file = event.target.files[0];

    const ref = firebase.storage().ref("files/" + DOM.unique_id);
    const mediaName = file.name;
    const metadata = {
        contentType: file.type
    };
    const task = ref.child(mediaName).put(file, metadata);
    task
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => {
            console.log(url);
            DOM.messageInput.value = url;
            sendMessage("File", mediaName);
        })
        .catch(error => console.error(error));
});


document.getElementById('input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

// delete model
$('#deleteModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var messageId = button.data('message-id');
    $(this).find('.btn-delete').data('message-id', messageId);
});

$('#deleteModal .btn-delete').on('click', function () {
    var messageId = $(this).data('message-id');
    var messageElement = $('[data-message-id="' + messageId + '"]').closest('.ml-3');
    let csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    fetch('message/delete/' + messageId, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
        },
    })
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Error deleting message');
            }
        })
        .then(function () {
            $('#btn-close').trigger('click');
            const groupId = DOM.groupId;
            const group = chatList.find(group => group.group.group_id === groupId);
            if (group) {
                const messageIndex = group.group.group_messages.findIndex(message => message.id === messageId);
                if (messageIndex !== -1) {
                    group.group.group_messages.splice(messageIndex, 1);
                }
            }

            $("#deleteModal").on('hide.bs.modal', function () { });
            $('#deleteModal').removeClass('show');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            messageElement.remove();
            socket.emit('deleteMessage', messageId);
        })
        .catch(function (error) {
            console.error(error);
        });
});

// Seen Model
$("#seenModal").on("show.bs.modal", async function (event) {

    let deleteBtn = $(event.relatedTarget);
    let messageId = deleteBtn.data("message-id");
    try {
        const response = await fetch("message/seen-by/" + messageId);
        const messageStatus = await response.json();

        const names = messageStatus.data.join(', ');
        document.getElementById('is_read').innerHTML = names;
    } catch {
        console.log("Something went wrong");
    }
})

const captureId = document.getElementById('captureid');
const cameraContainer = document.getElementById('camera-container');
const video = document.getElementById('camera-stream');
const canvas = document.getElementById('snapshot');
const photo = document.getElementById('photo');
const captureBtn = document.getElementById('capture-btn');
const switchCameraBtn = document.getElementById('switch-camera-btn');
const closeBtn = document.getElementById('close-btn');
const photoOptions = document.getElementById('photo-options');
const sendBtn = document.getElementById('send-btn');
const retakeBtn = document.getElementById('retake-btn');
const hiddenFileInput = document.getElementById('hidden-file-input');
const context = canvas.getContext('2d');
let currentStream = null;
let currentFacingMode = 'user';

function generateRandomFileName() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `image_${timestamp}_${random}.png`;
}

async function startCamera(facingMode) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode }
        });
        video.srcObject = stream;
        currentStream = stream;
    } catch (err) {
        console.error("Error accessing camera: ", err);
    }
}

captureId.addEventListener('click', () => {
    cameraContainer.style.display = 'flex';
    startCamera(currentFacingMode);
});

captureBtn.addEventListener('click', async () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    const blob = await (await fetch(dataUrl)).blob();
    const fileName = generateRandomFileName();
    const file = new File([blob], fileName, { type: 'image/png' });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    hiddenFileInput.files = dataTransfer.files;

    photo.src = dataUrl;
    photo.style.display = 'block';
    photoOptions.style.display = 'block';

    video.style.display = 'none';
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
});

sendBtn.addEventListener('click', () => {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    cameraContainer.style.display = 'none';
    const imageInput = document.getElementById('hidden-file-input');

    if (imageInput.files.length > 0) {
        const image = imageInput.files[0];
        const ref = firebase.storage().ref("images/" + DOM.unique_id);
        const mediaName = image.name;
        const metadata = {
            contentType: image.type
        };
        const task = ref.child(mediaName).put(image, metadata);
        task
            .then(snapshot => snapshot.ref.getDownloadURL())
            .then(url => {
                console.log(url);

                DOM.messageInput.value = url;
                sendMessage("Image", mediaName);

            })
            .catch(error => console.error(error));

    } else {
        console.log("No image selected");
    }


});

retakeBtn.addEventListener('click', () => {
    photo.style.display = 'none';
    photoOptions.style.display = 'none';
    video.style.display = 'block';
    startCamera(currentFacingMode);
});

switchCameraBtn.addEventListener('click', () => {
    currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
    startCamera(currentFacingMode);
});

closeBtn.addEventListener('click', () => {
    cameraContainer.style.display = 'none';
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
});

cameraContainer.addEventListener('click', (e) => {
    if (e.target === cameraContainer) {
        cameraContainer.style.display = 'none';
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
    }
});


//search groups

let groupSearchField = document.getElementById("search_group");
let debounceTimeout = null;

groupSearchField.addEventListener("input", function (event) {
    if (event.target.value.length > 0) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async function () {
            const url = `search-group-by-name/${event.target.value}`
            try {
                const groupResponse = await fetch(url);
                const response = await groupResponse.json();
                if (response) {
                    console.log(response);
                }
            } catch (error) {
                console.log(error);
            }
        }, 500);
    }
});


// get unread message groups
let unreadGroup = document.getElementById("unread");
unreadGroup.addEventListener("click", async function (e) {
    try {
        const url = `get-unread-chat-groups`;
        const unreadConversationGroupResponse = await fetch(url);
        const response = await unreadConversationGroupResponse.json();
        console.log("response", response);
    }
    catch (error) {
        console.log(error);
    }
})

let searchMessageInputFeild = document.getElementById("messsage_search_query");

searchMessageInputFeild.addEventListener("input", function (e) {
    if (e.target.value.length >0) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async function () {
            const url = `message/search/${e.target.value}/${DOM.groupId}`;
            try {
                fetch(url)
                    .then(response => response.json())
                    .then(messageResponse => {
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            }
            catch (error) {
                console.log(error);
            }
        }, 500)
    }
})
