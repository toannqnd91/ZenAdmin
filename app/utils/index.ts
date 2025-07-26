export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}


export interface JwtPayload {
  avatar?: string,
  [key: string]: any
}

export function decodeJwt<T extends JwtPayload = JwtPayload>(token: string):
  (T & { role?: string | string[] }) | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = process.client
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('binary')
    
      const payload = JSON.parse(decoded) as T & { [key: string]: any }

    const roleClaim =
      payload.role ??
      payload.roles ??
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/roles']

    if (roleClaim) {
      ;(payload as any).role = roleClaim
    }

    return payload as T & { role?: string | string[] }
  } catch {
    return null
  }
}