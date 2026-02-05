// src/components/AuthButtons.tsx
import { authClient, useSession } from '../lib/auth-client';
import { useState } from 'react';

export default function AuthButtons() {
  const { data: session } = useSession();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await authClient.signUp.email({
          email,
          password,
          name,
          callbackURL: '/dashboard',
        });
      } else {
        await authClient.signIn.email({
          email,
          password,
          callbackURL: '/dashboard',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
  };

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user.name || session.user.email}!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>

      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="name"
              style={{ display: 'block', marginBottom: '5px' }}
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: '5px' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="password"
            style={{ display: 'block', marginBottom: '5px' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#0070f3',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {isSignUp ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}
