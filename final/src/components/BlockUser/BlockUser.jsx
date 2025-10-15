import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAllUsers, 
  updateUserStatus, 
  deleteUser,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  selectUserStats,
  clearError
} from '../../store/slices/firebaseUsersSlice';
import './BlockUser.css';

const BlockUser = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const userStats = useSelector(selectUserStats);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Load users on component mount
  useEffect(() => {
    console.log('🔄 BlockUser component mounted, fetching users...');
    dispatch(fetchAllUsers());
  }, [dispatch]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uid.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && !user.disabled) ||
      (filterStatus === 'blocked' && user.disabled);
    
    return matchesSearch && matchesStatus;
  });

  // Handle block/unblock user
  const handleToggleUserStatus = async (uid, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'block' : 'unblock';
    
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      console.log(`🔄 ${action}ing user ${uid}...`);
      dispatch(updateUserStatus({ uid, disabled: newStatus }));
    }
  };

  // Handle delete user
  const handleDeleteUser = async (uid) => {
    if (showDeleteConfirm === uid) {
      console.log(`🗑️ Deleting user ${uid}...`);
      dispatch(deleteUser(uid));
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(uid);
      setTimeout(() => setShowDeleteConfirm(null), 5000);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="block-user-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading Firebase users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="block-user-container">
      <div className="page-header">
        <h1>🔧 Firebase User Management</h1>
        <p>Manage Firebase Authentication users</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => dispatch(clearError())}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{userStats?.totalUsers || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{userStats?.activeUsers || 0}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{userStats?.blockedUsers || 0}</div>
          <div className="stat-label">Blocked Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{userStats?.newUsersThisMonth || 0}</div>
          <div className="stat-label">New This Month</div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by email, name, or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <button
            className={filterStatus === 'all' ? 'active' : ''}
            onClick={() => setFilterStatus('all')}
          >
            All Users
          </button>
          <button
            className={filterStatus === 'active' ? 'active' : ''}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </button>
          <button
            className={filterStatus === 'blocked' ? 'active' : ''}
            onClick={() => setFilterStatus('blocked')}
          >
            Blocked
          </button>
        </div>

        <button 
          className="refresh-button"
          onClick={() => dispatch(fetchAllUsers())}
          disabled={loading}
        >
          {loading ? '🔄' : '🔄'} Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p>👤 No users found</p>
            {searchTerm && <p>Try adjusting your search criteria</p>}
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Sign In</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.uid} className={user.disabled ? 'blocked-user' : ''}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="Avatar" />
                        ) : (
                          <span>{user.displayName ? user.displayName[0] : user.email?.[0] || '?'}</span>
                        )}
                      </div>
                      <div>
                        <div className="user-name">
                          {user.displayName || 'No Display Name'}
                        </div>
                        <div className="user-uid">{user.uid.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="email-cell">
                      {user.email || 'No Email'}
                      {user.emailVerified && <span className="verified-badge">✓</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.disabled ? 'blocked' : 'active'}`}>
                      {user.disabled ? '🔒 Blocked' : '✅ Active'}
                    </span>
                  </td>
                  <td className="date-cell">
                    {formatDate(user.creationTime)}
                  </td>
                  <td className="date-cell">
                    {formatDate(user.lastSignInTime)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className={`action-btn ${user.disabled ? 'unblock-btn' : 'block-btn'}`}
                        onClick={() => handleToggleUserStatus(user.uid, user.disabled)}
                        disabled={loading}
                      >
                        {user.disabled ? '🔓 Unblock' : '🔒 Block'}
                      </button>
                      <button
                        className={`action-btn delete-btn ${showDeleteConfirm === user.uid ? 'confirm' : ''}`}
                        onClick={() => handleDeleteUser(user.uid)}
                        disabled={loading}
                      >
                        {showDeleteConfirm === user.uid ? '⚠️ Confirm' : '🗑️ Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {loading && users.length > 0 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
};

export default BlockUser;
