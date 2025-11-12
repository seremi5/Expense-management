import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold">
            D
          </div>
          <span className="font-bold text-lg hidden sm:inline">Despeses</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">{user?.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Tancar sessió">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
