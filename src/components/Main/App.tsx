import { useState, useEffect } from 'react'
import styles from './App.module.scss';
import WebApp from '@twa-dev/sdk';
import NotInTg from '../NotTg/NotTg';
import InTg from '../InTg/InTg';

declare global {
  interface Window {
    Telegram?: any;
  }
}

function App() {
  const [isTelegram, setIsTelegram] = useState<boolean>(false);

  useEffect(() => {
    const isTgCheck = typeof window !== 'undefined' && window.Telegram?.WebApp?.initData;

    if (isTgCheck) {
      WebApp.ready();
      WebApp.enableClosingConfirmation();
      WebApp.expand();
      WebApp.setHeaderColor('#111111'); 
      
      setIsTelegram(true);

      document.body.style.backgroundColor = '#1a1a1e';
    }
  }, []);
  
  return (
    <div className={styles.appContainer}>
        {isTelegram ? <InTg /> : <NotInTg />}
    </div>
  )
}

export default App
