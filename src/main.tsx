import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { AppProviders } from './app/providers'
import { router } from './app/router'
import { AuthBootstrap } from './shared/auth/AuthBootstrap'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
    </AppProviders>
  </StrictMode>,
)
