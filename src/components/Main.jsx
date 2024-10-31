import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap is included
import './Main.css'; // Create a custom CSS file for additional styling
import icon from '../Assets/img/suu2.png'; // Adjust this path based on where the image is located
import icon1 from '../Assets/img/suu1.png'; // Adjust this path based on where the image is located
import icon2 from '../Assets/img/suu3.png'; // Adjust this path based on where the image is located

import '@fortawesome/fontawesome-free/css/all.min.css'; // Import FontAwesome CSS

import { useNavigate } from 'react-router-dom';

const Main = () => {
    
    const navigate = useNavigate();

    const handleChatNowClick=()=>{
        navigate('/chat');
    }

    return (
        <>
        
        <section className="main">
            <div className="container custom-container">
                <div className="row align-items-center">
                    {/* Content Column */}
                    <div className="col-md-6 order-2 order-md-1">
                        <img src={icon} alt="SuuSri AI Assistant" className="img-fluid custom-image" />
                    </div>

                    {/* Image Column */}
                    <div className="col-md-6 order-1 order-md-2">
                        <h1 className="header">
                            <b>Meet</b> <span className="suuSriText">SuuSri</span>, <br/>
                            <b>Your AI Assistant</b>
                        </h1>
                        <button className="button-69" role="button" onClick={handleChatNowClick}>
                            <span className="text">
                                <i className="fas fa-comments"></i>
                                <b>CHAT NOW</b></span>
                        </button>
                    </div>
                </div>
            </div>
        <div className="container custom-container">
                <div className="row align-items-center">
                    {/* Content Column */}
                    <div className="col-md-6 order-1 order-md-1">

                        <h1 className="header">
                            <b>Meet</b> <span className="suuSriText">SuuSri</span>, <br/>
                            <b>Your AI Assistant</b>
                        </h1>
                        <button className="button-69" role="button" onClick={handleChatNowClick}>
                            <span className="text">
                                <i className="fas fa-comments"></i>
                                <b>CHAT NOW</b></span>
                        </button>

                    </div>

                    {/* Image Column */}
                    <div className="col-md-6 order-2 order-md-2">

                        <img src={icon1} alt="SuuSri AI Assistant" className="img-fluid custom-image" />

                    </div>
                </div>
            </div>
            <div className="container custom-container">
                <div className="row align-items-center">
                    {/* Content Column */}
                    <div className="col-md-6 order-2 order-md-1">
                        <img src={icon2} alt="SuuSri AI Assistant" className="img-fluid custom-image" />
                    </div>

                    {/* Image Column */}
                    <div className="col-md-6 order-1 order-md-2">
                        <h1 className="header">
                            <b>Meet</b> <span className="suuSriText">SuuSri</span>, <br/>
                            <b>Your AI Assistant</b>
                        </h1>
                        <button className="button-69" role="button" onClick={handleChatNowClick}>
                            <span className="text">
                                <i className="fas fa-comments"></i> 
                                <b> CHAT NOW</b></span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
        </>
    );
};

export default Main;
