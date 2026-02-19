import React, { useEffect } from 'react';
import './suusri.css'; 
import suusri from "../../Assets/img/suu4.png";

const Susri = () => {
  useEffect(() => {
    // Create floating particles
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      // Random properties
      const size = Math.random() * 15 + 21;
      const posX = Math.random() * window.innerWidth;
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * 5;
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}px`;
      particle.style.bottom = `-10px`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;
      
      if (particlesContainer) {
        particlesContainer.appendChild(particle);
      }
    }
    
    // Cleanup function
    return () => {
      if (particlesContainer) {
        particlesContainer.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="susri-container">
      <div className="particles-container" id="particles"></div>
      <div className="text-center">
        <img src={suusri} alt="Logo" className="logo-image" />
      </div>
    </div>
  );
};

export default Susri;