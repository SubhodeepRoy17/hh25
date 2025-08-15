// lib\types\auth.d.ts
interface User {
  userId: string
  role: 'donor' | 'receiver'
  email?: string
  orgName?: string
  fullName?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
}