import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './components/AppRouter'
import { THEME, TonConnectUIProvider } from '@tonconnect/ui-react'
import telegramAnalytics from '@telegram-apps/analytics';

telegramAnalytics.init({
    token: 'eyJhcHBfbmFtZSI6Ik1BU1NfTUlOVCIsImFwcF91cmwiOiJodHRwczovL3QubWUvTWFzc01pbnRCb3QiLCJhcHBfZG9tYWluIjoiaHR0cHM6Ly9tYXNzLW1pbnQubmV0bGlmeS5hcHAvIn0=!K+M4Ug5Y1d1TM6VR1uQsyz+Blq80WheFdpMMPXpaK9Q=', 
    appName: 'MASS_MINT', 
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider 
      manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json"
      uiPreferences={{
        colorsSet: {
          [THEME.DARK]: {
            connectButton: {
              background: '#141414',
            },
            accent: '#4a4a4a',
            telegramButton: '#1a1a1a',
            background: {
              primary: '#0d0d0d',
              secondary: '#1a1a1a',
              tint: '#2b2b2b'
            }
          },
          [THEME.LIGHT]: { 
            connectButton: {
              background: '#141414',
            },
            accent: '#4a4a4a',
            telegramButton: '#1a1a1a',
            background: {
              primary: '#0d0d0d',
              secondary: '#1a1a1a',
              tint: '#2b2b2b'
            }
          }
        },
      }}
    >
      <AppRouter />
    </TonConnectUIProvider>
  </StrictMode>,
)