import { AlertTriangle } from 'lucide-react'
import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('OPEX Hub UI error:', error, info)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Something went wrong on this page</p>
              <p className="mx-auto max-w-lg break-words text-sm text-muted-foreground">
                {this.state.error.message || 'An unexpected error occurred.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={this.handleReset}>
                Try again
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  this.handleReset()
                  window.location.reload()
                }}
              >
                Reload page
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
