
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
    fcmToken: null,
    // displayed_edit_div:false,
    // displayed_correction_div:false,
    displayed_message_div: false,
    mobile_search_icon: getById("search-icon-mobile"),
    counter: 0,
    showCounter: false,
    notificationDiv: getById("notification-count"),
    unreadDividerAdded: false,
    unreadCounter: 0,
    messageSearchQuery: null
};
DOM.mobile_search_icon.addEventListener("click", () => {

    const search_div = getById('serach_div');
    search_div.style.display = "block";
});
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
        return;
    }

    DOM.chatList.innerHTML = "";
    DOM.chatList2.innerHTML = "";
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
                let latestMessage = null;
                if (user.role == 0 || user.role == 2) {
                    latestMessage = elem.group.group_messages && elem.group.group_messages.length > 0 ? elem.group.group_messages[elem.group.group_messages.length - 1] : null;
                }
                else if (elem.group.group_messages && elem.group.group_messages.length > 0) {
                    for (let i = elem.group.group_messages.length - 1; i >= 0; i--) {
                        const message = elem.group.group_messages[i];

                        if (!message.is_privacy_breach && !message.is_deleted) {
                            latestMessage = message;
                            break;
                        }
                    }
                }
                let messageText = null;
                if (latestMessage != undefined && 'type' in latestMessage) {
                    if (latestMessage.type === "File" || latestMessage.type === "Image" || latestMessage.type === "Audio") {
                        messageText = latestMessage.media_name;
                    } else if (/<a[^>]+>/g.test(latestMessage.msg) || /<audio[^>]+>/g.test(latestMessage.msg)) {

                        messageText = getOldMessageMediaName(latestMessage);
                    }
                    else {
                        messageText = latestMessage.msg;
                    }
                }
                else {
                    messageText = "No messages";
                }
                if (elem.group.group_messages.length > 0) {
                    latestMessage.status == "Correction" ? messageText = removeTags(messageText) : messageText = messageText.slice(0, 30) + (messageText.length > 30 ? "..." : "")
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
                            <div class="name list-user-name">${elem.group.name.length > 23 ? elem.group.name.substring(0, 23) + "..." : elem.group.name}</div>
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


function getOldMessageMediaName(message) {
    const linkTag = message.msg.match(/<a[^>]+>/g)[0];
    fileLink = linkTag.match(/href="([^"]+)"/)[1];
    const mediaName = fileLink.split('uploads/')[1];
    // const displayMediaName = message.media_name || mediaName;
    // const mediaType = displayMediaName.split('.').pop().toLowerCase() === 'pdf' ? 'document' : 'image';
    return mediaName
}

function getOldMessageType(message) {
    const linkTag = message.msg.match(/<a[^>]+>/g)[0];
    fileLink = linkTag.match(/href="([^"]+)"/)[1];
    const mediaName = fileLink.split('uploads/')[1];
    const displayMediaName = message.media_name || mediaName;
    const mediaType = displayMediaName.split('.').pop().toLowerCase() === 'pdf' ? 'document' : 'image';
    return mediaType
}

function removeTags(messageText) {
    return messageText.replace(/<\/?p>/g, '')
    // .replace(/<\/?s>/g, '');

}

