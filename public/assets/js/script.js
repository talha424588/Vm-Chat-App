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
    messageSearchQuery: null,
    currentPage: 0,
    searchMessageClick: false,
    lastMessageId: null,
    isSubscribed: false,
    notification_message_id: document.getElementById("notification_message_id").value,
    notification_group_id: document.getElementById("notification_group_id").value,
    groupSearch: false,
    groupReferenceMessageClick: false,
    loader_showing: false,
    groupSearchMessageFound: false,
    // groupSearchCounter: 0,
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
let previousChatList = [];
let messageList = [];
let pagnicateChatList = [];
let results = [];

let searchMessageSet = new Set();

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
        results = await response.json();

        results.forEach(group => {
            let chat = {};
            chat.isGroup = true;
            chat.group = group;
            chat.group.access = [group.access];
            // chat.members = [group.access];
            chat.name = group.name;
            chat.unread = group.unread_count.length > 0 ? group.unread_count : 0;;

            if (group.group_messages && group.group_messages.length > 0) {
                group.group_messages.reverse().forEach(msg => {
                    chat.msg = msg;
                    chat.time = new Date(msg.time * 1000);

                    // const seenBy = msg.seen_by ? msg.seen_by.split(",").map(s => s.trim()) : [];
                    // chat.unread += (msg.sender !== unique_id && !seenBy.includes(unique_id)) ? 1 : 0;
                    chat.unread += group.unread_count;
                });
            }


            DOM.unreadMessagesPerGroup[group.group_id] = chat.unread;

            if (present[chat.name] !== undefined) {
                chatList[present[chat.name]].unread += chat.unread;

            } else {
                present[chat.name] = chatList.length;
                chatList.push(chat);
            }
        });
    } catch (error) {
        // console.log("Error fetching chat groups:", error);
    }
};

let viewChatList = (flag = false) => {
    if (!DOM.groupSearch) {
        previousChatList = [...chatList]
    }
    if (chatList.length === 0) {
        return;
    }
    if (!flag)
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
            // let statusClass = elem.msg && elem.msg.status < 2 ? "far" : "fas";
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
                if (latestMessage != undefined && 'type' in latestMessage) {
                    if (latestMessage.type === "File" || latestMessage.type === "Image" || latestMessage.type === "Audio") {
                        messageText = latestMessage.media_name;
                    } else if (/<a[^>]+>/g.test(latestMessage.msg) || /<audio[^>]+>/g.test(latestMessage.msg)) {
                        messageText = getOldMessageMediaName(latestMessage);
                    }
                    else {
                        let partialText = removeTags(latestMessage.msg.split("\n")[0]);
                        messageText = partialText.replace(/<br\s*\/?>/gi, '')
                            .replace(/<\/?p>/gi, '')
                            .replace(/\n/g, ' ');
                    }
                }
                else {
                    messageText = "No messages";
                }
                if (elem.group.group_messages && elem.group.group_messages.length > 0 && latestMessage != null) {
                    latestMessage.status == "Correction" ? messageText = removeTags(messageText) : messageText = getCleanedTextSnippet(messageText) + (messageText.length > 30 ? "..." : "")
                }

                const senderName = latestMessage && latestMessage.user ? latestMessage.user.name : "";
                const timeText = elem.time ? mDate(elem.time).chatListFormat() : "No messages";
                DOM.chatList2.innerHTML += `
                <div class="d-flex p-2 border-bottom align-items-center tohide${unreadClass}" data-group-id="${elem.group.group_id}" onclick="selectUsertosend('${elem.group.name}','${elem.group.group_id}')">
                    <input type="radio" name="chatSelection" class="chat-radio" style="margin-left: 10px;" onclick="selectUsertosend('${elem.group.name}','${elem.group.group_id}')">
                    <span class='group-imgg'>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.469 31.103C11.009 31.037 10.52 31 10 31C6.17 31 4.031 33.021 3.211 34.028C3.078 34.201 3.007 34.413 3.007 34.632C3.007 34.638 3.007 34.644 3.006 34.649C3 35.019 3 35.509 3 36C3 36.552 3.448 37 4 37H11.172C11.059 36.682 11 36.344 11 36C11 34.862 11 33.506 11.004 32.705C11.004 32.135 11.167 31.58 11.469 31.103ZM34 37H14C13.735 37 13.48 36.895 13.293 36.707C13.105 36.52 13 36.265 13 36C13 34.865 13 33.515 13.004 32.711C13.004 32.709 13.004 32.707 13.004 32.705C13.004 32.475 13.084 32.253 13.229 32.075C14.47 30.658 18.22 27 24 27C30.542 27 33.827 30.651 34.832 32.028C34.943 32.197 35 32.388 35 32.583V36C35 36.265 34.895 36.52 34.707 36.707C34.52 36.895 34.265 37 34 37ZM36.828 37H44C44.552 37 45 36.552 45 36V34.631C45 34.41 44.927 34.196 44.793 34.021C43.969 33.021 41.829 31 38 31C37.507 31 37.042 31.033 36.604 31.093C36.863 31.546 37 32.06 37 32.585V36C37 36.344 36.941 36.682 36.828 37ZM10 19C7.24 19 5 21.24 5 24C5 26.76 7.24 29 10 29C12.76 29 15 26.76 15 24C15 21.24 12.76 19 10 19ZM38 19C35.24 19 33 21.24 33 24C33 26.76 35.24 29 38 29C40.76 29 43 26.76 43 24C43 21.24 40.76 19 38 19ZM24 11C20.137 11 17 14.137 17 18C17 21.863 20.137 25 24 25C27.863 25 31 21.863 31 18C31 14.137 27.863 11 24 11Z" fill="#58595D"/>
</svg></span>

                    <div class="ml-1">
                        <div class="name list-user-name">${elem.group.name}</div>
                    </div>
                </div>`;

                DOM.chatList.innerHTML += `
                    <input type="hidden" id="group-id" value="${elem.group.group_id}"></input>
                    <div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom tohide${unreadClass}" data-group-id="${elem.group.group_id}" onclick="generateMessageArea(this, ${index},false)">
                  <span class='group-imgg'>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.469 31.103C11.009 31.037 10.52 31 10 31C6.17 31 4.031 33.021 3.211 34.028C3.078 34.201 3.007 34.413 3.007 34.632C3.007 34.638 3.007 34.644 3.006 34.649C3 35.019 3 35.509 3 36C3 36.552 3.448 37 4 37H11.172C11.059 36.682 11 36.344 11 36C11 34.862 11 33.506 11.004 32.705C11.004 32.135 11.167 31.58 11.469 31.103ZM34 37H14C13.735 37 13.48 36.895 13.293 36.707C13.105 36.52 13 36.265 13 36C13 34.865 13 33.515 13.004 32.711C13.004 32.709 13.004 32.707 13.004 32.705C13.004 32.475 13.084 32.253 13.229 32.075C14.47 30.658 18.22 27 24 27C30.542 27 33.827 30.651 34.832 32.028C34.943 32.197 35 32.388 35 32.583V36C35 36.265 34.895 36.52 34.707 36.707C34.52 36.895 34.265 37 34 37ZM36.828 37H44C44.552 37 45 36.552 45 36V34.631C45 34.41 44.927 34.196 44.793 34.021C43.969 33.021 41.829 31 38 31C37.507 31 37.042 31.033 36.604 31.093C36.863 31.546 37 32.06 37 32.585V36C37 36.344 36.941 36.682 36.828 37ZM10 19C7.24 19 5 21.24 5 24C5 26.76 7.24 29 10 29C12.76 29 15 26.76 15 24C15 21.24 12.76 19 10 19ZM38 19C35.24 19 33 21.24 33 24C33 26.76 35.24 29 38 29C40.76 29 43 26.76 43 24C43 21.24 40.76 19 38 19ZM24 11C20.137 11 17 14.137 17 18C17 21.863 20.137 25 24 25C27.863 25 31 21.863 31 18C31 14.137 27.863 11 24 11Z" fill="#58595D"/>
</svg>
</span>
 <div class="w-50">
                            <div class="name list-user-name">${elem.group.name.length > 23 ? elem.group.name.substring(0, 23) + "..." : elem.group.name}</div>
                            <div class="small last-message">
                                ${elem.isGroup ? (latestMessage ? senderName + ": " : "") : ""}
                                ${latestMessage
                        ? (latestMessage.is_compose === 1 || latestMessage.is_compose === true)
                            ? processValue(messageText, true).concat("...")
                            : messageText
                        : "No Messages"
                    }
                            </div>
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
    return mediaName
}

function getOldMessageType1(message) {

    if (/<audio[^>]+>/g.test(message.msg)) {
        return "Audio"
    }
    const linkTag = message.msg.match(/<a[^>]+>/g)[0];
    fileLink = linkTag.match(/href="([^"]+)"/)[1];
    const mediaName = fileLink.split('uploads/')[1];
    const displayMediaName = message.media_name || mediaName;
    const mediaType = displayMediaName.split('.').pop().toLowerCase() === 'pdf' ? 'document' : 'image';
    return mediaType
}
function getOldMessageType(message) {
    // Check if the message contains an audio tag
    if (/<audio[^>]+>/g.test(message.msg)) {
        return "Audio";
    }

    // Check if the message contains a link tag
    const linkTags = message.msg.match(/<a[^>]+>/g);
    if (linkTags && linkTags.length > 0) {
        const linkTag = linkTags[0];
        const fileLink = linkTag.match(/href="([^"]+)"/)[1];
        const mediaName = fileLink.split('uploads/')[1];
        const displayMediaName = message.media_name || mediaName;
        const mediaType = displayMediaName.split('.').pop().toLowerCase() === 'pdf' ? 'document' : 'image';
        return mediaType;
    }

    // Check for simple HTML tags (like <p>, <h2>, etc.)
    if (/<(p|h[1-6])[^>]*>.*?<\/(p|h[1-6])>/g.test(message.msg)) {
        return "Text"; // or any other type you want to return for simple HTML tags
    }
    if (/[\s\n]+/.test(message.msg) && !/<[^>]+>/.test(message.msg)) {
        return "Message"; // or any other type you want to return for messages with spaces and newlines
    }
    // If none of the above conditions are met, return a default type
    return "Unknown";
}
function removeTags(messageText) {
    return messageText.replace(/<\/?p>/g, '')
}
function getCleanedTextSnippet(text) {
    return text
        .replace(/<br\s*\/?>/gi, '')
        .replace(/<\/?p>/gi, '')
        .replace(/\n/g, ' ')
        .slice(0, 30);
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
            const messageObject = JSON.stringify(elem)
                .replace(/\\/g, '\\\\') // Escape backslashes
                .replace(/'/g, '\\\'')  // Escape single quotes
                .replace(/"/g, '&quot;') // Escape double quotes
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r')   // Escape carriage returns
                .replace(/\t/g, '\\t');
            const senderName = elem.user.name;
            let time = new Date(elem.time * 1000)
            const timeText = elem.time ? mDate(time).chatListFormat() : "No messages";
            if (elem.type == "Message" || elem.type == null) {
                let messageText = elem.msg.includes("<p>") ? elem.msg.replace(/<\/?p>/g, "") : elem.msg;
                DOM.messagesList.innerHTML += `
                <input type="hidden" id="group-id" value="${elem.group.group_id}"></input>
                <div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom tohide${unreadClass}" data-group-id="${elem.group.group_id}" onclick="generateMessageArea(this,${index},true,${messageObject})">
                 <span class='group-imgg'>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.469 31.103C11.009 31.037 10.52 31 10 31C6.17 31 4.031 33.021 3.211 34.028C3.078 34.201 3.007 34.413 3.007 34.632C3.007 34.638 3.007 34.644 3.006 34.649C3 35.019 3 35.509 3 36C3 36.552 3.448 37 4 37H11.172C11.059 36.682 11 36.344 11 36C11 34.862 11 33.506 11.004 32.705C11.004 32.135 11.167 31.58 11.469 31.103ZM34 37H14C13.735 37 13.48 36.895 13.293 36.707C13.105 36.52 13 36.265 13 36C13 34.865 13 33.515 13.004 32.711C13.004 32.709 13.004 32.707 13.004 32.705C13.004 32.475 13.084 32.253 13.229 32.075C14.47 30.658 18.22 27 24 27C30.542 27 33.827 30.651 34.832 32.028C34.943 32.197 35 32.388 35 32.583V36C35 36.265 34.895 36.52 34.707 36.707C34.52 36.895 34.265 37 34 37ZM36.828 37H44C44.552 37 45 36.552 45 36V34.631C45 34.41 44.927 34.196 44.793 34.021C43.969 33.021 41.829 31 38 31C37.507 31 37.042 31.033 36.604 31.093C36.863 31.546 37 32.06 37 32.585V36C37 36.344 36.941 36.682 36.828 37ZM10 19C7.24 19 5 21.24 5 24C5 26.76 7.24 29 10 29C12.76 29 15 26.76 15 24C15 21.24 12.76 19 10 19ZM38 19C35.24 19 33 21.24 33 24C33 26.76 35.24 29 38 29C40.76 29 43 26.76 43 24C43 21.24 40.76 19 38 19ZM24 11C20.137 11 17 14.137 17 18C17 21.863 20.137 25 24 25C27.863 25 31 21.863 31 18C31 14.137 27.863 11 24 11Z" fill="#58595D"/>
                    </svg>
                    </span>
                  <div class="w-50">
                    <div class="name list-user-name">${elem.group.name}</div>
                    <div class="small last-message">${elem ? senderName + ": " : ""}${messageText.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '').replace(/<a[^>]*>(.*?)<\/a>/g, '$1')}</div>
                  </div>

                  <div class="flex-grow-1 text-right">
                    <div class="small time">${timeText}
                    </div>
                   ${elem.unread > 0 ? `<div class="${elem.group.group_id} badge badge-success badge-pill small" id="unread-count">${elem.unread}</div>` : ""}
                  </div>
                </div>`;
            }
            else {
                if (/<a[^>]+>/g.test(elem.msg) && !/<audio[^>]+>/g.test(elem.msg)) {
                    messageText = getOldMessageMediaName(elem);
                    // let messageText = elem.msg.includes("<p>") ? elem.msg.replace(/<\/?p>/g, "") : elem.msg;
                    DOM.messagesList.innerHTML += `
                    <input type="hidden" id="group-id" value="${elem.group.group_id}"></input>
                    <div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom tohide${unreadClass}" data-group-id="${elem.group.group_id}" onclick="generateMessageArea(this,${index},true,${elem.id})">

                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.469 31.103C11.009 31.037 10.52 31 10 31C6.17 31 4.031 33.021 3.211 34.028C3.078 34.201 3.007 34.413 3.007 34.632C3.007 34.638 3.007 34.644 3.006 34.649C3 35.019 3 35.509 3 36C3 36.552 3.448 37 4 37H11.172C11.059 36.682 11 36.344 11 36C11 34.862 11 33.506 11.004 32.705C11.004 32.135 11.167 31.58 11.469 31.103ZM34 37H14C13.735 37 13.48 36.895 13.293 36.707C13.105 36.52 13 36.265 13 36C13 34.865 13 33.515 13.004 32.711C13.004 32.709 13.004 32.707 13.004 32.705C13.004 32.475 13.084 32.253 13.229 32.075C14.47 30.658 18.22 27 24 27C30.542 27 33.827 30.651 34.832 32.028C34.943 32.197 35 32.388 35 32.583V36C35 36.265 34.895 36.52 34.707 36.707C34.52 36.895 34.265 37 34 37ZM36.828 37H44C44.552 37 45 36.552 45 36V34.631C45 34.41 44.927 34.196 44.793 34.021C43.969 33.021 41.829 31 38 31C37.507 31 37.042 31.033 36.604 31.093C36.863 31.546 37 32.06 37 32.585V36C37 36.344 36.941 36.682 36.828 37ZM10 19C7.24 19 5 21.24 5 24C5 26.76 7.24 29 10 29C12.76 29 15 26.76 15 24C15 21.24 12.76 19 10 19ZM38 19C35.24 19 33 21.24 33 24C33 26.76 35.24 29 38 29C40.76 29 43 26.76 43 24C43 21.24 40.76 19 38 19ZM24 11C20.137 11 17 14.137 17 18C17 21.863 20.137 25 24 25C27.863 25 31 21.863 31 18C31 14.137 27.863 11 24 11Z" fill="#58595D"/>
