import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

import { createRepositories, type Repositories } from '@/repositories/createRepositories';

export function useRepositories(): Repositories {
  const db = useSQLiteContext();
  return useMemo(() => createRepositories(db), [db]);
}
