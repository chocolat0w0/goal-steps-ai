import { useEffect, useMemo, useState } from 'react';
import { initParticlesEngine, Particles } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { loadEmittersPlugin } from '@tsparticles/plugin-emitters';
import type { ISourceOptions } from '@tsparticles/engine';

function Fireworks() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      await loadEmittersPlugin(engine);
    }).then(() => setInit(true));
  }, []);

  const options = useMemo<ISourceOptions>(() => ({
    fullScreen: { enable: false },
    background: { color: 'transparent' },
    particles: {
      number: { value: 0 },
      color: { value: ['#ff0000', '#ffff00', '#ffffff', '#00ff00', '#0000ff'] },
      shape: { type: ['circle', 'square'] },
      opacity: {
        value: { min: 0, max: 1 },
        animation: {
          enable: true,
          speed: 0.5,
          startValue: 'max',
          destroy: 'min',
        },
      },
      size: {
        value: { min: 1, max: 3 },
        animation: {
          enable: true,
          speed: 5,
          startValue: 'min',
          destroy: 'max',
        },
      },
      life: {
        duration: { sync: true, value: 3 },
        count: 1,
      },
      move: {
        enable: true,
        gravity: { enable: true, acceleration: 9.81 },
        speed: { min: 10, max: 20 },
        decay: 0.1,
        direction: 'none',
        outModes: {
          default: 'destroy',
          bottom: 'none',
        },
      },
    },
    emitters: {
      life: { count: 1, duration: 0.1, delay: 0.3 },
      rate: { delay: 0.1, quantity: 100 },
      position: { x: 50, y: 50 },
      size: { width: 0, height: 0 },
    },
  }), []);

  if (!init) return null;

  return (
    <Particles
      id="tsparticles-fireworks"
      className="absolute inset-0 pointer-events-none"
      options={options}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default Fireworks;
