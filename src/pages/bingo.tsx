import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MayaBingo from '@/components/MayaBingo';

interface BingoUser {
  id: string;
  username: string;
  display_name: string;
  has_voted: boolean;
}

export default function BingoPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<BingoUser | null>(null);

  useEffect(() => {
    // Obtener los datos del usuario de localStorage
    const storedUserData = localStorage.getItem('currentUser');
    if (!storedUserData) {
      // Si no hay usuario, redirigir al login
      navigate('/');
    } else {
      try {
        const userData = JSON.parse(storedUserData);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/');
      }
    }
  }, [navigate]);

  if (!user) {
    return null; // O un componente de carga
  }

  return (
    <MayaBingo 
      username={user.username} 
      userId={user.id}
      user={user}
    />
  );
} 