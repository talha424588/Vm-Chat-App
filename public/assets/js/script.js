
let getById = (id, parent) => parent ? parent.getElementById(id) : getById(id, document);
let getByClass = (className, parent) => parent ? parent.getElementsByClassName(className) : getByClass(className, document);

const socket = io('http://localhost:3000');

const DOM = {
    chatListArea: getById("chat-list-area"),
    messageArea: getById("message-area"),
    inputArea: getById("input-area"),
    chatList: getById("chat-list"),
    chatList2: getById("chat-list2"),
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
    unreadMessagesPerGroup: {},
    unread_messages_count: 0,
    activeChatIndex: null,
    unique_id: document.getElementById("login_user_unique_id").value,
    replyId: null,
    moveMessageUser: null,
    messagesList: getById("messagesList"),
    fcmToken:null
};
let user = {

    id: parseInt(document.getElementById("login_user_id").value),
    name: document.getElementById("login_user_name").value,
    unique_id: document.getElementById("login_user_unique_id").value,
    email: document.getElementById("login_user_email").value,
    fcm_token: document.getElementById("login_user_fcm_token").value,
    seen_privacy: document.getElementById("login_user_seen_privacy").value,
    role: document.getElementById("login_user_role").value,
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
let chatList2 = [];
let messageList = [];
let pagnicateChatList = [];

let lastDate = "";
let offset = 0;
let isLoadingMore = false;
let currentPage = 1;
let loading = false;

let populateGroupList = async () => {
    chatList = [];
    chatList2 = [];
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

            DOM.unreadMessagesPerGroup[group.group_id] = chat.unread;

            if (present[chat.name] !== undefined) {
                chatList[present[chat.name]].unread += chat.unread;

            } else {
                present[chat.name] = chatList.length;
                chatList.push(chat);
            }
            //console.log("1st hit Updated unread messages count:",  DOM.unreadMessagesPerGroup[group.group_id]);
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
    DOM.chatList2.innerHTML="";
    chatList.sort((a, b) => {
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
                        // console.log("latestMessage", latestMessage);
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


 DOM.chatList2.innerHTML += `
            <div style="width:95%; margin-left:10px;" class="d-flex flex-row  p-2 border-bottom align-items-center tohide${unreadClass}" data-group-id="${elem.group.group_id}" onclick="selectUsertosend('${elem.group.name}','${elem.group.group_id}')">
                <input type="radio" name="chatSelection" class="chat-radio" style="margin-right: 10px;" onclick="selectUsertosend('${elem.group.name}','${elem.group.group_id}')">
                <img src="${elem.group.pic ? elem.group.pic : 'https://static.vecteezy.com/system/resources/previews/012/574/694/non_2x/people-linear-icon-squad-illustration-team-pictogram-group-logo-icon-illustration-vector.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
                <div class="w-50">
                    <div class="name list-user-name">${elem.group.name}</div>

                </div>
            </div>`;

                DOM.chatList.innerHTML += `
            <input type="hidden" id="group-id" value="${elem.group.group_id}"></input>
            <div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom tohide${unreadClass}" data-group-id="${elem.group.group_id}" onclick="generateMessageArea(this, ${index})">
              <img src="${elem.group.pic ? elem.group.pic : 'https://static.vecteezy.com/system/resources/previews/012/574/694/non_2x/people-linear-icon-squad-illustration-team-pictogram-group-logo-icon-illustration-vector.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
              <div class="w-50">
                <div class="name list-user-name">${elem.group.name}</div>
                <div class="small last-message">${elem.isGroup ? senderName + ": " : ""}${messageText}</div>
              </div>

              <div class="flex-grow-1 text-right">
                <div class="small time">${timeText}</div>
               ${elem.unread > 0 ? `<div class="${elem.group.group_id} badge badge-success badge-pill small" id="unread-count">${elem.unread}</div>` : ""}
    </div>
            </div>`;



            }
        });
};

