import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('story');
  
  const [submission, setSubmission] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        
        // Determine default tab based on competitions
        if (data.user.role !== 'college') {
          const comps = data.user.competitions;
          if (comps === 'poetry') setActiveTab('poetry');
          else setActiveTab('story');
          
          fetchSubmission(comps === 'poetry' ? 'poetry' : 'story');
        }
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const fetchSubmission = async (type) => {
    try {
      const res = await fetch(`/api/submissions/${type}`);
      if (res.ok) {
        const data = await res.json();
        setSubmission(data.content);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTabChange = (type) => {
    setActiveTab(type);
    setSaveStatus('');
    fetchSubmission(type);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('');
    try {
      const res = await fetch(`/api/submissions/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: submission })
      });
      if (res.ok) {
        setSaveStatus('Saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Failed to save.');
      }
    } catch (e) {
      setSaveStatus('Error connecting to server.');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading...</div>;

  if (user.role === 'college') {
    return (
      <div className="animate-fade-in glass-card">
        <h2 style={{ marginBottom: '1rem' }}>College Administrator Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome {user.name}. Your participants will log in individually to submit their entries using the credentials sent to their email.</p>
      </div>
    );
  }

  const canSubmitStory = user.competitions === 'both' || user.competitions === 'story';
  const canSubmitPoetry = user.competitions === 'both' || user.competitions === 'poetry';

  return (
    <div className="dashboard-grid animate-fade-in">
      <div className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{user.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.role === 'participant' ? 'Participant' : 'Individual'}</div>
          </div>
        </div>

        <div className="sidebar-nav">
          {canSubmitStory && (
            <div 
              className={`sidebar-item ${activeTab === 'story' ? 'active' : ''}`}
              onClick={() => handleTabChange('story')}
            >
              Story Submission
            </div>
          )}
          {canSubmitPoetry && (
            <div 
              className={`sidebar-item ${activeTab === 'poetry' ? 'active' : ''}`}
              onClick={() => handleTabChange('poetry')}
            >
              Poetry Submission
            </div>
          )}
        </div>
      </div>

      <div className="editor-container glass-card">
        <div className="editor-toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            {activeTab === 'story' ? 'Write Your Story' : 'Write Your Poetry'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {saveStatus && <span style={{ color: saveStatus.includes('success') ? 'var(--success)' : 'var(--error)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> {saveStatus}</span>}
            <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>
        
        <textarea 
          className="form-textarea" 
          style={{ flex: 1, minHeight: '500px', resize: 'vertical', background: 'transparent', border: 'none', boxShadow: 'none' }}
          placeholder={`Start writing your ${activeTab} here...`}
          value={submission}
          onChange={(e) => setSubmission(e.target.value)}
        />
      </div>
    </div>
  );
}
