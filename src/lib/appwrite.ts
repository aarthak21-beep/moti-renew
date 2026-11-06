import { Account, Client, Permission, Query, Role, TablesDB } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined;
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID as string | undefined;

export const appwriteConfigured = Boolean(endpoint && projectId && databaseId);

const client = new Client();
if (endpoint && projectId) client.setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export { Permission, Query, Role };

export const APPWRITE_DATABASE_ID = databaseId || '';
export const APPWRITE_TABLES = {
  profiles: 'Profiles',
  subscriptions: 'subscriptions',
  payments: 'Payments',
  activities: 'Activities',
} as const;

export const ownerPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];
