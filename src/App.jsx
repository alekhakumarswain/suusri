import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/Main';
import Chat from './components/Main/Chat';
import Welcome from './components/Welcome';
import SuuSri from './components/Main/suusri';
import Talk from './components/Talk/Talk';

import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/main" element={<Main />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/talk" element={<Talk />} />
          <Route path='/suusri' element={<SuuSri />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