</svg>
</span>
                      <div class="w-50">
                        <div class="name list-user-name">${elem.group.name}</div>
                        <div class="small last-message">${elem ? senderName + ": " : ""}${messageText.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '').replace(/<a[^>]*>(.*?)<\/a>/g, '$1')}</div>
                      </div>

                      <div class="flex-grow-1 text-right">
                        <div class="small time">${timeText}
                        </div>
                       ${elem.unread > 0 ? `<div class="${elem.group.group_id} badge badge-success badge-pill small" id="unread-count">${elem.unread}</div>` : ""}
                      </div>
                    </div>`;
                };

            }

        });
};

let generateChatList = async () => {
    DOM.chatList.innerHTML = '';
    await populateGroupList();
    viewChatList();
};

let addDateToMessageArea = (date) => {
    DOM.messages.innerHTML += `
	<div class="mx-auto my-2  text-dark small py-1 px-2 rounded"  style="visibility: hidden;">
		//${date}
	</div>`;
};

let addUnread = () => {
    var unreadDiv = document.getElementById("unread-wrapper");
    var oldCount = null;
    if (unreadDiv) {
        oldCount = document.getElementById("unread-counter-div").innerHTML.trim();
        unreadDiv.remove();
        DOM.notificationDiv.innerHTML = DOM.unreadCounter + parseInt(oldCount);
    }

    const span = document.createElement('span');
    span.innerHTML = `
            <div id="unread-wrapper" class="notification-wrapper">
                <div class="unread-messages">
                    <span id="unread-counter-div">${oldCount ? DOM.unreadCounter + parseInt(oldCount) : DOM.unreadCounter}</span> UNREAD MESSAGES
                </div>
            </div>
        `;
    // DOM.unreadDividerAdded = true;
    DOM.messages.insertBefore(span, DOM.messages.firstChild);
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

socket.on('deleteMessage', (messageId, isMove) => {

    if (isMove == true) {

        var messageElement = $('[data-message-id="' + messageId + '"]').closest('.ml-3');
        if (messageElement) {
            messageElement.remove();
        }
    }
    else {

        var messageElement = $('[data-message-id="' + messageId + '"]').closest('.ml-3');

        if (user.role != 0 && user.role != 2) {

            if (messageElement) {
                messageElement.remove();
                viewChatList();
            }
            else {
                var replyLink = messageElement.find('#reply-link');
                if (replyLink.length) {

                    replyLink.replaceWith(`
                        <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;"
                           id="restore-button-${messageId}" onclick="restoreMessage(${messageId})" data-message-id="${messageId}">Restore</a>
                    `);

                }
                viewChatList();
            }
        }
        else {

            var replyLink = messageElement.find('#reply-link');

            if (replyLink.length) {
                replyLink.replaceWith(`
                        <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;"
                           id="restore-button-${messageId}" onclick="restoreMessage(${messageId})" data-message-id="${messageId}">Restore</a>
                    `);
            }
            // const message = findMessageById(messageId);
            const message = getPaginatedArrayLastMessage(messageId);

            updateChatList(message)
        }
        messageElement.find(".additional_style").addClass("msg_deleted");
        messageElement.find("#message-" + messageId).addClass("deleted_niddle");

    }
});
// function getPaginatedArrayLastMessage(id) {
//
//     if (pagnicateChatList && pagnicateChatList.data) {
//         return pagnicateChatList.data.reverse()[pagnicateChatList.data.length - 1]
//     }
//     else {
//         let group = chatList.find(group =>
//             group.group.group_messages.some(message => message.id === id)
//         );
//         if (group) {
//

//             let lastMessage;

//             if (Array.isArray(group.group_messages)) {
//                 lastMessage = group.group_messages[group.group_messages.length - 1];
//             } else {
//                 lastMessage = group.group_messages;
//             }
//
//             return lastMessage;
//         } else {
//             console.log("Group not found");
//         }
//     }
//
// }

function getPaginatedArrayLastMessage(id) {

    if (pagnicateChatList && pagnicateChatList.data && pagnicateChatList.data.length > 0) {
        const sortedMessages = pagnicateChatList.data.sort((a, b) => b.id - a.id);
        const lastMessage = sortedMessages[0];
        // return pagnicateChatList.data.reverse()[pagnicateChatList.data.length - 1]
        return lastMessage;
    } else {
        let group = chatList.find(group =>
            group.group.group_messages.some(message => message.id === id)
        );
        if (group) {

            let lastMessage;

            if (Array.isArray(group.group.group_messages)) {
                lastMessage = group.group.group_messages[group.group.group_messages.length - 1];
            } else {
                lastMessage = group.group.group_messages;
            }
            return lastMessage;
        } else {
            return null;
        }
    }
}

function findMessageById(messageId) {
    if (pagnicateChatList && pagnicateChatList.data) {
        return pagnicateChatList.data.find(message => message.id === messageId);
    }
    else {

        let group = chatList.find(group =>
            group.group.group_messages.some(message => message.id === messageId)
        );
        let deleteMessage = group ? group.group.group_messages.find(message => message.id === messageId) : null;

        return deleteMessage;
    }
}

function updateChatList(message) {
    if (pagnicateChatList && pagnicateChatList.data) {
        if (pagnicateChatList.data.length > 0) {
            let currentUsergroup = chatList.find(group => group.group.group_id === message.group_id);
            if (currentUsergroup) {
                if (user.role != 0 && user.role != 2) {
                    let paginateArrayLastMessage = pagnicateChatList.data.reverse()[pagnicateChatList.data.length - 1]
                    currentUsergroup.group.group_messages.push(paginateArrayLastMessage);
                    viewChatList();
                }
                else {
                    const findMessage = pagnicateChatList.data.find((message) => message.id === parseInt(message.id));
                    if (findMessage.id == message.id) {
                        let paginateArrayLastMessage = pagnicateChatList.data.reverse()[pagnicateChatList.data.length - 1]
                        currentUsergroup.group.group_messages.push(paginateArrayLastMessage);
                    }
                    else {
                        let paginateArrayLastMessage = pagnicateChatList.data[pagnicateChatList.data.length - 1]
                        currentUsergroup.group.group_messages.push(paginateArrayLastMessage);
                    }
                    viewChatList();
                }
            }
        }
    }
    else {
        let currentUsergroup = chatList.find(group => group.group.group_id === message.group_id);
        if (currentUsergroup) {
            currentUsergroup.group.group_messages.push(message);

            viewChatList();
        }
    }
}

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

    let groupToUpdate = null;

    if (DOM.groupSearch) {
        groupToUpdate = previousChatList.find(chat => chat.group.group_id === message.group_id);
    }
    else {
        groupToUpdate = chatList.find(chat => chat.group.group_id === message.group_id);
    }
    if (groupToUpdate && groupToUpdate.group.group_id === DOM.groupId) {
        if (!groupToUpdate.group.group_messages) {
            groupToUpdate.group.group_messages = [];
        }
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
        if (DOM.groupSearch) {
            groupToUpdate = previousChatList.find(chat => chat.group.group_id === message.group_id);
        }
        else {
            groupToUpdate = chatList.find(chat => chat.group.group_id === message.group_id);
        }
        if (!groupToUpdate.group.group_messages) {
            groupToUpdate.group.group_messages = [];
        }
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

socket.on('moveMessage', async (moveMessages, newGroupId, preGroupId, uniqueId) => {
    if (user.unique_id != uniqueId) {
        if (DOM.groupId == null || DOM.groupId !== newGroupId) {
            let newGroup = chatList.find(group => group.group.group_id == newGroupId);
            if (newGroup) {
                if (moveMessages.messages.length > 1) {
                    moveMessages.messages.sort((a, b) => b.id = a.id);
                    moveMessages.messages.forEach(message => {
                        newGroup.time = new Date(moveMessages.messages[0].time * 1000);
                        newGroup.group.group_messages.push(message);
                        newGroup.unread += 1
                    });
                }
                else {
                    newGroup.time = new Date(moveMessages.messages[0].time * 1000);
                    if (!newGroup.group.group_messages) {
                        newGroup.group.group_messages = [];
                    }
                    newGroup.group.group_messages.push(moveMessages.messages[0])
                    newGroup.unread += 1
                }

                rerenderChatList(preGroupId);
            }
        }
        else {
            let newGroup = chatList.find(group => group.group.group_id == newGroupId);
            if (newGroup) {
                if (moveMessages.messages.length > 1) {
                    moveMessages.messages.sort((a, b) => b.id = a.id);
                    moveMessages.messages.forEach(message => {
                        newGroup.time = new Date(moveMessages.messages[0].time * 1000);
                        if (!newGroup.group.group_messages) {
                            newGroup.group.group_messages = [];
                        }
                        newGroup.group.group_messages.push(message);
                    });
                }
                else {
                    newGroup.time = new Date(moveMessages.messages[0].time * 1000);
                    if (!newGroup.group.group_messages) {
                        newGroup.group.group_messages = [];
                    }
                    newGroup.group.group_messages.push(moveMessages.messages[0])
                }

                moveMessages.messages.forEach(message => {
                    addMessageToMessageArea(message, true);
                });

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
        }
    }
    else if (user.unique_id == uniqueId) {
        const newIndex = chatList.findIndex(group => group.group.group_id === newGroupId);
        const newGroupChatListItem = document.querySelector(`[data-group-id="${newGroupId}"]`);
        generateMessageArea(newGroupChatListItem, newIndex, false, null);

        let newGroup = chatList.find(group => group.group.group_id == newGroupId);
        if (newGroup) {
            if (moveMessages.messages.length > 1) {
                moveMessages.messages.sort((a, b) => b.id = a.id);
                moveMessages.messages.forEach(message => {
                    newGroup.time = new Date(moveMessages.messages[0].time * 1000);
                    newGroup.group.group_messages.push(message);
                    const seenBy = message.seen_by ? message.seen_by.split(",").map(s => s.trim()) : [];
                    newGroup.unread += (message.sender !== user.unique_id && !seenBy.includes(user.unique_id)) ? 1 : 0;
                });
            }
            else {
                newGroup.time = new Date(moveMessages.messages[0].time * 1000);
                if (!newGroup.group.group_messages) {
                    newGroup.group.group_messages = [];
                }
                newGroup.group.group_messages.push(moveMessages.messages[0])
                const seenBy = moveMessages.messages[0].seen_by ? moveMessages.messages[0].seen_by.split(",").map(s => s.trim()) : [];
                newGroup.unread += (moveMessages.messages[0].sender !== user.unique_id && !seenBy.includes(user.unique_id)) ? 1 : 0;
            }
            rerenderChatList(preGroupId);
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
    else {
        if (user.unique_id != uniqueId) {
            moveMessages.messages.forEach(message => {
                addMessageToMessageArea(message, true);
            });
        }
    }
    // generateChatList();
});

async function rerenderChatList(preGroupId) {
    const response = await fetch(`get-group-last-message/${preGroupId}`, {
        method: 'GET',
        headers: {
            'content-type': 'application/json'
        }
    });
    let lastMessage = await response.json();
    const prevGroup = chatList.find(group => group.group.group_id == preGroupId);
    if (prevGroup) {
        prevGroup.group.group_messages.push(lastMessage)
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

socket.on('updateEditedMessage', (editedMessage) => {
    const messageElement = document.querySelector(`[data-message-id="${editedMessage.id}"]`);
    if (messageElement) {
        updateViewChatList(editedMessage);
        function formatMessageForDisplay(message) {
            return message.replace(/(?:\r\n|\r|\n)/g, '<br>');
        }
        const messageContentDiv = messageElement.querySelector('div.shadow-sm');

        let newMessageDisplay = '';
        if (messageElement) {
            if (editedMessage.reply) {

                if (editedMessage.reply.type === "Message" && !/<a[^>]+>/g.test(editedMessage.msg) && !/<audio[^>]+>/g.test(editedMessage.msg) || editedMessage.type === null || editedMessage.reply.type === null) {

                    newMessageDisplay = `<div class="reply-message-area">${formatMessageForDisplay(editedMessage.msg)}</div>`;
                    const replyMessage = editedMessage.reply.msg;
                    newMessageDisplay = `
                        <div class="reply-message-div" onclick="scrollToMessage('${editedMessage.reply.id}')">
                            <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                                ${editedMessage.user.name}
                            </div>
                            <div class="reply-details">
                                <p class="file-name">${replyMessage.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '').substring(0, 200)}${replyMessage.length > 100 ? '....' : ''}</p>
                            </div>
                        </div>
                        ${newMessageDisplay}`;

                    messageContentDiv.innerHTML = newMessageDisplay;
                }
                else if (editedMessage.reply.type === "Image") {
                    var message_body = `<img  src="${editedMessage.reply.msg}" style="height:125px; width:100%;">`;

                    newMessageDisplay = `
                    <div class="reply-message-div" onclick="scrollToMessage('${editedMessage.reply.id}')"> <!-- Add onclick here -->
                        <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                            ${editedMessage.user?.id == user?.id ? editedMessage.user.name : editedMessage.user.name}
                        </div>
                        <div class="reply-details">
                            <p class="file-name">${message_body}</p>
                        </div>
                    </div>
                    <div class="reply-message-area">${editedMessage.msg}</div>`;
                    messageContentDiv.innerHTML = newMessageDisplay;
                }
                else if (editedMessage.reply.type === "File") {
                    const add_file_view = `
                     <div class="reply-message-div" onclick="scrollToMessage('${editedMessage.reply.id}')">
                       <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                                ${editedMessage.user.name}
                            </div>
                    <div class="file-message">
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
                    </div>`
                        ;

                    newMessageDisplay = `
                    <div class="">
                        ${add_file_view}
                    </div>
                    <div class="reply-message-area">${editedMessage.msg.replace(/[\r\n]+/g, '<br>')}</div>`;
                    messageContentDiv.innerHTML = newMessageDisplay;
                }
                else if (/<a[^>]+>/g.test(editedMessage.reply.msg)) {
                    let fileLink;
                    const linkTag = editedMessage.reply.msg.match(/<a[^>]+>/g)[0];
                    fileLink = linkTag.match(/href="([^"]+)"/)[1];
                    const mediaName = fileLink.split('uploads/')[1];
                    const displayMediaName = mediaName;
                    const mediaType = displayMediaName.split('.').pop().toLowerCase() === 'pdf' ? 'document' : 'image';
                    if (mediaType == "document") {
                        newMessageDisplay = `<div class="reply-message-area">${editedMessage.msg.replace(/[\r\n]+/g, '<br>')}</div>`;

                        newMessageDisplay = `
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
                         ${newMessageDisplay}
                    `;

                        messageContentDiv.innerHTML = newMessageDisplay;
                    }

                }
                else if (editedMessage.reply.type === "Audio") {
                    var audioSrc = editedMessage.reply.msg.replace(/\/\//g, '/');
                    var message_body = `<div class="audio-message" style="background-color:${editedMessage.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${audioSrc}">
                        <div class="avatar">
                            <!-- Avatar image here -->
                        </div>
                        <div class="audio-content">
                            <div class="audio-controls">
                                <button class="playbutton">
                                   <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
                        </svg>
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
                if (editedMessage.type == "Message") {
                    newMessageDisplay = formatMessageForDisplay(editedMessage.msg);
                }
                else {


                    messageContentDiv.innerHTML = editedMessage.msg.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '');
                }
            }

            if (editedMessage.type != null) {
                messageContentDiv.innerHTML = newMessageDisplay;

                const additionalFeatures = `
                    <div style="color: #463C3C; font-size:14px; font-weight:400; margin-top: 10px; width: 100%; background-color: transparent;">
                        <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">${editedMessage.user.name}</span> |
                        <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">(${makeformatDate(new Date(editedMessage.time * 1000))})</span> |
                          <span>
                            <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" data-toggle="modal" data-target="#seenModal" data-message-id="${editedMessage.id}">Seen</a> |
                        </span>
                        <span>
                            <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;" id="reply-link" onclick="showReply('${editedMessage.id}','${editedMessage.user.name}','${editedMessage.type}')" data-message-id="${editedMessage.id}">Reply</a>
                        </span>

                    </div>
                `;

                const dropdown = `
                    <div class="dropdown" style="position: absolute; top: 10px; right: 8px;">
                        <a href="#" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="fas fa-angle-down text-muted px-2"></i>
                        </a>
                        <div class="dropdown-menu custom-shadow" aria-labelledby="dropdownMenuButton">
                            ${user.role === '0' || user.role === '2' ? `
                                <a class="dropdown-item" href="#" onclick="editMessage('${editedMessage.id}')">Edit</a>
                                <a class="dropdown-item" href="#" data-toggle="modal" data-target="#deleteModal" data-message-id="${editedMessage.id}">Delete</a>
                            ` : ''}
                            ${user.role === '3' && editedMessage.sender === user.unique_id ? `
                                <a class="dropdown-item" href="#" data-toggle="modal" data-target="#deleteModal" data-message-id="${editedMessage.id}">Delete</a>
                            ` : ''}
                        </div>
                    </div>
                `;

                if (editedMessage.type == "Message") {
                    newMessageDisplay = formatMessageForDisplay(editedMessage.msg);
                }
                else {

                    messageContentDiv.innerHTML = editedMessage.msg.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '');
                }
                if (messageContentDiv) {

                    const hasDropdown = messageContentDiv.querySelector('.dropdown') !== null;
                    if (hasDropdown) {
                        messageContentDiv.innerHTML += dropdown;
                        messageContentDiv.parentNode.innerHTML += additionalFeatures;
                    }
                }
            }

        } else {
            console.error('Message element not found for ID:', editedMessage.id);
        }
    }
    else {

        updateViewChatList(editedMessage);
    }
});

