import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Make sure you're using Routes instead of Switch in React Router v6
import Welcome from './components/Welcome'; 
import './App.css'; 
import Main from './components/Main';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Welcome />} /> {/* Home Page */}
          <Route path="/chat" element={<Main />} /> {/* Chat Page */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
