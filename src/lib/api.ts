import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import type { Participant, BingoCell, CellAssignment, Recognition, ParticipantRanking, EmojiConfig } from '@/types/supabase';
import type { Database } from '@/types/supabase';

// Tipos específicos de Supabase
type SupabaseParticipant = Database['public']['Tables']['participants']['Row'];

// Funciones para participantes
export const getParticipants = async (): Promise<Participant[]> => {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};

export const createParticipant = async (name: string, initials: string, avatarUrl?: string): Promise<Participant> => {
  const { data, error } = await supabase
    .from('participants')
    .insert([{ name, initials, avatar_url: avatarUrl }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Funciones para casillas del bingo
export const getBingoCells = async (): Promise<BingoCell[]> => {
  const { data, error } = await supabase
    .from('bingo_cells')
    .select('*')
    .order('id');
  
  if (error) throw error;
  return data;
};

// Funciones para asignaciones
export const assignParticipantToCell = async (
  cellId: number,
  participantId: string
): Promise<CellAssignment> => {
  const { data, error } = await supabase
    .from('cell_assignments')
    .insert([{ cell_id: cellId, participant_id: participantId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const removeAssignment = async (cellId: number, participantId: string): Promise<void> => {
  const { error } = await supabase
    .from('cell_assignments')
    .delete()
    .match({ cell_id: cellId, participant_id: participantId });
  
  if (error) throw error;
};

export const getCellAssignments = async (): Promise<CellAssignment[]> => {
  const { data, error } = await supabase
    .from('cell_assignments')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Funciones para reconocimientos
export const createRecognition = async (
  cellId: number,
  participantId: string,
  recognizedById: string,
  points: number
): Promise<Recognition> => {
  const { data, error } = await supabase
    .from('recognitions')
    .insert([{
      cell_id: cellId,
      participant_id: participantId,
      recognized_by_id: recognizedById,
      points
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Función para obtener el ranking
export const getParticipantRankings = async (): Promise<ParticipantRanking[]> => {
  const { data, error } = await supabase
    .from('participant_rankings')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Función para subir una imagen
export const uploadAvatar = async (file: File, participantId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${participantId}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Actualizar la URL del avatar en el perfil del participante
  const { error: updateError } = await supabase
    .from('participants')
    .update({ avatar_url: publicUrl })
    .eq('id', participantId);

  if (updateError) throw updateError;

  return publicUrl;
};

export interface BingoUser {
  id: string;
  username: string;
  display_name: string;
  has_voted: boolean;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: BingoUser;
}

export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    // First, try to get the user directly from the bingo_users table
    const { data: userData, error: userError } = await supabase
      .from('bingo_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return {
        success: false,
        message: 'Usuario o contraseña incorrectos'
      };
    }

    if (!userData) {
      return {
        success: false,
        message: 'Usuario o contraseña incorrectos'
      };
    }

    // Return success without checking has_voted
    return {
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        has_voted: userData.has_voted
      }
    };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      success: false,
      message: 'Error al intentar iniciar sesión'
    };
  }
};

// Nueva función específica para el login de usuarios DM
export const loginDMUser = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    // Try to get the user from the bingo_users table (with fallback to dm_users)
    const { data: userData, error: userError } = await supabase
      .from('bingo_users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password)
      .single();

    if (userError) {
      // Fallback: try dm_users table
      const { data: dmUserData, error: dmUserError } = await supabase
        .from('dm_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (dmUserError || !dmUserData) {
        console.error('Error fetching DM user:', userError, dmUserError);
        return {
          success: false,
          message: 'Usuario o contraseña incorrectos'
        };
      }

      // If found in dm_users, use that data
      return {
        success: true,
        user: {
          id: dmUserData.id,
          username: dmUserData.username,
          display_name: dmUserData.display_name,
          has_voted: dmUserData.has_voted
        }
      };
    }

    if (!userData) {
      return {
        success: false,
        message: 'Usuario o contraseña incorrectos'
      };
    }

    return {
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        has_voted: userData.has_voted_dm || false // Usar has_voted_dm para DM
      }
    };
  } catch (error) {
    console.error('Error during DM login:', error);
    return {
      success: false,
      message: 'Error al intentar iniciar sesión en DM'
    };
  }
};

export const markUserVoted = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bingo_users')
      .update({ has_voted: true })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking user as voted:', error);
    return false;
  }
};

// Nueva función específica para marcar usuarios DM como votados
export const markDMUserVoted = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('dm_users')
      .update({ has_voted: true })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking DM user as voted:', error);
    return false;
  }
};

export const uploadBingoUserAvatar = async (file: File, userId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `bingo-users/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update user record with avatar URL
    const { error: updateError } = await supabase
      .from('bingo_users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Funciones para la configuración de emojis
export const getEmojiConfig = async (): Promise<EmojiConfig[]> => {
  const { data, error } = await supabase
    .from('emoji_config')
    .select('*')
    .order('position');
  
  if (error) {
    console.error('Error fetching emoji config:', error);
    throw error;
  }

  return data || [];
};

export const updateEmojiName = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('emoji_config')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating emoji name:', error);
    throw error;
  }
};

export const addEmoji = async (emoji: string, name: string): Promise<void> => {
  // Get the highest position
  const { data: positions } = await supabase
    .from('emoji_config')
    .select('position')
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = positions && positions.length > 0 ? positions[0].position + 1 : 0;

  const { error } = await supabase
    .from('emoji_config')
    .insert([
      {
        id: uuidv4(),
        emoji,
        name,
        position: nextPosition
      }
    ]);

  if (error) {
    console.error('Error adding emoji:', error);
    throw error;
  }
};

export const deleteEmoji = async (id: string): Promise<void> => {
  // First, get the emoji to delete its image if it exists
  const { data: emoji } = await supabase
    .from('emoji_config')
    .select('image_url')
    .eq('id', id)
    .single();

  if (emoji?.image_url) {
    const path = emoji.image_url.split('/').pop();
    if (path) {
      const { error: storageError } = await supabase.storage
        .from('emoji-images')
        .remove([path]);

      if (storageError) {
        console.error('Error deleting emoji image:', storageError);
      }
    }
  }

  const { error } = await supabase
    .from('emoji_config')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting emoji:', error);
    throw error;
  }
};

export const uploadEmojiImage = async (file: File, emojiId: string): Promise<void> => {
  try {
    // First, get the current emoji to delete its old image if it exists
    const { data: currentEmoji } = await supabase
      .from('emoji_config')
      .select('image_url')
      .eq('id', emojiId)
      .single();

    if (currentEmoji?.image_url) {
      const oldPath = currentEmoji.image_url.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('emoji-images')
          .remove([oldPath]);
      }
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${emojiId}-${Date.now()}.${fileExt}`;

    // Upload the new file
    const { error: uploadError, data } = await supabase.storage
      .from('emoji-images')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage
      .from('emoji-images')
      .getPublicUrl(fileName);

    // Update the emoji record with the new image URL
    const { error: updateError } = await supabase
      .from('emoji_config')
      .update({ 
        image_url: publicUrl.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', emojiId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Error uploading emoji image:', error);
    throw error;
  }
};

export const updateEmojiImageFromPublic = async (emojiId: string, publicImagePath: string): Promise<void> => {
  try {
    // Get the public URL for the image
    const publicUrl = window.location.origin + '/' + publicImagePath;

    // Update the emoji record with the new image URL
    const { error: updateError } = await supabase
      .from('emoji_config')
      .update({ 
        image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', emojiId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Error updating emoji image from public:', error);
    throw error;
  }
};

// ===== NUEVAS FUNCIONES PARA EL SISTEMA DE VOTOS DEL BINGO =====

// Función para crear participantes basados en emojis locales
export const createParticipantsFromLocalEmojis = async (localEmojiConfig: {emoji: string, name: string, image_url: string}[]): Promise<void> => {
  try {
    // Primero verificar cuáles participantes ya existen
    const { data: existingParticipants } = await supabase
      .from('participants')
      .select('name');
    
    const existingNames = new Set(existingParticipants?.map(p => p.name) || []);
    
    // Crear solo los participantes que no existen
    const newParticipants = localEmojiConfig
      .filter(config => !existingNames.has(config.name))
      .map(config => ({
        name: config.name,
        initials: config.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2),
        avatar_url: config.image_url
      }));
    
    if (newParticipants.length > 0) {
      const { error } = await supabase
        .from('participants')
        .insert(newParticipants);
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error creating participants from local emojis:', error);
    throw error;
  }
};

// Función para obtener participantes ordenados por emoji local
export const getParticipantsByEmojiOrder = async (localEmojiConfig: {emoji: string, name: string}[]): Promise<{emoji: string, participant: SupabaseParticipant | null}[]> => {
  try {
    const { data: participants, error } = await supabase
      .from('participants')
      .select('*');
    
    if (error) throw error;
    
    // Crear un mapa de nombre -> participante
    const participantMap = new Map(participants.map(p => [p.name, p]));
    
    // Retornar en el orden de los emojis locales
    return localEmojiConfig.map(config => ({
      emoji: config.emoji,
      participant: participantMap.get(config.name) || null
    }));
  } catch (error) {
    console.error('Error getting participants by emoji order:', error);
    throw error;
  }
};

// Función para guardar votos completos de un usuario
export const saveBingoVotes = async (
  userId: string, 
  emojiIndex: number,
  assignments: {[cellIndex: number]: number[]},
  localEmojiConfig: {emoji: string, name: string}[]
): Promise<void> => {
  try {
    // Primero obtener los participantes en orden
    const participantsByEmoji = await getParticipantsByEmojiOrder(localEmojiConfig);
    
    // Obtener la información del usuario votante desde bingo_users
    const { data: votingUser, error: userError } = await supabase
      .from('bingo_users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Asegurar que el usuario votante exista como participante
    // Buscar si ya existe como participante basado en display_name
    const { data: existingParticipant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('name', votingUser.display_name)
      .single();
    
    let votingParticipantId = userId;
    
    // Si no existe como participante, crearlo
    if (participantError && participantError.code === 'PGRST116') { // No rows returned
      const { data: newParticipant, error: createError } = await supabase
        .from('participants')
        .insert({
          id: userId, // Usar el mismo ID del usuario
          name: votingUser.display_name,
          initials: votingUser.display_name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2),
          avatar_url: null
        })
        .select()
        .single();
      
      if (createError) throw createError;
      votingParticipantId = newParticipant.id;
    } else if (existingParticipant) {
      votingParticipantId = existingParticipant.id;
    }
    
    // Obtener las casillas del bingo
    const { data: bingoCells, error: cellsError } = await supabase
      .from('bingo_cells')
      .select('*')
      .order('id');
    
    if (cellsError) throw cellsError;
    
    // Definir los puntos por casilla (mismo orden que en MayaBingo)
    const cellPointsSystem = [5, 5, 5, 4, 3, 3, 3, 3, 0];
    
    // Preparar los reconocimientos
    const recognitions = [];
    
    Object.entries(assignments).forEach(([cellIndex, avatarIndices]) => {
      const cellIndexNum = parseInt(cellIndex);
      const points = cellPointsSystem[cellIndexNum] || 0;
      const cellId = bingoCells[cellIndexNum]?.id;
      
      if (cellId) {
        avatarIndices.forEach(avatarIndex => {
          const participantData = participantsByEmoji[avatarIndex];
          if (participantData?.participant) {
            recognitions.push({
              cell_id: cellId,
              participant_id: participantData.participant.id,
              recognized_by_id: votingParticipantId, // ID del participante que vota
              points: points
            });
          }
        });
      }
    });
    
    // Guardar todos los reconocimientos
    if (recognitions.length > 0) {
      const { error: recognitionsError } = await supabase
        .from('recognitions')
        .insert(recognitions);
      
      if (recognitionsError) throw recognitionsError;
    }
    
    // Marcar al usuario como votado
    await markUserVoted(userId);
    
  } catch (error) {
    console.error('Error saving bingo votes:', error);
    throw error;
  }
};

// Función para verificar si un usuario ya votó
export const checkUserVoted = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('bingo_users')
      .select('has_voted')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data.has_voted;
  } catch (error) {
    console.error('Error checking if user voted:', error);
    return false;
  }
};

// Función para obtener el ranking basado en reconocimientos
export const getBingoRanking = async (localEmojiConfig: {emoji: string, name: string}[]): Promise<{
  emoji: string;
  name: string;
  imageUrl: string | null;
  totalPoints: number;
  totalRecognitions: number;
  categoryPoints: {[category: string]: number};
}[]> => {
  try {
    // Mapeo de índices de casillas a categorías específicas
    const cellIndexToCategory = {
      0: "Trabajo en otro equipo",
      1: "Trabajo en otro equipo", 
      2: "Trabajo en otro equipo",
      3: "Uso de tecnología nueva",
      4: "Visión estratégica",
      5: "Proactividad",
      6: "Proactividad", 
      7: "Creatividad",
      8: "Apoyo"
    };

    // Obtener todos los reconocimientos con información de participantes y celdas
    // Especificamos explícitamente las relaciones para evitar ambigüedad
    const { data: recognitions, error } = await supabase
      .from('recognitions')
      .select(`
        *,
        participant:participant_id(id, name, avatar_url),
        cell:bingo_cells(*)
      `);
    
    if (error) throw error;
    
    // Obtener participantes en orden de emojis
    const participantsByEmoji = await getParticipantsByEmojiOrder(localEmojiConfig);
    const participantEmojiMap = new Map();
    participantsByEmoji.forEach(({emoji, participant}) => {
      if (participant) {
        participantEmojiMap.set(participant.id, emoji);
      }
    });
    
    // Calcular estadísticas por participante
    const stats = new Map();
    
    // Inicializar todos los participantes con 0
    participantsByEmoji.forEach(({emoji, participant}) => {
      if (participant) {
        stats.set(participant.id, {
          emoji,
          name: participant.name,
          imageUrl: participant.avatar_url,
          totalPoints: 0,
          totalRecognitions: 0,
          categoryPoints: {}
        });
      }
    });
    
    // Sumar reconocimientos
    recognitions.forEach((recognition: any) => {
      const participantId = recognition.participant_id;
      if (stats.has(participantId)) {
        const stat = stats.get(participantId);
        stat.totalPoints += recognition.points;
        stat.totalRecognitions += 1;
        
        // Determinar la categoría basándose en el ID de la celda
        // Asumiendo que las celdas están ordenadas por ID (1-9 corresponde a índices 0-8)
        const cellIndex = recognition.cell.id - 1;
        const category = cellIndexToCategory[cellIndex] || "Otros";
        
        if (!stat.categoryPoints[category]) {
          stat.categoryPoints[category] = 0;
        }
        stat.categoryPoints[category] += recognition.points;
      }
    });
    
    // Convertir a array y ordenar por puntos
    return Array.from(stats.values())
      .sort((a, b) => b.totalPoints - a.totalPoints || b.totalRecognitions - a.totalRecognitions);
    
  } catch (error) {
    console.error('Error getting bingo ranking:', error);
    throw error;
  }
};

// Función para reabrir votación de un usuario
export const reopenUserVoting = async (userId: string): Promise<void> => {
  try {
    // Eliminar todos los reconocimientos del usuario
    const { error: deleteError } = await supabase
      .from('recognitions')
      .delete()
      .eq('recognized_by_id', userId);
    
    if (deleteError) throw deleteError;
    
    // Marcar al usuario como no votado
    const { error: updateError } = await supabase
      .from('bingo_users')
      .update({ has_voted: false })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
  } catch (error) {
    console.error('Error reopening user voting:', error);
    throw error;
  }
};

// NUEVAS FUNCIONES CON SOPORTE PARA SOURCE (BINGO VS DM)

// Función para guardar votos con source específico (con fallback)
export const saveBingoVotesWithSource = async (
  userId: string, 
  emojiIndex: number,
  assignments: {[cellIndex: number]: number[]},
  localEmojiConfig: {emoji: string, name: string}[],
  source: 'bingo' | 'dm' = 'bingo'
): Promise<void> => {
  try {
    // Si es DM, usar las funciones específicas de DM
    if (source === 'dm') {
      await saveDMBingoVotes(userId, assignments, localEmojiConfig);
      return;
    }

    // Para bingo regular, usar la implementación original
    // Primero obtener los participantes en orden
    const participantsByEmoji = await getParticipantsByEmojiOrder(localEmojiConfig);
    
    // Obtener la información del usuario votante desde bingo_users
    const { data: votingUser, error: userError } = await supabase
      .from('bingo_users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Asegurar que el usuario votante exista como participante
    // Buscar si ya existe como participante basado en display_name
    const { data: existingParticipant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('name', votingUser.display_name)
      .single();
    
    let votingParticipantId = userId;
    
    // Si no existe como participante, crearlo
    if (participantError && participantError.code === 'PGRST116') { // No rows returned
      const { data: newParticipant, error: createError } = await supabase
        .from('participants')
        .insert({
          id: userId, // Usar el mismo ID del usuario
          name: votingUser.display_name,
          initials: votingUser.display_name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2),
          avatar_url: null
        })
        .select()
        .single();
      
      if (createError) throw createError;
      votingParticipantId = newParticipant.id;
    } else if (existingParticipant) {
      votingParticipantId = existingParticipant.id;
    }
    
    // Obtener las casillas del bingo
    const { data: bingoCells, error: cellsError } = await supabase
      .from('bingo_cells')
      .select('*')
      .order('id');
    
    if (cellsError) throw cellsError;
    
    // Definir los puntos por casilla (mismo orden que en MayaBingo)
    const cellPointsSystem = [5, 5, 5, 4, 3, 3, 3, 3, 0];
    
    // Preparar los reconocimientos
    const recognitions = [];
    
    Object.entries(assignments).forEach(([cellIndex, avatarIndices]) => {
      const cellIndexNum = parseInt(cellIndex);
      const points = cellPointsSystem[cellIndexNum] || 0;
      const cellId = bingoCells[cellIndexNum]?.id;
      
      if (cellId) {
        avatarIndices.forEach(avatarIndex => {
          const participantData = participantsByEmoji[avatarIndex];
          if (participantData?.participant) {
            // Intentar insertar con source, pero si falla, insertar sin source
            const recognitionData: any = {
              cell_id: cellId,
              participant_id: participantData.participant.id,
              recognized_by_id: votingParticipantId,
              points: points
            };
            
            // Solo agregar source si estamos seguros de que existe la columna
            try {
              recognitionData.source = source;
            } catch (error) {
              console.log('Source column not available, using without source');
            }
            
            recognitions.push(recognitionData);
          }
        });
      }
    });
    
    // Guardar todos los reconocimientos
    if (recognitions.length > 0) {
      const { error: recognitionsError } = await supabase
        .from('recognitions')
        .insert(recognitions);
      
      if (recognitionsError) {
        console.error('Error with source, trying without source:', recognitionsError);
        // Si falla con source, intentar sin source
        const recognitionsWithoutSource = recognitions.map(r => {
          const { source, ...rest } = r;
          return rest;
        });
        
        const { error: fallbackError } = await supabase
          .from('recognitions')
          .insert(recognitionsWithoutSource);
        
        if (fallbackError) throw fallbackError;
      }
    }
    
    // Marcar al usuario como votado con source específico
    await markUserVotedWithSource(userId, source);
    
  } catch (error) {
    console.error('Error saving bingo votes with source:', error);
    // Fallback a la función original
    console.log('Falling back to original saveBingoVotes function');
    await saveBingoVotes(userId, emojiIndex, assignments, localEmojiConfig);
  }
};

// Función para marcar usuario como votado con source específico (con fallback)
export const markUserVotedWithSource = async (userId: string, source: 'bingo' | 'dm' = 'bingo'): Promise<boolean> => {
  try {
    if (source === 'dm') {
      // Para DM, usar la tabla dm_users
      const { error } = await supabase
        .from('dm_users')
        .update({ has_voted: true })
        .eq('id', userId);

      if (error) {
        console.log('dm_users table not available, falling back to bingo_users');
        // Fallback a bingo_users con has_voted_dm
        const { error: fallbackError } = await supabase
          .from('bingo_users')
          .update({ has_voted_dm: true })
          .eq('id', userId);
        
        if (fallbackError) {
          console.log('has_voted_dm column not available, using has_voted');
          return await markUserVoted(userId);
        }
      }
    } else {
      // Para bingo normal, usar bingo_users
      const { error } = await supabase
        .from('bingo_users')
        .update({ has_voted: true })
        .eq('id', userId);

      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking user as voted with source:', error);
    // Fallback a la función original
    return await markUserVoted(userId);
  }
};

// Función para verificar si un usuario ya votó con source específico (con fallback)
export const checkUserVotedWithSource = async (userId: string, source: 'bingo' | 'dm' = 'bingo'): Promise<boolean> => {
  try {
    if (source === 'dm') {
      // Para DM, usar la función específica
      return await checkUserVotedDM(userId);
    } else {
      // Para bingo normal, usar bingo_users
      const { data, error } = await supabase
        .from('bingo_users')
        .select('has_voted')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data.has_voted || false;
    }
  } catch (error) {
    console.error('Error checking if user voted with source:', error);
    // Fallback a la función original
    return await checkUserVoted(userId);
  }
};

// Función para obtener el ranking filtrado por source (con fallback)
export const getBingoRankingWithSource = async (
  localEmojiConfig: {emoji: string, name: string}[], 
  source: 'bingo' | 'dm' = 'bingo'
): Promise<{
  emoji: string;
  name: string;
  imageUrl: string | null;
  totalPoints: number;
  totalRecognitions: number;
  recognitionCount: number;
  categoryPoints: {[category: string]: number};
}[]> => {
  try {
    // Mapeo de índices de casillas a categorías específicas
    const cellIndexToCategory = {
      0: "Trabajo en otro equipo",
      1: "Trabajo en otro equipo", 
      2: "Trabajo en otro equipo",
      3: "Uso de tecnología nueva",
      4: "Visión estratégica",
      5: "Proactividad",
      6: "Proactividad", 
      7: "Creatividad",
      8: "Apoyo"
    };

    // Intentar obtener reconocimientos filtrados por source
    let recognitions;
    try {
      const { data, error } = await supabase
        .from('recognitions')
        .select(`
          *,
          participant:participant_id(id, name, avatar_url),
          cell:bingo_cells(*)
        `)
        .eq('source', source);
      
      if (error) throw error;
      recognitions = data;
    } catch (error) {
      console.log('Source column not available, using all recognitions');
      // Fallback: obtener todos los reconocimientos (sin filtro de source)
      const { data, error: fallbackError } = await supabase
        .from('recognitions')
        .select(`
          *,
          participant:participant_id(id, name, avatar_url),
          cell:bingo_cells(*)
        `);
      
      if (fallbackError) throw fallbackError;
      recognitions = data;
    }
    
    // Obtener participantes en orden de emojis
    const participantsByEmoji = await getParticipantsByEmojiOrder(localEmojiConfig);
    const participantEmojiMap = new Map();
    participantsByEmoji.forEach(({emoji, participant}) => {
      if (participant) {
        participantEmojiMap.set(participant.id, emoji);
      }
    });
    
    // Calcular estadísticas por participante
    const stats = new Map();
    
    // Inicializar todos los participantes con 0
    participantsByEmoji.forEach(({emoji, participant}) => {
      if (participant) {
        stats.set(participant.id, {
          emoji,
          name: participant.name,
          imageUrl: participant.avatar_url,
          totalPoints: 0,
          totalRecognitions: 0,
          recognitionCount: 0,
          categoryPoints: {}
        });
      }
    });
    
    // Sumar reconocimientos
    recognitions.forEach((recognition: any) => {
      const participantId = recognition.participant_id;
      if (stats.has(participantId)) {
        const stat = stats.get(participantId);
        stat.totalPoints += recognition.points;
        stat.totalRecognitions += 1;
        stat.recognitionCount += 1;
        
        // Determinar la categoría basándose en el ID de la celda
        const cellIndex = recognition.cell.id - 1;
        const category = cellIndexToCategory[cellIndex] || "Otros";
        
        if (!stat.categoryPoints[category]) {
          stat.categoryPoints[category] = 0;
        }
        stat.categoryPoints[category] += recognition.points;
      }
    });
    
    // Convertir a array y ordenar por puntos
    return Array.from(stats.values())
      .sort((a, b) => b.totalPoints - a.totalPoints || b.totalRecognitions - a.totalRecognitions);
    
  } catch (error) {
    console.error('Error getting bingo ranking with source:', error);
    console.log('Falling back to original getBingoRanking function');
    // Fallback completo a la función original
    const originalRanking = await getBingoRanking(localEmojiConfig);
    return originalRanking.map(person => ({
      emoji: person.emoji,
      name: person.name,
      imageUrl: person.imageUrl,
      totalPoints: person.totalPoints,
      totalRecognitions: person.totalRecognitions,
      recognitionCount: person.totalRecognitions,
      categoryPoints: person.categoryPoints
    }));
  }
};

// Función para reabrir votación con source específico (con fallback)
export const reopenUserVotingWithSource = async (userId: string, source: 'bingo' | 'dm' = 'bingo'): Promise<void> => {
  try {
    // Intentar eliminar reconocimientos filtrados por source
    try {
      const { error: deleteError } = await supabase
        .from('recognitions')
        .delete()
        .eq('recognized_by_id', userId)
        .eq('source', source);
      
      if (deleteError) throw deleteError;
    } catch (error) {
      console.log('Source column not available, deleting all recognitions for user');
      // Fallback: eliminar todos los reconocimientos del usuario
      const { error: fallbackDeleteError } = await supabase
        .from('recognitions')
        .delete()
        .eq('recognized_by_id', userId);
      
      if (fallbackDeleteError) throw fallbackDeleteError;
    }
    
    // Marcar al usuario como no votado para el source específico
    try {
      if (source === 'dm') {
        // Para DM, usar la tabla dm_users
        const { error: updateError } = await supabase
          .from('dm_users')
          .update({ has_voted: false })
          .eq('id', userId);
        
        if (updateError) {
          console.log('dm_users table not available, falling back to bingo_users');
          // Fallback a bingo_users con has_voted_dm
          const { error: fallbackError } = await supabase
            .from('bingo_users')
            .update({ has_voted_dm: false })
            .eq('id', userId);
          
          if (fallbackError) throw fallbackError;
        }
      } else {
        // Para bingo normal, usar bingo_users
        const { error: updateError } = await supabase
          .from('bingo_users')
          .update({ has_voted: false })
          .eq('id', userId);
        
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.log('Error updating vote status, using fallback');
      // Fallback a has_voted normal
      const { error: fallbackUpdateError } = await supabase
        .from('bingo_users')
        .update({ has_voted: false })
        .eq('id', userId);
      
      if (fallbackUpdateError) throw fallbackUpdateError;
    }
    
  } catch (error) {
    console.error('Error reopening user voting with source:', error);
    console.log('Falling back to original reopenUserVoting function');
    // Fallback completo a la función original
    await reopenUserVoting(userId);
  }
};

// =========================================
// FUNCIONES ESPECÍFICAS PARA DM BINGO
// =========================================

// Función para guardar votos específicamente en las tablas DM
export const saveDMBingoVotes = async (
  userId: string, 
  assignments: {[cellIndex: number]: number[]},
  localEmojiConfig: {emoji: string, name: string}[]
): Promise<void> => {
  try {
    // Preparar los datos de assignments en formato JSONB para la función SQL
    const assignmentsArray = Object.entries(assignments).map(([cellIndex, avatarIndices]) => {
      return avatarIndices.map(avatarIndex => ({
        cell_id: parseInt(cellIndex) + 1, // Convertir índice (0-8) a ID (1-9)
        participant_id: localEmojiConfig[avatarIndex]?.emoji // Usar el emoji como identificador
      }));
    }).flat();

    // Llamar a la función SQL para guardar los votos DM
    const { data, error } = await supabase.rpc('save_dm_bingo_votes', {
      p_user_id: userId,
      p_assignments: assignmentsArray
    });

    if (error) throw error;
    
    if (!data?.success) {
      throw new Error(data?.message || 'Error desconocido al guardar votación DM');
    }

  } catch (error) {
    console.error('Error saving DM bingo votes:', error);
    throw error;
  }
};

// Función para obtener el ranking específico de DM
export const getDMBingoRanking = async (): Promise<{
  id: string;
  emoji: string;
  name: string;
  image_url: string;
  total_recognitions: number;
  total_points: number;
}[]> => {
  try {
    const { data, error } = await supabase
      .from('dm_participant_rankings')
      .select('*');

    if (error) throw error;
    return data || [];

  } catch (error) {
    console.error('Error getting DM bingo ranking:', error);
    throw error;
  }
};

// Función para obtener las asignaciones DM de un usuario específico
export const getUserDMAssignments = async (userId: string): Promise<{[cellIndex: number]: string[]}> => {
  try {
    const { data, error } = await supabase
      .from('dm_cell_assignments')
      .select(`
        cell_id,
        dm_participants (
          emoji,
          name
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Convertir a formato esperado por el frontend
    const assignments: {[cellIndex: number]: string[]} = {};
    
    data?.forEach((assignment: any) => {
      const cellIndex = assignment.cell_id - 1; // Convertir ID (1-9) a índice (0-8)
      if (!assignments[cellIndex]) {
        assignments[cellIndex] = [];
      }
      assignments[cellIndex].push(assignment.dm_participants.emoji);
    });

    return assignments;

  } catch (error) {
    console.error('Error getting user DM assignments:', error);
    return {};
  }
};

// Función para verificar si un usuario ya votó en DM
export const checkUserVotedDM = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('bingo_users')
      .select('has_voted_dm')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data?.has_voted_dm || false;
  } catch (error) {
    console.error('Error checking if user voted DM:', error);
    return false;
  }
};

// Función para obtener todos los participantes DM
export const getDMParticipants = async (): Promise<{
  id: string;
  emoji: string;
  name: string;
  image_url: string;
  position: number;
}[]> => {
  try {
    const { data, error } = await supabase
      .from('dm_participants')
      .select('*')
      .order('position');

    if (error) throw error;
    return data || [];

  } catch (error) {
    console.error('Error getting DM participants:', error);
    throw error;
  }
};

// Función para obtener las casillas DM
export const getDMBingoCells = async (): Promise<{
  id: number;
  text: string;
  points: number;
  position: number;
}[]> => {
  try {
    const { data, error } = await supabase
      .from('dm_bingo_cells')
      .select('*')
      .order('position');

    if (error) throw error;
    return data || [];

  } catch (error) {
    console.error('Error getting DM bingo cells:', error);
    throw error;
  }
};

// Función para reabrir votación DM
export const reopenUserDMVoting = async (userId: string): Promise<void> => {
  try {
    // Usar la función SQL actualizada que limpia assignments y recognitions
    const { data, error } = await supabase.rpc('reopen_dm_user_voting', {
      p_user_id: userId
    });

    if (error) throw error;
    
    if (!data) {
      throw new Error('Error al reabrir votación DM');
    }

  } catch (error) {
    console.error('Error reopening user DM voting:', error);
    throw error;
  }
};

// Función para obtener el ranking DM con puntuaciones por categoría
export const getDMBingoRankingWithCategories = async (): Promise<{
  id: string;
  emoji: string;
  name: string;
  image_url: string;
  total_recognitions: number;
  total_points: number;
  categoryPoints: {
    colaboracion: number;
    solucionProblemas: number;
    implementacionTecnologia: number;
  };
}[]> => {
  try {
    // Obtener datos básicos del ranking
    const rankingData = await getDMBingoRanking();
    
    // Obtener todas las asignaciones con detalles de casillas
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('dm_cell_assignments')
      .select(`
        participant_id,
        dm_bingo_cells (
          id,
          text,
          points
        )
      `);

    if (assignmentsError) throw assignmentsError;

    // Mapear textos de casillas a categorías
    const categoryMapping: {[text: string]: string} = {
      "Comparte información y recursos de forma proactiva con todos": "colaboracion",
      "Participa en reuniones de equipo con aportes relevantes": "colaboracion", 
      "Coopera con diferentes equipos cuando es necesario": "colaboracion",
      "Siempre está dispuesto a escuchar": "colaboracion",
      "Identifica las causas raíz de los problemas y propone soluciones efectivas": "solucionProblemas",
      "Solicita asistencia externa para resolver obstáculos complejos": "solucionProblemas",
      "Reacciona con agilidad ante imprevistos": "solucionProblemas",
      "Incorpora herramientas emergentes que optimizan el flujo de trabajo": "implementacionTecnologia",
      "Implementa soluciones tecnológicas": "implementacionTecnologia"
    };

    // Calcular puntos por categoría para cada participante
    const participantCategoryPoints: {[participantId: string]: {
      colaboracion: number;
      solucionProblemas: number;
      implementacionTecnologia: number;
    }} = {};

    assignmentsData?.forEach((assignment: any) => {
      const participantId = assignment.participant_id;
      const cellText = assignment.dm_bingo_cells?.text;
      const cellPoints = assignment.dm_bingo_cells?.points || 0;
      
      if (!participantCategoryPoints[participantId]) {
        participantCategoryPoints[participantId] = {
          colaboracion: 0,
          solucionProblemas: 0,
          implementacionTecnologia: 0
        };
      }

      const category = categoryMapping[cellText];
      if (category && (category === 'colaboracion' || category === 'solucionProblemas' || category === 'implementacionTecnologia')) {
        participantCategoryPoints[participantId][category] += cellPoints;
      }
    });

    // Combinar datos de ranking con puntos por categoría
    const rankingWithCategories = rankingData.map(participant => ({
      ...participant,
      categoryPoints: participantCategoryPoints[participant.id] || {
        colaboracion: 0,
        solucionProblemas: 0,
        implementacionTecnologia: 0
      }
    }));

    return rankingWithCategories;

  } catch (error) {
    console.error('Error getting DM bingo ranking with categories:', error);
    throw error;
  }
};

// Función para aplicar migración DM - recrear reconocimientos
export const applyDMMigration = async (): Promise<void> => {
  try {
    console.log('Iniciando migración DM...');
    
    // 1. Obtener todas las asignaciones DM existentes con información de casillas
    const { data: assignments, error: assignmentsError } = await supabase
      .from('dm_cell_assignments')
      .select(`
        cell_id,
        participant_id,
        user_id,
        dm_bingo_cells!inner(points)
      `);

    if (assignmentsError) {
      console.error('Error getting assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log('Asignaciones encontradas:', assignments?.length || 0);

    // 2. Limpiar todos los reconocimientos DM existentes
    const { error: deleteError } = await supabase
      .from('dm_recognitions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = no rows found (OK)
      console.error('Error deleting recognitions:', deleteError);
      throw deleteError;
    }

    console.log('Reconocimientos anteriores eliminados');

    // 3. Recrear reconocimientos basados en las asignaciones
    if (assignments && assignments.length > 0) {
      const recognitions = assignments.map((assignment: any) => ({
        cell_id: assignment.cell_id,
        participant_id: assignment.participant_id,
        recognized_by_id: assignment.user_id,
        points: assignment.dm_bingo_cells?.points || 0
      }));

      console.log('Creando reconocimientos:', recognitions.length);

      const { error: insertError } = await supabase
        .from('dm_recognitions')
        .insert(recognitions);

      if (insertError) {
        console.error('Error inserting recognitions:', insertError);
        throw insertError;
      }

      console.log('Reconocimientos DM recreados exitosamente:', recognitions.length);
    } else {
      console.log('No hay asignaciones para procesar');
    }

    console.log('Migración DM completada exitosamente');

  } catch (error) {
    console.error('Error en migración DM:', error);
    throw error;
  }
};

// Función para obtener las asignaciones de bingo regular de un usuario específico
export const getUserBingoAssignments = async (userId: string, localEmojiConfig: {emoji: string, name: string}[]): Promise<{[cellIndex: number]: number[]}> => {
  try {
    // Obtener participantes en orden
    const participantsByEmoji = await getParticipantsByEmojiOrder(localEmojiConfig);
    
    // Obtener las asignaciones de celda para este usuario
    const { data, error } = await supabase
      .from('cell_assignments')
      .select(`
        cell_id,
        participants (
          id,
          name
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Convertir a formato esperado por el frontend (índices de avatares)
    const assignments: {[cellIndex: number]: number[]} = {};
    
    data?.forEach((assignment: any) => {
      const cellIndex = assignment.cell_id - 1; // Convertir ID (1-9) a índice (0-8)
      
      // Encontrar el índice del emoji correspondiente al participante
      const participantName = assignment.participants?.name;
      const emojiIndex = localEmojiConfig.findIndex(config => config.name === participantName);
      
      if (emojiIndex !== -1) {
        if (!assignments[cellIndex]) {
          assignments[cellIndex] = [];
        }
        assignments[cellIndex].push(emojiIndex);
      }
    });

    return assignments;

  } catch (error) {
    console.error('Error getting user bingo assignments:', error);
    return {};
  }
};

// Función para obtener asignaciones con source específico
export const getUserAssignmentsWithSource = async (
  userId: string, 
  localEmojiConfig: {emoji: string, name: string}[], 
  source: 'bingo' | 'dm' = 'bingo'
): Promise<{[cellIndex: number]: number[] | string[]}> => {
  try {
    if (source === 'dm') {
      return await getUserDMAssignments(userId);
    } else {
      return await getUserBingoAssignments(userId, localEmojiConfig);
    }
  } catch (error) {
    console.error('Error getting user assignments with source:', error);
    return {};
  }
};

// Función para obtener el emoji del usuario (para evitar auto-asignación)
export const getUserEmojiIndex = async (userId: string, localEmojiConfig: {emoji: string, name: string}[]): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from('bingo_users')
      .select('display_name')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Encontrar el índice del emoji correspondiente al nombre del usuario
    const userEmojiIndex = localEmojiConfig.findIndex(config => config.name === data.display_name);
    return userEmojiIndex !== -1 ? userEmojiIndex : null;

  } catch (error) {
    console.error('Error getting user emoji index:', error);
    return null;
  }
}; 