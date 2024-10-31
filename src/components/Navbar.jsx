import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css'; 
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Navbar.css'; 
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();

    const handleChatNowClick=()=>{
        navigate('/chat');
    }
    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
                <div className="container">
                    <a className="navbar-brand" href="#home"><b>SuuSri</b></a>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <button className="button-64" role="button" onClick={handleChatNowClick}>
                            <span className="text">
                                <i className="fas fa-comments"></i> CHAT NOW
                            </span>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
}
