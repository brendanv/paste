import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PasteMetadata } from '$lib/paste';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	const { slug } = params;
	const session = await locals.auth();

	let pasteResult;
	try {
		pasteResult = await platform?.env?.PASTE_KV?.getWithMetadata(`paste-${slug}`);
		if (!pasteResult?.metadata) {
			throw redirect(302, '/paste-not-found');
		}
	} catch (error) {
		throw redirect(302, '/paste-not-found');
	}

	const metadata = pasteResult.metadata as PasteMetadata;

	if (metadata.visibility === 'private') {
		if (!session?.user || session.user.id !== metadata.userId) {
			throw redirect(302, '/paste-not-found');
		}
	} else if (metadata.visibility === 'logged_in') {
		if (!session?.user) {
			throw redirect(302, '/paste-not-found');
		}
	}

	if (metadata.type === 'image') {
		throw redirect(302, `/api/image/${slug}`);
	}

	const content = pasteResult.value ?? '';
	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8'
		}
	});
};
