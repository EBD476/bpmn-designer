import React, { useState, useEffect } from 'react';
import { Link ,useNavigate} from 'react-router-dom';
import CreateNewProcessModal from './CreateNewProcessModal';
import ImportProcessModal from './ImportProcessModal';
import './BpmnDesignsGrid.css';

const BpmnDesignsGrid = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateNewModal, setShowCreateNewModal] = React.useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [diagramData, setDiagramData] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  const navigate = useNavigate();
  const API_BASE = '/api';

  useEffect(() => {
    fetchDesigns();
  }, [pagination.currentPage, searchTerm]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/designs?page=${pagination.currentPage}&limit=12&search=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();

      if (data){      
        setDesigns(data.designs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching designs:', error);
      alert('Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const handleImportProcess = async (xmlContent, fileName) => {
    try {
      const name = fileName.replace(/\.(bpmn|xml)$/, '');
  
      const payload = {
        name,
        description: '',
        xml_content: xmlContent,
        thumbnail: null,
        tags: []
      };
  
      const response = await fetch(`${API_BASE}/designs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(
          errorData?.error ||
          `Failed to import process design (HTTP ${response.status})`
        );
        return;
      }
  
      setShowImportModal(false);
      fetchDesigns();
      alert('Process imported successfully!');
    } catch (err) {
      alert('Failed to import process. ' + (err?.message || ''));
    }
  };

  
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // "Save new handle" -- handler for saving new business process from CreateNewProcessModal
  const handleSaveNew = async (formData) => {
    try {

     const xml_content = `
        <?xml version="1.0" encoding="UTF-8"?>
       <bpmn2:definitions 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
         xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
         xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
         xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
         id="new-diagram" 
         targetNamespace="http://bpmn.io/schema/bpmn">
         <bpmn2:process id="Process_1" isExecutable="false">
           <bpmn2:startEvent id="StartEvent_1" />
         </bpmn2:process>
         <bpmndi:BPMNDiagram id="BPMNDiagram_1">
           <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
             <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
               <dc:Bounds x="173" y="102" width="36" height="36" />
             </bpmndi:BPMNShape>
           </bpmndi:BPMNPlane>
         </bpmndi:BPMNDiagram>
       </bpmn2:definitions>
       `;

     formData.xml_content = xml_content;

    //   Optionally basic validation here
      const response = await fetch(`${API_BASE}/designs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();

      if (response.ok) {
        setShowCreateNewModal(false);
        // Optionally load the designs again or just append
        fetchDesigns();
        navigate('/designer/new');
        alert('New process model created');
      } else {
        // Handle API validation errors if any
        alert(result.error || 'Failed to create new process model');
      }
    } catch (err) {
      console.error('Error creating new process model:', err);
      alert('Failed to create new process model');
    }
  };

  const handleDelete = async (designId, designName) => {
    if (!window.confirm(`Are you sure you want to delete "${designName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/designs/${designId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDesigns(designs.filter(design => design.id !== designId));
        alert('Design deleted successfully');
      } else {
        throw new Error('Failed to delete design');
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('Failed to delete design');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && designs.length === 0) {
    return (
 
      <div className="designs-grid-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading designs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <PageHeader 
    designsCount={pagination.totalCount}
    setShowCreateNewModal={setShowCreateNewModal}
    setShowImportModal={setShowImportModal}
    onRefresh={fetchDesigns}
    />

    <CreateNewProcessModal initialValues={diagramData} visible={showCreateNewModal}
    onSave={handleSaveNew}
    onCancel={()=> setShowCreateNewModal(false)}/>

    <ImportProcessModal
      show={showImportModal}
      onClose={() => setShowImportModal(false)}
      onImport={handleImportProcess}
    />

    <div className="designs-grid-container">
      
      {/* <div className="grid-header">
        <div className="header-content">
          <h1>BPMN Designs</h1>
          <p>Manage and organize your process designs</p>
        </div>
        <div className="header-actions">
          <a to="/designer/new" className="btn-primary">
            + New Design
          </a>
        </div>
      </div> */}

      <div className="grid-controls">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search designs by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              🔍
            </button>
          </div>
        </form>

        <div className="filter-controls">
          <span className="results-count">
            Showing {designs.length} of {pagination.totalCount} designs
          </span>
        </div>
      </div>

      {designs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
          {/* 📊 */}
            <img src='not-found.png' />
          </div>
          <h3>No designs found</h3>
          <p>
            {searchTerm 
              ? 'No designs match your search criteria. Try different keywords.'
              : 'Get started by creating your first BPMN design.'
            }
          </p>
          {/* <a to="/designer/new" className="btn-primary">
            Create Your First Design
          </a> */}
        </div>
      ) : (
        <>
          <div className="designs-grid">
            {designs.map((design) => (
              <div key={design.id} className="design-card">
                <div className="card-header">
                  <div className="design-thumbnail">
                    {design.thumbnail ? (
                      <img 
                        src={design.thumbnail} 
                        alt={design.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {/* <div className={`thumbnail-placeholder ${design.thumbnail ? 'hidden' : ''}`}>
                      <span className="placeholder-icon">📋</span>
                      <span className="placeholder-text">BPMN Design</span>
                    </div> */}

                    <div className="design-meta">
                        <span className="meta-value">V{design.version}</span>
                      </div>

                    <div className="card-overlay">
                    
                      <div className="overlay-actions">                      
                      <Link 
                          to={`/designer/${design.id}`}
                          className="action-btn primary"
                          title="Open in Designer"
                        >
                          🎨
                        </Link>
                        <a                             
                          href={`/viewer/${design.id}`}
                          className="action-btn primary"
                          title="View Diagram"
                        >
                        🔎
                        </a>
                                              
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <h3 className="design-name" title={design.name}>
                    {design.name}
                  </h3>
                  <div className='basic-details'>        
                    <span>👤 {design.created_by}</span>
                    <span>🖊️ {formatDate(design.updated_at)}</span>
                  </div>
                  {design.description && (
                    <p className="design-description">📄
                      {design.description.length > 100 
                        ? `${design.description.substring(0, 100)}...`
                        : design.description
                      }
                    </p>
                  )}

                  {/* <div className="design-meta">
                    <div className="meta-item">
                      <span className="meta-label">Version:</span>
                      <span className="meta-value">v{design.version}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Size:</span>
                      <span className="meta-value">
                        {formatFileSize(design.xml_size || 0)}
                      </span>
                    </div>
                  </div> */}

                  {design.tags && design.tags.length > 0 && (
                    <div className="design-tags">
                      {design.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                        </span>
                      ))}
                      {design.tags.length > 3 && (
                        <span className="tag-more">
                          +{design.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
{/* 
                <div className="card-footer">
                  <div className="footer-content">
                    <span className="date-info">
                      Updated {formatDate(design.updated_at)}
                    </span>
                    <a 
                      to={`/designer/${design.id}`}
                      className="open-link"
                    >
                      Open →
                    </a>
                  </div>
                </div> */}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={!pagination.hasPrev}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              >
                ← Previous
              </button>
              
              <div className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              
              <button
                className="pagination-btn"
                disabled={!pagination.hasNext}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              >
                Next →
              </button>
            </div>
          )}
        </>
       )} 
    </div>
    </>
  );
};

// Page Header Component
const PageHeader = ({ designsCount, onRefresh ,setShowCreateNewModal,setShowImportModal }) => (
    <>
    <div className="navbar">
    <div className="navbar-left">
      <div className="app-icon"></div>
        <div className="title-section">
            <h2>Process Modeler</h2>
            <p>Manage and organize your business process designs</p>
        </div>
    </div>
    </div>
    <div className="page-header">
      <div className="header-content">
        <div className="header-title-section">
          {/* <h2>BPMN Design Library</h2> */}
          <h3>Business Process Models  </h3>
          <p>Manage and organize your business process designs</p>
        </div>

        <div className="header-actions">
        <button onClick={onRefresh} className="btn-primary" title="Refresh">
           {/* Refresh */}
           🔄
        </button>
        <button  onClick={()=>setShowImportModal(true)} className="btn-primary">
          <span className="btn-icon">📂</span>
          Import Process
        </button>
        <button onClick={()=>setShowCreateNewModal(true)} className="btn-primary">
          <span className="btn-icon">➕</span>
          Create Process
        </button>    
      </div>

        {/* <div className="header-stats">
          <div className="stat-item">
            <div className="stat-number">{designsCount || 0}</div>
            <div className="stat-label">Total Designs</div>
          </div>
        </div> */}
      </div>   
    </div>
    </>
  );

export default BpmnDesignsGrid;