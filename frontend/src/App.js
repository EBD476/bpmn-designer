import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import ConfigPage from './components/ConfigPage';
// import Terminal from './components/Terminal';
// import SSHTerminal from './components/SSHTerminal';
// import SplitLayout from './components/SplitLayout';
import BpmnDiagram from './components/BpmnDiagram';
import DiagramViewer from './components/DiagramViewer';
import BpmnDesignsGrid from './components/BpmnDesignsGrid';
import Bpmn from "./components/BpmnView";

import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('config'); // 'config' or 'terminal'
  const [sshConfig, setSshConfig] =  useState({
    host: '172.16.68.178',
    port: 22,
    username: 'hadoop',
    password: 'hadoop',
    privateKey: '',
    passphrase: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (config) => {
    setIsConnecting(true);
    setSshConfig(config);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setCurrentView('terminal');
    }, 1000);
  };

  const handleDisconnect = () => {
    setCurrentView('config');
    setSshConfig(null);
    setIsConnecting(false);
  };

  return (
    // <React.StrictMode>
    <Router>
    <div className="App">

        <Routes>
          <Route path="/" element={<BpmnDesignsGrid />} />
          <Route path="/designs" element={<BpmnDesignsGrid />} />
          <Route path="/viewer/:id" element={<Bpmn />} /> 
          <Route path="/designer/new" element={<BpmnDiagram />} />
          <Route path="/designer/:id" element={<BpmnDiagram />} />
          <Route path="/viewers/:id" element={<DiagramViewer />} />

        </Routes>

      {/* {currentView === 'config' ? (
        // <TerminalTest />
        // <SSHTerminal />
        <SplitLayout />

      //   <Terminal 
      //   sshConfig={sshConfig}
      //   onDisconnect={handleDisconnect}
      // />
        // <ConfigPage 
        //   onConnect={handleConnect}
        //   isConnecting={isConnecting}
        // />
      ) : (
        // <TerminalTest />
        <Terminal 
          sshConfig={sshConfig}
          onDisconnect={handleDisconnect}
        />
      )} */}
    </div>
  </Router>
  // </React.StrictMode>
  );
}

export default App;
