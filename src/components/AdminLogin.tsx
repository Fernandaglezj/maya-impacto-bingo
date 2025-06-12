
import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError('Contraseña incorrecta');
      setPassword('');
    } else {
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-100 to-indigo-200">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-purple-600 max-w-md w-full">
        <div className="text-center mb-6">
          <Lock className="mx-auto mb-4 text-purple-600" size={48} />
          <h1 className="text-2xl font-bold text-purple-800 mb-2">
            Acceso de Administrador
          </h1>
          <p className="text-purple-600">
            Ingresa la contraseña para ver los resultados del bingo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-600 focus:outline-none text-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Ingresar
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-purple-600">
          <p>💡 Tip: Contacta al administrador si no tienes la contraseña</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
