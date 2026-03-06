import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [points, setPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUserId = localStorage.getItem('userId');
        // If userId exists and is different, fetch that user; otherwise fetch own profile
        const endpoint = userId && userId !== currentUserId
          ? `/users/${userId}`
          : '/users/profile';

        const res = await api.get(endpoint);
        setProfile(res.data.user);
        setBadges(res.data.user.badges || []);
        setPoints(res.data.user.points || 0);

        // Fetch point history only for own profile
        if (!userId || userId === currentUserId) {
          const pointsRes = await api.get(`/gamification/user/${currentUserId}`);
          setPointsHistory(pointsRes.data.transactions || []);
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleSendMessage = async () => {
    try {
      const res = await api.post('/messages/conversations', { otherUserId: userId });
      navigate(`/chat/${res.data.data._id}`);
    } catch (error) {
      console.error('Failed to start conversation', error);
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!profile) return <div className="alert alert-danger">Profile not found</div>;

  const isOwnProfile = !userId || userId === localStorage.getItem('userId');

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className="rounded-circle mb-3"
                  style={{ width: 120, height: 120 }}
                />
              ) : (
                <i className="fas fa-user-circle fa-5x mb-3 text-secondary"></i>
              )}
              <h4>{profile.name}</h4>
              <p className="text-muted">
                {profile.accountType} {profile.role && `• ${profile.role}`}
              </p>
              <p>
                <i className="fas fa-map-marker-alt me-2"></i>
                {profile.ward}
              </p>
              <p>
                <i className="fas fa-star me-2"></i>
                {profile.averageRating?.toFixed(1) || 'N/A'} ({profile.totalRatings || 0} ratings)
              </p>
              <p>
                <i className="fas fa-coins me-2"></i>
                {points} points
              </p>
              {!isOwnProfile && (
                <button className="btn btn-outline-primary w-100 mt-2" onClick={handleSendMessage}>
                  <i className="fas fa-comment me-2"></i>Message
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'ratings' ? 'active' : ''}`}
                onClick={() => setActiveTab('ratings')}
              >
                Ratings
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'badges' ? 'active' : ''}`}
                onClick={() => setActiveTab('badges')}
              >
                Badges
              </button>
            </li>
            {isOwnProfile && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  Point History
                </button>
              </li>
            )}
          </ul>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div>
                <h5>Bio</h5>
                <p>{profile.bio || 'No bio yet.'}</p>
                <h5>Skills</h5>
                {profile.skills?.length > 0 ? (
                  <ul>
                    {profile.skills.map((skill, idx) => (
                      <li key={idx}>
                        {skill.name} ({skill.experienceLevel})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No skills listed.</p>
                )}
              </div>
            )}

            {activeTab === 'ratings' && (
              <div>
                <h5>Recent Ratings</h5>
                <p>Coming soon...</p>
              </div>
            )}

            {activeTab === 'badges' && (
              <div>
                <h5>Earned Badges</h5>
                {badges.length === 0 ? (
                  <p>No badges yet. Keep helping to earn badges!</p>
                ) : (
                  <div className="row">
                    {badges.map((badge) => (
                      <div key={badge._id} className="col-md-4 mb-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <i className={`${badge.icon} fa-3x mb-2 text-primary`}></i>
                            <h6>{badge.name}</h6>
                            <small className="text-muted">{badge.description}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && isOwnProfile && (
              <div>
                <h5>Point History</h5>
                <ul className="list-group">
                  {pointsHistory.map((tx) => (
                    <li key={tx._id} className="list-group-item d-flex justify-content-between">
                      <span>{tx.reason}</span>
                      <span className={tx.points > 0 ? 'text-success' : 'text-danger'}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;