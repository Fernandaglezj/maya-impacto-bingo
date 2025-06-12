import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createParticipant } from '@/lib/api';

interface ParticipantRegistrationProps {
  onRegistrationComplete: () => void;
}

const ParticipantRegistration: React.FC<ParticipantRegistrationProps> = ({ onRegistrationComplete }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Generar iniciales del nombre
      const initials = name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();

      await createParticipant(name, initials);
      onRegistrationComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar participante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[350px] mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Registro de Participante</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ParticipantRegistration; 