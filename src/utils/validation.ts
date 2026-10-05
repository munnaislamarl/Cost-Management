export type Validator = (value: unknown) => string | null

export function required(message = 'This field is required'): Validator {
  return (value) => {
    if (value == null) return message
    if (typeof value === 'string' && value.trim() === '') return message
    if (Array.isArray(value) && value.length === 0) return message
    return null
  }
}

export function email(message = 'Enter a valid email address'): Validator {
  return (value) => {
    if (value == null || value === '') return null
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(String(value)) ? null : message
  }
}

export function minLength(length: number, message?: string): Validator {
  return (value) => {
    if (value == null || value === '') return null
    return String(value).trim().length >= length
      ? null
      : message ?? `Must be at least ${length} characters`
  }
}

export function numeric(message = 'Enter a valid number'): Validator {
  return (value) => {
    if (value == null || value === '') return null
    return Number.isFinite(Number(value)) ? null : message
  }
}

export function positiveNumber(message = 'Amount must be greater than zero'): Validator {
  return (value) => {
    if (value == null || value === '') return null
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Enter a valid number'
    return num > 0 ? null : message
  }
}

export function maxLength(length: number, message?: string): Validator {
  return (value) => {
    if (value == null || value === '') return null
    return String(value).length <= length
      ? null
      : message ?? `Must be at most ${length} characters`
  }
}

export type FieldRules<T> = Partial<Record<keyof T, Validator[]>>

export function validateField(value: unknown, rules: Validator[] = []): string | null {
  for (const rule of rules) {
    const error = rule(value)
    if (error) return error
  }
  return null
}

export function validateForm<T extends Record<string, unknown>>(
  values: T,
  rules: FieldRules<T>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {}
  for (const key of Object.keys(rules) as (keyof T)[]) {
    const error = validateField(values[key], rules[key])
    if (error) errors[key] = error
  }
  return errors
}
