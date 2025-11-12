import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, User, Shield, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()

  const links = [
    { icon: Home, label: 'Tauler', path: '/dashboard' },
    { icon: PlusCircle, label: 'Nova Despesa', path: '/expenses/new' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ]

  if (user?.role === 'admin') {
    links.splice(2, 0,
      { icon: Shield, label: 'Administració', path: '/admin' },
      { icon: Settings, label: 'Configuració', path: '/configuracio' }
    )
  }

  return (
    <aside
      className={cn(
        'w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-65px)] p-4',
        className
      )}
    >
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
