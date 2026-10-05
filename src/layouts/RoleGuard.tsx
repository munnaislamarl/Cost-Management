import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import type { Permission } from '@/utils/permissions'

interface RoleGuardProps {
  permission: Permission
  children: ReactNode
}

export function RoleGuard({ permission, children }: RoleGuardProps) {
  const { can } = useAuth()

  if (!can(permission)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Access restricted</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your role does not have permission to view this page. Contact an
              administrator if you believe this is a mistake.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
