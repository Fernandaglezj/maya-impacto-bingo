import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Star, Info } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Importaciones de Supabase
import { 
  createParticipantsFromLocalEmojis, 
  saveBingoVotes, 
  checkUserVoted,
  saveBingoVotesWithSource,
  checkUserVotedWithSource,
  loginUser,
  getUserAssignmentsWithSource,
  getUserEmojiIndex,
  type LoginResponse 
} from '@/lib/api';

// Interfaces para el manejo de datos
interface CompletedUserData {
  username: string;
  emoji: string;
  timestamp: number;
  assignments: {[key: number]: number[]};
}

interface EmojiConfig {
  emoji: string;
  name: string;
  image_url: string;
}

interface SimpleFloatingAvatarProps {
  emoji: string;
  index: number;
  imageUrl?: string;
  readOnly: boolean;
  name?: string;
}

const getUserStorageKey = (username: string) => ({
  progress: `bingoProgress_${username}`,
  saved: `bingoSaved_${username}`,
  emoji: `userEmoji_${username}`,
});

// Componente BingoCell simplificado
const SimpleBingoCell = ({ 
  text, 
  index, 
  assignedAvatars, 
  avatarEmojis, 
  onDrop, 
  onRemoveAvatar, 
  isTeamCell, 
  readOnly,
  getImageForEmoji,
  emojiConfig
}: any) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(false);
    
    const avatarIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (!isNaN(avatarIndex)) {
      onDrop(index, avatarIndex);
    }
  };

  return (
    <div 
      className={`
        relative p-4 rounded-xl backdrop-blur-sm border transition-colors duration-200
        ${readOnly ? 'bg-amber-900/40 border-amber-200/30' : 'bg-amber-900/40 border-amber-200/50 hover:border-amber-200'}
        ${isTeamCell ? 'bg-amber-800/40' : ''}
        ${isDragOver ? 'border-green-400 bg-green-900/40' : ''}
      `}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isTeamCell && (
        <div className="mb-3 text-center">
          <div className="bg-amber-600 text-white text-sm font-bold px-3 py-2 rounded-lg shadow-lg">
            🌐 OTROS EQUIPOS - OBLIGATORIO
          </div>
        </div>
      )}
      
      <p className="text-amber-100 mb-4 min-h-[3rem] text-sm">
        {text}
      </p>
      
      <div className="min-h-[90px] flex flex-wrap gap-2 items-center justify-center">
        {assignedAvatars?.map((avatarIndex: number) => (
          <div key={avatarIndex} className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-14 h-14 rounded-full bg-amber-200 flex items-center justify-center text-lg shadow-md">
                    {getImageForEmoji(avatarEmojis[avatarIndex]) ? (
                      <img 
                        src={getImageForEmoji(avatarEmojis[avatarIndex])} 
                        alt={avatarEmojis[avatarIndex]}
                        className="w-14 h-14 rounded-full object-cover border border-amber-300/30"
                        style={{
                          transform: 'scale(1.0)',
                          objectPosition: '50% 50%',
                          transformOrigin: 'center',
                          imageRendering: 'crisp-edges'
                        }}
                      />
                    ) : (
                      <span>{avatarEmojis[avatarIndex]}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900/90 text-gray-100 shadow-xl">
                  <p className="font-medium">{emojiConfig[avatarIndex]?.name || avatarEmojis[avatarIndex]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!readOnly && (
              <button
                onClick={() => onRemoveAvatar(index, avatarIndex)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      
      {!readOnly && (assignedAvatars?.length || 0) < 3 && (
        <div 
          className={`mt-2 text-center text-xs transition-colors ${
            isDragOver ? 'text-green-200' : 'text-amber-200 hover:text-amber-100'
          }`}
        >
          {isDragOver ? 'Suelta aquí la carita' : 'Arrastra una carita aquí'}
        </div>
      )}
    </div>
  );
};

// Componente FloatingAvatar simplificado
const MayaBingo = ({ username, userId, user, source = 'bingo' }: { 
  username: string; 
  userId: string;
  user: { id: string; username: string; display_name: string; has_voted: boolean };
  source?: 'bingo' | 'dm';
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cellAssignments, setCellAssignments] = useState<{[key: number]: number[]}>({});
  const [userEmojiIndex, setUserEmojiIndex] = useState<number | null>(null);
  const [showEmojiDialog, setShowEmojiDialog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const storageKeys = getUserStorageKey(username);

  // Configuración local de emojis con sus respectivas imágenes y estilos fijos
  const LOCAL_EMOJI_CONFIG: EmojiConfig[] = [
    { emoji: "🦊", name: "Dayane", image_url: "/caritas/Dayane.jpeg" },
    { emoji: "🐨", name: "Ileana Medina Moreno", image_url: "/caritas/Ile.jpeg" },
    { emoji: "🐼", name: "Marco Antonio Barraza Mendoza", image_url: "/caritas/Marco Antonio Barraza Mendoza.jpeg" },
    { emoji: "🐸", name: "Jose Fausto Castorena", image_url: "/caritas/Jose Fausto Castorena.jpg" },
    { emoji: "🦋", name: "Maria Geraldine Hernandez Gonzalez", image_url: "/caritas/Gerald.jpeg" },
    { emoji: "🐝", name: "Manuela Zapata Tamayo", image_url: "/caritas/Manuela Zapata Tamayo.png" },
    { emoji: "🌺", name: "Karla Cristina Marin Gil", image_url: "/caritas/Karla Cristina Marin Gil.jpg" },
    { emoji: "🌻", name: "Catherine Zuluaga Alcaraz", image_url: "/caritas/Catherine Zuluaga Alcaraz.jpg" },
    { emoji: "🌙", name: "Nicol", image_url: "/caritas/Nicoleth C.jpeg" },
    { emoji: "⭐", name: "Perla Tamara Sanchez Macias", image_url: "/caritas/Perla Tamara Sanchez Macias.jpg" },
    { emoji: "🍀", name: "Alicia Steffani Estrada Osorno", image_url: "/caritas/Alicia Steffani Estrada Osorno.jpg" },
    { emoji: "🌿", name: "Amado Garcia Martinez", image_url: "/caritas/Amado Garcia Martinez.jpeg" },
    { emoji: "🦜", name: "Rosa Elena Velarde Soto", image_url: "/caritas/Rosita.jpeg" },
    { emoji: "🌊", name: "Samantha Eugenia Acosta Santana", image_url: "/caritas/Sam.jpeg" },
    { emoji: "🔥", name: "Dayra Aylin Gamiño Ponce", image_url: "/caritas/Dayra.jpeg" },
    { emoji: "🌈", name: "Paola Moreno", image_url: "/caritas/paolaa.jpeg" },
    { emoji: "🎨", name: "Alondra Elideth Ibarra Cortes", image_url: "/caritas/Alondra Elideth Ibarra Cortes.jpg" },
    { emoji: "🎭", name: "Angel Abad Cardenas Garcia", image_url: "/caritas/Angel Abad Cardenas Garcia.jpg" },
    { emoji: "🎪", name: "Angelica Lopez Ley", image_url: "/caritas/Angi L.jpeg" },
    { emoji: "🎯", name: "Mercedes", image_url: "/caritas/Meche.jpeg" },
    { emoji: "💎", name: "Joyita", image_url: "/caritas/Joyita.jpeg" },
    { emoji: "🎸", name: "Jonatan", image_url: "/caritas/Jona.jpeg" }
  ];

  // Filtrar emojis basado en el source
  const EMOJI_CONFIG = source === 'dm' ? [
    { emoji: "🦊", name: "Diego Eduardo De La Fuente Garza", image_url: "/DM/Diego Eduardo De La Fuente Garza.png" },
    { emoji: "🐨", name: "Gerardo Daniel Alcantara Garcia", image_url: "/DM/Gerardo Daniel Alcantara Garcia.jpeg" },
    { emoji: "🐼", name: "Gustavo Vazquez Gutierrez", image_url: "/DM/Gustavo Vazquez Gutierrez.jpg" },
    { emoji: "🐸", name: "Hernan Cano Leon", image_url: "/DM/Hernan Cano Leon.jpeg" },
    { emoji: "🦋", name: "Ivan Augusto Gonzalez Avilez", image_url: "/DM/Ivan Augusto Gonzalez Avilez .jpeg" },
    { emoji: "🐝", name: "Ivan Hernandez Olmos", image_url: "/DM/Ivan Hernandez Olmos.jpeg" },
    { emoji: "🌺", name: "Jesus Gabriel Chavez Cavazos", image_url: "/caritas/Gabo C.jpeg" },
    { emoji: "🌻", name: "Jorge Alberto Orenday Del Valle", image_url: "/DM/Jorge Alberto Orenday Del Valle.png" },
    { emoji: "⭐", name: "Leon David Gil (frente)", image_url: "/caritas/Leo D.jpeg" },
    { emoji: "🍀", name: "Alvaro Munoz", image_url: "/DM/Alvaro Munoz.png" },
    { emoji: "🎯", name: "Angel Sanchez", image_url: "/caritas/Angel Sanchez.png" }
  ] : LOCAL_EMOJI_CONFIG;

  // Obtener avatares/emojis disponibles
  const avatarEmojis = EMOJI_CONFIG.map(config => config.emoji);

  // Textos reales del bingo
  const bingoTexts = source === 'dm' ? [
    "Comparte información y recursos de forma proactiva con todos",
    "Identifica las causas raíz de los problemas y propone soluciones efectivas", 
    "Reacciona con agilidad ante imprevistos",
    "Incorpora herramientas emergentes que optimizan el flujo de trabajo",
    "Participa en reuniones de equipo con aportes relevantes",
    "Solicita asistencia externa para resolver obstáculos complejos",
    "Coopera con diferentes equipos cuando es necesario",
    "Implementa soluciones tecnológicas",
    "Siempre está dispuesto a escuchar"
  ] : [
    "Compartió una idea que ayudó a otro equipo a mejorar su trabajo",
    "Colaboró con otro equipo para lograr un resultado conjunto", 
    "Facilitó que otro equipo pudiera avanzar más rápido",
    "💡 Aplicó tecnología o nuevas formas de trabajar en su tarea",
    "👥 Ayudó a enfocar al equipo cuando se estaba desviando",
    "⚡ Identificó y resolvió un problema sin que se lo pidieran",
    "⚡ Se adelantó a posibles obstáculos y los previno",
    "🎨 Pensó fuera de lo común para resolver una situación",
    "💚 Animó a alguien cuando más lo necesitaba"
  ];

  // Función para obtener imagen de emoji
  const getImageForEmoji = (emoji: string): string | undefined => {
    // Si estamos en modo DM, buscar en la configuración
    if (source === 'dm') {
      const emojiData = EMOJI_CONFIG.find(config => config.emoji === emoji);
      if (emojiData && emojiData.image_url) {
        return emojiData.image_url;
      }
      return undefined;
    }
    
    const emojiImageMap: { [key: string]: string } = {
      "🦊": "/caritas/Dayane.jpeg",
      "🐨": "/caritas/Ile.jpeg",
      "🐼": "/caritas/Marco Antonio Barraza Mendoza.jpeg",
      "🐸": "/caritas/Jose Fausto Castorena.jpg",
      "🦋": "/caritas/Gerald.jpeg",
      "🐝": "/caritas/Manuela Zapata Tamayo.png",
      "🌺": "/caritas/Karla Cristina Marin Gil.jpg",
      "🌻": "/caritas/Catherine Zuluaga Alcaraz.jpg",
      "🌙": "/caritas/Nicoleth C.jpeg",
      "⭐": "/caritas/Perla Tamara Sanchez Macias.jpg",
      "🍀": "/caritas/Alicia Steffani Estrada Osorno.jpg",
      "🌿": "/caritas/Amado Garcia Martinez.jpeg",
      "🦜": "/caritas/Rosita.jpeg",
      "🌊": "/caritas/Sam.jpeg",
      "🔥": "/caritas/Dayra.jpeg",
      "🌈": "/caritas/paolaa.jpeg",
      "🎨": "/caritas/Alondra Elideth Ibarra Cortes.jpg",
      "🎭": "/caritas/Angel Abad Cardenas Garcia.jpg",
      "🎪": "/caritas/Angi L.jpeg",
      "🎯": "/caritas/Meche.jpeg",
      "💎": "/caritas/Joyita.jpeg",
      "🎸": "/caritas/Jona.jpeg"
    };
    return emojiImageMap[emoji];
  };

  // Cargar estado guardado desde Supabase
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsLoading(true);
        
        // Sincronizar participantes con Supabase
        await createParticipantsFromLocalEmojis(EMOJI_CONFIG);
        
        // Verificar si el usuario ya votó para este source específico
        const hasVoted = await checkUserVotedWithSource(userId, source);
        setIsSaved(hasVoted);
        
        if (hasVoted) {
          // Si ya votó, cargar sus datos desde la base de datos
          try {
            // Obtener las asignaciones anteriores desde la base de datos
            const previousAssignments = await getUserAssignmentsWithSource(userId, EMOJI_CONFIG, source);
            
            // Convertir las asignaciones para el formato correcto
            const convertedAssignments: {[key: number]: number[]} = {};
            
            if (source === 'dm') {
              // Para DM, convertir emojis a índices
              Object.entries(previousAssignments).forEach(([cellIndex, emojis]) => {
                const cellIndexNum = parseInt(cellIndex);
                convertedAssignments[cellIndexNum] = (emojis as string[]).map(emoji => {
                  const index = EMOJI_CONFIG.findIndex(config => config.emoji === emoji);
                  return index !== -1 ? index : 0;
                });
              });
            } else {
              // Para bingo regular, ya están en formato de índices
              Object.entries(previousAssignments).forEach(([cellIndex, indices]) => {
                convertedAssignments[parseInt(cellIndex)] = indices as number[];
              });
            }
            
            setCellAssignments(convertedAssignments);
            
            // Obtener el emoji del usuario
            const userEmoji = await getUserEmojiIndex(userId, EMOJI_CONFIG);
            setUserEmojiIndex(userEmoji);
            
          } catch (dbError) {
            console.error('Error loading previous assignments from database:', dbError);
            
            // Fallback: intentar cargar desde localStorage
            const savedKey = `mayaBingo_${source}_${username}`;
            const savedData = localStorage.getItem(savedKey);
            if (savedData) {
              const data = JSON.parse(savedData);
              setCellAssignments(data.assignments || {});
              setUserEmojiIndex(data.emojiIndex);
            }
          }
        } else {
          // Si no ha votado, mostrar diálogo de selección de emoji
          setShowEmojiDialog(true);
        }
      } catch (error) {
        console.error('Error initializing component:', error);
        setShowEmojiDialog(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, [userId, source, username]);

  // Selección de emoji
  const handleEmojiSelection = (emojiIndex: number) => {
    setUserEmojiIndex(emojiIndex);
    setShowEmojiDialog(false);
    
    // Inicializar con asignaciones vacías
    setCellAssignments({});
    
    // Asegurar que esté en modo edición
    setIsSaved(false);
    
    const selectedEmoji = avatarEmojis[emojiIndex];
    toast({
      title: "Emoji seleccionado",
      description: `Has seleccionado ${selectedEmoji} como tu identificador. No podrás asignarte a ti mismo en el bingo.`,
    });
  };

  // Funcionalidad simplificada de asignación
  const handleDrop = (cellIndex: number, avatarIndex: number) => {
    if (isSaved) {
      toast({
        variant: "destructive",
        title: "No se pueden realizar cambios",
        description: "Tu votación ya ha sido guardada y no puede ser modificada.",
      });
      return;
    }

    // Verificar si el usuario está intentando auto-asignarse
    if (avatarIndex === userEmojiIndex) {
      toast({
        variant: "destructive",
        title: "Auto-reconocimiento no permitido",
        description: "No puedes asignarte a ti mismo en ninguna casilla del bingo."
      });
      return;
    }

    // Verificar si ya hay 3 caritas en la casilla
    if (cellAssignments[cellIndex]?.length >= 3) {
      toast({
        title: "Límite alcanzado",
        description: "Solo puedes colocar hasta 3 caritas en cada casilla.",
        variant: "destructive"
      });
      return;
    }

    // Verificar si la carita ya está en esta casilla
    if (cellAssignments[cellIndex]?.includes(avatarIndex)) {
      toast({
        title: "Carita duplicada",
        description: "No puedes usar la misma carita más de una vez en la misma casilla.",
        variant: "destructive"
      });
      return;
    }

    // Verificar si la carita ya está en 4 casillas
    const cellsWithThisAvatar = Object.values(cellAssignments).filter(
      avatars => avatars && avatars.includes(avatarIndex)
    ).length;

    if (cellsWithThisAvatar >= 4) {
      const avatarName = EMOJI_CONFIG[avatarIndex]?.name || avatarEmojis[avatarIndex];
      toast({
        title: "Límite de reconocimientos alcanzado",
        description: `${avatarName} ya está en 4 casillas. No puedes reconocer a la misma persona en más de 4 casillas.`,
        variant: "destructive"
      });
      return;
    }

    setCellAssignments(prev => ({
      ...prev,
      [cellIndex]: [...(prev[cellIndex] || []), avatarIndex]
    }));
  };

  const removeAvatar = (cellIndex: number, avatarIndex: number) => {
    if (isSaved) {
      toast({
        variant: "destructive",
        title: "No se pueden realizar cambios",
        description: "Tu votación ya ha sido guardada y no puede ser modificada.",
      });
      return;
    }
    
    setCellAssignments(prev => ({
      ...prev,
      [cellIndex]: (prev[cellIndex] || []).filter(id => id !== avatarIndex)
    }));
  };

  // Validaciones
  const validateOtherTeamCells = (): boolean => {
    const errors: string[] = [];
    
    // Verificar las primeras 3 casillas (índices 0, 1, 2)
    for (let i = 0; i < 3; i++) {
      if (!cellAssignments[i] || cellAssignments[i].length === 0) {
        errors.push(`La casilla "${bingoTexts[i]}" es obligatoria`);
      }
    }
    
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Por favor completa los campos obligatorios:",
        description: (
          <ul className="mt-2 list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        )
      });
    }
    
    return errors.length === 0;
  };

  const canSave = (): boolean => {
    // Solo verificar las primeras 3 casillas si no es modo DM
    if (source !== 'dm') {
      // Verificar las primeras 3 casillas (índices 0, 1, 2)
      for (let i = 0; i < 3; i++) {
        if (!cellAssignments[i] || cellAssignments[i].length === 0) {
          return false;
        }
      }
    }
    return !isSaved;
  };

  const handleSave = async () => {
    if (!canSave()) {
      toast({
        variant: "destructive",
        title: "No se puede guardar",
        description: source === 'dm' 
          ? "Tu votación ya ha sido guardada." 
          : "Debes completar las 3 casillas obligatorias de 'Otro equipo' antes de guardar.",
      });
      return;
    }

    if (userEmojiIndex === null) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar tu emoji identificador primero.",
      });
      return;
    }

    try {
      // Guardar en Supabase con source específico
      await saveBingoVotesWithSource(userId, userEmojiIndex, cellAssignments, EMOJI_CONFIG, source);
      
      // Guardar en localStorage con key específico del source
      const savedKey = `mayaBingo_${source}_${username}`;
      const dataToSave = {
        username,
        emojiIndex: userEmojiIndex,
        timestamp: Date.now(),
        assignments: cellAssignments
      };
      localStorage.setItem(savedKey, JSON.stringify(dataToSave));
      
      setIsSaved(true);
      
      toast({
        title: "¡Reconocimientos guardados!",
        description: `Tus reconocimientos han sido guardados exitosamente${source === 'dm' ? ' (DM)' : ''}.`,
      });
    } catch (error) {
      console.error('Error saving votes:', error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "Ocurrió un error al guardar los reconocimientos. Por favor intenta de nuevo.",
      });
    }
  };

  const SimpleFloatingAvatar = ({ 
    emoji, 
    index, 
    imageUrl, 
    readOnly, 
    name
  }: SimpleFloatingAvatarProps) => {
    const handleDragStart = (e: React.DragEvent) => {
      if (readOnly) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', index.toString());
      e.dataTransfer.effectAllowed = 'copy';
      e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e: React.DragEvent) => {
      e.currentTarget.classList.remove('opacity-50');
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <div 
                className={`rounded-full bg-amber-200 flex items-center justify-center text-lg shadow-lg transition-transform hover:scale-105 overflow-hidden ${
                  readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                }`}
                style={{
                  aspectRatio: '1/1',
                  position: 'relative',
                  width: '6rem',
                  height: '6rem',
                }}
                draggable={!readOnly}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {imageUrl ? (
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={name || emoji}
                      className="absolute w-full h-full object-cover"
                      style={{
                        transform: 'scale(1.0)',
                        objectPosition: '50% 50%',
                        transformOrigin: 'center',
                        imageRendering: 'crisp-edges'
                      }}
                    />
                  </div>
                ) : (
                  <span>{emoji}</span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900/90 text-gray-100 shadow-xl">
            <p className="font-medium">{name || emoji}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
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
    <div 
      className="min-h-screen relative overflow-hidden bg-amber-100"
      style={{
        backgroundImage: 'url("/fondos/Fondo inicial.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Capa semi-transparente para mejorar contraste */}
      <div className="absolute inset-0 bg-amber-900/30 backdrop-blur-sm"></div>

      {/* Contenido principal con z-index para estar sobre la capa semi-transparente */}
      <div className="relative z-10 min-h-screen p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="text-amber-200" size={32} />
            <h1 className="text-4xl font-bold text-amber-100 drop-shadow-lg">
              Bingo de Impacto
            </h1>
            <Star className="text-amber-200" size={32} />
          </div>
          <p className="text-amber-100 max-w-2xl mx-auto leading-relaxed mb-6 drop-shadow">
            Arrastra las caritas hacia las casillas para reconocer los logros de tus compañeros. 
            ¡Celebremos juntos los impactos positivos de nuestro equipo!
          </p>
          
        </div>

        {/* Bloque de instrucciones - Solo mostrar si no es modo DM */}
        {source !== 'dm' && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-amber-900/40 backdrop-blur-sm p-6 rounded-xl border border-amber-200/30">
              <h3 className="text-xl text-amber-200 font-semibold mb-4 drop-shadow-lg text-center">¿Cómo funciona?</h3>
              <div className="space-y-4 text-amber-100 text-left">
                <p className="leading-relaxed">
                  En las casillas de <span className="font-semibold text-amber-200">Otro equipo</span>, 
                  arrastra caritas de personas que pertenezcan a equipos diferentes al tuyo. 
                  <span className="font-semibold">¡Estas son casillas obligatorias!</span>
                </p>
                <p className="leading-relaxed">
                  En el resto de las casillas, puedes reconocer a personas de tu propio equipo o de otros equipos. 
                  Estas casillas son opcionales.
                </p>
                <p className="leading-relaxed">
                  Recuerda: en cada casilla puedes colocar de 1 a 3 caritas. 
                  <span className="font-semibold">¡Tú decides a quién reconocer!</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Diálogo de selección de emoji */}
        <Dialog open={showEmojiDialog} onOpenChange={setShowEmojiDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Selecciona tu emoji identificador</DialogTitle>
              <DialogDescription>
                Para evitar el auto-reconocimiento, necesitamos saber cuál es tu emoji. 
                Selecciona el emoji que te representa en el equipo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-4 p-4">
              {avatarEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelection(index)}
                  className="p-2 rounded-lg hover:bg-amber-100 transition-colors flex flex-col items-center gap-2"
                >
                  <SimpleFloatingAvatar
                    emoji={emoji}
                    index={index}
                    imageUrl={getImageForEmoji(emoji)}
                    readOnly={true}
                    name={EMOJI_CONFIG[index]?.name}
                  />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Contenido principal */}
        <div className="max-w-6xl mx-auto flex gap-8">
          {/* Panel del bingo */}
          <div className="flex-1">
            {isSaved && (
              <div className="mb-6 p-4 bg-green-900/40 backdrop-blur-sm border-2 border-green-200/30 rounded-xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-800/50 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-200">
                      ¡Votación completada!
                    </h3>
                    <p className="text-green-100">
                      Has completado tu votación exitosamente. Ahora solo puedes ver tus selecciones pero no modificarlas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-amber-900/60 to-orange-900/60 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border-4 border-amber-200/30">
              <div className="grid grid-cols-3 gap-6 p-4">
                {bingoTexts.map((text, index) => (
                  <div key={index}>
                    <SimpleBingoCell
                      text={text}
                      index={index}
                      assignedAvatars={cellAssignments[index] || []}
                      avatarEmojis={avatarEmojis}
                      onDrop={handleDrop}
                      onRemoveAvatar={removeAvatar}
                      isTeamCell={source !== 'dm' && index < 3}
                      readOnly={isSaved}
                      getImageForEmoji={getImageForEmoji}
                      emojiConfig={EMOJI_CONFIG}
                    />
                  </div>
                ))}
              </div>
            </div>

            {!isSaved && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={handleSave}
                          disabled={!canSave()}
                          className={`px-8 py-4 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105 ${
                            canSave()
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-gray-700/50 text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          Guardar Reconocimientos
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-4 bg-gray-900/90 text-gray-100 shadow-xl">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-semibold">
                          <Info size={16} className={canSave() ? "text-green-400" : "text-amber-400"} />
                          <span>Estado de la votación:</span>
                        </div>
                        <p>{canSave() ? "¡Todo listo para guardar!" : source === 'dm' ? "Ya has completado tu votación" : "Completa las casillas obligatorias de 'Otro equipo'"}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Panel de caritas */}
          <div className="w-[24rem]">
            <Card className="border-4 border-amber-200/30 bg-amber-900/40 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold text-amber-200 flex items-center justify-center gap-2 mb-4">
                    <span className="text-2xl">💚</span>
                    Caritas
                  </h1>
                  <p className="text-lg text-amber-100">
                    {isSaved ? "Tu votación está completa" : "Arrastra las caritas hacia las casillas para asignar reconocimientos"}
                  </p>
                  {!isSaved && (
                    <div className="space-y-2 mt-3">
                      <p className="text-sm text-amber-200">
                        • Máximo 3 caritas por casilla
                      </p>
                      <p className="text-sm text-amber-200">
                        
                      </p>
                      <p className="text-sm text-amber-200">
                        
                      </p>
                      <p className="text-sm text-amber-200">
                        • Arrastra y suelta para asignar
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4 p-4">
                  {avatarEmojis.map((emoji, index) => (
                    <div key={index} className="rounded-full flex justify-center items-center">
                      <SimpleFloatingAvatar
                        emoji={emoji}
                        index={index}
                        imageUrl={getImageForEmoji(emoji)}
                        readOnly={isSaved}
                        name={EMOJI_CONFIG[index]?.name}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-amber-800/40 rounded-lg border border-amber-200/30">
                  <p className="text-amber-100 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    {isSaved ? "Tu votación ha sido guardada exitosamente" : "Tip: Arrastra una carita directamente hacia la casilla donde quieres asignarla"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MayaBingo;
