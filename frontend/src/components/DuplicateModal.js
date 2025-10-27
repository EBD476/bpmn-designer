import React, { useState } from "react";



const DuplicateModal = ({
  visible,
  initialValues ,
  onCancel,
  onSave,  
  error
}) => {
    
  const [form, setForm] = useState({
    name: initialValues.name,
    key: initialValues.key,
    description: initialValues.description,
    tags: initialValues.tags
  });

  // Update form state on input
  const handleChange = (e) => {    
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (typeof onSave === "function") {
      onSave(form);
    }
  };

  if (!visible) return null;

  return (
    
    <div className="modal-overlay viewer">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Duplicate the business process model  </h3>
        </div>
        <p>You can change the name for the new model and you may want to change the description at the same time.</p>
        
        {error && (
          <div className="modal-error" style={{ color: "red", margin: "10px 0" }}>
            ❌ {error}
          </div>
        )}

        <form className="modal-body" onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="model-name">Model Name</label>
            <input
              id="model-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter model name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="model-key">Model Key</label>
            <input
              id="model-key"
              name="key"
              type="text"
              value={form.key}
              onChange={handleChange}
              required
              placeholder="Enter model key"
            />
          </div>
          <div className="form-group">
            <label htmlFor="model-description">Description</label>
            <textarea
              id="model-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter description"
              rows={3}
            />
          </div>
   
        </form>
        <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" 
            onClick={handleSave}>
              Save              
            </button>
          </div>
      </div>
    </div>
  );
};

export default DuplicateModal;
