<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import Alert from '$lib/components/Alert.svelte';
	import { enhance } from '$app/forms';
	export let data: PageData;
	export let form: ActionData;

	let isSubmitting = false;
</script>

<svelte:head>
	<title>paste. - Create and Share Code Snippets</title>
</svelte:head>

{#if data.session?.user}
	<header>
		<hgroup>
			<h1>Create a Paste</h1>
			<p class="secondary">
				Hello, {data.session.user.name?.split(' ')[0] || data.session.user.name}!
			</p>
		</hgroup>
	</header>

	{#if form?.error}
		<Alert type="error" message={form.error} />
	{/if}

	<form
		method="POST"
		action="?/createPaste"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
	>
		<label for="content">
			Code or Text
			<textarea
				id="content"
				name="content"
				rows="12"
				placeholder="Paste your code here..."
				required
				aria-required="true"
			></textarea>
		</label>

		<div class="grid">
			<label for="title">
				Title (optional)
				<input type="text" id="title" name="title" placeholder="Enter a title for your paste" />
			</label>

			<label for="expiration">
				Expiration
				<select id="expiration" name="expiration" required>
					<option value="never">Never</option>
					<option value="1hour">1 Hour</option>
					<option value="1day">1 Day</option>
					<option value="1week">1 Week</option>
					<option value="1month">1 Month</option>
					<option value="6months">6 Months</option>
					<option value="1year">1 Year</option>
				</select>
			</label>

			<div>
				<label for="visibility">
					Visibility
					<select id="visibility" name="visibility" required>
						<option value="private">Private (only you)</option>
						<option value="logged_in">All logged in users</option>
						<option value="public">Public</option>
					</select>
				</label>
			</div>
		</div>

		<div>
			<label for="customSlug">Custom URL (optional)</label>
			<input
				type="text"
				id="customSlug"
				name="customSlug"
				placeholder="my-custom-url"
				pattern="[a-zA-Z0-9_\-]+"
				minlength="3"
				maxlength="50"
				title="Custom URL can only contain letters, numbers, hyphens, and underscores"
			/>
			<small class="help-text"
				>Letters, numbers, hyphens, and underscores only. Length: 3-50 characters</small
			>
		</div>

		<button type="submit" disabled={isSubmitting}>
			{isSubmitting ? 'Creating...' : 'Create Paste'}
		</button>
	</form>
{:else}
	<header>
		<hgroup>
			<h1>Welcome to paste.</h1>
			<p class="secondary">A semi-private paste service for sharing code, text, and images</p>
		</hgroup>
	</header>

	<section>
		<p>Please sign in to create and manage your pastes.</p>
	</section>
{/if}
