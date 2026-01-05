'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

export type Employee = {
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
  work_schedule: Record<string, { start: string; end: string }>
  is_active: boolean
  profile_image_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export async function getEmployees() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { employees: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { employees: null, error: 'No tenant found' }
  }

  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('first_name', { ascending: true })

  if (error) {
    console.error('Error fetching employees:', error)
    return { employees: null, error: error.message }
  }

  return { employees, error: null }
}

export async function getActiveEmployees() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { employees: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { employees: null, error: 'No tenant found' }
  }

  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)
    .order('first_name', { ascending: true })

  if (error) {
    console.error('Error fetching active employees:', error)
    return { employees: null, error: error.message }
  }

  return { employees, error: null }
}

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { error: 'No tenant found' }
  }

  const specialtiesStr = formData.get('specialties') as string
  const specialties = specialtiesStr ? specialtiesStr.split(',').filter(s => s.trim()) : []

  const workScheduleStr = formData.get('work_schedule') as string
  const work_schedule = workScheduleStr ? JSON.parse(workScheduleStr) : {}

  const { error } = await supabase.from('employees').insert({
    tenant_id: profile.tenant_id,
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    role: (formData.get('role') as string) || 'stylist',
    specialties,
    hourly_rate: parseFloat((formData.get('hourly_rate') as string) || '0'),
    commission_percentage: parseFloat((formData.get('commission_percentage') as string) || '0'),
    work_schedule,
    is_active: formData.get('is_active') === 'true',
    profile_image_url: (formData.get('profile_image_url') as string) || null,
    bio: (formData.get('bio') as string) || null,
  })

  if (error) {
    console.error('Error creating employee:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/employees')
  return { error: null }
}

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const specialtiesStr = formData.get('specialties') as string
  const specialties = specialtiesStr ? specialtiesStr.split(',').filter(s => s.trim()) : []

  const workScheduleStr = formData.get('work_schedule') as string
  const work_schedule = workScheduleStr ? JSON.parse(workScheduleStr) : {}

  const { error } = await supabase
    .from('employees')
    .update({
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      role: (formData.get('role') as string) || 'stylist',
      specialties,
      hourly_rate: parseFloat((formData.get('hourly_rate') as string) || '0'),
      commission_percentage: parseFloat((formData.get('commission_percentage') as string) || '0'),
      work_schedule,
      is_active: formData.get('is_active') === 'true',
      profile_image_url: (formData.get('profile_image_url') as string) || null,
      bio: (formData.get('bio') as string) || null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating employee:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/employees')
  return { error: null }
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('employees').delete().eq('id', id)

  if (error) {
    console.error('Error deleting employee:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/employees')
  return { error: null }
}

export async function getEmployeeStats(employeeId: string, startDate?: Date, endDate?: Date) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { stats: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { stats: null, error: 'No tenant found' }
  }

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('employee_id', employeeId)

  if (startDate) {
    query = query.gte('start_time', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('start_time', endDate.toISOString())
  }

  const { data: appointments, error } = await query

  if (error) {
    console.error('Error fetching employee stats:', error)
    return { stats: null, error: error.message }
  }

  const stats = {
    total_appointments: appointments?.length || 0,
    completed_appointments: appointments?.filter(a => a.status === 'completed').length || 0,
    cancelled_appointments: appointments?.filter(a => a.status === 'cancelled').length || 0,
    no_shows: appointments?.filter(a => a.status === 'no_show').length || 0,
    total_revenue: appointments
      ?.filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.price || 0), 0) || 0,
  }

  return { stats, error: null }
}

export async function uploadEmployeeImage(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { url: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { url: null, error: 'No tenant found' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { url: null, error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { url: null, error: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.' }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: 'File too large. Maximum size is 5MB.' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${profile.tenant_id}/${uuidv4()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('employee-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading image:', uploadError)
    return { url: null, error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('employee-images')
    .getPublicUrl(fileName)

  return { url: publicUrl, error: null }
}

export async function deleteEmployeeImage(imageUrl: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Extract file path from URL
  const urlParts = imageUrl.split('/employee-images/')
  if (urlParts.length < 2) {
    return { error: 'Invalid image URL' }
  }

  const filePath = urlParts[1]

  const { error } = await supabase.storage
    .from('employee-images')
    .remove([filePath])

  if (error) {
    console.error('Error deleting image:', error)
    return { error: error.message }
  }

  return { error: null }
}
