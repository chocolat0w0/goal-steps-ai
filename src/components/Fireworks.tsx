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
    fullScreen: { enable: true, zIndex: 1000 },
    background: { color: 'transparent' },
    particles: {
      number: { value: 0 },
      color: {
        value: [
          '#ffffff',
          '#ff8a80',
          '#ff80ab',
          '#ffd180',
          '#ffff8d',
          '#cfff95',
          '#80d8ff',
          '#a7ffeb',
        ],
      },
      shape: { type: ['circle', 'square'] },
      opacity: {
        value: { min: 0.4, max: 1 },
        animation: {
          enable: true,
          speed: 0.4,
          startValue: 'max',
          destroy: 'min',
        },
      },
      size: {
        value: { min: 2, max: 8 },
        animation: {
          enable: true,
          speed: 6,
          startValue: 'min',
          destroy: 'max',
        },
      },
      life: {
        duration: { sync: true, value: 4 },
        count: 1,
      },
      move: {
        enable: true,
        gravity: { enable: true, acceleration: 9.81 },
        speed: { min: 25, max: 45 },
        decay: 0.05,
        direction: 'none',
        outModes: {
          default: 'destroy',
          bottom: 'none',
        },
      },
      rotate: {
        value: { min: 0, max: 360 },
        direction: 'random',
        animation: { enable: true, speed: 20 },
      },
      tilt: {
        direction: 'random',
        enable: true,
        value: { min: 0, max: 360 },
        animation: { enable: true, speed: 20 },
      },
      roll: {
        enable: true,
        speed: { min: 5, max: 15 },
        darken: { enable: true, value: 30 },
      },
      wobble: {
        enable: true,
        distance: 30,
        speed: { min: -15, max: 15 },
      },
    },
    emitters: {
      direction: 'none',
      life: { count: 0, duration: 0.1, delay: 0.4 },
      rate: { delay: 0.25, quantity: 4 },
      position: { x: 50, y: 60 },
      size: { width: 100, height: 0 },
    },
  }), []);

  if (!init) return null;

  return (
    <Particles
      id="tsparticles-fireworks"
      className="pointer-events-none"
      options={options}
      style={{ pointerEvents: 'none' }}
    />
  );
}

export default Fireworks;
