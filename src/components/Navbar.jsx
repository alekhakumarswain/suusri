import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Main.css';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const { user, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const handleProfileClick = async () => {
        if (user) {
            navigate('/profile');
        } else {
            try {
                await loginWithGoogle();
                // Redirection is handled by the component or just stay on page as user is now set
            } catch (err) {
                console.error("Login Error:", err);
            }
        }
    };

    return (
        <>
            <nav className={`navbar navbar-expand-lg sticky-top ${scrolled ? 'scrolled' : ''}`}>
                <div className="container d-flex justify-content-between align-items-center">
                    <a className="navbar-brand" href="/"><b>SuuSri</b></a>
                    
                    <div className="nav-profile" onClick={handleProfileClick}>
                        {user ? (
                            <img src={user.picture} alt="Profile" className="profile-pic-nav" />
                        ) : (
                            <div className="profile-dummy-icon">
                                <i className="fas fa-user-circle"></i>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
