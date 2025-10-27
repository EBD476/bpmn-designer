// BpmnDiagram.jsx
import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { useParams, useNavigate ,Link } from 'react-router-dom';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import './BpmnDiagram.css';  
// import FormEditor from './FormEditor';
import FormEditorModal from './FormEditorModal';
import flowableModdle from '../flowable-moddle.json';
import SaveProcessModal from './SaveProcessModal';
// import { Background } from 'reactflow';

const BpmnDiagram = () => {
  const canvasRef = useRef(null);
  const bpmnModelerRef = useRef(null);
  const { id } = useParams(); // Get design ID from URL
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [fileName, setFileName] = useState('untitled.bpmn');
  const [isDirty, setIsDirty] = useState(false);
  const [activeTool, setActiveTool] = useState('select');
  const [selectedElement, setSelectedElement] = useState(null);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [xmlContent, setXmlContent] = useState('');
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const fileNameInputRef = useRef(null);
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [tempFileName, setTempFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDesignId, setCurrentDesignId] = useState(null);
  const [designData, setDesignData] = useState(null);
  const [selectedFormField, setSelectedFormField] = useState(null);
  const [bpmnXml, setBpmnXml] = useState(null);
  const didFetchRef = useRef(false);
  const [diagramData, setDiagramData] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const API_BASE = '/api';


  const [elementCounts, setElementCounts] = useState({
    totalElements: 0,
    tasks: 0,
    events: 0,
    gateways: 0,
    flows: 0,
    artifacts: 0,
    swimlanes: 0
  });
  const [expandedCategories, setExpandedCategories] = useState({
    events: true,
    activities: false,
    gateways: false,
    data: false,
    swimlanes: false,
    artifacts: false
  });
  const formProperties = useRef({
    name: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'medium',
    formFields: []
  });

  // Enhanced element definitions with tree structure
  const elementTree = {
    events: {
      label: 'Events',
      icon: '⚡',
      expanded: expandedCategories.events,
      elements: [
        {
          type: 'bpmn:StartEvent',
          label: 'Start Event',
          icon: '○',
          description: 'Start of the process',
          subtype: 'start',
          bgcolor:'#ffc10736'
        },
        {
          type: 'bpmn:EndEvent',
          label: 'End Event',
          icon: '●',
          description: 'End of the process',
          subtype: 'end',
          bgcolor:'#ffc10736'
        },
        {
          type: 'bpmn:IntermediateThrowEvent',
          label: 'Intermediate Event',
          icon: '◉',
          description: 'Event between start and end',
          subtype: 'intermediate',
          bgcolor:'#ffc10736'
        },
        {
          type: 'bpmn:BoundaryEvent',
          label: 'Boundary Event',
          icon: '⭕',
          description: 'Event attached to activity boundary',
          subtype: 'boundary',
          bgcolor:'#ffc10736'
        }
      ]
    },
    activities: {
      label: 'Activities',
      icon: '📋',
      expanded: expandedCategories.activities,
      elements: [
        {
          type: 'bpmn:Task',
          label: 'Task',
          icon: '▭',
          description: 'Generic task or activity',
          subtype: 'task',
          bgcolor:'#cddc3942'
        },
        {
          type: 'bpmn:UserTask',
          label: 'User Task',
          icon: '👤',
          description: 'Task performed by a user',
          subtype: 'userTask',
          bgcolor:'#cddc3942'
        },
        {
          type: 'bpmn:ServiceTask',
          label: 'Service Task',
          icon: '⚙️',
          description: 'Task performed by a service',
          subtype: 'serviceTask',
          bgcolor:'#cddc3942'
        },
        {
          type: 'bpmn:ScriptTask',
          label: 'Script Task',
          icon: '📜',
          description: 'Task executed by a script',
          subtype: 'scriptTask',
          bgcolor:'#cddc3942'
        },
        {
          type: 'bpmn:BusinessRuleTask',
          label: 'Business Rule Task',
          icon: '⚖️',
          description: 'Task evaluating business rules',
          subtype: 'businessRuleTask',
          bgcolor:'#cddc3942'
        },
        {
          type: 'bpmn:SubProcess',
          label: 'Sub-Process',
          icon: '▣',
          description: 'Embedded sub-process',
          subtype: 'subProcess',
          bgcolor:'#cddc3942'
        },
        {
          type: 'bpmn:CallActivity',
          label: 'Call Activity',
          icon: '📞',
          description: 'Reusable process call',
          subtype: 'callActivity',
          bgcolor:'#cddc3942'
        }
      ]
    },
    gateways: {
      label: 'Gateways',
      icon: '🔀',
      expanded: expandedCategories.gateways,
      elements: [
        {
          type: 'bpmn:ExclusiveGateway',
          label: 'Exclusive Gateway',
          icon: '◇',
          description: 'Decision point (XOR)',
          subtype: 'exclusive',
          bgcolor:'#9c27b029'
        },
        {
          type: 'bpmn:ParallelGateway',
          label: 'Parallel Gateway',
          icon: '◇+',
          description: 'Parallel execution (AND)',
          subtype: 'parallel',
          bgcolor:'#9c27b029'
        },
        {
          type: 'bpmn:InclusiveGateway',
          label: 'Inclusive Gateway',
          icon: '◇○',
          description: 'Multiple paths (OR)',
          subtype: 'inclusive',
          bgcolor:'#9c27b029'
        },
        {
          type: 'bpmn:EventBasedGateway',
          label: 'Event-Based Gateway',
          icon: '◇⚡',
          description: 'Event-driven decisions',
          subtype: 'eventBased',
          bgcolor:'#9c27b029'
        }
      ]
    },
    data: {
      label: 'Data & Messages',
      icon: '📊',
      expanded: expandedCategories.data,
      elements: [
        {
          type: 'bpmn:DataObjectReference',
          label: 'Data Object',
          icon: '📄',
          description: 'Data input/output',
          subtype: 'dataObject'
        },
        {
          type: 'bpmn:DataStoreReference',
          label: 'Data Store',
          icon: '💾',
          description: 'Persistent data storage',
          subtype: 'dataStore'
        },
        {
          type: 'bpmn:MessageEventDefinition',
          label: 'Message Event',
          icon: '✉️',
          description: 'Message sending/receiving',
          subtype: 'messageEvent'
        }
      ]
    },
    swimlanes: {
      label: 'Swimlanes & Pools',
      icon: '🏊',
      expanded: expandedCategories.swimlanes,
      elements: [
        {
          type: 'bpmn:Participant',
          label: 'Pool',
          icon: '🏊‍♂️',
          description: 'Process participant pool',
          subtype: 'pool',
          isSwimlane: true
        },
        {
          type: 'bpmn:Lane',
          label: 'Lane',
          icon: '➖',
          description: 'Swimlane within a pool',
          subtype: 'lane',
          isSwimlane: true
        }
      ]
    },
    artifacts: {
      label: 'Artifacts',
      icon: '📎',
      expanded: expandedCategories.artifacts,
      elements: [
        {
          type: 'bpmn:TextAnnotation',
          label: 'Text Annotation',
          icon: '📝',
          description: 'Additional information',
          subtype: 'textAnnotation'
        },
        {
          type: 'bpmn:Group',
          label: 'Group',
          icon: '📦',
          description: 'Visual grouping of elements',
          subtype: 'group'
        }
      ]
    }
  };

  // Add color configuration at the top of the component
const colorConfig = {
    userTask: {
      fill: '#d1fae5', // Light green
      stroke: '#059669', // Dark green
      text: '#065f46' // Dark green text
    },
    systemTask: {
      fill: '#fed7aa', // Light orange
      stroke: '#ea580c', // Dark orange
      text: '#9a3412' // Dark orange text
    },
    serviceTask: {
      fill: '#fef3c7', // Light yellow
      stroke: '#d97706', // Dark yellow
      text: '#92400e' // Dark yellow text
    },
    scriptTask: {
      fill: '#e0e7ff', // Light indigo
      stroke: '#4f46e5', // Dark indigo
      text: '#3730a3' // Dark indigo text
    },
    businessRuleTask: {
      fill: '#fce7f3', // Light pink
      stroke: '#db2777', // Dark pink
      text: '#9d174d' // Dark pink text
    },
    swimlane: {
      fill: '#dbeafe', // Light blue
      stroke: '#2563eb', // Dark blue
      text: '#1e40af' // Dark blue text
    },
    pool: {
      fill: '#e0f2fe', // Light sky blue
      stroke: '#0369a1', // Dark sky blue
      text: '#0c4a6e' // Dark sky blue text
    },
    exclusiveGateway:{
        fill: '#d79ee1', // Light sky blue
        stroke: '#9c27b0', // Dark sky blue
        text: '#9c27b0',
    },
    default: {
      fill: '#f8fafc', // Light gray
      stroke: '#64748b', // Dark gray
      text: '#374151' // Dark gray text
    }
  };


   // Filename editing functions
   const startEditingFileName = () => {
    setTempFileName(fileName.replace('.bpmn', ''));
    setIsEditingFileName(true);
  };

  const handleFileNameChange = (e) => {
    setTempFileName(e.target.value);
  };

  const saveFileName = () => {
    if (tempFileName.trim()) {
      const newFileName = tempFileName.trim().endsWith('.bpmn') 
        ? tempFileName.trim() 
        : `${tempFileName.trim()}.bpmn`;
      setFileName(newFileName);
    }
    setIsEditingFileName(false);
  };

  const handleFileNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveFileName();
    } else if (e.key === 'Escape') {
      setTempFileName(fileName.replace('.bpmn', ''));
      setIsEditingFileName(false);
    }
  };

  const handleFileNameBlur = () => {
    saveFileName();
  };


  //save modal
  const openSaveModal = () => {
    setShowSaveModal(true);
  };


  const closeSaveModal = () => {
    setShowSaveModal(false);
  };

  // Example save handler for modal
  const handleSaveModal = async () => {
    try {
      // You may wish to customize this part for your backend or save logic
      const { xml } = await bpmnModelerRef.current.saveXML({ format: true });
      // ... Save logic here (API call, etc.)
      setIsDirty(false);
      closeSaveModal();
      // Optionally give user feedback here
    } catch (err) {
      console.error('Error saving from modal:', err);
      // Optionally handle error in modal context
    }
  };


  // Focus input when editing starts
  useEffect(() => {
    if (isEditingFileName && fileNameInputRef.current) {
      fileNameInputRef.current.focus();
      fileNameInputRef.current.select();
    }
  }, [isEditingFileName]);


  useEffect(() => {
    if (didFetchRef.current) return;  // prevent running twice
    didFetchRef.current = true;

    initializeModeler();
    if (id && bpmnModelerRef.current) {            
        getDesign(id);      
    } else if (!id) {
        loadDefaultDiagram();
    }

}, []);