let viewMessageList = () => {

    DOM.messagesList.innerHTML = `
    <div class="heading">
        <h2>Messages</h2>
    </div>
`;
    messageList.sort((a, b) => {
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
            let unreadClass = elem.unread ? "unread" : "";
            DOM.clickSearchMessageId = elem.id;
            const senderName = elem.user.name;
            let time = new Date(elem.time * 1000)
            const timeText = elem.time ? mDate(time).chatListFormat() : "No messages";
            let messageText = elem.msg.includes("<p>") ? elem.msg.replace(/<\/?p>/g, "") : elem.msg;
            DOM.messagesList.innerHTML += `
            <input type="hidden" id="group-id" value="${elem.group.group_id}"></input>
            <div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom tohide${unreadClass}" data-group-id="${elem.group.group_id}" onclick="generateMessageArea(this, ${index},1)">
              <img src="${elem.group.pic ? elem.group.pic : 'https://static.vecteezy.com/system/resources/previews/012/574/694/non_2x/people-linear-icon-squad-illustration-team-pictogram-group-logo-icon-illustration-vector.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
              <div class="w-50">
                <div class="name list-user-name">${elem.group.name}</div>
                <div class="small last-message">${elem ? senderName + ": " : ""}${messageText}</div>
              </div>

              <div class="flex-grow-1 text-right">
                <div class="small time">${timeText}</div>
               ${elem.unread > 0 ? `<div class="${elem.group.group_id} badge badge-success badge-pill small" id="unread-count">${elem.unread}</div>` : ""}
    </div>
            </div>`;
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
        const notificationValue = 5;
        const notificationDiv = document.getElementById('notification-count');
        notificationDiv.textContent = notificationValue;
        notificationDiv.style.display = 'block';
        DOM.messages.innerHTML += `
        <div class="notification-wrapper">
            <div class="unread-messages">
                ${notificationValue} UNREAD MESSAGES
            </div>
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
        if (message.sender !== unique_id && (!seenBy || !seenBy.includes(unique_id)) && DOM.groupId != groupToUpdate.group.group_id) {
            groupToUpdate.unread += 1;
            DOM.unreadMessagesPerGroup[groupId] += 1;
        } else if (seenBy && seenBy.includes(unique_id)) {
            // Login user message leave it,
        } else {
            updateMessageSeenBy([groupToUpdate.msg.id,]);
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
        get_voice_list();
    } else {
        groupToUpdate.group.group_messages.push(message);
        groupToUpdate.msg = message;
        groupToUpdate.time = new Date(message.time * 1000);
        const seenBy = message.seen_by ? message.seen_by.split(",").map(s => s.trim()) : [];
        if (message.sender !== unique_id && !seenBy.includes(unique_id)) {
            groupToUpdate.unread += 1;

            DOM.unreadMessagesPerGroup[groupId] += 1;
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

socket.on('moveMessage', () => {
    generateChatList();
});

let addMessageToMessageArea = (message) => {
    let msgDate = mDate(message.time).getDate();

    if (lastDate !== msgDate) {
        addDateToMessageArea(msgDate);
        lastDate = msgDate;
    }

    let profileImage = `<img src="${message.user?.pic ?? 'assets/images/Alsdk120asdj913jk.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px; width:50px;">`;
    let senderName = message.user.name;

    let messageContent;

  console.log(message);



    if (message.type === 'File') {
        if (message.reply) {
            console.log("Reply Message: " + message.reply.msg);
            if(message.reply.type==='Image'){
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
            }else if(message.reply.type==='File'){
                var message_body = ` <div class="file-message" >
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                        <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                    </svg>
                </div>
                <div class="file-details">
                    <p class="file-name">File</p>

                </div>
                <a href="#"  class="download-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                    </svg>
                </a>
            </div>`;
            }else if(message.reply.type==='Audio'){
                var message_body = `<div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${message.msg}">
            <div class="avatar">
                <!-- Avatar image here -->
            </div>
            <div class="audio-content">
                <div class="audio-controls">
                    <button class="playbutton">
                        <img src="assets/img/play-icon.svg" alt="Play" />
                    </button>
                    <div class="audio-progress">
                        <div class="progress-filled"></div>
                    </div>
                </div>
                <div class="audio-time-container">
                    <span class="audio-duration">0:00</span>
                    <span class="audio-time">12:27 PM</span>
                </div>
            </div>
        </div>`;
            }else{
                var message_body=message.reply.msg;
            }
            var add_file_view = `
            <div class="file-message"  onclick="scrollToMessage('${message.reply.id}')">
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

            messageContent = `
            <div class="file-message">
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                        <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                    </svg>
                </div>
                <div class="file-details">
                    <p class="file-name">${add_file_view}</p>

                </div>
                <a href="${message.message ?? message.msg}" target="_blank" download="${message.media_name}" class="download-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                    </svg>
                </a>
            </div>

            `;
        } else {
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
        }
    } else if (message.type === 'Image') {
        if (message.reply) {
            // Determine the type of reply and set the message_body accordingly
            if (message.reply.type === 'Image') {
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
            } else if (message.reply.type === 'File') {
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
            } else if (message.reply.type === 'Audio') {
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
            } else {
                var message_body = message.reply.msg;
            }

            // Message content (modify the img to match your use case)
            var message_new = `<img src="${message.message ?? message.msg}" style="height:222px; width:54;">`;

            // Set messageContent and include an onclick that scrolls to the replied message
            messageContent = `
                <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}')"> <!-- Add onclick here -->
                    <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                        ${message.user?.id == user?.id ? message.user.name : message.user.name}
                    </div>
                    <div class="reply-details">
                        <p class="file-name">${message_body}</p>
                    </div>
                </div>
                <div class="reply-message-area">${message_new}</div>
            `;
        }
        else {

            messageContent = `
            <img src="${message.message ?? message.msg}" style="height:222px; width:54;">
        `;
        }
    } else if (message.type === 'Message' || message.type === null) {

        if (message.reply) {


            if(message.reply.type==='Image'){
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
            }else if(message.reply.type==='File'){
                var message_body = ` <div class="file-message" >
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                        <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                    </svg>
                </div>
                <div class="file-details">
                    <p class="file-name">File</p>

                </div>
                <a href="#"  class="download-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                    </svg>
                </a>
            </div>`;
            }else if(message.reply.type==='Audio'){
                var message_body = `<div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${message.msg}">
            <div class="avatar">
                <!-- Avatar image here -->
            </div>
            <div class="audio-content">
                <div class="audio-controls">
                    <button class="playbutton">
                        <img src="assets/img/play-icon.svg" alt="Play" />
                    </button>
                    <div class="audio-progress">
                        <div class="progress-filled"></div>
                    </div>
                </div>
                <div class="audio-time-container">
                    <span class="audio-duration">0:00</span>
                    <span class="audio-time">12:27 PM</span>
                </div>
            </div>
        </div>`;
            }else{
                var message_body=message.reply.msg;
            }

            console.log("Reply Message: " + message.reply.msg);

            messageContent = `
            <div class="reply-message-div"  onclick="scrollToMessage('${message.reply.id}')">
                <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                  ${message.user?.id == user?.id ? message.user.name : message.user.name}

                </div>
                <div class="reply-details">
                    <p class="file-name">${message_body}</p>
                </div>
            </div>
            <div class="reply-message-area">${messageContent || (message.message ?? message.msg)}</div> <!-- Updated this line -->
        `;
        } else {
            messageContent = messageContent || (message.message ?? message.msg);
        }

    }
    else if (message.type === 'Audio') {
        const audioSrc = message.msg;

        messageContent = `

<div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${message.msg}">
            <div class="avatar">
                <!-- Avatar image here -->
            </div>
            <div class="audio-content">
                <div class="audio-controls">
                    <button class="play-button">
                        <img src="assets/img/play-icon.svg" alt="Play" />
                    </button>
                    <div class="audio-progress">
                        <div class="progress-filled"></div>
                    </div>
                </div>
                <div class="audio-time-container">
                    <span class="audio-duration">0:00</span>
                    <span class="audio-time">12:27 PM</span>
                </div>
            </div>
        </div>
    `;
    }

    DOM.messages.innerHTML += `
        <div class="ml-3">
            ${message.user.id == user.id ? '' : profileImage}

            <div class="" >
                <div class="align-self-${message.user.id == user.id ? 'end self' : 'start'} d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item ${message.user.id == user.id ? 'right-nidle' : 'left-nidle'}" data-message-id="${message.id}" id="message-${message.id}">
                    <div style="margin-top:-4px">
                        <div class="shadow-sm additional_style" style="background:${message.user.id == user.id ? '#dcf8c6' : 'white'};">
                            ${messageContent}
                        </div>
                        <div>
                            <div style="color: #463C3C; font-size:14px; font-weight:400; margin-top: 10px; width: 100%; background-color: transparent;">
                                <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">${senderName}</span> |
                                <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">(${makeformatDate(new Date(message.time * 1000))})</span> |
                                ${message.user.id == user.id ? `
                                    <span>
                                        <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;"
                                            data-toggle="modal" data-target="#seenModal" data-message-id="${message.id}">
                                            Seen
                                        </a>
                                    </span> |` : ''}

                                <span>
                                    <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" id="reply-link" onclick="showReply('${message.id}','${senderName}','${message.type}')" data-message-id="${message.id}">Reply</a>
                                </span>

                               <!--- | <span>
                                    <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
                                </span> ---->

                            </div>
                                      <!-- Dropdown menu for actions -->
                                      <!---
      ${message.sender === user.unique_id ? `
        <div class="dropdown" style="position: absolute; top: ${message.reply ? '10px' : (message.type === 'Message' ? '0px' : '10px')}; right: 10px;">
          <a href="#" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i class="fas fa-angle-down text-muted px-2"></i>
          </a>
          <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
         ${!['Audio', 'Image', 'File'].includes(message.type) ? `
        <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
          <a class="dropdown-item" href="#" onclick="CorrectionMessage('${message.id}','${senderName}')">Correction</a>
      ` : ''}
            <a class="dropdown-item" href="#" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
            <a class="dropdown-item" href="#" onclick="moveMessage(${message.id})">Move</a>

          </div>
        </div>
      ` : ''}---->

      ${message.sender === user.unique_id ? `
        <div class="dropdown" style="position: absolute; top: ${message.reply ? '10px' : (message.type === 'Message' ? '0px' : '10px')}; right: 10px;">
          <a href="#" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i class="fas fa-angle-down text-muted px-2"></i>
          </a>
          <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            ${!(user.role === '0' || user.role === '2') ? `
              <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
            ` : ''}
            ${user.role === '0' || user.role === '2' ? `
              <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
              <a class="dropdown-item" href="#" onclick="CorrectionMessage('${message.id}','${senderName}')">Correction</a>
              <a class="dropdown-item" href="#" onclick="moveMessage(${message.id})">Move</a>
            ` : ''}
            <!---
            ${user.role === '0' || user.role === '2' ? `
              <a class="dropdown-item" href="#" onclick="CorrectionMessage('${message.id}','${senderName}')">Correction</a>
            ` : ''}---->
            ${user.role === '0' || user.role === '2' ? `
              <a class="dropdown-item" href="#" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
            ` : ''}
            ${user.role === '3' && message.sender === user.unique_id ? `
              <a class="dropdown-item" href="#" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
            ` : ''}
          </div>
        </div>
      ` : ''}

                       </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    var messageDiv = document.getElementById("messages");
    var messageItems = messageDiv.getElementsByClassName("message-item");
    var count = messageItems.length;
    let exceededValue = 0;
    if (count > 20 && count % 20 !== 0) {
        exceededValue = count - 20;
        let unread = DOM.unreadMessagesPerGroup[DOM.groupId];
        console.log("In the Group and messages Added:", exceededValue);
        document.getElementById('scrollBottomBtn').style.display = 'block';
        const notificationDiv = document.getElementById('notification-count');
        notificationDiv.textContent = unread;
      if(unread!=0){
        notificationDiv.style.display = 'block';
                   }else{

                 scroll_function();

//                     scroll_function();

                   }

    }else{
        scroll_function();

    }
};
function scrollToMessage(messageId) {
    const targetMessage = document.getElementById(`message-${messageId}`);
    if (targetMessage) {
        // Find the nearest parent with class 'ml-3'
        const ml3Div = targetMessage.closest('.ml-3');

        if (ml3Div) {
            ml3Div.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add the highlight class to the parent .ml-3 div
            ml3Div.classList.add('selected-message');

            // Remove the highlight class after 3 seconds
            setTimeout(() => {
                ml3Div.classList.remove('selected-message');
            }, 3000); // 3 seconds
        }
    }
}




function scroll_function() {
    const messageDiv = document.getElementById('messages');
    const scrollBottomBtn = document.getElementById('scrollBottomBtn');

    if (!messageDiv || !scrollBottomBtn) {
        console.error("Required elements not found in the DOM.");
        return;
    }

    messageDiv.scrollTop = messageDiv.scrollHeight;

    messageDiv.addEventListener('scroll', function () {
        if (messageDiv.scrollTop < messageDiv.scrollHeight - messageDiv.clientHeight - 50) {
            scrollBottomBtn.style.display = 'block';
        } else {
            scrollBottomBtn.style.display = 'none';
        }
    });

    scrollBottomBtn.addEventListener('click', function () {
        messageDiv.scrollTo({
            top: messageDiv.scrollHeight,
            behavior: 'smooth'
        });
    });
}



let isTinyMCEInitialized = false;

function tinymce_init(callback) {
    if (!isTinyMCEInitialized) {
        tinymce.init({
            selector: '#input',
            toolbar: 'bold italic underline strikethrough',
            menubar: false,
            branding: false,
            height: 140,
            width: 1000,
            plugins: 'lists',
            toolbar_mode: 'wrap',
            placeholder: 'Write your message here which you want to be correct by the user or want any further change...',
            content_style: "body { font-family: Arial, sans-serif; font-size: 16px; }",
            setup: function (editor) {
                editor.on('init', function () {
                    isTinyMCEInitialized = true;

                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                });
            }
        });
    } else {
        if (callback && typeof callback === 'function') {
            callback();
        }
    }
}

function CorrectionMessage(message_id,  senderName) {

    const message = pagnicateChatList.data.find((message) => message.id === parseInt(message_id));
    var messagebody=message.msg;
    console.log(messagebody);
    tinymce_init(function () {
        correction_call(message_id, messagebody, senderName);
    });
}

function correction_call(message_id, messagebody, senderName) {

    if (tinymce.get('input')) {
        tinymce.get('input').setContent(messagebody);
    } else {
        console.error("TinyMCE editor not initialized for #input");
    }


    const correction_message_id = document.getElementById('correction_message_id');
    correction_message_id.value = message_id;

    const messageContent = tinymce.get('input').getContent();

    const messageElement = DOM.messages.querySelector(`[data-message-id="${message_id}"]`);
    console.log("messageElement", messageElement);
    const messageContentDiv = messageElement.querySelector('div.shadow-sm');
    messageContentDiv.innerHTML = messageContent;

    // Check and log voiceIcon and Editreplyarea
    const chat_actionss = document.getElementById('chat_action');
    chat_actionss.style.display = 'none';


    document.querySelector('.chat_action_file').style.display = 'none';

    document.querySelectorAll('.chat_action_file, .chat_action_capture, .chat_action_voice').forEach(function(element) {
        element.style.visibility = 'hidden';
    });

    const Editreplyarea = document.getElementById('correctionreply-area');

    if (Editreplyarea) {
        Editreplyarea.style.display = 'block';
    } else {
        console.error("Element 'correctionreply-area' not found");
    }

    var replyDiv = document.getElementById('correction-div');


    if (replyDiv) {
        replyDiv.style.display = 'block';
    } else {
        console.error("Element 'correction-div' not found");
    }

    var quotedTextElement = document.querySelector('#quoted-messages .sender-name');
    var quotedNameElement = document.querySelector('#quoted-messages .quoted-text');

    if (quotedTextElement) {
        quotedTextElement.textContent = senderName;
    } else {
        console.error("Element '#quoted-message .sender-name' not found");
    }

    if (quotedNameElement) {
        quotedNameElement.innerHTML = messagebody;

        // quotedNameElement.textContent = messagebody;
    } else {
        console.error("Element '#quoted-message .quoted-text' not found");
    }
}

function correction_send_handel() {

    const messageContent = tinymce.get('input').getContent();
    const correction_message_id = document.getElementById('correction_message_id').value;

    tinymce.remove('#input');
    isTinyMCEInitialized = false;
    removecorrectionMessage();
    document.getElementById('input').style.height = '44px';
    const textarea = document.getElementById('input');
    textarea.value = '';

    const correction_div = document.getElementById('correction-div');
    correction_div.style.display = 'none';
    const chat_action = document.getElementById('chat_action');
    chat_action.style.display = 'block';
    document.querySelector('.chat_action_file').style.display = 'block';

    const messageElement = DOM.messages.querySelector(`[data-message-id="${correction_message_id}"]`);
    const messageContentDiv = messageElement.querySelector('div.shadow-sm');
    messageContentDiv.innerHTML = messageContent;

    const messageIndex = pagnicateChatList.data.findIndex((message) => message.id === parseInt(correction_message_id));
    if (messageIndex !== -1) {
        pagnicateChatList.data[messageIndex].msg = messageContent;
    }
    let csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    fetch('message/correction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({
            id: correction_message_id,
            message: messageContent,
        }),
    })
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => console.error(error));

}

document.getElementById('correction-send-message-btn').addEventListener('click', correction_send_handel);

function removecorrectionMessage() {
    if (tinymce.get('input')) {
        tinymce.get('input').remove();
    }
    isTinyMCEInitialized = false;
    var replyDiv = document.getElementById('correction-div');
    var iconContainer = document.querySelector('.icon-container');
    const chat_action = document.getElementById('chat_action');
    const correctionarea = document.getElementById('correction-div');

    const Editreplyarea = document.getElementById('Editreply-area');

    const correctionreplyarea = document.getElementById('correctionreply-area');

    document.querySelectorAll('.chat_action_file, .chat_action_capture, .chat_action_voice').forEach(function(element) {
        element.style.display = 'block';
        element.style.visibility = 'visible';
    });


    if (chat_action) {
        chat_action.style.display = 'block';
        correctionarea.style.display = 'none';
        Editreplyarea.style.display = 'none';
        correctionreplyarea.style.display = 'none';
        const textarea = document.getElementById('input');
        textarea.value = ''; // Append with a newline if there's already text
    }

    // Select the element with the ID 'chat_action'
    document.querySelectorAll('.chat_action_file, .chat_action_capture, .chat_action_voice').forEach(function(element) {
        element.style.visibility = 'visible';
    });

    // Create a new style element
    var style = document.createElement('style');
    style.innerHTML = "#chat_action { display: flex !important; }";
    document.head.appendChild(style);
    replyDiv.style.display = 'none';
    iconContainer.style.bottom = '90px';
}

/*
const edit_file = document.querySelector('.edit_file');
edit_file.style.visibility = 'hidden';
const edit_capture = document.querySelector('.edit_capture');
edit_capture.style.visibility = 'hidden';
*/


function editMessage(messageId) {

    let editMessage = null;

    const message = pagnicateChatList.data.find((message) => message.id === parseInt(messageId));
    if (message) {
        editMessage = message.msg
    }
    else {
        const messageElement = DOM.messages.querySelector(`[data-message-id="${messageId}"]`);
        const messageContentDiv = messageElement.querySelector('div.shadow-sm');
        editMessage = messageContentDiv.innerHTML;
    }

    if (editMessage) {
        document.getElementById('editMessageDiv').style.display = 'block';

        const editMessageIdField = document.getElementById('edit_message_id');
        if (editMessageIdField) {
            editMessageIdField.value = messageId;
        }

        const editMessageContents = document.querySelectorAll('.EditmessageContent');
        editMessageContents.forEach((content) => {
            const sanitizedMessage = editMessage;
            content.innerHTML = sanitizedMessage;
        });

        const textarea = document.getElementById('input');
        textarea.value = editMessage.replace(/<\/?[^>]+(>|$)/g, "").trim();

        textarea.scrollTop = textarea.scrollHeight;

        const messageDiv = document.getElementById('messages');
        messageDiv.classList.add('blur');

        const chat_action = document.getElementById('chat_action');

        const Editreplyarea = document.getElementById('Editreply-area');
        const voiceIcon = document.getElementById('voice-icon');
        const fileicon = document.getElementById('file-icon');
        const captureid = document.getElementById('captureid');

        if (chat_action) {
            voiceIcon.style.display = 'none';

            Editreplyarea.style.display = 'block';
            voiceIcon.style.visibility = 'hidden';
            fileicon.style.visibility = 'hidden';
            captureid.style.visibility = 'hidden';
        }


    }
}


// Edit message area
function handleSendMessage() {

    document.getElementById('input').style.setProperty('height', '44px', 'important');
    document.querySelector('.auto-resize-textarea').style.setProperty('height', '44px', 'important');

    const messageId = document.getElementById('edit_message_id').value;
    let messageContent = document.getElementById('input').value;

    if(messageContent!==''){


    const messageIndex = pagnicateChatList.data.findIndex((message) => message.id === parseInt(messageId));
    console.log(messageIndex);
    if (messageIndex !== -1) {
        console.log("insidec");
        console.log(pagnicateChatList.data[messageIndex].msg = messageContent);
        console.log(pagnicateChatList);
        pagnicateChatList.data[messageIndex].msg = messageContent;
    }

    const editMessageDiv = document.getElementById('editMessageDiv');
    const editMessageContentDiv = editMessageDiv.querySelector('.EditmessageContent');
    editMessageContentDiv.innerHTML = messageContent;

    const messageElement = DOM.messages.querySelector(`[data-message-id="${messageId}"]`);
    const messageContentDiv = messageElement.querySelector('div.shadow-sm');
    messageContentDiv.innerHTML = messageContent;

    document.getElementById('input').value = "";
    let csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    fetch("message/update", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ id: messageId, message: messageContent.replace(/[\r\n]+/g, ' ') }),
    })
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => console.error(error));

    document.getElementById('editMessageDiv').style.display = 'none';
    const textarea = document.getElementById('input');
    textarea.value = '';
    const messageDiv = document.getElementById('messages');
    messageDiv.classList.remove('blur');
    const chat_action = document.getElementById('chat_action');
    chat_action.style.display = 'block';
    chat_action.style.display = 'flex';
    const Editreplyarea = document.getElementById('Editreply-area');

    Editreplyarea.style.display = 'none';
    const fileicon = document.querySelector('.chat_action_file');
    fileicon.style.visibility = 'visible';
    const chat_action_capture = document.querySelector('.chat_action_capture');
    chat_action_capture.style.visibility = 'visible';
    const chat_action_voice = document.querySelector('.chat_action_voice');
    chat_action_voice.style.visibility = 'visible';
    chat_action_voice.style.display = 'block';
    const correctionarea = document.getElementById('correction-div');
    correctionarea.style.display = 'none';
}else{
   // alert('Error');
}
}
// Add event listener to the send message button
document.getElementById('send-message-btn').addEventListener('click', handleSendMessage);

function removeEditMessage() {
    document.getElementById('editMessageDiv').style.display = 'none';
    const Editreplyarea = document.getElementById('Editreply-area');
    Editreplyarea.style.display = 'none';
    const correctionarea = document.getElementById('correction-div');
    correctionarea.style.display = 'none';


    const fileicon = document.querySelector('.chat_action_file');
    fileicon.style.visibility = 'visible';
    const chat_action_capture = document.querySelector('.chat_action_capture');
    chat_action_capture.style.visibility = 'visible';
    const chat_action_voice = document.querySelector('.chat_action_voice');
    chat_action_voice.style.visibility = 'visible';
    chat_action_voice.style.display = 'block';



    const messageDiv = document.getElementById('messages');
    messageDiv.classList.remove('blur');
    const textarea = document.getElementById('input');
    textarea.value = '';
    document.querySelector('.auto-resize-textarea').style.height = '44px';
}

//Show Reply Message
function showReply(message_id,senderName,type) {


    const message = pagnicateChatList.data.find((message) => message.id === parseInt(message_id));
    var messagebody=message.msg;
    console.log(messagebody);


    DOM.replyId = message_id;
    var replyDiv = document.getElementById('reply-div');
    var iconContainer = document.querySelector('.icon-container');




    var quotedTextElement = document.querySelector('#quoted-message .sender-name');
    quotedTextElement.textContent = senderName;

    var quotedNameElement = document.querySelector('#quoted-message .quoted-text');
    if(type==='Image'){
        var message_body = `<img src="${messagebody}" style="height:125px; width:125px;">`;
    }else if(type==='File'){
        var message_body = ` <div class="file-message" >
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                        <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                    </svg>
                </div>
                <div class="file-details">
                    <p class="file-name">File</p>

                </div>
                <a href="#"  class="download-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                    </svg>
                </a>
            </div>`;
    }else if(type==='Audio'){
        var message_body = `<div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${message.msg}">
            <div class="avatar">
                <!-- Avatar image here -->
            </div>
            <div class="audio-content">
                <div class="audio-controls">
                    <button class="playbutton">
                        <img src="assets/img/play-icon.svg" alt="Play" />
                    </button>
                    <div class="audio-progress">
                        <div class="progress-filled"></div>
                    </div>
                </div>
                <div class="audio-time-container">
                    <span class="audio-duration">0:00</span>
                    <span class="audio-time">12:27 PM</span>
                </div>
            </div>
        </div>`;
    }else{
        var message_body=messagebody;
    }
    quotedNameElement.innerHTML = message_body;

    replyDiv.style.display = 'block';

    iconContainer.style.bottom = '145px';
}

function removeQuotedMessage() {
    var replyDiv = document.getElementById('reply-div');
    var iconContainer = document.querySelector('.icon-container');
    replyDiv.style.display = 'none';
    iconContainer.style.bottom = '90px';
}

// Array to store selected message IDs
let selectedMessageIds = [];

function moveMessage(messageId) {
    const index = selectedMessageIds.indexOf(messageId);

    if (index > -1) {
        selectedMessageIds.splice(index, 1);
    } else {
        selectedMessageIds.push(messageId);
    }

    const messageElement = document.querySelector(`[data-message-id='${messageId}']`);

    if (messageElement) {
        const parentDiv = messageElement.closest('.ml-3');

        if (parentDiv) {
            parentDiv.classList.toggle('selected-message');
        } else {
            // console.error(`Parent .ml-3 div not found for message ID: ${messageId}.`);
        }

        $('#input-area').hide();

        $('#action-bar').show();

        document.getElementById('selected-count').textContent = `${selectedMessageIds.length} message${selectedMessageIds.length > 1 ? 's' : ''} selected`;

        document.getElementById('messages_ids').value = selectedMessageIds.join(',');

    } else {
        console.error(`Message with ID: ${messageId} not found.`);
    }
}

//Multiple Select Messages End
function moveSelectedMessagesToGroup(moveMessageIds, groupToMove) {
    const selectedMessages = moveMessageIds.map(id => {
        return {
            id: id,
            groupId: DOM.groupId,
        };
    });

    const newGroupId = groupToMove;
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    fetch('messages/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
            messages: selectedMessages,
            newGroupId: newGroupId,
        }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Update the UI to reflect the changes

            const previousGroupId = DOM.groupId;
            const previousGroupIndex = chatList.findIndex(group => group.group.group_id === previousGroupId);
            if (previousGroupIndex !== -1) {
                selectedMessageIds.forEach(id => {
                    const messageIndex = chatList[previousGroupIndex].group.group_messages.findIndex(message => message.id === id);
                    if (messageIndex !== -1) {
                        chatList[previousGroupIndex].group.group_messages.splice(messageIndex, 1);
                        chatList[previousGroupIndex].unread -= 1;

                        // Update the time property of the group
                        if (chatList[previousGroupIndex].group.group_messages.length > 0) {
                            chatList[previousGroupIndex].time = new Date(chatList[previousGroupIndex].group.group_messages[chatList[previousGroupIndex].group.group_messages.length - 1].time * 1000);
                        } else {
                            chatList[previousGroupIndex].time = null;
                        }
                    }
                });
            }

            // Add the message to the new group
            const newGroupIndex = chatList.findIndex(group => group.group.group_id === newGroupId);

            if (newGroupIndex !== -1) {
                data.forEach(newMessage => {
                    const messageIndex = chatList[newGroupIndex].group.group_messages.findIndex(message => message.time > newMessage.time);
                    if (messageIndex === -1) {
                        chatList[newGroupIndex].group.group_messages.push(newMessage);
                    } else {
                        chatList[newGroupIndex].group.group_messages.splice(messageIndex, 0, newMessage);
                    }
                    chatList[newGroupIndex].msg = newMessage;
                    chatList[newGroupIndex].time = new Date(newMessage.time * 1000);

                    // Update the last message text
                    const senderName = newMessage.user.name;
                    let messageText = '';
                    if (newMessage.type === 'File') {
                        messageText = newMessage.media_name;
                    } else if (newMessage.type === 'Image') {
                        messageText = '[Image]';
                    } else if (newMessage.type === 'Audio') {
                        messageText = '[Audio]';
                    } else {
                        messageText = newMessage.msg;
                    }
                    chatList[newGroupIndex].lastMessage = `${senderName}: ${messageText}`;
                });
            }

            // Update the chat list
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

            const newIndex = chatList.findIndex(group => group.group.group_id === newGroupId);

            viewChatList();

            socket.emit('moveMessage', selectedMessageIds, newGroupId, DOM.groupId);

            const newGroupChatListItem = document.querySelector(`[data-group-id="${newGroupId}"]`);
            generateMessageArea(newGroupChatListItem, newIndex);
            cancelMoveMessage();
            document.querySelector(".close").click();
        })
        .catch(error => console.error(error));


        document.getElementById('selected-count').textContent = '';
        document.getElementById('messages_ids').value = '';
        document.getElementById('group_to_move_message').value = '';
        selectedMessageIds = [];
        selectedMessageIds.length = 0; // Clears the array


}

document.getElementById('cancel-icon').addEventListener('click', function () {
    cancelMoveMessage();
});

function cancelMoveMessage() {
    document.querySelectorAll('.selected-message').forEach(function (element) {
        element.classList.remove('selected-message');
    });

    document.getElementById('action-bar').style.display = 'none';

    document.getElementById('input-area').style.display = 'block';

    document.getElementById('selected-count').textContent = 'Selected Messages: 0';

    console.log('Selected messages have been cleared and input area is displayed.');
}

document.getElementById("openModalTrigger").addEventListener("click", function () {
    var myModal = new bootstrap.Modal(document.getElementById('chatModal'));
    myModal.show();
});

function selectUsertosend(username, postgroup_id) {

    console.log("selectUsertosend");
    document.getElementById('selected-username').textContent = username;
    document.getElementById('group_to_move_message').value = postgroup_id;
    document.getElementById('selected-usertosend').style.setProperty('display', 'flex', 'important');
}

$(document).ready(function () {
    $('#MoveMessagetoGroup').on('click', function () {
        var messagesIds = $('#messages_ids').val();
        var groupToMove = $('#group_to_move_message').val();

        var messageIdArray = messagesIds.split(',');

        console.log(messageIdArray, groupToMove);
        moveSelectedMessagesToGroup(messageIdArray, groupToMove);
        document.getElementById('messages_ids').value = '';
        document.getElementById('group_to_move_message').value = '';
    });
});

let isLoadingMessages = false;
let hasMoreMessages = true;

// Listen for the scroll event
DOM.messages.addEventListener('scroll', async () => {

    if (DOM.messages.scrollTop <= 5 && !isLoadingMessages && hasMoreMessages) {
        isLoadingMessages = true;
        await fetchNextPageMessages();
        isLoadingMessages = false;
    } else if (DOM.messages.scrollTop !== 0) {
        //console.log('User is not at the top yet'); // Log if not at the top
    }
});

// Function to add a new message to the message area
let addNewMessageToArea = (message) => {
    let msgDate = new Date(message.time * 1000).getDate();

    if (lastDate !== msgDate) {
        addDateToMessageArea(msgDate);
        lastDate = msgDate;
    }
    let profileImage = `<img src="${message.user?.pic ?? 'assets/images/Alsdk120asdj913jk.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px; width:50px;">`;
    let senderName = message.user.name;

    let messageContent;
    switch (message.type) {
        case 'File':
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
            break;
        case 'Image':
            messageContent = `<img src="${message.message ?? message.msg}" style="height:222px; width:54px;">`;
            break;
        case 'Message':
        case null:
            messageContent = message.message ?? message.msg;
            break;
        case 'Audio':
            messageContent = `
                <p>${message.media_name}</p>
                <p>${message.message ?? message.msg}</p>
            `;
            break;
        default:
            messageContent = '';
    }

    // Create the message element as a DOM element
    let messageElement = document.createElement('div');
    messageElement.className = 'ml-3';

    messageElement.innerHTML = `
        ${message.user.id == user.id ? '' : profileImage}
        <div class="">
            <div class="align-self-${message.user.id == user.id ? 'end self' : 'start'} d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item ${message.user.id == user.id ? 'right-nidle' : 'left-nidle'}" data-message-id="${message.id}">
                <div style="margin-top:-4px">
                    <div class="shadow-sm additional_style" style="background:${message.user.id == user.id ? '#dcf8c6' : 'white'}; ">
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
                                <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" id="reply-link" onclick="showReply('${message.id}','${message.msg}','${senderName}','${message.type}')" data-message-id="${message.id}">Reply</a>
                            </span> <!---|
                            <span>
                                <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
                            </span>--->
                        </div>
                        ${message.sender === user.unique_id ? `
                        <div class="dropdown" style="position: absolute; top: ${message.reply ? '10px' : (message.type === 'Message' ? '0px' : '10px')}; right: 10px;">
                            <a href="#" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <i class="fas fa-angle-down text-muted px-2"></i>
                            </a>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                ${!['Audio', 'Image', 'File'].includes(message.type) ? `
        <a class="dropdown-item" href="#" onclick="editMessage('${message.id}','${message.msg}')">Edit</a>
      ` : ''}
                                <a class="dropdown-item" href="#" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
                                <a class="dropdown-item" href="#" onclick="moveMessage(${message.id})">Move</a>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    return messageElement;
};

const fetchNextPageMessages = async (message_id = null, current_Page = null) => {
    if (!message_id) {
        currentPage++;
    }
    const currentScrollHeight = DOM.messages.scrollHeight;

    try {
        const url = `get-groups-messages-by-group-id?groupId=${encodeURIComponent(chat.group.group_id)}&page=${currentPage}${message_id ? `&messageId=${encodeURIComponent(message_id)}&currentPage=${encodeURIComponent(current_Page)}` : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            }
        });
        const nextPageMessages = await response.json();
        unread_settings(nextPageMessages);

        const ids = nextPageMessages.data.map(item => item.id);

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
            console.error('Error updating seen messages:', error);
        }

        if (nextPageMessages.data.length === 0) {
            hasMoreMessages = false;
            console.log('No more messages to load');
            return;
        }

        nextPageMessages.data.forEach((msg) => {
            const newMessage = addNewMessageToArea(msg);
            DOM.messages.insertBefore(newMessage, DOM.messages.firstChild);

            if (msg.id === message_id) {

                const messageElement = DOM.messages.querySelector(`[data-message-id="${msg.id}"]`);
                if (messageElement) {
                    setTimeout(() => {
                        messageElement.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                    const searchQuery = searchMessageInputFeild.value.toLowerCase();
                    const messageTextElement = messageElement.querySelector(".shadow-sm");
                    const messageText = messageTextElement.textContent.toLowerCase();
                    const index = messageText.indexOf(searchQuery);
                    if (index !== -1) {
                        const highlightedText = messageText.substring(0, index) + `<span class="highlight">${messageText.substring(index, index + searchQuery.length)}</span>` + messageText.substring(index + searchQuery.length);
                        messageTextElement.innerHTML = highlightedText;
                    }
                }
            }
        });

        const newScrollHeight = DOM.messages.scrollHeight;
        DOM.messages.scrollTop = newScrollHeight - currentScrollHeight;

    } catch (error) {
        console.error('Error fetching messages:', error);
    }
};

