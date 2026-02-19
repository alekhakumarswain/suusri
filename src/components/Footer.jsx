import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">© 2024 SuuSri. All rights reserved.</p>
        
        <div className="footer-about">
          <p>I'm SuuSri, your friendly AI Assistant 🤖✨, created by Alekh Kumar Swain.</p>
          <p>Designed to assist, entertain, and enhance your experience in a fun and efficient way. 😎</p>
          <p>Built with love, code, and a dash of coffee by Alekh! ☕</p>
        </div>

        <div className="footer-social">
          <a href="https://twitter.com/Alekh5258Swain" className="footer-social-icon" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-twitter"></i> Twitter
          </a>
          <a href="https://facebook.com/swainraja.kumarAlekh" className="footer-social-icon" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-facebook"></i> Facebook
          </a>
          <a href="https://github.com/Alekhkumarswain" className="footer-social-icon" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github"></i> GitHub
          </a>
          <a href="https://www.linkedin.com/in/Alekhkumarswain/" className="footer-social-icon" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-linkedin"></i> LinkedIn
          </a>
        </div>

        <p className="footer-smiley">Enjoy using SuuSri, the AI that's more than just code. 😄💻</p>
      </div>
    </footer>
  );
};

export default Footer;
