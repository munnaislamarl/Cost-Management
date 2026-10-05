import { useTheme } from '@/hooks/useTheme'
import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Sonner
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border shadow-elevated',
        },
      }}
    />
  )
}
