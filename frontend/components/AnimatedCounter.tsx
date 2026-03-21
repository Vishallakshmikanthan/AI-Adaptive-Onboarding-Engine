"use client";
import { useEffect, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  suffix?: string;
}

export default function AnimatedCounter({ 
  value, 
  duration = 1000, 
  suffix = "" 
}: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const steps = 40;
    const increment = value / steps;
    const stepTime = duration / steps;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{display}{suffix}</span>;
}