function unread_settings(query_set) {
    var groupId = DOM.groupId;
    var groupIdToCheck = groupId;
    const userIdToCheck = user.unique_id;
    let seenCount = 0;
    let unseenCount = 0;
    query_set.data.forEach(message => {
        if (message.group_id === groupIdToCheck) {
            if (message.seen_by.includes(userIdToCheck)) {
                seenCount++;
            } else {
                unseenCount++;
            }
        }
    });

    var first_get_value = DOM.unreadMessagesPerGroup[DOM.groupId];
    var unseen = unseenCount;
    let groupToUpdate = chatList.find(chat => chat.group.group_id === groupId);
    var first_value = DOM.unreadMessagesPerGroup[DOM.groupId];
    var left_count = first_value - unseen;
    if (unseen > 0) {
        document.querySelector(`.${DOM.groupId}`).innerText = left_count;
        if (left_count == 0 || left_count < 0) {
            document.querySelector(`.${DOM.groupId}`).style.display = 'none';
        }
        if (groupToUpdate) {
            groupToUpdate.unread = left_count;
        }
        DOM.unreadMessagesPerGroup[DOM.groupId] = left_count;

    }
}

let currentlyPlayingAudio = null;

let generateMessageArea = async (elem, chatIndex, searchMessage = null) => {
    pagnicateChatList = [];
    chat = chatList[chatIndex];

    DOM.activeChatIndex = chatIndex;

    DOM.messages.innerHTML = '';

    DOM.groupId = elem.dataset.groupId;

    mClassList(DOM.inputArea).contains("d-none", (elem) => elem.remove("d-none").add("d-flex"));
    mClassList(DOM.messageAreaOverlay).add("d-none");

    [...DOM.chatListItem].forEach((elem) => mClassList(elem).remove("active"));

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

    if(searchMessage)
    {
        await fetchNextPageMessages(DOM.clickSearchMessageId,DOM.groupId);
    }
    else
    {
        const response = await fetch(`get-groups-messages-by-group-id?groupId=${encodeURIComponent(DOM.groupId)}&page=1`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            }
        });
        pagnicateChatList = await response.json();

        unread_settings(pagnicateChatList);

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

        var g_id = DOM.groupId;


        lastDate = "";
        pagnicateChatList.data.reverse()
            .forEach((msg) => addMessageToMessageArea(msg));

        get_voice_list();
        removeEditMessage();
        removeQuotedMessage();
    }


};


