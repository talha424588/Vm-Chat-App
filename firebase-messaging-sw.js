importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyA8spaZnrsTPHRM-c-Cvybu6fJD-o8CMAQ",
    authDomain: "vm-chat-5c18d.firebaseapp.com",
    projectId: "vm-chat-5c18d",
    storageBucket: "vm-chat-5c18d.appspot.com",
    messagingSenderId: "644255696505",
    appId: "1:644255696505:web:72499c9aa2772cdc2836a8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload?.data?.title ?? "NA";
  const notificationOptions = {
    body: payload?.data?.body ?? "NA",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
