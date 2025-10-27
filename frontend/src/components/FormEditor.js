import React, { useState } from 'react';

const defaultProperty = { id: '', name: '', type: 'string', datePattern: '' };

export default function FormEditor({ onSave }) {
  const [formProperties, setFormProperties] = useState([defaultProperty]);

  const updateProperty = (index, key, value) => {
    const updated = [...formProperties];
    updated[index][key] = value;
    setFormProperties(updated);
  };

  const addProperty = () => {
    setFormProperties([...formProperties, { ...defaultProperty }]);
  };

  const removeProperty = (index) => {
    const updated = formProperties.filter((_, i) => i !== index);
    setFormProperties(updated);
  };

  const handleSave = () => {
    onSave(formProperties);
  };

  return (
    <div>
      <h3>Edit Form Properties</h3>
      {formProperties.map((prop, index) => (
        <div key={index} style={{ marginBottom: '1rem' }}>
          <input
            placeholder="ID"
            value={prop.id}
            onChange={(e) => updateProperty(index, 'id', e.target.value)}
          />
          <input
            placeholder="Name"
            value={prop.name}
            onChange={(e) => updateProperty(index, 'name', e.target.value)}
          />
          <select
            value={prop.type}
            onChange={(e) => updateProperty(index, 'type', e.target.value)}
          >
            <option value="string">string</option>
            <option value="date">date</option>
            <option value="enum">enum</option>
          </select>
          {prop.type === 'date' && (
            <input
              placeholder="Date Pattern"
              value={prop.datePattern}
              onChange={(e) =>
                updateProperty(index, 'datePattern', e.target.value)
              }
            />
          )}
          <button onClick={() => removeProperty(index)}>Remove</button>
        </div>
      ))}
      <button onClick={addProperty}>Add Property</button>
      <button onClick={handleSave}>Save to BPMN</button>
    </div>
  );
}