socket.on('restoreMessage', (incomingMessage) => {

    if (user.role != 0 && user.role != 2) {

        updateChatList(incomingMessage.message);
        addMessageToMessageArea(incomingMessage.message, true);
    } else {
        const restoreButton = $(`#restore-button-${incomingMessage.message.id}`);
        const mainDiv = $(`#message-${incomingMessage.message.id}`);
        mainDiv.removeClass("deleted_niddle");
        mainDiv.find(".additional_style").removeClass("msg_deleted");
        if (restoreButton.length > 0) {
            restoreButton.replaceWith(`
                <span id="reply-link" style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666; "
                      onclick="showReply('${incomingMessage.message.id}','${incomingMessage.message.sender}','${incomingMessage.message.type}')">
                    Reply
                </span>
            `);
        }
    }
});

function updateViewChatList(editedMessage) {

    const chatEntry = chatList.find(chat => chat.msg && chat.msg.id === editedMessage.id);
    if (chatEntry) {
        chatEntry.msg.msg = editedMessage.msg;
        viewChatList();
    }
}

function processValue(value, isChatList = false) {
    value = value.replace(/<br\s*\/?>/gi, '\n');
    value = value.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    value = value.replace(/<[^>]*>/g, '');
    value = value.trim();
    return isChatList ? value.replace(/\r\n/g, '<br>')
        .replace(/\n/g, '<br>')
        .replace(/<i[^>]+>/g, '').slice(0, 12) :
        value.replace(/\r\n/g, '<br>')
            .replace(/\n/g, '<br>')
            .replace(/<i[^>]+>/g, '');
}

