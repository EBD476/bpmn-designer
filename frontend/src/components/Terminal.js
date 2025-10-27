import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import './Terminal.css';

const Terminal = ({ sshConfig, onDisconnect }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [error, setError] = useState(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);

  // Initialize terminal
  // useEffect(() => {
  //   // Initialize terminal
  //   terminal.current = new XTerm({
  //     cursorBlink: true,
  //     theme: {
  //       background: '#1e1e1e',
  //       foreground: '#cccccc',
  //       cursor: '#ffffff',
  //       selection: '#3a3d41',
  //     },
  //     fontSize: 14,
  //     fontFamily: 'Consolas, "Courier New", monospace',
  //   });

  //   // Initialize addons
  //   fitAddon.current = new FitAddon();
  //   const webLinksAddon = new WebLinksAddon();

  //   // Load addons
  //   terminal.current.loadAddon(fitAddon.current);
  //   terminal.current.loadAddon(webLinksAddon);

  //   // Open terminal
  //   if (terminalRef.current) {
  //     terminal.current.open(terminalRef.current);
  //     fitAddon.current.fit();

  //     // Add welcome message and prompt
  //     // showWelcomeMessage();
  //     // showPrompt();
  //   }

  //   // Handle terminal input
  //   terminal.current.onData(handleInput);

  //   // Handle window resize
  //   const handleResize = () => {
  //     fitAddon.current.fit();
  //   };

  //   window.addEventListener('resize', handleResize);

  //   // Cleanup
  //   return () => {
  //     window.removeEventListener('resize', handleResize);
  //     terminal.current.dispose();
  //   };
  // }, []);
  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new XTerm({
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#4a9eff',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#4a9eff',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#5aa9ff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff'
      },
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, []);

  const showWelcomeMessage = () => {
    terminal.current.writeln('Welcome to React Terminal!');
    terminal.current.writeln('Type "help" to see available commands.');
    terminal.current.writeln('');
  };

  const showPrompt = () => {
    terminal.current.write('\r\n$ ');
  };

  const handleInput = (data) => {
    const code = data.charCodeAt(0);

    // Handle special keys
    if (code === 13) { // Enter key
      processCommand();
    } else if (code === 127) { // Backspace key
      // Handle backspace
      terminal.current.write('\b \b');
    } else if (code >= 32) { // Printable characters
      terminal.current.write(data);
    }
  };


  let currentLine = '';
  
  const processCommand = () => {
    const command = currentLine.trim().toLowerCase();
    currentLine = '';

    terminal.current.write('\r\n');

    switch (command) {
      case 'help':
        showHelp();
        break;
      case 'clear':
        terminal.current.clear();
        break;
    }
  };

  // Fit terminal after it's mounted
  useEffect(() => {
    // if (!terminalRef.current) return;

    if (fitAddonRef.current && terminalRef.current) {
      const fitTerminal = () => {
        try {
          fitAddonRef.current.fit();
        } catch (error) {
          console.warn('Failed to fit terminal:', error);
        }
      };

      // Fit immediately
      fitTerminal();

      // Fit after a short delay to ensure DOM is ready
      const timeoutId = setTimeout(fitTerminal, 100);

      // Handle window resize
      const handleResize = () => {
        fitTerminal();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [xtermRef.current]);

  // Connect to SSH after terminal is ready
  useEffect(() => {
    if (xtermRef.current) {
      connectToSSH();
    }
  }, [xtermRef.current]);

  const connectToSSH = async () => {
    try {
      setConnectionStatus('Connecting to SSH server...');
      setError(null);

      // Try to connect to the backend WebSocket server
      try {
        const ws = new WebSocket('ws://localhost:8081');
        
        ws.onopen = () => {
          setConnectionStatus('Connected to SSH server');
          setIsConnected(true);
          
          // Send SSH configuration
          ws.send(JSON.stringify({
            type: 'connect',
            config: sshConfig
          }));

          // Handle incoming data
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'data') {
              xtermRef.current.write(data.data);
            } else if (data.type === 'error') {
              setError(data.message);
              setIsConnected(false);
            }
          };

          // Handle terminal input
          xtermRef.current.onData((data) => {
            console.log('data', data);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'input',
                data: data
              }));
            }
          });
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Fall back to demo mode
          startDemoMode();
        };

        ws.onclose = () => {
          setIsConnected(false);
          setConnectionStatus('Disconnected');
        };

      } catch (wsError) {
        console.warn('WebSocket connection failed, starting demo mode:', wsError);
        startDemoMode();
      }

    } catch (err) {
      console.error('SSH connection error:', err);
      setError('Failed to establish SSH connection. Please check your configuration.');
      setConnectionStatus('Connection failed');
      setIsConnected(false);
    }
  };

  const startDemoMode = () => {
    setConnectionStatus('Demo Mode - No SSH connection');
    setIsConnected(true);
    setError('Backend server not available. Running in demo mode. Start the backend server for real SSH connections.');

    // Simulate a terminal session
    if (xtermRef.current) {
      xtermRef.current.write('Welcome to SSH Terminal Demo Mode!\r\n');
      xtermRef.current.write('This is a simulated terminal session.\r\n');
      xtermRef.current.write('To use real SSH connections, start the backend server.\r\n\r\n');
      xtermRef.current.write('$ ');

      let currentLine = '';
      xtermRef.current.onData((data) => {
        if (data === '\r') {
          // Handle Enter key
          xtermRef.current.write('\r\n');
          
          if (currentLine.trim() === 'help') {
            xtermRef.current.write('Available commands:\r\n');
            xtermRef.current.write('  help     - Show this help message\r\n');
            xtermRef.current.write('  clear    - Clear the terminal\r\n');
            xtermRef.current.write('  demo     - Show demo information\r\n');
            xtermRef.current.write('  exit     - Exit demo mode\r\n');
          } else if (currentLine.trim() === 'clear') {
            xtermRef.current.clear();
          } else if (currentLine.trim() === 'demo') {
            xtermRef.current.write('This is a demo terminal session.\r\n');
            xtermRef.current.write('In a real SSH connection, you would be connected to your server.\r\n');
            xtermRef.current.write('Start the backend server with: npm run backend\r\n');
          } else if (currentLine.trim() === 'exit') {
            xtermRef.current.write('Exiting demo mode...\r\n');
            handleDisconnect();
            return;
          } else if (currentLine.trim()) {
            xtermRef.current.write(`Command not found: ${currentLine.trim()}\r\n`);
          }
          
          currentLine = '';
          xtermRef.current.write('$ ');
        } else if (data === '\u007f') {
          // Handle Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            xtermRef.current.write('\b \b');
          }
        } else if (data >= ' ') {
          // Handle printable characters
          currentLine += data;
          xtermRef.current.write(data);
        }
      });
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    onDisconnect();
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-info">
          <span className="connection-status">
            Status: <span className={isConnected ? 'connected' : 'disconnected'}>
              {connectionStatus}
            </span>
          </span>
          <span className="ssh-info">
            {sshConfig.username}@{sshConfig.host}:{sshConfig.port}
          </span>
        </div>
        <button 
          className="disconnect-btn"
          onClick={handleDisconnect}
          title="Disconnect and return to configuration"
        >
          Disconnect
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="terminal-wrapper">
        <div ref={terminalRef} className="terminal"  style={{ width: "600px", height: "400px" }}/>
      </div>
      
      <div className="terminal-footer">
        <div className="terminal-help">
          <span>Tip: Use Ctrl+C to interrupt commands, Ctrl+D to logout</span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
