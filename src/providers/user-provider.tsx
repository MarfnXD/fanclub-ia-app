'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { UserLevel, UserState } from '@/lib/types';
import { getUserId, getUserLevel, setUserLevel } from '@/lib/storage';

const UserContext = createContext<UserState>({ id: 'anonymous', level: 'massa' });

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserState>({ id: 'anonymous', level: 'massa' });

  useEffect(() => {
    const levelParam = searchParams.get('level') as UserLevel | null;
    if (levelParam && ['massa', 'power', 'admin'].includes(levelParam)) {
      setUserLevel(levelParam);
    }
    setUser({ id: getUserId(), level: getUserLevel() });
  }, [searchParams]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
