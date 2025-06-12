import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Trophy, Star, Users, BarChart3, Clock, Medal, Award, AlertCircle, Download, Crown, Unlock, Lightbulb, Target, Zap, Palette, Heart } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Removemos las importaciones de Supabase ya que usaremos configuración local
import { toast } from "@/components/ui/use-toast";
import { getBingoRanking, reopenUserVoting, createParticipantsFromLocalEmojis, getBingoRankingWithSource, reopenUserVotingWithSource } from '@/lib/api';

// Configuración local de emojis con sus respectivas imágenes
const LOCAL_EMOJI_CONFIG = [
  { emoji: "🦊", name: "Dayane", image_url: "/caritas/Dayane Lizeth Camacho Martinez.JPG" },
  { emoji: "🐨", name: "Ileana Medina Moreno", image_url: "/caritas/Ileana" },
  { emoji: "🐼", name: "Marco Antonio Barraza Mendoza", image_url: "/caritas/Marco Antonio Barraza Mendoza.jpeg" },
  { emoji: "🐸", name: "Jose Fausto Castorena", image_url: "/caritas/Jose Fausto Castorena.jpg" },
  { emoji: "🦋", name: "Maria Geraldine Hernandez Gonzalez", image_url: "/caritas/Maria Geraldine Hernandez Gonzalez.jpg" },
  { emoji: "🐝", name: "Manuela Zapata Tamayo", image_url: "/caritas/Manuela Zapata Tamayo.png" },
  { emoji: "🌺", name: "Karla Cristina Marin Gil", image_url: "/caritas/Karla Cristina Marin Gil.jpg" },
  { emoji: "🌻", name: "Catherine Zuluaga Alcaraz", image_url: "/caritas/Catherine Zuluaga Alcaraz.jpg" },
  { emoji: "🌙", name: "Nicol", image_url: "/caritas/Mariel Nicoleth Calderon Michel.jpeg" },
  { emoji: "⭐", name: "Perla Tamara Sanchez Macias", image_url: "/caritas/Perla Tamara Sanchez Macias.jpg" },
  { emoji: "🍀", name: "Alicia Steffani Estrada Osorno", image_url: "/caritas/Alicia Steffani Estrada Osorno.jpg" },
  { emoji: "🌿", name: "Amado Garcia Martinez", image_url: "/caritas/Amado Garcia Martinez.jpeg" },
  { emoji: "🦜", name: "Rosa Elena Velarde Soto", image_url: "/caritas/Rosa Elena Velarde Soto.jpg" },
  { emoji: "🌊", name: "Samantha Eugenia Acosta Santana", image_url: "/caritas/Samantha Eugenia Acosta Santana.jpeg" },
  { emoji: "🔥", name: "Dayra Aylin Gamiño Ponce", image_url: "/caritas/Dayra Aylin Gamiño Ponce.jpeg" },
  { emoji: "🌈", name: "Paola Moreno", image_url: "/caritas/Viky Paola Moreno Pedro.jpg" },
  { emoji: "🎨", name: "Alondra Elideth Ibarra Cortes", image_url: "/caritas/Alondra Elideth Ibarra Cortes.jpg" },
  { emoji: "🎭", name: "Angel Abad Cardenas Garcia", image_url: "/caritas/Angel Abad Cardenas Garcia.jpg" },
  { emoji: "🎪", name: "Angelica Lopez Ley", image_url: "/caritas/Angelica Lopez Ley.jpeg" }
];
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ADMIN_PASSWORD = "maya2024"; // En un caso real, esto debería estar en el backend
const REOPEN_LOG_KEY = 'bingoReopenLog';

