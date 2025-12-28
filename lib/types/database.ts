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
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          business_type: 'beauty_clinic' | 'hairdresser' | 'gastronomy' | 'late_shop'
          logo_url: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          subscription_plan: 'starter' | 'professional' | 'enterprise'
          subscription_status: 'trial' | 'active' | 'canceled' | 'expired'
          trial_ends_at: string | null
          timezone: string
          locale: string
          currency: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          business_type: 'beauty_clinic' | 'hairdresser' | 'gastronomy' | 'late_shop'
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          subscription_plan?: 'starter' | 'professional' | 'enterprise'
          subscription_status?: 'trial' | 'active' | 'canceled' | 'expired'
          trial_ends_at?: string | null
          timezone?: string
          locale?: string
          currency?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          business_type?: 'beauty_clinic' | 'hairdresser' | 'gastronomy' | 'late_shop'
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          subscription_plan?: 'starter' | 'professional' | 'enterprise'
          subscription_status?: 'trial' | 'active' | 'canceled' | 'expired'
          trial_ends_at?: string | null
          timezone?: string
          locale?: string
          currency?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          role: 'owner' | 'admin' | 'staff' | 'receptionist'
          is_active: boolean
          job_title: string | null
          bio: string | null
          specialties: string[] | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          email: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          role?: 'owner' | 'admin' | 'staff' | 'receptionist'
          is_active?: boolean
          job_title?: string | null
          bio?: string | null
          specialties?: string[] | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          role?: 'owner' | 'admin' | 'staff' | 'receptionist'
          is_active?: boolean
          job_title?: string | null
          bio?: string | null
          specialties?: string[] | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          email: string | null
          phone: string | null
          first_name: string
          last_name: string
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          notes: string | null
          medical_notes: string | null
          marketing_consent: boolean
          sms_consent: boolean
          total_appointments: number
          total_spent: number
          last_visit_at: string | null
          custom_fields: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email?: string | null
          phone?: string | null
          first_name: string
          last_name: string
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          notes?: string | null
          medical_notes?: string | null
          marketing_consent?: boolean
          sms_consent?: boolean
          total_appointments?: number
          total_spent?: number
          last_visit_at?: string | null
          custom_fields?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string | null
          phone?: string | null
          first_name?: string
          last_name?: string
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          notes?: string | null
          medical_notes?: string | null
          marketing_consent?: boolean
          sms_consent?: boolean
          total_appointments?: number
          total_spent?: number
          last_visit_at?: string | null
          custom_fields?: Json
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          category: string | null
          price: number
          duration_minutes: number
          is_active: boolean
          requires_deposit: boolean
          deposit_amount: number | null
          image_url: string | null
          staff_ids: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          category?: string | null
          price: number
          duration_minutes: number
          is_active?: boolean
          requires_deposit?: boolean
          deposit_amount?: number | null
          image_url?: string | null
          staff_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          category?: string | null
          price?: number
          duration_minutes?: number
          is_active?: boolean
          requires_deposit?: boolean
          deposit_amount?: number | null
          image_url?: string | null
          staff_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          service_id: string
          staff_id: string | null
          start_time: string
          end_time: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no_show'
          price: number
          deposit_paid: number
          total_paid: number
          customer_notes: string | null
          staff_notes: string | null
          cancellation_reason: string | null
          reminder_sent_at: string | null
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          service_id: string
          staff_id?: string | null
          start_time: string
          end_time: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no_show'
          price: number
          deposit_paid?: number
          total_paid?: number
          customer_notes?: string | null
          staff_notes?: string | null
          cancellation_reason?: string | null
          reminder_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          service_id?: string
          staff_id?: string | null
          start_time?: string
          end_time?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no_show'
          price?: number
          deposit_paid?: number
          total_paid?: number
          customer_notes?: string | null
          staff_notes?: string | null
          cancellation_reason?: string | null
          reminder_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
