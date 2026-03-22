import { handle as authHandle } from './auth';
import { json, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

async function apiKeyAuth({ event, resolve }) {
	const { url, request, platform } = event;

	// API routes require a user id and API key in headers, except image serving
	if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/image/')) {
		const userId = request.headers.get('X-PASTE-USERID');
		const apiKey = request.headers.get('X-PASTE-API-KEY');

		if (userId && apiKey) {
			try {
				const storedApiKey = await platform?.env?.PASTE_KV?.get(`apikey-${userId}`);
				if (storedApiKey === apiKey) {
					event.locals.apiUser = { id: userId };
				}
			} catch (error) {
				console.error('API key validation error:', error);
			}
		}

		if (!event.locals.apiUser) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}
	}

	return resolve(event);
}

async function authorization({ event, resolve }) {
	const { url } = event;

	// Protect all routes under /manage and the root route
	if (url.pathname.startsWith('/manage') || url.pathname === '/') {
		const session = await event.locals.auth();
		if (!session) {
			throw redirect(302, '/welcome');
		}
	}

	// If the request is still here, just proceed as normal
	return resolve(event);
}

export const handle = sequence(authHandle, apiKeyAuth, authorization);
