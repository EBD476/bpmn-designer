import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import './BpmnModal.css';

const BpmnAssigneeEditor = () => {
  const containerRef = useRef(null);
  const bpmnModelerRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [candidateUsers, setCandidateUsers] = useState('');
  const [candidateGroups, setCandidateGroups] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [userTasks, setUserTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('assignee'); // 'assignee', 'candidateUsers', 'candidateGroups'
  const [identityStoreUsers, setIdentityStoreUsers] = useState([]);
  const [identityStoreGroups, setIdentityStoreGroups] = useState([]);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(false);

  const initialBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:activiti="http://activiti.org/bpmn">
  <bpmn2:process id="Process_1" isExecutable="true">
    <bpmn2:startEvent id="StartEvent_1" />
    <bpmn2:userTask id="UserTask_1" name="Review Request" />
    <bpmn2:userTask id="UserTask_2" name="Approve Document" />
    <bpmn2:userTask id="UserTask_3" name="Final Approval" />
    <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="UserTask_1" />
    <bpmn2:sequenceFlow id="Flow_2" sourceRef="UserTask_1" targetRef="UserTask_2" />
    <bpmn2:sequenceFlow id="Flow_3" sourceRef="UserTask_2" targetRef="UserTask_3" />
    <bpmn2:endEvent id="EndEvent_1" />
    <bpmn2:sequenceFlow id="Flow_4" sourceRef="UserTask_3" targetRef="EndEvent_1" />
  </bpmn2:process>
</bpmn2:definitions>`;

  // Fixed values for quick selection
  const fixedUsers = [
    { id: 'john.doe@company.com', name: 'John Doe', email: 'john.doe@company.com', role: 'Manager' },
    { id: 'jane.smith@company.com', name: 'Jane Smith', email: 'jane.smith@company.com', role: 'Reviewer' },
    { id: 'mike.wilson@company.com', name: 'Mike Wilson', email: 'mike.wilson@company.com', role: 'Approver' },
    { id: 'sarah.johnson@company.com', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Admin' },
    { id: 'david.brown@company.com', name: 'David Brown', email: 'david.brown@company.com', role: 'Developer' }
  ];

  const fixedGroups = [
    { id: 'managers', name: 'Managers', description: 'Management team' },
    { id: 'developers', name: 'Developers', description: 'Development team' },
    { id: 'reviewers', name: 'Reviewers', description: 'Code review team' },
    { id: 'approvers', name: 'Approvers', description: 'Approval committee' },
    { id: 'administrators', name: 'Administrators', description: 'System administrators' }
  ];

  useEffect(() => {
    bpmnModelerRef.current = new BpmnModeler({
      container: containerRef.current
    });

    bpmnModelerRef.current.importXML(initialBpmnXml)
      .then(() => {
        loadAllUserTasks();
        setupElementClickListeners();
        loadIdentityStoreData(); // Load identity store data on init
      })
      .catch(error => {
        console.error('Failed to load BPMN diagram:', error);
      });

    return () => {
      bpmnModelerRef.current?.destroy();
    };
  }, []);

  // Simulate loading identity store data
  const loadIdentityStoreData = async () => {
    setIsLoadingIdentity(true);
    try {
      // Simulate API call to identity store
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock identity store data
      const mockIdentityUsers = [
        { id: 'user-001', name: 'Alice Cooper', email: 'alice@company.com', department: 'IT', title: 'Senior Developer' },
        { id: 'user-002', name: 'Bob Marley', email: 'bob@company.com', department: 'HR', title: 'HR Manager' },
        { id: 'user-003', name: 'Charlie Brown', email: 'charlie@company.com', department: 'Finance', title: 'Financial Analyst' },
        { id: 'user-004', name: 'Diana Prince', email: 'diana@company.com', department: 'Operations', title: 'Operations Manager' },
        { id: 'user-005', name: 'Edward Norton', email: 'edward@company.com', department: 'IT', title: 'System Admin' }
      ];

      const mockIdentityGroups = [
        { id: 'group-it', name: 'IT Department', memberCount: 15, description: 'Information Technology Department' },
        { id: 'group-hr', name: 'Human Resources', memberCount: 8, description: 'Human Resources Department' },
        { id: 'group-finance', name: 'Finance Team', memberCount: 12, description: 'Finance and Accounting' },
        { id: 'group-ops', name: 'Operations', memberCount: 20, description: 'Operations Department' },
        { id: 'group-qa', name: 'Quality Assurance', memberCount: 10, description: 'QA and Testing Team' }
      ];

      setIdentityStoreUsers(mockIdentityUsers);
      setIdentityStoreGroups(mockIdentityGroups);
    } catch (error) {
      console.error('Error loading identity store data:', error);
    } finally {
      setIsLoadingIdentity(false);
    }
  };

  const loadAllUserTasks = () => {
    try {
      const elementRegistry = bpmnModelerRef.current.get('elementRegistry');
      const allTasks = elementRegistry.filter(element => element.type === 'bpmn:UserTask');
      
      const taskList = allTasks.map(task => {
        const businessObject = task.businessObject;
        return {
          id: task.id,
          name: businessObject.name || 'Unnamed Task',
          assignee: businessObject.assignee || '',
          candidateUsers: businessObject.candidateUsers || '',
          candidateGroups: businessObject.candidateGroups || '',
          dueDate: businessObject.dueDate || '',
          priority: businessObject.priority || '',
          hasAssignee: !!businessObject.assignee,
          hasCandidates: !!(businessObject.candidateUsers || businessObject.candidateGroups)
        };
      });
      
      setUserTasks(taskList);
    } catch (error) {
      console.error('Error loading user tasks:', error);
    }
  };

  const setupElementClickListeners = () => {
    const eventBus = bpmnModelerRef.current.get('eventBus');
    
    eventBus.on('element.click', (event) => {
      const element = event.element;
      
      if (element.type === 'bpmn:UserTask') {
        openModalWithTask(element);
      }
    });
  };

  const openModalWithTask = (taskElement) => {
    const businessObject = taskElement.businessObject;
    
    setSelectedTask({
      id: taskElement.id,
      name: businessObject.name || taskElement.id,
      currentAssignee: businessObject.assignee || '',
      currentCandidateUsers: businessObject.candidateUsers || '',
      currentCandidateGroups: businessObject.candidateGroups || '',
      currentDueDate: businessObject.dueDate || '',
      currentPriority: businessObject.priority || ''
    });
    
    // Set form values
    setAssignee(businessObject.assignee || '');
    setCandidateUsers(businessObject.candidateUsers || '');
    setCandidateGroups(businessObject.candidateGroups || '');
    setDueDate(businessObject.dueDate || '');
    setPriority(businessObject.priority || '');
    
    setIsModalOpen(true);
  };

  const handleSaveAssignee = async () => {
    if (!selectedTask) return;

    try {
      await updateUserTaskProperties(selectedTask.id, {
        assignee,
        candidateUsers,
        candidateGroups,
        dueDate,
        priority
      });
      
      setIsModalOpen(false);
      resetForm();
      loadAllUserTasks();
      
      console.log('✅ Task properties updated successfully');
    } catch (error) {
      console.error('❌ Error updating task properties:', error);
      alert('Failed to save assignee: ' + error.message);
    }
  };

  const updateUserTaskProperties = async (taskId, properties) => {
    try {
      const modeler = bpmnModelerRef.current;
      const elementRegistry = modeler.get('elementRegistry');
      const modeling = modeler.get('modeling');
      
      const userTask = elementRegistry.get(taskId);
      
      if (userTask) {
        modeling.updateProperties(userTask, properties);
        return true;
      }
    } catch (error) {
      console.error('Error updating user task:', error);
      throw error;
    }
  };

  const resetForm = () => {
    setAssignee('');
    setCandidateUsers('');
    setCandidateGroups('');
    setDueDate('');
    setPriority('');
    setSelectedTask(null);
    setActiveTab('assignee');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Selection handlers
  const handleSelectUser = (user, source) => {
    if (activeTab === 'assignee') {
      setAssignee(user.id);
    } else if (activeTab === 'candidateUsers') {
      const currentUsers = candidateUsers.split(',').filter(u => u.trim());
      if (!currentUsers.includes(user.id)) {
        const newUsers = [...currentUsers, user.id].join(', ');
        setCandidateUsers(newUsers);
      }
    }
  };

  const handleSelectGroup = (group, source) => {
    if (activeTab === 'candidateGroups') {
      const currentGroups = candidateGroups.split(',').filter(g => g.trim());
      if (!currentGroups.includes(group.id)) {
        const newGroups = [...currentGroups, group.id].join(', ');
        setCandidateGroups(newGroups);
      }
    }
  };

  const handleRemoveUser = (userToRemove) => {
    const users = candidateUsers.split(',').map(u => u.trim()).filter(u => u !== userToRemove);
    setCandidateUsers(users.join(', '));
  };

  const handleRemoveGroup = (groupToRemove) => {
    const groups = candidateGroups.split(',').map(g => g.trim()).filter(g => g !== groupToRemove);
    setCandidateGroups(groups.join(', '));
  };

  const clearAssignee = async (taskId) => {
    try {
      await updateUserTaskProperties(taskId, {
        assignee: null,
        candidateUsers: null,
        candidateGroups: null
      });
      loadAllUserTasks();
      console.log('✅ Assignee cleared from task');
    } catch (error) {
      console.error('❌ Error clearing assignee:', error);
    }
  };

  // Tab content components
  const AssigneeTab = () => (
    <div>
      <div className="form-group">
        <label>Selected Assignee:</label>
        <input
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Selected user will appear here"
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px', marginBottom: '10px' }}
          readOnly
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>Fixed Users</h4>
        <div className="button-group">
          {fixedUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user, 'fixed')}
              className={`user-button ${assignee === user.id ? 'active' : ''}`}
            >
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-details">{user.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0 }}>Identity Store Users</h4>
          <button 
            onClick={loadIdentityStoreData}
            disabled={isLoadingIdentity}
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            {isLoadingIdentity ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {isLoadingIdentity ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading identity store data...</div>
        ) : (
          <div className="button-group">
            {identityStoreUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user, 'identity')}
                className={`user-button ${assignee === user.id ? 'active' : ''}`}
              >
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-details">{user.department} • {user.title}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const CandidateUsersTab = () => (
    <div>
      <div className="form-group">
        <label>Selected Candidate Users:</label>
        <div style={{ minHeight: '60px', padding: '8px', border: '1px solid #ddd', borderRadius: '3px', marginBottom: '10px', background: '#f8f9fa' }}>
          {candidateUsers ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {candidateUsers.split(',').map(user => user.trim()).filter(user => user).map((user, index) => (
                <span key={index} className="selected-item">
                  {user}
                  <button 
                    onClick={() => handleRemoveUser(user)}
                    className="remove-button"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', fontStyle: 'italic' }}>No users selected</div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>Fixed Users</h4>
        <div className="button-group">
          {fixedUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user, 'fixed')}
              className="user-button"
            >
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-details">{user.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '10px' }}>Identity Store Users</h4>
        {isLoadingIdentity ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading identity store data...</div>
        ) : (
          <div className="button-group">
            {identityStoreUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user, 'identity')}
                className="user-button"
              >
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-details">{user.department} • {user.title}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const CandidateGroupsTab = () => (
    <div>
      <div className="form-group">
        <label>Selected Candidate Groups:</label>
        <div style={{ minHeight: '60px', padding: '8px', border: '1px solid #ddd', borderRadius: '3px', marginBottom: '10px', background: '#f8f9fa' }}>
          {candidateGroups ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {candidateGroups.split(',').map(group => group.trim()).filter(group => group).map((group, index) => (
                <span key={index} className="selected-item">
                  {group}
                  <button 
                    onClick={() => handleRemoveGroup(group)}
                    className="remove-button"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', fontStyle: 'italic' }}>No groups selected</div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>Fixed Groups</h4>
        <div className="button-group">
          {fixedGroups.map(group => (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group, 'fixed')}
              className="group-button"
            >
              <div className="group-info">
                <div className="group-name">{group.name}</div>
                <div className="group-details">{group.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '10px' }}>Identity Store Groups</h4>
        {isLoadingIdentity ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading identity store data...</div>
        ) : (
          <div className="button-group">
            {identityStoreGroups.map(group => (
              <button
                key={group.id}
                onClick={() => handleSelectGroup(group, 'identity')}
                className="group-button"
              >
                <div className="group-info">
                  <div className="group-name">{group.name}</div>
                  <div className="group-details">{group.description} ({group.memberCount} members)</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>BPMN UserTask Assignee Editor</h2>
      
      {/* User Tasks Panel */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
        <h3>User Tasks</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
          {userTasks.map(task => (
            <div key={task.id} style={{ 
              padding: '15px', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              background: task.hasAssignee ? '#e8f5e8' : task.hasCandidates ? '#fff3cd' : '#fff'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                {task.name}
              </div>
              
              {task.assignee && (
                <div style={{ marginBottom: '5px' }}>
                  <strong>Assignee:</strong> {task.assignee}
                </div>
              )}
              
              {task.candidateUsers && (
                <div style={{ marginBottom: '5px' }}>
                  <strong>Candidate Users:</strong> {task.candidateUsers}
                </div>
              )}
              
              {task.candidateGroups && (
                <div style={{ marginBottom: '5px' }}>
                  <strong>Candidate Groups:</strong> {task.candidateGroups}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => openModalForTask(task.id)}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '12px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Edit Assignee
                </button>
                
                {(task.assignee || task.candidateUsers || task.candidateGroups) && (
                  <button 
                    onClick={() => clearAssignee(task.id)}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BPMN Diagram */}
      <div 
        ref={containerRef} 
        style={{ 
          height: '600px', 
          border: '2px solid #ddd',
          borderRadius: '5px',
          marginBottom: '20px'
        }} 
      />

      {/* Assignee Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>Assign UserTask: {selectedTask?.name}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '15px', padding: '10px', background: '#e9ecef', borderRadius: '3px' }}>
                <div><strong>Task ID:</strong> {selectedTask?.id}</div>
              </div>
              
              {/* Tab Navigation */}
              <div className="tab-navigation">
                <button 
                  className={`tab-button ${activeTab === 'assignee' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assignee')}
                >
                  Assignee
                </button>
                <button 
                  className={`tab-button ${activeTab === 'candidateUsers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('candidateUsers')}
                >
                  Candidate Users
                </button>
                <button 
                  className={`tab-button ${activeTab === 'candidateGroups' ? 'active' : ''}`}
                  onClick={() => setActiveTab('candidateGroups')}
                >
                  Candidate Groups
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'assignee' && <AssigneeTab />}
                {activeTab === 'candidateUsers' && <CandidateUsersTab />}
                {activeTab === 'candidateGroups' && <CandidateGroupsTab />}
              </div>

              {/* Additional Properties */}
              <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
                <h4 style={{ marginBottom: '15px' }}>Additional Properties</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label htmlFor="dueDate">Due Date:</label>
                    <input
                      id="dueDate"
                      type="text"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="P3D (3 days) or 2024-12-31"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="priority">Priority:</label>
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                    >
                      <option value="">Select Priority</option>
                      <option value="1">Low (1)</option>
                      <option value="2">Medium (2)</option>
                      <option value="3">High (3)</option>
                      <option value="4">Critical (4)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSaveAssignee}
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BpmnAssigneeEditor;  