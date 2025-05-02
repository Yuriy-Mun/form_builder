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
      forms: {
        Row: {
          id: string
          title: string
          description: string | null
          created_by: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_by?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_by?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      form_fields: {
        Row: {
          id: string
          form_id: string
          type: string
          label: string
          placeholder: string | null
          help_text: string | null
          options: Json | null
          required: boolean
          conditional_logic: Json | null
          validation_rules: Json | null
          position: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_id: string
          type: string
          label: string
          placeholder?: string | null
          help_text?: string | null
          options?: Json | null
          required?: boolean
          conditional_logic?: Json | null
          validation_rules?: Json | null
          position?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          type?: string
          label?: string
          placeholder?: string | null
          help_text?: string | null
          options?: Json | null
          required?: boolean
          conditional_logic?: Json | null
          validation_rules?: Json | null
          position?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      form_responses: {
        Row: {
          id: string
          form_id: string
          user_id: string | null
          completed_at: string
          data: Json
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_id: string
          user_id?: string | null
          completed_at?: string
          data: Json
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          user_id?: string | null
          completed_at?: string
          data?: Json
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      form_progress: {
        Row: {
          id: string
          form_id: string
          user_id: string
          data: Json
          last_field_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_id: string
          user_id: string
          data: Json
          last_field_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          user_id?: string
          data?: Json
          last_field_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          name: string
          code: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          code: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          permission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          permission_id?: string
          created_at?: string
        }
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          permission_id: string | null
          permission_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          permission_id?: string | null
          permission_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          permission_id?: string | null
          permission_code?: string | null
          created_at?: string
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