import { useEffect, useState, type FormEvent } from 'react';
import { authClient, useSession } from '../lib/auth-client';

interface Props {
  initialSession?: any;
}
export default function SignIn({ initialSession }: Props) {
  const { data: session } = useSession();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('/');
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get('redirect');
    if (
      target?.startsWith('/') &&
      !target.startsWith('//') &&
      !target.includes('\\')
    )
      setRedirectUrl(target);
  }, []);
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            email,
            password,
            name,
            callbackURL: redirectUrl,
          })
        : await authClient.signIn.email({
            email,
            password,
            callbackURL: redirectUrl,
          });
      if (result.error) {
        setError(
          result.error.message || 'Det gick inte att logga in. Försök igen.',
        );
        return;
      }
      window.location.href = redirectUrl;
    } catch {
      setError('Det gick inte att ansluta. Försök igen.');
    } finally {
      setLoading(false);
    }
  };
  if (session ?? initialSession)
    return (
      <a href="/" className="btn-primary">
        Till dina quiz →
      </a>
    );
  return (
    <div className="section">
      <h1>{isSignUp ? 'Skapa konto' : 'Välkommen tillbaka.'}</h1>
      <p className="subtitle">
        Logga in, lämna en låt och lär känna kollegornas musiksmak.
      </p>
      <form onSubmit={handleSubmit} className="form">
        {isSignUp && (
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Namn
            </label>
            <input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            E-postadress
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Lösenord
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && (
          <div role="alert" className="error-message">
            {error}
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Vänta…' : isSignUp ? 'Skapa konto' : 'Logga in →'}
        </button>
      </form>
      <p>
        {isSignUp ? 'Har du redan ett konto?' : 'Första gången här?'}{' '}
        <button
          className="btn-secondary btn-small"
          onClick={() => {
            setIsSignUp((v) => !v);
            setError('');
          }}
        >
          {isSignUp ? 'Logga in' : 'Skapa konto'}
        </button>
      </p>
    </div>
  );
}
