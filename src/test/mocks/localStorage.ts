export const createMockLocalStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
};

export const setupMockLocalStorage = () => {
  const mockStorage = createMockLocalStorage();
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  return mockStorage;
};

export const getStorageKey = (
  type: 'projects' | 'categories' | 'weekly-settings' | 'task-blocks'
): string => {
  const keys = {
    projects: 'goal-steps-projects',
    categories: 'goal-steps-categories',
    'weekly-settings': 'goal-steps-weekly-settings',
    'task-blocks': 'goal-steps-task-blocks',
  };
  return keys[type];
};
