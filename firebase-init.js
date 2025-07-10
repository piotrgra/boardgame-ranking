import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDDQipdWDnBshdv19BfhZ9xt04cH1fX_8o",
    authDomain: "boardgame-99792.firebaseapp.com",
    projectId: "boardgame-99792",
    storageBucket: "boardgame-99792.firebasestorage.app",
    messagingSenderId: "164029620212",
    appId: "1:164029620212:web:3f6ebb543774c37a74a3a1",
    measurementId: "G-H56Y2QXDYS",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


