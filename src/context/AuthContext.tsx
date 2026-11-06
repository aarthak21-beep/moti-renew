import React, { createContext, useContext, useEffect, useState } from 'react';
import { ID, OAuthProvider } from 'appwrite';
import { UserProfile } from '../types';
import { account, appwriteConfigured, APPWRITE_DATABASE_ID, APPWRITE_TABLES, tablesDB, ownerPermissions } from '../lib/appwrite';

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
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const authEmailForId = (userId: string) => `${userId.trim().toLowerCase()}@motirenew.invalid`;

async function profileForUser(authUser: any): Promise<UserProfile> {
  const fallback: UserProfile = {
    uid: authUser.$id,
    email: authUser.email || authUser.name || '',
    displayName: authUser.name || 'Subscriber',
    companyName: 'My Business',
    defaultCurrency: 'INR',
    language: 'en',
    theme: 'light',
    createdAt: authUser.registration || new Date().toISOString(),
  };
  try {
    const row: any = await tablesDB.getRow(APPWRITE_DATABASE_ID, APPWRITE_TABLES.profiles, authUser.$id);
    return {
      uid: authUser.$id,
      email: row.email || fallback.email,
      displayName: row.displayName || fallback.displayName,
      companyName: row.companyName || fallback.companyName,
      defaultCurrency: row.defaultCurrency || 'INR',
      language: row.language || 'en',
      theme: row.theme || 'light',
      createdAt: authUser.registration || fallback.createdAt,
    };
  } catch (error: any) {
    if (error?.code !== 404) throw error;
    await tablesDB.createRow(APPWRITE_DATABASE_ID, APPWRITE_TABLES.profiles, authUser.$id, {
      userId: authUser.$id,
      email: fallback.email,
      displayName: fallback.displayName,
      companyName: fallback.companyName,
      defaultCurrency: fallback.defaultCurrency,
      language: fallback.language,
      theme: fallback.theme,
    }, ownerPermissions(authUser.$id));
    return fallback;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Restore the locally saved profile so language/theme remain selected
    // in local-first mode and immediately appear on the next app launch.
    try {
      const saved = localStorage.getItem('moti_renew_user');
      if (!saved) return null;
      const profile = JSON.parse(saved) as UserProfile;
      if (!profile || typeof profile.uid !== 'string') return null;
      if (!['en', 'hi', 'mr'].includes(profile.language)) profile.language = 'en';
      if (!['light', 'dark'].includes(profile.theme)) profile.theme = 'light';
      return profile;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(appwriteConfigured);

  useEffect(() => {
    if (user) {
      localStorage.setItem('moti_renew_user', JSON.stringify(user));
      document.documentElement.classList.toggle('dark', user.theme === 'dark');
    } else {
      localStorage.removeItem('moti_renew_user');
    }
  }, [user]);

  useEffect(() => {
    if (!appwriteConfigured) { setLoading(false); return; }
    let active = true;
    account.get().then(async authUser => {
      try {
        const profile = await profileForUser(authUser);
        if (active) setUser(profile);
      } catch (error) {
        console.error('Could not load Appwrite profile:', error);
      } finally {
        if (active) setLoading(false);
      }
    }).catch((error: any) => {
      if (error?.code !== 401) console.error('Appwrite session error:', error);
      if (active) { setUser(null); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const loginDemo = (_name?: string, _email?: string) => {
    // Demo sign-in is disabled; authenticate with Appwrite.
  };

  const loginWithEmail = async (userId: string, password = ''): Promise<boolean> => {
    if (!appwriteConfigured) throw new Error('Appwrite is not configured. Add VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID and VITE_APPWRITE_DATABASE_ID.');
    if (!password) throw new Error('Please enter your password.');
    const normalizedId = userId.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedId)) throw new Error('User ID must be 3–30 characters (letters, numbers, dot, underscore or hyphen).');
    setLoading(true);
    try {
      await account.createEmailPasswordSession(authEmailForId(normalizedId), password);
      setUser(await profileForUser(await account.get()));
      return true;
    } finally { setLoading(false); }
  };

  const signupWithEmail = async (name: string, userId: string, company = '', password = ''): Promise<boolean> => {
    if (!appwriteConfigured) throw new Error('Appwrite is not configured. Add the VITE_APPWRITE environment variables.');
    if (!password) throw new Error('Please enter a password.');
    const normalizedId = userId.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedId)) throw new Error('User ID must be 3–30 characters (letters, numbers, dot, underscore or hyphen).');
    setLoading(true);
    try {
      const email = authEmailForId(normalizedId);
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      const authUser = await account.get();
      const profile = await profileForUser(authUser);
      await updateProfileForNewUser(profile, { displayName: name, companyName: company || 'My Company' });
      setUser({ ...profile, displayName: name, companyName: company || 'My Company' });
      return true;
    } finally { setLoading(false); }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    if (!appwriteConfigured) throw new Error('Appwrite is not configured.');
    account.createOAuth2Session(OAuthProvider.Google, window.location.origin, window.location.origin);
    return true;
  };

  const logout = async () => {
    if (appwriteConfigured) {
      try { await account.deleteSession('current'); } catch (error: any) {
        if (error?.code !== 401) throw error;
      }
    }
    setUser(null);
    localStorage.removeItem('moti_renew_user');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };

    // Apply changes locally first so language and theme switch immediately.
    // Cloud profile sync is best-effort and must not block local-first usage.
    setUser(updated);

    if (appwriteConfigured) {
      try {
        await tablesDB.updateRow(APPWRITE_DATABASE_ID, APPWRITE_TABLES.profiles, user.uid, {
          userId: user.uid, email: updated.email, displayName: updated.displayName,
          companyName: updated.companyName, defaultCurrency: updated.defaultCurrency,
          language: updated.language, theme: updated.theme,
        });
        if (updates.displayName !== undefined) {
          await account.updateName(updated.displayName);
        }
      } catch (error) {
        console.error('Could not sync profile changes. Local settings were saved:', error);
      }
    }
  };

  return <AuthContext.Provider value={{
    user, loading, loginDemo, loginWithEmail, signupWithEmail,
    loginWithGoogle, logout, updateProfile, isAppwriteConnected: appwriteConfigured,
  }}>{children}</AuthContext.Provider>;
};

async function updateProfileForNewUser(profile: UserProfile, updates: Partial<UserProfile>) {
  await tablesDB.updateRow(APPWRITE_DATABASE_ID, APPWRITE_TABLES.profiles, profile.uid, {
    userId: profile.uid, email: profile.email,
    displayName: updates.displayName || profile.displayName,
    companyName: updates.companyName || profile.companyName,
    defaultCurrency: profile.defaultCurrency, language: profile.language, theme: profile.theme,
  });
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
