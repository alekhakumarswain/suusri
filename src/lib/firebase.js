import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app;
let auth;
let provider;
let db;

async function getFirebase() {
    if (app) return { auth, provider, db };

    try {
        const response = await fetch("http://localhost:5000/api/firebase-config");
        const firebaseConfig = await response.json();

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        provider = new GoogleAuthProvider();
        db = getFirestore(app);

        return { auth, provider, db };
    } catch (error) {
        console.error("Failed to load Firebase config:", error);
        throw error;
    }
}

export { getFirebase };