useEffect(() => {
    loadDiagram()
}, [diagramData]);


  const loadDefaultDiagram = () => {
            
    const defaultBpmnXml = `
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

    loadDiagram(defaultBpmnXml);
    // setFileName('new-diagram.bpmn');
    setLoading(false);
  };


  const loadDiagram =  async () => {
    try {               
        
    if (diagramData && bpmnModelerRef.current) {      

         await  bpmnModelerRef.current.importXML(diagramData.xml_content);
         const canvas = bpmnModelerRef.current.get("canvas");
         canvas.zoom("fit-viewport");         

         setIsLoaded(true)

        // Apply colors and count elements after diagram is loaded
        // setTimeout(() => {
        // applyElementColors();
        // countElements();
        // }, 500);
    }
    } catch (err) {
      console.error('Error loading BPMN diagram:', err);
    }
  };


  const initializeModeler = () => {
    bpmnModelerRef.current = new BpmnModeler({
      container: canvasRef.current,
      keyboard: {
        bindTo: document
      }
    });

    bpmnModelerRef.current.on('commandStack.shape.create.postExecute', function (event) {
        setTimeout(() => {
            applyElementColors();
            countElements(); // Update counts on any change
          }, 50);
    })

    // Event listeners
    bpmnModelerRef.current.on('commandStack.changed', (event) => {
        setTimeout(() => {
            countElements(); // Update counts on any change
          }, 50);
      setIsDirty(true);      
     });

    bpmnModelerRef.current.on('element.click', (event) => {
      const element = event.element;
      setSelectedElement(element);
      
      if (element.type === 'bpmn:Task') {
        const businessObject = element.businessObject;
        const storedProperties = businessObject.get('formProperties');
        
        if (storedProperties) {
          formProperties.current = JSON.parse(storedProperties);
        } else {
          formProperties.current = {
            name: businessObject.name || '',
            description: businessObject.documentation?.[0]?.text || '',
            assignee: '',
            dueDate: '',
            priority: 'medium',
            formFields: []
          };
        }
      }
    });
    
    return () => {
      if (bpmnModelerRef.current) {
        bpmnModelerRef.current.destroy();
      }
    };
  };


// Zoom Functions
const zoomIn = () => {
    if (!bpmnModelerRef.current) return;
    
    const canvas = bpmnModelerRef.current.get('canvas');
    const currentZoom = canvas.zoom();
    const newZoom = Math.min(currentZoom * 1.2, 3.0); // Max zoom 300%
    canvas.zoom(newZoom);
    };

    const zoomOut = () => {
    if (!bpmnModelerRef.current) return;
    
    const canvas = bpmnModelerRef.current.get('canvas');
    const currentZoom = canvas.zoom();
    const newZoom = Math.max(currentZoom / 1.2, 0.2); // Min zoom 20%
    canvas.zoom(newZoom);
    };

    const zoomToFit = () => {
    if (!bpmnModelerRef.current) return;
    
    const canvas = bpmnModelerRef.current.get('canvas');
    canvas.zoom('fit-viewport');
    };

    const resetZoom = () => {
    if (!bpmnModelerRef.current) return;
    
    const canvas = bpmnModelerRef.current.get('canvas');
    canvas.zoom(1.0);
    };

    // Sidebar Toggle Functions
    const toggleLeftSidebar = () => {
    setShowLeftSidebar(!showLeftSidebar);
    };

    const toggleRightSidebar = () => {
    setShowRightSidebar(!showRightSidebar);
    };

    // Add function to count elements
const countElements = () => {
    if (!bpmnModelerRef.current) return;
  
    const elementRegistry = bpmnModelerRef.current.get('elementRegistry');
    let counts = {
      totalElements: 0,
      tasks: 0,
      events: 0,
      gateways: 0,
      flows: 0,
      artifacts: 0,
      swimlanes: 0
    };
  
    elementRegistry.forEach((element) => {
      if (element.hidden) return;
      
      counts.totalElements++;
      
      const elementType = element.type;
      
      if (elementType.includes('Task') || elementType.includes('SubProcess') || elementType.includes('CallActivity')) {
        counts.tasks++;
      } else if (elementType.includes('Event')) {
        counts.events++;
      } else if (elementType.includes('Gateway')) {
        counts.gateways++;
      } else if (elementType.includes('SequenceFlow') || elementType.includes('MessageFlow') || elementType.includes('Association')) {
        counts.flows++;
      } else if (elementType.includes('DataObject') || elementType.includes('DataStore') || elementType.includes('TextAnnotation') || elementType.includes('Group')) {
        counts.artifacts++;
      } else if (elementType.includes('Participant') || elementType.includes('Lane')) {
        counts.swimlanes++;
      }
    });
  
    setElementCounts(counts);
  };

  // Add color application functions
const applyElementColors = () => {
    if (!bpmnModelerRef.current) return;
  
    const elementRegistry = bpmnModelerRef.current.get('elementRegistry');
    const modeling = bpmnModelerRef.current.get('modeling');
    
    elementRegistry.forEach((element) => {
      applyElementColor(element);
    });
  };
  
  const applyElementColor = (element) => {
    if (!bpmnModelerRef.current) return;
  
    const modeling = bpmnModelerRef.current.get('modeling');
    const elementRegistry = bpmnModelerRef.current.get('elementRegistry');

    try {
      let colors = colorConfig.default;      
      //   console.log(element.type)
      // Determine element type and apply appropriate colors
      if (element.type === 'bpmn:UserTask') {
        colors = colorConfig.userTask;
      } else if (element.type === 'bpmn:ServiceTask') {
        colors = colorConfig.systemTask;
      } else if (element.type === 'bpmn:ScriptTask') {
        colors = colorConfig.scriptTask;
      } else if (element.type === 'bpmn:BusinessRuleTask') {
        colors = colorConfig.businessRuleTask;
      } else if (element.type === 'bpmn:Participant') {
        colors = colorConfig.pool;
      }else if (element.type === 'bpmn:ExclusiveGateway'){
        colors = colorConfig.exclusiveGateway;
      } else if (element.type === 'bpmn:Lane') {
        colors = colorConfig.swimlane;
      } else if (element.type === 'bpmn:Task') {
        // Check if it's a regular task that should be colored based on name or other properties
        const businessObject = element.businessObject;
        const taskName = businessObject.name || '';
        
        if (taskName.toLowerCase().includes('user')) {
          colors = colorConfig.userTask;
        } else if (taskName.toLowerCase().includes('system') || taskName.toLowerCase().includes('service')) {
          colors = colorConfig.systemTask;
        }
      } 
      
      // Apply colors using modeling service
      modeling.setColor(element, {
        fill: colors.fill,
        stroke: colors.stroke
      });
      
    } catch (error) {
      console.log('Could not apply colors to element:', element.id, error);
    }
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };


  // Drag and Drop Handlers
  const handleDragStart = (event, elementType, isSwimlane = false) => {
    setDraggedElement({ type: elementType, isSwimlane });
    event.dataTransfer.setData('text/plain', elementType);
    event.dataTransfer.setData('application/swimlane', isSwimlane.toString());
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOverCanvas(true);
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = () => {
    setDragOverCanvas(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragOverCanvas(false);

    
    const elementType = event.dataTransfer.getData('text/plain') || draggedElement?.type;
    const isSwimlane = event.dataTransfer.getData('application/swimlane') === 'true' || draggedElement?.isSwimlane;
    
    if (!elementType) return;

    try {
      const canvas = bpmnModelerRef.current.get('canvas');
      const elementFactory = bpmnModelerRef.current.get('elementFactory');
      const modeling = bpmnModelerRef.current.get('modeling');
      const bpmnFactory = bpmnModelerRef.current.get('bpmnFactory');
 
      
      // Get drop position relative to canvas
      const canvasBounds = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - canvasBounds.left;
      const y = event.clientY - canvasBounds.top;
      
      if (isSwimlane) {
        await handleSwimlaneDrop(elementType, x, y);
      } else {
        // Create regular element
        const shape = elementFactory.createShape({ 
          type: elementType 
        });
        
        // Add element to canvas at drop position
        modeling.createShape(shape, { x, y }, canvas.getRootElement());

      // Apply colors after creation
      setTimeout(() => {
        applyElementColors();
      }, 1);
      }
      
      setIsDirty(true);
      
    } catch (error) {
      console.error('Error creating element:', error);
    }
  };

  const handleSwimlaneDrop = async (elementType, x, y) => {
    try {
      const canvas = bpmnModelerRef.current.get('canvas');
      const elementFactory = bpmnModelerRef.current.get('elementFactory');
      const modeling = bpmnModelerRef.current.get('modeling');
      const bpmnFactory = bpmnModelerRef.current.get('bpmnFactory');
      const elementRegistry = bpmnModelerRef.current.get('elementRegistry');
      
      const rootElement = canvas.getRootElement();
      const definitions = rootElement.businessObject.$parent;
      
      if (elementType === 'bpmn:Participant') {
        // Create a new participant (pool)
        const participantBusinessObject = bpmnFactory.create('bpmn:Participant');
        participantBusinessObject.name = 'New Participant';
        participantBusinessObject.processRef = bpmnFactory.create('bpmn:Process');
        participantBusinessObject.processRef.id = `Process_${Date.now()}`;
        
        definitions.rootElements.push(participantBusinessObject.processRef);
        definitions.rootElements.push(participantBusinessObject);
        
        const participantShape = elementFactory.createShape({
          type: 'bpmn:Participant',
          businessObject: participantBusinessObject
        });
        
        modeling.createShape(participantShape, { x: x - 200, y: y - 100, width: 400, height: 300 }, rootElement);
        
      } else if (elementType === 'bpmn:Lane') {
        // Find an existing participant to add lane to
        const participants = elementRegistry.filter(element => 
          element.type === 'bpmn:Participant'
        );
        
        if (participants.length > 0) {
          const participant = participants[0];
          const participantBo = participant.businessObject;
          
          if (!participantBo.processRef.laneSets) {
            participantBo.processRef.laneSets = [bpmnFactory.create('bpmn:LaneSet')];
          }
          
          const laneSet = participantBo.processRef.laneSets[0];
          const lane = bpmnFactory.create('bpmn:Lane');
          lane.name = 'New Lane';
          laneSet.lanes = laneSet.lanes || [];
          laneSet.lanes.push(lane);
          
          // Create lane shape
          const laneShape = elementFactory.createShape({
            type: 'bpmn:Lane',
            businessObject: lane
          });
          
          modeling.createShape(laneShape, { x, y, width: 400, height: 100 }, participant);
        } else {
          alert('Please create a Pool first before adding Lanes.');
        }
      }
      
    } catch (error) {
      console.error('Error creating swimlane:', error);
      alert('Error creating swimlane. Please check the console for details.');
    }
  };

  // Quick add element
  const quickAddElement = (elementType) => {
    if (!bpmnModelerRef.current) return;

    try {
      const canvas = bpmnModelerRef.current.get('canvas');
      const elementFactory = bpmnModelerRef.current.get('elementFactory');
      const modeling = bpmnModelerRef.current.get('modeling');
      
      // Map quick add types to actual BPMN types
      const typeMap = {
        'start': 'bpmn:StartEvent',
        'end': 'bpmn:EndEvent',
        'task': 'bpmn:Task',
        'userTask': 'bpmn:UserTask',
        'serviceTask': 'bpmn:ServiceTask',
        'scriptTask': 'bpmn:ScriptTask',
        'businessRuleTask': 'bpmn:BusinessRuleTask',
        'subProcess': 'bpmn:SubProcess',
        'callActivity': 'bpmn:CallActivity',
        'gateway': 'bpmn:ExclusiveGateway',
        'exclusive': 'bpmn:ExclusiveGateway',
        'parallel': 'bpmn:ParallelGateway',
        'inclusive': 'bpmn:InclusiveGateway',
        'eventBased': 'bpmn:EventBasedGateway',
        'dataObject': 'bpmn:DataObjectReference',
        'dataStore': 'bpmn:DataStoreReference',
        'textAnnotation': 'bpmn:TextAnnotation',
        'group': 'bpmn:Group',
        'pool': 'bpmn:Participant',
        'lane': 'bpmn:Lane'
      };

      const bpmnType = typeMap[elementType] || elementType;
      
      if (elementType === 'pool' || elementType === 'lane') {
        // Handle swimlane elements
        const viewbox = canvas.viewbox();
        const centerX = viewbox.x + viewbox.width / 2;
        const centerY = viewbox.y + viewbox.height / 2;
        handleSwimlaneDrop(bpmnType, centerX, centerY);
      } else {
        // Handle regular elements
        const shape = elementFactory.createShape({ 
          type: bpmnType 
        });
        
        // Add to center of visible area
        const viewbox = canvas.viewbox();
        const centerX = viewbox.x + viewbox.width / 2;
        const centerY = viewbox.y + viewbox.height / 2;
        
        modeling.createShape(shape, { x: centerX, y: centerY }, canvas.getRootElement());
      }
      
      setIsDirty(true);
      
    } catch (error) {
      console.error('Error creating element:', error);
    }
  };

  // Rest of the existing methods remain the same...
  const saveToFile = async () => {
    try {
      const { xml } = await bpmnModelerRef.current.saveXML({ format: true });
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsDirty(false);
    } catch (err) {
      console.error('Error saving BPMN diagram:', err);
    }
  };

  const loadFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        loadDiagram(e.target.result);
        setFileName(file.name);
      } catch (err) {
        console.error('Error loading BPMN diagram from file:', err);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const triggerFileInput = () => {
    document.getElementById('bpmn-file-input').click();
  };

  const createNewDiagram = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to create a new diagram?')) {
      return;
    }

    const newBpmnXml = `
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

    loadDiagram(newBpmnXml);
    setFileName('untitled.bpmn');
    // setFlowCount(0);
    // setElementCount( 1);
  };

  const exportAsSVG = async () => {
    try {
      const { svg } = await bpmnModelerRef.current.saveSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });      
      const url = URL.createObjectURL(blob);      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.replace('.bpmn', '.svg');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting SVG:', err);
    }
  };

  const showXmlPreview = async () => {
    try {
      const { xml } = await bpmnModelerRef.current.saveXML({ format: true });
      setXmlContent(xml);
      setShowXmlModal(true);
    } catch (err) {
      console.error('Error generating XML preview:', err);
      alert('Error generating XML preview. Please check the console for details.');
    }
  };

  const openPropertiesModal = () => {
    
    if (selectedElement && selectedElement.type === 'bpmn:Task') {
      setShowPropertiesModal(true);
    }
  };

  const closePropertiesModal = () => {    
    setShowPropertiesModal(false);
  };

  const closeXmlModal = () => {
    setShowXmlModal(false);
  };

  const copyXmlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent);
      alert('XML copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy XML:', err);
      alert('Failed to copy XML to clipboard.');
    }
  };

  const downloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Add these functions to your existing BpmnDiagram component

