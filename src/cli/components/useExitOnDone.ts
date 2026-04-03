import { useEffect } from 'react';
import { useApp } from 'ink';

export function useExitOnDone(phase: string): void {
  const { exit } = useApp();

  useEffect(() => {
    if (phase === 'done') {
      exit();
    } else if (phase === 'error') {
      exit(new Error());
    }
  }, [phase, exit]);
}
