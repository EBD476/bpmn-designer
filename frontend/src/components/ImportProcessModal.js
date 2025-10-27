import React, { useRef, useState } from "react";

const ImportProcessModal = ({
  show,
  onClose,
  onImport,
  isLoading = false,
  error = null,
}) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  const handleFileChange = (e) => {
    setFileError(null);
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    // Optionally validate BPMN file type (text/xml or .bpmn extension)
    if (
      !file.name.endsWith(".bpmn") &&
      file.type !== "text/xml" &&
      file.type !== "application/xml"
    ) {
      setFileError("Please select a valid BPMN (.bpmn or .xml) file.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setFileError(null);

    if (!selectedFile) {
      setFileError("Please select a BPMN file to import.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (onImport) {
        onImport(event.target.result, selectedFile.name);
      }
    };
    reader.onerror = () => {
      setFileError("Failed to read the file.");
    };
    reader.readAsText(selectedFile);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay viewer">
      <div className="modal modal-content">
        <div className="modal-header">
          <h3>Import Process Model</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">
        <form  onSubmit={handleImport}>     
        <br></br><br></br>    
          <label className="modal-label" htmlFor="import-bpmn-file">
             Please select or drop a BPMN XML definition with an .bpmn or .bpmn20.xml extension
          </label>
          <br></br><br></br>
          <input
            type="file"
            id="import-bpmn-file"
            accept=".bpmn,.xml,text/xml,application/xml"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <div className="import-process-dropbox">
            Drop a .bpmn or .bpmn20.xml BPMN XML file                    
          </div>
   
          {fileError && (
            <div className="modal-error" style={{ color: "red" }}>
              {fileError}
            </div>
          )}
          {error && (
            <div className="modal-error" style={{ color: "red" }}>
              {error}
            </div>
          )}
          {selectedFile && (
            <div className="selected-file">
              Selected file: <b>{selectedFile.name}</b>
            </div>
          )}
          <br></br><br></br><br></br>  <br></br>   
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? "Importing..." : "Import"}
            </button>
          </div>
        </form>
        </div>
      </div>
     
    </div>
  );
};

export default ImportProcessModal;
