import { useEffect } from 'react'

// Navigate top-level window to AR — avoids iframe camera restrictions on mobile
export default function ARCamera() {
  useEffect(() => {
    window.location.href = '/ar.html'
  }, [])
  return null
}
