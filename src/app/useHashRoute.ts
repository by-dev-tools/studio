import { useEffect, useState } from 'react'

/**
 * Hash routing, deliberately. A static bundle on any host — file://, `npx
 * serve`, Vercel — resolves deep links with no rewrite rules to configure.
 */
export function useHashRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/')
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash.slice(1) || '/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
