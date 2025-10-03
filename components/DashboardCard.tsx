import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DashboardCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
}

export function DashboardCard({ 
  title, 
  description, 
  children, 
  className,
  badge 
}: DashboardCardProps) {
  return (
    <Card className={cn(
      "h-fit backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden transform hover:-translate-y-1 relative",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/30 before:to-transparent before:rounded-3xl before:pointer-events-none before:z-0",
      className
    )}>
      <CardHeader className={cn(
        "bg-gradient-to-r from-gray-50/90 to-gray-100/90 border-b border-white/40 backdrop-blur-sm rounded-t-3xl relative z-10",
        className?.includes("from-blue-600") && "from-blue-600/90 to-indigo-800/90 text-white",
        className?.includes("from-green-600") && "from-green-600/90 to-teal-700/90 text-white"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={cn(
              "text-xl font-bold text-gray-800",
              className?.includes("from-blue-600") && "text-white",
              className?.includes("from-green-600") && "text-white"
            )}>{title}</CardTitle>
            {description && (
              <CardDescription className={cn(
                "mt-1 text-gray-600",
                className?.includes("from-blue-600") && "text-white/80",
                className?.includes("from-green-600") && "text-white/80"
              )}>{description}</CardDescription>
            )}
          </div>
          {badge && (
            <Badge 
              variant={badge.variant || "default"} 
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full shadow-sm transform hover:scale-105 transition-transform duration-300",
                badge.text.includes("RECORD") && "bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-1.5 shadow-lg",
                badge.text.includes("WRITE") && "bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-1.5 shadow-lg",
                badge.text.includes("LIVE") && "bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-1.5 shadow-lg",
                badge.text.includes("REAL-TIME") && "bg-purple-500 hover:bg-purple-600 text-white font-bold px-4 py-1.5 shadow-lg",
                badge.text.includes("ANALYTICS") && "bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-1.5 shadow-lg",
                badge.text.includes("SECURE") && "bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-1.5 shadow-lg",
                badge.text.includes("ADMIN") && "bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-1.5 shadow-lg"
              )}
            >
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        {children}
      </CardContent>
    </Card>
  )
}