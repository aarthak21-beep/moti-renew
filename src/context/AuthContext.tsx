import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginDemo: (name?: string, email?: string) => void;
  loginWithEmail: (userId: string, password?: string) => Promise<boolean>;
  signupWithEmail: (name: string, userId: string, company?: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAppwriteConnected: boolean;
}

const LOCAL_PROFILE_KEY = 'moti_renew_user';
const DEFAULT_USER_ID = 'usr_moti_demo_01';

const createDefaultProfile = (): UserProfile => ({
  uid: DEFAULT_USER_ID,
  email: '',
  displayName: 'Moti User',
  companyName: 'My Business',
  defaultCurrency: 'INR',
  language: 'en',
  theme: 'light',
  createdAt: new Date().toISOString(),
});

const readLocalProfile = (): UserProfile => {
  try {
    const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!saved) return createDefaultProfile();
    const profile = JSON.parse(saved) as UserProfile;
    if (!profile || typeof profile.uid !== 'string') return createDefaultProfile();
    if (!['en', 'hi', 'mr'].includes(profile.language)) profile.language = 'en';
    if (!['light', 'dark'].includes(profile.theme)) profile.theme = 'light';
    return profile;
  } catch {
    return createDefaultProfile();
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => readLocalProfile());

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setUser(current => current ? { ...current, ...updates } : { ...createDefaultProfile(), ...updates });
  };

  // Authentication is intentionally disabled: every customer uses local device storage.
  const loginDemo = (_name?: string, _email?: string) => {};
  const loginWithEmail = async (_userId: string, _password = '') => false;
  const signupWithEmail = async (_name: string, _userId: string, _company = '', _password = '') => false;
  const loginWithGoogle = async () => false;
  const logout = async () => {};

  return (
    <AuthContext.Provider value={{
      user, loading: false, loginDemo, loginWithEmail, signupWithEmail,
      loginWithGoogle, logout, updateProfile, isAppwriteConnected: false,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