let addMessageToMessageArea = (message, flag = false) => {
    let msgDate = mDate(message.time).getDate();
    let profileImage = `<img src="assets/profile_pics/${message.user?.pic ?? message.user?.profile_img}" alt="Profile Photo" class="img-fluid rounded-circle" style="height:40px; width:40px; margin-top:5px">`;
    let senderName = message.user.name;
    let messageContent;
    let oldMessageType = null;
    if (/<a[^>]+>/g.test(message.msg) || /<audio[^>]+>/g.test(message.msg)) {
        // console.log("this is the old message",message);
        oldMessageType = getOldMessageType(message);
        message.type=oldMessageType;
        // console.log("this is the old message type :",oldMessageType);
        // console.log("this is the old message after assgining type",message);
    }
    if (message.type === 'File') {
        if (message.reply) {
            if (message.reply.type === 'Image') {
                var message_body = `<img class="view-image" src="${message.reply.msg}" style="height:125px; width:125px;">`;
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
                       <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
                        </svg>
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
            <div class="file-message" onclick="scrollToMessage('${message.reply.id}','${message.id}')">
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
    else if (message.type === 'document') {
        let fileLink;
        // if (/<a[^>]+>/g.test(message.msg)) {
            const linkTag = message.msg.match(/<a[^>]+>/g)[0];
            fileLink = linkTag.match(/href="([^"]+)"/)[1];
            const mediaName = fileLink.split('uploads/')[1];
            const displayMediaName = message.media_name || mediaName;
            const mediaType = displayMediaName.split('.').pop().toLowerCase() === 'pdf' ? 'document' : 'image';
            if (message.reply) {
                message.reply.type=getOldMessageType(message.reply);
                if(message.reply.type == "Message")
                {

                    messageContent=`
                    <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')"> <!-- Add onclick here -->
                    <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                        ${message.user?.id == user?.id ? message.user.name : message.user.name}
                    </div>
                    <div class="reply-details">
                        <p class="file-name">${message.reply.msg}</p>
                    </div>
                </div>
               <div class="file-message bg-white mt-2 shadow">
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

                    `
                }
                else if(message.reply.type == "Image"){
                    messageContent=`
                    <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')"> <!-- Add onclick here -->
                    <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                        ${message.user?.id == user?.id ? message.user.name : message.user.name}
                    </div>
                    <div class="reply-details">
                        <p class="file-name">${message.reply.msg}</p>
                    </div>
                </div>
               <div class="file-message bg-white mt-2 shadow">
                    <img src="${fileLink}" style="height:222px; width:100%;">
                </div>
                    `
                }
                else if(message.reply.type == "Aidio"){
                    const audioTag = message.reply.msg.match(/<audio[^>]+>/g)[0];
                    audioSrc = audioTag.match(/src="([^"]+)"/)[1];
                    messageContent=`
                    <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')"> <!-- Add onclick here -->
                    <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                        ${message.user?.id == user?.id ? message.user.name : message.user.name}
                    </div>
                    <div class="reply-details">
                        <p class="file-name">${message.reply.msg}</p>
                    </div>
                </div>

        <div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${audioSrc}">
            <div class="avatar">
                <!-- Avatar image here -->
            </div>
            <div class="audio-content">
                <div class="audio-controls">
                    <button class="play-button">
                       <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
                        </svg>
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
                    `
                }
            }
            else{
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
            }
    }
    else if (message.type === 'Image') {
        if (message.reply) {
            if (message.reply.type === 'Image') {
                var message_body = `<img class="view-image" src="${message.reply.msg}" style="height:125px; width:100%">`;
            } else if (message.reply.type === 'File') {
                var message_body = `<img  src="${message.reply.msg}" style="height:125px; width:125px;">`;
            } else if (message.reply.type === 'Audio') {
                var message_body = `<img  src="${message.reply.msg}" style="height:125px; width:125px;">`;
            } else {
                var message_body = message.reply.msg;
            }

            var message_new = `<img src="${message.message ?? message.msg}" class="view-image" style="height:222px; width:100%;">`;
            messageContent = `
                <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')"> <!-- Add onclick here -->
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
            <img src="${message.message ?? message.msg}" data-original="${message.message ?? message.msg}" class="view-image"" style="height:222px; width:100%;">
        `;
        }
    } else if (message.type === 'Message' || message.type === null && !/<audio[^>]+>/g.test(message.msg)) {
        if (message.reply) {
            if (message.reply.type === 'Image' || oldMessageType == "File") {
                var message_body = `<img  src="${message.reply.msg}" style="height:125px; width:100%;">`;
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
            } else if (message.reply.type === 'Audio' || /<audio[^>]+>/g.test(message.reply.msg)) {
                let audioTag = message.reply.msg.startsWith("https://")
                    ? message.reply.msg
                    : message.reply.msg.match(/<audio[^>]+>/g)[0];

                audioSrc = message.reply.msg.startsWith("https://") ? message.reply.msg : audioTag.match(/src="([^"]+)"/)[1];
                var message_body = `<div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${audioSrc}">
            <div class="avatar">
                <!-- Avatar image here -->
            </div>
            <div class="audio-content">
                <div class="audio-controls">
                    <button class="playbutton">
                       <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
                        </svg>
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
                const dots = message.reply.msg.length > 100 ? '...' : '';
                if (message.reply.is_compose == 1) {



                    var message_body = processValue(message.reply.msg, false).substring(0, 200) + dots;
                }
                else {

                    var message_body = message.reply.msg.replace(/<br\s*\/?>/gi, '\n').replace(/<i[^>]+>/g, '').replace(/<\/?[^>]+(>|$)/g, "").substring(0, 200) + dots;
                }
            }
            messageContent = `
            <div class="reply-message-div"  onclick="scrollToMessage('${message.reply.id}','${message.id}')">
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
            if (message.is_compose === 1) {
                messageContent = processValue(message.msg || message.message, false);
            } else {
                messageContent = (message.msg || message.message)
                    .replace(/\r\n/g, '<br>')
                    .replace(/\n/g, '<br>')
                    .replace(/<i[^>]+>/g, '')
                    ;
            }

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
                       <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
                        </svg>
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
        let messageElement = document.createElement('div');
        messageElement.className = "ml-3";
        messageElement.innerHTML = `
            <div class="" ${message.user.id == user.id ? '' : 'style="display:flex"'}>
            ${message.user.id == user.id ? '' : profileImage}
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
                                <div class="dropdown" style="position: absolute; top: ${message.reply ? '0px' : (message.type === 'Message' ? '-2px' : '-2px')}; right: 0px;">
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
                                    ${message.is_compose === 1 && message.type === "Message" && !message.reply ? `
                                    <a class="dropdown-item" href="#" onclick="moveMessage(${message.id})">Move</a>
                                    ` : ''}
                                    ` : ''}
                                    <!---
                                    ${user.role === '0' || user.role === '2' ? `
                                    <a class="dropdown-item" href="#" onclick="CorrectionMessage('${message.id}','${senderName}')">Correction</a>
                                    ` : ''}---->
                                    ${(message.is_compose !== 1 && message.is_compose !== true) && (user.role === '0' || user.role === '2') ? `
                                        <a class="dropdown-item" href="#" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
                                    ` : ''}
                                    ${(message.is_compose !== 1 && message.is_compose !== true) && (user.role === '3' && message.sender === user.unique_id) ? `
                                    <a class="dropdown-item" href="#" data-toggle="modal" data-target="#deleteModal" data-message-id="${message.id}">Delete</a>
                                    ` : ''}
                                </div>
                                </div>
                            ` : ``}


                            ${user.role != '1' && user.role != '3' && message.sender != user.unique_id ? `
                                <div class="dropdown ${(message.type === "Message" || message.type === null && !/<a[^>]+>/g.test(message.msg) && !/<audio[^>]+>/g.test(message.msg)) && (message.is_compose === 1 || message.is_compose == true) ? '' : 'd-none'}" style="position: absolute; top: ${message.reply ? '0px' : (message.type === 'Message' ? '-2px' : '-2px')}; right: 0px;}>
                                <a href="#" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fas fa-angle-down text-muted px-2"></i>
                                </a>
                                <div class="dropdown-menu custom-shadow" aria-labelledby="dropdownMenuButton">
                                    ${!(user.role === '0' || user.role === '2') && message.sender != user.unique_id && !/<a[^>]+>/g.test(message.msg) && !/<audio[^>]+>/g.test(message.msg) ? `

                                    <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
                                    ` : ''}
                                    ${user.role === '0' || user.role === '2' ? `
                                        ${(message.type === "Message" || message.type === null && !/<a[^>]+>/g.test(message.msg) && !/<audio[^>]+>/g.test(message.msg)) ? `
                                        <a class="dropdown-item" href="#" onclick="editMessage('${message.id}')">Edit</a>
                                        ` : ''}
                                    ${(message.type === "Message" || message.type === null && !/<a[^>]+>/g.test(message.msg) && !/<audio[^>]+>/g.test(message.msg)) && (message.is_compose === 1 || message.is_compose == true) ? `
                                    <a class="dropdown-item" href="#" onclick="CorrectionMessage('${message.id}','${senderName}')">Correction </a>
                                    ` : ''}
                                    ${message.is_compose === 1 && message.type === "Message" && !message.reply ? `
                                    <a class="dropdown-item" href="#" onclick="moveMessage(${message.id})">Move</a>
                                    ` : ''}
                                    ` : ''}
                                    <!---
                                    ${user.role === '0' || user.role === '2' ? `
                                    <a class="dropdown-item" href="#" onclick="CorrectionMessage('${message.id}','${senderName}')">Correction</a>
                                    ` : ''}---->
                                    ${(message.is_compose !== 1 && message.is_compose !== true) && user.role === '0' || user.role === '2' ? `
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
        `;
        if (flag) {
            DOM.messages.appendChild(messageElement);
        }
        else {
            DOM.messages.insertBefore(messageElement, DOM.messages.firstChild);
        }
    }
    else if (message.is_privacy_breach && user.role == 0 || user.role == 2) {

        let messageElement = document.createElement('div');
        messageElement.className = "ml-3";
        messageElement.innerHTML = `

              <div class="" ${message.user.id == user.id ? '' : 'style="display:flex"'}>
            ${message.user.id == user.id ? '' : profileImage}
                <div class="align-self-${message.user.id == user.id ? 'end self' : 'start'} d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item ${message.user.id == user.id ? 'right-nidle' : 'left-nidle'}" data-message-id="${message.id}" id="message-${message.id}">
                    <div style="margin-top:-4px">
                        <div class="shadow-sm additional_style" style="background:${message.user.id == user.id ? '#dcf8c6' : 'white'};">

                           ${messageContent}

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

    `;
        if (flag) {
            DOM.messages.appendChild(messageElement);
        }
        else {
            DOM.messages.insertBefore(messageElement, DOM.messages.firstChild);
        }
    }
    else if (message.is_deleted && user.role == 0 || user.role == 2) {
        let messageElement = document.createElement('div');
        messageElement.className = "ml-3";
        messageElement.innerHTML = `

                <div class="" ${message.user.id == user.id ? '' : 'style="display:flex"'}>
            ${message.user.id == user.id ? '' : profileImage}
                    <div class="deleted_niddle align-self-${message.user.id == user.id ? 'end self' : 'start'} d-flex flex-row align-items-center p-1 my-1 mx-3 rounded message-item ${message.user.id == user.id ? 'right-nidle' : 'left-nidle'}" data-message-id="${message.id}" id="message-${message.id}">
                        <div style="margin-top:-4px">
                            <div class="shadow-sm additional_style msg_deleted" style="background:${message.user.id == user.id ? '#dcf8c6' : 'white'};">

                               ${messageContent}

                            </div>
                            <div>
                                <div style="color: #463C3C; font-size:14px; font-weight:400; margin-top: 10px; width: 100%; background-color: transparent;">
                                    <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">${senderName}</span> |
                                    <span style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;">(${makeformatDate(new Date(message.time * 1000))})</span>
                                    <span>
                                        <a href="#" style="color: #463C3C; font-size:14px; font-weight:400; cursor: pointer; text-decoration: underline; color: #666;"
                                            data-toggle="modal" data-target="#seenModal" data-message-id="${message.id}">
                                            Seen
                                        </a>
                                    </span> |
                                    <span id="restore-button-${message.id}" style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;" onclick="restoreMessage('${message.id}')">Restore</span>                                    <!-- Additional logic for seen and reply links -->
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
            DOM.messages.insertBefore(messageElement, DOM.messages.firstChild);
        }
    }

    var messageDiv = document.getElementById("messages");
    var messageItems = messageDiv.getElementsByClassName("message-item");
    var count = messageItems.length;
    let exceededValue = 0;
    if (message.sender == user.unique_id) {
        scroll_function();
    }
    if (DOM.showCounter) {
        const notificationDiv = document.getElementById('notification-count');
        if (DOM.counter > 0) {
            DOM.notificationDiv.innerHTML = DOM.counter;
            notificationDiv.style.display = 'block';
        }
    }
    else {
        scroll_function();
    }
    ImageViewer(DOM.messages);
};

let parentMessageIds = new Set();
function scrollToMessage(replyId, messageId = null) {
    addChildIdsInSet(messageId, true);
    const targetMessage = document.getElementById(`message-${replyId}`);
    if (targetMessage) {
        DOM.groupReferenceMessageClick = false;
        const ml3Div = targetMessage.closest('.ml-3');
        if (ml3Div) {
            ml3Div.scrollIntoView({ behavior: 'smooth', block: 'center' });
            ml3Div.classList.add('selected-message');
            setTimeout(() => {
                ml3Div.classList.remove('selected-message');
            }, 2000);
        }
    }
    else {
        DOM.groupReferenceMessageClick = true;
        fetchPaginatedMessages(replyId, null, null);
    }
}


function taggingMessages(messageId = null) {
    addChildIdsInSet(messageId, false);
    const targetMessage = document.getElementById(`message-${messageId}`);
    if (targetMessage) {
        DOM.groupReferenceMessageClick = false;
        const ml3Div = targetMessage.closest('.ml-3');
        if (ml3Div) {
            ml3Div.scrollIntoView({ behavior: 'smooth', block: 'center' });
            ml3Div.classList.add('selected-message');
            setTimeout(() => {
                ml3Div.classList.remove('selected-message');
            }, 2000);
        }
    }
}

function addChildIdsInSet(messageId, addFlag = true) {
    if (messageId !== undefined && messageId !== null && addFlag) {
        if (!parentMessageIds.has(messageId)) {
            parentMessageIds.add(messageId);
        }
    }
    else {
        parentMessageIds.delete(messageId);
    }
}


function scroll_function() {
    const messageDiv = document.getElementById('messages');
    const scrollBottomBtn = document.getElementById('scrollBottomBtn');

    if (!messageDiv || !scrollBottomBtn) {
        console.error("Required elements not found in the DOM.");
        return;
    }

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
    messageDiv.scrollTo({
        top: messageDiv.scrollHeight,
        behavior: 'smooth'
    });


}

scrollBottomBtn.addEventListener('click', function () {
    if (parentMessageIds.size) {
        let setToArray = [...parentMessageIds];
        parentMessageIds.clear();
        let LastIndex = setToArray.pop();
        taggingMessages(LastIndex)
        addChildIdsInSet(LastIndex, false);
        parentMessageIds = new Set(setToArray);
    }
    else if (parentMessageIds.size < 1) {
        const messageDiv = document.getElementById('messages');
        messageDiv.scrollTo({
            top: messageDiv.scrollHeight,
            behavior: 'smooth'
        });
    }
});

let isTinyMCEInitialized = false;

function tinymce_init(callback) {
    if (!isTinyMCEInitialized) {
        tinymce.init({
            selector: '#input',
            toolbar: 'bold italic underline strikethrough',
            menubar: false,
            branding: false,
            height: 250,
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
    const sendMessagebutton = document.getElementById('message-send-area');
    if (window.getComputedStyle(sendMessagebutton).display === 'block') {
        sendMessagebutton.style.display = "none";
    }
    const message = pagnicateChatList.data.find((message) => message.id === parseInt(message_id));

    if (message.is_compose == 1) {
        var messagebody = processValue(message.msg || message.message, false);
    }
    else {
        var messagebody = message.msg.replace(/\n/g, "<br>").trim();
    }
    tinymce_init(function () {
        correction_call(message_id, messagebody, senderName);
    });
}

function correction_call(message_id, messagebody, senderName) {


    if (tinymce.get('input')) {
        tinymce.get('input').setContent(messagebody);
        tinymce.get('input').focus();
        const editor = tinymce.get('input');
        editor.selection.select(editor.getBody(), true);
        editor.selection.collapse(false);
    } else {
        console.error("TinyMCE editor not initialized for #input");
    }

    const correction_message_id = document.getElementById('correction_message_id');
    correction_message_id.value = message_id;
    const messageContent = tinymce.get('input').getContent();
    const messageElement = DOM.messages.querySelector(`[data-message-id="${message_id}"]`);
    const messageContentDiv = messageElement.querySelector('div.shadow-sm');

    const existingReplyDiv = messageContentDiv.querySelector('.reply-message-area');

    // if (existingReplyDiv) {
    //     existingReplyDiv.innerHTML = messagebody;
    // } else {
    //     messageContentDiv.innerHTML = messagebody;
    // }
    const chat_actionss = document.getElementById('chat_action');
    chat_actionss.style.display = 'none';
    const Editreplyarea = document.getElementById('correctionreply-area');

    if (Editreplyarea) {
        Editreplyarea.style.display = 'block';
    } else {
        console.error("Element 'correctionreply-area' not found");
    }

    var replyDiv = document.getElementById('correction-div');

    var quotedTextElement = document.querySelector('#quoted-messages .sender-name');
    var quotedNameElement = document.querySelector('#quoted-messages .quoted-text');

    if (quotedTextElement) {
        quotedTextElement.textContent = senderName;
    } else {
        console.error("Element '#quoted-message .sender-name' not found");
    }

    if (quotedNameElement) {
        quotedNameElement.innerHTML = messagebody.substring(0, 200) + ".....";

        // quotedNameElement.textContent = messagebody;
    } else {
        console.error("Element '#quoted-message .quoted-text' not found");
    }

    if (replyDiv) {
        replyDiv.style.display = 'block';
        change_icon_height(replyDiv);
    } else {
        console.error("Element 'correction-div' not found");
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
    chat_action.style.display = 'flex';

    const messageIndex = pagnicateChatList.data.findIndex((message) => message.id === parseInt(correction_message_id));
    const old_message = pagnicateChatList.data.find((message) => message.id === parseInt(correction_message_id));

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
            csrf_token: document.querySelector('meta[name="csrf-token"]').content,
            compose_id: old_message.compose_id,
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
                // console.log(response);
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

    if (getComputedStyle(chat_action).display == "none") {
        chat_action.style.display = 'flex';
        correctionarea.style.display = 'none';
        Editreplyarea.style.display = 'none';
        correctionreplyarea.style.display = 'none';
        const textarea = document.getElementById('input');
        textarea.value = '';
        textarea.focus();

    }

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
    const sendMessagebutton = document.getElementById('message-send-area');
    if (window.getComputedStyle(sendMessagebutton).display === 'block') {
        sendMessagebutton.style.display = "none";
    }
    let editMessage = null;
    const messageElement = DOM.messages.querySelector(`[data-message-id="${messageId}"]`);
    const messageContentDiv = messageElement.querySelector('div.shadow-sm');
    const reply = messageContentDiv.querySelector('.reply-message-area');
    if (reply) {
        editMessage = reply.innerText || reply.textContent;
    }
    else {
        editMessage = messageContentDiv.innerText || messageContentDiv.textContent;
    }

    if (editMessage) {
        const element = document.getElementById('editMessageDiv');
        element.style.display = 'block';
        const editMessageIdField = document.getElementById('edit_message_id');
        if (editMessageIdField) {
            editMessageIdField.value = messageId;
        }
        const editMessageContent = document.querySelector('.EditmessageContent');
        const dots = editMessage.length > 100 ? '...' : '';
        editMessageContent.innerText = editMessage.substring(0, 100) + dots;
        if (editMessage.split('\n').filter(line => line.trim() === '').length > 3) {
            editMessageContent.innerText = editMessageContent.innerText.replace(/(\n){3,}/g, '\n\n');
        }
        const textarea = document.getElementById('input');
        textarea.value = editMessage;
        textarea.scrollTop = textarea.scrollHeight;
        const messageDiv = document.getElementById('messages');
        messageDiv.classList.add('blur');
        const Editreplyarea = document.getElementById('Editreply-area');
        const chat_action = document.getElementById('chat_action');
        if (getComputedStyle(chat_action).display == "none") {
            chat_action.style.display = "flex";
        }
        if ((getComputedStyle(chat_action).display === "flex" || getComputedStyle(chat_action).display === "block") &&
            getComputedStyle(Editreplyarea).display === "none") {
            document.getElementById('chat_action').style.display = 'none';
            Editreplyarea.style.display = 'block';
            if (getComputedStyle(chat_action).display == "flex") {
                document.getElementById('chat_action').style.display = 'none';
            }
        }
        const msgElem = DOM.messages.querySelector(`[data-message-id="${messageId}"]`);
        const replyMessageArea = msgElem.querySelector('.reply-message-area');
        if (replyMessageArea) {
            DOM.messageInput.style.height = replyMessageArea.offsetHeight + "px";
        }
        else {
            DOM.messageInput.style.height = msgElem.offsetHeight + "px";
        }
        autoResize();
        change_icon_height(element);
        document.querySelector("#input").focus();
    }
}

function change_icon_height(element) {
    var iconContainer = document.querySelector('.icon-container');
    const viewportHeight = window.innerHeight;
    const elementRect = element.getBoundingClientRect();
    const dis = viewportHeight - elementRect.top + 10;
    iconContainer.style.bottom = dis + 'px';
}

function handleSendMessage() {
    document.querySelector('.auto-resize-textarea').style.setProperty('height', '44px');
    document.querySelector('.auto-resize-textarea').style.setProperty('overflow', 'hidden');
    const messageId = document.getElementById('edit_message_id').value;
    let messageContent = document.getElementById('input').value;
    if (messageContent !== '') {
        const messageIndex = pagnicateChatList.data.findIndex((message) => message.id === parseInt(messageId));
        if (messageIndex !== -1) {
            pagnicateChatList.data[messageIndex].msg = messageContent.replace(/\n/g, "<br>");
        }

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
            body: JSON.stringify({ id: messageId, message: messageContent }),
        })
            .then((response) => response.json())
            .then((data) => console.log(data))
            .catch((error) => console.error(error));

        document.getElementById('editMessageDiv').style.display = 'none';
        const textarea = document.getElementById('input');
        textarea.value = '';
        textarea.focus();
        const messageDiv = document.getElementById('messages');
        messageDiv.classList.remove('blur');
        const chat_action = document.getElementById('chat_action');
        chat_action.style.display = 'flex';
        const Editreplyarea = document.getElementById('Editreply-area');

        Editreplyarea.style.display = 'none';
        // const fileicon = document.querySelector('.chat_action_file');
        // fileicon.style.visibility = 'visible';
        // const chat_action_capture = document.querySelector('.chat_action_capture');
        // chat_action_capture.style.visibility = 'visible';
        // const chat_action_voice = document.querySelector('.chat_action_voice');
        // chat_action_voice.style.visibility = 'visible';
        // chat_action_voice.style.display = 'block';
        const correctionarea = document.getElementById('correction-div');
        correctionarea.style.display = 'none';

    } else {
        // alert('Error');
    }
    change_icon_height(document.getElementById('reply-area'));
}

document.getElementById('send-message-btn').addEventListener('click', handleSendMessage);

function removeEditMessage() {
    document.getElementById('editMessageDiv').style.display = 'none';
    const Editreplyarea = document.getElementById('Editreply-area');
    if (getComputedStyle(Editreplyarea).display == "block") {
        Editreplyarea.style.display = 'none';
    }
    const correctionarea = document.getElementById('correction-div');
    correctionarea.style.display = 'none';
    var iconContainer = document.querySelector('.icon-container');
    iconContainer.style.bottom = '90px';
    // const fileicon = document.querySelector('.chat_action_file');
    // fileicon.style.visibility = 'visible';
    // const chat_action_capture = document.querySelector('.chat_action_capture');
    // chat_action_capture.style.visibility = 'visible';
    // const chat_action_voice = document.querySelector('.chat_action_voice');
    // chat_action_voice.style.visibility = 'visible';
    // chat_action_voice.style.display = 'block';
    const chat_action = document.getElementById('chat_action');
    if (getComputedStyle(chat_action).display == "none")
        chat_action.style.display = "flex";
    const messageDiv = document.getElementById('messages');
    messageDiv.classList.remove('blur');
    const textarea = document.getElementById('input');
    textarea.value = '';
    document.querySelector('.auto-resize-textarea').style.setProperty('height', '44px');
    document.querySelector('.auto-resize-textarea').style.setProperty('overflow', 'hidden');
}

function showReply(message_id, senderName, type) {
    var correctionDiv = document.getElementById('correction-div');

    if (correctionDiv && window.getComputedStyle(correctionDiv).display === 'block') {
        removecorrectionMessage();
    }
    if (selectedMessageIds > 0) {
        return;
    }
    document.querySelector("#input").value = "";
    const message = pagnicateChatList.data.find((message) => message.id === parseInt(message_id));
    if (message.is_compose == 1) {
        var messagebody = processValue(message.msg || message.message, false);
    }
    else {
        var messagebody = message.msg;
    }


    DOM.replyId = message_id;
    var replyDiv = document.getElementById('reply-div');
    var quotedTextElement = document.querySelector('#quoted-message .sender-name');
    quotedTextElement.textContent = senderName;
    var quotedNameElement = document.querySelector('#quoted-message .quoted-text');
    if (type === 'Image') {
        var message_body = `<img  src="${messagebody}" style="height:125px; width:125px;">`;
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
        var message_body = `<div class="audio-message w-25 mb-2" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${message.msg}">
            <div class="avatar">
                <!-- Avatar image here -->
            </div>
            <div class="audio-content">
                <div class="audio-controls">
                    <button class="playbutton">
                        <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
                        </svg>
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

        const dots = messagebody.length > 100 ? '...' : '';

        var message_body = messagebody
            .replace(/(\r\n|\n){3,}/g, '\n\n')
            .substring(0, 100)
            .replace(/\r\n|\n/g, '<br>') + dots;


    }
    quotedNameElement.innerHTML = message_body;

    replyDiv.style.display = 'block';

    const Editreplyarea = document.getElementById('message-reply-area');
    const chat_action = document.getElementById('chat_action');
    const voiceIcon = document.getElementById('voice-icon');
    const fileicon = document.getElementById('file-icon');
    const captureid = document.getElementById('captureid');


    if (getComputedStyle(chat_action).display == "block" || getComputedStyle(chat_action).display == "flex"
        && getComputedStyle(Editreplyarea).display == "none"
    ) {

        document.getElementById('chat_action').style.display = "none";
        Editreplyarea.style.display = 'block';
    }
    change_icon_height(replyDiv);
    document.querySelector("#input").value = "";
    document.querySelector("#input").focus();
}

function removeQuotedMessage() {
    var replyDiv = document.getElementById('reply-div');
    var iconContainer = document.querySelector('.icon-container');
    replyDiv.style.display = 'none';
    iconContainer.style.bottom = '90px';
    DOM.replyId = null;
    document.querySelector('.auto-resize-textarea').style.setProperty('height', '44px');
    document.querySelector('.auto-resize-textarea').style.setProperty('overflow', 'hidden');
    document.querySelector("#input").value = "";
    document.querySelector("#input").focus();
    // const chat_action = document.getElementById('chat_action');
    //     if (getComputedStyle(chat_action).display == "none") {
    //         const Editreplyarea = document.getElementById('message-reply-area');
    //         Editreplyarea.style.display = 'none';
    //         chat_action.style.display = "";
    //         const fileicon = document.querySelector('.chat_action_file');
    //     }

    // const chat_action = document.getElementById('chat_action');
    // if(getComputedStyle(chat_action).display == "none")
    // {
    //     const Editreplyarea = document.getElementById('message-reply-area');
    //     Editreplyarea.style.display = 'none';
    //     chat_action.style.display="";
    //     const fileicon = document.querySelector('.chat_action_file');
    // }


    const correctionarea = document.getElementById('correction-div');
    if (getComputedStyle(correctionarea).display == "block") {
        correctionarea.style.display = 'none';
    }


    const chat_action = document.getElementById('chat_action');
    const Editreplyarea = document.getElementById('message-reply-area');
    if (getComputedStyle(chat_action).display == "none" || getComputedStyle(chat_action).display == "flex"
        && getComputedStyle(Editreplyarea).display == "block") {

        Editreplyarea.style.display = 'none';
        chat_action.style.display = "flex";
    }
    document.getElementById("messages").style.marginBottom = "74px";

    document.querySelector("#input").focus();


}
const sendMessageReply = () => {
    sendMessage();
    removeQuotedMessage();
}

let selectedMessageIds = [];
let selectedMessages = [];

function moveMessage(messageId) {
    var replyDiv = document.getElementById('reply-div');
    if (replyDiv && window.getComputedStyle(replyDiv).display === 'block') {
        return;
    }
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
        $('#action-bar').show();
        $('#input-area').hide();
        document.getElementById("messages").style.marginBottom = "0px";

        document.getElementById('selected-count').textContent = `${selectedMessageIds.length} message${selectedMessageIds.length > 1 ? 's' : ''} selected`;

        document.getElementById('messages_ids').value = selectedMessageIds.join(',');
        selectedMessages = selectedMessageIds.map(id => pagnicateChatList.data.find(msg => msg.id === id));
    } else {
        console.error(`Message with ID: ${messageId} not found.`);
    }
}

function moveSelectedMessagesToGroup(moveMessageIds, groupToMove, messagesToMove) {
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
            messageList: messagesToMove
        }),
    })
        .then(response => response.json())
        .then(data => {
            let moveMessageResponse = data;
            const previousGroupId = DOM.groupId;
            const previousGroupIndex = chatList.findIndex(group => group.group.group_id === previousGroupId);
            if (previousGroupIndex !== -1) {
                selectedMessageIds.forEach(id => {
                    const messageIndex = chatList[previousGroupIndex].group.group_messages.findIndex(message => message.id === id);
                    if (messageIndex !== -1) {
                        chatList[previousGroupIndex].group.group_messages.splice(messageIndex, 1);
                        chatList[previousGroupIndex].unread -= 1;

                        if (chatList[previousGroupIndex].group.group_messages.length > 0) {
                            chatList[previousGroupIndex].time = new Date(chatList[previousGroupIndex].group.group_messages[chatList[previousGroupIndex].group.group_messages.length - 1].time * 1000);
                        } else {
                            chatList[previousGroupIndex].time = null;
                        }
                    }
                });
            }

            messagesToMove.forEach(oldMessage => {
                socket.emit('deleteMessage', oldMessage.id, true);
            });

            // const newGroupIndex = chatList.findIndex(group => group.group.group_id === newGroupId);

            // if (newGroupIndex !== -1) {
            //     data.messages.forEach(newMessage => {
            //         const messageIndex = chatList[newGroupIndex].group.group_messages.findIndex(message => message.time > newMessage.time);
            //         if (messageIndex === -1) {
            //             chatList[newGroupIndex].group.group_messages.push(newMessage);
            //         } else {
            //             chatList[newGroupIndex].group.group_messages.splice(messageIndex, 0, newMessage);
            //         }
            //         chatList[newGroupIndex].msg = newMessage;
            //         chatList[newGroupIndex].time = new Date(newMessage.time * 1000);

            //         // Update the last message text
            //         const senderName = newMessage.user.name;
            //         let messageText = '';
            //         if (newMessage.type === 'File') {
            //             messageText = newMessage.media_name;
            //         } else if (newMessage.type === 'Image') {
            //             messageText = '[Image]';
            //         } else if (newMessage.type === 'Audio') {
            //             messageText = '[Audio]';
            //         } else {
            //             messageText = newMessage.msg;
            //         }
            //         chatList[newGroupIndex].lastMessage = `${senderName}: ${messageText}`;
            //     });
            // }

            // chatList.sort((a, b) => {
            //     if (a.time && b.time) {
            //         return new Date(b.time) - new Date(a.time);
            //     } else if (a.time) {
            //         return -1;
            //     } else if (b.time) {
            //         return 1;
            //     } else {
            //         return 0;
            //     }
            // });




            // const newIndex = chatList.findIndex(group => group.group.group_id === newGroupId);

            socket.emit('moveMessage', moveMessageResponse, newGroupId, DOM.groupId, user.unique_id);

            // const newGroupChatListItem = document.querySelector(`[data-group-id="${newGroupId}"]`);
            // generateMessageArea(newGroupChatListItem, newIndex, false, null);
            // viewChatList();
            cancelMoveMessage();
            document.querySelector(".close").click();
        })
        .catch(error => console.error(error));


    document.getElementById('selected-count').textContent = '';
    document.getElementById('messages_ids').value = '';
    document.getElementById('group_to_move_message').value = '';
    selectedMessageIds = [];
    selectedMessageIds.length = 0;


}

