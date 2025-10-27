// Terminal.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './trm.css';

const SSHTerminal = () => {
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const socket = useRef(null);
  const onDataDisposable = useRef(null);
  const onResizeDisposable = useRef(null);
  const hasShownReconnect = useRef(false);
  const manualDisconnectRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const currentLine = useRef(''); // Buffer for current command line
  const lastCommand = useRef('');

  // SSH connection configuration
  const sshConfig = {
    host: '172.16.68.178', // Replace with your SSH server
    port: 22,
    username: 'hadoop',   // Replace with your username
    password: 'hadoop',   // Replace with your password
    // For key-based authentication:
    // privateKey: 'your-private-key-content'
  };

  useEffect(() => {
    initializeTerminal();
    
    return () => {
      disconnectSSH();
      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, []);

  const initializeTerminal = () => {
    terminal.current = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#ffffff',
        selection: '#3a3d41',
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
    });

    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);

    if (terminalRef.current) {
      terminal.current.open(terminalRef.current);
      fitAddon.current.fit();
    }

    // Show connection instructions
    showWelcomeMessage();
  };

      // Handle terminal input
      // terminal.current.onData(handleInput);

  // const showWelcomeMessage = () => {
  //   if (!isConnected) {
  //     terminal.current.writeln('SSH Terminal - Ready to connect');
  //     terminal.current.writeln(`Server: ${sshConfig.host}:${sshConfig.port}`);
  //     terminal.current.writeln(`Username: ${sshConfig.username}`);
  //     terminal.current.writeln('');
  //     terminal.current.writeln('Click "Connect" to establish SSH connection');
  //     terminal.current.writeln('');
  //   }
  // };

  const showWelcomeMessage = (force = false) => {
    if (force || !isConnected) {
      terminal.current.writeln('Welcome to SSH Terminal');
      terminal.current.writeln('=======================');
      terminal.current.writeln(`Server: ${sshConfig.host}:${sshConfig.port}`);
      terminal.current.writeln(`Username: ${sshConfig.username}`);
      terminal.current.writeln('');
      terminal.current.writeln('Click "Connect" to establish SSH connection');
      terminal.current.writeln('');
    }
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

  // Handle data from terminal to SSH server
  // const handleTerminalData = useCallback((data) => {
  //   if (socket.current && socket.current.readyState === WebSocket.OPEN && isConnected) {
  //     // Send terminal input to SSH server via WebSocket
  //     socket.current.send(JSON.stringify({
  //       type: 'input',
  //       data: data
  //     }));
  //   }
  // }, [isConnected]);


    // Handle data from terminal to SSH server
    const handleTerminalData = useCallback((data) => {

      // console.log(hasShownReconnect.current)
        if (!socket.current || socket.current.readyState !== WebSocket.OPEN || hasShownReconnect.current ) {
          return;
        }            
      
        const charCode = data.charCodeAt(0);
        // Handle Enter key (13 = Enter, 10 = Line Feed)
        if (charCode === 13 || charCode === 10) {
          console.log('Sending command to SSH:', currentLine.current);          
          // Send the complete command + newline to SSH server
          socket.current.send(JSON.stringify({
            type: 'input',
            data: currentLine.current + '\n'
          }));
          lastCommand.current = currentLine.current;          
          // Clear the current line buffer
          currentLine.current = '';
        } 
        // Handle Backspace (127 = Backspace, 8 = Ctrl+H)              
        else if (charCode === 127 || charCode === 8) {          
          if (currentLine.current.length > 0) {
            currentLine.current = currentLine.current.slice(0, -1);
            terminal.current.write('\b \b');
          }        
        }
        // Handle printable characters (32-126 are printable ASCII)
        else if (charCode >= 32 && charCode <= 126) {          
          currentLine.current += data;
          terminal.current.write(data);
        }
        // Handle special control characters (Ctrl+C, etc.)
        else if (charCode < 32) {          
          console.log('Control character:', charCode);          
          // Send control characters immediately
          socket.current.send(JSON.stringify({
            type: 'input',
            data: data
          }));
        }
        // terminal.current.write(data);
        // socket.current.send(JSON.stringify({
        //   type: 'input',
        //   data: data
        // }));
      // }
    }, [isConnected]);

  // Handle data from SSH server to terminal
  const handleSSHData = useCallback((data) => {
      
    if (terminal.current &&  data.trim()!== lastCommand.current.trim()) {              
        terminal.current.write(data);              
        console.log("data", data)      
    } else {            
      terminal.current.writeln('');
    }
  }, []);

  const connectSSH = async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setConnectionError('');
    hasShownReconnect.current = false;
    manualDisconnectRef.current = false;

    try {
      // Create WebSocket connection to your backend SSH proxy
      const wsUrl = `ws://localhost:8083/ssh`; // Your backend WebSocket endpoint
      socket.current = new WebSocket(wsUrl);

      socket.current.onopen = () => {
        terminal.current.clear();
        terminal.current.writeln('Connecting to SSH server...');
        hasShownReconnect.current = false;
        manualDisconnectRef.current = false;
        
        // Send SSH connection parameters
        socket.current.send(JSON.stringify({
          type: 'connect',
          config: sshConfig
        }));

        // Set up terminal to send data to SSH server
        if (onDataDisposable.current) {
          onDataDisposable.current.dispose();
          onDataDisposable.current = null;
        }
        onDataDisposable.current = terminal.current.onData(handleTerminalData);

          // Focus the terminal for immediate typing
          setTimeout(() => {
            terminal.current.focus();
          }, 100);

      };

      socket.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              setIsConnecting(false);
              setIsConnected(true);
              terminal.current.writeln('SSH connection established!');
              terminal.current.writeln('');

              setTimeout(() => terminal.current.focus(), 100);
              break;
            
            case 'output':              
              console.log('Received data from SSH:', data.data);
              // Write data from SSH server to terminal
              handleSSHData(data.data);
              break;
            
            case 'error':
              setIsConnecting(false);
              setConnectionError(data.message);
              terminal.current.writeln(`\r\n❌ SSH Error: ${data.message}`);
              terminal.current.writeln('Please check your credentials and try again.');
              if (!hasShownReconnect.current) {
                hasShownReconnect.current = true;
                showReconnectPrompt();
              }
              break;
            
            case 'disconnected':
              setIsConnected(false);
              if (!hasShownReconnect.current) {
                terminal.current.writeln('\r\n🔌 SSH connection closed');
                hasShownReconnect.current = true;
                showReconnectPrompt();
              }
              break;
            
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.current.onerror = (error) => {
        setIsConnecting(false);
        setConnectionError('WebSocket connection failed');
        terminal.current.writeln('\r\nConnection error: Failed to connect to SSH proxy');
        if (!hasShownReconnect.current) {
          hasShownReconnect.current = true;
          showReconnectPrompt();
        }
      };

      socket.current.onclose = () => {
        if (manualDisconnectRef.current) {
          manualDisconnectRef.current = false;
          return;
        }
        if (isConnected) {
          setIsConnected(false);
          terminal.current.writeln('\r\nSSH connection closed');
          if (!hasShownReconnect.current) {
            hasShownReconnect.current = true;
            showReconnectPrompt();
          }
        }
      };

      // Handle terminal resize
      if (onResizeDisposable.current) {
        onResizeDisposable.current.dispose();
        onResizeDisposable.current = null;
      }
      onResizeDisposable.current = terminal.current.onResize(({ cols, rows }) => {
        if (socket.current && socket.current.readyState === WebSocket.OPEN) {
          socket.current.send(JSON.stringify({
            type: 'resize',
            cols: cols,
            rows: rows
          }));
        }
      });

    } catch (error) {
      setIsConnecting(false);
      setConnectionError(error.message);
      terminal.current.writeln(`\r\nConnection error: ${error.message}`);
      showReconnectPrompt();
    }
  };

  
  const disconnectSSH = () => {
    manualDisconnectRef.current = true;
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
    if (onDataDisposable.current) {
      onDataDisposable.current.dispose();
      onDataDisposable.current = null;
    }
    if (onResizeDisposable.current) {
      onResizeDisposable.current.dispose();
      onResizeDisposable.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);

    // Clear and show welcome message again
    terminal.current.write('\r\x1b[K');
    terminal.current.clear();    
    showWelcomeMessage(true);
  };

  const showReconnectPrompt = () => {
    // terminal.current.writeln('');
    terminal.current.writeln('🔄 Click "Connect" to reconnect');
    // terminal.current.writeln('');
  };

  const handleReconnect = () => {
    terminal.current.clear();
    connectSSH();
  };

    // Add click to focus functionality
    useEffect(() => {
      const handleTerminalClick = () => {
        if (terminal.current) {
          terminal.current.focus();
        }
      };
  
      const terminalElement = terminalRef.current;
      if (terminalElement) {
        terminalElement.addEventListener('click', handleTerminalClick);
        return () => {
          terminalElement.removeEventListener('click', handleTerminalClick);
        };
      }
    }, []);

  // Handle special keys
  // useEffect(() => {
  //   if (terminal.current) {
  //     // Handle special keys like Ctrl+C, Ctrl+D, etc.
  //     const disposable = terminal.current.onKey(({ key, domEvent }) => {
  //       if (domEvent.ctrlKey) {
  //         switch (key) {
  //           case 'c':
  //             // Send Ctrl+C to SSH server
  //             handleTerminalData('\x03');
  //             break;
  //           case 'd':
  //             // Send Ctrl+D to SSH server
  //             handleTerminalData('\x04');
  //             break;
  //           case 'l':
  //             // Send Ctrl+L to SSH server (clear screen)
  //             handleTerminalData('\x0c');
  //             break;
  //           case 'u':
  //             // Send Ctrl+U to SSH server (clear line)
  //             handleTerminalData('\x15');
  //             break;
  //         }
  //       }
  //     });

  //     return () => disposable.dispose();
  //   }
  // }, [handleTerminalData, isConnected]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">
          SSH Terminal - {sshConfig.host}
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            ● {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
        <div className="terminal-controls">
          {!isConnected && !isConnecting && (
            <button 
              className="control-btn connect-btn"
              onClick={connectSSH}
            >
              Connect
            </button>
          )}
          {isConnecting && (
            <button className="control-btn connecting-btn" disabled>
              Connecting...
            </button>
          )}
          {isConnected && (
            <button 
              className="control-btn disconnect-btn"
              onClick={disconnectSSH}
            >
              Disconnect
            </button>
          )}
          <button 
            className="control-btn"
            onClick={() => terminal.current && terminal.current.clear()}
          >
            Clear
          </button>
        </div>
      </div>

      {connectionError && (
        <div className="error-banner">
          Connection Error: {connectionError}
        </div>
      )}

      <div ref={terminalRef} className="terminal" />
    </div>
  );
};

export default SSHTerminal;