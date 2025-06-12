export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      emoji_config: {
        Row: {
          id: string
          emoji: string
          name: string
          image_url: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          emoji: string
          name: string
          image_url?: string | null
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          emoji?: string
          name?: string
          image_url?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          name: string
          initials: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          initials: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          initials?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bingo_cells: {
        Row: {
          id: number
          text: string
          points: number
          category: string
          created_at: string
        }
        Insert: {
          id?: number
          text: string
          points: number
          category: string
          created_at?: string
        }
        Update: {
          id?: number
          text?: string
          points?: number
          category?: string
          created_at?: string
        }
      }
      cell_assignments: {
        Row: {
          id: string
          cell_id: number
          participant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          cell_id: number
          participant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          cell_id?: number
          participant_id?: string
          created_at?: string
        }
      }
      recognitions: {
        Row: {
          id: string
          cell_id: number
          participant_id: string
          recognized_by_id: string
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          cell_id: number
          participant_id: string
          recognized_by_id: string
          points: number
          created_at?: string
        }
        Update: {
          id?: string
          cell_id?: number
          participant_id?: string
          recognized_by_id?: string
          points?: number
          created_at?: string
        }
      }
    }
    Views: {
      participant_rankings: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          total_recognitions: number
          total_points: number
        }
      }
    }
  }
}

export interface BingoUser {
  id: string;
  username: string;
  display_name: string;
  has_voted: boolean;
  avatar_url?: string | null;
  created_at: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: BingoUser;
}

export interface EmojiConfig {
  id: string;
  emoji: string;
  name: string;
  image_url?: string;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatar_emoji: string;
  avatar_image?: string;
  created_at?: string;
}

export interface BingoCell {
  id: string;
  content: string;
  created_at?: string;
}

export interface CellAssignment {
  id: string;
  participant_id: string;
  cell_id: string;
  position: number;
  created_at?: string;
}

export interface Recognition {
  id: string;
  from_participant_id: string;
  to_participant_id: string;
  cell_id: string;
  created_at?: string;
}

export interface ParticipantRanking {
  participant_id: string;
  name: string;
  avatar_emoji: string;
  avatar_image?: string;
  recognitions_count: number;
} 