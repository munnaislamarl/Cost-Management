const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined
const rawApiKey = import.meta.env.VITE_API_KEY as string | undefined

export const env = {
  apiUrl: (rawApiUrl ?? '').trim(),
  apiKey: (rawApiKey ?? '').trim(),
  appName: 'Cost Management',
  companyName: 'Acme Corporation',
  isApiConfigured: Boolean(rawApiUrl && rawApiUrl.trim().length > 0),
} as const

export type AppEnv = typeof env
