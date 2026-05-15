'use client'
import { useEffect } from 'react'

export function RevealObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    // A short timeout to ensure DOM is ready
    setTimeout(() => {
      document.querySelectorAll('.reveal, .mask-reveal').forEach(el => observer.observe(el));
    }, 100);

    return () => observer.disconnect();
  }, []);
  
  return null;
}
