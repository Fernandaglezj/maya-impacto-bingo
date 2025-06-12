import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MayaBingo from '@/components/MayaBingo';

interface BingoUser {
  id: string;
  username: string;
  display_name: string;
  has_voted: boolean;
}

export default function DMBingo() {
  const navigate = useNavigate();
  const [user, setUser] = useState<BingoUser | null>(null);

  useEffect(() => {
    // Obtener los datos del usuario de localStorage específico para DM
    const storedUserData = localStorage.getItem('currentDMUser');
    if (!storedUserData) {
      // Si no hay usuario, redirigir al login de DM
      navigate('/dm');
    } else {
      try {
        const userData = JSON.parse(storedUserData);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing DM user data:', error);
        navigate('/dm');
      }
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-800 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {user && (
        <MayaBingo
          username={user.username}
          userId={user.id}
          user={user}
          source="dm"
        />
      )}
    </div>
  );
} 