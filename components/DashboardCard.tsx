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
    <Card className={cn("h-fit", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {badge && (
            <Badge variant={badge.variant || "default"}>
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}