let viewMessageList = () => {

    DOM.messagesList.innerHTML = `
    <div class="heading">
        <h2>Messages</h2>
    </div>`;
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
            <div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom tohide${unreadClass}" data-group-id="${elem.group.group_id}" onclick="generateMessageArea(this,1)">
              <img src="${elem.group.pic ? elem.group.pic : 'https://static.vecteezy.com/system/resources/previews/012/574/694/non_2x/people-linear-icon-squad-illustration-team-pictogram-group-logo-icon-illustration-vector.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
              <div class="w-50">
                <div class="name list-user-name">${elem.group.name}</div>
                <div class="small last-message">${elem ? senderName + ": " : ""}${messageText}</div>
              </div>

              <div class="flex-grow-1 text-right">
                <div class="small time">${timeText}
                </div>
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

let addUnread = () => {
    // const notificationValue = 5;
    // const notificationDiv = document.getElementById('notification-count');
    // notificationDiv.innerHTML = notificationValue;
    // notificationDiv.style.display = 'block';
    DOM.messages.innerHTML += `
        <div id="unread-wrapper" class="notification-wrapper">
            <div class="unread-messages">
                <span id="unread-counter-div"></span> UNREAD MESSAGES
            </div>
        </div>
        `;
    DOM.unreadDividerAdded = true;
}


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
    console.log(user.role)
    var messageElement = $('[data-message-id="' + messageId + '"]').closest('.ml-3');
    if (parseInt(user.role) != 0 && parseInt(user.role) != 2) {
        console.log("delete event", user);
        if (messageElement) {
            messageElement.remove();
            viewChatList();
        }
        else {
            viewChatList();
        }
    }
    else {
        generateChatList();
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

    if (pagnicateChatList && pagnicateChatList.data) {
        pagnicateChatList.data.push(message);
    }
    let unique_id = document.getElementById("login_user_unique_id").value;

    const groupId = message.group_id;
    if (message.sender !== unique_id) {
        DOM.counter += 1;
        if (DOM.groupId == groupId) {
            const notificationWrapper = document.querySelector('.notification-wrapper');
            if (notificationWrapper && notificationWrapper.style.display !== 'none') {
                const previousCount = document.getElementById('unread-counter-div').innerHTML.trim();
                document.getElementById('unread-counter-div').innerHTML = parseInt(previousCount) + 1;
            }
        }
    }
    else {
        const notificationWrapper = document.querySelector('.notification-wrapper');
        if (notificationWrapper && notificationWrapper.style.display !== 'none') {
            notificationWrapper.style.display = 'none';
        }
        scroll_function();
    }



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
        addMessageToMessageArea(message, true);
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

socket.on('updateEditedMessage', (editedMessage) => {
    const messageElement = document.querySelector(`[data-message-id="${editedMessage.id}"]`);
    const messageContentDiv = messageElement.querySelector('div.shadow-sm');

    let newMessageDisplay = '';
    if (messageElement) {
        if (editedMessage.reply) {
            if (editedMessage.reply.type === "Message" && !/<a[^>]+>/g.test(editedMessage.msg) && !/<audio[^>]+>/g.test(editedMessage.msg) || editedMessage.type === null) {
                newMessageDisplay = `<div class="reply-message-area">${editedMessage.msg.replace(/[\r\n]+/g, '<br>')}</div>`; // Update with new content

                const replyMessage = editedMessage.reply.msg;
                newMessageDisplay = `
                    <div class="reply-message-div" onclick="scrollToMessage('${editedMessage.reply.id}')">
                        <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                            ${editedMessage.user.name}
                        </div>
                        <div class="reply-details">
                            <p class="file-name">${replyMessage}</p>
                        </div>
                    </div>
                    ${newMessageDisplay}
                `;

                messageContentDiv.innerHTML = newMessageDisplay;
            }
            else if (editedMessage.reply.type === "Image") {
                var message_body = `<img src="${editedMessage.reply.msg}" style="height:125px; width:125px;">`;

                newMessageDisplay = `
                <div class="reply-message-div" onclick="scrollToMessage('${editedMessage.reply.id}')"> <!-- Add onclick here -->
                    <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                        ${editedMessage.user?.id == user?.id ? editedMessage.user.name : editedMessage.user.name}
                    </div>
                    <div class="reply-details">
                        <p class="file-name">${message_body}</p>
                    </div>
                </div>
                <div class="reply-message-area">${editedMessage.msg}</div>
            `;
                messageContentDiv.innerHTML = newMessageDisplay;
            }
            else if (editedMessage.reply.type === "File") {
                const add_file_view = `
                <div class="file-message" onclick="scrollToMessage('${editedMessage.reply.id}')">
                    <div class="file-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                            <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                        </svg>
                    </div>
                    <div class="file-details">
                        <p class="file-name">${editedMessage.reply.media_name}</p>
                    </div>
                    <a href="${editedMessage.reply.message ?? editedMessage.reply.msg}" target="_blank" download="${editedMessage.reply.media_name}" class="download-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                        </svg>
                    </a>
                </div>
            `;

                newMessageDisplay = `
                <div class="">
                    ${add_file_view}
                </div>
                <div class="reply-message-area">${editedMessage.msg.replace(/[\r\n]+/g, '<br>')}</div>
            `;
                messageContentDiv.innerHTML = newMessageDisplay;
            }

            else if (editedMessage.reply.type === "Audio") {
                var message_body = `<div class="audio-message" style="background-color:${editedMessage.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${editedMessage.reply.msg}">
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



                newMessageDisplay = `
                    <div class="reply-message-div"  onclick="scrollToMessage('${editedMessage.reply.id}')">
                        <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                        ${editedMessage.user?.id == user?.id ? editedMessage.user.name : editedMessage.user.name}

                        </div>
                        <div class="reply-details">
                            <p class="file-name">${message_body}</p>
                        </div>
                    </div>
                <div class="reply-message-area">${(editedMessage.msg || editedMessage.message).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}</div> <!-- Updated this line -->
                `;
                messageContentDiv.innerHTML = newMessageDisplay;

            }
        }
        else {
            const editMessageDiv = document.getElementById('editMessageDiv');
            const editMessageContentDiv = editMessageDiv.querySelector('.EditmessageContent');
            editMessageContentDiv.innerHTML = editedMessage.msg;
            messageContentDiv.innerHTML = editedMessage.msg;
        }
        // const messageContentDiv = messageElement.querySelector('div.shadow-sm');
        // messageContentDiv.innerHTML = editedMessage.message.msg.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '');
    } else {
        console.error('Message element not found for ID:', editedMessage.id);
    }

});

let addMessageToMessageArea = (message, flag = false) => {
    console.log("message");
    let msgDate = mDate(message.time).getDate();

    let profileImage = `<img src="${message.user?.pic ?? 'assets/images/Alsdk120asdj913jk.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px; width:50px;">`;
    let senderName = message.user.name;

    let messageContent;
    let oldMessageType = null;

    if (/<a[^>]+>/g.test(message.msg) || /<audio[^>]+>/g.test(message.msg)) {
        oldMessageType = getOldMessageType(message);
    }

    if (message.type === 'File') {
        if (message.reply) {
            if (message.reply.type === 'Image') {
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
            } else if (message.reply.type === 'File') {
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
            } else if (message.reply.type === 'Audio') {
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
            } else {
                var message_body = message.reply.msg;
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
        }

        else {
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
    }
    else if (/<a[^>]+>/g.test(message.msg) && !/<audio[^>]+>/g.test(message.msg) && !message.reply) {
        let fileLink;
        // if (/<a[^>]+>/g.test(message.msg)) {
        const linkTag = message.msg.match(/<a[^>]+>/g)[0];
        fileLink = linkTag.match(/href="([^"]+)"/)[1];
        const mediaName = fileLink.split('uploads/')[1];
        const displayMediaName = message.media_name || mediaName;
        const mediaType = displayMediaName.split('.').pop().toLowerCase() === 'pdf' ? 'document' : 'image';
        if (mediaType == "document") {
            messageContent = `
                <div class="file-message">
                    <div class="file-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                            <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                        </svg>
                    </div>
                    <div class="file-details">
                        <p class="file-name">${displayMediaName}</p>

                    </div>
                    <a href="${fileLink}" target="_blank" download="${displayMediaName}" class="download-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                        </svg>
                    </a>
                </div>
            `;
        } else {
            messageContent = `
            <img src="${fileLink}" style="height:222px; width:100%;">
        `;
        }
    }

    else if (message.type === 'Image') {
        if (message.reply) {
            // Determine the type of reply and set the message_body accordingly
            if (message.reply.type === 'Image') {
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:100%">`;
            } else if (message.reply.type === 'File') {
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
            } else if (message.reply.type === 'Audio') {
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
            } else {
                var message_body = message.reply.msg;
            }

            // Message content (modify the img to match your use case)
            var message_new = `<img src="${message.message ?? message.msg}" style="height:222px; width:100%;">`;

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
            <img src="${message.message ?? message.msg}" style="height:222px; width:100%;">
        `;
        }
    } else if (message.type === 'Message' || message.type === null && !/<audio[^>]+>/g.test(message.msg)) {

        if (message.reply) {


            if (message.reply.type === 'Image' || oldMessageType == "File") {
                var message_body = `<img src="${message.reply.msg}" style="height:125px; width:100%;">`;
            } else if (message.reply.type === 'File' || oldMessageType == "File") {
                var message_body = ` <div class="file-message" >
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                        <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                    </svg>
                </div>
                <div class="file-details">
                    <p class="file-name">${message.reply.media_name}</p>

                </div>
                <a href="#"  class="download-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                    </svg>
                </a>
            </div>`;
            } else if (message.reply.type === 'Audio' || oldMessageType == "Audio") {
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
            } else {
                var message_body = message.reply.msg.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '');;
            }

            messageContent = `
            <div class="reply-message-div"  onclick="scrollToMessage('${message.reply.id}')">
                <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                  ${message.user?.id == user?.id ? message.user.name : message.user.name}

                </div>
                <div class="reply-details">
                    <p class="file-name">${message_body}</p>
                </div>
            </div>
        <div class="reply-message-area">${(message.msg || message.message).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}</div> <!-- Updated this line -->
        `;
        } else {
            messageContent = (message.msg || message.message).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '');;
        }

    }
    else if (message.type === 'Audio' || /<audio[^>]+>/g.test(message.msg)) {
        let audioSrc;
        if (/<audio[^>]+>/g.test(message.msg)) {
            const audioTag = message.msg.match(/<audio[^>]+>/g)[0];
            audioSrc = audioTag.match(/src="([^"]+)"/)[1];
        } else {
            audioSrc = message.msg;
        }

        messageContent = `

        <div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${audioSrc}">
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

    if (!message.is_privacy_breach && !message.is_deleted) {
        console.log("type message", message);
        let messageElement = document.createElement('div');
        messageElement.className = 'ml-3';
        messageElement.innerHTML = `
        <div class="ml-3">
            ${message.user.id == user.id ? '' : profileImage}

            <div class="" >
                <div class="align-self-${message.user.id == user.id ? 'end self' : 'start'} d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item ${message.user.id == user.id ? 'right-nidle' : 'left-nidle'}" data-message-id="${message.id}" id="message-${message.id}">
                    <div style="margin-top:-4px">
                        <div class="shadow-sm additional_style" style="background:${message.user.id == user.id ? '#dcf8c6' : 'white'};">
                        <div class="${message.type == "Message" ? 'w-90' : ''}">
                           ${messageContent}
                        </div>

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
                                    </span> |` :
                (user.role == 0 || user.role == 2 ? `
                                    <span>
                                        <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;"
                                            data-toggle="modal" data-target="#seenModal" data-message-id="${message.id}">
                                            Seen
                                        </a>
                                    </span> |` : '')}

                                    <span>
                                        <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" id="reply-link" onclick="showReply('${message.id}','${senderName}','${message.type}')" data-message-id="${message.id}">Reply</a>
                                    </span>

                               <!--- | <span>
                                    <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
                                </span> ---->

                            </div>
                            ${message.sender === user.unique_id ? `
                                <div class="dropdown" style="position: absolute; top: ${message.reply ? '10px' : (message.type === 'Message' ? '2px' : '10px')}; right: 8px;">
                                <a href="#" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fas fa-angle-down text-muted px-2"></i>
                                </a>
                                <div class="dropdown-menu custom-shadow"  aria-labelledby="dropdownMenuButton">
                                    ${!(user.role === '0' || user.role === '2') ? `
                                    <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
                                    ` : ''}
                                    ${user.role === '0' || user.role === '2' ? `
                                        ${message.type === "Message" ? `
                                                <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
                                        ` : ''}
                                    ${(message.type === "Message" && message.status !== "Correction" && (message.is_compose === 1 || message.is_compose === true)) ? `
                                    <a class="dropdown-item" href="#" onclick="CorrectionMessage('${message.id}','${senderName}')">Correction</a>
                                    ` : ''}
                                    ${message.is_compose === 1 && message.type === "Message" ? `
                                    <a class="dropdown-item" href="#" onclick="moveMessage(${message.id})">Move</a>
                                    ` : ''}
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
                            ` : ``}


                            ${user.role != '1' && user.role != '3' && message.sender != user.unique_id ? `
                                <div class="dropdown" style="position: absolute; top: ${message.reply ? '10px' : (message.type === 'Message' ? '0px' : '10px')}; right: 10px;">
                                <a href="#" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fas fa-angle-down text-muted px-2"></i>
                                </a>
                                <div class="dropdown-menu custom-shadow" aria-labelledby="dropdownMenuButton">
                                    ${!(user.role === '0' || user.role === '2') && message.sender != user.unique_id ? `

                                    <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
                                    ` : ''}
                                    ${user.role === '0' || user.role === '2' ? `
                                        ${(message.type == "Message" || message.is_compose === 1 || message.is_compose == true) && (oldMessageType !== 'document' && oldMessageType !== 'image') ? `
                                        <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
                                        ` : ''}
                                    ${((oldMessageType !== 'document' && oldMessageType !== 'image') && message.type === "Message" && message.is_compose === 1) || (message.is_compose == true && (oldMessageType !== 'document' && oldMessageType !== 'image')) ? `
                                    <a class="dropdown-item" href="#" onclick="CorrectionMessage('${message.id}','${senderName}')">Correction</a>
                                    ` : ''}
                                    ${message.is_compose === 1 && message.type === "Message" ? `
                                    <a class="dropdown-item" href="#" onclick="moveMessage(${message.id})">Move</a>
                                    ` : ''}
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
        if (flag) {
            DOM.messages.appendChild(messageElement);
        }
        else {
            return messageElement;
        }

    }
    else if (message.is_privacy_breach && user.role == 0 || user.role == 2) {

        let messageElement = document.createElement('div');
        messageElement.className = 'ml-3';
        messageElement.innerHTML = `
        <div class="ml-3">
            ${message.user.id == user.id ? '' : profileImage}
            <div class="" >
                <div class="align-self-${message.user.id == user.id ? 'end self' : 'start'} d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item ${message.user.id == user.id ? 'right-nidle' : 'left-nidle'}" data-message-id="${message.id}" id="message-${message.id}">
                    <div style="margin-top:-4px">
                        <div class="shadow-sm additional_style" style="background:${message.user.id == user.id ? '#dcf8c6' : 'white'};">
                        <div class="${message.type == "Message" ? 'w-90' : ''}">
                           ${messageContent}
                        </div>
                        </div>
                        <div>
                            <div style="color: #463C3C; font-size:14px; font-weight:400; margin-top: 10px; width: 100%; background-color: transparent;">
                                <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">${senderName}</span> |
                                <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">(${makeformatDate(new Date(message.time * 1000))})</span>
                                <!-- Additional logic for seen and reply links -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
        if (flag) {
            DOM.messages.appendChild(messageElement);
        }
        else {
            return messageElement;
        }
    }


    else if (message.is_deleted && user.role == 0 || user.role == 2) {
        console.log("message is_deleted", message);
        let messageElement = document.createElement('div');
        messageElement.className = 'ml-3';
        messageElement.innerHTML = `
            <div class="ml-3">
                ${message.user.id == user.id ? '' : profileImage}
                <div class="" >
                    <div class="align-self-${message.user.id == user.id ? 'end self' : 'start'} d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item ${message.user.id == user.id ? 'right-nidle' : 'left-nidle'}" data-message-id="${message.id}" id="message-${message.id}">
                        <div style="margin-top:-4px">
                            <div class="shadow-sm additional_style" style="background:${message.user.id == user.id ? '#dcf8c6' : 'white'};">
                            <div class="${message.type == "Message" ? 'w-90' : ''}">
                               ${messageContent}
                            </div>
                            </div>
                            <div>
                                <div style="color: #463C3C; font-size:14px; font-weight:400; margin-top: 10px; width: 100%; background-color: transparent;">
                                    <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">${senderName}</span> |
                                    <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">(${makeformatDate(new Date(message.time * 1000))})</span>
                                    <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;" onclick="markAsSeen('${message.id}')">Seen</span> |
                                    <span id="restore-button-${message.id}" style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;" onclick="restoreMessage('${message.id}')">Restore</span>                                    <!-- Additional logic for seen and reply links -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (flag) {
            DOM.messages.appendChild(messageElement);
        }
        else {
            return messageElement;
        }
    }

    var messageDiv = document.getElementById("messages");
    var messageItems = messageDiv.getElementsByClassName("message-item");
    var count = messageItems.length;
    let exceededValue = 0;
    if (message.sender == user.unique_id) {
        scroll_function();
    }
    // if (count > 20 && count % 20 !== 0) {
    if (DOM.showCounter) {
        //     exceededValue = count - 20;
        // //     // let unread = DOM.unreadMessagesPerGroup[DOM.groupId];

        // document.getElementById('scrollBottomBtn').style.display = 'block';
        const notificationDiv = document.getElementById('notification-count');

        if (DOM.counter > 0) {
            // const notificationWrapper = document.querySelector('.notification-wrapper');
            // var iconContainer = document.querySelector('.icon-container');
            // if (notificationWrapper && notificationWrapper.style.display !== 'none' && getComputedStyle(iconContainer).display !== 'none') {
            //     notificationWrapper.style.display = 'none';

            // }

            DOM.notificationDiv.innerHTML = DOM.counter;
            notificationDiv.style.display = 'block';
        }
        // //     if (unread == 0) {
        // //         notificationDiv.style.display = 'block';
        // //     } else {
        // //         alert("u dont have unread messages");
        // //         scroll_function();
        // //     }

    }
    else {
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
            DOM.showCounter = true;
            if (DOM.unreadCounter > 0) {
                DOM.notificationDiv.innerHTML = DOM.unreadCounter;
                DOM.notificationDiv.style.display = "block";
                DOM.unreadCounter = 0;
            }
        } else {
            scrollBottomBtn.style.display = 'none';
            DOM.showCounter = false;
            DOM.counter = 0;
            DOM.notificationDiv.innerHTML = "";
            DOM.notificationDiv.style.display = "none";
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

function CorrectionMessage(message_id, senderName) {

    if (DOM.displayed_message_div) {
        removeEditMessage();
    }
    else {
        DOM.displayed_message_div = !DOM.displayed_message_div;
    }
    var replyDiv = document.getElementById('reply-div');

    if (window.getComputedStyle(replyDiv).display === 'block') {
        removeQuotedMessage();
    }


    // const editDiv=document.getElementById('editMessageDiv');
    // if (window.getComputedStyle(editDiv).display === 'block') {
    //     removeEditMessage();
    // }
    const message = pagnicateChatList.data.find((message) => message.id === parseInt(message_id));
    var messagebody = message.msg;
    var iconContainer = document.querySelector('.icon-container');
    iconContainer.style.bottom = '240px';
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
    const messageContentDiv = messageElement.querySelector('div.shadow-sm');
    messageContentDiv.innerHTML = messageContent;

    // Check and log voiceIcon and Editreplyarea
    const chat_actionss = document.getElementById('chat_action');
    chat_actionss.style.display = 'none';


    document.querySelector('.chat_action_file').style.display = 'none';

    document.querySelectorAll('.chat_action_file, .chat_action_capture, .chat_action_voice').forEach(function (element) {
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


    const messageIndex = pagnicateChatList.data.findIndex((message) => message.id === parseInt(correction_message_id));
    if (messageIndex !== -1) {
        pagnicateChatList.data[messageIndex].msg = messageContent;
    }

    if (!checkPrivacyAndAlert(messageContent, correction_message_id)) {
        let newMessage = {
            user: user,
            message: messageContent,
            reply_id: correction_message_id,
            group_id: DOM.groupId,
            type: 'Message',
            status: 'Correction',
            mediaName: null,
            time: Math.floor(Date.now() / 1000),
            csrf_token: document.querySelector('meta[name="csrf-token"]').content
        };

        socket.emit('sendChatToServer', newMessage);
    }
}


function checkPrivacyAndAlert(messageContent, messageId) {
    const numberPattern = /\b\d{7,}\b/;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

    let reason = '';
    if (numberPattern.test(messageContent)) {
        reason = 'Contact Number';
    } else if (emailPattern.test(messageContent)) {
        reason = 'Email Address';
    }

    if (reason !== '') {
        // Send alert message to the server
        let alertMessage = "Alert!!!";
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
                message: messageContent,
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
            user: user.fcm_token ? user : user.fcm_token = DOM.fcmToken,
            message: alertMessage,
            reply_id: messageId,
            group_id: DOM.groupId,
            type: 'Message',
            mediaName: null,
            time: Math.floor(Date.now() / 1000),
            csrf_token: document.querySelector('meta[name="csrf-token"]').content,
            privacy_breach: true,
        };
        socket.emit('sendChatToServer', msg);
        return true;
    }
    return false;
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

    document.querySelectorAll('.chat_action_file, .chat_action_capture, .chat_action_voice').forEach(function (element) {
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
    document.querySelectorAll('.chat_action_file, .chat_action_capture, .chat_action_voice').forEach(function (element) {
        element.style.visibility = 'visible';
    });

    // Create a new style element
    var style = document.createElement('style');
    style.innerHTML = "#chat_action { display: flex !important; }";
    document.head.appendChild(style);
    replyDiv.style.display = 'none';
    iconContainer.style.bottom = '90px';
}


function editMessage(messageId) {
    if ($('#action-bar').is(':visible')) {
        cancelMoveMessage();
    }

    if (DOM.displayed_message_div) {
        removecorrectionMessage();
    }
    else {
        DOM.displayed_message_div = !DOM.displayed_message_div;
    }
    var replyDiv = document.getElementById('reply-div');

    if (window.getComputedStyle(replyDiv).display === 'block') {
        removeQuotedMessage();
    }

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
        const element = document.getElementById('editMessageDiv');
        element.style.display = 'block';

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


        DOM.messageInput.style.height = element.offsetHeight + "px";
        change_icon_height(element);
    }
}

function change_icon_height(element) {
    var iconContainer = document.querySelector('.icon-container');
    const viewportHeight = window.innerHeight;
    const elementRect = element.getBoundingClientRect();
    const dis = viewportHeight - elementRect.top + 10;
    iconContainer.style.bottom = dis + 'px';
}

// Edit message area
function handleSendMessage() {

    document.getElementById('input').style.setProperty('height', '44px', 'important');
    document.querySelector('.auto-resize-textarea').style.setProperty('height', '44px', 'important');

    const messageId = document.getElementById('edit_message_id').value;
    let messageContent = document.getElementById('input').value;

    if (messageContent !== '') {
        const messageIndex = pagnicateChatList.data.findIndex((message) => message.id === parseInt(messageId));
        if (messageIndex !== -1) {
            pagnicateChatList.data[messageIndex].msg = messageContent;
        }

        // const messageElement = DOM.messages.querySelector(`[data-message-id="${messageId}"]`);
        // const messageContentDiv = messageElement.querySelector('div.shadow-sm');

        const messageToUpdate = pagnicateChatList.data.find((message) => message.id === parseInt(messageId));
        socket.emit('updateEditedMessage', messageToUpdate);

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
    } else {
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
    var iconContainer = document.querySelector('.icon-container');
    iconContainer.style.bottom = '90px';
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
function showReply(message_id, senderName, type) {

    var correctionDiv = document.getElementById('correction-div');

    if (correctionDiv && window.getComputedStyle(correctionDiv).display === 'block') {
        removecorrectionMessage();
    }

    const message = pagnicateChatList.data.find((message) => message.id === parseInt(message_id));
    var messagebody = message.msg;
    DOM.replyId = message_id;



    var replyDiv = document.getElementById('reply-div');





    var quotedTextElement = document.querySelector('#quoted-message .sender-name');
    quotedTextElement.textContent = senderName;

    var quotedNameElement = document.querySelector('#quoted-message .quoted-text');
    if (type === 'Image') {
        var message_body = `<img src="${messagebody}" style="height:125px; width:125px;">`;
    } else if (type === 'File') {
        var message_body = ` <div class="file-message" >
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                        <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                    </svg>
                </div>
                <div class="file-details">
                    <p class="file-name">${message.media_name}</p>

                </div>
                <a href="#"  class="download-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                    </svg>
                </a>
            </div>`;
    } else if (type === 'Audio') {
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
    } else {
        var message_body = messagebody;
    }
    quotedNameElement.innerHTML = message_body;

    replyDiv.style.display = 'block';
    change_icon_height(replyDiv);

}

function removeQuotedMessage() {
    var replyDiv = document.getElementById('reply-div');
    var iconContainer = document.querySelector('.icon-container');
    replyDiv.style.display = 'none';
    iconContainer.style.bottom = '90px';
    DOM.replyId = null;
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
}

document.getElementById("openModalTrigger").addEventListener("click", function () {
    var myModal = new bootstrap.Modal(document.getElementById('chatModal'));
    myModal.show();
});

function selectUsertosend(username, postgroup_id) {
    document.getElementById('selected-username').textContent = username;
    document.getElementById('group_to_move_message').value = postgroup_id;
    document.getElementById('selected-usertosend').style.setProperty('display', 'flex', 'important');
}

$(document).ready(function () {
    $('#MoveMessagetoGroup').on('click', function () {
        var messagesIds = $('#messages_ids').val();
        var groupToMove = $('#group_to_move_message').val();
        var messageIdArray = messagesIds.split(',');
        moveSelectedMessagesToGroup(messageIdArray, groupToMove);
        document.getElementById('messages_ids').value = '';
        document.getElementById('group_to_move_message').value = '';
    });
});

let isLoadingMessages = false;
let hasMoreMessages = true;
function showSpinner() {
    spinner.classList.remove('hide-spinner');
    spinner.classList.add('show-spinner');
    DOM.messages.classList.add("over_lay_loader");
}

function hideSpinner() {
    spinner.classList.remove('show-spinner');
    spinner.classList.add('hide-spinner');
    DOM.messages.classList.remove("over_lay_loader");
}
// Listen for the scroll event
DOM.messages.addEventListener('scroll', async () => {
    const spinner = document.getElementById('spinner');
    if (DOM.messages.scrollTop <= 5 && !isLoadingMessages && hasMoreMessages) {
        isLoadingMessages = true;
        showSpinner();
        await fetchPaginatedMessages();
        hideSpinner();
        isLoadingMessages = false;
    } else if (DOM.messages.scrollTop !== 0) {
        //console.log('User is not at the top yet');
    }
});


// New Updated new message area
let addNewMessageToArea = (message) => {
    let msgDate = new Date(message.time * 1000).getDate();

    // if (lastDate !== msgDate) {
    //     addDateToMessageArea(msgDate);
    //     lastDate = msgDate;
    // }

    let profileImage = `<img src="${message.user?.pic ?? 'assets/images/Alsdk120asdj913jk.jpg'}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px; width:50px;">`;
    let senderName = message.user.name;

    let messageContent;
    let replyContent = '';

    // Handle replies
    if (message.reply) {
        let replyBody;
        if (message.reply.type === 'Image') {
            replyBody = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
        } else if (message.reply.type === 'File') {
            replyBody = `<div class="file-message">
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
                        <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
                    </svg>
                </div>
                <div class="file-details">
                    <p class="file-name">File</p>
                </div>
                <a href="#" class="download-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
                    </svg>
                </a>
            </div>`;
        } else if (message.reply.type === 'Audio') {
            replyBody = `<div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${message.reply.msg}">
                <div class="audio-content">
                    <div class="audio-controls">
                        <button class="playbutton">
                            <img src="assets/img/play-icon.svg" alt="Play" />
                        </button>
                    </div>
                </div>
            </div>`;
        } else {
            replyBody = message.reply.msg;
        }

        replyContent = `
            <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}')">
                <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                    ${message.user?.id == user?.id ? message.user.name : message.user.name}
                </div>
                <div class="reply-details">
                    <p class="file-name">${replyBody}</p>
                </div>
            </div>
        `;
    }

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
            messageContent = `<img src="${message.message ?? message.msg}" style="height:222px; width:100%;">`;
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
        // case /<a[^>]+>/g.test(message.msg) && !/<audio[^>]+>/g.test(message.msg) && !message.reply:
        // let fileLink;
        // // if (/<a[^>]+>/g.test(message.msg)) {
        // const linkTag = message.msg.match(/<a[^>]+>/g)[0];
        // fileLink = linkTag.match(/href="([^"]+)"/)[1];
        // const mediaName = fileLink.split('uploads/')[1];
        // const displayMediaName = message.media_name || mediaName;
        // messageContent = `
        //     <div class="file-message">
        //         <div class="file-icon">
        //             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        //                 <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"/>
        //                 <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"/>
        //             </svg>
        //         </div>
        //         <div class="file-details">
        //             <p class="file-name">${displayMediaName}</p>

        //         </div>
        //         <a href="${fileLink}" target="_blank" download="${displayMediaName}" class="download-icon">
        //             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        //                 <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"/>
        //             </svg>
        //         </a>
        //     </div>
        // `;
        // break;

        default:
            messageContent = message.message ?? message.msg;
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
                    ${replyContent}
                    <div class="reply-message-area">
                     ${messageContent.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}
                    </div>
                    </div>
                    <div>
                        <div style="color: #463C3C; font-size:14px; font-weight:400; margin-top: 10px; width: 100%; background-color: transparent;">
                            <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">${senderName}</span> |
                            <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">(${makeformatDate(new Date(message.time * 1000))})</span> |
                            <span>
                                <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" data-toggle="modal" data-target="#seenModal" data-message-id="${message.id}">Seen</a>
                            </span> |
                            <span>
                                <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" id="reply-link" onclick="showReply('${message.id}','${senderName}','${message.type}')" data-message-id="${message.id}">Reply</a>
                            </span>
                        </div>
                        ${message.sender === user.unique_id ? `
                        <div class="dropdown" style="position: absolute; top: ${message.reply ? '10px' : (message.type === 'Message' ? '0px' : '10px')}; right: 10px;">
                            <a href="#" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <i class="fas fa-angle-down text-muted px-2"></i>
                            </a>
                            <div class="dropdown-menu custom-shadow" aria-labelledby="dropdownMenuButton">
                                ${!['Audio', 'Image', 'File'].includes(message.type) ? `
        <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
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

const fetchPaginatedMessages = async (message_id = null, current_Page = null) => {
    const currentScrollHeight = DOM.messages.scrollHeight;
    try {
        const url = `get-groups-messages-by-group-id?groupId=${encodeURIComponent(DOM.groupId)}&page=${currentPage}${message_id ? `&messageId=${encodeURIComponent(message_id)}&currentPage=${encodeURIComponent(current_Page)}` : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            }
        });
        let nextPageMessages = [];
        nextPageMessages = await response.json();
        if (currentPage == 1) {
            pagnicateChatList = nextPageMessages;
        }
        unread_settings(nextPageMessages);

        if (pagnicateChatList && pagnicateChatList.data && currentPage != 1) {
            pagnicateChatList.data.push(...nextPageMessages.data);
        }

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

        // pagnicateChatList.data.forEach((message) => {
        //     const newMessage = addNewMessageToArea(message);
        //     // Issue start from here view message through addNewMessageArea instead of Add Message To Message Area
        //     DOM.messages.insertBefore(newMessage, DOM.messages.firstChild);
        //     //
        //     // if (message.id === message_id) {
        //     //     const messageElement = DOM.messages.querySelector(`[data-message-id="${message.id}"]`);
        //     //     const messageTextElement = messageElement.querySelector(".shadow-sm");
        //     //     const searchQuery = DOM.messageSearchQuery;

        //     //     switch (message.type) {
        //     //         case "Message":
        //     //             if (message.reply) {
        //     //                 messageTextElement.innerHTML = '';
        //     //                 if (message.reply.type === "Audio") {

        //     //                     var message_body = `<div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${message.reply.msg}">
        //     //                         <div class="avatar">
        //     //                             <!-- Avatar image here -->
        //     //                         </div>
        //     //                         <div class="audio-content">
        //     //                             <div class="audio-controls">
        //     //                                 <button class="playbutton">
        //     //                                     <img src="assets/img/play-icon.svg" alt="Play" />
        //     //                                 </button>
        //     //                                 <div class="audio-progress">
        //     //                                     <div class="progress-filled"></div>
        //     //                                 </div>
        //     //                             </div>
        //     //                             <div class="audio-time-container">
        //     //                                 <span class="audio-duration">0:00</span>
        //     //                                 <span class="audio-time">12:27 PM</span>
        //     //                             </div>
        //     //                         </div>
        //     //                         </div>`;

        //     //                     newMessageDisplay = `
        //     //                         <div class="reply-message-div"  onclick="scrollToMessage('${message.reply.id}')">
        //     //                             <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
        //     //                             ${message.user?.id == user?.id ? message.user.name : message.user.name}

        //     //                             </div>
        //     //                             <div class="reply-details">
        //     //                                 <p class="file-name">${message_body}</p>
        //     //                             </div>
        //     //                         </div>
        //     //                     <div class="reply-message-area">${(message.msg || message.message).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}</div> <!-- Updated this line -->
        //     //                     `;

        //     //                     const messageText = message.msg.toLowerCase();
        //     //                     const index = messageText.indexOf(searchQuery);

        //     //                     if (index !== -1) {
        //     //                         const highlightedText = message.msg.substring(0, index) +
        //     //                             `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
        //     //                             message.msg.substring(index + searchQuery.length);

        //     //                         // Update the reply message area with highlighted text
        //     //                         newMessageDisplay = `
        //     //                         <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}')">
        //     //                             <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
        //     //                                 ${message.user?.id == user?.id ? message.user.name : message.user.name}
        //     //                             </div>
        //     //                             <div class="reply-details">
        //     //                                 <p class="file-name">${message_body}</p>
        //     //                             </div>
        //     //                         </div>
        //     //                         <div class="reply-message-area">${highlightedText.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}</div>
        //     //                     `;
        //     //                     }

        //     //                     // Set the inner HTML to the newMessageDisplay
        //     //                     messageTextElement.innerHTML = newMessageDisplay;

        //     //                 }
        //     //                 else if (message.reply.type === "File") {
        //     //                     replyDisplay = `
        //     //                     <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}')">
        //     //                         <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
        //     //                             ${message.user.name}
        //     //                         </div>
        //     //                         <div class="reply-details">
        //     //                             <div class="file-message">
        //     //                                 <div class="file-icon">
        //     //                                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        //     //                                         <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"></path>
        //     //                                         <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"></path>
        //     //                                     </svg>
        //     //                                 </div>
        //     //                                 <div class="file-details">
        //     //                                     <p class="file-name">${message.reply.media_name}</p>
        //     //                                 </div>
        //     //                                 <a href="${message.reply.msg}" class="download-icon" download="${message.reply.media_name}">
        //     //                                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        //     //                                         <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"></path>
        //     //                                     </svg>
        //     //                                 </a>
        //     //                             </div>
        //     //                         </div>
        //     //                     </div>`;
        //     //                     messageTextElement.innerHTML = replyDisplay +
        //     //                         `<div style="padding-top: 10px;">${message.msg.replace(/[\r\n]+/g, '<br>')}</div>`;

        //     //                     const messageText = message.msg.toLowerCase();
        //     //                     const index = messageText.indexOf(searchQuery);
        //     //                     if (index !== -1) {
        //     //                         const highlightedText = message.msg.substring(0, index) +
        //     //                             `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
        //     //                             message.msg.substring(index + searchQuery.length);
        //     //                         messageTextElement.innerHTML = replyDisplay + highlightedText.replace(/[\r\n]+/g, '<br>');
        //     //                     }
        //     //                 }
        //     //                 else if (message.reply.type === "Image") {
        //     //                     var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
        //     //                     replyDisplay = `
        //     //                         <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}')"> <!-- Add onclick here -->
        //     //                             <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
        //     //                                 ${message.user?.id == user?.id ? message.user.name : message.user.name}
        //     //                             </div>
        //     //                             <div class="reply-details">
        //     //                                 <p class="file-name">${message_body}</p>
        //     //                             </div>
        //     //                         </div>
        //     //                     `;

        //     //                     messageTextElement.innerHTML = replyDisplay;
        //     //                     const messageText = message.msg.toLowerCase();
        //     //                     const index = messageText.indexOf(searchQuery);
        //     //                     if (index !== -1) {
        //     //                         const highlightedText = message.msg.substring(0, index) +
        //     //                             `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
        //     //                             message.msg.substring(index + searchQuery.length);
        //     //                         messageTextElement.innerHTML = replyDisplay + highlightedText.replace(/[\r\n]+/g, '<br>');
        //     //                     }
        //     //                 }

        //     //             }
        //     //             else {
        //     //                 const messageText = messageTextElement.innerHTML;
        //     //                 const index = messageText.indexOf(searchQuery);
        //     //                 if (index !== -1) {
        //     //                     const highlightedText = messageText.substring(0, index) + `<span class="highlight">${messageText.substring(index, index + searchQuery.length)}</span>` + messageText.substring(index + searchQuery.length);
        //     //                     messageTextElement.innerHTML = highlightedText;
        //     //                 }
        //     //             }
        //     //             break;
        //     //         case "File":
        //     //             const fileNameElement = messageElement.querySelector(".file-name");
        //     //             if (fileNameElement) {
        //     //                 const fileName = fileNameElement.textContent;

        //     //                 const trimmedSearchQuery = searchQuery;
        //     //                 const index = fileName.toLowerCase().indexOf(trimmedSearchQuery.toLowerCase());
        //     //                 if (index !== -1) {
        //     //                     const highlightedFileName = fileName.substring(0, index) +
        //     //                         `<span class="highlight">${fileName.substring(index, index + trimmedSearchQuery.length)}</span>` +
        //     //                         fileName.substring(index + trimmedSearchQuery.length);
        //     //                     fileNameElement.innerHTML = highlightedFileName;
        //     //                 }
        //     //             }
        //     //             break;
        //     //         default:
        //     //             const nullTypemessageTextElement = messageElement.querySelector(".shadow-sm");
        //     //             if (nullTypemessageTextElement) {
        //     //                 const nullTypeMessageText = nullTypemessageTextElement.innerHTML;

        //     //                 const nullTypeIndex = nullTypeMessageText.toLowerCase().indexOf(searchQuery.toLowerCase());
        //     //                 if (nullTypeIndex !== -1) {
        //     //                     const highlightedText = nullTypeMessageText.substring(0, nullTypeIndex) +
        //     //                         `<span class="highlight">${nullTypeMessageText.substring(nullTypeIndex, nullTypeIndex + searchQuery.length)}</span>` +
        //     //                         nullTypeMessageText.substring(nullTypeIndex + searchQuery.length);

        //     //                     nullTypemessageTextElement.innerHTML = highlightedText;
        //     //                 }
        //     //             } else {
        //     //                 console.log("No element with class 'shadow-sm' found for unknown message type:", message.type);
        //     //             }
        //     //             break;
        //     //             console.log("Unknown message type:", message.type);
        //     //     }
        //     //     setTimeout(() => {
        //     //         messageElement.scrollIntoView({ behavior: "smooth" });
        //     //     }, 100);
        //     // }
        // });


        console.log("nextPageMessages", nextPageMessages);
        console.log("pagnicateChatList", pagnicateChatList);

        nextPageMessages.data.forEach((msg) => {

            const u_id = user.unique_id;
            const seenBy = msg.seen_by ? msg.seen_by.split(',').map(id => id.trim()) : [];
            if (!seenBy.includes(u_id) && !DOM.unreadDividerAdded) {
                addUnread();
            }
            if (!seenBy.includes(u_id)) {
                DOM.unreadCounter += 1;
            }
            // addMessageToMessageArea(msg);

            const newMessage = addMessageToMessageArea(msg);
            //     // Issue start from here view message through addNewMessageArea instead of Add Message To Message Area
            DOM.messages.insertBefore(newMessage, DOM.messages.firstChild);
        });

        const newScrollHeight = DOM.messages.scrollHeight;
        DOM.messages.scrollTop = newScrollHeight - currentScrollHeight;

    } catch (error) {
        console.error('Error fetching messages:', error);
    }
    currentPage++;
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

let generateMessageArea = async (elem, chatIndex = null, searchMessage = null) => {
    // pagnicateChatList = [];

    chat = chatList[chatIndex];
    DOM.activeChatIndex = chatIndex;

    DOM.messages.innerHTML = '';

    DOM.groupId = elem.dataset.groupId;

    DOM.counter = 0;
    DOM.unreadCounter = 0;
    DOM.notificationDiv.style.display = "none";
    const unreadWrapper = document.getElementById('unread-wrapper');

    if (unreadWrapper) {
        unreadWrapper.remove();
    }

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

    DOM.messageAreaName.innerHTML = chat.name || elem.group.name;
    if (chat.isGroup) {
        let memberNames = chat.group.users_with_access.map(member => member.id === user.id ? "You" : member.name);
        DOM.messageAreaDetails.innerHTML = `${memberNames}`;
    }

    if (searchMessage) {
        await fetchPaginatedMessages(DOM.clickSearchMessageId, DOM.groupId);
    }
    else {
        fetchPaginatedMessages();
        // const response = await fetch(`get-groups-messages-by-group-id?groupId=${encodeURIComponent(DOM.groupId)}&page=1`, {
        //     method: 'GET',
        //     headers: {
        //         'content-type': 'application/json'
        //     }
        // });
        // pagnicateChatList = await response.json();

        // console.log("pagina",pagnicateChatList);

        // unread_settings(pagnicateChatList);

        // const ids = pagnicateChatList.data.map(item => item.id);
        // try {
        //     const response = await fetch("message/seen-by/update", {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json",
        //             "X-CSRF-Token": csrfToken,
        //         },
        //         body: JSON.stringify({ ids }),
        //     });

        //     const readMessageResponse = await response.json();
        // } catch (error) {
        //     console.log(error);
        // }



        //chat counter

        // pagnicateChatList.data.reverse().forEach((msg) => {

        //     const u_id = user.unique_id;
        //     const seenBy = msg.seen_by ? msg.seen_by.split(',').map(id => id.trim()) : [];
        //     if (!seenBy.includes(u_id) && !DOM.unreadDividerAdded) {
        //         addUnread();
        //     }
        //     if (!seenBy.includes(u_id)) {
        //         DOM.unreadCounter += 1;
        //     }
        //     addMessageToMessageArea(msg);
        // });

        get_voice_list();
        removeEditMessage();
        removeQuotedMessage();
        scroll_to_unread_div();
    }
};
function scroll_to_unread_div() {
    DOM.unreadDividerAdded = false;
    const unreadCountDiv = document.getElementById('unread-wrapper');

    if (unreadCountDiv) {
        setTimeout(() => {
            unreadCountDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.getElementById("unread-counter-div").innerHTML = DOM.unreadCounter;
        }, 1000);
    }
}


async function updateMessageSeenBy(ids) {
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
    if (socket.connected) {
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
                    user: user.fcm_token ? user : user.fcm_token = DOM.fcmToken,
                    message: alertMessage,
                    reply_id: DOM.replyId ?? "",
                    group_id: DOM.groupId,
                    type: type,
                    mediaName: mediaName,
                    time: Math.floor(Date.now() / 1000),
                    csrf_token: csrfToken,
                    privacy_breach: true,
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
    }
    else {
        // alert("something went wrong");
        $('#wentWrong').modal('show');
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
    if (event.target.files[0]) {
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
    }
    catch (error) {
        console.log(error);
    }
}

let searchMessageInputFeild = document.getElementById("messsage_search_query");
///////////////////////////////////////////////////////////////////////////////////////////////////
searchMessageInputFeild.addEventListener("input", function (e) {
    if (e.target.value.length > 0) {
        DOM.messageSearchQuery = e.target.value;
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async function () {
            const url = `message/search/${e.target.value}/${DOM.groupId}`;
            try {
                fetch(url)
                    .then(response => response.json())
                    .then(messageResponse => {
                        const searchResultsDiv = document.querySelector(".search-results");
                        searchResultsDiv.innerHTML = "";
                        const searchQuery = e.target.value.toLowerCase();
                        if (!messageResponse.messages || messageResponse.messages.length === 0) {
                            const noResultsDiv = document.createElement("div");
                            noResultsDiv.className = "no-results";
                            noResultsDiv.textContent = "No results";
                            searchResultsDiv.appendChild(noResultsDiv);
                            return;
                        }
                        messageResponse.messages.forEach((message) => {
                            const resultItemDiv = document.createElement("div");
                            resultItemDiv.className = "result-item";
                            const resultDateDiv = document.createElement("div");
                            resultDateDiv.className = "result-date";
                            resultDateDiv.textContent = new Date(message.time * 1000).toLocaleDateString();
                            const resultTextDiv = document.createElement("div");
                            resultTextDiv.className = "result-text";

                            if (message.msg.startsWith("https://")) {
                                resultTextDiv.textContent = message.media_name;
                            } else {
                                resultTextDiv.textContent = message.msg;
                            }
                            resultItemDiv.appendChild(resultDateDiv);
                            resultItemDiv.appendChild(resultTextDiv);
                            searchResultsDiv.appendChild(resultItemDiv);

                            resultItemDiv.addEventListener("click", function () {
                                let messageId = message.id;
                                const messageElement = DOM.messages.querySelector(`[data-message-id="${messageId}"]`);
                                let replyDisplay = '';
                                if (messageElement) {
                                    const messageTextElement = messageElement.querySelector(".shadow-sm");
                                    switch (message.type) {
                                        case "Message":
                                            if (message.reply) {
                                                messageTextElement.innerHTML = '';
                                                if (message.reply.type === "Audio") {

                                                    var message_body = `<div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${message.reply.msg}">
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

                                                    newMessageDisplay = `
                                                        <div class="reply-message-div"  onclick="scrollToMessage('${message.reply.id}')">
                                                            <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                                                            ${message.user?.id == user?.id ? message.user.name : message.user.name}

                                                            </div>
                                                            <div class="reply-details">
                                                                <p class="file-name">${message_body}</p>
                                                            </div>
                                                        </div>
                                                    <div class="reply-message-area">${(message.msg || message.message).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}</div> <!-- Updated this line -->
                                                    `;

                                                    const searchQuery = e.target.value.toLowerCase();
                                                    const messageText = message.msg.toLowerCase();
                                                    const index = messageText.indexOf(searchQuery);

                                                    if (index !== -1) {
                                                        const highlightedText = message.msg.substring(0, index) +
                                                            `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
                                                            message.msg.substring(index + searchQuery.length);

                                                        // Update the reply message area with highlighted text
                                                        newMessageDisplay = `
                                                        <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}')">
                                                            <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                                                                ${message.user?.id == user?.id ? message.user.name : message.user.name}
                                                            </div>
                                                            <div class="reply-details">
                                                                <p class="file-name">${message_body}</p>
                                                            </div>
                                                        </div>
                                                        <div class="reply-message-area">${highlightedText.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}</div>
                                                    `;
                                                    }

                                                    // Set the inner HTML to the newMessageDisplay
                                                    messageTextElement.innerHTML = newMessageDisplay;

                                                }
                                                else if (message.reply.type === "File") {
                                                    replyDisplay = `
                                                    <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}')">
                                                        <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                                                            ${message.user.name}
                                                        </div>
                                                        <div class="reply-details">
                                                            <div class="file-message">
                                                                <div class="file-icon">
                                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path fill="#54656F" d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"></path>
                                                                        <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z"></path>
                                                                    </svg>
                                                                </div>
                                                                <div class="file-details">
                                                                    <p class="file-name">${message.reply.media_name}</p>
                                                                </div>
                                                                <a href="${message.reply.msg}" class="download-icon" download="${message.reply.media_name}">
                                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F"></path>
                                                                    </svg>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>`;
                                                    messageTextElement.innerHTML = replyDisplay +
                                                        `<div style="padding-top: 10px;">${message.msg.replace(/[\r\n]+/g, '<br>')}</div>`; const searchQuery = e.target.value.toLowerCase();
                                                    const messageText = message.msg.toLowerCase();
                                                    const index = messageText.indexOf(searchQuery);
                                                    if (index !== -1) {
                                                        const highlightedText = message.msg.substring(0, index) +
                                                            `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
                                                            message.msg.substring(index + searchQuery.length);
                                                        messageTextElement.innerHTML = replyDisplay + highlightedText.replace(/[\r\n]+/g, '<br>');
                                                    }
                                                }
                                                else if (message.reply.type === "Image") {
                                                    var message_body = `<img src="${message.reply.msg}" style="height:125px; width:125px;">`;
                                                    replyDisplay = `
                                                        <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}')"> <!-- Add onclick here -->
                                                            <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                                                                ${message.user?.id == user?.id ? message.user.name : message.user.name}
                                                            </div>
                                                            <div class="reply-details">
                                                                <p class="file-name">${message_body}</p>
                                                            </div>
                                                        </div>
                                                    `;

                                                    messageTextElement.innerHTML = replyDisplay;
                                                    const messageText = message.msg.toLowerCase();
                                                    const index = messageText.indexOf(searchQuery);
                                                    if (index !== -1) {
                                                        const highlightedText = message.msg.substring(0, index) +
                                                            `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
                                                            message.msg.substring(index + searchQuery.length);
                                                        messageTextElement.innerHTML = replyDisplay + highlightedText.replace(/[\r\n]+/g, '<br>');
                                                    }
                                                }

                                            }
                                            else {
                                                const messageText = messageTextElement.innerHTML;
                                                const index = messageText.indexOf(searchQuery);
                                                if (index !== -1) {
                                                    const highlightedText = messageText.substring(0, index) + `<span class="highlight">${messageText.substring(index, index + searchQuery.length)}</span>` + messageText.substring(index + searchQuery.length);
                                                    messageTextElement.innerHTML = highlightedText;
                                                }
                                            }
                                            break;
                                        case "File":
                                            const fileNameElement = messageElement.querySelector(".file-name");
                                            if (fileNameElement) {
                                                const fileName = fileNameElement.textContent;
                                                const index = fileName.toLowerCase().indexOf(searchQuery);
                                                if (index !== -1) {
                                                    const highlightedFileName = fileName.substring(0, index) + `<span class="highlight">${fileName.substring(index, index + searchQuery.length)}</span>` + fileName.substring(index + searchQuery.length);
                                                    fileNameElement.innerHTML = highlightedFileName;
                                                }
                                            }
                                            break;
                                        default:
                                            const nullTypemessageTextElement = messageElement.querySelector(".shadow-sm");
                                            if (nullTypemessageTextElement) {
                                                const nullTypeMessageText = nullTypemessageTextElement.innerHTML;

                                                const nullTypeIndex = nullTypeMessageText.toLowerCase().indexOf(searchQuery.toLowerCase());
                                                if (nullTypeIndex !== -1) {
                                                    const highlightedText = nullTypeMessageText.substring(0, nullTypeIndex) +
                                                        `<span class="highlight">${nullTypeMessageText.substring(nullTypeIndex, nullTypeIndex + searchQuery.length)}</span>` +
                                                        nullTypeMessageText.substring(nullTypeIndex + searchQuery.length);

                                                    nullTypemessageTextElement.innerHTML = highlightedText;
                                                }
                                            } else {
                                                console.log("No element with class 'shadow-sm' found for unknown message type:", message.type);
                                            }
                                            break;
                                            console.log("Unknown message type:", message.type);
                                    }
                                    messageElement.scrollIntoView({ behavior: "smooth" });
                                } else {
                                    fetchPaginatedMessages(messageId, currentPage);
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.error('Error:', "Not Found");
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


function restoreMessage(id) {
    try {
        fetch("message/restore/" + id, {
            headers: {
                method: 'POST',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        }).then(function (response) {
            if (response.ok) {
                return response.json();
            }
            else {
                throw new Error('Error deleting message');

            }
        }).then(message => {
            console.log("Message restored:", message);
            socket.emit('restoreMessage', id);

            var messageElement = $(`[data-message-id="${id}"]`);
            if (messageElement.length > 0) {
                const restoreButton = $(`#restore-button-${id}`);
                if (restoreButton.length > 0) {
                    restoreButton.replaceWith(`<span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;" onclick="showReply('${id}','${message.sender}','${message.type}')">Reply</span>`);
                }
                messageElement.removeClass('deleted');
            }
        })
    }
    catch (error) {
        console.log("Error Restoring Message:", error);
    }
}
