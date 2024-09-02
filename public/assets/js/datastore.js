

let groupList = [
    {
        id: 1,
        name: "Programmers",
        members: [0, 1, 3],
        pic: "assets/images/0923102932_aPRkoW.jpg"
    }
];

// message status - 0:sent, 1:delivered, 2:read

let user = {

    id: parseInt(document.getElementById("login_user_id").value),
    name: document.getElementById("login_user_name").value,
    unique_id: document.getElementById("login_user_unique_id").value,
    email: document.getElementById("login_user_email").value,
    pic: "assets/images/asdsd12f34ASd231.png"
};


let contactList = [
    {
        id: 0,
        name: "Awais Ahmad",
        number: "+91 91231 40293",
        pic: "assets/images/asdsd12f34ASd231.png",
        lastSeen: "Apr 29 2018 17:58:02"
    },
    {
        id: 1,
        name: "Nitin",
        number: "+91 98232 37261",
        pic: "assets/images/Ass09123asdj9dk0qw.jpg",
        lastSeen: "Apr 28 2018 22:18:21"
    },
    {
        id: 2,
        name: "Sanjay",
        number: "+91 72631 2937",
        pic: "assets/images/asd1232ASdas123a.png",
        lastSeen: "Apr 28 2018 19:23:16"
    },
    {
        id: 3,
        name: "Suvro Mobile",
        number: "+91 98232 63547",
        pic: "assets/images/Alsdk120asdj913jk.jpg",
        lastSeen: "Apr 29 2018 11:16:42"
    },
    {
        id: 4,
        name: "Dee",
        number: "+91 72781 38213",
        pic: "assets/images/dsaad212312aGEA12ew.png",
        lastSeen: "Apr 27 2018 17:28:10"
    }
];
let messages = [
    {
        id: 5,
        sender: 3,
        sender: {
            email: "dev3@visamtion.org",
            id: 3,
            name: "Suvro Mobile",
            unique_id: "915599882"
        },
        body: "anyone online?",
        time: "April 27, 2018 18:20:11",
        status: 0,
        recvId: 1,
        recvIsGroup: true
    },
    {
        id: 11,
        sender: {
            email: "dev3@visamtion.org",
            id: 1,
            name: "Nitin",
            unique_id: "915599882"
        },
        body: "yeah, i'm online",
        time: "April 28 2018 17:10:21",
        status: 0,
        recvId: 1,
        read_status: 1,
        recvIsGroup: true
    }
];

let MessageUtils = {
    getByGroupId: (groupId) => {
        console.log("on licck group",groupId);
        return messages.filter(msg => msg.recvIsGroup && msg.recvId === groupId);
    },
    getByContactId: (contactId) => {
        return messages.filter(msg => {
            return !msg.recvIsGroup && ((msg.sender === user.id && msg.recvId === contactId) || (msg.sender === contactId && msg.recvId === user.id));
        });
    },
    getMessages: () => {
        return messages;
    },
    changeStatusById: (options) => {
        messages = messages.map((msg) => {
            if (options.isGroup) {
                if (msg.recvIsGroup && msg.recvId === options.id) msg.status = 2;
            } else {
                if (!msg.recvIsGroup && msg.sender === options.id && msg.recvId === user.id) msg.status = 2;
            }
            return msg;
        });
    },
    addMessage: (msg) => {
        msg.id = messages.length + 1;
        messages.push(msg);
    }
};