document.getElementById('cancel-icon').addEventListener('click', function () {
    cancelMoveMessage();
});

function cancelMoveMessage() {
    document.querySelectorAll('.selected-message').forEach(function (element) {
        element.classList.remove('selected-message');
    });
    document.getElementById("messages").style.marginBottom = "74px";
    document.getElementById('action-bar').style.display = 'none';
    document.getElementById('input-area').style.display = 'block';
    document.getElementById('selected-count').textContent = 'Selected Messages: 0';
    selectedMessageIds = [];
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
        if (DOM.groupId == groupToMove) {
            $('#chatModal').modal('hide');
            $('#notAllowed').modal('show');
            return;
        }
        moveSelectedMessagesToGroup(messageIdArray, groupToMove, selectedMessages);
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

DOM.messages.addEventListener('scroll', async () => {
    if (DOM.messages.scrollTop <= 5 && !isLoadingMessages && hasMoreMessages) {
        isLoadingMessages = true;
        showSpinner();
        await fetchPaginatedMessages(null, null, null);
        if (!DOM.loader_showing)
            hideSpinner();
        // scroll_to_unread_div(true);
        isLoadingMessages = false;
    } else if (DOM.messages.scrollTop !== 0) {
        //console.log('User is not at the top yet');
    }
});

const displayedMessageIds = new Set();

let isLoading = false;
const fetchPaginatedMessages = async (message_id = null, current_Page = null, group_id = null, unreadCounter = null) => {

    console.log("message id",message_id);
    if (isLoading) return;
    isLoading = true;
    const currentScrollHeight = DOM.messages.scrollHeight;
    try {
        let url = ''
        if (DOM.searchMessageClick && DOM.lastMessageId) {
            console.log("search click  last emssage");;
            url = `get-groups-messages-by-group-id?groupId=${encodeURIComponent(DOM.groupId)}&page=${DOM.currentPage}${DOM.searchMessageClick && DOM.lastMessageId ? `&lastMessageId=${encodeURIComponent(DOM.lastMessageId)}` : ''}`;
        }
        else if (message_id || DOM.lastMessageId) {
            console.log("message inside",message_id);
            url = `get-groups-messages-by-group-id?groupId=${encodeURIComponent(DOM.groupId)}&page=${DOM.currentPage}&messageId=${encodeURIComponent(message_id)}`;
        }
        else if (unreadCounter) {
            console.log("unread counter");
            DOM.currentPage = Math.ceil(unreadCounter / 50);
            url = `get-groups-messages-by-group-id?groupId=${encodeURIComponent(DOM.groupId)}&page=${DOM.currentPage}&unreadCount=${unreadCounter}`;
        }
        else {
            console.log("last resor");
            url = `get-groups-messages-by-group-id?groupId=${encodeURIComponent(DOM.groupId)}&page=${DOM.currentPage}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            }
        });
        let nextPageMessages = [];
        nextPageMessages = await response.json();
        if (DOM.groupSearch) {
            nextPageMessages.data.forEach(item => searchMessageSet.add(item))
        }

        if (DOM.currentPage == 1) {
            pagnicateChatList = nextPageMessages;
        }
        // here
        if (message_id) {
            DOM.lastMessageId = nextPageMessages.data.at(-1).id;
        }
        unread_settings(nextPageMessages);

        if (pagnicateChatList && pagnicateChatList.data && DOM.currentPage != 1) {
            pagnicateChatList.data.push(...nextPageMessages.data);
        }

        const u_id = user.unique_id;
        const ids = nextPageMessages.data.map(item => item.id);
        const Notseenby = nextPageMessages.data
            .filter(item => {
                const seenBy = item.seen_by ? item.seen_by.split(',').map(id => id.trim()) : [];
                return !seenBy.includes(u_id);
            })
            .map(item => item.id);
        DOM.unreadCounter = Notseenby.length;
        const notSeenById = Notseenby.at(-1);

        (async () => {
            try {
                await fetch("message/seen-by/update", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken,
                    },
                    body: JSON.stringify({ ids }),
                });
            } catch (error) {
                console.error('Error updating seen messages:', error);
            }
        })();

        if (nextPageMessages.data.length === 0) {
            hasMoreMessages = false;
            if (DOM.currentPage == 1) {
                const span = document.createElement('span');
                span.innerHTML = `
            <div class="notification-wrapper">
                <div class="unread-messages">
                   No Messages To Load
                </div>
            </div>
             `;
                DOM.messages.appendChild(span);
            }
            return;
        }
        nextPageMessages.data.forEach((message) => {
            if (!displayedMessageIds.has(message.id)) {
                addMessageToMessageArea(message);
                displayedMessageIds.add(message.id);
            }
            if (message.id == notSeenById && !DOM.unreadDividerAdded) addUnread();

            if (message.id == message_id) {

                if (DOM.groupReferenceMessageClick) {
                    scrollToMessage(message.id);
                }
                else if (!DOM.groupReferenceMessageClick) {
                    const messageElement = DOM.messages.querySelector(`[data-message-id="${message.id}"]`);
                    const messageTextElement = messageElement.querySelector(".shadow-sm");
                    const searchQuery = DOM.messageSearchQuery;

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
                                               <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
                        </svg>
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
                                    <div class="reply-message-div"  onclick="scrollToMessage('${message.reply.id}','${message.id}')">
                                        <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                                        ${message.user?.id == user?.id ? message.user.name : message.user.name}

                                        </div>
                                        <div class="reply-details">
                                            <p class="file-name">${message_body}</p>
                                        </div>
                                    </div>
                                <div class="reply-message-area">${(message.msg || message.message).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}</div> <!-- Updated this line -->
                                `;

                                    const messageText = message.msg.toLowerCase();
                                    const index = messageText.indexOf(searchQuery);

                                    if (index !== -1) {
                                        const highlightedText = message.msg.substring(0, index) +
                                            `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
                                            message.msg.substring(index + searchQuery.length);

                                        // Update the reply message area with highlighted text
                                        newMessageDisplay = `
                                    <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')">
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
                                    messageTextElement.innerHTML = newMessageDisplay;

                                }
                                else if (message.reply.type === "File") {
                                    replyDisplay = `
                                <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')">
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
                                        `<div style="padding-top: 10px;">${message.msg.replace(/[\r\n]+/g, '<br>')}</div>`;

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
                                    var message_body = `<img class="view-image" src="${message.reply.msg}" style="height:125px; width:125px;">`;
                                    replyDisplay = `
                                    <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')"> <!-- Add onclick here -->
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

                                const trimmedSearchQuery = searchQuery;
                                const index = fileName.toLowerCase().indexOf(trimmedSearchQuery.toLowerCase());
                                if (index !== -1) {
                                    const highlightedFileName = fileName.substring(0, index) +
                                        `<span class="highlight">${fileName.substring(index, index + trimmedSearchQuery.length)}</span>` +
                                        fileName.substring(index + trimmedSearchQuery.length);
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
                                // console.log("No element with class 'shadow-sm' found for unknown message type:", message.type);
                            }
                            break;
                        // console.log("Unknown message type:", message.type);
                    }
                    setTimeout(() => {
                        messageElement.scrollIntoView();
                    }, 200);
                }
            }
        });
        const newScrollHeight = DOM.messages.scrollHeight;
        DOM.messages.scrollTop = newScrollHeight - currentScrollHeight;
        if (!message_id) {
            DOM.currentPage += 1;
        }
    } catch (error) {
    }
    finally {
        isLoading = false;
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
            if (message.seen_by?.includes(userIdToCheck)) {
                seenCount++;
            } else {
                unseenCount++;
            }
        }
    });
    const groupElem = document.getElementsByClassName(groupId)[0];
    var unseen = unseenCount;
    let groupToUpdate = chatList.find(chat => chat.group.group_id === groupId);
    var first_value = DOM.unreadMessagesPerGroup[DOM.groupId];
    var left_count = first_value - unseen;
    if (unseen > 0) {
        if (groupElem) {
            groupElem.innerHTML = left_count;
        }
        if (left_count == 0 || left_count < 0) {
            if (groupElem) {
                groupElem.style.display = "none";
            }
        }
        if (groupToUpdate) {
            groupToUpdate.unread = left_count;
        }
        DOM.unreadMessagesPerGroup[DOM.groupId] = left_count;
    }
}

