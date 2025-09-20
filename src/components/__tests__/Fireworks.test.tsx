import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Fireworks from '../Fireworks';

vi.mock('@tsparticles/react', () => ({
  initParticlesEngine: (cb: (engine: unknown) => Promise<void> | void) => {
    cb({});
    return Promise.resolve();
  },
  Particles: (props: Record<string, unknown>) => (
    <div data-testid="particles" {...props} />
  ),
}));

vi.mock('@tsparticles/slim', () => ({
  loadSlim: () => Promise.resolve(),
}));

vi.mock('@tsparticles/plugin-emitters', () => ({
  loadEmittersPlugin: () => Promise.resolve(),
}));

describe('Fireworks', () => {
  it('renders particles after initialization', async () => {
    render(<Fireworks />);
    const particles = await screen.findByTestId('particles');
    expect(particles).toBeInTheDocument();
  });
});
