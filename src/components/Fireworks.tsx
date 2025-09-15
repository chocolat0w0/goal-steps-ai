import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from '@tsparticles/engine';
import type { ISourceOptions } from '@tsparticles/engine';

const options: ISourceOptions = {
  fullScreen: { enable: true, zIndex: 1000 },
  emitters: {
    direction: 'top',
    life: {
      count: 0,
      duration: 0.1,
      delay: 0,
    },
    rate: {
      delay: 0.15,
      quantity: 1,
    },
    size: {
      width: 100,
      height: 0,
    },
    position: {
      x: 50,
      y: 100,
    },
  },
  particles: {
    number: { value: 0 },
    destroy: {
      mode: 'split',
      split: {
        count: 1,
        factor: { value: { min: 2, max: 3 } },
        rate: { value: { min: 4, max: 9 } },
        particles: {
          shape: { type: 'circle' },
          opacity: { value: 1 },
          size: { value: { min: 2, max: 3 }, animation: { enable: false } },
          life: { count: 1, duration: { value: { min: 1, max: 2 } } },
          move: {
            enable: true,
            gravity: { enable: false },
            speed: { min: 10, max: 15 },
            decay: 0.1,
            direction: 'random',
            outModes: 'destroy',
          },
        },
      },
    },
    life: { count: 1, duration: { value: { min: 1, max: 2 } } },
    shape: { type: 'circle' },
    size: {
      value: { min: 2, max: 3 },
      animation: {
        count: 1,
        startValue: 'min',
        enable: true,
        speed: 16,
        sync: true,
      },
    },
    opacity: { value: 1 },
    move: {
      gravity: { enable: true, acceleration: 9.81 },
      speed: { min: 10, max: 20 },
      decay: 0.1,
      direction: 'none',
      outModes: { top: 'none', default: 'destroy' },
      enable: true,
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 60 },
    },
    tilt: {
      direction: 'random',
      enable: true,
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 60 },
    },
    color: {
      value: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
    },
    roll: {
      darken: { enable: true, value: 25 },
      enable: true,
      speed: { min: 15, max: 25 },
    },
    wobble: { distance: 30, enable: true, speed: { min: -15, max: 15 } },
  },
};

export default function Fireworks() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init) {
    return null;
  }

  return <Particles id="fireworks" options={options} />;
}
