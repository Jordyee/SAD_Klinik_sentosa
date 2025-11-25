// Firebase Configuration for Frontend
// Initialize Firebase services for the web app

// Firebase Web SDK configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9jLIoInkDibOZbFKoxuCCKvVulo-QGR8",
    authDomain: "sad-klinik-sentosa.firebaseapp.com",
    projectId: "sad-klinik-sentosa",
    storageBucket: "sad-klinik-sentosa.firebasestorage.app",
    messagingSenderId: "1030896403368",
    appId: "1:1030896403368:web:761604a8bab68da96c939d",
    measurementId: "G-CHCJ09Y7EV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Firestore settings
db.settings({
    timestampsInSnapshots: true
});

// Optional: Enable persistence for offline support
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        }
    });

console.log('Firebase initialized successfully');

// Export for use in other scripts
window.firebaseAuth = auth;
window.firebaseDB = db;
