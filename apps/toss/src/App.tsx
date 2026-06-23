import { ResumeDetailPage } from './pages/ResumeDetailPage.tsx'
import { ResumeListPage } from './pages/ResumeListPage.tsx'
import { useHashPath } from './router'
import IntroSplashScreen from './components/IntroSplashScreen.tsx'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/resume\/(.+)$/)
  const content = m ? <ResumeDetailPage id={decodeURIComponent(m[1])} /> : <ResumeListPage />

  return (
    <>
      <IntroSplashScreen />
      {content}
    </>
  )
}
