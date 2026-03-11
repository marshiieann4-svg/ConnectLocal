import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [ward, setWard] = useState('');
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUserId = localStorage.getItem('userId');

  const myRank = users.findIndex((user) => user._id === currentUserId) + 1;
  const myEntry = myRank > 0 ? users[myRank - 1] : null;
  const topThree = users.slice(0, 3);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (ward) params.append('ward', ward);
      if (period) params.append('period', period);
      const res = await api.get(`/gamification/leaderboard?${params.toString()}`);
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard', error);
      setError(error.response?.data?.message || 'Failed to load leaderboard');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [ward, period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getMedal = (position) => {
    if (position === 0) return { icon: 'fas fa-trophy', label: '1st', color: '#c9a227' };
    if (position === 1) return { icon: 'fas fa-medal', label: '2nd', color: '#8b8b8b' };
    return { icon: 'fas fa-award', label: '3rd', color: '#8f5a3c' };
  };

  return (
    <div>
      <div className="cl-page-header">
        <h1>Community Leaderboard</h1>
        <p style={{ color: 'var(--cl-gray-500)' }}>See who's making the biggest impact</p>
      </div>
      <div className="cl-filter-bar mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              type="text"
              className="cl-input"
              placeholder="Filter by ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select className="cl-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="all">All time</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
          <div className="col-md-4">
            <button className="btn btn-cl-primary w-100" onClick={fetchLeaderboard}>Refresh</button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-lg-4">
            <div className="cl-card h-100">
              <h6 style={{ color: 'var(--cl-gray-500)', marginBottom: '0.5rem' }}>My Rank</h6>
                {myEntry ? (
                  <>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="fw-bold fs-4">#{myRank}</div>
                        <div className="text-muted small">{myEntry.name}</div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">{myEntry.points || 0}</div>
                        <div className="text-muted small">points</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted small">You are not ranked in this filter yet.</div>
                )}
            </div>
          </div>

          <div className="col-lg-8">
            <div className="cl-card h-100">
                <h6 style={{ color: 'var(--cl-gray-500)', marginBottom: '0.75rem' }}>Top 3 Community Champions</h6>
                <div className="row g-2">
                  {topThree.map((user, index) => {
                    const medal = getMedal(index);
                    return (
                      <div className="col-md-4" key={user._id}>
                        <div className="border rounded p-3 h-100 bg-white">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="badge text-bg-light">{medal.label}</span>
                            <i className={medal.icon} style={{ color: medal.color }}></i>
                          </div>
                          <div className="fw-semibold text-truncate">{user.name}</div>
                          <div className="small text-muted text-truncate">{user.ward || 'N/A'}</div>
                          <div className="mt-2 fw-bold">{user.points || 0} pts</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="alert alert-secondary border-0 shadow-sm" role="alert">
          No leaderboard results yet for this filter.
        </div>
      ) : (
        <div className="table-responsive bg-white border rounded shadow-sm">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Ward</th>
                <th>Points</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id}>
                  <td>{index + 1}</td>
                  <td>
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 10 }} />
                    ) : (
                      <i className="fas fa-user-circle me-2"></i>
                    )}
                    {user.name}
                  </td>
                  <td>{user.ward || 'N/A'}</td>
                  <td>{user.points || 0}</td>
                  <td>
                    <Link to={`/profile/${user._id}`} className="btn btn-sm btn-outline-dark">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;