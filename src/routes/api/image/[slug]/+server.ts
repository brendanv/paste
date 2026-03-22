import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PasteMetadata } from '$lib/paste';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	const { slug } = params;

	let pasteResult;
	try {
		pasteResult = await platform?.env?.PASTE_KV?.getWithMetadata(`paste-${slug}`);
	} catch {
		return json({ error: 'Not found' }, { status: 404 });
	}

	if (!pasteResult?.metadata) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	const metadata = pasteResult.metadata as PasteMetadata;

	if (metadata.type !== 'image') {
		return json({ error: 'Not found' }, { status: 404 });
	}

	// Enforce visibility
	if (metadata.visibility === 'private' || metadata.visibility === 'logged_in') {
		const session = await locals.auth();
		if (!session?.user) {
			return json({ error: 'Not found' }, { status: 404 });
		}
		if (metadata.visibility === 'private' && session.user.id !== metadata.userId) {
			return json({ error: 'Not found' }, { status: 404 });
		}
	}

	const r2Key = `${metadata.expiration ?? 'never'}/image-${slug}`;
	const object = await platform?.env?.PASTE_IMAGES?.get(r2Key);
	if (!object) {
		return json({ error: 'Image data not found' }, { status: 500 });
	}

	const imageData = await object.arrayBuffer();
	const contentType = metadata.contentType ?? 'application/octet-stream';
	const cacheControl =
		metadata.visibility === 'public' ? 'public, max-age=3600' : 'private, max-age=3600';

	return new Response(imageData, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': cacheControl
		}
	});
};