async function updateMessageSeenBy(ids)
{
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
}

let showChatList = () => {
    if (areaSwapped) {
        mClassList(DOM.chatListArea).remove("d-none").add("d-flex");
        mClassList(DOM.messageArea).remove("d-flex").add("d-none");
        areaSwapped = false;
    }
};

let sendMessage = (type = 'Message', mediaName = null) => {
    let csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    if (type == 'Message') {
        const numberPattern = /\b\d{7,}\b/;
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

        const fileIcon = document.querySelector('#file-icon');
        const chaticon = document.querySelector('#captureid');
        fileIcon.style.visibility = 'visible';
        chaticon.style.visibility = 'visible';
        let value = DOM.messageInput.value;
        if (value === "") return;
        let reason = '';
        if (value.match(numberPattern)) {
            reason = 'Contact Number';
        } else if (value.match(emailPattern)) {
            reason = 'Email Address';
        }
        if (reason !== '') {
            // Send "Alert!!!" as the message
            let alertMessage = "Alert!!!";
            // Send email to dev3@visamtion.org with details
            fetch('/alert-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    reason: reason,
                    message: value,
                })
            })
                .then(response => {
                    console.log(response);
                })
                .catch(error => {
                    console.error(error);
                });

            // Send "Alert!!!" to the backend to save in DB
            let msg = {
                user: user.fcm_token ? user:user.fcm_token = DOM.fcmToken,
                message: alertMessage,
                reply_id: DOM.replyId ?? "",
                group_id: DOM.groupId,
                type: type,
                mediaName: mediaName,
                time: Math.floor(Date.now() / 1000),
                csrf_token: csrfToken,
            };
            socket.emit('sendChatToServer', msg);
        } else {
            // Send original message to the backend to save in DB
            let msg = {
                user: user,
                message: value,
                reply_id: DOM.replyId ?? "",
                group_id: DOM.groupId,
                type: type,
                mediaName: mediaName,
                time: Math.floor(Date.now() / 1000),
                csrf_token: csrfToken
            };
            socket.emit('sendChatToServer', msg);
        }
        DOM.messageInput.value = "";
        DOM.replyId = null;
    }
    else {
        const fileIcon = document.querySelector('#file-icon');
        const chaticon = document.querySelector('#captureid');
        fileIcon.style.visibility = 'visible';
        chaticon.style.visibility = 'visible';
        let value = DOM.messageInput.value;
        if (value === "") return;
        let csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        let msg = {
            user: user,
            message: value,
            reply_id: DOM.replyId ?? "",
            group_id: DOM.groupId,
            type: type,
            mediaName: mediaName,
            time: Math.floor(Date.now() / 1000),
            csrf_token: csrfToken
        };
        socket.emit('sendChatToServer', msg);
        DOM.messageInput.value = "";
        DOM.replyId = null;
    }

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
        firebase.initializeApp(firebaseConfig);
    }

    console.log("Click the Image at top-left to open settings.");
};

