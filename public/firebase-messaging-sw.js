importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDRLWiCkGZjuUlZs2JXN0Ig60CLCG9Wk6I",
  authDomain: "shopa-prod.firebaseapp.com",
  projectId: "shopa-prod",
  messagingSenderId: "293904271846",
  appId: "1:293904271846:web:e1722a69a54d16d81d2e27",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Shopa', {
    body: body || 'You have a new notification',
    icon: icon || '/images/logo.png',
    badge: '/images/logo.png',
    data: payload.data,
  });
});
