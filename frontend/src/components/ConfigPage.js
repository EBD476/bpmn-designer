import React, { useState } from 'react';
import './ConfigPage.css';

const ConfigPage = ({ onConnect, isConnecting }) => {
  const [config, setConfig] = useState({
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKey: '',
    passphrase: ''
  });

  const [useKeyAuth, setUseKeyAuth] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!config.host || !config.username || (!config.password && !config.privateKey)) {
      alert('Please fill in all required fields');
      return;
    }
    onConnect(config);
  };

  return (
    <div className="config-page">
      <div className="config-container">
        <h1>SSH Terminal Configuration</h1>
        <form onSubmit={handleSubmit} className="config-form">
          <div className="form-group">
            <label htmlFor="host">Host *</label>
            <input
              type="text"
              id="host"
              name="host"
              value={config.host}
              onChange={handleInputChange}
              placeholder="e.g., 192.168.1.100 or example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="port">Port</label>
            <input
              type="number"
              id="port"
              name="port"
              value={config.port}
              onChange={handleInputChange}
              min="1"
              max="65535"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={config.username}
              onChange={handleInputChange}
              placeholder="e.g., root, admin, user"
              required
            />
          </div>

          <div className="auth-method">
            <label>
              <input
                type="radio"
                checked={!useKeyAuth}
                onChange={() => setUseKeyAuth(false)}
              />
              Password Authentication
            </label>
            <label>
              <input
                type="radio"
                checked={useKeyAuth}
                onChange={() => setUseKeyAuth(true)}
              />
              Private Key Authentication
            </label>
          </div>

          {!useKeyAuth ? (
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={config.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required={!useKeyAuth}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="privateKey">Private Key *</label>
                <textarea
                  id="privateKey"
                  name="privateKey"
                  value={config.privateKey}
                  onChange={handleInputChange}
                  placeholder="Paste your private key here (-----BEGIN OPENSSH PRIVATE KEY-----...)"
                  rows="8"
                  required={useKeyAuth}
                />
              </div>
              <div className="form-group">
                <label htmlFor="passphrase">Passphrase (optional)</label>
                <input
                  type="password"
                  id="passphrase"
                  name="passphrase"
                  value={config.passphrase}
                  onChange={handleInputChange}
                  placeholder="Enter passphrase if your key is encrypted"
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="connect-btn"
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect to SSH'}
          </button>
        </form>

        <div className="config-info">
          <h3>Connection Information</h3>
          <p>This app will establish an SSH connection to your server and provide a terminal interface.</p>
          <ul>
            <li>Make sure your SSH server is running and accessible</li>
            <li>For private key authentication, paste your complete private key</li>
            <li>The connection will be established securely using SSH2 protocol</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;
