"use client"

import { AlertTriangle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertBannerProps {
  type: "warning" | "danger"
  message: string
}

export function AlertBanner({ type, message }: AlertBannerProps) {
  const isWarning = type === "warning"
  const isDanger = type === "danger"

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border-l-4 animate-in slide-in-from-top-2",
        isWarning && "bg-yellow-50 border-yellow-500 dark:bg-yellow-950/20 dark:border-yellow-500",
        isDanger && "bg-red-50 border-red-500 dark:bg-red-950/20 dark:border-red-500",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-full animate-pulse",
          isWarning && "bg-yellow-100 dark:bg-yellow-900",
          isDanger && "bg-red-100 dark:bg-red-900",
        )}
      >
        {isDanger ? (
          <Zap className={cn("w-5 h-5", "text-red-600 dark:text-red-400")} />
        ) : (
          <AlertTriangle className={cn("w-5 h-5", "text-yellow-600 dark:text-yellow-400")} />
        )}
      </div>
      <div className="flex-1">
        <p
          className={cn(
            "font-medium text-sm",
            isWarning && "text-yellow-900 dark:text-yellow-100",
            isDanger && "text-red-900 dark:text-red-100",
          )}
        >
          {message}
        </p>
      </div>
    </div>
  )
}
