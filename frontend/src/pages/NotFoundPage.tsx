import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-primary-600">404</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mt-4">Pàgina no trobada</h2>
            <p className="text-gray-600 mt-2">
              Ho sentim, la pàgina que cerques no existeix o ha estat eliminada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tornar enrere
            </Button>
            <Button onClick={() => navigate('/dashboard')} className="gap-2">
              <Home className="h-4 w-4" />
              Anar al tauler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
