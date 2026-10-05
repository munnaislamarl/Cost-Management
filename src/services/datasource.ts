import { env } from '@/config/env'
import { mockDataSource } from '@/services/mock/mockDataSource'
import { remoteDataSource } from '@/services/remoteDataSource'
import type { DataSource } from '@/services/types'

/**
 * The active data source. When `VITE_API_URL` is configured the app talks to
 * the Google Apps Script Web App. Otherwise it falls back to an in-memory demo
 * data source so the UI remains fully explorable without a backend.
 */
export const dataSource: DataSource = env.isApiConfigured
  ? remoteDataSource
  : mockDataSource

export const isDemoMode = !env.isApiConfigured
