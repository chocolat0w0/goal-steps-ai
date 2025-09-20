/* eslint-disable react-refresh/only-export-components */
import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, afterAll, vi } from 'vitest';

// グローバルなモック設定
beforeAll(() => {
  // window.alert をモック
  Object.defineProperty(window, 'alert', {
    writable: true,
    value: vi.fn(),
  });

  // window.confirm をモック
  Object.defineProperty(window, 'confirm', {
    writable: true,
    value: vi.fn(() => true),
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

interface AllTheProvidersProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

const AllTheProviders = ({ children, initialEntries = ['/'] }: AllTheProvidersProps) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialEntries, ...renderOptions } = options || {};
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders initialEntries={initialEntries}>
      {children}
    </AllTheProviders>
  );
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react';
export { customRender as render };
