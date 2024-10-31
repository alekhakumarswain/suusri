// src/components/magicui/marquee.jsx

import React from 'react';

const Marquee = ({ children, pauseOnHover, className, reverse }) => {
  return (
    <div className={`marquee ${className} ${reverse ? 'reverse' : ''}`} onMouseEnter={pauseOnHover ? () => {} : null} onMouseLeave={pauseOnHover ? () => {} : null}>
      {children}
    </div>
  );
};

export default Marquee;