// Sistema de puntuación
const pointsSystem: {[key: string]: number} = {
  "Se rifó ayudando aunque no era su chamba": 5,
  "Hizo fácil lo que parecía chino mandarín": 5,
  "Compartió un tip o truco que a todos nos sirvió": 5,
  "Se aventó la ayuda sin que nadie la pidiera": 4,
  "Sacó la mejor actitud de servicio": 3,
  "Le dio crédito a alguien que lo hizo increíble": 4,
  "Respondió con calma y buena onda una duda": 3,
  "Contagió buena vibra al equipo": 2,
  "Dijo lo que se tenía que decir, con respeto": 3,
  "Escuchó con atención de verdad, no por cumplir": 3,
  "Se plantó por los valores cuando tocó": 4,
  "Le dio foco y luz a alguien más": 4,
  // Otro equipo (5 puntos)
  "🌐 Compartió una idea que ayudó a otro equipo a mejorar su trabajo": 5,
  "🌐 Colaboró con otro equipo para lograr un resultado conjunto": 5,
  "🌐 Facilitó que otro equipo pudiera avanzar más rápido": 5,
  // Innovación (4 puntos)
  "💡 Aplicó tecnología o nuevas formas de trabajar en su tarea": 4,
  // Trabajo en equipo (3 puntos)
  "👥 Ayudó a enfocar al equipo cuando se estaba desviando": 3,
  // Proactividad (3 puntos)
  "⚡ Identificó y resolvió un problema sin que se lo pidieran": 3,
  "⚡ Se adelantó a posibles obstáculos y los previno": 3,
  // Creatividad (3 puntos)
  "🎨 Pensó fuera de lo común para resolver una situación": 3,
  // Buen compañero (0 puntos)
  "💚 Animó a alguien cuando más lo necesitaba": 0
};

// Datos de ejemplo con fotos de personas
const resultadosIniciales = [
  {
    id: 1,
    nombre: "Ana García",
    foto: "https://ui.shadcn.com/avatars/01.png",
    iniciales: "AG",
    puntos: 12,
    reconocimientos: [
      { texto: "Se rifó ayudando aunque no era su chamba", puntos: 5 },
      { texto: "Contagió buena vibra al equipo", puntos: 2 },
      { texto: "Le dio foco y luz a alguien más", puntos: 4 }
    ]
  },
  {
    id: 2,
    nombre: "Carlos Ruiz",
    foto: "https://ui.shadcn.com/avatars/02.png",
    iniciales: "CR",
    puntos: 9,
    reconocimientos: [
      { texto: "Sacó la mejor actitud de servicio", puntos: 3 },
      { texto: "Respondió con calma y buena onda una duda", puntos: 3 },
      { texto: "Contagió buena vibra al equipo", puntos: 2 }
    ]
  },
  {
    id: 3,
    nombre: "Laura Méndez",
    foto: "https://ui.shadcn.com/avatars/03.png",
    iniciales: "LM",
    puntos: 7,
    reconocimientos: [
      { texto: "Dijo lo que se tenía que decir, con respeto", puntos: 3 },
      { texto: "Contagió buena vibra al equipo", puntos: 2 },
      { texto: "Respondió con calma y buena onda una duda", puntos: 3 }
    ]
  }
];

interface CompletedUserData {
  username: string;
  emoji: string;
  timestamp: number;
  assignments: {[key: number]: number[]};
}

interface PersonResult {
  emoji: string;
  name: string;
  imageUrl: string | null;
  totalSelections: number;
}

interface RankingResult {
  emoji: string;
  name: string;
  imageUrl: string | null;
  totalPoints: number;
  totalSelections: number;
  pointsByCategory: {
    otroEquipo: number;
    innovacion: number;
    trabajoEquipo: number;
    proactividad: number;
    creatividad: number;
    buenCompanero: number;
  };
}

interface VotingStats {
  totalUsers: number;
  completedUsers: number;
  pendingUsers: number;
}

// Sistema de puntuación por tipo de casilla
const POINT_SYSTEM = {
  otroEquipo: 5,    // Casillas de "Otro equipo"
  innovacion: 4,    // Casillas de Innovación
  trabajoEquipo: 3, // Casillas de Trabajo en equipo
  proactividad: 3,  // Casillas de Proactividad
  creatividad: 3,   // Casillas de Creatividad
  buenCompanero: 0  // Casillas de Buen compañero
};

// Mapeo de textos de casillas a categorías
const CELL_CATEGORIES = [
  // Casillas de Otro equipo (5 puntos)
  { text: "🌐 Compartió una idea que ayudó a otro equipo a mejorar su trabajo", category: "otroEquipo" },
  { text: "🌐 Colaboró con otro equipo para lograr un resultado conjunto", category: "otroEquipo" },
  { text: "🌐 Facilitó que otro equipo pudiera avanzar más rápido", category: "otroEquipo" },
  // Casilla de Innovación (4 puntos)
  { text: "💡 Aplicó tecnología o nuevas formas de trabajar en su tarea", category: "innovacion" },
  // Casilla de Trabajo en equipo (3 puntos)
  { text: "👥 Ayudó a enfocar al equipo cuando se estaba desviando", category: "trabajoEquipo" },
  // Casillas de Proactividad (3 puntos)
  { text: "⚡ Identificó y resolvió un problema sin que se lo pidieran", category: "proactividad" },
  { text: "⚡ Se adelantó a posibles obstáculos y los previno", category: "proactividad" },
  // Casilla de Creatividad (3 puntos)
  { text: "🎨 Pensó fuera de lo común para resolver una situación", category: "creatividad" },
  // Casilla de Buen compañero (0 puntos)
  { text: "💚 Animó a alguien cuando más lo necesitaba", category: "buenCompanero" }
];

