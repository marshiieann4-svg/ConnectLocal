import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [ward, setWard] = useState('');
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ward) params.append('ward', ward);
      if (period) params.append('period', period);
      const res = await api.get(`/gamification/leaderboard?${params.toString()}`);
      setUsers(res.data.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard', error);
    } finally {
      setLoading(false);
    }
  }, [ward, period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="container mt-4">
      <h1 className="mb-4">🏆 Community Leaderboard</h1>
      <div className="row mb-4">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Filter by ward"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">All time</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
        </div>
        <div className="col-md-4">
          <button className="btn btn-primary" onClick={fetchLeaderboard}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
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
                  <td>{user.ward}</td>
                  <td>{user.points}</td>
                  <td>
                    <Link to={`/profile/${user._id}`} className="btn btn-sm btn-outline-primary">View</Link>
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