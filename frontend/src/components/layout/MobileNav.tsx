import { Link, useLocation } from 'react-router-dom'
import { Home, Plus, User, Shield, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const location = useLocation()
  const { user } = useAuth()

  const tabs = [
    { icon: Home, label: 'Inici', path: '/dashboard' },
    { icon: Plus, label: 'Nova', path: '/expenses/new' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ]

  if (user?.role === 'admin') {
    tabs.splice(2, 0,
      { icon: Shield, label: 'Admin', path: '/admin' },
      { icon: Settings, label: 'Config', path: '/configuracio' }
    )
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50',
        className
      )}
    >
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center py-2 px-3 flex-1 min-w-0 transition-colors',
                isActive ? 'text-primary-600' : 'text-gray-500'
              )}
            >
              <tab.icon className="h-6 w-6 flex-shrink-0" />
              <span className="text-xs mt-1 truncate">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
