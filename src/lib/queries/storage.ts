import { type StorageAdapter } from './types';
import {
  getProjects,
  saveProjects,
  getCategories,
  saveCategories,
  getWeeklySettings,
  saveWeeklySettings,
  getTaskBlocks,
  saveTaskBlocks,
} from '~/lib/storage';

export function createStorageAdapter(): StorageAdapter {
  return {
    getProjects,
    saveProjects,
    getCategories,
    saveCategories,
    getWeeklySettings,
    saveWeeklySettings,
    getTaskBlocks,
    saveTaskBlocks,
  };
}
