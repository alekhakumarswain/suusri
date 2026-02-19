import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirebase } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe;
        const initAuth = async () => {
            try {
                const { auth } = await getFirebase();
                unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                    if (firebaseUser) {
                        const token = await firebaseUser.getIdToken();
                        const userData = {
                            uid: firebaseUser.uid,
                            name: firebaseUser.displayName,
                            email: firebaseUser.email,
                            picture: firebaseUser.photoURL,
                            last_login: new Date().toISOString()
                        };
                        
                        // Sync with backend (Securely using ID Token)
                        fetch("http://localhost:5000/auth/verify", {
                            method: "POST",
                            headers: { 
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify(userData)
                        });

                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                    } else {
                        setUser(null);
                        localStorage.removeItem('user');
                    }
                    setLoading(false);
                });
            } catch (error) {
                console.error("Auth init error:", error);
                setLoading(false);
            }
        };

        initAuth();
        return () => unsubscribe && unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            const { auth, provider } = await getFirebase();
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            const { auth } = await getFirebase();
            await signOut(auth);
            setUser(null);
            localStorage.removeItem('user');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