const saveDesignToDB = async (designData) => {
    try {
      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(designData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save design');
      }
  
      const savedDesign = await response.json();
      alert('Design saved successfully!');
      return savedDesign;
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design');
      throw error;
    }
  };
  
  const updateDesignInDB = async (updatedModelFields) => {
    try {

        const { xml } = await bpmnModelerRef.current.saveXML({ format: true });
        const thumbnail = await generateThumbnail();        

        const payload = {
            ...updatedModelFields,
            xml_content: xml,
            version: 1,
            version_number: 1,
            // Optionally copy thumbnail and tags from original if desired
            thumbnail: thumbnail ? thumbnail : '' ,
            tags: Array.isArray(updatedModelFields.tags)
              ? updatedModelFields.tags
              : (diagramData?.tags || []),
          };

      const response = await fetch(`/api/design/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update design');
      }
      closeSaveModal();
  
      const updatedDesign = await response.json();
      alert('Design updated successfully!');
      return updatedDesign;
    } catch (error) {
      console.error('Error updating design:', error);
      alert('Failed to update design');
      throw error;
    }
  };

  async function getDesign(designId) {

    setLoading(true);
    setError(null);

    const response = await fetch(`${API_BASE}/designs/${designId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json(); // assuming the response is JSON
    setDiagramData(data);
    setLoading(false);
    // console.log(data)
    if (data) {
        setFileName(data.name)
    }

    return data;
  }

  const loadDesignFromDB = async (designId) => {
    try {
      setLoading(true);
      setError(null);

      console.log("loadDesignFromDB")
     //   const response = fetch(`${API_BASE}/designs/${designId}`);
   
     const data = await getDesign(designId);
     console.log(data)

     loadDiagram(data.xml_content);

     
      // Update form properties from design data
      formProperties.current = {
        ...formProperties.current,
        name: data.name,
        description: data.description || ''
      };
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading design from DB:', err);
      setError(err.message);
      setLoading(false);
      
      // Fallback to default diagram
      loadDefaultDiagram();
    }
  };

  // Add save functionality to your header
const handleSave = async () => {
    try {
      const { xml } = await bpmnModelerRef.current.saveXML({ format: true });
      
      // Generate thumbnail (simplified - in real app, generate SVG and convert to base64)
      const thumbnail = await generateThumbnail();
      
      const designData = {
        name: fileName,
        description: formProperties.current.description,
        xml_content: xml,
        thumbnail: thumbnail,
        tags: ['bpmn', 'process']
      };
  
      await saveDesignToDB(designData);

    //   if (isEditingExisting) { // You'll need to track if editing existing design
    //     await updateDesignInDB(currentDesignId, designData);
    //   } else {
    //     await saveDesignToDB(designData);
    //   }
      
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving design:', error);
    }
  };

  const handleBackToGrid = () => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    navigate('/designs');
  };

  const handleFormPropertyChange = (field, value) => {
    formProperties.current = {
      ...formProperties.current,
      [field]: value
    };
  };

  const handleFormFieldChange = (index, field, value) => {
    const updatedFields = [...formProperties.current.formFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [field]: value
    };
    formProperties.current = {
      ...formProperties.current,
      formFields: updatedFields
    };
  };

  const addFormField = () => {
    formProperties.current = {
      ...formProperties.current,
      formFields: [
        ...formProperties.current.formFields,
        {
          id: `field_${Date.now()}`,
          label: '',
          type: 'text',
          required: false,
          placeholder: ''
        }
      ]
    };
  };

  const removeFormField = (index) => {
    formProperties.current = {
      ...formProperties.current,
      formFields: formProperties.current.formFields.filter((_, i) => i !== index)
    };
  };


  const handleSaveFormProperties = async (properties) => {
    const modeler = bpmnModelerRef.current;
    const elementRegistry = modeler.get('elementRegistry');
    const modeling = modeler.get('modeling');
    const moddle = modeler.get('moddle');

    const userTask = elementRegistry.get('Task_1');


    const formProps = properties.map((prop) =>
      moddle.create('flowable:FormProperty', {
        id: prop.id,
        name: prop.name,
        type: prop.type,
        ...(prop.type === 'date' && prop.datePattern ? { datePattern: prop.datePattern } : {})
      })
    );

    const extensionElements = moddle.create('bpmn:ExtensionElements', {
      values: formProps
    });

    modeling.updateProperties(userTask, {
      extensionElements
    });

    // Optional: export updated BPMN
    const { xml } = await modeler.saveXML({ format: true });
    console.log('Updated BPMN XML:\n', xml);
  };

  const saveFormProperties = () => {
    if (selectedElement) {
      const modeling = bpmnModelerRef.current.get('modeling');
      const elementRegistry = bpmnModelerRef.current.get('elementRegistry');
      
      // Update task name
      if (formProperties.current.name) {
        modeling.updateLabel(selectedElement, formProperties.current.name);
      }

      // Store form properties in the business object
      const businessObject = selectedElement.businessObject;
      businessObject.set('formProperties', JSON.stringify(formProperties.current));

      setIsDirty(true);
      closePropertiesModal();
    }
  };

  const getSelectedElementInfo = () => {
    if (!selectedElement) return null;
    
    return {
      id: selectedElement.id,
      type: selectedElement.type,
      name: selectedElement.businessObject?.name || 'Unnamed',
      canHaveForm: selectedElement.type === 'bpmn:Task'
    };
  };

  const selectedElementInfo = getSelectedElementInfo();

  // Render tree node for element categories
  const renderCategory = (categoryKey, categoryData) => (
    <div key={categoryKey} className="tree-category">
      <div 
        className="category-header"
        onClick={() => toggleCategory(categoryKey)}
      >
        <div className="category-title">
          <span className="category-icon">{categoryData.icon}</span>
          <span className="category-label">{categoryData.label}</span>
        </div>
        <div className="category-toggle">
          {categoryData.expanded ? '▼' : '►'}
        </div>
      </div>
      
      {categoryData.expanded && (
        <div className="category-content">
          {categoryData.elements.map((element) => (
            <div
              key={element.type}
              className="element-btn draggable"
              style={{ backgroundColor: element.bgcolor}}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, element.type, element.isSwimlane)}
              title={element.description}
            >
              <div className="element-icon" style={{ backgroundColor: element.bgcolor}}>{element.icon}</div>
              <span className="element-label">{element.label}</span>
              {element.isSwimlane && <span className="swimlane-badge">🏊</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );


  const handlePropertyChange = (property, value) => {
    if (selectedElement) {
      const modeling = bpmnModelerRef.current.get('modeling');
      
      switch (property) {
        case 'id':
          modeling.updateProperties(selectedElement, { id: value });
          break;
        case 'name':
          modeling.updateLabel(selectedElement, value);
          formProperties.current.name = value;
          break;
        default:
          break;
      }
      
      setIsDirty(true);
    }
  };
  
  const renderFieldPreview = (field) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder || `Enter ${field.label || 'value'}`}
            className="preview-input"
            readOnly={field.readonly}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="preview-input"
            readOnly={field.readonly}
          />
        );
      case 'datetime':
        return (
          <input
            type="datetime-local"
            className="preview-input"
            readOnly={field.readonly}
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || `Enter ${field.label || 'value'}`}
            className="preview-textarea"
            rows="3"
            readOnly={field.readonly}
          />
        );
      case 'select':
        return (
          <select className="preview-select">
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options && field.options.split(',').map((option, idx) => (
              <option key={idx} value={option.trim()}>
                {option.trim()}
              </option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="preview-radio-group">
            {field.options && field.options.split(',').map((option, idx) => (
              <label key={idx} className="preview-radio-label">
                <input type="radio" name={`radio_${field.id}`} />
                <span>{option.trim()}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="preview-checkbox-label">
            <input type="checkbox" />
            <span>{field.placeholder || 'Check this option'}</span>
          </label>
        );
      case 'file':
        return (
          <input
            type="file"
            className="preview-file"
          />
        );
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder || `Enter ${field.label || 'value'}`}
            className="preview-input"
          />
        );
    }
  };

  // Add helper function to get selected field
  const getSelectedField = () => {
    return formProperties.current.formFields.find(field => field.id === selectedFormField);
  };

//   const generateThumbnail = async () => {
//     try {
//       const canvas = bpmnModelerRef.current.get('canvas');
//       const viewbox = canvas.viewbox();
      
//       // Create a simplified SVG representation of the diagram
//       const svgContent = `
//         <svg width="300" height="200" viewBox="${viewbox.x} ${viewbox.y} ${viewbox.width} ${viewbox.height}" xmlns="http://www.w3.org/2000/svg">
//           <!-- Add your BPMN elements here -->
//           <rect x="${viewbox.x}" y="${viewbox.y}" width="${viewbox.width}" height="${viewbox.height}" fill="#f8fafc"/>
//           <!-- This is a simplified version - you'd need to extract actual shapes from the diagram -->
//           <text x="${viewbox.x + viewbox.width/2}" y="${viewbox.y + viewbox.height/2}" text-anchor="middle" fill="#374151" font-family="Arial" font-size="14">BPMN Diagram</text>
//         </svg>
//       `;
  
//       // Convert SVG to base64
//       const base64Thumbnail = `data:image/svg+xml;base64,${btoa(svgContent)}`;
//       return base64Thumbnail;
//     } catch (error) {
//       console.error('Error generating thumbnail:', error);
//       return null;
//     }
//   };
  

  const generateThumbnail = async () => {
    try {
      // Use bpmn-js saveSVG to get the actual diagram SVG
      const { svg } = await bpmnModelerRef.current.saveSVG();
      
      // Create a thumbnail version of the SVG
      const thumbnailSvg = await createThumbnailSvg(svg);
      
      // Convert to base64 data URL
      const base64Thumbnail = `data:image/svg+xml;base64,${btoa(thumbnailSvg)}`;
      return base64Thumbnail;
    } catch (error) {
      console.error('Error generating thumbnail from SVG:', error);
      // Fallback to a simple thumbnail
      return generateFallbackThumbnail();
    }
  };
  
  const createThumbnailSvg = async (originalSvg) => {
    try {
      // Parse the original SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(originalSvg, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      // Get the original viewBox
      const originalViewBox = svgElement.getAttribute('viewBox');
      let [x, y, width, height] = originalViewBox ? originalViewBox.split(' ').map(Number) : [0, 0, 800, 600];
      
      // Calculate aspect ratio
      const aspectRatio = width / height;
      
      // Set thumbnail dimensions
      const thumbnailWidth = 300;
      const thumbnailHeight = 200;
      
      // Calculate scaled dimensions while maintaining aspect ratio
      let scaledWidth, scaledHeight;
      if (aspectRatio > thumbnailWidth / thumbnailHeight) {
        scaledWidth = thumbnailWidth;
        scaledHeight = thumbnailWidth / aspectRatio;
      } else {
        scaledHeight = thumbnailHeight;
        scaledWidth = thumbnailHeight * aspectRatio;
      }
      
      // Calculate offsets to center the thumbnail
      const offsetX = 20 ;
    //   (thumbnailWidth - scaledWidth) / 8;
      const offsetY = 20;
    //   (thumbnailHeight - scaledHeight) / 8;
      
      // Create a new SVG for the thumbnail
      const thumbnailSvg = `
        <svg width="${thumbnailWidth}" height="${thumbnailHeight}" xmlns="http://www.w3.org/2000/svg">
    
          <rect width="100%" height="100%" fill="#f8fafc"/>
          <g transform="translate(${offsetX}, ${offsetY}) scale(${scaledWidth / (width * 1.5)})">
            ${extractMainContent(originalSvg)}
          </g>
          <!-- Add watermark -->
          <text x="10" y="${thumbnailHeight - 10}" font-family="Arial" font-size="10" fill="#9ca3af" opacity="0.6">BPMN</text>
        </svg>
      `;
      
      return thumbnailSvg;
    } catch (error) {
      console.error('Error creating thumbnail SVG:', error);
      throw error;
    }
  };

  const extractMainContent = (svgContent) => {
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      
      // Remove unwanted elements for thumbnail
      const elementsToRemove = [
        '.djs-overlay',
        '.djs-segment-dragger',
        '.djs-bendpoint',
        '.djs-outline',
        '.djs-hit'
      ];
      
      elementsToRemove.forEach(selector => {
        const elements = svgDoc.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      
      // Get the BPMN plane content
      const plane = svgDoc.querySelector('[data-container-id]');
      if (plane) {
        return plane.innerHTML;
      }
      
      // Fallback: get all shapes and connections
      const shapes = svgDoc.querySelectorAll('.djs-shape, .djs-connection');
      let content = '';
      shapes.forEach(shape => {
        content += shape.outerHTML;
      });
      
      return content || '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="14" fill="#666">BPMN Diagram</text>';
    } catch (error) {
      console.error('Error extracting SVG content:', error);
      return '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="14" fill="#666">BPMN Diagram</text>';
    }
  };
  

  const generateFallbackThumbnail = () => {
    // Create a simple fallback thumbnail with gradient background    
    const canvas = bpmnModelerRef.current.get('canvas');
    const viewbox = canvas.viewbox();

    const fallbackSvg = `<svg width="150px" height="150px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285f4" d="M19.5,20.06h-.7v-1.5h.7a.76.76,0,0,0,.75-.75V13.5a.76.76,0,0,0-.75-.75H15.89v-1.5H19.5a2.25,2.25,0,0,1,2.25,2.25v4.31A2.25,2.25,0,0,1,19.5,20.06Z"/><path fill="#4285f4" d="M11.55,20.06H6.65v-1.5h4.9Z"/><path fill="#669df6" fill-rule="evenodd" d="M8.12,12.75H4.5A2.25,2.25,0,0,1,2.25,10.5V6.19A2.25,2.25,0,0,1,4.5,3.94h1v1.5h-1a.75.75,0,0,0-.75.75V10.5a.76.76,0,0,0,.75.75H8.12Z"/><path fill="#4285f4" d="M17.3,5.44H11.82V3.94H17.3Z"/><path fill="#aecbfa" d="M8.63,3.94V2.44h-3A1.13,1.13,0,0,0,4.5,3.56V5.81A1.13,1.13,0,0,0,5.63,6.94h3V5.44H6V3.94Z"/><path fill="#669df6" fill-rule="evenodd" d="M12.75,3.56V5.81a1.13,1.13,0,0,1-1.12,1.13h-3V5.44h2.62V3.94H8.63V2.44h3A1.12,1.12,0,0,1,12.75,3.56Z"/><path fill="#aecbfa" d="M19.31,7.13a2.44,2.44,0,1,1,2.44-2.44A2.45,2.45,0,0,1,19.31,7.13Zm0-3.38a.94.94,0,1,0,.94.94A.94.94,0,0,0,19.31,3.75Z"/><path fill="#9aa0a6" d="M4.69,21.75a2.44,2.44,0,1,1,2.43-2.44A2.44,2.44,0,0,1,4.69,21.75Zm0-3.38a.94.94,0,1,0,.93.94A.94.94,0,0,0,4.69,18.37Z"/><path fill="#aecbfa" d="M4.69,21.75a2.44,2.44,0,1,1,2.43-2.44A2.44,2.44,0,0,1,4.69,21.75Zm0-3.38a.94.94,0,1,0,.93.94A.94.94,0,0,0,4.69,18.37Z"/><path fill="#aecbfa" d="M15.36,18.57v-1.5h-3a1.13,1.13,0,0,0-1.12,1.13v2.25a1.12,1.12,0,0,0,1.12,1.12h3v-1.5H12.74v-1.5Z"/><path fill="#669df6" fill-rule="evenodd" d="M19.49,18.2v2.25a1.13,1.13,0,0,1-1.13,1.12h-3v-1.5H18v-1.5H15.36v-1.5h3A1.14,1.14,0,0,1,19.49,18.2Z"/><path fill="#aecbfa" d="M12,11.25V9.75H9a1.13,1.13,0,0,0-1.13,1.12v2.25A1.13,1.13,0,0,0,9,14.25h3v-1.5H9.37v-1.5Z"/><path fill="#669df6" fill-rule="evenodd" d="M16.12,10.87v2.25A1.13,1.13,0,0,1,15,14.25H12v-1.5h2.62v-1.5H12V9.75h3A1.12,1.12,0,0,1,16.12,10.87Z"/></svg>`
    // const fallbackSvg2= `
    // <svg width="300" height="200" viewBox="${viewbox.x} ${viewbox.y} ${viewbox.width} ${viewbox.height}" xmlns="http://www.w3.org/2000/svg">
    //       <!-- Add your BPMN elements here -->
    //       <rect x="${viewbox.x}" y="${viewbox.y}" width="${viewbox.width}" height="${viewbox.height}" fill="#f8fafc"/>
    //       <!-- This is a simplified version - you'd need to extract actual shapes from the diagram -->
    //       <text x="${viewbox.x + viewbox.width/2}" y="${viewbox.y + viewbox.height/2}" text-anchor="middle" fill="#374151" font-family="Arial" font-size="72">BPMN Diagram</text>
    // </svg>
    // `;
    
    return `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;
  };

  return (
    <div className="bpmn-diagram-modern">
      {/* Compact Header */}
      <div className="bpmn-compact-header">
        <div className="header-left">
          <div className="app-icon"></div>
          {/* 📊 */}
          <div className="title-section">
            <h2>BPMN Editor</h2>
            <div className="file-status">
            {isEditingFileName ? (
            <div className="filename-editor">
                  <input
                    ref={fileNameInputRef}
                    type="text"
                    value={tempFileName}
                    onChange={handleFileNameChange}
                    onKeyDown={handleFileNameKeyPress}
                    onBlur={handleFileNameBlur}
                    className="filename-input"
                    placeholder="Enter filename"
                  />
                  <span className="file-extension">.bpmn</span>
                </div>
            ) : (
           <div 
                className="file-name-editable"
                onClick={startEditingFileName}
                title="Click to edit filename"
              >
              <span className="file-name">{fileName}</span>
              {isDirty && <span className="unsaved-dot"></span>}
            </div>
        )}
          </div>
        </div>
        </div>
        
        <div className="header-center">
          <div className="quick-tools">
            <button 
              className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
              onClick={() => setActiveTool('select')}
              title="Select Tool"
            >
              ↖️
            </button>
            <button 
              className={`tool-btn ${activeTool === 'hand' ? 'active' : ''}`}
              onClick={() => setActiveTool('hand')}
              title="Hand Tool"
            >
              ✋
            </button>
             {/* Zoom Controls */}
             <div className="zoom-controls">
              <button 
                className="tool-btn"
                onClick={zoomOut}
                title="Zoom Out"
                disabled={zoomLevel <= 0.2}
              >
                🔍-
              </button>
              <span className="zoom-level" title="Current Zoom Level">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button 
                className="tool-btn"
                onClick={zoomIn}
                title="Zoom In"
                disabled={zoomLevel >= 3.0}
              >
                🔍+
              </button>
              <button 
                className="tool-btn"
                onClick={zoomToFit}
                title="Fit to Viewport"
              >
                ⤢
              </button>
              <button 
                className="tool-btn"
                onClick={resetZoom}
                title="Reset Zoom"
              >
                1:1
              </button>
              </div>
          </div>
        </div>

        <div className="header-right">
          <div className="action-buttons">
            {/* <button className="action-btn secondary" onClick={createNewDiagram}> */}
            {/* 🆕  */}
            {/* New */}
            {/* </button> */}
            <button className="action-btn secondary" onClick={triggerFileInput} title="Open BPMN2.0 File">
            📂 
            {/* Open */}
            </button>
            <button className="action-btn secondary" onClick={saveToFile} title="Download">
            📤 
            {/* Download */}
            </button>
            <button className="action-btn secondary"  onClick={openSaveModal} title="Save Model" >
            💾  
            {/* Save */}
            </button>
            <button className="action-btn secondary" onClick={showXmlPreview} title="XML Preview">
            📄
              {/* XML Preview */}
            </button>
            <Link  to="/" title="Close Designer" className='action-btn secondary'>                
                ✖️
            </Link>
            <input
              type="file"
              id="bpmn-file-input"
              onChange={loadFromFile}
              accept=".bpmn,.xml"
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}      
      <div className={`bpmn-main-content ${!showLeftSidebar ? 'left-collapsed' : ''} ${!showRightSidebar ? 'right-collapsed' : ''}`}>

        {/* Left Sidebar - Tree Structure Palette */}
        <button 
              className="sidebar-toggle-btn left"
              onClick={toggleLeftSidebar}
              title="Show Elements Panel"
            >
             ☰
            </button>
      {showLeftSidebar && (        
        <div className="bpmn-tools-sidebar tree-sidebar">
            <div className="sidebar-header">
              <h4>BPMN Elements</h4>
              <button 
                className="sidebar-close-btn"
                onClick={toggleLeftSidebar}
                title="Close Sidebar"
              >
                ✕
              </button>
            </div>
          {/* <div className="palette-header">
            <h4>BPMN Elements</h4>
            <span className="palette-hint">Drag elements to canvas</span>
          </div> */}

          <div className="tree-container">
            {Object.entries(elementTree).map(([key, category]) => 
              renderCategory(key, category)
            )}
          </div>

          <div className="quick-actions-section">
            {/* <h4>Quick Actions</h4> */}
            <div className="quick-actions">
              <button className="element-btn quick-action" onClick={() => quickAddElement('pool')}>
                <div className="element-icon">🏊‍♂️</div>
                <span>Add Pool</span>
              </button>
              <button className="element-btn quick-action" onClick={() => quickAddElement('lane')}>
                <div className="element-icon">➖</div>
                <span>Add Lane</span>
              </button>
              <button className="element-btn quick-action export" onClick={exportAsSVG}>
                <div className="element-icon">🖼️</div>
                <span>Export SVG</span>
              </button>
            </div>
          </div>
        </div>
      )}
        {/* Canvas Area */}
        <div className={`bpmn-canvas-area ${!showLeftSidebar ? 'left-collapsed' : ''} ${!showRightSidebar ? 'right-collapsed' : ''}`}>

            {/* {!showLeftSidebar && (
            <button 
              className="sidebar-toggle-btn left"
              onClick={toggleLeftSidebar}
              title="Show Elements Panel"
            >
             ▶ 
            </button>
          )} */}
          
          {/* {!showRightSidebar && (
            <button 
              className="sidebar-toggle-btn right"
              onClick={toggleRightSidebar}
              title="Show Properties Panel"
            >              
              ◀
            </button>
          )} */}

          <div 
            ref={canvasRef} 
            className={`bpmn-canvas-modern ${dragOverCanvas ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ 
              opacity: isLoaded ? 1 : 0.7,
            }}
          />
          
          {!isLoaded && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Initializing BPMN Editor...</p>
            </div>
          )}

          {dragOverCanvas && (
            <div className="drop-indicator">
              {/* <div className="drop-message">
                <div className="drop-icon">⬇️</div>
                <p>Drop element here</p>
                {draggedElement?.isSwimlane && (
                  <p className="drop-hint">Swimlane element</p>
                )}
              </div> */}
            </div>
          )}

          {/* Floating Action Button */}
          <div className="floating-actions">
            <button className="fab" onClick={saveToFile} title="Download XML">
            ⬇️
            </button>
            {/* <button className="fab" onClick={createNewDiagram} title="New">
              🆕
            </button> */}
            <button className="fab" onClick={exportAsSVG} title="Export SVG">
              📤
            </button>
            <button className="fab" onClick={showXmlPreview} title="XML Preview">            
              📄
            </button>

                  {/* Sidebar Toggle FABs */}
         {/* <button 
              className="fab sidebar-toggle"
              onClick={toggleLeftSidebar}
              title={showLeftSidebar ? "Hide Elements" : "Show Elements"}
            >
           {showLeftSidebar ? '◀' : '▶'}
            </button>
            <button 
              className="fab sidebar-toggle"
              onClick={toggleRightSidebar}
              title={showRightSidebar ? "Hide Properties" : "Show Properties"}
            >
              {showRightSidebar ? '▶' : '◀'}
            </button> */}
            
            {/* Zoom FABs */}
            <button className="fab zoom-btn" onClick={zoomIn} title="Zoom In">
              🔍+
            </button>
            <button className="fab zoom-btn" onClick={zoomOut} title="Zoom Out">
              🔍-
            </button>
            <button className="fab zoom-btn" onClick={zoomToFit} title="Fit to View">
              ⤢
            </button>


            {selectedElementInfo?.canHaveForm && (
              <button className="fab properties" onClick={openPropertiesModal} title="Form Properties">
                📝
              </button>

              
            )}
          </div>
        </div>

        {/* <FormEditor onSave={handleSaveFormProperties} /> */}

        <FormEditorModal
            isOpen={showPropertiesModal}
            onClose={closePropertiesModal}
            onSave={handleSaveFormProperties}
        />

        <SaveProcessModal
            initialValues={diagramData}
            visible={showSaveModal}
            onCancel={closeSaveModal}
            onSave={updateDesignInDB}
        />            

        {/* Right Sidebar - Properties */}
            <button 
              className="sidebar-toggle-btn right"
              onClick={toggleRightSidebar}
              title="Show Properties Panel"
            >              
              ☰
            </button>
        {showRightSidebar && (

        <div className="bpmn-properties-sidebar">
          <div className="properties-header">
            <h4>Properties</h4>
                {/* <button 
                className="sidebar-close-btn"
                onClick={toggleRightSidebar}
                title="Close Sidebar"
              >
                ✕
              </button> */}
            
            {selectedElementInfo ? (
              <div className="selected-element-info">
                <div className="element-type">{selectedElementInfo.type.replace('bpmn:', '')}</div>
                <div className="element-name">{selectedElementInfo.name}</div>
                {/* {selectedElementInfo.canHaveForm && (
                  <button 
                    className="properties-btn"
                    onClick={openPropertiesModal}
                  >
                    Edit Form Properties
                  </button>
                )} */}
              </div>
            ) : (
              <span className="properties-hint">Select an element to edit properties</span>
            )}
          {/* </div> */}
          
          {/* <div className="properties-content"> */}
            {selectedElementInfo && (
                <>
              <div className="property-group">
                <label className="property-label">Element ID</label>
                <a > {selectedElementInfo.id} </a> 
                {/* <input 
                  type="text" 
                  className="property-input" 
                  value={selectedElementInfo.id}
                  readOnly
                /> */}
              </div>

            <div className="property-group">
            <label className="property-label">Name</label>
            {/* <input 
                type="text" 
                className="property-input" 
                value={selectedElementInfo.name}
                readOnly
                /> */}
             <a > {selectedElementInfo.name} </a> 
            </div>
            <div className="property-group">
            <label className="property-label">Type</label>
            {/* <input 
                type="text" 
                className="property-input" 
                value={selectedElementInfo.type}
                readOnly
                /> */}
                <a > {selectedElementInfo.type.replace('bpmn:', '')} </a> 
            </div>
            <div className="property-group">
            <label className="property-label">Documentation</label>
                <a >No value </a>
            </div>
            {selectedElementInfo.canHaveForm && (
            <div className="property-group">
            <label className="property-label">Form properties </label> 
            {/* <button 
                    className="properties-btn"
                    onClick={openPropertiesModal}
                  >
                    Form Properties
                  </button> */}
                <a className='link' onClick={openPropertiesModal} > 3 form properties </a>                
            </div>
            )}
            <div className="property-group">
            <label className="property-label">Assignments </label>  
            <a >a candidate group </a>
            </div>

            <div className="property-group">
            <label className="property-label">Priority </label>  
               <select >
               <option>Low</option>
               <option>Medium</option>
               <option>High</option>
               </select>
            </div>

            <div className="property-group">
            <label className="property-label">Exclusive </label>  
            <input 
                type="checkbox" 
                className="property-input"                
                />
            </div>

            <div className="property-group">
            <label className="property-label">Category </label>  
            <a >No value </a>
            </div>

            <div className="property-group">
            <label className="property-label">Due date </label>   
                <a >No value </a>
            </div>

            <div className="property-group">
            <label className="property-label">Multi-instance type </label>   
            <a >No value </a>
            </div>

            </>
            )}
            </div>
            <div className="properties-foorter">
            <div className="diagram-statistics">
                <h5>Diagram Statistics</h5>
                <div className="stats-grid">
                
                <div className="stat-card total">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                    <div className="stat-value">{elementCounts.totalElements}</div>
                    <div className="stat-label">Total Elements</div>
                </div>
                </div>
        
                <div className="stat-card flows">
                    <div className="stat-icon">➡️</div>
                    <div className="stat-content">
                        <div className="stat-value">{elementCounts.flows}</div>
                        <div className="stat-label">Flows</div>
                    </div>
                </div>
                

                {/* <div className="stat-card swimlanes">
                    <div className="stat-icon">🏊</div>
                    <div className="stat-content">
                        <div className="stat-value">{elementCounts.swimlanes}</div>
                        <div className="stat-label">Swimlanes</div>
                    </div>
                </div> */}
                </div> 

            </div>
            </div>

          </div>        
        )}
      </div>

      {/* Properties Modal */}
      {/* {showPropertiesModal && ( 
    //     <div className="modal-overlay">
    //       <div className="modal-content">
    //         <div className="modal-header">
    //           <h3>Task Form Properties</h3>
    //           <button className="modal-close" onClick={closePropertiesModal}>
    //             ✕
    //           </button>
    //         </div>
            
    //         <div className="modal-body">
    //           <div className="form-section">
    //             <h4>Basic Properties</h4>
    //             <div className="form-grid">
    //               <div className="form-group">
    //                 <label>Task Name</label>
    //                 <input
    //                   type="text"
    //                   value={formProperties.current.name}
    //                   onChange={(e) => handleFormPropertyChange('name', e.target.value)}
    //                   placeholder="Enter task name"
    //                 />
    //               </div>
                  
    //               <div className="form-group">
    //                 <label>Description</label>
    //                 <textarea
    //                   value={formProperties.current.description}
    //                   onChange={(e) => handleFormPropertyChange('description', e.target.value)}
    //                   placeholder="Enter task description"
    //                   rows="3"
    //                 />
    //               </div>
                  
    //               <div className="form-group">
    //                 <label>Assignee</label>
    //                 <input
    //                   type="text"
    //                   value={formProperties.current.assignee}
    //                   onChange={(e) => handleFormPropertyChange('assignee', e.target.value)}
    //                   placeholder="Assign to user or role"
    //                 />
    //               </div>
                  
    //               <div className="form-group">
    //                 <label>Due Date</label>
    //                 <input
    //                   type="date"
    //                   value={formProperties.current.dueDate}
    //                   onChange={(e) => handleFormPropertyChange('dueDate', e.target.value)}
    //                 />
    //               </div>
                  
    //               <div className="form-group">
    //                 <label>Priority</label>
    //                 <select
    //                   value={formProperties.current.priority}
    //                   onChange={(e) => handleFormPropertyChange('priority', e.target.value)}
    //                 >
    //                   <option value="low">Low</option>
    //                   <option value="medium">Medium</option>
    //                   <option value="high">High</option>
    //                 </select>
    //               </div>
    //             </div>
    //           </div>

    //           <div className="form-section">
    //             <div className="section-header">
    //               <h4>Form Fields</h4>
    //               <button className="add-field-btn" onClick={addFormField}>
    //                 + Add Field
    //               </button>
    //             </div>
                
    //             <div className="form-fields-list">
    //               {formProperties.current.formFields.map((field, index) => (
    //                 <div key={field.id} className="form-field-item">
    //                   <div className="field-header">
    //                     <span>Field {index + 1}</span>
    //                     <button 
    //                       className="remove-field-btn"
    //                       onClick={() => removeFormField(index)}
    //                     >
    //                       Remove
    //                     </button>
    //                   </div>
                      
    //                   <div className="field-properties">
    //                     <div className="form-group">
    //                       <label>Label</label>
    //                       <input
    //                         type="text"
    //                         value={field.label}
    //                         onChange={(e) => handleFormFieldChange(index, 'label', e.target.value)}
    //                         placeholder="Field label"
    //                       />
    //                     </div>
                        
    //                     <div className="form-group">
    //                       <label>Type</label>
    //                       <select
    //                         value={field.type}
    //                         onChange={(e) => handleFormFieldChange(index, 'type', e.target.value)}
    //                       >
    //                         <option value="text">Text</option>
    //                         <option value="number">Number</option>
    //                         <option value="email">Email</option>
    //                         <option value="date">Date</option>
    //                         <option value="select">Dropdown</option>
    //                         <option value="checkbox">Checkbox</option>
    //                       </select>
    //                     </div>
                        
    //                     <div className="form-group">
    //                       <label>Placeholder</label>
    //                       <input
    //                         type="text"
    //                         value={field.placeholder}
    //                         onChange={(e) => handleFormFieldChange(index, 'placeholder', e.target.value)}
    //                         placeholder="Placeholder text"
    //                       />
    //                     </div>
                        
    //                     <div className="form-group checkbox-group">
    //                       <label>
    //                         <input
    //                           type="checkbox"
    //                           checked={field.required}
    //                           onChange={(e) => handleFormFieldChange(index, 'required', e.target.checked)}
    //                         />
    //                         Required field
    //                       </label>
    //                     </div>
    //                   </div>
    //                 </div>
    //               ))}
                  
    //               {formProperties.current.formFields.length === 0 && (
    //                 <div className="no-fields">
    //                   <p>No form fields added yet.</p>
    //                   <p>Click "Add Field" to create form fields for this task.</p>
    //                 </div>
    //               )}
    //             </div>
    //           </div>
    //         </div>
            
    //         <div className="modal-footer">
    //           <button className="btn-secondary" onClick={closePropertiesModal}>
    //             Cancel
    //           </button>
    //           <button className="btn-primary" onClick={saveFormProperties}>
    //             Save Properties
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   )}

      {/* XML Preview Modal */}
      {showXmlModal && (
        <div className="modal-overlay">
          <div className="modal-content xml-modal">
            <div className="modal-header">
              <h3>BPMN XML Preview</h3>
              <button className="modal-close" onClick={closeXmlModal}>
                ✕
              </button>
            </div>
            
            <div className="modal-body xml-preview">                
              <div className="xml-toolbar">
                <div class="toolbar-btn">
                <button className="xml-toolbar-btn" onClick={copyXmlToClipboard} title="Copy to Clipboard">
                  📋 Copy
                </button>
                <button className="btn-primary btn-sm" onClick={downloadXml}>
                ⬇️ Download
                 </button>
                </div>
                <span className="xml-info">
                  {xmlContent.length} characters
                </span>
              </div>
              
              <pre className="xml-content">
                <code>{xmlContent}</code>
              </pre>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary btn-sm" onClick={closeXmlModal}>
                Close
              </button>
           
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="bpmn-status-bar">
        <div className="status-left">
          <span className="status-item">Ready</span>
          <span className="status-item">Zoom: {Math.round(zoomLevel * 100)}%</span>
              {selectedElementInfo && (
            <span className="status-item">
            Sidebars: {showLeftSidebar ? 'Elements' : 'Hidden'} / {showRightSidebar ? 'Properties' : 'Hidden'}
            </span>          )}
        </div>
        <div className="status-right">
          {/* <span className="status-item">BPMN 2.0</span> */}
          <span className="status-item">Click filename to edit</span>
          {/* <span className="status-item">Swimlanes Enabled</span> */}
        </div>
        <span className="status-item">
            File: {fileName} - &nbsp;
            { diagramData && (
               <>
              v{diagramData.version_number}
              </>
            )}

          </span>
                
      </div>      
    </div>
  );
};

export default BpmnDiagram;