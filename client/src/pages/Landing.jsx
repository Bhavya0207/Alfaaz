import { Link } from 'react-router-dom';
import { BookOpen, Feather, ArrowRight, Award } from 'lucide-react';

export default function Landing() {
  return (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', margin: '4rem 0 6rem' }}>
        <h1 className="title">
          Unleash Your <span className="text-gradient">Creativity</span>
        </h1>
        <p className="subtitle" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
          Welcome to Alfaaz, the ultimate destination for writers. Participate in our national level story and poetry writing competitions and showcase your talent to the world.
        </p>
        <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
          Register Now <ArrowRight size={20} />
        </Link>
      </div>

      <div className="grid-2">
        <div className="glass-card animate-fade-in delay-1">
          <BookOpen size={40} color="var(--accent-1)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Story Writing Competition</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Weave your imagination into words. Whether it's fiction, non-fiction, sci-fi, or fantasy, bring your characters to life and take us on an unforgettable journey.
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Word Limit: 1000 - 3000 words</li>
            <li>Any genre is welcome</li>
            <li>Original content only</li>
          </ul>
        </div>

        <div className="glass-card animate-fade-in delay-2">
          <Feather size={40} color="var(--accent-2)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Poetry Writing Competition</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Express your deepest emotions through verse. Rhyming or free verse, haiku or sonnet – let your poetic voice resonate and touch the hearts of our readers.
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>No strict line limit</li>
            <li>Multiple poetic forms accepted</li>
            <li>Original content only</li>
          </ul>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '6rem 0' }} className="animate-fade-in delay-3">
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <Award size={32} />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Exciting Prizes</h2>
        <p className="subtitle">
          Winners will receive cash prizes, certificates of excellence, and a chance to get published in our annual anthology.
        </p>
      </div>
    </div>
  );
}
