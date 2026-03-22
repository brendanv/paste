import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createImagePaste } from '$lib/paste';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const apiUser = locals.apiUser;
	if (!apiUser) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return json({ error: 'Expected multipart/form-data' }, { status: 400 });
	}

	const file = formData.get('file');
	if (!file || !(file instanceof File)) {
		return json({ error: 'Missing required field: file' }, { status: 400 });
	}

	const visibility = (formData.get('visibility') as string) || 'private';
	const expiration = (formData.get('expiration') as string) || '1week';
	const title = (formData.get('title') as string) || undefined;
	const customSlug = (formData.get('customSlug') as string) || undefined;

	const imageData = await file.arrayBuffer();

	const result = await createImagePaste(
		{
			imageData,
			contentType: file.type,
			visibility: visibility as any,
			expiration: expiration as any,
			title,
			customSlug,
			userId: apiUser.id
		},
		platform?.env?.PASTE_KV,
		platform?.env?.PASTE_IMAGES
	);

	if (!result.success) {
		return json({ error: result.error }, { status: 400 });
	}

	return json({
		success: true,
		slug: result.slug,
		url: `/p/${result.slug}`
	});
};
