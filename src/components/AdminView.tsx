import React from 'react';
import { Trophy, Star, Users, BarChart3, Clock, Medal, Award, AlertCircle, Download, Unlock, Crown } from 'lucide-react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface CompletedUserData {
  username: string;
  emoji: string;
  timestamp: number;
  assignments: {[key: number]: number[]};
}

interface AdminViewProps {
  cellAssignments: {[key: number]: number[]};
  avatarEmojis: string[];
  bingoTexts: string[];
  completedUsers: CompletedUserData[];
  totalUsers: number;
  onReopenVoting: (userEmoji: string, username: string) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  cellAssignments, 
  avatarEmojis, 
  bingoTexts,
  completedUsers,
  totalUsers,
  onReopenVoting
}) => {
  // Sistema de puntuación
  const pointsSystem: {[key: string]: number} = {
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

  // Calcular estadísticas anónimas por casilla
  const calculateCellStatistics = () => {
    const stats = bingoTexts.map((text, index) => {
      const avatarsInCell = cellAssignments[index] || [];
      return {
        text,
        count: avatarsInCell.length,
        points: pointsSystem[text] || 0,
        category: getCategoryFromText(text)
      };
    });

    return stats;
  };

  // Obtener la categoría basada en el texto y puntos
  const getCategoryFromText = (text: string): string => {
    if (text.includes("🌐")) return "Otro equipo";
    if (text.includes("💡")) return "Innovación";
    if (text.includes("👥")) return "Trabajo en equipo";
    if (text.includes("⚡")) return "Proactividad";
    if (text.includes("🎨")) return "Creatividad";
    if (text.includes("💚")) return "Buen compañero";
    return "General";
  };

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

  // Nueva función para calcular estadísticas por persona
  const calculatePersonStats = () => {
    // Inicializar contadores para cada emoji
    const emojiStats: { [key: number]: {
      count: number;
      categoryAppearances: { [key: string]: number };
      cellAppearances: { [key: number]: number };
    }} = {};

    // Procesar todas las asignaciones
    Object.entries(cellAssignments).forEach(([cellIndex, avatars]) => {
      const cellCategory = getCategoryFromText(bingoTexts[parseInt(cellIndex)]);
      const cellPoints = pointsSystem[bingoTexts[parseInt(cellIndex)]] || 0;
      
      avatars.forEach(avatarIndex => {
        if (!emojiStats[avatarIndex]) {
          emojiStats[avatarIndex] = {
            count: 0,
            categoryAppearances: {},
            cellAppearances: {}
          };
        }
        
        // Incrementar conteo total
        emojiStats[avatarIndex].count++;
        
        // Incrementar conteo por categoría
        emojiStats[avatarIndex].categoryAppearances[cellCategory] = 
          (emojiStats[avatarIndex].categoryAppearances[cellCategory] || 0) + 1;
        
        // Registrar aparición en celda específica
        emojiStats[avatarIndex].cellAppearances[cellIndex] = 
          (emojiStats[avatarIndex].cellAppearances[cellIndex] || 0) + 1;
      });
    });

    // Convertir a array y ordenar por cantidad de reconocimientos
    return Object.entries(emojiStats)
      .map(([emojiIndex, stats]) => ({
        emoji: avatarEmojis[parseInt(emojiIndex)],
        emojiIndex: parseInt(emojiIndex),
        ...stats
      }))
      .sort((a, b) => b.count - a.count);
  };

  const personStats = calculatePersonStats();
  const cellStats = calculateCellStatistics();
  const totalAssignments = Object.values(cellAssignments).flat().length;

  const handleExport = () => {
    // Preparar los datos para la exportación
    const exportData = completedUsers.map(user => {
      // Crear un objeto base con la información del usuario
      const baseRow = {
        'Usuario': user.emoji,
        'Fecha y Hora': new Date(user.timestamp).toLocaleString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      };

      // Agregar una columna por cada casilla del bingo
      bingoTexts.forEach((text, index) => {
        const assignedEmojis = user.assignments[index] || [];
        baseRow[`Casilla ${index + 1}: ${text}`] = assignedEmojis
          .map(emojiIndex => avatarEmojis[emojiIndex])
          .join(', ');
      });

      return baseRow;
    });

    // Crear una hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar el ancho de las columnas
    const colWidths = {};
    if (exportData.length > 0) {
      Object.keys(exportData[0]).forEach((key, index) => {
        colWidths[index] = { wch: Math.max(key.length, 20) };
      });
    }
    ws['!cols'] = Object.values(colWidths);

    // Crear un libro de Excel
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados Bingo');

    // Generar el archivo
    const fileName = `bingo-impacto-resultados-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Nueva función para calcular el ranking global
  const calculateGlobalRanking = () => {
    // Inicializar contadores para cada emoji
    const emojiStats: { [key: number]: {
      emoji: string;
      totalPoints: number;
      recognitionCount: number;
      categoryPoints: { [key: string]: number };
    }} = {};

    // Procesar todas las asignaciones de todos los usuarios completados
    completedUsers.forEach(user => {
      Object.entries(user.assignments).forEach(([cellIndex, avatars]) => {
        const cellText = bingoTexts[parseInt(cellIndex)];
        const cellPoints = pointsSystem[cellText] || 0;
        const category = getCategoryFromText(cellText);

        avatars.forEach(avatarIndex => {
          if (!emojiStats[avatarIndex]) {
            emojiStats[avatarIndex] = {
              emoji: avatarEmojis[avatarIndex],
              totalPoints: 0,
              recognitionCount: 0,
              categoryPoints: {}
            };
          }
          
          // Incrementar puntos totales
          emojiStats[avatarIndex].totalPoints += cellPoints;
          
          // Incrementar conteo de reconocimientos
          emojiStats[avatarIndex].recognitionCount++;
          
          // Acumular puntos por categoría
          if (!emojiStats[avatarIndex].categoryPoints[category]) {
            emojiStats[avatarIndex].categoryPoints[category] = 0;
          }
          emojiStats[avatarIndex].categoryPoints[category] += cellPoints;
        });
      });
    });

    // Convertir a array y ordenar por puntos totales
    return Object.values(emojiStats)
      .sort((a, b) => b.totalPoints - a.totalPoints || b.recognitionCount - a.recognitionCount);
  };

  const globalRanking = calculateGlobalRanking();

  // Función para obtener el color de la medalla según la posición
  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0: return 'text-yellow-500'; // Oro
      case 1: return 'text-gray-400';   // Plata
      case 2: return 'text-amber-600';  // Bronce
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Botón de Exportación */}
      <div className="flex justify-end">
        <Button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
        >
          <Download size={16} />
          Exportar Resultados
        </Button>
      </div>

      {/* Nueva sección: Resumen por Persona */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="text-purple-600" />
            <CardTitle>Resumen de Reconocimientos por Persona</CardTitle>
          </div>
          <CardDescription>
            Detalle de reconocimientos recibidos por cada integrante del equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {personStats.map((person) => (
              <div
                key={person.emojiIndex}
                className="p-4 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{person.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-lg">
                        {person.count} reconocimiento{person.count !== 1 ? 's' : ''}
                      </h4>
                      <p className="text-sm text-gray-600">
                        En {Object.keys(person.cellAppearances).length} casilla{Object.keys(person.cellAppearances).length !== 1 ? 's' : ''} diferente{Object.keys(person.cellAppearances).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Medal className={`w-6 h-6 ${
                    person.count === Math.max(...personStats.map(p => p.count))
                      ? 'text-amber-500'
                      : 'text-gray-300'
                  }`} />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Reconocimientos por categoría:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(person.categoryAppearances).map(([category, count]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">{category}</span>
                        <span className="font-medium text-purple-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Casillas donde aparece:
                  </p>
                  <div className="mt-2 text-sm">
                    {Object.keys(person.cellAppearances).map((cellIndex) => (
                      <div key={cellIndex} className="text-gray-600 mb-1">
                        • {bingoTexts[parseInt(cellIndex)]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sección de Usuarios Completados - Actualizada con opción de reapertura */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-purple-600" />
          <h2 className="text-xl font-bold text-gray-800">
            Registro de Votaciones Completadas
          </h2>
        </div>
        
        <Table>
          <TableCaption>
            Lista de usuarios que han completado su bingo
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Fecha y Hora de Guardado</TableHead>
              <TableHead className="text-right">Reconocimientos Otorgados</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedUsers
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((user, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{user.emoji}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(user.timestamp)}</TableCell>
                  <TableCell className="text-right">
                    {Object.values(user.assignments).flat().length}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          onClick={() => onReopenVoting(user.emoji, user.username)}
                          variant="outline"
                          size="sm"
                          className="ml-2"
                        >
                          Reabrir votación
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Reabrir votación?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <div className="space-y-2">
                              <p>
                                Estás a punto de reabrir la votación del usuario {user.emoji}.
                                Esto permitirá que el usuario pueda modificar sus selecciones.
                              </p>
                              <p className="font-medium text-amber-600">
                                Esta acción debe usarse solo en casos especiales.
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() => onReopenVoting(user.emoji, user.username)}
                          >
                            Sí, reabrir votación
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Estadísticas por Categoría */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">
            Estadísticas por Categoría
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cellStats.map((stat, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <div className="text-sm text-gray-600 mb-1">{stat.category}</div>
              <div className="text-lg font-semibold mb-2">{stat.text}</div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600">
                  {stat.count} reconocimiento{stat.count !== 1 ? 's' : ''}
                </span>
                <span className="text-purple-600 font-medium">
                  {stat.points} punto{stat.points !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen General - Actualizado con usuarios pendientes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-purple-600" />
            <h3 className="font-semibold text-purple-900">Usuarios Completados</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">{completedUsers.length}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-amber-600" />
            <h3 className="font-semibold text-amber-900">Usuarios Pendientes</h3>
          </div>
          <div className="flex flex-col">
            <p className="text-3xl font-bold text-amber-700">
              {totalUsers - completedUsers.length}
            </p>
            <p className="text-sm text-amber-600">
              de {totalUsers} totales
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Star className="text-blue-600" />
            <h3 className="font-semibold text-blue-900">Reconocimientos</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{totalAssignments}</p>
                  </div>
                  
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-green-600" />
            <h3 className="font-semibold text-green-900">Promedio por Usuario</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {completedUsers.length > 0 
              ? (totalAssignments / completedUsers.length).toFixed(1) 
              : '0'}
          </p>
        </div>
                  </div>
                  
      {/* Progreso de Completitud */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" />
            <CardTitle>Estado de Participación</CardTitle>
          </div>
          <CardDescription>
            Progreso general de participación en el bingo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Progreso de completitud
              </span>
              <span className="text-sm font-medium">
                {Math.round((completedUsers.length / totalUsers) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(completedUsers.length / totalUsers) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{completedUsers.length} completados</span>
              <span>{totalUsers - completedUsers.length} pendientes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nueva sección: Ranking Global */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="text-yellow-500" />
            <CardTitle>Ranking Global de Reconocimientos</CardTitle>
          </div>
          <CardDescription>
            Clasificación basada en puntos obtenidos por tipo de reconocimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {globalRanking.map((person, index) => (
              <div
                key={person.emoji}
                className={`p-4 rounded-lg border ${
                  index < 3 ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                } hover:border-yellow-300 transition-colors`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <span className="text-3xl">{person.emoji}</span>
                      {index < 3 && (
                        <Trophy 
                          className={`absolute -top-2 -right-2 h-4 w-4 ${getMedalColor(index)}`}
                        />
                      )}
                    </div>
                  <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">
                          {person.totalPoints} puntos
                        </h4>
                        <span className="text-sm text-gray-500">
                          ({person.recognitionCount} reconocimientos)
                        </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        Posición #{index + 1}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desglose de puntos por categoría */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {Object.entries(person.categoryPoints)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, points]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-100"
                      >
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm text-yellow-600">{points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminView;
