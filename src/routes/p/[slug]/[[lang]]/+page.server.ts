import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { bundledLanguages, type BundledLanguage } from 'shiki';
import type { PasteMetadata } from '$lib/paste';

// Get supported languages from Shiki
const supportedLanguages = Object.keys(bundledLanguages) as BundledLanguage[];

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const { slug, lang } = params;
	const session = await locals.auth();

	// Validate language parameter if provided
	if (lang && !supportedLanguages.includes(lang as BundledLanguage)) {
		throw redirect(302, `/p/${slug}`);
	}

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

	const isImage = metadata.type === 'image';

	return {
		paste: {
			content: isImage ? null : pasteResult.value,
			title: metadata.title,
			visibility: metadata.visibility,
			createdAt: metadata.createdAt,
			userId: metadata.userId,
			slug: metadata.slug,
			type: metadata.type ?? 'text',
			contentType: metadata.contentType
		},
		session,
		language: isImage ? undefined : (lang as BundledLanguage | undefined)
	};
};

export const actions: Actions = {
	delete: async ({ params, locals, platform }) => {
		const { slug } = params;
		const session = await locals.auth();

		if (!session?.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		let pasteResult;
		try {
			pasteResult = await platform?.env?.PASTE_KV?.getWithMetadata(`paste-${slug}`);
			if (!pasteResult?.metadata) {
				return fail(404, { error: 'Paste not found' });
			}
		} catch (error) {
			return fail(404, { error: 'Paste not found' });
		}

		const metadata = pasteResult.metadata as PasteMetadata;

		if (session.user.id !== metadata.userId) {
			return fail(403, { error: 'Not authorized to delete this paste' });
		}

		try {
			await platform?.env?.PASTE_KV?.delete(`paste-${slug}`);
			if (metadata.type === 'image') {
				await platform?.env?.PASTE_IMAGES?.delete(`${metadata.expiration ?? 'never'}/image-${slug}`);
			}
		} catch (error) {
			return fail(500, { error: 'Failed to delete paste' });
		}

		throw redirect(303, '/');
	}
};
