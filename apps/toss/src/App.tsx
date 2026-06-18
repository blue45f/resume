import { ResumeDetailPage } from './pages/ResumeDetailPage.tsx'
import { ResumeListPage } from './pages/ResumeListPage.tsx'
import { useHashPath } from './router'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/resume\/(.+)$/)
  if (m) return <ResumeDetailPage id={decodeURIComponent(m[1])} />
  return <ResumeListPage />
}
