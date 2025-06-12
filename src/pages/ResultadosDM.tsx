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
import { toast } from "@/components/ui/use-toast";
import { getBingoRanking, reopenUserVoting, createParticipantsFromLocalEmojis, getBingoRankingWithSource, reopenUserVotingWithSource, getDMBingoRanking, reopenUserDMVoting, getDMBingoRankingWithCategories, applyDMMigration } from '@/lib/api';

// Configuración local de emojis para DM (actualizada según la configuración actual)
const LOCAL_EMOJI_CONFIG = [
  { emoji: "🦊", name: "Diego Eduardo De La Fuente Garza", image_url: "/DM/Diego Eduardo De La Fuente Garza.png" },
  { emoji: "🐨", name: "Gerardo Daniel Alcantara Garcia", image_url: "/DM/Gerardo Daniel Alcantara Garcia.jpeg" },
  { emoji: "🐼", name: "Gustavo Vazquez Gutierrez", image_url: "/DM/Gustavo Vazquez Gutierrez.jpg" },
  { emoji: "🐸", name: "Hernan Cano Leon", image_url: "/DM/Hernan Cano Leon.jpeg" },
  { emoji: "🦋", name: "Ivan Augusto Gonzalez Avilez", image_url: "/DM/Ivan Augusto Gonzalez Avilez .jpeg" },
  { emoji: "🐝", name: "Ivan Hernandez Olmos", image_url: "/DM/Ivan Hernandez Olmos.jpeg" },
  { emoji: "🌺", name: "Jesus Gabriel Chavez Cavazos", image_url: "/DM/Jesus Gabriel Chavez Cavazos.jpeg" },
  { emoji: "🌻", name: "Jorge Alberto Orenday Del Valle", image_url: "/DM/Jorge Alberto Orenday Del Valle.jpeg" },
  { emoji: "⭐", name: "Leon David Gil (frente)", image_url: "/DM/Leon David Gil (frente).jpeg" },
  { emoji: "🍀", name: "Alvaro Munoz", image_url: "/DM/Alvaro Munoz.png" }
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
const REOPEN_LOG_KEY = 'bingoReopenLogDM';

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
  categoryPoints?: {
    colaboracion: number;
    solucionProblemas: number;
    implementacionTecnologia: number;
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

const ResultadosDM = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [globalRanking, setGlobalRanking] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<VotingStats>({
    totalUsers: 0,
    completedUsers: 0,
    pendingUsers: 0
  });
  const [userToReopen, setUserToReopen] = useState<{ username: string; emoji: string } | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const getCompletedUsers = (): CompletedUserData[] => {
    const completedUsers: CompletedUserData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mayaBingo_dm_')) {
        const username = key.replace('mayaBingo_dm_', '');
        const userData = localStorage.getItem(key);
        if (userData) {
          const data = JSON.parse(userData);
          completedUsers.push({ username, ...data });
        }
      }
    }
    return completedUsers;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCategoryFromText = (text: string): string => {
    const category = CELL_CATEGORIES.find(cat => cat.text === text);
    return category ? category.category : 'unknown';
  };

  const calculateGlobalRanking = () => {
    // Esta función ahora obtendrá los datos específicos de DM
    // Por ahora mantenemos la misma lógica, pero más adelante la modificaremos
  };

  useEffect(() => {
    const loadGlobalRanking = async () => {
      try {
        setIsLoading(true);
        
        // Usar la función con categorías para obtener el ranking DM
        const rankingData = await getDMBingoRankingWithCategories();
        
        // Convertir los datos al formato esperado por el frontend
        const formattedRanking = rankingData.map(participant => ({
          emoji: participant.emoji,
          name: participant.name,
          imageUrl: participant.image_url,
          totalPoints: participant.total_points,
          totalRecognitions: participant.total_recognitions,
          recognitionCount: participant.total_recognitions,
          categoryPoints: participant.categoryPoints
        }));
        
        setGlobalRanking(formattedRanking);
        
        setStats({
          totalUsers: LOCAL_EMOJI_CONFIG.length,
          completedUsers: formattedRanking.filter(p => p.totalRecognitions > 0).length,
          pendingUsers: LOCAL_EMOJI_CONFIG.length - formattedRanking.filter(p => p.totalRecognitions > 0).length
        });
        
      } catch (error) {
        console.error('Error calculating results:', error);
        toast({
          variant: "destructive",
          title: "Error al cargar resultados DM",
          description: "No se pudieron cargar los resultados desde la base de datos.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGlobalRanking();
    const interval = setInterval(loadGlobalRanking, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0: return "text-yellow-500"; // Oro
      case 1: return "text-gray-400"; // Plata
      case 2: return "text-amber-600"; // Bronce
      default: return "text-gray-600";
    }
  };

  const handleExport = async () => {
    try {
      const excelData = globalRanking.map((person, index) => ({
        'Posición': index + 1,
        'Nombre': LOCAL_EMOJI_CONFIG.find(emoji => emoji.emoji === person.emoji)?.name || person.emoji,
        'Emoji': person.emoji,
        'Puntos Totales': person.totalPoints,
        'Total Reconocimientos': person.recognitionCount,
        'Colaboración': person.categoryPoints?.colaboracion || 0,
        'Solución de problemas': person.categoryPoints?.solucionProblemas || 0,
        'Implementación de tecnologías': person.categoryPoints?.implementacionTecnologia || 0
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "Resultados DM");

      const statsData = [
        { Métrica: 'Total de Participantes', Valor: LOCAL_EMOJI_CONFIG.length },
        { Métrica: 'Usuarios que Completaron', Valor: stats.completedUsers },
        { Métrica: 'Usuarios Pendientes', Valor: stats.pendingUsers },
        { Métrica: 'Fecha de Exportación', Valor: new Date().toLocaleString('es-ES') }
      ];
      const wsStats = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, "Estadísticas DM");

      XLSX.writeFile(wb, `resultados_bingo_impacto_dm_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Exportación exitosa",
        description: "Los resultados DM se han exportado correctamente a Excel.",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        variant: "destructive",
        title: "Error en la exportación",
        description: "No se pudo exportar los datos a Excel.",
      });
    }
  };

  const getReopenLog = (): ReopenLog[] => {
    const log = localStorage.getItem(REOPEN_LOG_KEY);
    return log ? JSON.parse(log) : [];
  };

  const addToReopenLog = (entry: ReopenLog) => {
    const currentLog = getReopenLog();
    currentLog.push(entry);
    localStorage.setItem(REOPEN_LOG_KEY, JSON.stringify(currentLog));
  };

  const handleReopenVoting = (username: string, emoji: string) => {
    setUserToReopen({ username, emoji });
  };

  const confirmReopen = async () => {
    if (!userToReopen) return;

    try {
      // Reabrir votación en Supabase (específico para DM)
      await reopenUserDMVoting(userToReopen.username);

      // Obtener datos del usuario para el log
      const userKey = `mayaBingo_dm_${userToReopen.username}`;
      const userData = localStorage.getItem(userKey);
      let originalTimestamp = Date.now();
      
      if (userData) {
        const data = JSON.parse(userData);
        originalTimestamp = data.timestamp || Date.now();
        // Eliminar datos locales
        localStorage.removeItem(userKey);
      }

      // Agregar al log de reaperturas
      addToReopenLog({
        username: userToReopen.username,
        emoji: userToReopen.emoji,
        timestamp: originalTimestamp,
        adminTimestamp: Date.now(),
        reason: reopenReason || undefined
      });

      // Limpiar estados
      setUserToReopen(null);
      setReopenReason('');

      // Recargar datos
      window.location.reload();

      toast({
        title: "Votación reabierta",
        description: `Se ha reabierto la votación de ${userToReopen.username} exitosamente.`,
      });
    } catch (error) {
      console.error('Error reopening voting:', error);
      toast({
        variant: "destructive",
        title: "Error al reabrir votación",
        description: "No se pudo reabrir la votación. Inténtalo de nuevo.",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <Card className="w-[350px]">
          <CardHeader>
            <div className="w-full flex justify-center mb-4">
              <Lock className="h-12 w-12 text-amber-600" />
            </div>
            <CardTitle className="text-center">Panel de Administrador DM</CardTitle>
            <CardDescription className="text-center">
              Ingresa la contraseña para ver los resultados DM
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
        backgroundImage: 'url("/fondos/Fondo inicial.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-amber-900/30 backdrop-blur-sm"></div>

      <div className="relative z-10 container mx-auto py-8 px-4 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-100 drop-shadow-lg mb-2">
            Resultados del Bingo de Impacto DM
          </h1>
          <p className="text-amber-200">
            Visualización de reconocimientos y estadísticas (DM)
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-4">
          <div className="flex justify-end gap-4">
            <Button
              onClick={async () => {
                try {
                  await applyDMMigration();
                  toast({
                    title: "Migración aplicada",
                    description: "Se ha actualizado la función de guardado de votos DM. Recarga la página.",
                  });
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Error al aplicar migración", 
                    description: "No se pudo aplicar la migración. Revisa la consola.",
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              🔧 Aplicar Migración DM
            </Button>
            <Button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              <Download size={20} />
              Exportar Resultados DM a Excel
            </Button>
          </div>
        </div>

        <Card className="bg-amber-900/40 backdrop-blur-sm border border-amber-200/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="text-yellow-500" />
              <CardTitle className="text-amber-100">Ranking Global de Reconocimientos DM</CardTitle>
            </div>
            <CardDescription className="text-amber-200">
              Clasificación basada en puntos obtenidos por tipo de reconocimiento (DM)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {globalRanking.map((person, index) => (
                <div key={person.emoji} className="p-4 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center text-2xl overflow-hidden">
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
                      <h3 className="font-semibold text-white">
                        #{index + 1} {LOCAL_EMOJI_CONFIG.find(emoji => emoji.emoji === person.emoji)?.name || person.emoji}
                      </h3>
                      <div className="text-sm text-yellow-500">
                        {person.totalPoints} puntos • {person.recognitionCount} reconocimientos
                      </div>
                    </div>
                  </div>
                  
                  {person.categoryPoints && Object.values(person.categoryPoints).some(p => typeof p === 'number' && p > 0) && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {person.categoryPoints.colaboracion > 0 && (
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-medium text-blue-900">Colaboración</div>
                          <div className="text-blue-600">{person.categoryPoints.colaboracion} puntos</div>
                        </div>
                      )}
                      {person.categoryPoints.solucionProblemas > 0 && (
                        <div className="bg-green-50 p-2 rounded">
                          <div className="font-medium text-green-900">Solución de problemas</div>
                          <div className="text-green-600">{person.categoryPoints.solucionProblemas} puntos</div>
                        </div>
                      )}
                      {person.categoryPoints.implementacionTecnologia > 0 && (
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="font-medium text-purple-900">Implementación de tecnologías</div>
                          <div className="text-purple-600">{person.categoryPoints.implementacionTecnologia} puntos</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nueva sección: Puntuaciones por Categoría */}
        <Card className="bg-amber-900/40 backdrop-blur-sm border border-amber-200/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="text-yellow-500" />
              <CardTitle className="text-amber-100">Puntuaciones por Categoría</CardTitle>
            </div>
            <CardDescription className="text-amber-200">
              Desglose detallado de puntuaciones por cada categoría de competencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-amber-200/30">
                    <TableHead className="text-amber-100 font-semibold">Delivery Manager</TableHead>
                    <TableHead className="text-amber-100 font-semibold text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={16} />
                        Colaboración
                      </div>
                    </TableHead>
                    <TableHead className="text-amber-100 font-semibold text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Lightbulb size={16} />
                        Solución de problemas
                      </div>
                    </TableHead>
                    <TableHead className="text-amber-100 font-semibold text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Zap size={16} />
                        Implementación de tecnologías
                      </div>
                    </TableHead>
                    <TableHead className="text-amber-100 font-semibold text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy size={16} />
                        Total
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalRanking
                    .filter(person => typeof person.totalPoints === 'number' && person.totalPoints > 0)
                    .sort((a, b) => (Number(b.totalPoints) || 0) - (Number(a.totalPoints) || 0))
                    .map((person, index) => (
                    <TableRow key={person.emoji} className="border-b border-amber-200/20 hover:bg-amber-800/20">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center text-sm overflow-hidden">
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
                          <div>
                            <div className="font-medium text-amber-100">
                              {LOCAL_EMOJI_CONFIG.find(emoji => emoji.emoji === person.emoji)?.name || person.emoji}
                            </div>
                            <div className="text-xs text-amber-300">#{index + 1} en ranking</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="text-lg font-bold text-blue-300">
                            {person.categoryPoints?.colaboracion || 0}
                          </div>
                          <div className="text-xs text-blue-400">puntos</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="text-lg font-bold text-green-300">
                            {person.categoryPoints?.solucionProblemas || 0}
                          </div>
                          <div className="text-xs text-green-400">puntos</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="text-lg font-bold text-purple-300">
                            {person.categoryPoints?.implementacionTecnologia || 0}
                          </div>
                          <div className="text-xs text-purple-400">puntos</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="text-lg font-bold text-yellow-300">
                            {person.totalPoints}
                          </div>
                          <div className="text-xs text-yellow-400">puntos</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Leyenda de categorías */}
            <div className="mt-6 p-4 bg-amber-800/30 rounded-lg">
              <h4 className="text-amber-100 font-semibold mb-3">Categorías y sus frases:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-900/30 p-3 rounded">
                  <h5 className="font-medium text-blue-200 mb-2 flex items-center gap-1">
                    <Users size={14} />
                    Colaboración
                  </h5>
                  <ul className="text-blue-300 space-y-1 text-xs">
                    <li>• Comparte información y recursos (4 pts)</li>
                    <li>• Participa en reuniones con aportes (2 pts)</li>
                    <li>• Coopera con diferentes equipos (1 pt)</li>
                    <li>• Siempre dispuesto a escuchar (0 pts)</li>
                  </ul>
                </div>
                <div className="bg-green-900/30 p-3 rounded">
                  <h5 className="font-medium text-green-200 mb-2 flex items-center gap-1">
                    <Lightbulb size={14} />
                    Solución de problemas
                  </h5>
                  <ul className="text-green-300 space-y-1 text-xs">
                    <li>• Identifica causas raíz y propone soluciones (5 pts)</li>
                    <li>• Reacciona con agilidad ante imprevistos (3 pts)</li>
                    <li>• Solicita asistencia externa (2 pts)</li>
                  </ul>
                </div>
                <div className="bg-purple-900/30 p-3 rounded">
                  <h5 className="font-medium text-purple-200 mb-2 flex items-center gap-1">
                    <Zap size={14} />
                    Implementación de tecnologías
                  </h5>
                  <ul className="text-purple-300 space-y-1 text-xs">
                    <li>• Incorpora herramientas emergentes (3 pts)</li>
                    <li>• Implementa soluciones tecnológicas (1 pt)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón temporal para aplicar migración */}
        <Card className="bg-red-900/40 backdrop-blur-sm border border-red-200/30 mb-6">
          <CardHeader>
            <CardTitle className="text-red-100">🔧 Aplicar Migración DM</CardTitle>
            <CardDescription className="text-red-200">
              Si ves 0 puntos para todos, haz clic para aplicar la migración que corrige el sistema de reconocimientos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={async () => {
                try {
                  await applyDMMigration();
                  toast({
                    title: "Migración aplicada",
                    description: "Se ha actualizado la función de guardado de votos DM. Recarga la página.",
                  });
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Error al aplicar migración",
                    description: "No se pudo aplicar la migración. Revisa la consola.",
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Aplicar Migración DM
            </Button>
          </CardContent>
        </Card>

        {/* Estadísticas Generales */}
      </div>
    </div>
  );
};

export default ResultadosDM; 