// FormEditorModal.jsx
import React, { useEffect, useState } from 'react';
import './FormEditorModal.css';

const defaultProperty = {
  id: '',
  name: '',
  type: 'string',
  datePattern: '',
};

export default function FormEditorModal({ isOpen, onClose, onSave }) {
  const [formProperties, setFormProperties] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
    //   setFormProperties([{ ...defaultProperty }]);
    //   setSelectedIndex(0);
        setFormProperties([]);  // Start empty
        setSelectedIndex(null); 
    }
  }, [isOpen]);

  const selectProperty = (index) => setSelectedIndex(index);

  const updateProperty = (key, value) => {
    if (selectedIndex === null) return;
    const updated = [...formProperties];
    updated[selectedIndex][key] = value;
    setFormProperties(updated);
  };

  const addProperty = () => {
    const newId = `new_property_${formProperties.length + 1}`;
    setFormProperties([...formProperties, { ...defaultProperty, id: newId }]);
    setSelectedIndex(formProperties.length);
  };

  const removeProperty = () => {
    if (selectedIndex === null) return;
    const updated = [...formProperties];
    updated.splice(selectedIndex, 1);
    setFormProperties(updated);
    setSelectedIndex(updated.length > 0 ? 0 : null);
  };

  const moveUp = () => {
    if (selectedIndex <= 0) return;
    const updated = [...formProperties];
    [updated[selectedIndex - 1], updated[selectedIndex]] = [
      updated[selectedIndex],
      updated[selectedIndex - 1],
    ];
    setFormProperties(updated);
    setSelectedIndex(selectedIndex - 1);
  };

  const moveDown = () => {
    if (selectedIndex === null || selectedIndex >= formProperties.length - 1) return;
    const updated = [...formProperties];
    [updated[selectedIndex], updated[selectedIndex + 1]] = [
      updated[selectedIndex + 1],
      updated[selectedIndex],
    ];
    setFormProperties(updated);
    setSelectedIndex(selectedIndex + 1);
  };

  const handleSave = () => {
    onSave(formProperties);
    onClose();
  };

  if (!isOpen) return null;

  const selectedProp = formProperties[selectedIndex] || {};

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal">
      <div className="modal-header">
        <h2>Edit Form Properties</h2>
        </div>
        <div className="modal-content-props-form">
          {/* Left Table */}
          <div className="left-container">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                </tr>
              </thead>
                <tbody>
                    {formProperties.map((prop, index) => (
                        <tr
                        key={index}
                        className={index === selectedIndex ? 'selected-row' : ''}
                        onClick={() => selectProperty(index)}>
                        <td>{prop.id}</td>
                        <td>{prop.name}</td>
                        <td>{prop.type}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>

          <div className="button-row">
              <button onClick={addProperty} className='action-btn primary'>+ Add</button>
              <button onClick={removeProperty} className='action-btn' disabled={selectedIndex === null}>🗑 Remove</button>
              <button onClick={moveUp}  className='action-btn'disabled={selectedIndex <= 0}>↑ Move Up</button>
              <button
                onClick={moveDown}
                className='action-btn'
                disabled={selectedIndex === null || selectedIndex === formProperties.length - 1}
              >
                ↓ Move Down
              </button>
            </div>
            </div>

          {/* Right Details */}
          <div className="details-wrapper">
            {selectedIndex !== null ? (
              <>
                {/* <h4>Details</h4> */}
                <div className="detail-row">
                  <label>ID</label>
                  <input
                    placeholder='Enter an id'
                    className="property-input"
                    value={selectedProp.id}
                    onChange={(e) => updateProperty('id', e.target.value)}
                  />
                </div>
                <div className="detail-row">
                  <label>Name</label>
                  <input
                    className="property-input"
                    placeholder='Enter a name'
                    value={selectedProp.name}
                    onChange={(e) => updateProperty('name', e.target.value)}
                  />
                </div>
                <div className="detail-row">
                  <label>Type</label>
                  <select
                  className="property-select"
                    value={selectedProp.type}
                    onChange={(e) => updateProperty('type', e.target.value)}
                  >
                    <option value="string">string</option>
                    <option value="long">long</option>
                    <option value="boolean">boolean</option>
                    <option value="date">date</option>
                    <option value="enum">enum</option>
                  </select>
                </div>
                {selectedProp.type === 'date' && (
                  <div className="detail-row">
                    <label>Date Pattern</label>
                    <input
                     className="property-input"
                      value={selectedProp.datePattern || ''}
                      onChange={(e) =>
                        updateProperty('datePattern', e.target.value)
                      }
                    />
                  </div>
                )}
                <div className="detail-row">
                <label>Expression</label>
                <input
                    className="property-input"
                    placeholder='Enter an expression'
                    value={selectedProp.expression || ''}
                    onChange={(e) => updateProperty('expression', e.target.value)}
                />
                </div>
                <div className="detail-row">
                <label>Variable</label>
                <input
                    placeholder="Enter a variable"
                    className="property-input"
                    value={selectedProp.variable || ''}
                    onChange={(e) => updateProperty('variable', e.target.value)}
                />
                </div>
                <div className="detail-row">
                <label>Default</label>
                <input
                    placeholder="Enter a default"
                    className="property-input"
                    value={selectedProp.defaultValue || ''}
                    onChange={(e) => updateProperty('defaultValue', e.target.value)}
                />
                </div>
                <div className='inline-group'>
                    <div className="detail-row">
                    <label>Required</label>
                    <input id="requiredField" class="property-checkbox" type="checkbox" ></input>
                    </div>

                    <div className="detail-row">
                    <label>Readable</label>
                    <input id="requiredField" class="property-checkbox" type="checkbox" ></input>
                    </div>

                    <div className="detail-row">
                    <label>Writable</label>
                    <input id="requiredField" class="property-checkbox" type="checkbox" ></input>
                    </div>
                </div>
              </>
            ) : (
            //   <p>No property selected.</p>
                <div className="empty-forms-state">
                  <div className="empty-icon">📝</div>
                  <h4>No Form Fields</h4>
                  <p>Add form fields to create a user interface for this task.</p>
                  {/* <button className="btn-primary" >
                    Add Your First Field
                  </button> */}
                </div>

            )}
          </div>
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
