// Terminal.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './trm.css';
// import './SplitLayout.css';
// import SplunkArchitecture from './SplunkArchitecture';
// import AdvancedSplunkArchitecture from './AdvancedSplunkArchitecture';
// import ServerSplunkArchitecture from './ServerSplunkArchitecture';

const SSHTerminal =  ({ onArchitectureChange , onToggleMinimize, isMinimized })=> {
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
  const fitAddonRef = useRef(null);

  const [terminalMode, setTerminalMode] = useState('local'); // 'local' or 'ssh'  
  const terminalModeRef = useRef(terminalMode);
  const commandHistory = useRef([]);
  const historyIndex = useRef(-1);

  const [terminalHeight, setTerminalHeight] = useState(30); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // const [mode, setMode] = useState("local");

  // const toggleMode = () => {
  //   console.log("terminalMode ->" , terminalMode)
  //   setMode((prevMode) => (prevMode === "local" ? "remote" : "local"));
  // };


  // const alertMode = () => {
  //   alert(`Current mode: ${terminalMode}`);
  // };

  useEffect(() => {
    terminalModeRef.current = terminalMode;
  }, [terminalMode]);

  // SSH connection configuration
  const sshConfig = {
    host: '172.16.68.178', // Replace with your SSH server
    port: 22,
    username: 'hadoop',   // Replace with your username
    password: 'hadoop',   // Replace with your password
    // For key-based authentication:
    // privateKey: 'your-private-key-content'
  };

    // Local commands implementation
    const localCommands = {
      'help': {
        description: 'Show available commands',
        execute: () => {
          terminal.current.writeln('\r\nAvailable commands:');
          terminal.current.writeln('  help     - Show this help message');
          terminal.current.writeln('  clear    - Clear the terminal');
          terminal.current.writeln('  mode     - Show current terminal mode');
          terminal.current.writeln('  ssh      - Switch to SSH mode');
          terminal.current.writeln('  local    - Switch to local mode');
          terminal.current.writeln('  arch1    - Switch to Basic Splunk Architecture');
          terminal.current.writeln('  arch2    - Switch to Advanced Splunk Architecture');
          terminal.current.writeln('  arch3    - Switch to Server-Based Splunk Architecture');
          terminal.current.writeln('  arch4    - Switch to Microservices Architecture');
          terminal.current.writeln('  date     - Show current date and time');
          terminal.current.writeln('  pwd      - Print working directory');
          terminal.current.writeln('  ls       - List files');
          terminal.current.writeln('  whoami   - Show current user');
          terminal.current.writeln('');
        }
      },
      'clear': {
        description: 'Clear the terminal',
        execute: () => {
          terminal.current.clear();
        }
      },
      'mode': {
        description: 'Show current terminal mode',
        execute: () => {
          terminal.current.writeln(`\r\nCurrent mode: ${terminalMode.toUpperCase()}`);
          if (terminalMode === 'ssh') {
            terminal.current.writeln(`SSH Server: ${sshConfig.host}`);
            terminal.current.writeln(`Status: ${isConnected ? 'Connected' : 'Disconnected'}`);
          }
        }
      },
      'ssh': {
        description: 'Switch to SSH mode and connect',
        execute: () => {
          if (terminalMode === 'ssh') {
            terminal.current.writeln('\r\nAlready in SSH mode');
            return;
          }
          setTerminalMode('ssh');
          terminal.current.writeln('\r\nSwitching to SSH mode...');
          // Use setTimeout to ensure state update
          setTimeout(() => {
            connectSSH();
          }, 0);
        }
      },
      'local': {
        description: 'Switch to local mode',
        execute: () => {
          if (terminalMode === 'local') {
            terminal.current.writeln('\r\nAlready in local mode');
            return;
          }
          if (isConnected) {
            disconnectSSH();
          }
          setTerminalMode('local');
          terminal.current.writeln('\r\nSwitched to local mode');
          showPrompt();
        }
      },
      'arch1': {
        description: 'Switch to Basic Splunk Architecture',
        execute: () => {
          terminal.current.writeln('\r\n🔄 Switching to Basic Splunk Architecture...');
          onArchitectureChange('basic-splunk');
          terminal.current.writeln('✅ Architecture changed to Basic Splunk');
        }
      },
      'arch2': {
        description: 'Switch to Advanced Splunk Architecture',
        execute: () => {
          terminal.current.writeln('\r\n🔄 Switching to Advanced Splunk Architecture...');
          onArchitectureChange('advanced-splunk');
          terminal.current.writeln('✅ Architecture changed to Advanced Splunk');
        }
      },
      'arch3': {
        description: 'Switch to Server-Based Splunk Architecture',
        execute: () => {
          terminal.current.writeln('\r\n🔄 Switching to Server-Based Splunk Architecture...');
          onArchitectureChange('server-based');
          terminal.current.writeln('✅ Architecture changed to Server-Based Splunk');
        }
      },
      'arch4': {
        description: 'Switch to Microservices Architecture',
        execute: () => {
          terminal.current.writeln('\r\n🔄 Switching to Microservices Architecture...');
          onArchitectureChange('microservices');
          terminal.current.writeln('✅ Architecture changed to Microservices');
        }
      },
      'arch5': {
        description: 'Switch to BPMN Diagram Editor',
        execute: () => {
          terminal.current.writeln('\r\n🔄 Switching to BPMN Diagram Editor...');
          onArchitectureChange('bpmn');
          terminal.current.writeln('✅ Architecture changed to BPMN Diagram Editor');
        }
       },
       'date': {
        description: 'Show current date and time',
        execute: () => {
          terminal.current.writeln(`\r\n📅 ${new Date().toString()}`);
        }
      },
      'pwd': {
        description: 'Print working directory',
        execute: () => {
          terminal.current.writeln('\r\n📁 /home/terminal-user/web-terminal');
        }
      },
      'ls': {
        description: 'List files',
        execute: () => {
          terminal.current.writeln('\r\ndrwxr-xr-x 2 user user 4096 Jan 10 10:00 documents/');
          terminal.current.writeln('drwxr-xr-x 3 user user 4096 Jan 10 10:00 projects/');
          terminal.current.writeln('-rw-r--r-- 1 user user  123 Jan 10 09:30 README.md');
          terminal.current.writeln('-rwxr-xr-x 1 user user  456 Jan 10 09:25 script.sh');
        }
      },
      'whoami': {
        description: 'Show current user',
        execute: () => {
          terminal.current.writeln('\r\n👤 terminal-user');
        }
      }
    };

  // useImperativeHandle(ref, () => ({    
  //       scrollToBottom,
  //   }));

   // Scroll terminal to bottom
   const scrollToBottom = useCallback(() => {
    console.log('scrollToBottom')
    if (terminal.current && terminal.current.textarea) {
      // Use xterm's built-in scroll to bottom functionality
      terminal.current.scrollToBottom();
      
      // Alternative method: Focus the terminal to ensure cursor is visible
      setTimeout(() => {
        terminal.current.focus();
      }, 10);
    }
  }, []);

  useEffect(() => {
    initializeTerminal();
    
    return () => {
      disconnectSSH();
      if (terminal.current) {
        // window.removeEventListener('resize', handleResize);
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
    fitAddonRef.current = fitAddon;

    if (terminalRef.current) {
      terminal.current.open(terminalRef.current);
      fitAddon.current.fit();
    }

    // Handler to fit terminal on window resize
    const handleResize = () => {
      console.log("handle reszie")
      if (terminalRef.current) {
        fitAddon.current.fit();
      }
    };

    // Add resize event listener
    window.addEventListener('resize', handleResize);
    // Show connection instructions
    showWelcomeMessage();
    setupTerminalHandlers();
  };


  const setupTerminalHandlers = () => {
    
    // Handle all terminal input
     terminal.current.onData((data) => {
     console.log(`Current terminal mode: ${terminalModeRef.current}`);

      if ( terminalModeRef.current === 'ssh'){
        return
      }
            
      const charCode = data.charCodeAt(0);
      
      // Handle Enter key
      if (charCode === 13 || charCode === 10) {
        if (terminalModeRef.current === 'local') {
          processLocalCommand();
        } else {
          // In SSH mode, let handleTerminalData handle it
          handleTerminalData(data);
        }
      }
      // Handle Backspace
      else if (charCode === 127 || charCode === 8) {
        if (currentLine.current.length > 0) {
          currentLine.current = currentLine.current.slice(0, -1);
        }
        // Visual backspace is handled by xterm
      }
      // Handle Tab key for auto-completion
      else if (charCode === 9) {
        if (terminalMode === 'local') {
          handleTabCompletion();
        } else {
          handleTerminalData(data);
        }
      }
      // Handle Up/Down arrows for command history
      else if (charCode === 27) {
        // Escape sequence for arrow keys
        // This is a simplified implementation
      }
      // Handle printable characters
      else if (charCode >= 32 && charCode <= 126) {
        if (terminalMode === 'local') {
          terminal.current.write(data);
          currentLine.current += data;          

        } else {
          handleTerminalData(data);
        }
      }
      // Handle control characters
      else if (charCode < 32) {
        if (terminalMode === 'ssh') {
          handleTerminalData(data);
        }
      }
    });
  };

  const handleTabCompletion = () => {
    const input = currentLine.current.trim();
    if (!input) return;

    const matches = Object.keys(localCommands).filter(cmd => 
      cmd.startsWith(input)
    );

    if (matches.length === 1) {
      // Auto-complete the command
      currentLine.current = matches[0] + ' ';
      terminal.current.write('\r' + getPrompt() + currentLine.current);
    } else if (matches.length > 1) {
      // Show possible completions
      terminal.current.write('\r\n');
      matches.forEach(match => {
        terminal.current.writeln(`  ${match} - ${localCommands[match].description}`);
      });
      terminal.current.write(getPrompt() + currentLine.current);
    }
  };

  const getPrompt = () => {
    console.log(terminalModeRef.current )
    const modeColor = terminalModeRef.current === 'ssh' ? '#4CAF50' : '#3B82F6';
    const modeText = terminalModeRef.current  === 'ssh' ? 'SSH' : 'LOCAL';
    return `\r\n\x1b[1;32m${sshConfig.username}@web-terminal\x1b[0m:\x1b[1;34m~\x1b[0m [\x1b[1;${terminalModeRef.current  === 'ssh' ? '32' : '36'}m${modeText}\x1b[0m] $ `;
  };

  const showPrompt = () => {
    terminal.current.write(getPrompt());
    setTimeout(scrollToBottom, 10);
  };

  const showWelcomeMessage = (force = false) => {
    if (force || !isConnected) {
      terminal.current.writeln('🚀 Welcome to Web Terminal');
      terminal.current.writeln('==========================');
      terminal.current.writeln(`Mode: ${terminalMode.toUpperCase()}`);
      terminal.current.writeln('');
      terminal.current.writeln('💡 Available modes:');
      terminal.current.writeln('   - LOCAL: Execute local commands (arch1, arch2, etc.)');
      terminal.current.writeln('   - SSH: Connect to remote server');
      terminal.current.writeln('');
      terminal.current.writeln('🔧 Type "help" for available commands');
      terminal.current.writeln('🌐 Type "ssh" to connect to remote server');
      terminal.current.writeln('');

      showPrompt();
      // terminal.current.writeln('Welcome to SSH Terminal');
      // terminal.current.writeln('=======================');
      // terminal.current.writeln(`Server: ${sshConfig.host}:${sshConfig.port}`);
      // terminal.current.writeln(`Username: ${sshConfig.username}`);
      // terminal.current.writeln('');
      // terminal.current.writeln('Click "Connect" to establish SSH connection');
      // terminal.current.writeln('');
    }
  };

  // Handle terminal input
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
    const handleTerminalData = useCallback((data) => {

        // if (!socket.current || socket.current.readyState !== WebSocket.OPEN || hasShownReconnect.current ) {
        //   return;
        // }            
        if (terminalModeRef.current === 'local'){
          return;
        }        
        const charCode = data.charCodeAt(0);
        // Handle Enter key (13 = Enter, 10 = Line Feed)
        if (charCode === 13 || charCode === 10) {

          if (terminalModeRef.current === 'local') {
            processLocalCommand();
          } else {

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

    }, [terminalMode,isConnected]);


    const processLocalCommand = () => {

      const command = currentLine.current.trim().toLowerCase();
      const originalCommand = currentLine.current.trim();
      
      // Add to command history
      if (command && !commandHistory.current.includes(originalCommand)) {
        commandHistory.current.push(originalCommand);
        if (commandHistory.current.length > 50) {
          commandHistory.current.shift();
        }
      }
      historyIndex.current = -1;
      // terminal.current.write('\r\n');
      
      if (command === '') {      
        showPrompt();
        return;
      }
  
      // Execute local command
      if (localCommands[command]) {
        localCommands[command].execute();
      } else {
        terminal.current.writeln('');
        terminal.current.writeln(`❌ Command not found: ${command}`);
        terminal.current.writeln('💡 Type "help" for available commands');
      }
  
      currentLine.current = '';
      scrollToBottom();
      showPrompt();
    };

  // Handle data from SSH server to terminal
  const handleSSHData = useCallback((data) => {
      
    if (terminal.current &&  data.trim()!== lastCommand.current.trim()) {              
        terminal.current.write(data);                          
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
        terminal.current.write('\r\x1b[K');
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
                setTerminalMode('local');
                showReconnectPrompt();
              }
              break;
            
            case 'disconnected':
              setIsConnected(false);
              if (!hasShownReconnect.current) {
                terminal.current.writeln('\r\n🔌 SSH connection closed');
                hasShownReconnect.current = true;
                setTerminalMode('local');
                terminalModeRef.current = 'local'
                showReconnectPrompt();
                showPrompt();
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
          setTerminalMode('local');
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
        console.log("resize")
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
      setTerminalMode('local');
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

    terminalModeRef.current = 'local'
    showWelcomeMessage(true);
  };

  const showReconnectPrompt = () => {
    // terminal.current.writeln('');
    terminal.current.writeln('🔄 Click "Connect" to reconnect');
    // terminal.current.writeln('');
  };

  // const handleReconnect = () => {
  //   terminal.current.clear();
  //   connectSSH();
  // };

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


    const handleMouseDown = (e) => {
      e.preventDefault();
      setIsResizing(true);
    };
  
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
  
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = ((containerRect.bottom - e.clientY) / containerRect.height) * 100;
      
      // Limit between 20% and 80%
      const clampedHeight = Math.max(20, Math.min(80, newHeight));
      setTerminalHeight(clampedHeight);
    };
  
    const handleMouseUp = () => {
      setIsResizing(false);
      console.log("handleMouseUp")
      if (terminalRef.current) {
        fitAddon.current.fit();        
        setTimeout(scrollToBottom, 50);
      }

    };

    useEffect(() => {
      console.log('Terminal mode changed to:', terminalMode);
    }, [terminalMode]);
  
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
    }, [isResizing]);

  const mainContentHeight = 100 - terminalHeight;

  const handleMinimizeToggle = () => {
    if (onToggleMinimize) {
      onToggleMinimize();
    }
  };



  
   return (

    <div className={`terminal-container ${isMinimized ? 'minimized':''}`}>
      <div className="terminal-header">
        <div className="terminal-title">
            EBD Terminal - {sshConfig.host}
            <span className={`mode-indicator ${terminalMode} ${isMinimized ? 'minimized':''}`}>
            ● {terminalMode.toUpperCase()}         
          </span>
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            ● {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
        {isMinimized && (
        <div className="terminal-controls">
           <button 
              className="control-btn maximize-btn"
              onClick={handleMinimizeToggle}
              title="Maximize Terminal"
            >
              ⬆️ Maximize
            </button>
            </div>
        )}
        {!isMinimized && (
        <div className="terminal-controls">
          {terminalMode === 'local' && (
            <button 
              className="control-btn ssh-btn"
              onClick={() => {
                setTerminalMode('ssh');                 
                 setTimeout(() => {
                  connectSSH();
                }, 0);
                // connectSSH();
              }}
            >
              🔗 SSH Mode
            </button>
          )}
          {terminalMode === 'ssh' && isConnected && (
            <button 
              className="control-btn local-btn"
              onClick={() => {
                terminal.current.writeln('\r\n🔄 Switched to local mode');
                disconnectSSH();
                setTerminalMode('local');                
              }}
            >
              💻 Local Mode
            </button>            
          )}

          {terminalMode === 'ssh' && isConnected && (

          <button 
          className="control-btn disconnect-btn"
          onClick={()=>{
            disconnectSSH();
            setTerminalMode('local');
          }}
          >
          Disconnect
          </button>

          )}
          
          {terminalMode === 'ssh' && isConnecting && (
            <button className="control-btn connecting-btn" disabled>
              ⏳ Connecting...
            </button>
          )}
          <button 
            className="control-btn"
            onClick={() => {
              if (terminal.current) {
                terminal.current.clear();
                if (terminalMode === 'local') {
                  showWelcomeMessage();
                }
              }
            }}
          >
            🧹 Clear
          </button>

          <button 
            className="control-btn minimize-btn"
            onClick={handleMinimizeToggle}
            title="Minimize Terminal"
          >
            ⬇️ Minimize
          </button>

        </div>
         )}

        {/* <div className="terminal-controls">
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
        </div> */}
      </div>

      {connectionError && (
        <div className="error-banner">
          Connection Error: {connectionError}
        </div>
      )}

        <div ref={terminalRef} className="terminal" />

        {/* <div className="terminal-hint">
             Mode: <strong>{terminalMode.toUpperCase()}</strong> | 
            {terminalMode === 'local' ? ' Type "help" for commands' : ' Type "local" to switch back'}
            {terminalMode === 'local' && ' | Try: arch1, arch2, arch3, arch4'}
          </div> */}

  
    </div>

    
  );
};


export default SSHTerminal;