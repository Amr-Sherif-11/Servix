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
      profiles: {
        Row: {
          id: string
          role: 'user' | 'professional'
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          cover_url: string | null
          country_code: string | null
          state: string | null
          city: string | null
          language: string | null
          dark_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'user' | 'professional'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          country_code?: string | null
          state?: string | null
          city?: string | null
          language?: string | null
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'user' | 'professional'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          country_code?: string | null
          state?: string | null
          city?: string | null
          language?: string | null
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      professional_details: {
        Row: {
          id: string
          profile_id: string
          profession: string | null
          specialization: string | null
          bio: string | null
          price: number | null
          currency: string | null
          is_available: boolean
          rating: number
          total_reviews: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          profession?: string | null
          specialization?: string | null
          bio?: string | null
          price?: number | null
          currency?: string | null
          is_available?: boolean
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          profession?: string | null
          specialization?: string | null
          bio?: string | null
          price?: number | null
          currency?: string | null
          is_available?: boolean
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          user_id: string
          professional_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'completed'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          professional_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          professional_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          professional_id: string
          last_message: string | null
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          professional_id: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          professional_id?: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          professional_id: string
          request_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          professional_id: string
          request_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          professional_id?: string
          request_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }
      blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          reason: string
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id: string
          reason: string
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_id?: string
          reason?: string
          details?: string | null
          created_at?: string
        }
      }
    }
  }
}
