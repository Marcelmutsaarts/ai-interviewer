export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          name: string
          created_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          last_login_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          admin_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'admins'
            referencedColumns: ['id']
          }
        ]
      }
      project_config: {
        Row: {
          id: string
          project_id: string
          system_prompt: string
          interview_goal: string | null
          target_audience: string | null
          tone_of_voice: 'friendly' | 'formal' | 'informal' | 'neutral' | 'empathetic' | null
          max_questions: number | null
          language: string | null
          welcome_message: string | null
          closing_message: string | null
          topics: string[] | null
          additional_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          system_prompt?: string
          interview_goal?: string | null
          target_audience?: string | null
          tone_of_voice?: 'friendly' | 'formal' | 'informal' | 'neutral' | 'empathetic' | null
          max_questions?: number | null
          language?: string | null
          welcome_message?: string | null
          closing_message?: string | null
          topics?: string[] | null
          additional_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          system_prompt?: string
          interview_goal?: string | null
          target_audience?: string | null
          tone_of_voice?: 'friendly' | 'formal' | 'informal' | 'neutral' | 'empathetic' | null
          max_questions?: number | null
          language?: string | null
          welcome_message?: string | null
          closing_message?: string | null
          topics?: string[] | null
          additional_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_config_project_id_fkey'
            columns: ['project_id']
            isOneToOne: true
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      interview_sessions: {
        Row: {
          id: string
          project_id: string
          status: 'active' | 'completed' | 'abandoned' | null
          started_at: string
          ended_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          project_id: string
          status?: 'active' | 'completed' | 'abandoned' | null
          started_at?: string
          ended_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          project_id?: string
          status?: 'active' | 'completed' | 'abandoned' | null
          started_at?: string
          ended_at?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'interview_sessions_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      transcripts: {
        Row: {
          id: string
          session_id: string
          role: 'ai' | 'user'
          content: string
          sequence_number: number | null
          timestamp: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'ai' | 'user'
          content: string
          sequence_number?: number | null
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'ai' | 'user'
          content?: string
          sequence_number?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transcripts_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'interview_sessions'
            referencedColumns: ['id']
          }
        ]
      }
      config_chat_history: {
        Row: {
          id: string
          project_id: string
          role: 'admin' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          role: 'admin' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          role?: 'admin' | 'assistant'
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'config_chat_history_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      interview_templates: {
        Row: {
          id: string
          admin_id: string
          name: string
          description: string | null
          config_snapshot: Json
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          name: string
          description?: string | null
          config_snapshot: Json
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          name?: string
          description?: string | null
          config_snapshot?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'interview_templates_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'admins'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_transcript_sequence: {
        Args: {
          p_session_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Admin = Database['public']['Tables']['admins']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectConfig = Database['public']['Tables']['project_config']['Row']
export type InterviewSession = Database['public']['Tables']['interview_sessions']['Row']
export type Transcript = Database['public']['Tables']['transcripts']['Row']
export type ConfigChatHistory = Database['public']['Tables']['config_chat_history']['Row']
export type InterviewTemplate = Database['public']['Tables']['interview_templates']['Row']

// Backward compatibility aliases - Session and TranscriptMessage
export type Session = InterviewSession
export type TranscriptMessage = Transcript

/**
 * Configuration type extends ProjectConfig with UI-specific computed fields.
 * Used for the configuration management UI which needs additional computed fields
 * beyond what is stored in the database.
 */
export interface Configuration extends ProjectConfig {
  /** Alias for interview_goal - for backward compatibility */
  goal?: string | null
  /** UI state: whether the configuration is complete (computed server-side) */
  is_complete?: boolean
  /** Configuration method used */
  config_method?: 'ai_chat' | 'direct_input' | null
}

export type ToneOfVoice = NonNullable<ProjectConfig['tone_of_voice']>
export type SessionStatus = NonNullable<InterviewSession['status']>
export type ConfigChatRole = ConfigChatHistory['role']

/**
 * UI-specific transcript message type used in the interview store.
 * Extends the base transcript message with UI state properties.
 * Note: Uses 'participant' role in UI (mapped from 'user' in database)
 */
export interface UITranscriptMessage {
  id: string
  role: 'ai' | 'user' | 'participant'
  content: string
  timestamp: Date
  /** Indicates whether the message is complete or still being streamed */
  isComplete: boolean
  /** Sequence number for ordering messages (client-side) */
  sequenceNumber?: number
}
