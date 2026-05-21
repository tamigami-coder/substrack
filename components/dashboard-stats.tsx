import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  sub?: string
  trend?: "up" | "down" | "neutral"
}

export function StatCard({ label, value, icon: Icon, sub, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold truncate">{value}</p>
            {sub && (
              <p
                className={cn(
                  "text-xs mt-1",
                  trend === "up" && "text-red-500",
                  trend === "down" && "text-green-500",
                  trend === "neutral" && "text-muted-foreground",
                  !trend && "text-muted-foreground"
                )}
              >
                {sub}
              </p>
            )}
          </div>
          <div className="bg-primary/10 rounded-lg p-2 shrink-0 ml-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
