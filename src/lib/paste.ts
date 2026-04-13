export interface PasteMetadata {
	title: string | null;
	visibility: 'public' | 'private' | 'logged_in';
	createdAt: number;
	userId: string;
	slug: string;
	type: 'text' | 'image';
	contentType?: string;
	expiration?: 'never' | '1hour' | '1day' | '1week' | '1month' | '6months' | '1year';
	expiresAt?: number; // Unix timestamp in seconds; used to preserve TTL on metadata-only updates
}

export interface CreatePasteOptions {
	content: string;
	visibility: 'public' | 'private' | 'logged_in';
	expiration: 'never' | '1hour' | '1day' | '1week' | '1month' | '6months' | '1year';
	title?: string;
	customSlug?: string;
	userId: string;
}

export interface CreateImagePasteOptions {
	imageData: ArrayBuffer;
	contentType: string;
	visibility: 'public' | 'private' | 'logged_in';
	expiration: 'never' | '1hour' | '1day' | '1week' | '1month' | '6months' | '1year';
	title?: string;
	customSlug?: string;
	userId: string;
}

export interface CreatePasteResult {
	success: boolean;
	slug?: string;
	error?: string;
}

const ALLOWED_IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml'
] as const;

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

function generateRandomSlug(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < 5; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

function getExpirationTtl(expiration: string): number | null {
	if (expiration === 'never') return null;

	const durations = {
		'1hour': 60 * 60,
		'1day': 24 * 60 * 60,
		'1week': 7 * 24 * 60 * 60,
		'1month': 30 * 24 * 60 * 60,
		'6months': 6 * 30 * 24 * 60 * 60,
		'1year': 365 * 24 * 60 * 60
	};

	return durations[expiration as keyof typeof durations] || null;
}

function validateCommonOptions(
	visibility: string,
	expiration: string,
	customSlug?: string
): string | null {
	if (!['public', 'private', 'logged_in'].includes(visibility)) {
		return 'Invalid visibility option';
	}

	if (!['never', '1hour', '1day', '1week', '1month', '6months', '1year'].includes(expiration)) {
		return 'Invalid expiration option';
	}

	if (customSlug) {
		if (customSlug.length < 3 || customSlug.length > 50) {
			return 'Custom URL slug must be between 3 and 50 characters';
		}
		if (!/^[a-zA-Z0-9_-]+$/.test(customSlug)) {
			return 'Custom URL slug can only contain letters, numbers, hyphens, and underscores';
		}
	}

	return null;
}

async function resolveSlug(customSlug: string | undefined, kv: any): Promise<string | null> {
	if (customSlug) {
		const existing = await kv?.get(`paste-${customSlug}`);
		if (existing !== null) return null;
		return customSlug;
	}

	let attempts = 0;
	let slug: string;
	do {
		slug = generateRandomSlug();
		const existing = await kv?.get(`paste-${slug}`);
		if (existing === null) return slug;
		attempts++;
	} while (attempts < 10);

	return null;
}

export async function createPaste(
	options: CreatePasteOptions,
	kv: any
): Promise<CreatePasteResult> {
	const { content, visibility, expiration, title, customSlug, userId } = options;

	if (!content || content.trim() === '') {
		return { success: false, error: 'Content is required' };
	}

	const validationError = validateCommonOptions(visibility, expiration, customSlug);
	if (validationError) {
		return { success: false, error: validationError };
	}

	const slug = await resolveSlug(customSlug, kv);
	if (!slug) {
		return customSlug
			? { success: false, error: 'This custom URL slug is already in use' }
			: { success: false, error: 'Unable to generate unique slug, please try again' };
	}

	const expirationTtl = getExpirationTtl(expiration);

	const metadata: PasteMetadata = {
		title: title || null,
		visibility: visibility as PasteMetadata['visibility'],
		createdAt: Date.now(),
		userId,
		slug,
		type: 'text'
	};

	if (expirationTtl) {
		metadata.expiresAt = Math.floor(Date.now() / 1000) + expirationTtl;
	}

	const putOptions: any = { metadata };

	if (expirationTtl) {
		putOptions.expirationTtl = expirationTtl;
	}

	try {
		await kv?.put(`paste-${slug}`, content, putOptions);
		return { success: true, slug };
	} catch (error) {
		console.error('Failed to store paste:', error);
		return { success: false, error: 'Failed to create paste' };
	}
}

export async function createImagePaste(
	options: CreateImagePasteOptions,
	kv: any,
	r2: any
): Promise<CreatePasteResult> {
	const { imageData, contentType, visibility, expiration, title, customSlug, userId } = options;

	if (!ALLOWED_IMAGE_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
		return {
			success: false,
			error: `Unsupported image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
		};
	}

	if (imageData.byteLength > MAX_IMAGE_SIZE) {
		return { success: false, error: 'Image exceeds 10 MB size limit' };
	}

	if (imageData.byteLength === 0) {
		return { success: false, error: 'Image data is empty' };
	}

	const validationError = validateCommonOptions(visibility, expiration, customSlug);
	if (validationError) {
		return { success: false, error: validationError };
	}

	const slug = await resolveSlug(customSlug, kv);
	if (!slug) {
		return customSlug
			? { success: false, error: 'This custom URL slug is already in use' }
			: { success: false, error: 'Unable to generate unique slug, please try again' };
	}

	const expirationTtl = getExpirationTtl(expiration);

	const metadata: PasteMetadata = {
		title: title || null,
		visibility: visibility as PasteMetadata['visibility'],
		createdAt: Date.now(),
		userId,
		slug,
		type: 'image',
		contentType,
		expiration: expiration as PasteMetadata['expiration']
	};

	if (expirationTtl) {
		metadata.expiresAt = Math.floor(Date.now() / 1000) + expirationTtl;
	}

	const putOptions: any = { metadata };
	if (expirationTtl) {
		putOptions.expirationTtl = expirationTtl;
	}

	const r2Key = `${expiration}/image-${slug}`;
	try {
		await r2?.put(r2Key, imageData, { httpMetadata: { contentType } });
		await kv?.put(`paste-${slug}`, '', putOptions);
		return { success: true, slug };
	} catch (error) {
		console.error('Failed to store image paste:', error);
		try {
			await r2?.delete(r2Key);
		} catch {
			// best-effort cleanup
		}
		return { success: false, error: 'Failed to create image paste' };
	}
}
