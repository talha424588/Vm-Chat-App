import { getMessaging, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyA8spaZnrsTPHRM-c-Cvybu6fJD-o8CMAQ",
    authDomain: "vm-chat-5c18d.firebaseapp.com",
    projectId: "vm-chat-5c18d",
    storageBucket: "vm-chat-5c18d.appspot.com",
    messagingSenderId: "644255696505",
    appId: "1:644255696505:web:72499c9aa2772cdc2836a8"
};
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const messaging = getMessaging(firebaseConfig);
    const unsubscribe = onMessage(messaging, payload => {
        console.log('Foreground push notification received:', payload);
    });
    return () => {
        unsubscribe();
    };
}