let currentlyPlayingAudio = null;
let currentPlaybutton = null;
async function showloader() {
    showSpinner();
    await new Promise(resolve => setTimeout(resolve, 300));

}
let generateMessageArea = async (elem, chatIndex = null, searchMessage = false, groupSearchMessage = null, notificationMessageId = null) => {
    if (DOM.groupId != groupSearchMessage?.group_id)
        searchMessageSet.clear();
    change_icon_height(document.getElementById('reply-area'));
    chat = chatList[chatIndex];
    DOM.activeChatIndex = chatIndex;
    if (searchMessage) {
        if (!searchMessageSet.size > 0) {

            await showloader();
            DOM.loader_showing = true;
        }
    }

    if (searchMessageSet.size > 0 && DOM.groupId == groupSearchMessage.group_id) {
        if (Array.from(searchMessageSet).find(e => e.id == groupSearchMessage.id)) {
            DOM.groupSearchMessageFound = true;

            const targetMessage = document.getElementById(`message-${groupSearchMessage.id}`);
            if (targetMessage) {
                const ml3Div = targetMessage.closest('.ml-3');
                if (ml3Div) {
                    ml3Div.scrollIntoView();
                    ml3Div.classList.add('selected-message');
                    setTimeout(() => {
                        ml3Div.classList.remove('selected-message');
                    }, 2000);
                }
            }
            DOM.groupSearchMessageFound = false;
        }
        return;
    }
    else {

        DOM.messages.innerHTML = '';
    }
    DOM.groupId = elem.dataset.groupId ?? groupSearchMessage.id;
    DOM.currentPage = 1;
    displayedMessageIds.clear();
    resetChatArea();
    cancelMoveMessage();

    mClassList(DOM.inputArea).contains("d-none", (elem) => elem.remove("d-none").add("d-flex"));
    mClassList(DOM.messageAreaOverlay).add("d-none");

    [...DOM.chatListItem].forEach((elem) => mClassList(elem).remove("active"));

    if (window.innerWidth <= 575) {

        DOM.chatListArea.classList.replace("d-flex", "d-none");
        DOM.messageArea.classList.replace("d-none", "d-flex");
        areaSwapped = true;
    } else {
        elem.classList.add("active");
    }

    fetch(`/get-group-by-id/${DOM.groupId}`)
        .then(response => response.json())
        .then(data => {
            let memberNames = data.users_with_access.map(member => member.id === user.id ? "" : member.name);
            DOM.messageAreaDetails.innerHTML = `${memberNames},You`;
            DOM.messageAreaName.innerHTML = data.name;
        })
        .catch(error => {
            console.error('Error fetching group data:', error);
        });

        console.log("search found",DOM.groupSearchMessageFound);
    if (DOM.groupSearchMessageFound == false) {
        if (groupSearchMessage && groupSearchMessage.id && !notificationMessageId) {
            console.log("first");
            await fetchPaginatedMessages(groupSearchMessage.id, null, DOM.groupId);
            get_voice_list();
            removeEditMessage();
            removeQuotedMessage();
            setTimeout(() => {
                hideSpinner();
                DOM.loader_showing = false;

            }, 1000);
            return;
        }


    else if (DOM.unreadMessagesPerGroup[DOM.groupId] > 50) {
        console.log("counter mote then 50");
        await fetchPaginatedMessages(null, null, null, DOM.unreadMessagesPerGroup[DOM.groupId]);
        get_voice_list();
        removeEditMessage();
        removeQuotedMessage();
        scroll_to_unread_div();
        return;

        } else {
            console.log("else me chal rha hon bhai");
            await fetchPaginatedMessages(null, null, null);
            get_voice_list();
            removeEditMessage();
            removeQuotedMessage();
            scroll_to_unread_div();
            return;
        }
    }

};


function scroll_to_unread_div() {

    const unreadCountDiv = document.getElementById('unread-wrapper');
    if (unreadCountDiv) {
        unreadDiv = document.getElementById("unread-counter-div");
        unreadDiv.innerHTML = DOM.unreadCounter;
        unreadDiv.focus();
        unreadCountDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        DOM.unreadDividerAdded = false;
    }
}

async function updateMessageSeenBy(ids) {
    (async () => {
        try {
            await fetch("message/seen-by/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({ ids }),
            });
        } catch (error) {
            console.error('Error updating seen messages:', error);
        }
    })();
}

let showChatList = () => {
    if (areaSwapped) {
        mClassList(DOM.chatListArea).remove("d-none").add("d-flex");
        mClassList(DOM.messageArea).remove("d-flex").add("d-none");
        areaSwapped = false;
        DOM.groupId = null;
        DOM.currentPage = 0;
        DOM.activeChatIndex = null;
    }
};

let subsIds = [];

let sendMessage = (type = 'Message', mediaName = null) => {
    if (socket.connected) {
        let csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        if (type == 'Message') {
            const numberPattern = /\b\d{7,}\b/;
            const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

            let value = DOM.messageInput.value;
            if (value === "") return;
            let reason = '';
            if (value.match(numberPattern)) {
                reason = 'Contact Number';
            } else if (value.match(emailPattern)) {
                reason = 'Email Address';
            }
            if (reason !== '') {
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
                        message: value,
                    })
                })
                    .then(response => {
                        // console.log(response);
                    })
                    .catch(error => {
                        // console.error(error);
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
                    csrf_token: csrfToken,
                };

                socket.emit('sendChatToServer', msg);
            }
            DOM.messageInput.value = "";
            DOM.replyId = null;
        }
        else {
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
                csrf_token: csrfToken,
            };
            socket.emit('sendChatToServer', msg);
            DOM.messageInput.value = "";
            DOM.replyId = null;
        }
    }
    else {
        $('#wentWrong').modal('show');
    }

};

let showProfileSettings = () => {
    DOM.profileSettings.style.left = 0;
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

    generateChatList();

    const waitForChatList = setInterval(() => {
        if (chatList.length > 1) {
            clearInterval(waitForChatList);

            if (DOM.notification_group_id != null && DOM.notification_group_id !== "" &&
                DOM.notification_message_id != null && DOM.notification_message_id !== "") {

                const elem = document.querySelector(`[data-group-id="${DOM.notification_group_id}"]`);
                const newIndex = chatList.findIndex(group => group.group.group_id === DOM.notification_group_id);

                if (newIndex !== -1) {
                    generateMessageArea(elem, newIndex, null, DOM.notification_group_id, DOM.notification_message_id);
                } else {
                    console.warn("Notification group not found in chatList.");
                }
            }
        }
    }, 100);

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
};

init();


var OneSignal = window.OneSignal || [];

OneSignal.push(function () {
    OneSignal.init({
        appId: "4b86d80b-744a-4d02-bd8e-0aea7235d4c2",
        notifyButton: {
            enable: true,
            size: 'medium',
            theme: 'default',
            showCredit: false,
            text: {
                'tip.state.unsubscribed': 'Subscribe to notifications',
                'tip.state.subscribed': "You're subscribed to notifications",
                'tip.state.blocked': "You've blocked notifications",
                'message.prenotify': 'Click to subscribe to notifications',
                'message.action.subscribed': "Thanks for subscribing!",
                'message.action.resubscribed': "You're subscribed to notifications",
                'message.action.unsubscribed': "You won't receive notifications again",
                'dialog.main.title': 'Manage Site Notifications',
                'dialog.main.button.subscribe': 'SUBSCRIBE',
                'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
                'dialog.blocked.title': 'Unblock Notifications',
                'dialog.blocked.message': "Follow these instructions to allow notifications:"
            },
            colors: {
                'circle.background': 'rgb(84,110,123)',
                'circle.foreground': 'white',
                'badge.background': 'rgb(84,110,123)',
                'badge.foreground': 'white',
                'badge.bordercolor': 'white',
                'pulse.color': 'white',
                'dialog.button.background.hovering': 'rgb(77, 101, 113)',
                'dialog.button.background.active': 'rgb(70, 92, 103)',
                'dialog.button.background': 'rgb(84,110,123)',
                'dialog.button.foreground': 'white'
            },
            displayPredicate: function () {
                return OneSignal.isPushNotificationsEnabled()
                    .then(function (isPushEnabled) {
                        return !isPushEnabled;
                    });
            }
        },
        allowLocalhostAsSecureOrigin: true,
        persistNotification: false,
    });
    OneSignal.on('subscriptionChange', function (isSubscribed) {
        if (isSubscribed) {
            OneSignal.getUserId().then(function (userId) {
                if (userId) {
                    oneSignalSubscription(userId);
                } else {
                    console.warn("User ID is not available yet.");
                }
            });
        }
    });
});

function oneSignalSubscription(userId) {

    DOM.fcmToken = userId;
    user.fcm_token = userId;

    const updateUserFcmToken = fetch("user/update/" + userId, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
    }).then(updateUserFcmToken => {
        if (!updateUserFcmToken.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        document.getElementById("login_user_fcm_token").value = userId;
    }).catch(error => {
        // console.log(error);
    }
    )
}

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
                const reader = new FileReader();
                reader.onload = function () {
                    const arrayBuffer = this.result;
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

                    audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                        const samples = buffer.getChannelData(0);
                        const mp3 = new lamejs.Mp3Encoder(1, audioContext.sampleRate, 128);
                        const mp3Data = [];
                        const chunkSize = 1152;
                        for (let i = 0; i < samples.length; i += chunkSize) {
                            const chunk = samples.subarray(i, i + chunkSize);
                            const intSamples = new Int16Array(chunk.length);
                            for (let j = 0; j < chunk.length; j++) {
                                intSamples[j] = Math.max(-32768, Math.min(32767, chunk[j] * 32767)); // Clamp values
                            }
                            const encodedChunk = mp3.encodeBuffer(intSamples);
                            if (encodedChunk.length > 0) {
                                mp3Data.push(encodedChunk);
                            }
                        }
                        const endChunk = mp3.flush();
                        if (endChunk.length > 0) {
                            mp3Data.push(endChunk);
                        }
                        const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
                        const audioUrl = URL.createObjectURL(mp3Blob);
                        const audio = new Audio(audioUrl);
                        const ref = firebase.storage().ref("audio/" + DOM.unique_id);
                        const mediaName = "recording.mp3";
                        const metadata = {
                            contentType: 'audio/mp3'
                        };
                        const task = ref.child(mediaName).put(mp3Blob, metadata);
                        task
                            .then(snapshot => snapshot.ref.getDownloadURL())
                            .then(url => {
                                DOM.messageInput.value = url;
                                sendMessage("Audio", mediaName);
                            })
                            .catch(error => console.error(error));
                        chatInputContainer.classList.remove('recording-active');
                        voiceIcon.classList.remove('recording');

                        voiceSvg.innerHTML = `
                            <circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61"/>
                            <path d="M15.125 17.2143C16.8146 17.2143 18.1684 15.8504 18.1684 14.1607L18.1786 8.05357C18.1786 6.36393 16.8146 5 15.125 5C13.4354 5 12.0714 6.36393 12.0714 8.05357V14.1607C12.0714 15.8504 13.4354 17.2143 15.125 17.2143ZM20.5196 14.1607C20.5196 17.2143 17.9343 19.3518 15.125 19.3518C12.3157 19.3518 9.73036 17.2143 9.73036 14.1607H8C8 17.6316 10.7686 20.502 14.1071 21.0007V24.3393H16.1429V21.0007C19.4814 20.5121 22.25 17.6418 22.25 14.1607H20.5196Z" fill="white"/>
                        `;
                    }, error => {
                        console.error('Error decoding audio data', error);
                    });
                };
                reader.readAsArrayBuffer(blob);
            };
        })
        .catch(error => {
            console.error('Error accessing media devices.', error);
            chatInputContainer.classList.remove('recording-active');
            voiceIcon.classList.remove('recording');
            voiceSvg.innerHTML = `
                <circle cx="15.5" cy="15.5" r="15.5" fill="#1DAB61"/>
                <path d="M15.125 17.2143C16.8146 17.2143 18.1684 15.8504 18.1684 14.1607L18.1786 8.05357C18.1786 6.36393 16.8146 5 15.125 5C13.4354 5 12.0714 6.36393 12.0714 8.05357V14.1607C12.0714 15.8504 13.4354 17.2143 15.125 17.2143ZM20.5196 14.1607C20.5196 17.2143 17.9343 19.3518 15.125 19.3518C12.3157 19.3518 9.73036 17.2143 9.73036 14.1607H8C8 17.6316 10.7686 20.502 14.1071 21.0007V24.3393H16.1429V21.0007C19.4814 20. 5121 22.25 17.6418 22.25 14.1607H20.5196Z" fill="white"/>
            `;
        });
};
if (voiceIcon) {
    voiceIcon.addEventListener('click', () => {
        if (!mediaRecorder || mediaRecorder.state !== 'recording') {
            startRecording();
        } else {
            mediaRecorder.stop();
        }
    });
}

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

const textarea = document.getElementById('input');
const maxHeight = 200;
let isUserScrolledUp = false;

function autoResize() {
    if (!textarea.value.trim()) {
        textarea.style.height = '44px';
        textarea.style.overflowY = 'hidden';
        return;
    }

    // Check if the user has scrolled up
    if (textarea.scrollTop < textarea.scrollHeight - textarea.clientHeight) {
        isUserScrolledUp = true;
    } else {
        isUserScrolledUp = false;
    }

    textarea.style.overflowY = 'hidden';

    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + 'px';

    requestAnimationFrame(() => {
        if (newHeight >= maxHeight) {

            textarea.style.overflowY = 'scroll';
            // Only scroll to bottom if the user hasn't manually scrolled up
            if (!isUserScrolledUp) {
                textarea.scrollTop = textarea.scrollHeight;
            }
        } else {
            textarea.style.overflowY = 'hidden';
            textarea.scrollTop = textarea.scrollTop;
        }
    });

    var iconContainer = document.querySelector('.icon-container');
    var editDiv = document.getElementById("editMessageDiv");
    var repDiv = document.getElementById("reply-div");
    let combinedHeight = parseInt(newHeight);

    if (getComputedStyle(editDiv).display === "block") {
        combinedHeight += parseInt(editDiv.offsetHeight);
    }
    if (getComputedStyle(repDiv).display === "block") {
        combinedHeight += parseInt(repDiv.offsetHeight);
    }

    iconContainer.style.bottom = (combinedHeight + 50) + "px";
}

// Reset the scroll flag when user scrolls
textarea.addEventListener('scroll', () => {
    if (textarea.scrollTop < textarea.scrollHeight - textarea.clientHeight) {
        isUserScrolledUp = true;
    } else {
        isUserScrolledUp = false;
    }
});

textarea.addEventListener('input', autoResize);
textarea.addEventListener('paste', autoResize);

textarea.addEventListener('keydown', function (event) {
    if ((event.key === 'Backspace' || event.key === 'Delete') && !textarea.value.trim()) {
        textarea.style.height = '44px';
        textarea.style.overflowY = 'hidden';
    }
});

textarea.addEventListener('keydown', function (event) {

    if (event.key === 'Enter' && !event.shiftKey) {

        const editReplyArea = document.getElementById('Editreply-area');
        const sendMessagebutton = document.getElementById('message-send-area');

        if (window.getComputedStyle(sendMessagebutton).display === 'block') {
            sendMessagebutton.style.display = "none";
            const chatIcons = document.querySelector('#chat_action');
            if (chatIcons.style.display !== "flex") {
                chatIcons.style.display = "flex";
            }
        }

        if (window.getComputedStyle(editReplyArea).display === 'none') {
            event.preventDefault();
            sendMessage();
            textarea.style.height = '44px';
            textarea.style.overflowY = 'hidden';
            removeQuotedMessage();

            const chatActionElement = document.getElementById('chat_action');
            if (chatActionElement) {
                chatActionElement.setAttribute('tabindex', '0');
                chatActionElement.focus();
            }
            textarea.focus();
        } else if (window.getComputedStyle(editReplyArea).display === 'block') {
            document.getElementById('send-message-btn').addEventListener('click', handleSendMessage);
            textarea.style.height = '44px';
            textarea.style.overflowY = 'hidden';
        } else {
            // console.log('The div has a different display property.');
        }
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
            // const group = chatList.find(group => group.group.group_id === groupId);
            // if (group) {
            //     const messageIndex = group.group.group_messages.findIndex(message => message.id === messageId);
            //     if (messageIndex !== -1) {
            //         group.group.group_messages.splice(messageIndex, 1);
            //     }
            // }

            $("#deleteModal").on('hide.bs.modal', function () { });
            $('#deleteModal').removeClass('show');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            // let paginateArrayLastMessage = pagnicateChatList.data.reverse()[pagnicateChatList.data.length - 1]

            socket.emit('deleteMessage', messageId, false);
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
        // console.log("Something went wrong");
    }
})

//search groups
let groupSearchField = document.getElementById("search_group");
let debounceTimeout = null;
let currentPageGroups = 1;
let currentPageMessages = 1;
let isFetchingGroups = false;
let isFetchingMessages = false;

