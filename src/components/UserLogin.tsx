import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from 'lucide-react';
import { loginUser, markUserVoted } from '@/lib/api';

// Esta lista de usuarios debería venir de una base de datos en una aplicación real
const AUTHORIZED_USERS = {
  'usuario1': { password: 'pass1', name: 'Participante 1', hasVoted: false },
  'usuario2': { password: 'pass2', name: 'Participante 2', hasVoted: false },
  'usuario3': { password: 'pass3', name: 'Participante 3', hasVoted: false },
};

interface UserLoginProps {
  onLoginSuccess: (username: string, displayName: string) => void;
}

const UserLogin: React.FC<UserLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await loginUser(username, password);
      
      if (!response.success || !response.user) {
        setError(response.message || 'Error de autenticación');
        return;
      }

      onLoginSuccess(response.user.username, response.user.display_name);
    } catch (error) {
      setError('Error al intentar iniciar sesión');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <Card className="w-[400px] border-4 border-amber-600">
        <CardHeader className="text-center">
          <div className="w-full flex justify-center mb-4">
            <Lock className="h-12 w-12 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-amber-800">Bingo de Impacto Exprés</CardTitle>
          <CardDescription className="text-amber-700">
            Ingresa tus credenciales para participar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-2 border-amber-200 focus:border-amber-400"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-amber-200 focus:border-amber-400"
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLogin; 