import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { PenTool } from 'lucide-react';
import { useState, useEffect } from 'react';

function Navbar() {
  const navigate = useNavigate();
  const [isLogged, setIsLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if(res.ok) {
          setIsLogged(true);
          return res.json();
        } else {
          setIsLogged(false);
          throw new Error('Not logged in');
        }
      })
      .then(data => {
        if (data.user && data.user.role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {
        setIsLogged(false);
        setIsAdmin(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLogged(false);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <nav className="navbar container">
      <Link to="/" className="nav-brand text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <PenTool size={28} color="var(--accent-1)" /> Alfaaz
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        {!isLogged ? (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary">Register Now</Link>
          </>
        ) : (
          <>
            {isAdmin ? (
              <Link to="/admin" className="nav-link">Admin Panel</Link>
            ) : (
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            )}
            <button onClick={handleLogout} className="btn btn-outline">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
