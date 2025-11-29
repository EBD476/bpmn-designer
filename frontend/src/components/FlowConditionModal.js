// FormEditorModal.jsx
import React, { useEffect, useState } from 'react';
import './FormEditorModal.css';

const defaultProperty = {
  id: '',
  name: '',
  type: 'string',
  datePattern: '',
};

export default function FlowConditionModal({ isOpen, onClose, onSave , initValue }) {
  const [formProperties, setFormProperties] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [expression, setExpression] = useState('');

  useEffect(() => {
    if (isOpen) {
        setFormProperties([]);  // Start empty
        setSelectedIndex(null);         
        setExpression(initValue === undefined ? '' : initValue)
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave(expression);
    onClose();
  };

  if (!isOpen) return null;

  const selectedProp = formProperties[selectedIndex] || {};

  return (
    <>
      <div className="modal-backdrop " onClick={onClose} />
      <div className="modal flow-condition">
      <div className="modal-header">
        <h2>Sequence flow condition</h2>
        </div>
         
          <div className="modal-content-props-form">

             <div className="expression-help">
                <h4>Expression Tips:</h4>
                <ul style={{ fontSize: '12px', color: '#666', margin: 0, paddingLeft: '20px' }}>
                  <li>Use <code>{'${variable}'}</code> syntax for expressions</li>
                  <li>Examples: <code>{'${approved}'}</code>, <code>{'${amount > 1000}'}</code></li>
                  <li>Supports comparison operators: ==, !=, &gt;, &lt;, &gt;=, &lt;=</li>
                  <li>Supports logical operators: &amp;&amp;, ||, !</li>
                </ul>
              </div>

            <form className="modal-body" onSubmit={handleSave}>
            <div className="form-group">
            <label htmlFor="model-description">Condition expression</label>
            <textarea
              id="model-expression"
              name="expression"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Enter condition expression, e.g., ${approved == true}"
              rows={7}
            />
          </div>          
          </form>
          
      
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="action-btn">Cancel</button>
          <button onClick={handleSave} className="action-btn primary">Save</button>
        </div>
      </div>
    </>
  );
}
