import React, { useEffect, useRef ,useState } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';    
import EditPropertiesModal from './EditPropertiesModal'
import DuplicateModal from "./DuplicateModal";
import BpmnViewer from 'bpmn-js/lib/Viewer';


function BpmnModelerComponent() {
  const modelerRef = useRef(null);
  const containerRef = useRef(null);
  const propPanelRef = useRef(null);
  const [diagramData, setDiagramData] = useState(null);
  const didFetchRef = useRef(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditPropertiesModal, setShowEditPropertiesModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [duplicateModalError, setDuplicateModalError] = useState(null);
  
  // Sample historyList state variable and related mock data for demonstrating the history dropdown
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(
    historyList.length > 0 ? historyList[0].version_number : null
  );

  const navigate = useNavigate();
  const { id } = useParams();

  const API_BASE = '/api';

  useEffect(() => {
    if (didFetchRef.current) return;  // prevent running twice
    didFetchRef.current = true;

    initializeModeler();
    loadDiagramData();
    setSelectedVersion("Latest");
  }, []);

  useEffect(() => {    
    loadDesignVersions();
}, [diagramData]);

  const loadDiagramData =  async () => {
 
    const response = await fetch(`${API_BASE}/designs/${id}`);
    const data = await response.json();
    setDiagramData(data)
  };

  const loadDiagramByVersion =  async (version) => {
 
    const response = await fetch(`${API_BASE}/designs/${id}/version/${version}`);
    const data = await response.json();
    setDiagramData(data)
  };

  const loadDesignVersions =  async () => {
 
    const response = await fetch(`${API_BASE}/designs/${id}/versions`);    
    const versionList = await response.json();    

    if (diagramData){        
        const lastVersionData = {
            xml_content: diagramData.xml_content,
            version_number: 'Latest' ,
            created_at: diagramData.created_at,
            last_version: true
        };        
        const updatedList = [ lastVersionData,...versionList];     
        setHistoryList(updatedList)  
    } else {
        setHistoryList(versionList)  
    }
  
  };

  const onSelectHistoryVersion = (version) => {
    
    if (version.last_version){
        setSelectedVersion("Latest");
        loadDiagramData();
    } else {
        setSelectedVersion(version.version_number);
        loadDiagramByVersion(version.version_number);
    }
  };
  

  const loadDiagram =  async () => {
    try {               
    // await modelerRef.current.importXML(xml);     
    if (diagramData && modelerRef.current) {       
         await  modelerRef.current.importXML(diagramData.xml_content);
         const canvas = modelerRef.current.get("canvas");
         canvas.zoom("fit-viewport");         
    }
    } catch (err) {
      console.error('Error loading BPMN diagram:', err);
    }
  };

  useEffect(() => {
        loadDiagram()
  }, [diagramData]);

  const initializeModeler = () => {
    
    modelerRef.current = new BpmnViewer({
      container: containerRef.current,
      keyboard: {
        bindTo: document
      },
      additionalModules: [
        {
          palette: ["value", {}],
          paletteProvider: ["value", {}],
        //   contextPad: ["value", {}],
          contextPadProvider: ["value", {}],
          // optionally disable label editing module:
          labelEditingProvider: ["value", null]
        }
      ]
    });

    return () => {
        if (modelerRef.current) {
            modelerRef.current.destroy();
        }
      };
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


    // Handle duplicating (creating) a new model based on the current one
    const handleDuplicate = async (newModelFields) => {
      try {

        // Save the current diagram as XML for the duplicated model
        const { xml } = await modelerRef.current.saveXML({ format: true });

        // Prepare payload for the new model
        const payload = {
          ...newModelFields,
          xml_content: xml,
          version: 1,
          version_number: 1,
          // Optionally copy thumbnail and tags from original if desired
          thumbnail: diagramData?.thumbnail || null,
          tags: Array.isArray(newModelFields.tags)
            ? newModelFields.tags
            : (diagramData?.tags || []),
        };

        const response = await fetch(`${API_BASE}/designs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        // Handle error for "key not unique" specifically
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (
            errorData?.error &&
            typeof errorData.error === "string" &&
            errorData.error.toLowerCase().includes("key")
          ) {
            // Show the error in the duplicate modal rather than only alert
            setDuplicateModalError?.(errorData.error);
            
            // alert(errorData.error); // Show backend error e.g. "A design with this key already exists."
            return null;
          }
          throw new Error('Failed to duplicate diagram');
        }

        if (!response.ok) {
          throw new Error('Failed to duplicate diagram');
        }

        const created = await response.json();
        alert('Diagram duplicated successfully');
        setShowDuplicateModal(false);
        // Optional: Navigate to the new diagram page
        navigate(`/viewer/${created.id}`);
        return created;
      } catch (error) {
        console.error('Error duplicating diagram:', error);
        alert('Failed to duplicate diagram');
        return null;
      }
    };

      
    // Handle updating the diagram (PUT API)
    const handleUpdate = async (updatedFields) => {
      try {
        // Save the current diagram as XML
        // const { xml } = await modelerRef.current.saveXML({ format: true });        

        const payload = {
          ...updatedFields,
        };

        // Add thumbnail if currently available in diagramData
        if (diagramData?.thumbnail) {
          payload.thumbnail = diagramData.thumbnail;
        }
        // Add tags if currently available in diagramData
        // if (diagramData?.tags) {
        //   payload.tags = diagramData.tags;
        // }
        const response = await fetch(`${API_BASE}/designs/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });


        if (!response.ok) {
          throw new Error('Failed to update diagram');
        }

        const updated = await response.json();
        
        alert('Diagram updated successfully');
        setShowEditPropertiesModal(false)                
        setDiagramData(updated)
        loadDesignVersions();

        return updated;
      } catch (error) {
        console.error('Error updating diagram:', error);
        alert('Failed to update diagram');
        return null;
      }
    };

    const handleDownloadXml = async () => {
        try {
          const { xml } = await modelerRef.current.saveXML({ format: true });          
          // Create and download XML file
          const blob = new Blob([xml], { type: 'application/xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${diagramData.key || 'bpmn_design'}.bpmn`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error downloading XML:', error);
          alert('Failed to download XML file');
        }
      };    


 useEffect(() => {
    if (!showHistoryDropdown) return;

    function handleClickOutside(event) {
        // Find the history dropdown and history button elements
        const dropdown = document.querySelector('.history-dropdown.popover');
        const historyBtn = document.querySelector('.history-btn');

        // If the dropdown is not present, nothing to do
        if (!dropdown) return;

        // If click was inside the dropdown or history button, do nothing
        if (
        dropdown.contains(event.target) ||
        (historyBtn && historyBtn.contains(event.target))
        ) {
        return;
        }

        // Otherwise, close the dropdown
        setShowHistoryDropdown(false);
    }

    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
    };
    }, [showHistoryDropdown]);

  const openBpmnDiagram = (xml2) => {
    const defaultBpmnXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <bpmn2:definitions 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
        xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
        id="sample-diagram" 
        targetNamespace="http://bpmn.io/schema/bpmn">
        <bpmn2:process id="Process_1" isExecutable="false">
          <bpmn2:startEvent id="StartEvent_1">
            <bpmn2:outgoing>Flow_1</bpmn2:outgoing>
          </bpmn2:startEvent>
          <bpmn2:userTask id="UserTask_1" name="User Task">
            <bpmn2:incoming>Flow_1</bpmn2:incoming>
            <bpmn2:outgoing>Flow_2</bpmn2:outgoing>
          </bpmn2:userTask>
          <bpmn2:serviceTask id="ServiceTask_1" name="System Task">
            <bpmn2:incoming>Flow_2</bpmn2:incoming>
            <bpmn2:outgoing>Flow_3</bpmn2:outgoing>
          </bpmn2:serviceTask>
          <bpmn2:endEvent id="EndEvent_1">
            <bpmn2:incoming>Flow_3</bpmn2:incoming>
          </bpmn2:endEvent>
          <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="UserTask_1" />
          <bpmn2:sequenceFlow id="Flow_2" sourceRef="UserTask_1" targetRef="ServiceTask_1" />
          <bpmn2:sequenceFlow id="Flow_3" sourceRef="ServiceTask_1" targetRef="EndEvent_1" />
        </bpmn2:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
            <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
              <dc:Bounds x="173" y="102" width="36" height="36" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="UserTask_1_di" bpmnElement="UserTask_1">
              <dc:Bounds x="260" y="80" width="100" height="80" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="ServiceTask_1_di" bpmnElement="ServiceTask_1">
              <dc:Bounds x="412" y="80" width="100" height="80" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
              <dc:Bounds x="564" y="102" width="36" height="36" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
              <di:waypoint x="209" y="120" />
              <di:waypoint x="260" y="120" />
            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
              <di:waypoint x="360" y="120" />
              <di:waypoint x="412" y="120" />
            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
              <di:waypoint x="512" y="120" />
              <di:waypoint x="564" y="120" />
            </bpmndi:BPMNEdge>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn2:definitions>
    `;

    modelerRef.current.importXML(defaultBpmnXml, (err) => {
      if (err) {
        console.error("Failed to import BPMN diagram", err);
      } else {
        const canvas = modelerRef.current.get("canvas");
        canvas.zoom("fit-viewport");
      }
    });
  };

  return (
    <>
    {diagramData && 
    <>
        <EditPropertiesModal initialValues={diagramData}
        onSave={handleUpdate}
        visible={showEditPropertiesModal} onCancel={() => setShowEditPropertiesModal(false)}/>    

        <DuplicateModal initialValues={diagramData}
        onSave={handleDuplicate}
        error={duplicateModalError}
        visible={showDuplicateModal} onCancel={()=> setShowDuplicateModal(false)} />
    </>
    }
    {showDeleteConfirm && (
      <div className="modal-overlay viewer">
        <div className="modal-content delete-confirm-modal">
          <div className="modal-header">
            <h3>Delete Diagram</h3>
          </div>
          <div className="modal-body">
            <div className="warning-icon" style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
            <h4>Are you sure you want to delete this diagram?</h4>
            <p>
              This action cannot be undone. The diagram <strong>{diagramData?.name || "this diagram"}</strong> will be permanently removed from the database.
            </p>
            <div className="delete-details">
              <div className="detail-item">
                <span className="detail-label">Diagram ID:</span>
                <span className="detail-value">{diagramData?.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created: &nbsp; &nbsp;</span>
                <span className="detail-value">{diagramData?.created_at}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Version: &nbsp; &nbsp; &nbsp;</span>
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
              onClick={() => {
                // You can define your handleDelete function elsewhere and call here.
                // For now just close the modal for demo purpose or call props.handleDelete()
                if (typeof handleDelete === "function") {
                  handleDelete();
                }
                setShowDeleteConfirm(false);
              }}
            >
              🗑️ Delete Permanently
            </button>
          </div>
        </div>
      </div>
    )}

    <PageHeader diagramData={ diagramData} setShowDeleteConfirm={setShowDeleteConfirm} 
                handleDownloadXml={handleDownloadXml} setShowEditPropertiesModal={setShowEditPropertiesModal} setShowDuplicateModal={setShowDuplicateModal}
                setShowHistoryDropdown={setShowHistoryDropdown} historyList={historyList} onSelectHistoryVersion={onSelectHistoryVersion}
                showHistoryDropdown={showHistoryDropdown} historyLoading={historyLoading}  selectedVersion={selectedVersion}/>
    <div id="bpmncontainer" style={{ height: "98vh", display: "flex" }}>
      <div
        id="bpmnview"
        ref={containerRef}
        style={{ width: "100%", height: "98vh" }}
      ></div>
    </div>
    </>
  );
}

// Page Header Component
const PageHeader = ({ designsCount, onRefresh, diagramData, handleDownloadXml,setShowDeleteConfirm ,setShowDuplicateModal,
    setShowEditPropertiesModal ,setShowHistoryDropdown, historyList , showHistoryDropdown, historyLoading, selectedVersion, onSelectHistoryVersion}) => (
    <>
    <div className="viewer navbar">
    <div className="navbar-left">
      <div className="app-icon"></div>
        <div className="title-section">
            <h2>Process Modeler</h2>
            <p>Manage and organize your business process designs</p>
        </div>
    </div>
    </div>
    <div className="page-header viewer">
      <div className="header-content">
        <div className="header-title-section">                  
            <h3><span className="version">v{diagramData?.version_number  }  </span>  {diagramData?.key || 'Untitled Diagram'}</h3>
            <div className="details">
            <div className="meta-data">
                    <span>👤 Created by {diagramData?.created_by || 'Username'  }</span>
                    <br/>
                    <span>🖊️ Last updated by {diagramData?.created_by  || 'Username'  } - {diagramData?.created_at || 'Unknown date'  }</span>                    
            </div>
          {diagramData?.tags && Array.isArray(diagramData.tags) && diagramData.tags.length > 0 && (
            <div className="diagram-tags" >
              <span>Tags:</span>{" "}
              {diagramData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="tags"
                >
                  {tag}
                </span>
              ))}
              { diagramData?.description && (
                        <p className="diagram-description">{diagramData.description}</p>
                    )}
            </div>
          )}
          </div>
        </div>

        <div>
        <div className="header-actions">
            <Link to={"/"} >  
            ← Show all definitions            
            </Link>

        <button 
          onClick={() => setShowEditPropertiesModal(true)} 
          className="btn-primary" 
          title="Modify model properties"
        >
          ✏️
        </button>
        <button  onClick={() => setShowDuplicateModal(true)} className="btn-primary" title="Duplicate this model">
            📄
        </button>
        <button  onClick={() => setShowDeleteConfirm(true)}  className="btn-primary" title="Delete this model">
           🗑️
        </button>
        <button onClick={handleDownloadXml} className="btn-primary"  title="Export to BPMN2.0" style={{marginLeft:10,marginRight:10}}>          
           📩
        </button>
        <Link to={`/designer/${diagramData?.id}`} className="btn-primary">
          Visual Editor 📝
        </Link>
      </div>

         {/* Dropdown for design model history */}
         <div style={{ display: 'inline-block', position: 'relative', float:'right' }}>
           <button
             onClick={() => setShowHistoryDropdown((prev) => !prev)}
             className="btn-secondary history-btn"
             type="button"
           >
             History <strong>{Array.isArray(historyList) ? historyList.length : '0'}</strong>
           </button>
           {showHistoryDropdown && (
             <div
               className="history-dropdown popover bottom-right"            
             >
               <div className="arrow"></div>
                
               <div className="popover-header">
                
                 <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, letterSpacing: 0.5 }}>History</h3>
                 <button
                   onClick={() => setShowHistoryDropdown(false)}
                   className="popover-close"
                   style={{
                  
                   }}
                   title="Close History"
                   aria-label="Close History"
                 >
                   &times;
                 </button>
               </div>

            <div className="item-list">
               {historyLoading ? (
                 <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>Loading...</div>
               ) : Array.isArray(historyList) && historyList.length > 0 ? (
                 historyList.map((v, idx) => (
                   <div
                     className="popover-item"
                     key={v.version_number || idx}
                     style={{
                       padding: '0.6rem 1rem',
                       cursor: 'pointer',
                       borderBottom: idx !== historyList.length - 1 ? '1px solid #efefef' : 'none',
                    //    background: (selectedVersion === v.version_number) ? '#eef2  ff' : 'transparent'
                     }}
                     onClick={() => {                        
                       if (onSelectHistoryVersion) {
                         onSelectHistoryVersion(v);
                       }
                       setShowHistoryDropdown(false);
                     }}
                   >
                     <div style={{ fontWeight: 500, marginBottom: 3, fontSize: 18 }}>
                     {!v.last_version ? (
                        <span style={{ color: '#2980b9' }}>v{v.version_number}</span>
                        ) : (
                        <span style={{ color: '#2980b9' }}>{v.version_number}</span>
                        )}
                       {selectedVersion === v.version_number && (
                         <span style={{ color: '#34d399', marginLeft: 6 }}>&#10003; </span>
                       )}
                     </div>
                     <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                     {v.created_by ? v.created_by : 'Unknown user'} - {v.created_at ? v.created_at : 'Unknown date'}
                     </div>
                     {v.comment && (
                       <div style={{ fontSize: '0.88em', color: '#444', marginTop: 2 }}>
                         {v.comment}
                       </div>
                     )}
                   </div>
                 ))
               ) : (
                 <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>No history versions</div>
               )}
             </div>
             </div>
           )}
           
         </div>
        </div>
       
      </div>   
    </div>
    </>
  );

export default BpmnModelerComponent;
