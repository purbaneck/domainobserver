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
      domains: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          domain: string
          user_id: string
          last_checked: string | null
          status: 'available' | 'taken' | 'pending' | 'unknown'
          notes: string | null
          notify_if_available: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          domain: string
          user_id: string
          last_checked?: string | null
          status?: 'available' | 'taken' | 'pending' | 'unknown'
          notes?: string | null
          notify_if_available?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          domain?: string
          user_id?: string
          last_checked?: string | null
          status?: 'available' | 'taken' | 'pending' | 'unknown'
          notes?: string | null
          notify_if_available?: boolean
        }
      }
      domain_checks: {
        Row: {
          id: number
          created_at: string
          domain_id: number
          status: 'available' | 'taken' | 'pending' | 'unknown'
          check_date: string
          details: Json | null
        }
        Insert: {
          id?: number
          created_at?: string
          domain_id: number
          status: 'available' | 'taken' | 'pending' | 'unknown'
          check_date?: string
          details?: Json | null
        }
        Update: {
          id?: number
          created_at?: string
          domain_id?: number
          status?: 'available' | 'taken' | 'pending' | 'unknown'
          check_date?: string
          details?: Json | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          notifications_enabled: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          notifications_enabled?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          notifications_enabled?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
