<script lang="ts">
	import type { PageData } from './$types';
	import SyntaxHighlighter from '$lib/components/SyntaxHighlighter.svelte';

	export let data: PageData;

	const { paste, language } = data;

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}

	async function copyContent() {
		try {
			await navigator.clipboard.writeText(paste.content ?? '');
		} catch (err) {
			console.error('Failed to copy content: ', err);
			alert('Failed to copy content');
		}
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
		} catch (err) {
			console.error('Failed to copy link: ', err);
			alert('Failed to copy link');
		}
	}

	async function deletePaste() {
		if (!confirm('Are you sure you want to delete this paste? This action cannot be undone.')) {
			return;
		}

		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/delete';
		document.body.appendChild(form);
		form.submit();
	}

	$: isOwner = data.session?.user?.id === paste.userId;
	$: isImage = paste.type === 'image';
	$: titleSuffix = language ? ` (${language})` : '';
</script>

<svelte:head>
	<title>{paste.title || 'Untitled Paste'}{titleSuffix} - paste.</title>
</svelte:head>

<header>
	<hgroup>
		<h1>{paste.title || 'Untitled Paste'}</h1>
		<p>
			Created: {formatDate(paste.createdAt)} • Visibility: {paste.visibility}{language
				? ` • Language: ${language}`
				: ''}
		</p>
	</hgroup>
</header>

<section>
	{#if isImage}
		<img src="/api/image/{paste.slug}" alt={paste.title || 'Image paste'} style="max-width: 100%;" />
	{:else if language}
		<SyntaxHighlighter code={paste.content} {language} />
	{:else}
		<pre><code>{paste.content}</code></pre>
	{/if}

	<div class="grid">
		{#if !isImage}
			<button type="button" on:click={copyContent}>Copy Content</button>
		{/if}
		<button type="button" on:click={copyLink} class="secondary">Copy Link</button>
		<a href="/p/{paste.slug}/raw" role="button" class="secondary">Raw</a>
		{#if isOwner}
			<button type="button" on:click={deletePaste} class="contrast">Delete</button>
		{/if}
	</div>
</section>
