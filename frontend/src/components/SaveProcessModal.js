import React, { useState } from "react";
import TagInput from "./TagInput";

const SaveProcessModal = ({
  visible,
  initialValues ,
  onCancel,
  onSave,
}) => {
    
  if (initialValues == null) {
    return null;
  }
  const [form, setForm] = useState({
    name: initialValues.name ,
    key: initialValues.key,
    description: initialValues.description,
    tags: initialValues.tags,
    history: false
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
          <h3>Save Model </h3>
        </div>        
        <br></br>
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

          <TagInput
                label="Tags"
                name="tags"
                tags={form.tags}
                inputValue={form._tagsInput}
                onChange={handleChange}
                />
   
        </form>

        <div className="save-checkbox" >
           		<label>
           			<input  checked={form.history}
                        onChange={(e) => setForm({ ...form, history: e.target.checked })} 
                        id="model-history-save" type="checkbox" />
           				Save this as a new version?  This means you can always go back to a previous version
           		</label>
        	</div>

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

export default SaveProcessModal;
