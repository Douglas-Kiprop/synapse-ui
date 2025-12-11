import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PrivyProvider } from '@privy-io/react-auth'
import { X402Provider } from './components/web3/x402Provider'  // ← Fixed path

createRoot(document.getElementById("root")!).render(
  <PrivyProvider appId={import.meta.env.VITE_PRIVY_APP_ID}>
    <X402Provider>
      <App />
    </X402Provider>
  </PrivyProvider>
);