interface ReopenLog {
  username: string;
  emoji: string;
  timestamp: number;
  adminTimestamp: number;
  reason?: string;
}

const Resultados = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resultados] = useState(resultadosIniciales);
  const [results, setResults] = useState<PersonResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<VotingStats>({
    totalUsers: 0,
    completedUsers: 0,
    pendingUsers: 0
  });
  const [reopenReason, setReopenReason] = useState('');
  const [userToReopen, setUserToReopen] = useState<{username: string; emoji: string} | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      toast({
        title: "Acceso concedido",
        description: "Has iniciado sesión como administrador.",
      });
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  // Calcular estadísticas
  const totalAsignaciones = resultados.reduce((sum, r) => sum + r.reconocimientos.length, 0);
  const participantesActivos = resultados.length;
  const promedioPuntos = resultados.reduce((sum, r) => sum + r.puntos, 0) / participantesActivos;

  // Obtener usuarios completados del localStorage
  const getCompletedUsers = (): CompletedUserData[] => {
    try {
      const saved = localStorage.getItem('completedUsers');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading completed users:', error);
      return [];
    }
  };

  const completedUsers = getCompletedUsers();

  // Función para formatear fechas
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Obtener la categoría basada en el texto
  const getCategoryFromText = (text: string): string => {
    if (text.includes("🌐")) return "Otro equipo";
    if (text.includes("💡")) return "Innovación";
    if (text.includes("👥")) return "Trabajo en equipo";
    if (text.includes("⚡")) return "Proactividad";
    if (text.includes("🎨")) return "Creatividad";
    if (text.includes("💚")) return "Buen compañero";
    return "General";
  };

  // Calcular el ranking global - AHORA BASADO EN LAS CARITAS QUE RECIBEN VOTOS
  const calculateGlobalRanking = () => {
    // Esta función ahora es obsoleta, reemplazada por getBingoRanking de Supabase
    // Mantenemos una versión simplificada para compatibilidad
    return [];
  };

  const [globalRanking, setGlobalRanking] = useState<{
    emoji: string;
    totalPoints: number;
    recognitionCount: number;
    categoryPoints: {[category: string]: number};
  }[]>([]);

  // Cargar ranking global desde Supabase
  useEffect(() => {
    const loadGlobalRanking = async () => {
      try {
        console.log('Cargando ranking global...');
        
        // Primero asegurar que los participantes estén sincronizados
        await createParticipantsFromLocalEmojis(LOCAL_EMOJI_CONFIG);
        console.log('Participantes sincronizados');
        
        // Usar la función específica para bingo (no dm)
        const rankingData = await getBingoRankingWithSource(LOCAL_EMOJI_CONFIG, 'bingo');
        console.log('Datos del ranking:', rankingData);
        
        setGlobalRanking(rankingData.map(person => ({
          emoji: person.emoji,
          totalPoints: person.totalPoints,
          recognitionCount: person.recognitionCount,
          categoryPoints: person.categoryPoints
        })));
        
        console.log('Ranking global cargado exitosamente');
      } catch (error) {
        console.error('Error loading global ranking:', error);
        toast({
          variant: "destructive",
          title: "Error al cargar resultados",
          description: "No se pudieron cargar los resultados desde la base de datos.",
        });
      }
    };
    
    loadGlobalRanking();
  }, []);

  // Función para obtener el color de la medalla
  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0: return 'text-yellow-500'; // Oro
      case 1: return 'text-gray-400';   // Plata
      case 2: return 'text-amber-600';  // Bronce
      default: return 'text-gray-300';
    }
  };

  const handleExport = async () => {
    try {
      // Usar la configuración local de emojis para tener los nombres
      const emojiMap = new Map(LOCAL_EMOJI_CONFIG.map(e => [e.emoji, e.name]));

      // Obtener datos del ranking desde Supabase específico para bingo
      const rankingData = await getBingoRankingWithSource(LOCAL_EMOJI_CONFIG, 'bingo');

      // Preparar los datos para la exportación
      const exportData = rankingData.map(person => ({
        'Emoji': person.emoji,
        'Nombre': person.name,
        'Total de Puntos': person.totalPoints,
        'Total de Reconocimientos': person.recognitionCount,
        'Puntos por Categoría': Object.entries(person.categoryPoints)
          .map(([category, points]) => `${category}: ${points}`)
          .join(', ') || 'Sin reconocimientos'
      }));

      // Crear una hoja de cálculo
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Ajustar el ancho de las columnas
      const colWidths = {};
      if (exportData.length > 0) {
        Object.keys(exportData[0]).forEach((key, index) => {
          colWidths[index] = { wch: Math.max(key.length, 30) };
        });
      }
      ws['!cols'] = Object.values(colWidths);

      // Crear un libro de Excel
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ranking Bingo');

      // Generar el nombre del archivo con la fecha actual
      const now = new Date();
      const fileName = `bingo-impacto-ranking-${now.toISOString().split('T')[0]}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Exportación exitosa",
        description: `Archivo ${fileName} descargado correctamente.`,
      });
    } catch (error) {
      console.error('Error al exportar los resultados:', error);
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: "No se pudieron exportar los resultados.",
      });
    }
  };

  // Función para obtener el log de reaperturas
  const getReopenLog = (): ReopenLog[] => {
    try {
      const log = localStorage.getItem(REOPEN_LOG_KEY);
      return log ? JSON.parse(log) : [];
    } catch (error) {
      console.error('Error reading reopen log:', error);
      return [];
    }
  };

  // Función para agregar una entrada al log de reaperturas
  const addToReopenLog = (entry: ReopenLog) => {
    try {
      const currentLog = getReopenLog();
      currentLog.push(entry);
      localStorage.setItem(REOPEN_LOG_KEY, JSON.stringify(currentLog));
    } catch (error) {
      console.error('Error updating reopen log:', error);
    }
  };

  const handleReopenVoting = (username: string, emoji: string) => {
    setUserToReopen({ username, emoji });
  };

  const confirmReopen = async () => {
    if (!userToReopen) return;

    try {
      // Obtener la lista actual de usuarios completados
      const completedUsersStr = localStorage.getItem('completedUsers');
      if (!completedUsersStr) return;

      const completedUsers: CompletedUserData[] = JSON.parse(completedUsersStr);
      
      // Encontrar el usuario específico
      const userToRemove = completedUsers.find(
        u => u.emoji === userToReopen.emoji && u.username === userToReopen.username
      );
      
      if (!userToRemove) {
        toast({
          variant: "destructive",
          title: "Error al reabrir votación",
          description: "No se encontró la votación del usuario especificado.",
        });
        return;
      }

      // Guardar las asignaciones actuales como progreso temporal
      const storageKey = `bingoProgress_${userToReopen.username}`;
      localStorage.setItem(storageKey, JSON.stringify(userToRemove.assignments));
      
      // Eliminar al usuario de la lista de completados
      const updatedCompletedUsers = completedUsers.filter(
        u => !(u.emoji === userToReopen.emoji && u.username === userToReopen.username)
      );
      localStorage.setItem('completedUsers', JSON.stringify(updatedCompletedUsers));
      
      // Registrar la reapertura en el log
      addToReopenLog({
        username: userToReopen.username,
        emoji: userToReopen.emoji,
        timestamp: userToRemove.timestamp,
        adminTimestamp: Date.now(),
        reason: reopenReason.trim() || undefined
      });

      // Actualizar estadísticas
      setStats(prev => ({
        ...prev,
        completedUsers: prev.completedUsers - 1,
        pendingUsers: prev.pendingUsers + 1
      }));

      toast({
        title: "Votación reabierta",
        description: `La votación de ${userToReopen.username} ha sido reabierta exitosamente.`,
      });

      // Limpiar el estado
      setUserToReopen(null);
      setReopenReason('');
    } catch (error) {
      console.error('Error reopening voting:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al reabrir la votación.",
      });
    }
  };

  useEffect(() => {
    const calculateResults = async () => {
      try {
        setIsLoading(true);
        
        // Primero asegurar que los participantes estén sincronizados
        await createParticipantsFromLocalEmojis(LOCAL_EMOJI_CONFIG);
        
        // Obtener ranking desde Supabase
        const rankingData = await getBingoRanking(LOCAL_EMOJI_CONFIG);
        
        // Convertir al formato PersonResult para compatibilidad
        const resultsData = rankingData.map(person => ({
          emoji: person.emoji,
          name: person.name,
          imageUrl: person.imageUrl,
          totalSelections: person.totalRecognitions
        }));
        
        setResults(resultsData);
        
        // Actualizar estadísticas
        setStats({
          totalUsers: LOCAL_EMOJI_CONFIG.length,
          completedUsers: rankingData.filter(p => p.totalRecognitions > 0).length,
          pendingUsers: LOCAL_EMOJI_CONFIG.length - rankingData.filter(p => p.totalRecognitions > 0).length
        });
        
      } catch (error) {
        console.error('Error calculating results:', error);
        setResults([]);
        toast({
          variant: "destructive",
          title: "Error al cargar resultados",
          description: "No se pudieron cargar los resultados desde la base de datos.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Calcular resultados iniciales
    calculateResults();

    // Configurar un listener para cambios (opcional, ya que ahora usamos Supabase)
    const interval = setInterval(calculateResults, 30000); // Actualizar cada 30 segundos

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <Card className="w-[350px]">
          <CardHeader>
            <div className="w-full flex justify-center mb-4">
              <Lock className="h-12 w-12 text-amber-600" />
            </div>
            <CardTitle className="text-center">Panel de Administrador</CardTitle>
            <CardDescription className="text-center">
              Ingresa la contraseña para ver los resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <Button type="submit" className="w-full">
                Ingresar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-amber-100"
      style={{
        backgroundImage: 'url("/fondos/A_flat-style_digital_illustration_features_a_profi.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Capa semi-transparente para mejorar contraste */}
      <div className="absolute inset-0 bg-amber-900/30 backdrop-blur-sm"></div>

      {/* Contenido principal */}
      <div className="relative z-10 container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-100 drop-shadow-lg mb-2">
            Resultados del Bingo de Impacto
          </h1>
          <p className="text-amber-200">
            Visualización de reconocimientos y estadísticas
          </p>
        </div>

        {/* Botón de Exportación */}
        <div className="max-w-4xl mx-auto mb-4">
          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              <Download size={20} />
              Exportar Resultados a Excel
            </Button>
          </div>
        </div>

        {/* Ranking Global */}
        <Card className="bg-amber-900/40 backdrop-blur-sm border border-amber-200/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="text-yellow-500" />
              <CardTitle className="text-amber-100">Ranking Global de Reconocimientos</CardTitle>
            </div>
            <CardDescription className="text-amber-200">
              Clasificación basada en puntos obtenidos por tipo de reconocimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {globalRanking.map((person, index) => (
                <div key={person.emoji} className="p-4 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-2xl overflow-hidden">
                        {LOCAL_EMOJI_CONFIG.find(emoji => emoji.emoji === person.emoji)?.image_url ? (
                          <img 
                            src={LOCAL_EMOJI_CONFIG.find(emoji => emoji.emoji === person.emoji)?.image_url}
                            alt={LOCAL_EMOJI_CONFIG.find(emoji => emoji.emoji === person.emoji)?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          person.emoji
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900">
                        #{index + 1} {LOCAL_EMOJI_CONFIG.find(emoji => emoji.emoji === person.emoji)?.name || person.emoji}
                      </h3>
                      <div className="text-sm text-yellow-500">
                        {person.totalPoints} puntos • {person.recognitionCount} reconocimientos
                      </div>
                    </div>
                  </div>
                  
                  {/* Cuadros de categorías */}
                  {Object.keys(person.categoryPoints).length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(person.categoryPoints).map(([category, points]) => {
                        if (points > 0) {
                          return (
                            <div key={category} className="bg-amber-50 p-2 rounded">
                              <div className="font-medium text-amber-900">{category}</div>
                              <div className="text-amber-600">{points} puntos</div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Registro de Votaciones con opción de reapertura */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="text-amber-600" size={24} />
                <CardTitle>Registro de Votaciones</CardTitle>
              </div>
              <CardDescription>
                Administración de votaciones completadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedUsers.map((user, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-amber-200 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center overflow-hidden shadow-md">
                          {LOCAL_EMOJI_CONFIG.find(e => e.emoji === user.emoji)?.image_url ? (
                            <img 
                              src={LOCAL_EMOJI_CONFIG.find(e => e.emoji === user.emoji)?.image_url}
                              alt={user.emoji}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xl">{user.emoji}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{user.username}</h4>
                          <p className="text-sm text-gray-500">
                            {LOCAL_EMOJI_CONFIG.find(e => e.emoji === user.emoji)?.name || user.emoji}
                          </p>
                          <p className="text-sm text-gray-500">
                            Completado el {new Date(user.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => handleReopenVoting(user.username, user.emoji)}
                          >
                            <Unlock size={16} />
                            Reabrir votación
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reabrir votación</AlertDialogTitle>
                            <AlertDialogDescription>
                              <div className="space-y-4">
                                <p>
                                  Estás a punto de reabrir la votación de {user.username}.
                                  Esta acción permitirá que el usuario pueda modificar sus selecciones.
                                </p>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Motivo de la reapertura (opcional):
                                  </label>
                                  <Input
                                    value={reopenReason}
                                    onChange={(e) => setReopenReason(e.target.value)}
                                    placeholder="Ingresa el motivo de la reapertura"
                                  />
                                </div>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {
                              setUserToReopen(null);
                              setReopenReason('');
                            }}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={confirmReopen}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              Sí, reabrir votación
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {completedUsers.length === 0 && (
                  <div className="text-center p-8 text-gray-500">
                    No hay votaciones completadas aún
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Log de Reaperturas */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="text-amber-600" size={24} />
                <CardTitle>Historial de Reaperturas</CardTitle>
              </div>
              <CardDescription>
                Registro de votaciones que han sido reabiertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getReopenLog().sort((a, b) => b.adminTimestamp - a.adminTimestamp).map((log, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-amber-200 bg-amber-50"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center overflow-hidden shadow-md">
                          {LOCAL_EMOJI_CONFIG.find(e => e.emoji === log.emoji)?.image_url ? (
                            <img 
                              src={LOCAL_EMOJI_CONFIG.find(e => e.emoji === log.emoji)?.image_url}
                              alt={log.emoji}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">{log.emoji}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{log.username}</h4>
                          <p className="text-sm text-gray-600">
                            {LOCAL_EMOJI_CONFIG.find(e => e.emoji === log.emoji)?.name || log.emoji}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Votación original: {new Date(log.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Reabierto el: {new Date(log.adminTimestamp).toLocaleString()}
                      </p>
                      {log.reason && (
                        <p className="text-sm text-gray-600">
                          Motivo: {log.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {getReopenLog().length === 0 && (
                  <div className="text-center p-8 text-gray-500">
                    No hay registros de reaperturas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas de Participación */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="text-amber-600" size={24} />
                <CardTitle>Estado de Participación</CardTitle>
              </div>
              <CardDescription>
                Progreso general de las votaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Progreso de completitud
                  </span>
                  <span className="text-sm font-medium">
                    {Math.round((stats.completedUsers / stats.totalUsers) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-amber-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.completedUsers / stats.totalUsers) * 100}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="text-sm text-amber-600 mb-1">Total Usuarios</div>
                    <div className="text-2xl font-bold text-amber-700">{stats.totalUsers}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 mb-1">Completados</div>
                    <div className="text-2xl font-bold text-green-700">{stats.completedUsers}</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-600 mb-1">Pendientes</div>
                    <div className="text-2xl font-bold text-orange-700">{stats.pendingUsers}</div>
                  </div>
                </div>
                {stats.pendingUsers > 0 && (
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200 mt-4">
                    <AlertCircle size={20} />
                    <span>
                      {stats.pendingUsers} usuario{stats.pendingUsers !== 1 ? 's' : ''} aún no {stats.pendingUsers !== 1 ? 'han' : 'ha'} completado su votación
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen de Reconocimientos */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="text-amber-600" size={24} />
              <CardTitle>Resumen de Reconocimientos</CardTitle>
            </div>
            <CardDescription>
              Cantidad de veces que cada persona ha sido reconocida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {isLoading ? (
                <div className="text-center p-8 text-gray-500">
                  Cargando resultados...
                </div>
              ) : results.length > 0 ? (
                results.map((person, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-amber-200 bg-white hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-50 flex items-center justify-center">
                          {person.imageUrl ? (
                            <img 
                              src={person.imageUrl} 
                              alt={person.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">{person.emoji}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">
                            {person.name}
                          </h4>
                          <p className="text-amber-600">
                            {person.totalSelections} reconocimiento{person.totalSelections !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-amber-600 font-medium text-lg">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-gray-500">
                  No hay resultados disponibles aún
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Resultados; 