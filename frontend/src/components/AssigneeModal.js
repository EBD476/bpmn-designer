// FormEditorModal.jsx
import React, { useEffect, useState, useMemo,useCallback } from 'react';
import './FormEditorModal.css';
import './BpmnModal.css'
// import BpmnAssigneeEditor from './BpmnAssigneeEditor';


export default function AssigneeModal({ isOpen, onClose, onSave , initValue }) {
  const [formProperties, setFormProperties] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [expression, setExpression] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [candidateUsers, setCandidateUsers] = useState('');
  const [candidateGroups, setCandidateGroups] = useState('');  
  const [activeTab, setActiveTab] = useState('assignee'); 
  const [identityStoreUsers, setIdentityStoreUsers] = useState([]);
  const [identityStoreGroups, setIdentityStoreGroups] = useState([]);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(false);

    // Manual input states
  const [manualAssignee, setManualAssignee] = useState('');
  const [manualCandidateUsers, setManualCandidateUsers] = useState('');
  const [manualCandidateGroups, setManualCandidateGroups] = useState('');

   // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all'); // 'all', 'users', 'groups'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);


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
        { id: 'user-005', name: 'Edward Norton', email: 'edward@company.com', department: 'IT', title: 'System Admin' },
        { id: 'user-006', name: 'james karden', email: 'edward@company.com', department: 'IT', title: 'System Admin' },
        { id: 'user-007', name: 'brad pit', email: 'edward@company.com', department: 'IT', title: 'System Admin' }
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

    // Combined data for search
  const allSearchData = useMemo(() => {
    return [
      ...fixedUsers.map(user => ({ ...user, source: 'fixed' })),
      ...fixedGroups.map(group => ({ ...group, source: 'fixed' })),
      ...identityStoreUsers.map(user => ({ ...user, type: 'user', source: 'identity' })),
      ...identityStoreGroups.map(group => ({ ...group, type: 'group', source: 'identity' }))
    ];
  }, [fixedUsers, fixedGroups, identityStoreUsers, identityStoreGroups]);

    // Search function
  const performSearch = (query, category = 'all') => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // setIsSearching(true);
    
    // Simulate API call delay
    // setTimeout(() => {
    //   const lowerQuery = query.toLowerCase();
      
    //   const filtered = allSearchData.filter(item => {
    //     const matchesCategory = category === 'all' || 
    //                           (category === 'users' && item.type === 'user') ||
    //                           (category === 'groups' && item.type === 'group');
        
    //     if (!matchesCategory) return false;

    //     // Search in multiple fields
    //     const matchesName = item.name.toLowerCase().includes(lowerQuery);
    //     const matchesEmail = item.email && item.email.toLowerCase().includes(lowerQuery);
    //     const matchesRole = item.role && item.role.toLowerCase().includes(lowerQuery);
    //     const matchesDepartment = item.department && item.department.toLowerCase().includes(lowerQuery);
    //     const matchesDescription = item.description && item.description.toLowerCase().includes(lowerQuery);
    //     const matchesId = item.id.toLowerCase().includes(lowerQuery);

    //     return matchesName || matchesEmail || matchesRole || matchesDepartment || matchesDescription || matchesId;
    //   });

    //   // Sort by relevance (exact matches first, then partial matches)
    //   const sortedResults = filtered.sort((a, b) => {
    //     const aNameMatch = a.name.toLowerCase() === lowerQuery;
    //     const bNameMatch = b.name.toLowerCase() === lowerQuery;
        
    //     if (aNameMatch && !bNameMatch) return -1;
    //     if (!aNameMatch && bNameMatch) return 1;
        
    //     return a.name.localeCompare(b.name);
    //   });

    //   setSearchResults(sortedResults);
    //   setIsSearching(false);
    // }, 300);
  };

    // Effect to trigger search when query or category changes
  // useEffect(() => {
  //   if (searchQuery.trim()) {
  //     performSearch(searchQuery, searchCategory);
  //   } else {
  //     // setSearchResults([]);
  //   }
  // }, [searchQuery, searchCategory, allSearchData]);

  useEffect(() => {
    if (isOpen) {
        setFormProperties([]);  // Start empty
        setSelectedIndex(null);         
        setExpression(initValue === undefined ? '' : initValue)
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave(expression);
    onClose();
  };

    // Manual input handlers
  const handleManualAssigneeChange = (value) => {
    console.log("handle")
    setManualAssignee(value);
    setAssignee(''); // Clear selected assignee when typing manually
  };

  const handleManualCandidateUsersChange = (value) => {
    setManualCandidateUsers(value);
    setCandidateUsers(''); // Clear selected users when typing manually
  };

  const handleManualCandidateGroupsChange = (value) => {
    setManualCandidateGroups(value);
    setCandidateGroups(''); // Clear selected groups when typing manually
  };

  const SearchBox = ({ placeholder = "Search users and groups..." }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '10px 40px 10px 15px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          )}
        </div>
        {/* <select
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            background: 'white',
            minWidth: '120px'
          }}
        >
          <option value="all">All</option>
          <option value="users">Users</option>
          <option value="groups">Groups</option>
        </select> */}
      </div>

       {searchQuery && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {isSearching ? (
            <span>Searching...</span>
          ) : (
            <span>
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </span>
          )}
        </div>
      )}
    </div>
  );

  const SearchResultsSection = () => {
    if (!searchQuery.trim()) return null;

    if (isSearching) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <div>Searching...</div>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontStyle: 'italic' }}>
          No results found for "{searchQuery}"
        </div>
      );
    }

    const users = searchResults.filter(item => item.type === 'user');
    const groups = searchResults.filter(item => item.type === 'group');

    return (
      <div style={{ marginBottom: '20px' }}>
        {users.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '10px', color: '#333' }}>Users ({users.length})</h4>
            <div className="button-group">
              {users.map(user => (
                <button
                  key={`${user.source}-${user.id}`}
                  onClick={() => handleSelectUser(user, user.source)}
                  className={`user-button ${assignee === user.id ? 'active' : ''}`}
                >
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-details">
                      {user.email && `${user.email} • `}
                      {user.role || user.title}
                      {user.source === 'identity' && ' • Identity Store'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {groups.length > 0 && (
          <div>
            <h4 style={{ marginBottom: '10px', color: '#333' }}>Groups ({groups.length})</h4>
            <div className="button-group">
              {groups.map(group => (
                <button
                  key={`${group.source}-${group.id}`}
                  onClick={() => handleSelectGroup(group, group.source)}
                  className="group-button"
                >
                  <div className="group-info">
                    <div className="group-name">{group.name}</div>
                    <div className="group-details">
                      {group.description}
                      {group.memberCount && ` • ${group.memberCount} members`}
                      {group.source === 'identity' && ' • Identity Store'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const selectedProp = formProperties[selectedIndex] || {};

    // Manual Input Component
  const ManualInputSection = () => (
    <div style={{ 
      marginBottom: '25px', 
      padding: '20px', 
      background: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
        {/* <h4 style={{ marginBottom: '15px', color: '#333' }}>Manual Input</h4>
        <p style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
          Type user/group names manually or select from the list below. Manual input will override selections.
        </p> */}
      
      {activeTab === 'assignee' && (
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Type Assignee Name:
          </label>
          <input
            type="text"
            value={manualAssignee}
            onChange={(e) => setManualAssignee(e.target.value)}
            // onChange={(e) => handleManualAssigneeChange(e.target.value)}
            placeholder="Enter user name or email manually..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              background: manualAssignee ? '#fff3cd' : 'white'
            }}
          />
          {manualAssignee && (
            <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
              ✓ Manual input will be used: "{manualAssignee}"
            </div>
          )}
        </div>
      )}

      {activeTab === 'candidateUsers' && (
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Type Candidate Users (comma-separated):
          </label>
          <textarea
            value={manualCandidateUsers}
            onChange={(e) => handleManualCandidateUsersChange(e.target.value)}
            placeholder="Enter user names or emails separated by commas..."
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              background: manualCandidateUsers ? '#fff3cd' : 'white',
              resize: 'vertical'
            }}
          />
          {manualCandidateUsers && (
            <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
              ✓ Manual input will be used: "{manualCandidateUsers}"
            </div>
          )}
        </div>
      )}

      {activeTab === 'candidateGroups' && (
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Type Candidate Groups (comma-separated):
          </label>
          <textarea
            value={manualCandidateGroups}
            onChange={(e) => handleManualCandidateGroupsChange(e.target.value)}
            placeholder="Enter group names separated by commas..."
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              background: manualCandidateGroups ? '#fff3cd' : 'white',
              resize: 'vertical'
            }}
          />
          {manualCandidateGroups && (
            <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
              ✓ Manual input will be used: "{manualCandidateGroups}"
            </div>
          )}
        </div>
      )}
    </div>
  );

const InputFiexed = ({ manualAssignee, setManualAssignee }) => (
  <input
    type="text"
    value={manualAssignee}
    onChange={(e) => setManualAssignee(e.target.value)}
    placeholder="Enter user name or email manually..."
    style={{
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      background: manualAssignee ? '#fff3cd' : 'white'
    }}
  />
);

   // Tab content components
  const AssigneeTab = () => (
    <div>

       {/* <SearchBox placeholder="Search for users to assign..." /> */} 

      {/* <div style={{ marginBottom: '20px' }}>
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
      </div> */}

   {searchQuery ? (    
        <SearchResultsSection />
      ) : (
        
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0 }}>Identity Store Users</h4>
          <button 
          className='action-btn primary'
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
      )}
    </div>
    
  );

    const CandidateUsersTab = () => (
    <div>
      <div className="form-group">
              <ManualInputSection />
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

      {/* <div style={{ marginBottom: '20px' }}>
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
      </div> */}

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

      {/* <div style={{ marginBottom: '20px' }}>
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
      </div> */}

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

  const FiexedValuesTab = () => (
    <div>
        <form className="modal-body" onSubmit={handleSave}>
                <div style={{ marginBottom: '15px', padding: '10px', background: '#e9ecef', borderRadius: '3px' }}>
                    <div><strong>Task ID:</strong> {selectedTask?.id}</div>
                    <div><strong>Current Assignee:</strong> {selectedTask?.currentAssignee || 'Not assigned'}</div>
                </div>

                <div className="form-group">
                <label htmlFor="assignee">Assignment: </label>  
                   <select 
                   style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                   >
                    <option>Assigned to process initiator </option>
                    <option>Assigned to single user </option>
                    <option>Candidate users </option>
                    <option>Candidate groups </option>
                  </select>
           
              </div>
              
              {/* Assignee Field */}
              <div className="form-group">
                <label htmlFor="assignee">Assignee:  <span> Single user responsible for this task</span></label>           
                <input
                  id="assignee"
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Enter user ID or email"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                />
              </div>

              {/* Candidate Users */}
              <div className="form-group">
                <label htmlFor="candidateUsers">Candidate Users: <span>  Comma-separated list of users who can claim this task</span></label>
                <input
                  id="candidateUsers"
                  type="text"
                  value={candidateUsers}
                  onChange={(e) => setCandidateUsers(e.target.value)}
                  placeholder="user1, user2, user3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                />              
              </div>

              {/* Candidate Groups */}
              <div className="form-group">
                <label htmlFor="candidateGroups">Candidate Groups: <span>Comma-separated list of groups who can claim this task</span></label>
                <input
                  id="candidateGroups"
                  type="text"
                  value={candidateGroups}
                  onChange={(e) => setCandidateGroups(e.target.value)}
                  placeholder="group1, group2, group3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                />           
              </div>        
          </form>
    </div>
  )

  return (
    <>
      <div className="modal-backdrop " onClick={onClose} />
      <div className="modal assignee">
      <div className="modal-header">

        <h2>Assignee {selectedTask?.name}</h2>
        </div>
         
          <div className="modal-body">

              <div style={{ marginBottom: '15px', padding: '10px', background: '#e9ecef', borderRadius: '3px' }}>
                <div><strong>Task ID:</strong> {selectedTask?.id}</div>
              </div>
              
              {/* Tab Navigation */}
              <div className="tab-navigation">
                  {/* <button 
                  className={`tab-button ${activeTab === 'assignee' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assignee')}
                >
                  FiexedValuesTab
                </button> */}
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
        
             {/* <div className="expression-help">
                <h4>Expression Tips:</h4>
                <ul style={{ fontSize: '12px', color: '#666', margin: 0, paddingLeft: '20px' }}>
                  <li>Use <code>{'${variable}'}</code> syntax for expressions</li>
                  <li>Examples: <code>{'${approved}'}</code>, <code>{'${amount > 1000}'}</code></li>
                  <li>Supports comparison operators: ==, !=, &gt;, &lt;, &gt;=, &lt;=</li>
                  <li>Supports logical operators: &amp;&amp;, ||, !</li>
                </ul>
              </div> */}

         

                  {/* Tab Content */}
              <div className="tab-content">

              {/* {activeTab === 'assignee' &&
              <input
                  type="text"
                  value={manualAssignee}
                  onChange={(e) => setManualAssignee(e.target.value)}
                  // onChange={(e) => handleManualAssigneeChange(e.target.value)}
                  placeholder="Enter user name or email manually..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: manualAssignee ? '#fff3cd' : 'white'
                  }}
                />  
                
} */}

                {activeTab === 'assignee' && (
                  <>
                      <div className="form-group">
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            Type Assignee Name:
                          </label>
                          <input
                            type="text"
                            value={manualAssignee}
                            onChange={(e) => setManualAssignee(e.target.value)}
                            // onChange={(e) => handleManualAssigneeChange(e.target.value)}
                            placeholder="Enter user name or email manually..."
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '14px',
                              background: manualAssignee ? '#fff3cd' : 'white'
                            }}
                          />
                          {manualAssignee && (
                            <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
                              ✓ Manual input will be used: "{manualAssignee}"
                            </div>
                          )}
                        </div>

                        <AssigneeTab/>
                        </>
                )}
                {/* {activeTab === 'assignee' && <AssigneeTab />} */}
                {activeTab === 'candidateUsers' && <CandidateUsersTab />}
                {activeTab === 'candidateGroups' && <CandidateGroupsTab />}
                {/* {activeTab === 'fiexedValuesTab' && <FiexedValuesTab />} */}
                
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
