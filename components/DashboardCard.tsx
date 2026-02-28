import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DashboardCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  accent?: string
  badge?: {
    text: string
    color?: string
  }
}

export function DashboardCard({ 
  title, 
  description, 
  children, 
  className,
  accent,
  badge 
}: DashboardCardProps) {
  const isHero = className?.includes("hero-card")

  return (
    <Card className={cn(
      "h-fit bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden relative",
      className
    )}>
      {accent && (
        <div className={cn("absolute top-0 left-0 right-0 h-1 rounded-t-2xl", accent)} />
      )}
      <CardHeader className={cn(
        "pb-3 relative z-10",
        isHero && "text-white"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={cn(
              "text-base font-semibold text-gray-900",
              isHero && "text-white"
            )}>{title}</CardTitle>
            {description && (
              <CardDescription className={cn(
                "mt-0.5 text-sm text-gray-500",
                isHero && "text-white/70"
              )}>{description}</CardDescription>
            )}
          </div>
          {badge && (
            <span className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase",
              badge.color || "bg-gray-100 text-gray-600"
            )}>
              {badge.text}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 relative z-10">
        {children}
      </CardContent>
    </Card>
  )
}