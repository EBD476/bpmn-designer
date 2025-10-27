// SplitLayout.jsx - Updated with Server Architecture
import React, { useState, useRef, useEffect, useCallback } from 'react';
import SSHTerminal from './SSHTerminal';
// import ServerSplunkArchitecture from './ServerSplunkArchitecture';
// import SplunkArchitecture from './SplunkArchitecture';
// import ArchitectureManager from './ArchitectureManager';
import BpmnDesignsGrid from './BpmnDesignsGrid';
// import BpmnDiagram from './BpmnDiagram';

import './SplitLayout.css';

const SplitLayout = () => {
  const [terminalHeight, setTerminalHeight] = useState(30); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const sshTerminalRef = useRef(null);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);
  const [currentArchitecture, setCurrentArchitecture] = useState('microservices');

  const handleArchitectureChange = useCallback((archId) => {
    console.log(`Switching to architecture: ${archId}`);
    setCurrentArchitecture(archId);
  }, []);

  const handleTerminalMinimizeToggle = useCallback(() => {
    console.log("handleTerminalMinimizeToggle")
    setIsTerminalMinimized(prev => !prev);
  }, []);
  
  const handleTerminalResize = useCallback(() => {
    if (terminalRef.current) {
      console.log('Terminal container resized');
    }
  }, []);

const handleScrollToBottom = () => {
    if (sshTerminalRef.current && sshTerminalRef.current.scrollToBottom) {
      sshTerminalRef.current.scrollToBottom();
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = ((containerRect.bottom - e.clientY) / containerRect.height) * 100;
    
    const clampedHeight = Math.max(20, Math.min(80, newHeight));
    setTerminalHeight(clampedHeight);
    handleTerminalResize();
  }, [isResizing, handleTerminalResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setTimeout(handleTerminalResize, 50);
  }, [handleTerminalResize]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const mainContentHeight = isTerminalMinimized ? 100 : (100 - terminalHeight);


  return (
    <div className="split-layout" ref={containerRef}>
      <div 
        className="main-content" 
        style={{ height: `${mainContentHeight}%` }}
      >

        <BpmnDesignsGrid/>
        {/* <BpmnDiagram/> */}
        {/* <ServerSplunkArchitecture /> */}
        {/* <ArchitectureManager /> */}
        {/* <SplunkArchitecture /> */}


        {/* <ArchitectureManager 
          currentArchitecture={currentArchitecture}
          onArchitectureChange={handleArchitectureChange}
        /> */}

        {/* <div className="logo-container">
            <div className="logo">
            <div className="logo-icon">🚀</div>
            <h1 className="logo-text">CloudDev Studio</h1>
            <p className="logo-subtitle">Web-Based SSH Terminal</p>
            </div>             
         </div> */}

      </div>

      <div 
        className={`resize-handle ${isResizing ? 'resizing' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="resize-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div 
        className={`terminal-section ${isTerminalMinimized ? 'minimized':'normal'}`}
        style={{ height: `${terminalHeight}%` }}
        ref={terminalRef}
      >
        <SSHTerminal ref={sshTerminalRef} 
                    onArchitectureChange={handleArchitectureChange} 
                    onToggleMinimize={handleTerminalMinimizeToggle}
                    isMinimized={isTerminalMinimized}/>
      </div>
    </div>
  );
};

export default SplitLayout;