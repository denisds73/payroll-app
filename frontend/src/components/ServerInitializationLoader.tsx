import { useEffect, useState } from 'react';
import api from '../services/api';

const loadingMessages = [
  'Loading worker information...',
  'Loading advance information...',
  'Loading salary information...',
  'Loading backups...',
  'Starting application...',
];

export function ServerInitializationLoader({ children }: { children: React.ReactNode }) {
  const [isServerReady, setIsServerReady] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('Initializing application...');
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let pollTimeout: number;
    let messageInterval: number;
    let fadeTimeout: number;

    const initialMessageTimeout = window.setTimeout(() => {
      if (mounted) {
        let index = 0;
        
        const changeMessage = () => {
          setIsFading(true);
          fadeTimeout = window.setTimeout(() => {
            if (mounted) {
              setCurrentMessage(loadingMessages[index]);
              setIsFading(false);
            }
          }, 300); // Wait for fade out to complete before changing text
        };

        changeMessage();
        
        messageInterval = window.setInterval(() => {
          if (mounted) {
            index = (index + 1) % loadingMessages.length;
            changeMessage();
          }
        }, 2000);
      }
    }, 5000);

    const checkServer = async () => {
      try {
        await api.get('/', { timeout: 2000 });
        if (mounted) {
          setIsServerReady(true);
        }
      } catch (error) {
        if (mounted) {
          pollTimeout = window.setTimeout(checkServer, 1000);
        }
      }
    };

    checkServer();

    return () => {
      mounted = false;
      window.clearTimeout(pollTimeout);
      window.clearTimeout(initialMessageTimeout);
      window.clearInterval(messageInterval);
      window.clearTimeout(fadeTimeout);
    };
  }, []);

  if (isServerReady) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-background flex flex-col items-center justify-center">
      <div className="flex flex-col items-center max-w-md text-center px-6">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-5"></div>
        <h2 
          className={`text-xl font-bold text-text-primary mb-2 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}
        >
          {currentMessage}
        </h2>
      </div>
    </div>
  );
}
