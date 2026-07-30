import { useState, useEffect } from 'react';

/**
 * A hook that returns the current timestamp, updating at a regular interval.
 * Use this to force components to re-render even if no external data changes.
 * 
 * @param intervalMs - The interval in milliseconds between updates (default: 60000)
 * @returns The current timestamp in milliseconds.
 */
export const useTimeTick = (intervalMs: number = 60000): number => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs]);

    return now;
};
