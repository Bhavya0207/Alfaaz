import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, IndianRupee, Key, Eye, X } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('metrics');
  
  const [metrics, setMetrics] = useState(null);
  const [registrations, setRegistrations] = useState({ users: [], participants: [] });
  const [submissions, setSubmissions] = useState([]);
  
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, targetId: null, targetType: '', name: '' });
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  const [submissionModal, setSubmissionModal] = useState({ isOpen: false, content: '', author: '', type: '' });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.role !== 'admin') {
          navigate('/login');
        } else {
          loadData('metrics');
        }
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  const loadData = async (tab) => {
    setActiveTab(tab);
    setLoading(true);
    try {
      if (tab === 'metrics') {
        const res = await fetch('/api/admin/metrics');
        setMetrics(await res.json());
      } else if (tab === 'registrations') {
        const res = await fetch('/api/admin/registrations');
        setRegistrations(await res.json());
      } else if (tab === 'submissions') {
        const res = await fetch('/api/admin/submissions');
        const data = await res.json();
        setSubmissions(data.submissions);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus('Updating...');
    try {
      const res = await fetch('/api/admin/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: passwordModal.targetId,
          targetType: passwordModal.targetType,
          newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus('Success!');
        setTimeout(() => closePasswordModal(), 2000);
      } else {
        setPasswordStatus(data.error || 'Failed to update');
      }
    } catch (err) {
      setPasswordStatus('Network error');
    }
  };

  const openPasswordModal = (id, type, name) => {
    setPasswordModal({ isOpen: true, targetId: id, targetType: type, name });
    setNewPassword('');
    setPasswordStatus('');
  };

  const closePasswordModal = () => {
    setPasswordModal({ isOpen: false, targetId: null, targetType: '', name: '' });
  };

  if (loading && !metrics) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Admin Panel...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: 0 }}>Admin Dashboard</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'metrics' ? 'btn-primary' : 'btn-outline'}`} onClick={() => loadData('metrics')}>Overview</button>
        <button className={`btn ${activeTab === 'registrations' ? 'btn-primary' : 'btn-outline'}`} onClick={() => loadData('registrations')}>Registrations</button>
        <button className={`btn ${activeTab === 'submissions' ? 'btn-primary' : 'btn-outline'}`} onClick={() => loadData('submissions')}>Submissions</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Refreshing data...</div>}

      {!loading && activeTab === 'metrics' && metrics && (
        <div className="grid-3 animate-fade-in">
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Users size={40} color="var(--accent-1)" />
            <h3 style={{ color: 'var(--text-secondary)' }}>Total Registrations</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{metrics.totalUsers + metrics.totalParticipants}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>({metrics.personalCount} Individual, {metrics.collegeCount} Colleges)</div>
          </div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <FileText size={40} color="var(--accent-2)" />
            <h3 style={{ color: 'var(--text-secondary)' }}>Total Submissions</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{metrics.totalSubmissions}</div>
          </div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <IndianRupee size={40} color="#10b981" />
            <h3 style={{ color: 'var(--text-secondary)' }}>Estimated Revenue</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>₹{metrics.totalFees}</div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'registrations' && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '1rem' }}>Colleges & Individuals</h2>
          <div style={{ overflowX: 'auto', marginBottom: '3rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Type</th>
                  <th style={{ padding: '1rem' }}>Name / College</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Competitions</th>
                  <th style={{ padding: '1rem' }}>Receipt</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{u.role}</td>
                    <td style={{ padding: '1rem' }}>{u.role === 'college' ? `${u.college_name} (${u.name})` : u.name}</td>
                    <td style={{ padding: '1rem' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>{u.competitions || 'N/A (College)'}</td>
                    <td style={{ padding: '1rem' }}>
                      {u.payment_receipt ? <a href={`/uploads/${u.payment_receipt}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Eye size={16}/> View</a> : 'None'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => openPasswordModal(u.id, 'user', u.name)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}><Key size={14}/> Set Password</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginBottom: '1rem' }}>College Participants</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>College</th>
                  <th style={{ padding: '1rem' }}>Competitions</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.participants.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{p.name}</td>
                    <td style={{ padding: '1rem' }}>{p.email}</td>
                    <td style={{ padding: '1rem' }}>{p.college_name}</td>
                    <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{p.competitions}</td>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => openPasswordModal(p.id, 'participant', p.name)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}><Key size={14}/> Set Password</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'submissions' && (
        <div className="animate-fade-in grid-2">
          {submissions.map(s => (
            <div key={s.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{s.author_name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.author_email}</div>
                </div>
                <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                  {s.competition_type}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Last updated: {new Date(s.updated_at).toLocaleString()}
              </div>
              <button 
                onClick={() => setSubmissionModal({ isOpen: true, content: s.content, author: s.author_name, type: s.competition_type })} 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: 'auto' }}
              >
                <Eye size={18} /> Read Submission
              </button>
            </div>
          ))}
          {submissions.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No submissions found.</div>}
        </div>
      )}

      {/* Password Modal */}
      {passwordModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Set Password for {passwordModal.name}</h3>
              <button onClick={closePasswordModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="text" 
                  required 
                  minLength={6} 
                  className="form-input" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              {passwordStatus && <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: passwordStatus.includes('Success') ? 'var(--success)' : 'var(--error)' }}>{passwordStatus}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Password</button>
            </form>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {submissionModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '2rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{submissionModal.author}'s {submissionModal.type}</h2>
              <button onClick={() => setSubmissionModal({ isOpen: false, content: '', author: '', type: '' })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.8', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              {submissionModal.content || <em style={{color: 'var(--text-secondary)'}}>Empty submission.</em>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
