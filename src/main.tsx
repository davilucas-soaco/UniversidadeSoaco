import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { CatalogProvider } from './context/CatalogContext.tsx'
import { FeedbackProvider } from './context/FeedbackContext.tsx'
import { OnboardingProvider } from './context/OnboardingContext.tsx'
import { ProfileProvider } from './context/ProfileContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <FeedbackProvider>
          <ProfileProvider>
            <CatalogProvider>
              <OnboardingProvider>
                <App />
              </OnboardingProvider>
            </CatalogProvider>
          </ProfileProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
