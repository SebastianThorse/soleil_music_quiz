// src/components/UserMenu.tsx
import { authClient, useSession } from '../lib/auth-client';
import { displayText } from '../lib/display-text';

interface Props {
  initialSession?: any;
}

export default function UserMenu({ initialSession }: Props) {
  const { data: session } = useSession();
  const currentSession = session ?? initialSession;

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/login';
  };

  if (!currentSession) {
    return (
      <a href="/login" className="btn-secondary">
        Logga in
      </a>
    );
  }

  return (
    <div className="user-menu">
      <span>{displayText(currentSession.user.name || currentSession.user.email)}</span>
      <button className="btn-secondary" onClick={handleLogout}>
        Logga ut
      </button>
    </div>
  );
}
