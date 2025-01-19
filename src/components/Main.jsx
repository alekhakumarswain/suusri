import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap is included
import './Main.css'; // Custom styles
import icon from '../Assets/img/suu2.png'; // Adjust image path
import icon1 from '../Assets/img/suu1.png'; // Adjust image path
import icon2 from '../Assets/img/suu3.png'; // Adjust image path
import '@fortawesome/fontawesome-free/css/all.min.css'; // FontAwesome CSS

import { useNavigate } from 'react-router-dom';

const Main = () => {

  const navigate = useNavigate();

  const handleChatNowClick = () => {
    navigate('/chat');
  };

  return (
    <>
      <section className="main">
        <div className="container custom-container">
          <div className="row align-items-center">
            {/* First Section */}
            <div className="col-md-6 order-2 order-md-1">
              <img src={icon} alt="SuuSri AI Assistant" className="img-fluid custom-image" />
            </div>

            {/* Content Column */}
            <div className="col-md-6 order-1 order-md-2">
              <h1 className="header">
                <b>Meet</b> <span className="suuSriText">SuuSri</span>, <br />
                <b>Your AI Assistant</b>
              </h1>
              <p className="content-text">SuuSri is stands for Smart Universal User Support & Resource Integration</p>
              <button className="button-69" role="button" onClick={handleChatNowClick}>
                <span className="text">
                  <i className="fas fa-comments"></i>
                  <b>CHAT NOW</b></span>
              </button>
            </div>
          </div>
        </div>

        {/* Second Section */}
        <div className="container custom-container">
          <div className="row align-items-center">
            {/* Content Column */}
            <div className="col-md-6 order-1 order-md-1">
              <h1 className="header">
                <b>Meet</b> <span className="suuSriText">SuuSri</span>, <br />
                <b>Your AI Assistant</b>
              </h1>
              <p className="content-text">SuuSri is your personalized AI assistant, designed to provide support, answer queries, and enhance your digital experience.</p>
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

        {/* Third Section */}
        <div className="container custom-container">
          <div className="row align-items-center">
            {/* Content Column */}
            <div className="col-md-6 order-2 order-md-1">
              <img src={icon2} alt="SuuSri AI Assistant" className="img-fluid custom-image" />
            </div>

            {/* Text Column */}
            <div className="col-md-6 order-1 order-md-2">
              <h1 className="header">
                <b>Discover</b> <span className="suuSriText">SuuSri</span>, <br />
                <b>Your Intelligent Assistant</b>
              </h1>
              <p className="content-text">With cutting-edge machine learning and intuitive processing, SuuSri helps you with smart suggestions and smart conversations!.</p>
              <button className="button-69" role="button" onClick={handleChatNowClick}>
                <span className="text">
                  <i className="fas fa-comments"></i>
                  <b>CHAT NOW</b></span>
              </button>
            </div>
          </div>
        </div>

        {/* Additional Section: Benefits of SuuSri */}
        <div className="container custom-container">
          <h2 className="header">Why Choose SuuSri?</h2>
          <div className="row">
            <div className="col-md-4">
              <div className="feature-box">
                <h3>Fast Responses</h3>
                <p>Get immediate answers to your queries with fast and efficient AI processing.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-box">
                <h3>Smart Conversations</h3>
                <p>SuuSri keeps the conversation engaging, helping you with relevant and meaningful interactions.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-box">
                <h3>Personalized Assistance</h3>
                <p>Tailored to your needs, SuuSri understands your preferences and provides personalized suggestions.</p>
              </div>
            </div>
          </div>
        </div>

      </section>
    </>
  );
};

export default Main;
