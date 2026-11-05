import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { FeedbackProvider } from './context/FeedbackContext.tsx'
import { OnboardingProvider } from './context/OnboardingContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <FeedbackProvider>
          <OnboardingProvider>
            <App />
          </OnboardingProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
