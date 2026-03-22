import { KVNamespace, R2Bucket } from '@cloudflare/workers-types';

declare global {
	namespace App {
		interface Platform {
			env?: {
				PASTE_KV: KVNamespace;
				PASTE_IMAGES: R2Bucket;
			};
		}
	}
}

export {};
