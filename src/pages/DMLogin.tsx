import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { loginDMUser } from '@/lib/api';

export default function DMLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Por favor ingresa usuario y contraseña.",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Autenticar con Supabase usando la tabla dm_users
      const response = await loginDMUser(username.trim(), password.trim());
      
      if (response.success && response.user) {
        // Guardar los datos del usuario en localStorage con clave específica para DM
        localStorage.setItem('currentDMUser', JSON.stringify(response.user));
        
        toast({
          title: "¡Bienvenido a DM!",
          description: `Hola ${response.user.display_name}, ya puedes participar en el bingo DM.`,
        });
        
        navigate('/dmbingo');
      } else {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: response.message || "Credenciales incorrectas.",
        });
      }
    } catch (error) {
      console.error('Error during DM login:', error);
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor. Intenta de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fondo con degradado */}
      <img
        src="/fondos/Fondo inicial.png"
        alt="Fondo Maya"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="bg-white/90 backdrop-blur-sm border-2 border-amber-600/30 shadow-xl">
          <CardHeader className="space-y-4">
            <div className="w-full flex justify-center">
              <Lock className="h-12 w-12 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-center text-amber-900">
              Bingo de Impacto DM
            </CardTitle>
            <CardDescription className="text-center text-amber-700">
              Ingresa tus credenciales para participar (DM)
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
                  className="border-amber-200 focus:border-amber-500 bg-white/80"
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-amber-200 focus:border-amber-500 bg-white/80"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 