init();

const messaging = firebase.messaging();

Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
        console.log('Notification permission granted.');

        // Get the FCM token
        messaging.getToken({ vapidKey: 'BKE8nRpsTvAloWUKNG18bhYFU2ZtSnnopWNxhS7oU6GQW_4U7ODY2a-2eJVIfEl_BU2XKO_NHzgVpp1tG6QXZh0' }).then((token) => {
            if (token) {
                let csrfToken = document.querySelector('meta[name="csrf-token"]').content;
                user.fcm_token = token;
                DOM.fcmToken = token;
                const updateUserFcmToken = fetch("user/update/" + token, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken,
                    },
                }).then(updateUserFcmToken => {
                    if (!updateUserFcmToken.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    document.getElementById("login_user_fcm_token").value = token;
                }).catch(error => {
                    console.log(error);
                }
                )
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        }).catch((err) => {
            console.log('An error occurred while retrieving token. ', err);
        });
    } else {
        console.log('Unable to get permission to notify.');
    }
});


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
    chunks = [];

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

                // Reset UI states
                chatInputContainer.classList.remove('recording-active');
                voiceIcon.classList.remove('recording');

                voiceSvg.innerHTML = `
					<circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61"/>
					<path d="M15.125 17.2143C16.8146 17.2143 18.1684 15.8504 18.1684 14.1607L18.1786 8.05357C18.1786 6.36393 16.8146 5 15.125 5C13.4354 5 12.0714 6.36393 12.0714 8.05357V14.1607C12.0714 15.8504 13.4354 17.2143 15.125 17.2143ZM20.5196 14.1607C20.5196 17.2143 17.9343 19.3518 15.125 19.3518C12.3157 19.3518 9.73036 17.2143 9.73036 14.1607H8C8 17.6316 10.7686 20.502 14.1071 21.0007V24.3393H16.1429V21.0007C19.4814 20.5121 22.25 17.6418 22.25 14.1607H20.5196Z" fill="white"/>
				`;
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

