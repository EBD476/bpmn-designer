import React, { useRef, useState, useEffect } from 'react';
import './BpmnDiagram.css'

const Resizer = ({ element, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;

      // Call the onResize function to update element dimensions
      onResize(element, dx, dy);

      startPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Attach event listeners for mouse events
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      className="resizer-icon"
      style={{
        position: 'absolute',
        right: '-10px',
        bottom: '-10px',
        cursor: 'se-resize', // Resize cursor
      }}
      onMouseDown={handleMouseDown}
    >
      ↗
    </div>
  );
};

export default Resizer;
