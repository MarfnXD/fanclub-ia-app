'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { UserLevel, UserState } from '@/lib/types';
import { getUserId, getUserLevel, setUserLevel as persistLevel } from '@/lib/storage';

interface UserContextValue extends UserState {
  setLevel: (level: UserLevel) => void;
}

const UserContext = createContext<UserContextValue>({
  id: 'anonymous',
  level: 'massa',
  setLevel: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserState>({ id: 'anonymous', level: 'massa' });

  useEffect(() => {
    const levelParam = searchParams.get('level') as UserLevel | null;
    if (levelParam && ['massa', 'power', 'admin'].includes(levelParam)) {
      persistLevel(levelParam);
    }
    setUser({ id: getUserId(), level: getUserLevel() });
  }, [searchParams]);

  const setLevel = useCallback((level: UserLevel) => {
    persistLevel(level);
    setUser((prev) => ({ ...prev, level }));
  }, []);

  return (
    <UserContext.Provider value={{ ...user, setLevel }}>
      {children}
    </UserContext.Provider>
  );
}
