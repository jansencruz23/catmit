import { useState, useEffect } from 'react';
import { getStatusMessage } from '../../core/ui-messages';

export function useRotatingMessage(active: boolean, intervalMs = 2000): string {
  const [message, setMessage] = useState(getStatusMessage());

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setMessage(getStatusMessage());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [active, intervalMs]);

  return message;
}
