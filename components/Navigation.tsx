import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Mic, 
  Home,
  Settings,
  User,
  Stethoscope
} from 'lucide-react'

export function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ClinicalScribe</span>
            </Link>
            
            <div className="flex items-center space-x-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              
              <Link href="/transcription">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Mic className="h-4 w-4" />
                  <span>Transcription</span>
                </Button>
              </Link>
              
              <Link href="/soap">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Stethoscope className="h-4 w-4" />
                  <span>SOAP Generator</span>
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}