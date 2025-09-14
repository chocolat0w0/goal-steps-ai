/* eslint-disable react-refresh/only-export-components */
import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
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

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
