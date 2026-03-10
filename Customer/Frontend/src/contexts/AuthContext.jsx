import React, { useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "firebase/auth";
import apiService from "../services/apiService";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    function googleSignIn() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    // Mock for getting user profile from backend (could be replaced with real API call later)
    function getUserProfile() {
        if (!currentUser) return null;
        // Basic user object for now
        return {
            uid: currentUser.uid,
            email: currentUser.email,
            role: 'customer', // Default role for now
            displayName: currentUser.displayName
        };
    }

    // ... (inside AuthProvider)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Fetch user details from backend
                    const response = await apiService.get(`/users/${user.uid}`);
                    let backendUser = response.user || {};

                    // Fetch active premium plans for user
                    try {
                        const plans = await apiService.get(`/public/premium-plans/my-plans/${user.uid}`);
                        backendUser.premiumPlansHistory = plans; // Store all history locally

                        // Find the first active plan
                        const activePlan = plans.find(p => p.status === 'active' && new Date(p.expiryDate) > new Date());
                        if (activePlan) {
                            backendUser.activePremiumPlan = activePlan;
                        }
                    } catch (planError) {
                        console.error("Error fetching premium plans for user:", planError);
                    }

                    if (response.success && response.user) {
                        // Merge Firebase user with Backend user data and premium plan
                        setCurrentUser({ ...user, ...backendUser });
                    } else {
                        setCurrentUser(user);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setCurrentUser(user);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout,
        googleSignIn,
        getUserProfile,
        updateUserProfile: (user, data) => updateProfile(user, data),

        verifyEmail: () => {
            if (auth.currentUser) return sendEmailVerification(auth.currentUser);
            return Promise.reject(new Error("No user logged in"));
        },
        resetPassword: (email) => sendPasswordResetEmail(auth, email),
        updateUserPassword: (password) => updatePassword(auth.currentUser, password),
        reauthenticate: (password) => {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
            return reauthenticateWithCredential(auth.currentUser, credential);
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
