import { useEffect, useRef } from 'react';

/**
 * A hook that adds a 3D tilt effect to an element based on mouse position.
 * Simulates a futuristic holographic card.
 */
export default function use3DTilt(options = {}) {
  const ref = useRef(null);
  const { max = 15, scale = 1.05, speed = 400, glare = false } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Apply base styles for 3D
    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';
    el.style.transition = `transform ${speed}ms cubic-bezier(.03,.98,.52,.99)`;

    let glareEl = null;
    if (glare) {
      glareEl = document.createElement('div');
      glareEl.style.position = 'absolute';
      glareEl.style.top = '0';
      glareEl.style.left = '0';
      glareEl.style.width = '100%';
      glareEl.style.height = '100%';
      glareEl.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), transparent)';
      glareEl.style.pointerEvents = 'none';
      glareEl.style.opacity = '0';
      glareEl.style.transition = 'opacity 400ms ease';
      glareEl.style.borderRadius = 'inherit';
      glareEl.style.zIndex = '10';
      el.appendChild(glareEl);
    }

    const handleMouseMove = (e) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Calculate tilt based on cursor position relative to center
      const x = (clientX / width - 0.5) * 2;
      const y = (clientY / height - 0.5) * 2;

      // Inverse logic: mouse right -> tilt left
      const tiltX = (max * -y).toFixed(2);
      const tiltY = (max * x).toFixed(2);

      el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;

      if (glareEl) {
        glareEl.style.opacity = '1';
        glareEl.style.background = `radial-gradient(circle at ${clientX}px ${clientY}px, rgba(255,255,255,0.3) 0%, transparent 60%)`;
      }
    };

    const handleMouseLeave = () => {
      if (!el) return;
      el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      if (glareEl) {
        glareEl.style.opacity = '0';
      }
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (glareEl && el.contains(glareEl)) {
        el.removeChild(glareEl);
      }
    };
  }, [max, scale, speed, glare]);

  return ref;
}
