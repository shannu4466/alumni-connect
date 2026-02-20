import { useEffect, useState, useRef } from 'react';

export function useAnimatedNumber(
    targetNumber: number,
    duration: number = 1000
): number {
    const [currentNumber, setCurrentNumber] = useState(0);
    const animationFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<DOMHighResTimeStamp | null>(null);
    const previousNumberRef = useRef(0);

    useEffect(() => {
        setCurrentNumber(previousNumberRef.current);
        startTimeRef.current = null;

        const animate = (currentTime: DOMHighResTimeStamp) => {
            if (!startTimeRef.current) {
                startTimeRef.current = currentTime;
            }

            const elapsed = currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            const animatedValue = previousNumberRef.current + (targetNumber - previousNumberRef.current) * progress;

            setCurrentNumber(Math.floor(animatedValue));

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                setCurrentNumber(targetNumber);
                previousNumberRef.current = targetNumber;
            }
        };

        if (targetNumber !== currentNumber) {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            previousNumberRef.current = targetNumber;
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [targetNumber, duration]);
    return currentNumber;
}
