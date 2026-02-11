import { createAuthClient } from 'better-auth/svelte';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	basePath: '/api/auth',
	plugins: [adminClient()]
});