// group here
let searchGroups = async (searchQuery, loadMore = false) => {

    const buttons = document.querySelector('.buttons');
    if (loadMore) {
        currentPageGroups++;
        currentPageMessages++;
    }

    // else {
    //     currentPageGroups = 1;
    //     currentPageMessages = 1;
    //     DOM.chatList.innerHTML = `<div class="heading"><h2>Groups</h2></div>`;
    //     DOM.chatList2.innerHTML = `<h2>Messages</h2>`;
    // }
    else {
        currentPageGroups = 1;
        currentPageMessages = 1;
        DOM.chatList.innerHTML = '';
        DOM.chatList2.innerHTML = '';
    }

    if (searchQuery.trim().length > 0) {
        buttons.style.display = 'none';
        DOM.groupSearch = true;
        DOM.messageSearchQuery = searchQuery;
        const url = `search-group-by-name/${searchQuery}?page_groups=${currentPageGroups}&page_messages=${currentPageMessages}`;
        const unique_id = document.getElementById("login_user_unique_id").value;

        try {
            const groupResponse = await fetch(url);
            const response = await groupResponse.json();
            if (response) {
                let groups = new Set();
                groups = response.data.groups.data;
                const messages = response.data.messages.data;
                console.log(groups, messages);
                if (!groups || groups.length === 0) {
                    console.log('no group is found');
                    if (!loadMore) {
                        console.log("no group is found and not loading more message");
                        DOM.chatList.innerHTML = '';
                        DOM.chatList.style.display = 'none';
                    }
                } else {
                    DOM.chatList.style.display = 'block';
                    DOM.chatList.innerHTML += `<div class="heading"><h2>Groups</h2></div>`;
                    groups.forEach((group) => {
                        let chat = {
                            isGroup: true,
                            group: group,
                            name: group.name,
                            unread: 0
                        };

                        if (group.group_messages && group.group_messages.length > 0) {
                            group.group_messages.reverse().forEach((msg) => {
                                chat.unread += (msg.sender !== unique_id && !msg.seen_by.split(",").map(s => s.trim()).includes(unique_id)) ? 1 : 0;
                                chat.time = new Date(msg.time * 1000);
                            });
                        }

                        chatList.push(chat);
                    });
                    viewChatList(true);
                }

                if (messages == undefined) {
                    console.log("is loading", loadMore);
                    if (!loadMore) {
                        console.log("in condition");
                        // DOM.chatList2.innerHTML = `<div class="no-messages-found">No messages found.</div>`;
                        document.getElementById('messagesList').innerHTML = '<div class="no-messages-found">No messages found.</div>';
                        return;
                    }
                } else {
                    messages.forEach((msg) => {
                        messageList.push(msg);
                    });
                    viewMessageList();
                }

                // if (loadMore && !groups && messages == undefined) {
                //     DOM.chatList2.innerHTML += `<div class="no-messages-found">No more data found.</div>`;
                // }
            }
        } catch (error) {
            // console.log(error);
        }
    } else {
        DOM.groupSearch = false;
        buttons.style.display = 'block';
        // chatList = [...previousChatList];
        // chatList.sort((a, b) => {
        //     if (a.time && b.time) {
        //         return new Date(b.time) - new Date(a.time);
        //     } else if (a.time) {
        //         return -1;
        //     } else if (b.time) {
        //         return 1;
        //     } else {
        //         return 0;
        //     }
        // });
        messageList = [];
        DOM.messagesList.innerHTML = '';
        // viewChatList();
        DOM.chatList.style.display = 'block';
        generateChatList();
    }
};

let searchInputField = document.querySelector(".chat-row");

searchInputField.addEventListener('scroll', () => {
    if (groupSearchField.value) {
        if (searchInputField.scrollTop + searchInputField.clientHeight >= searchInputField.scrollHeight) {
            if (!isFetchingGroups && !isFetchingMessages) {
                isFetchingGroups = true;
                isFetchingMessages = true;
                searchGroups(groupSearchField.value, true);
                isFetchingGroups = false;
                isFetchingMessages = false;
            }
        }
    }
});

groupSearchField.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        currentPageGroups = 1;
        currentPageMessages = 1;
        chatList = [];
        messageList = [];
        searchGroups(groupSearchField.value);
    }, 300);
});


async function unreadGrouChat() {
    try {
        const url = `get-unread-chat-groups`;
        const unreadConversationGroupResponse = await fetch(url);
        const response = await unreadConversationGroupResponse.json();
    }
    catch (error) {
        // console.log(error);
    }
}

function replaceBrWithNewline(value) {
    return value.replace(/<br\s*\/?>/gi, '\n'); // Replaces all <br> tags with \n
}

let searchMessageOffset = 0;
const searchMessageLimit = 40;
let previousSearchQuery = "";
let searchMessageInputFeild = document.getElementById("messsage_search_query");
searchMessageInputFeild.addEventListener("input", function (e) {
    if (e.target.value.length > 0) {
        DOM.messageSearchQuery = e.target.value;
        if (e.target.value.length > 0) {
            DOM.messageSearchQuery = e.target.value;
            if (e.target.value !== previousSearchQuery) {
                searchMessageOffset = 0;
                previousSearchQuery = e.target.value;
                const searchResultsDiv = document.querySelector(".search-results");
                searchResultsDiv.innerHTML = "";
            }
        }
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async function () {
            const url = `message/search/${e.target.value}/${DOM.groupId}/${searchMessageOffset}/${searchMessageLimit}`;
            try {
                fetch(url)
                    .then(response => response.json())
                    .then(messageResponse => {
                        const searchResultsDiv = document.querySelector(".search-results");
                        if (searchMessageOffset === 0) {
                            searchResultsDiv.innerHTML = "";
                        }
                        const searchQuery = e.target.value.toLowerCase();
                        if (!messageResponse.messages || messageResponse.messages.length === 0) {
                            if (searchMessageOffset === 0) {
                                const noResultsDiv = document.createElement("div");
                                noResultsDiv.className = "no-results";
                                noResultsDiv.textContent = "No results";
                                searchResultsDiv.appendChild(noResultsDiv);
                            }
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
                            DOM.searchMessageClick = false;

                            if (message.msg.startsWith("https://")) {
                                resultTextDiv.textContent = message.media_name;
                            } else if (/<a[^>]+>/g.test(message.msg)) {

                                messageText = getOldMessageMediaName(message);
                                resultTextDiv.textContent = messageText;
                            }
                            else if (message.msg.includes("<p>")) {
                                resultTextDiv.innerHTML = message.msg
                            }
                            else if (message.is_compose == 1 || message.is_compose == true) {
                                let vmMessage = processValue(message.msg, false);
                                resultTextDiv.textContent = vmMessage.replace(/<br\s*\/?>/gi, '\n');;
                            }
                            else {
                                resultTextDiv.textContent = message.msg;
                            }
                            resultItemDiv.appendChild(resultDateDiv);
                            resultItemDiv.appendChild(resultTextDiv);
                            searchResultsDiv.appendChild(resultItemDiv);

                            resultItemDiv.addEventListener("click", async function () {
                                await showloader()
                                DOM.loader_showing = true;
                                let messageId = message.id;
                                const messageElement = DOM.messages.querySelector(`[data-message-id="${messageId}"]`);
                                handleMessageResponse(messageElement, message, messageId, searchQuery);
                                setTimeout(() => {
                                    hideSpinner();
                                    DOM.loader_showing = false;
                                }, 1000);
                            });
                        });
                        searchMessageOffset += searchMessageLimit;
                    })
                    .catch(error => {
                        console.error('Error:', "Not Found");
                    });
            } catch (error) {
                // console.log(error);
            }
        }, 500)
    }
    else {
        const searchResultsDiv = document.querySelector(".search-results");
        searchResultsDiv.innerHTML = "";
        removeHighlight();
        searchMessageOffset = 0;
        previousSearchQuery = "";
    }
})

let isFetching = false;
var messageSidebar = document.getElementById('search-results');
messageSidebar.addEventListener('scroll', function () {
    if (isFetching) return;
    if (messageSidebar.scrollTop + messageSidebar.clientHeight >= messageSidebar.scrollHeight - 2) {
        if (DOM.messageSearchQuery.length > 0) {
            const url = `message/search/${DOM.messageSearchQuery}/${DOM.groupId}/${searchMessageOffset}/${searchMessageLimit}`;
            fetch(url)
                .then(response => response.json())
                .then(messageResponse => {
                    const searchResultsDiv = document.querySelector(".search-results");
                    if (searchMessageOffset === 0) {
                        searchResultsDiv.innerHTML = "";
                    }
                    if (!messageResponse.messages || messageResponse.messages.length === 0) {
                        if (searchMessageOffset === 0) {
                            const noResultsDiv = document.createElement("div");
                            noResultsDiv.className = "no-results";
                            noResultsDiv.textContent = "No results";
                            searchResultsDiv.appendChild(noResultsDiv);
                        }
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

                        DOM.searchMessageClick = true;

                        if (message.msg.startsWith("https://")) {
                            resultTextDiv.textContent = message.media_name;
                        } else if (/<a[^>]+>/g.test(message.msg)) {

                            messageText = getOldMessageMediaName(message);
                            resultTextDiv.textContent = messageText;
                        }
                        else if (message.msg.includes("<p>")) {
                            resultTextDiv.innerHTML = message.msg
                        }
                        else {
                            resultTextDiv.textContent = message.msg;
                        }
                        resultItemDiv.appendChild(resultDateDiv);
                        resultItemDiv.appendChild(resultTextDiv);
                        searchResultsDiv.appendChild(resultItemDiv);

                        resultItemDiv.addEventListener("click", function () {
                            let messageId = message.id;
                            const messageElement = DOM.messages.querySelector(`[data-message-id="${messageId}"]`);
                            handleMessageResponse(messageElement, message, messageId, DOM.messageSearchQuery);
                        });
                    });
                    searchMessageOffset += searchMessageLimit;
                    isFetching = false;
                })
                .catch(error => {
                    console.error('Error:', "Not Found");
                    isFetching = false;
                });
        }
    }
});

function handleMessageResponse(messageElement, message, messageId, searchQuery) {
    let replyDisplay = '';
    if (messageElement) {
        // DOM.searchMessageClick = true;
        const messageTextElement = messageElement.querySelector(".shadow-sm");
        let highlightElement = document.getElementsByClassName("highlight")[0];
        if (highlightElement) {
            highlightElement.classList.remove("highlight");
        }
        switch (message.type) {
            case "Message":
                if (message.reply) {
                    if(!message.reply.type)
                        message.reply.type=getOldMessageType(message.reply);
                    messageTextElement.innerHTML = '';
                    if (message.reply.type === "Audio") {

                        var message_body = `<div class="audio-message" style="background-color:${message.user.id == user.id ? '#dcf8c6' : 'white'};" data-audio-src="${message.reply.msg}">
                            <div class="avatar">
                                <!-- Avatar image here -->
                            </div>
                            <div class="audio-content">
                                <div class="audio-controls">
                                    <button class="playbutton">
                                      <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
                                      </svg>
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
                            <div class="reply-message-div"  onclick="scrollToMessage('${message.reply.id}','${message.id}')">
                                <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                                ${message.user?.id == user?.id ? message.user.name : message.user.name}

                                </div>
                                <div class="reply-details">
                                    <p class="file-name">${message_body}</p>
                                </div>
                            </div>
                        <div class="reply-message-area">${(message.msg || message.message).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}</div> <!-- Updated this line -->
                        `;

                        const searchQuery = DOM.messageSearchQuery;
                        const messageText = message.msg.toLowerCase();
                        const index = messageText.indexOf(searchQuery);
                        const isAlreadyHighlighted = messageTextElement.querySelector('.highlight');
                        if (index !== -1 && !isAlreadyHighlighted) {
                            const highlightedText = message.msg.substring(0, index) +
                                `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
                                message.msg.substring(index + searchQuery.length);

                            newMessageDisplay = `
                            <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')">
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

                        messageTextElement.innerHTML = newMessageDisplay;

                    }
                    else if (message.reply.type === "File") {
                        replyDisplay = `
                        <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')">
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
                            `<div style="padding-top: 10px;">${message.msg.replace(/[\r\n]+/g, '<br>')}</div>`;
                        const searchQuery = DOM.messageSearchQuery;
                        const messageText = message.msg.toLowerCase();
                        const index = messageText.indexOf(searchQuery);
                        const isAlreadyHighlighted = messageTextElement.querySelector('.highlight');

                        if (index !== -1 && !isAlreadyHighlighted) {
                            const highlightedText = message.msg.substring(0, index) +
                                `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
                                message.msg.substring(index + searchQuery.length);
                            messageTextElement.innerHTML = replyDisplay + highlightedText.replace(/[\r\n]+/g, '<br>');
                        }
                    }
                    else if (message.reply.type === "Image") {
                        var message_body = `<img class="view-image" src="${message.reply.msg}" style="height:125px; width:125px;">`;
                        replyDisplay = `
                            <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')"> <!-- Add onclick here -->
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
                        const isAlreadyHighlighted = messageTextElement.querySelector('.highlight');
                        if (index !== -1 && !isAlreadyHighlighted) {
                            const highlightedText = message.msg.substring(0, index) +
                                `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
                                message.msg.substring(index + searchQuery.length);
                            messageTextElement.innerHTML = replyDisplay + highlightedText.replace(/[\r\n]+/g, '<br>');
                        }
                    }

                    else if (message.reply.type === "Message") {
                        replyDisplay = `
                            <div class="reply-message-div" onclick="scrollToMessage('${message.reply.id}','${message.id}')">
                                <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                                    ${message.user?.id == user?.id ? message.user.name : message.user.name}
                                </div>
                                <div class="reply-details">
                                    <p class="file-name">${message.reply.msg}</p>
                                </div>
                            </div>
                        `;

                        let messageDisplay = replyDisplay;

                        const messageText = message.msg.toLowerCase();
                        const index = messageText.indexOf(searchQuery);
                        const isAlreadyHighlighted = messageTextElement.querySelector('.highlight');
                        if (index !== -1 && !isAlreadyHighlighted) {
                            const highlightedText = message.msg.substring(0, index) +
                                `<span class="highlight">${message.msg.substring(index, index + searchQuery.length)}</span>` +
                                message.msg.substring(index + searchQuery.length);

                            messageDisplay += `<div class="reply-message-area">${highlightedText.replace(/[\r\n]+/g, '<br>')}</div>`;
                        } else {
                            messageDisplay += `<div class="reply-message-area">${(message.msg || message.message).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>')}</div>`;
                        }

                        messageTextElement.innerHTML = messageDisplay;
                    }
                }
                else {
                    const messageText = messageTextElement.innerHTML;
                    const index = messageText.indexOf(searchQuery);

                    const isAlreadyHighlighted = messageTextElement.querySelector('.highlight');

                    if (index !== -1 && !isAlreadyHighlighted) {
                        const highlightedText = messageText.substring(0, index) +
                            `<span class="highlight">${messageText.substring(index, index + searchQuery.length)}</span>` +
                            messageText.substring(index + searchQuery.length);

                        messageTextElement.innerHTML = highlightedText;
                    }
                }
                break;
            case "File":
                const fileNameElement = messageElement.querySelector(".file-name");
                const isAlreadyHighlighted = messageTextElement.querySelector('.highlight');

                if (fileNameElement && !isAlreadyHighlighted) {
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

                    const nullTypeIndex = nullTypeMessageText.toLowerCase().indexOf(DOM.messageSearchQuery);
                    const isAlreadyHighlighted = messageTextElement.querySelector('.highlight');

                    if (nullTypeIndex !== -1 && !isAlreadyHighlighted) {
                        const highlightedText = nullTypeMessageText.substring(0, nullTypeIndex) +
                            `<span class="highlight">${nullTypeMessageText.substring(nullTypeIndex, nullTypeIndex + searchQuery.length)}</span>` +
                            nullTypeMessageText.substring(nullTypeIndex + searchQuery.length);

                        nullTypemessageTextElement.innerHTML = highlightedText;
                    }
                } else {
                    // console.log("No element with class 'shadow-sm' found for unknown message type:", message.type);
                }
                break;
            // console.log("Unknown message type:", message.type);
        }
        messageElement.scrollIntoView({ behavior: "smooth" });
        setTimeout(function () {
            mobilegroupSearchClose();
        }, 700)

    } else {
        fetchPaginatedMessages(messageId, null, null);
    }
}

