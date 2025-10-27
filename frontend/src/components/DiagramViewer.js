import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import './DiagramViewer.css';
// import BpmnViewer from 'bpmn-js';

const DiagramViewer = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

//   const bpmnViewerRef = useRef(null);
  const bpmnModelerRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [diagramData, setDiagramData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const didFetchRef = useRef(false);

  const API_BASE = '/api';
  

  useEffect(() => {
    if (didFetchRef.current) return;  // prevent running twice
    didFetchRef.current = true;
    
    initializeModeler();
    // loadDiagramData();
    loadDefaultDiagram();
  }, []);


  const initializeModeler = () => {
    bpmnModelerRef.current = new BpmnModeler({
      container: containerRef.current,
      keyboard: {
        bindTo: document
      }
    });
    // Apply custom styles for viewer mode
    // addViewerStyles();
    // return () => {
    //     if (bpmnModelerRef.current) {
    //         bpmnModelerRef.current.destroy();
    //     }
    //   };
    };

    const loadDefaultDiagram =  async () => {

        const response = await fetch(`${API_BASE}/designs/b3be14a2-6eb3-4673-ad54-4128f45fcadf`);
        const bpmnXML = await response.json();
        setLoading(false);   
        //  console.log(bpmnXML)

        setDiagramData(bpmnXML.xml_content)
    // loadDiagram(defaultBpmnXml);
  };

//   useEffect(() => {
//     // console.log(loading)
//     setLoading(false)

//     if (diagramData && bpmnModelerRef.current) {
//         console.log("importxml")
//         bpmnModelerRef.current.importXML(diagramData.xml_content);
//         setIsLoaded(true);
//       }

//     // loadDiagramData();
//   },[diagramData,bpmnModelerRef.current])
// //   useEffect(() => {
// //     async function loadDiagram() {
// //       try {
// //         if (diagramData && bpmnModelerRef.current){
// //             console.log(diagramData.xml_content)
// //             await bpmnModelerRef.current.importXML(diagramData.xml_content);
// //             setIsLoaded(true);  // triggers React to re-render and show diagram
// //         }
// //       } catch (e) {
// //         console.error(e);
// //       }
// //     }
// //     loadDiagram();
// //   }, [diagramData]);

  const loadDiagramData = async () => {
    setLoading(true)
    console.log("loadDiagramData")
    //   setLoading(true);

    try {    
    //   setError(null);
      const response = await fetch(`${API_BASE}/designs/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Diagram not found');
        }
        throw new Error('Failed to load diagram');
      }
      const design = await response.json();
      setDiagramData(design);    
      
      // Load the XML content into the viewer
    //   await loadDiagram(design.xml_content);
          
    } catch (err) {
      console.error('Error loading diagram:', err);
      setError(err.message);
      setLoading(false);
    } finally{
        setLoading(false);   
    }
  };

  useEffect(() => {
    
    loadDiagram()
}, [diagramData]);


const loadDiagram =  async () => {
    try {                 
    // await modelerRef.current.importXML(xml);     
    if (diagramData && bpmnModelerRef.current) {
         console.log(diagramData)
         await bpmnModelerRef.current.importXML(diagramData);
         setIsLoaded(true)
    }
    } catch (err) {
      console.error('Error loading BPMN diagram:', err);
    }
  };


//   const loadDiagram = async (xml) => {
//     try {
//       await bpmnModelerRef.current.importXML(xml);
      
//       setIsLoaded(true);

      
//       // Apply custom colors after loading
//       setTimeout(() => {
//         applyViewerColors();
//       }, 500);
//     } catch (err) {
//       console.error('Error loading BPMN diagram:', err);
//       setError('Failed to load diagram content');
//     }
//   };

  const addViewerStyles = () => {
    const styleId = 'bpmn-viewer-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .bpmn-viewer-mode .djs-element {
          cursor: default !important;
        }
        
        .bpmn-viewer-mode .djs-shape:hover {
          filter: brightness(1.05);
        }
        
        .bpmn-viewer-mode .djs-palette {
          display: none !important;
        }
        
        .bpmn-viewer-mode .djs-outline {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  };

  const applyViewerColors = () => {
    if (!bpmnModelerRef.current) return;

    const elementRegistry = bpmnModelerRef.current.get('elementRegistry');
    
    // Define color mappings for viewer mode
    const colorMappings = {
      'bpmn:UserTask': {
        fill: '#d1fae5',
        stroke: '#059669'
      },
      'bpmn:ServiceTask': {
        fill: '#fed7aa',
        stroke: '#ea580c'
      },
      'bpmn:ScriptTask': {
        fill: '#fed7aa',
        stroke: '#ea580c'
      },
      'bpmn:BusinessRuleTask': {
        fill: '#fed7aa',
        stroke: '#ea580c'
      },
      'bpmn:ManualTask': {
        fill: '#e0e7ff',
        stroke: '#4f46e5'
      },
      'bpmn:Participant': {
        fill: '#dbeafe',
        stroke: '#2563eb'
      },
      'bpmn:Lane': {
        fill: '#dbeafe',
        stroke: '#2563eb'
      }
    };

    // Apply colors to elements
    elementRegistry.forEach((element) => {
      const colorConfig = colorMappings[element.type];
      if (colorConfig && !element.hidden) {
        try {
          const modeling = bpmnModelerRef.current.get('modeling');
          modeling.setColor(element, {
            fill: colorConfig.fill,
            stroke: colorConfig.stroke
          });
        } catch (error) {
          // Silent fail for viewer mode
        }
      }
    });
  };

  const handleEdit = () => {
    navigate(`/designer/${id}`);
  };

  const handleDownloadXml = async () => {
    try {
      const { xml } = await bpmnModelerRef.current.saveXML({ format: true });
      
      // Create and download XML file
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${diagramData.name || 'bpmn_design'}.bpmn`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading XML:', error);
      alert('Failed to download XML file');
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const { svg } = await bpmnModelerRef.current.saveSVG();
      
      // Create and download SVG file
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${diagramData.name || 'bpmn_design'}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading SVG:', error);
      alert('Failed to download SVG file');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE}/designs/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete diagram');
      }

      alert('Diagram deleted successfully');
      navigate('/designs');
    } catch (error) {
      console.error('Error deleting diagram:', error);
      alert('Failed to delete diagram');
    }
  };

  const handleZoomIn = () => {
    const canvas = bpmnModelerRef.current.get('canvas');
    const newZoom = Math.min(zoom * 1.2, 3);
    canvas.zoom(newZoom);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const canvas = bpmnModelerRef.current.get('canvas');
    const newZoom = Math.max(zoom / 1.2, 0.2);
    canvas.zoom(newZoom);
    setZoom(newZoom);
  };

  const handleZoomReset = () => {
    const canvas = bpmnModelerRef.current.get('canvas');
    canvas.zoom('fit-viewport', 'auto');
    setZoom(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="diagram-viewer-container">
        <div className="viewer-loading">
          <div className="loading-spinner-large"></div>
          <h3>Loading Diagram...</h3>
          <p>Please wait while we load your BPMN diagram</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagram-viewer-container">
        <div className="viewer-error">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Diagram</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/designs')} className="btn-primary">
              Back to Designs
            </button>
            <button onClick={loadDiagramData} className="btn-secondary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="diagram-viewer-container">
      {/* Viewer Header */}
      <div className="viewer-header">
        <div className="header-left">
          <Link to="/designs" className="back-link">
            ← Back to Designs
          </Link>
          <div className="diagram-info">
            <h1>{diagramData?.name || 'Untitled Diagram'}</h1>
            <div className="diagram-meta">
              {diagramData?.description && (
                <p className="diagram-description">{diagramData.description}</p>
              )}
              <div className="meta-items">
                <span className="meta-item">
                  <strong>Version:</strong> v{diagramData?.version}
                </span>
                <span className="meta-item">
                  <strong>Created:</strong> {formatDate(diagramData?.created_at)}
                </span>
                <span className="meta-item">
                  <strong>Updated:</strong> {formatDate(diagramData?.updated_at)}
                </span>
                <span className="meta-item">
                  <strong>ID:</strong> {id?.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="viewer-actions">
            <div className="zoom-controls">
              <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out">
                🔍-
              </button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In">
                🔍+
              </button>
              <button onClick={handleZoomReset} className="zoom-btn" title="Reset Zoom">
                🔍↔
              </button>
            </div>

            <div className="action-buttons">
              <button onClick={handleEdit} className="btn-primary" title="Edit in Designer">
                🎨 Edit
              </button>
              <button onClick={handleDownloadXml} className="btn-secondary" title="Download BPMN XML">
                📄 XML
              </button>
              <button onClick={handleDownloadSvg} className="btn-secondary" title="Download as SVG">
                🖼️ SVG
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="btn-danger"
                title="Delete Diagram"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div className="viewer-content">
        <div 
          ref={containerRef} 
          className="bpmn-viewer bpmn-viewer-mode"

        />
        
        {!isLoaded && (
          <div className="viewer-loading-overlay">
            <div className="loading-spinner"></div>
            <p>Rendering diagram...</p>
          </div>
        )}
      </div>

      {/* Footer with quick actions */}
      <div className="viewer-footer">
        <div className="footer-actions">
          <button onClick={handleEdit} className="btn-primary compact">
            🎨 Open in Designer
          </button>
          <button onClick={handleDownloadXml} className="btn-secondary compact">
            📄 Download XML
          </button>
          <button onClick={handleDownloadSvg} className="btn-secondary compact">
            🖼️ Export SVG
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm-modal">
            <div className="modal-header">
              <h3>Delete Diagram</h3>
            </div>
            
            <div className="modal-body">
              <div className="warning-icon">⚠️</div>
              <h4>Are you sure you want to delete this diagram?</h4>
              <p>
                This action cannot be undone. The diagram "<strong>{diagramData?.name}</strong>" 
                will be permanently removed from the database.
              </p>
              
              <div className="delete-details">
                <div className="detail-item">
                  <span className="detail-label">Diagram ID:</span>
                  <span className="detail-value">{id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{formatDate(diagramData?.created_at)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Version:</span>
                  <span className="detail-value">v{diagramData?.version}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleDelete}
              >
                🗑️ Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagramViewer;