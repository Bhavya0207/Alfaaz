import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Link as LinkIcon, UploadCloud } from 'lucide-react';

const FEE_PER_COMPETITION = 100;
const SBI_COLLECT_URL = "https://www.onlinesbi.sbi/sbicollect/icollecthome.htm";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Individual Form State
  const [personalData, setPersonalData] = useState({
    name: '', email: '', phone: '', password: '', competitions: 'story', paymentReceipt: null
  });

  // College Form State
  const [collegeData, setCollegeData] = useState({
    collegeName: '', adminName: '', email: '', phone: '', password: '', paymentReceipt: null
  });
  const [participants, setParticipants] = useState([
    { name: '', email: '', phone: '', branch: '', year: '', competitions: 'story' }
  ]);

  const handleParticipantChange = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index][field] = value;
    setParticipants(newParticipants);
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: '', email: '', phone: '', branch: '', year: '', competitions: 'story' }]);
  };

  const removeParticipant = (index) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const calculateFees = () => {
    if (role === 'personal') {
      return personalData.competitions === 'both' ? FEE_PER_COMPETITION * 2 : FEE_PER_COMPETITION;
    } else {
      return participants.reduce((total, p) => {
        return total + (p.competitions === 'both' ? FEE_PER_COMPETITION * 2 : FEE_PER_COMPETITION);
      }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('role', role);

    if (role === 'personal') {
      if (!personalData.paymentReceipt) {
        setError('Please upload the payment receipt.');
        setLoading(false);
        return;
      }
      Object.keys(personalData).forEach(key => {
        formData.append(key, personalData[key]);
      });
    } else {
      if (!collegeData.paymentReceipt) {
        setError('Please upload the payment receipt.');
        setLoading(false);
        return;
      }
      Object.keys(collegeData).forEach(key => {
        if(key !== 'paymentReceipt') formData.append(key, collegeData[key]);
      });
      formData.append('paymentReceipt', collegeData.paymentReceipt);
      formData.append('participants', JSON.stringify(participants));
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="title" style={{ fontSize: '2.5rem' }}>Registration</h1>
        <p className="subtitle">Join the competition as an Individual or a College</p>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            type="button" 
            className={`btn ${role === 'personal' ? 'btn-primary' : 'btn-outline'}`} 
            style={{ flex: 1 }}
            onClick={() => setRole('personal')}
          >
            Individual
          </button>
          <button 
            type="button" 
            className={`btn ${role === 'college' ? 'btn-primary' : 'btn-outline'}`} 
            style={{ flex: 1 }}
            onClick={() => setRole('college')}
          >
            College
          </button>
        </div>

        {error && <div className="error-text" style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}
        {success && <div className="success-text" style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', marginBottom: '1.5rem' }}>{success} Redirecting...</div>}

        <form onSubmit={handleSubmit}>
          {role === 'personal' ? (
            <div className="animate-fade-in">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" required className="form-input" value={personalData.name} onChange={e => setPersonalData({...personalData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" required className="form-input" value={personalData.email} onChange={e => setPersonalData({...personalData, email: e.target.value})} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={personalData.phone} onChange={e => setPersonalData({...personalData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" required className="form-input" minLength={6} value={personalData.password} onChange={e => setPersonalData({...personalData, password: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Select Competition</label>
                <select className="form-select" value={personalData.competitions} onChange={e => setPersonalData({...personalData, competitions: e.target.value})}>
                  <option value="story">Story Writing</option>
                  <option value="poetry">Poetry Writing</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h3 style={{ marginBottom: '1rem', color: 'var(--accent-2)' }}>College Administrator Details</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">College Name</label>
                  <input type="text" required className="form-input" value={collegeData.collegeName} onChange={e => setCollegeData({...collegeData, collegeName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin/Rep Name</label>
                  <input type="text" required className="form-input" value={collegeData.adminName} onChange={e => setCollegeData({...collegeData, adminName: e.target.value})} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Admin Email</label>
                  <input type="email" required className="form-input" value={collegeData.email} onChange={e => setCollegeData({...collegeData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Phone</label>
                  <input type="text" className="form-input" value={collegeData.phone} onChange={e => setCollegeData({...collegeData, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Admin Password (for login)</label>
                <input type="password" required className="form-input" minLength={6} value={collegeData.password} onChange={e => setCollegeData({...collegeData, password: e.target.value})} />
              </div>

              <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--accent-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Participants List
                <button type="button" onClick={addParticipant} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                  <Plus size={16} /> Add
                </button>
              </h3>
              
              {participants.map((p, index) => (
                <div key={index} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Participant #{index + 1}</h4>
                    {participants.length > 1 && (
                      <button type="button" onClick={() => removeParticipant(index)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input type="text" required className="form-input" value={p.name} onChange={e => handleParticipantChange(index, 'name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email (Credentials will be sent here)</label>
                      <input type="email" required className="form-input" value={p.email} onChange={e => handleParticipantChange(index, 'email', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-3">
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input type="text" className="form-input" value={p.phone} onChange={e => handleParticipantChange(index, 'phone', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch & Year</label>
                      <input type="text" placeholder="e.g. CS 3rd Year" className="form-input" value={p.branch} onChange={e => handleParticipantChange(index, 'branch', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Competition</label>
                      <select className="form-select" value={p.competitions} onChange={e => handleParticipantChange(index, 'competitions', e.target.value)}>
                        <option value="story">Story Writing</option>
                        <option value="poetry">Poetry Writing</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '2rem 0', paddingTop: '2rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-2)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Total Fees: <span className="text-gradient" style={{ fontSize: '1.5rem' }}>₹{calculateFees()}</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Please pay the total fees via SBI Collect and upload the payment receipt below.
              </p>
              <a href={SBI_COLLECT_URL} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%' }}>
                <LinkIcon size={18} /> Pay via SBI Collect
              </a>
            </div>

            <div className="form-group">
              <label className="form-label">Upload Payment Receipt (Image)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.5rem', background: 'var(--input-bg)', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                  <UploadCloud size={20} /> 
                  {role === 'personal' ? (personalData.paymentReceipt ? personalData.paymentReceipt.name : 'Choose File') : (collegeData.paymentReceipt ? collegeData.paymentReceipt.name : 'Choose File')}
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={e => {
                      if(e.target.files[0]) {
                        if (role === 'personal') setPersonalData({...personalData, paymentReceipt: e.target.files[0]});
                        else setCollegeData({...collegeData, paymentReceipt: e.target.files[0]});
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