function removeHighlight() {
    const messageElements = DOM.messages.querySelectorAll(".shadow-sm");
    messageElements.forEach((element) => {
        element.innerHTML = element.textContent;
    });
}
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
// function get_voice_list() {
//     const audioMessages = document.querySelectorAll('.chat_list_messages .audio-message');

//     audioMessages.forEach((message) => {
//         const playButton = message.querySelector('.play-button');
//         const progressBarContainer = message.querySelector('.audio-progress');
//         const progressFilled = message.querySelector('.progress-filled');
//         const audioDuration = message.querySelector('.audio-duration');
//         const audioSrc = message.getAttribute('data-audio-src');
//         const audioTotalDuration=message.querySelector('.audio-time');
//         const audioPlayer = new Audio(audioSrc);
//         audioPlayer.addEventListener('loadedmetadata', () => {
//             if (isFinite(audioPlayer.duration)) {
//                 const totalDuration = audioPlayer.duration;
//                 audioTotalDuration.innerHTML = formatDuration(totalDuration);
//             } else {
//                 audioTotalDuration.innerHTML = '00:00';
//             }
//         });

//         // Load the audio to trigger the metadata loading
//         audioPlayer.load();
//         if (playButton) {

//             playButton.addEventListener('click', function () {
//                 if (audioPlayer.paused) {
//                     if (currentlyPlayingAudio && currentlyPlayingAudio !== audioPlayer) {
//                         currentlyPlayingAudio.pause();
//                         currentlyPlayingAudio.currentTime = 0;
//                         playButton.innerHTML = `<svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
//                         <path d="M3 21C4.65 21 6 19.65 6 18V3C6 1.35 4.65 0 3 0C1.35 0 0 1.35 0 3V18C0 19.65 1.35 21 3 21ZM12 3V18C12 19.65 13.35 21 15 21C16.65 21 18 19.65 18 18V3C18 1.35 16.65 0 15 0C13.35 0 12 1.35 12 3Z" fill="#687780"/>
//                         </svg>`;
//                     }

//                     audioPlayer.play();
//                     playButton.innerHTML = `<svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path d="M3 21C4.65 21 6 19.65 6 18V3C6 1.35 4.65 0 3 0C1.35 0 0 1.35 0 3V18C0 19.65 1.35 21 3 21ZM12 3V18C12 19.65 13.35 21 15 21C16.65 21 18 19.65 18 18V3C18 1.35 16.65 0 15 0C13.35 0 12 1.35 12 3Z" fill="#687780"/>
// </svg>`;
//                     currentlyPlayingAudio = audioPlayer;
//                 } else {
//                     audioPlayer.pause();
//                     playButton.innerHTML = `    <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
//                         </svg>`;
//                     currentlyPlayingAudio = null;
//                 }
//             });
//         }

//         // Update the progress bar as the audio plays
//         audioPlayer.addEventListener('timeupdate', function () {

//             if (audioPlayer.duration) {
//                 if (isFinite(audioPlayer.duration)) {
//                     const totalDuration = audioPlayer.duration;
//                     audioTotalDuration.innerHTML = formatDuration(totalDuration);
//                 } else {
//                     audioTotalDuration.innerHTML = '00:00';
//                 }
//                 const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
//                 progressFilled.style.width = `${progressPercent}%`;
//                 audioDuration.textContent = formatTime(audioPlayer.currentTime);
//             }
//         });

//         audioPlayer.addEventListener('ended', function () {
//             playButton.innerHTML = `<svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
// </svg>`;
//             progressFilled.style.width = '0%';
//             audioDuration.textContent = '0:00';
//             currentlyPlayingAudio = null;
//         });

//         function formatTime(seconds) {
//             const minutes = Math.floor(seconds / 60);
//             const secs = Math.floor(seconds % 60);
//             return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
//         }

//         progressBarContainer.addEventListener('click', (event) => {
//             const progressBarWidth = progressBarContainer.offsetWidth;
//             const clickX = event.offsetX;

//             if (audioPlayer.duration && audioPlayer.duration > 0) {
//                 const newTime = (clickX / progressBarWidth) * audioPlayer.duration;
//                 audioPlayer.currentTime = Math.min(Math.max(newTime, 0), audioPlayer.duration);
//             } else {
//                 console.warn('Audio duration is not available or invalid:', audioPlayer.duration);
//             }
//         });

//         audioPlayer.addEventListener('play', () => console.log('Playing audio:', audioSrc));
//         audioPlayer.addEventListener('pause', () => console.log('Paused audio:', audioSrc));
//     });
// }
function get_voice_list() {

    const audioMessages = document.querySelectorAll('.chat_list_messages .audio-message');

    audioMessages.forEach((message) => {
        const playButton = message.querySelector('.play-button');
        const progressBarContainer = message.querySelector('.audio-progress');
        const progressFilled = message.querySelector('.progress-filled');
        const audioDuration = message.querySelector('.audio-duration');
        const audioSrc = message.getAttribute('data-audio-src');
        const audioTotalDuration = message.querySelector('.audio-time');
        const audioPlayer = new Audio(audioSrc);
        audioPlayer.preload = 'metadata';
        audioPlayer.src = audioSrc;
        audioPlayer.load();
        audioPlayer.addEventListener('loadedmetadata', updateDuration);
        audioPlayer.addEventListener('canplaythrough', updateDuration);

        function updateDuration() {
            if (isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
                const totalDuration = audioPlayer.duration;
                audioTotalDuration.innerHTML = formatDuration(totalDuration);
            } else {
                audioTotalDuration.innerHTML = '00:00';
            }
        }
        if (playButton) {
            playButton.addEventListener('click', function () {
                if (audioPlayer.paused) {

                    if (currentlyPlayingAudio && currentlyPlayingAudio !== audioPlayer) {
                        currentlyPlayingAudio.pause();
                        // currentlyPlayingAudio.currentTime=0;
                        updatePlayButton(currentPlaybutton, false);
                    }
                    audioPlayer.play();
                    updatePlayButton(playButton, true);
                    currentlyPlayingAudio = audioPlayer;
                    currentPlaybutton = playButton;
                } else {
                    audioPlayer.pause();
                    updatePlayButton(playButton, false);
                    currentlyPlayingAudio = null;
                }
            });
        }

        audioPlayer.addEventListener('timeupdate', function () {
            const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressFilled.style.width = `${progressPercent}%`;
            audioDuration.textContent = formatTime(audioPlayer.currentTime);
        });

        audioPlayer.addEventListener('ended', function () {
            progressFilled.style.width = '0%';
            audioDuration.textContent = '0:00';
            currentlyPlayingAudio = null;
            currentPlaybutton = null;
            updatePlayButton(playButton, false);
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

function updatePlayButton(playButton, isPaused) {
    if (isPaused) {
        playButton.innerHTML = `<svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21C4.65 21 6 19.65 6 18V3C6 1.35 4.65 0 3 0C1.35 0 0 1.35 0 3V18C0 19.65 1.35 21 3 21ZM12 3V18C12 19.65 13.35 21 15 21C16.65 21 18 19.65 18 18V3C18 1.35 16.65 0 15 0C13.35 0 12 1.35 12 3Z" fill="#687780"/>
                </svg>`;
    } else {
        playButton.innerHTML = `<svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.687 10.3438C17.6889 10.616 17.6203 10.8841 17.4879 11.122C17.3555 11.3599 17.1638 11.5595 16.9314 11.7013L2.53109 20.6007C2.28831 20.7509 2.00983 20.8336 1.72442 20.8402C1.43902 20.8468 1.15703 20.777 0.907579 20.6382C0.660509 20.5015 0.454302 20.3015 0.310162 20.0587C0.166023 19.8159 0.0891535 19.5391 0.0874594 19.2568L0.00722626 1.59107C0.00635568 1.30872 0.0807075 1.03124 0.222636 0.787147C0.364564 0.543058 0.568946 0.341177 0.814765 0.202266C1.06294 0.0611697 1.34429 -0.0111163 1.62974 -0.0071269C1.9152 -0.0031375 2.19441 0.0769828 2.43855 0.224959L16.9191 8.99323C17.1528 9.13296 17.3463 9.33077 17.4808 9.56744C17.6154 9.80411 17.6864 10.0716 17.687 10.3438Z" fill="#687780"/>
                </svg>`;
    }
}

async function restoreMessage(id) {

    try {
        await fetch("message/restore/" + id, {
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
            socket.emit('restoreMessage', message);

            var messageElement = $(`[data-message-id="${id}"]`);

            if (messageElement.length > 0) {
                const restoreButton = $(`#restore-button-${id}`);
                if (restoreButton.length > 0) {

                    restoreButton.replaceWith(`<span id="reply-link" style="color: #463C3C; cursor: pointer; text-decoration: underline; color: #666;" onclick="showReply('${id}','${message.message.user.name}','${message.message.type}')">Reply</span>`);
                }

                messageElement.removeClass("deleted_niddle");
                messageElement.find(".additional_style").removeClass("msg_deleted");
            }
        })
    }
    catch (error) {
        // console.log("Error Restoring Message:", error);
    }
}

const actionBarParent = document.querySelector('#reply-area');
const InputBar = document.querySelector('#input');
const iconnContainer = document.querySelector('.icon-container');
const editDiv = document.querySelector('#editMessageDiv');

const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {

        const newHeight = entry.contentRect.height;
        if (newHeight > 200) {
            actionBarParent.style.height = "200px";
            InputBar.style.height = "180px";

        }
        if (newHeight < 200) {
            actionBarParent.style.height = "auto";

        }
        if (getComputedStyle(editDiv).display == "block") {
            change_icon_height(editDiv);

        } else {
            change_icon_height(actionBarParent);
        }
    }
});

// resizeObserver.observe(InputBar);

const resetChatArea = () => {
    const MessageInput = document.getElementById("messsage_search_query");
    const SerachResults = document.getElementById("search-results");
    const unreadWrapper = document.getElementById('unread-wrapper');
    DOM.notificationDiv.style.display = "none";
    DOM.counter = 0;
    DOM.unreadCounter = 0;
    MessageInput.value = "";
    SerachResults.innerHTML = '';

    if (unreadWrapper) {
        unreadWrapper.remove();
    }
}

function ImageViewer(elem) {
    const images = elem.querySelectorAll('.view-image');
    images.forEach(image => {

        if (!image.viewer) {
            image.viewer = new Viewer(image, {
                url: 'data-original',
                toolbar: {
                    reset: true,
                },
                title: false,
                inline: false,
                loop: false,
                movable: false,
                zoomable: true,
                rotatable: false,
                scalable: false
            });
        }

        image.addEventListener('click', function () {
            image.viewer.show();
        });
    });
}

let update_user_profile = async (elem, file) => {

    try {
        const response = await fetch("update_user_profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({
                userId: user.id,
                imgUrl: file
            }),
        });
        const res = await response.json();
        if (res.status == 200) {
            const profileDiv = document.getElementsByClassName("profile-icons")[0];
            const activeImage = profileDiv.getElementsByClassName("choose-profile-images active")[0];
            if (activeImage)
                activeImage.classList.remove("active");
            DOM.profilePic.src = "assets/profile_pics/" + file;
            DOM.displayPic.src = "assets/profile_pics/" + file;
            elem.classList.add('active');
        }
    } catch (error) {
        console.error('Error updating User Profile:', error);
    }
}

// DOM.inputName.addEventListener("blur", async (e) => {
//     const name = e.target.value;
//     try {
//         const response = await fetch("update_user_profile", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "X-CSRF-Token": csrfToken,
//             },
//             body: JSON.stringify({
//                 userId: user.id,
//                 name: name
//             }),
//         });
//         const res = await response.json();
//         if (res.status == 200) {
//             user.name = name;
//         }
//     } catch (error) {
//         console.error('Error updating User Profile:', error);
//     }
// });

let draggableIcon = () => {
    const icon = document.querySelector('.onesignal-bell-container');
    if (!icon) return;
    let offsetX = 0, offsetY = 0;
    const iconSize = 50;

    const getBoundedPosition = (x, y) => {
        const minX = 0;
        const maxX = window.innerWidth - iconSize;
        const minY = 0;
        const maxY = window.innerHeight - iconSize;
        return {
            x: Math.max(minX, Math.min(x, maxX)),
            y: Math.max(minY, Math.min(y, maxY)),
        };
    };

    icon.addEventListener('touchstart', (event) => {
        const touch = event.touches[0];
        const rect = icon.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
    });

    icon.addEventListener('touchmove', (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        const { x, y } = getBoundedPosition(
            touch.clientX - offsetX,
            touch.clientY - offsetY
        );

        icon.style.position = 'absolute';
        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
    });

    icon.addEventListener('touchend', () => {
        isTouching = false;
    });
};

setTimeout(draggableIcon, 2000);
let dragableIcon = () => {
    const draggableIcon = document.querySelector('.onesignal-bell-container');
    if (!draggableIcon)
        return;
    draggableIcon.setAttribute('draggable', 'true');

    draggableIcon.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', null); // For Firefox compatibility
        event.dataTransfer.effectAllowed = 'move';
    });

    document.addEventListener('dragover', (event) => {
        event.preventDefault(); // Prevent default to allow drop
    });

    document.addEventListener('drop', (event) => {
        event.preventDefault();

        const iconSize = 50; // Adjust this based on the actual icon size
        const x = event.clientX;
        const y = event.clientY;

        // Calculate the boundaries for the icon
        const minX = 0;
        const maxX = window.innerWidth - iconSize;
        const minY = 0;
        const maxY = window.innerHeight - iconSize;

        // Ensure the new position is within the boundaries
        const newX = Math.max(minX, Math.min(x - iconSize / 2, maxX));
        const newY = Math.max(minY, Math.min(y - iconSize / 2, maxY));

        // Set the position of the icon based on the adjusted drop location
        draggableIcon.style.position = 'absolute';
        draggableIcon.style.left = `${newX}px`;
        draggableIcon.style.top = `${newY}px`;
    });
}

setTimeout(dragableIcon, 2000);
let sendMessageFunc = () => {
    const sendMessagebutton = document.getElementById('message-send-area');

    if (window.getComputedStyle(sendMessagebutton).display === 'block') {
        sendMessagebutton.style.display = "none";
        const chatIcons = document.querySelector('#chat_action');
        if (chatIcons.style.display !== "flex") {
            chatIcons.style.display = "flex";
        }
    }

    sendMessage();
    textarea.style.height = '44px';
    textarea.style.overflowY = 'hidden';
    removeQuotedMessage();
    const chatActionElement = document.getElementById('chat_action');
    if (chatActionElement) {
        chatActionElement.setAttribute('tabindex', '0');
        chatActionElement.focus();
    }
    textarea.focus();
};
function mobilegroupSearchClose() {
    if (window.innerWidth <= 768) {
        $("#search-icon").hasClass("d-none") ? $("#search-icon").removeClass("d-none") : '';
        $("#sidebar").removeClass("sidebar-open").addClass("sidebar-closed");
        $(".container-fluid").removeClass("sidebar-open");
        $("#search-icon").removeClass("icon-move-left");
        $("#message-area").toggleClass("col-md-4 col-md-8");
    }
}
