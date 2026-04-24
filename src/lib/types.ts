export type UserRole = 'principal' | 'admin' | 'teacher' | 'parent' | 'student'

export interface UserProfile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  email: string
  mobile_number: string | null
  is_active: boolean
  created_at: string
}

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  principal: '/principal',
  admin: '/admin',
  teacher: '/teacher',
  parent: '/parent',
  student: '/student',
}
