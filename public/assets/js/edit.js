if (editedMessage.reply) {
if (editedMessage.reply.type === "Message" && !/<a[^>]+>/g.test(editedMessage.msg) && !/<audio[^>
        ]+>/g.test(editedMessage.msg) || editedMessage.type === null) {
        newMessageDisplay = `<div class="reply-message-area">${editedMessage.msg.replace(/[\r\n]+/g, '<br>')}</div>`; //
        Update with new content

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

        console.log("image");
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
                    <path fill="#54656F"
                        d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z" />
                    <path fill="#54656F" d="M14 9V3.5L19.5 9H14Z" />
                </svg>
            </div>
            <div class="file-details">
                <p class="file-name">${editedMessage.reply.media_name}</p>
            </div>
            <a href="${editedMessage.reply.message ?? editedMessage.reply.msg}" target="_blank"
                download="${editedMessage.reply.media_name}" class="download-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20H19V18H5V20ZM12 16L17 11H14V4H10V11H7L12 16Z" fill="#54656F" />
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
        var message_body = `<div class="audio-message"
            style="background-color:${editedMessage.user.id == user.id ? '#dcf8c6' : 'white'};"
            data-audio-src="${editedMessage.reply.msg}">
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
        <div class="reply-message-div" onclick="scrollToMessage('${editedMessage.reply.id}')">
            <div class="file-icon" style="font-size:14px; color:#1DAB61; font-weight:600;">
                ${editedMessage.user?.id == user?.id ? editedMessage.user.name : editedMessage.user.name}

            </div>
            <div class="reply-details">
                <p class="file-name">${message_body}</p>
            </div>
        </div>
        <div class="reply-message-area">${(editedMessage.msg || editedMessage.message).replace(/\r\n/g,
            '<br>').replace(/\n/g, '<br>').replace(/<i[^>]+>/g, '')}</div> <!-- Updated this line -->
        `;
        messageContentDiv.innerHTML = newMessageDisplay;

        }
        }
