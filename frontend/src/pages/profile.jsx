import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfileCompletionWidget from '../components/ProfileCompletionWidget';

const RatingsTab = ({ userId }) => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await api.get(`/ratings/user/${userId}`);
        setRatings(res.data.data || []);
      } catch (err) {
        console.error('Failed to load ratings', err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchRatings();
  }, [userId]);

  if (loading) return <div className="text-center py-3"><span className="spinner-border spinner-border-sm"></span></div>;

  if (ratings.length === 0) {
    return <p className="text-muted">No ratings yet.</p>;
  }

  const avgComm = (ratings.reduce((s, r) => s + r.communication, 0) / ratings.length).toFixed(1);
  const avgRel = (ratings.reduce((s, r) => s + r.reliability, 0) / ratings.length).toFixed(1);
  const avgQual = (ratings.reduce((s, r) => s + r.quality, 0) / ratings.length).toFixed(1);
  const avgOverall = (ratings.reduce((s, r) => s + r.overall, 0) / ratings.length).toFixed(1);

  const renderStars = (val) => '★'.repeat(Math.round(val)) + '☆'.repeat(5 - Math.round(val));

  return (
    <div>
      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card bg-light border-0 text-center p-2">
            <div className="h5 mb-0" style={{ color: '#ffc107' }}>{avgOverall}</div>
            <small className="text-muted">Overall</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card bg-light border-0 text-center p-2">
            <div className="h6 mb-0">{avgComm}</div>
            <small className="text-muted">Communication</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card bg-light border-0 text-center p-2">
            <div className="h6 mb-0">{avgRel}</div>
            <small className="text-muted">Reliability</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card bg-light border-0 text-center p-2">
            <div className="h6 mb-0">{avgQual}</div>
            <small className="text-muted">Quality</small>
          </div>
        </div>
      </div>

      <h6 className="fw-bold mb-3">Reviews ({ratings.length})</h6>
      {ratings.filter(r => r.isPublic !== false).map((rating) => (
        <div key={rating._id} className="card border-0 bg-light mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{rating.raterId?.name || 'Anonymous'}</strong>
                <div style={{ color: '#ffc107' }}>{renderStars(rating.overall)}</div>
              </div>
              <small className="text-muted">
                {new Date(rating.createdAt).toLocaleDateString()}
              </small>
            </div>
            {rating.comment && <p className="mt-2 mb-0 text-muted">{rating.comment}</p>}
            <div className="mt-2 d-flex gap-3">
              <small className="text-muted">Comm: {rating.communication}/5</small>
              <small className="text-muted">Rel: {rating.reliability}/5</small>
              <small className="text-muted">Qual: {rating.quality}/5</small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [points, setPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [conversationError, setConversationError] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [picturePreview, setPicturePreview] = useState(null);

  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = !userId || userId === currentUserId;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const endpoint = userId && userId !== currentUserId
        ? `/users/${userId}`
        : '/users/profile';

      const res = await api.get(endpoint);
      setProfile(res.data.user);
      setBadges(res.data.user.badges || []);
      setPoints(res.data.user.points || 0);
      setEditForm({
        bio: res.data.user.bio || '',
        skills: res.data.user.skills || [],
        languages: res.data.user.languages || [],
        servicesOffered: res.data.user.servicesOffered || [],
        experience: res.data.user.experience || { years: 0, description: '' },
        emergencyContact: res.data.user.emergencyContact || { name: '', relationship: '', phone: '' },
        availability: res.data.user.availability || {}
      });

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

  const handleSendMessage = async () => {
    if (!userId || startingConversation) return;

    try {
      setStartingConversation(true);
      setConversationError('');
      const res = await api.post('/messages/conversations', { otherUserId: userId });
      navigate(`/chat/${res.data.data._id}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start conversation';
      setConversationError(message);
      console.error('Failed to start conversation', error);
    } finally {
      setStartingConversation(false);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPicturePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setUploadingPicture(true);
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const res = await api.post('/upload/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfile({ ...profile, profilePicture: res.data.profilePicture });
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Failed to upload picture', error);
      alert('Failed to upload profile picture');
      setPicturePreview(null);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.put('/users/profile', editForm);
      await fetchProfile();
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    setEditForm({
      ...editForm,
      skills: [...editForm.skills, { name: '', category: '', experienceLevel: 'beginner' }]
    });
  };

  const updateSkill = (index, field, value) => {
    const newSkills = [...editForm.skills];
    newSkills[index][field] = value;
    setEditForm({ ...editForm, skills: newSkills });
  };

  const removeSkill = (index) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter((_, i) => i !== index)
    });
  };
  const addLanguage = () => {
    setEditForm({
      ...editForm,
      languages: [...(editForm.languages || []), '']
    });
  };

  const updateLanguage = (index, value) => {
    const newLanguages = [...editForm.languages];
    newLanguages[index] = value;
    setEditForm({ ...editForm, languages: newLanguages });
  };

  const removeLanguage = (index) => {
    setEditForm({
      ...editForm,
      languages: editForm.languages.filter((_, i) => i !== index)
    });
  };

  const toggleService = (service) => {
    const services = editForm.servicesOffered || [];
    const index = services.indexOf(service);
    if (index > -1) {
      setEditForm({
        ...editForm,
        servicesOffered: services.filter((_, i) => i !== index)
      });
    } else {
      setEditForm({
        ...editForm,
        servicesOffered: [...services, service]
      });
    }
  };

  const serviceOptions = [
    { value: 'companionship', label: 'Companionship' },
    { value: 'meal_preparation', label: 'Meal Preparation' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'cleaning', label: 'Cleaning & Housework' },
    { value: 'shopping', label: 'Shopping & Errands' },
    { value: 'medication_reminders', label: 'Medication Reminders' },
    { value: 'personal_care', label: 'Personal Care' },
    { value: 'respite_care', label: 'Respite Care' },
    { value: 'mobility_assistance', label: 'Mobility Assistance' },
    { value: 'other', label: 'Other' }
  ];
  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!profile) return <div className="alert alert-danger">Profile not found</div>;

  return (
    <div className="container-fluid">
      {/* Profile Completion Widget for Own Profile */}
      {isOwnProfile && (
        <div className="row mb-4">
          <div className="col-12">
            <ProfileCompletionWidget />
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="cl-card text-center">
              {picturePreview || profile.profilePicture ? (
                <img
                  src={picturePreview || profile.profilePicture}
                  alt={profile.name}
                  className="rounded-circle mb-3 border"
                  style={{ width: 120, height: 120, objectFit: 'cover' }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center rounded-circle mb-3 bg-light border mx-auto"
                     style={{ width: 120, height: 120 }}>
                  <i className="fas fa-user fa-3x text-muted"></i>
                </div>
              )}
              
              {isOwnProfile && (
                <div className="mb-3">
                  <input
                    type="file"
                    id="profilePictureInput"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="profilePictureInput"
                    className="btn btn-sm btn-outline-primary"
                    style={{ cursor: 'pointer' }}
                  >
                    {uploadingPicture ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-camera me-1"></i>
                        Change Picture
                      </>
                    )}
                  </label>
                </div>
              )}
              
              <h4 className="mb-1">{profile.name}</h4>
              <p className="text-muted small mb-3">
                {profile.accountType} {profile.role && `• ${profile.role}`}
              </p>
              
              <div className="d-flex justify-content-around text-center mb-3">
                <div>
                  <div className="h5 mb-0">{profile.averageRating?.toFixed(1) || '0.0'}</div>
                  <small className="text-muted">Rating</small>
                </div>
                <div>
                  <div className="h5 mb-0">{points}</div>
                  <small className="text-muted">Points</small>
                </div>
                <div>
                  <div className="h5 mb-0">{badges.length}</div>
                  <small className="text-muted">Badges</small>
                </div>
              </div>

              <div className="text-start mb-3">
                <small className="text-muted d-block mb-1">
                  <i className="fas fa-map-marker-alt me-2"></i>{profile.ward}
                </small>
                {profile.email && (
                  <small className="text-muted d-block mb-1">
                    <i className="fas fa-envelope me-2"></i>{profile.email}
                  </small>
                )}
                <small className="text-muted d-block">
                  <i className="fas fa-phone me-2"></i>{profile.phone}
                </small>
              </div>

              {!isOwnProfile && (
                <>
                  <button
                    className="btn btn-cl-primary w-100"
                    onClick={handleSendMessage}
                    disabled={startingConversation}
                  >
                    {startingConversation ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Starting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-comment me-2"></i>Message
                      </>
                    )}
                  </button>
                  {conversationError && (
                    <div className="alert alert-danger py-2 px-3 mt-3 mb-0 small" role="alert">
                      {conversationError}
                    </div>
                  )}
                </>
              )}

              {isOwnProfile && !editing && (
                <button className="btn btn-cl-primary w-100" onClick={() => setEditing(true)}>
                  <i className="fas fa-edit me-2"></i>Edit Profile
                </button>
              )}
            </div>
        </div>

        <div className="col-lg-8">
          <div className="cl-card">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'overview' ? 'active' : 'text-dark'}`}
                    onClick={() => setActiveTab('overview')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'badges' ? 'active' : 'text-dark'}`}
                    onClick={() => setActiveTab('badges')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    Badges
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'ratings' ? 'active' : 'text-dark'}`}
                    onClick={() => setActiveTab('ratings')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    Ratings
                  </button>
                </li>
                {isOwnProfile && (
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'history' ? 'active' : 'text-dark'}`}
                      onClick={() => setActiveTab('history')}
                      style={{ border: 'none', background: 'none' }}
                    >
                      Point History
                    </button>
                  </li>
                )}
              </ul>

              <div style={{ marginTop: '1rem' }}>
              {activeTab === 'overview' && (
                <div>
                  {editing ? (
                    <>
                      <div className="mb-4">
                        <label className="form-label fw-bold">Bio</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          placeholder="Tell others about yourself..."
                        />
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-bold mb-0">Skills</label>
                          <button className="btn btn-sm btn-outline-dark" onClick={addSkill}>
                            <i className="fas fa-plus me-1"></i>Add Skill
                          </button>
                        </div>
                        {editForm.skills.map((skill, index) => (
                          <div key={index} className="card mb-2 p-3">
                            <div className="row g-2">
                              <div className="col-md-5">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Skill name"
                                  value={skill.name}
                                  onChange={(e) => updateSkill(index, 'name', e.target.value)}
                                />
                              </div>
                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Category"
                                  value={skill.category}
                                  onChange={(e) => updateSkill(index, 'category', e.target.value)}
                                />
                              </div>
                              <div className="col-md-3">
                                <select
                                  className="form-select form-select-sm"
                                  value={skill.experienceLevel}
                                  onChange={(e) => updateSkill(index, 'experienceLevel', e.target.value)}
                                >
                                  <option value="beginner">Beginner</option>
                                  <option value="intermediate">Intermediate</option>
                                  <option value="advanced">Advanced</option>
                                  <option value="expert">Expert</option>
                                </select>
                              </div>
                              <div className="col-md-1">
                                <button
                                  className="btn btn-sm btn-outline-danger w-100"
                                  onClick={() => removeSkill(index)}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Languages */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-bold mb-0">Languages</label>
                          <button className="btn btn-sm btn-outline-dark" onClick={addLanguage}>
                            <i className="fas fa-plus me-1"></i>Add Language
                          </button>
                        </div>
                        {(editForm.languages || []).map((lang, index) => (
                          <div key={index} className="input-group mb-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="e.g., English, Zulu, Afrikaans"
                              value={lang}
                              onChange={(e) => updateLanguage(index, e.target.value)}
                            />
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeLanguage(index)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Services Offered (for helpers) */}
                      {(profile.role === 'helper' || profile.role === 'both') && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Services You Offer</label>
                          <div className="row g-2">
                            {serviceOptions.map((service) => (
                              <div key={service.value} className="col-md-6">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`service-${service.value}`}
                                    checked={(editForm.servicesOffered || []).includes(service.value)}
                                    onChange={() => toggleService(service.value)}
                                  />
                                  <label className="form-check-label" htmlFor={`service-${service.value}`}>
                                    {service.label}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      <div className="mb-3">
                        <label className="form-label fw-bold">Experience</label>
                        <div className="row g-2 mb-2">
                          <div className="col-md-3">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Years"
                              value={editForm.experience?.years || 0}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                experience: { ...editForm.experience, years: parseInt(e.target.value) || 0 }
                              })}
                              min="0"
                            />
                          </div>
                          <div className="col-md-9">
                            <small className="text-muted">Years of experience</small>
                          </div>
                        </div>
                        <textarea
                          className="form-control form-control-sm"
                          rows="3"
                          placeholder="Describe your experience..."
                          value={editForm.experience?.description || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            experience: { ...editForm.experience, description: e.target.value }
                          })}
                        />
                      </div>

                      {/* Emergency Contact */}
                      <div className="mb-3">
                        <label className="form-label fw-bold">Emergency Contact</label>
                        <div className="row g-2">
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Name"
                              value={editForm.emergencyContact?.name || ''}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                emergencyContact: { ...editForm.emergencyContact, name: e.target.value }
                              })}
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Relationship"
                              value={editForm.emergencyContact?.relationship || ''}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                emergencyContact: { ...editForm.emergencyContact, relationship: e.target.value }
                              })}
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="tel"
                              className="form-control form-control-sm"
                              placeholder="Phone"
                              value={editForm.emergencyContact?.phone || ''}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                emergencyContact: { ...editForm.emergencyContact, phone: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-dark"
                          onClick={handleSaveProfile}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditing(false);
                            fetchProfile();
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h6 className="fw-bold mb-3">Bio</h6>
                      <p className="text-muted">{profile.bio || 'No bio yet.'}</p>

                      {/* Languages */}
                      {profile.languages?.length > 0 && (
                        <>
                          <h6 className="fw-bold mb-3 mt-4">Languages</h6>
                          <div className="d-flex flex-wrap gap-2">
                            {profile.languages.map((lang, idx) => (
                              <span key={idx} className="badge bg-primary">
                                <i className="fas fa-language me-1"></i>{lang}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Experience */}
                      {profile.experience?.years > 0 && (
                        <>
                          <h6 className="fw-bold mb-3 mt-4">Experience</h6>
                          <p className="mb-2">
                            <strong>{profile.experience.years} {profile.experience.years === 1 ? 'year' : 'years'}</strong> of experience
                          </p>
                          {profile.experience.description && (
                            <p className="text-muted">{profile.experience.description}</p>
                          )}
                        </>
                      )}

                      {/* Services Offered */}
                      {profile.servicesOffered?.length > 0 && (
                        <>
                          <h6 className="fw-bold mb-3 mt-4">Services Offered</h6>
                          <div className="row g-2">
                            {profile.servicesOffered.map((service, idx) => {
                              const serviceLabel = serviceOptions.find(s => s.value === service)?.label || service;
                              return (
                                <div key={idx} className="col-md-6">
                                  <div className="card border-0 bg-light p-2">
                                    <small>
                                      <i className="fas fa-check-circle text-success me-2"></i>
                                      {serviceLabel}
                                    </small>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      <h6 className="fw-bold mb-3 mt-4">Skills</h6>
                      {profile.skills?.length > 0 ? (
                        <div className="row g-2">
                          {profile.skills.map((skill, idx) => (
                            <div key={idx} className="col-md-6">
                              <div className="card border-0 bg-light p-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong>{skill.name}</strong>
                                    <div className="small text-muted">{skill.category}</div>
                                  </div>
                                  <span className="badge bg-dark">{skill.experienceLevel}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">No skills listed yet.</p>
                      )}

                      {/* Certifications */}
                      {profile.certifications?.length > 0 && (
                        <>
                          <h6 className="fw-bold mb-3 mt-4">Certifications</h6>
                          <div className="list-group">
                            {profile.certifications.map((cert, idx) => (
                              <div key={idx} className="list-group-item">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong>{cert.name}</strong>
                                    <div className="small text-muted">{cert.issuedBy}</div>
                                  </div>
                                  {cert.issuedDate && (
                                    <small className="text-muted">
                                      {new Date(cert.issuedDate).getFullYear()}
                                    </small>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Verification Status */}
                      {(profile.backgroundCheckStatus && profile.backgroundCheckStatus !== 'none') && (
                        <>
                          <h6 className="fw-bold mb-3 mt-4">Verification</h6>
                          <div className="card border-0 bg-light p-3">
                            <div className="d-flex align-items-center">
                              <i className={`fas fa-shield-alt me-2 ${
                                profile.backgroundCheckStatus === 'approved' ? 'text-success' : 
                                profile.backgroundCheckStatus === 'pending' ? 'text-warning' : 'text-danger'
                              }`}></i>
                              <span>
                                Background Check: <strong className="text-capitalize">{profile.backgroundCheckStatus}</strong>
                              </span>
                            </div>
                            {profile.idVerified && (
                              <div className="d-flex align-items-center mt-2">
                                <i className="fas fa-id-card me-2 text-success"></i>
                                <span>ID Verified</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'badges' && (
                <div>
                  <h6 className="fw-bold mb-3">Earned Badges</h6>
                  {badges.length === 0 ? (
                    <p className="text-muted">No badges yet. Keep helping to earn badges!</p>
                  ) : (
                    <div className="row g-3">
                      {badges.map((badge) => (
                        <div key={badge._id} className="col-md-4">
                          <div className="card text-center border-0 bg-light h-100">
                            <div className="card-body">
                              <i className={`${badge.icon} fa-3x mb-3 text-dark`}></i>
                              <h6 className="mb-2">{badge.name}</h6>
                              <small className="text-muted">{badge.description}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ratings' && (
                <RatingsTab userId={userId || currentUserId} />
              )}

              {activeTab === 'history' && isOwnProfile && (
                <div>
                  <h6 className="fw-bold mb-3">Point History</h6>
                  {pointsHistory.length === 0 ? (
                    <p className="text-muted">No point transactions yet.</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {pointsHistory.map((tx) => (
                        <li key={tx._id} className="list-group-item d-flex justify-content-between align-items-center border-0 px-0">
                          <span>{tx.reason}</span>
                          <span className={`badge ${tx.points > 0 ? 'bg-success' : 'bg-danger'}`}>
                            {tx.points > 0 ? '+' : ''}{tx.points}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;