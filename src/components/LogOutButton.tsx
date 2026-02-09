// src/components/UserMenu.tsx
import { authClient, useSession } from '../lib/auth-client';

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
    return <a href="/login">Login</a>;
  }

  return (
    <div>
      <span>
        Welcome, {currentSession.user.name || currentSession.user.email}
      </span>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
