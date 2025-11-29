import React, { useState , useRef} from 'react';
import './DockableFooter.css';

const DockableFooter = ({
   isVisible: controlledVisible,
   bpmnHistory = [],
   onVisibilityChange,
   onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState("Problems");
  const [height, setHeight] = useState(250); 
  const isResizing = useRef(false);
  
  const [internalVisible, setInternalVisible] = useState(true);
  const isControlled = controlledVisible !== undefined;
  const visible = isControlled ? controlledVisible : internalVisible;

  const tabs = ["Problems", "Output", "Console"];

  const startResize = () => {    
    if (!visible) isResizing.current = true;    
  };

  const stopResize = () => {    
    isResizing.current = false;
  };

  const handleHide = () => {
    if (isControlled) {
      onVisibilityChange?.(false);
    } else {
      setInternalVisible(false);
    }
  };

  const handleShow = () => {
    if (isControlled) {
      onVisibilityChange?.(true);      
    } else {
      setInternalVisible(true);
    }
  };

  const handleResize = (e) => {
    if (!isResizing.current) return;
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight > 100 && newHeight < 800) setHeight(newHeight);
  };

 React.useEffect(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", stopResize);
    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, []);

 
    if (visible) {
    return (
      <div className="dock-show-button" onClick={handleShow}>
        ▲ Show Panel
      </div>
    );
  }

  return (
      <div className={`dock-panel ${isResizing.current ? "resizing" :""}`} style={{ height }}>
      <div className="dock-resizer" onMouseDown={startResize}></div>

      <div className="dock-tabs">
        {tabs.map(t => (
          <div
            key={t}
            className={`dock-tab ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </div>
        ))}
      </div>

         <div className={`dock-hide-btn`} onClick={handleHide}>
          ✖
        </div>

      <div className="dock-content">
        {activeTab === "Problems" && (
          <div>🔴 No problems detected.</div>
        )}

        {activeTab === "Output" && (
          <div>This is where your program output goes...</div>
        )}

        {activeTab === "Console" && (
          <>
          {/* <div>Console logs will appear here…</div> */}
             <div className="console-header">
              <span>BPMN Change History</span>
              <button 
                className="clear-history-btn"
                onClick={onClearHistory}
                disabled={bpmnHistory.length === 0}
              >
                Clear History
              </button>
            </div>
           <div className="history-list">
              {bpmnHistory.length === 0 ? (
                <div className="no-history">No changes recorded</div>
              ) : (
                bpmnHistory.map(entry => (
                  <div key={entry.id} className={`history-entry history-${entry.type}`}>
                     <span className="history-time">[{entry.timestamp}]</span> 
                     <span className="history-message">{entry.change.change}</span>
                  </div>
                )
              )
            )}
            </div>
          </>          
        )}
      </div>
    </div>

  );
};

export default DockableFooter;