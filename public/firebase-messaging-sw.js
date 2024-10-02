importScripts('https://www.gstatic.com/firebasejs/7.7.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.7.0/firebase-messaging.js');

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

const messaging = firebase.messaging();