voiceIcon.addEventListener('click', () => {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') {
        startRecording();
    } else {
        mediaRecorder.stop();
    }
});

document.getElementById('captureid').addEventListener('click', function () {
    document.getElementById('hidden-file-input').click();
});

document.getElementById('hidden-file-input').addEventListener('change', function () {
    const imageInput = this;
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
    }
});

fileIcon.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (event) => {

    if(event.target.files[0])
    {
        const file = event.target.files[0];
        console.log("file",file);

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
    }
});

document.getElementById('input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const editReplyArea = document.getElementById('Editreply-area');
        if (window.getComputedStyle(editReplyArea).display === 'none') {
            console.log('The div is hidden (display: none).');
            event.preventDefault();
            sendMessage();
            document.querySelector('.auto-resize-textarea').style.height = '44px';
        } else if (window.getComputedStyle(editReplyArea).display === 'block') {

            document.getElementById('send-message-btn').addEventListener('click', handleSendMessage);
            document.querySelector('.auto-resize-textarea').style.height = '44px';

        } else {
            console.log('The div has a different display property.');
        }
        removeQuotedMessage();
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

//search groups

let groupSearchField = document.getElementById("search_group");
let debounceTimeout = null;

let searchGroups = async (searchQuery) => {
    if (searchQuery.length > 0) {
        const url = `search-group-by-name/${searchQuery}`;
        const unique_id = document.getElementById("login_user_unique_id").value;
        try {
            const groupResponse = await fetch(url);
            const response = await groupResponse.json();
            if (response) {
                const groups = response.data.groups;
                const messages = response.data.messages;
                if (groups.length > 0) {
                    chatList = [];
                    groups.forEach((group) => {
                        let chat = {};
                        chat.isGroup = true;
                        chat.group = group;
                        chat.group.access = [group.access];
                        chat.name = group.name;
                        chat.unread = 0;

                        if (group.group_messages && group.group_messages.length > 0) {
                            group.group_messages.reverse().forEach((msg) => {
                                chat.msg = msg;
                                chat.time = new Date(msg.time * 1000);

                                const seenBy = msg.seen_by ? msg.seen_by.split(",").map((s) => s.trim()) : [];
                                chat.unread += (msg.sender !== unique_id && !seenBy.includes(unique_id)) ? 1 : 0;
                            });
                        }

                        chatList.push(chat);
                    });
                    viewChatList();
                }

                if (messages.length > 0) {
                    messageList.push(...messages);
                    viewMessageList();
                }

                else {
                    DOM.chatList.innerHTML = `
                        <div class="no-groups-found">
                            <h2>No result</h2>
                            <p>Try searching for a different group name or check your spelling.</p>
                        </div>
                    `;
                    DOM.chatList2.innerHTML = "";
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    else {
        generateChatList();
    }
};



groupSearchField.addEventListener("input", function (event) {
    messageList = [];
    DOM.messagesList.innerHTML = "";
    if (event.target.value.length > 0) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async function () {
            await searchGroups(event.target.value);
        }, 500);
    }
    else {
        generateChatList();
    }
});

async function unreadGrouChat() {
    try {
        const url = `get-unread-chat-groups`;
        const unreadConversationGroupResponse = await fetch(url);
        const response = await unreadConversationGroupResponse.json();
        console.log("response", response);
    }
    catch (error) {
        console.log(error);
    }
}

let searchMessageInputFeild = document.getElementById("messsage_search_query");

searchMessageInputFeild.addEventListener("input", function (e) {
    if (e.target.value.length > 0) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async function () {
            const url = `message/search/${e.target.value}/${DOM.groupId}`;
            try {
                fetch(url)
                    .then(response => response.json())
                    .then(messageResponse => {
                        console.log("search message response", messageResponse);
                        const searchResultsDiv = document.querySelector(".search-results");
                        searchResultsDiv.innerHTML = "";
                        const searchQuery = e.target.value.toLowerCase();
                        messageResponse.messages.forEach((message) => {
                            const resultItemDiv = document.createElement("div");
                            resultItemDiv.className = "result-item";
                            const resultDateDiv = document.createElement("div");
                            resultDateDiv.className = "result-date";
                            resultDateDiv.textContent = new Date(message.time * 1000).toLocaleDateString();
                            const resultTextDiv = document.createElement("div");
                            resultTextDiv.className = "result-text";
                            resultTextDiv.textContent = message.msg;
                            resultItemDiv.appendChild(resultDateDiv);
                            resultItemDiv.appendChild(resultTextDiv);
                            searchResultsDiv.appendChild(resultItemDiv);

                            resultItemDiv.addEventListener("click", function () {
                                let messageId = message.id;
                                const messageElement = DOM.messages.querySelector(`[data-message-id="${messageId}"]`);
                                if (messageElement) {
                                    const messageTextElement = messageElement.querySelector(".shadow-sm");
                                    const messageText = messageTextElement.textContent.toLowerCase();
                                    const index = messageText.indexOf(searchQuery);
                                    if (index !== -1) {
                                        const highlightedText = messageText.substring(0, index) + `<span class="highlight">${messageText.substring(index, index + searchQuery.length)}</span>` + messageText.substring(index + searchQuery.length);
                                        messageTextElement.innerHTML = highlightedText;
                                    }
                                    messageElement.scrollIntoView({ behavior: "smooth" });
                                } else {
                                    fetchNextPageMessages(messageId, currentPage);
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            } catch (error) {

                console.log(error);
            }
        }, 500)
    }
    else {
        const searchResultsDiv = document.querySelector(".search-results");
        searchResultsDiv.innerHTML = "";
        removeHighlight();
    }
})

document.querySelector(".close-button").addEventListener("click", function () {
    document.getElementById("messsage_search_query").value = "";
    const searchResultsDiv = document.querySelector(".search-results");
    searchResultsDiv.innerHTML = "";
    removeHighlight();
});

function removeHighlight() {
    const messageElements = DOM.messages.querySelectorAll(".shadow-sm");
    messageElements.forEach((element) => {
        element.innerHTML = element.textContent;
    });
}

function get_voice_list() {
    const audioMessages = document.querySelectorAll('.chat_list_messages .audio-message');

    audioMessages.forEach((message) => {
        const playButton = message.querySelector('.play-button');
        const progressBarContainer = message.querySelector('.audio-progress');
        const progressFilled = message.querySelector('.progress-filled');
        const audioDuration = message.querySelector('.audio-duration');
        const audioSrc = message.getAttribute('data-audio-src');
        const audioPlayer = new Audio(audioSrc);

        playButton.addEventListener('click', function () {
            if (audioPlayer.paused) {
                if (currentlyPlayingAudio && currentlyPlayingAudio !== audioPlayer) {
                    currentlyPlayingAudio.pause();
                    currentlyPlayingAudio.currentTime = 0;
                    const currentlyPlayingButton = document.querySelector('.play-button img[src*="Pause-icon.svg"]');
                    if (currentlyPlayingButton) {
                        currentlyPlayingButton.src = 'assets/img/Play-icon.svg';
                    }
                }

                audioPlayer.play();
                playButton.innerHTML = '<img src="assets/img/Pause-icon.svg" alt="Pause" />';
                currentlyPlayingAudio = audioPlayer;
            } else {
                audioPlayer.pause();
                playButton.innerHTML = '<img src="assets/img/Play-icon.svg" alt="Play" />';
                currentlyPlayingAudio = null;
            }
        });

        // Update the progress bar as the audio plays
        audioPlayer.addEventListener('timeupdate', function () {
            if (audioPlayer.duration) {
                const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressFilled.style.width = `${progressPercent}%`;
                audioDuration.textContent = formatTime(audioPlayer.currentTime);
            }
        });

        audioPlayer.addEventListener('ended', function () {
            playButton.innerHTML = '<img src="assets/img/Play-icon.svg" alt="Play" />';
            progressFilled.style.width = '0%';
            audioDuration.textContent = '0:00';
            currentlyPlayingAudio = null;
        });

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        progressBarContainer.addEventListener('click', (event) => {
            const progressBarWidth = progressBarContainer.offsetWidth;
            const clickX = event.offsetX;

            if (audioPlayer.duration && audioPlayer.duration > 0) {
                const newTime = (clickX / progressBarWidth) * audioPlayer.duration;
                audioPlayer.currentTime = Math.min(Math.max(newTime, 0), audioPlayer.duration);
            } else {
                console.warn('Audio duration is not available or invalid:', audioPlayer.duration);
            }
        });

        audioPlayer.addEventListener('play', () => console.log('Playing audio:', audioSrc));
        audioPlayer.addEventListener('pause', () => console.log('Paused audio:', audioSrc));
    });
}
