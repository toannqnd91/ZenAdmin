export const useBootstrap = () => {
  const ready = useState<boolean>('bootstrapReady', () => false)
  const settings = useState<any>('settings', () => null)
  const permissions = useState<any>('permissions', () => null)
  return { ready, settings, permissions }
}

