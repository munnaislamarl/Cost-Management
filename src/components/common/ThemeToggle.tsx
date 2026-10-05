import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="text-muted-foreground"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} mode
      </TooltipContent>
    </Tooltip>
  )
}
