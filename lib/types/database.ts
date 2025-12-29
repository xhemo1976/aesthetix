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
          whatsapp_number: string | null
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
          whatsapp_number?: string | null
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
          whatsapp_number?: string | null
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
      employees: {
        Row: {
          id: string
          tenant_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          role: string
          specialties: string[]
          hourly_rate: number
          commission_percentage: number
          work_schedule: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          role?: string
          specialties?: string[]
          hourly_rate?: number
          commission_percentage?: number
          work_schedule?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          role?: string
          specialties?: string[]
          hourly_rate?: number
          commission_percentage?: number
          work_schedule?: Json
          is_active?: boolean
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
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
          employee_id: string | null
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
          confirmation_token: string | null
          customer_confirmed_at: string | null
          customer_response: 'confirmed' | 'declined' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          service_id: string
          staff_id?: string | null
          employee_id?: string | null
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
          confirmation_token?: string | null
          customer_confirmed_at?: string | null
          customer_response?: 'confirmed' | 'declined' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          service_id?: string
          staff_id?: string | null
          employee_id?: string | null
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
          confirmation_token?: string | null
          customer_confirmed_at?: string | null
          customer_response?: 'confirmed' | 'declined' | null
          location_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          tenant_id: string
          name: string
          slug: string
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          phone: string | null
          email: string | null
          whatsapp_number: string | null
          is_active: boolean
          is_primary: boolean
          opening_hours: Record<string, { open: string; close: string }> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          slug: string
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          whatsapp_number?: string | null
          is_active?: boolean
          is_primary?: boolean
          opening_hours?: Record<string, { open: string; close: string }> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          slug?: string
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          whatsapp_number?: string | null
          is_active?: boolean
          is_primary?: boolean
          opening_hours?: Record<string, { open: string; close: string }> | null
          created_at?: string
          updated_at?: string
        }
      }
      employee_locations: {
        Row: {
          id: string
          employee_id: string
          location_id: string
          work_schedule: Record<string, { start: string; end: string }> | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          location_id: string
          work_schedule?: Record<string, { start: string; end: string }> | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          location_id?: string
          work_schedule?: Record<string, { start: string; end: string }> | null
          created_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string | null
          service_id: string
          employee_id: string | null
          location_id: string | null
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          preferred_date_from: string
          preferred_date_to: string
          preferred_time_from: string | null
          preferred_time_to: string | null
          status: 'waiting' | 'notified' | 'booked' | 'expired' | 'canceled'
          priority: number
          notified_at: string | null
          notification_count: number
          last_notification_slot: string | null
          notes: string | null
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id?: string | null
          service_id: string
          employee_id?: string | null
          location_id?: string | null
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          preferred_date_from: string
          preferred_date_to: string
          preferred_time_from?: string | null
          preferred_time_to?: string | null
          status?: 'waiting' | 'notified' | 'booked' | 'expired' | 'canceled'
          priority?: number
          notified_at?: string | null
          notification_count?: number
          last_notification_slot?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string | null
          service_id?: string
          employee_id?: string | null
          location_id?: string | null
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          preferred_date_from?: string
          preferred_date_to?: string
          preferred_time_from?: string | null
          preferred_time_to?: string | null
          status?: 'waiting' | 'notified' | 'booked' | 'expired' | 'canceled'
          priority?: number
          notified_at?: string | null
          notification_count?: number
          last_notification_slot?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
      }
      packages: {
        Row: {
          id: string
          tenant_id: string
          location_id: string | null
          name: string
          description: string | null
          image_url: string | null
          package_type: 'bundle' | 'multiuse'
          service_id: string | null
          total_uses: number
          original_price: number
          sale_price: number
          discount_percentage: number | null
          validity_days: number | null
          valid_from: string | null
          valid_until: string | null
          is_active: boolean
          is_featured: boolean
          max_purchases: number | null
          max_per_customer: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          location_id?: string | null
          name: string
          description?: string | null
          image_url?: string | null
          package_type?: 'bundle' | 'multiuse'
          service_id?: string | null
          total_uses?: number
          original_price: number
          sale_price: number
          discount_percentage?: number | null
          validity_days?: number | null
          valid_from?: string | null
          valid_until?: string | null
          is_active?: boolean
          is_featured?: boolean
          max_purchases?: number | null
          max_per_customer?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          location_id?: string | null
          name?: string
          description?: string | null
          image_url?: string | null
          package_type?: 'bundle' | 'multiuse'
          service_id?: string | null
          total_uses?: number
          original_price?: number
          sale_price?: number
          discount_percentage?: number | null
          validity_days?: number | null
          valid_from?: string | null
          valid_until?: string | null
          is_active?: boolean
          is_featured?: boolean
          max_purchases?: number | null
          max_per_customer?: number
          created_at?: string
          updated_at?: string
        }
      }
      package_items: {
        Row: {
          id: string
          package_id: string
          service_id: string
          quantity: number
        }
        Insert: {
          id?: string
          package_id: string
          service_id: string
          quantity?: number
        }
        Update: {
          id?: string
          package_id?: string
          service_id?: string
          quantity?: number
        }
      }
      customer_packages: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          package_id: string
          purchase_price: number
          purchased_at: string
          expires_at: string | null
          total_uses: number
          uses_remaining: number
          status: 'active' | 'expired' | 'fully_used' | 'canceled' | 'refunded'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          package_id: string
          purchase_price: number
          purchased_at?: string
          expires_at?: string | null
          total_uses: number
          uses_remaining: number
          status?: 'active' | 'expired' | 'fully_used' | 'canceled' | 'refunded'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          package_id?: string
          purchase_price?: number
          purchased_at?: string
          expires_at?: string | null
          total_uses?: number
          uses_remaining?: number
          status?: 'active' | 'expired' | 'fully_used' | 'canceled' | 'refunded'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      package_redemptions: {
        Row: {
          id: string
          customer_package_id: string
          appointment_id: string | null
          service_id: string | null
          package_item_id: string | null
          redeemed_at: string
          redeemed_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          customer_package_id: string
          appointment_id?: string | null
          service_id?: string | null
          package_item_id?: string | null
          redeemed_at?: string
          redeemed_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          customer_package_id?: string
          appointment_id?: string | null
          service_id?: string | null
          package_item_id?: string | null
          redeemed_at?: string
          redeemed_by?: string | null
          notes?: string | null
        }
      }
    }
  }
}
