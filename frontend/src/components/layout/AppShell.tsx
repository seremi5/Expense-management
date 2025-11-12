import { useAuth } from '@/hooks/useAuth'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar className="hidden md:flex" />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileNav className="md:hidden" />
    </div>
  )
}
