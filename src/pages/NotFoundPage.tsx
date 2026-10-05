import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <p className="text-5xl font-semibold tracking-tight text-primary">404</p>
          <div className="space-y-1">
            <p className="text-lg font-medium">Page not found</p>
            <p className="text-sm text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
          <Button asChild>
            <Link to="/app/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
