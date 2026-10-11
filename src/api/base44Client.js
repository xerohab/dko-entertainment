import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
// This SDK version exposes users at runtime but omits it from Base44Client.
// Match the installed users module's verified user/admin-only signature.
export const base44 = /** @type {ReturnType<typeof createClient> & {users: {inviteUser: (email: string, role: 'user'|'admin') => Promise<unknown>}}} */ (createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
}));

