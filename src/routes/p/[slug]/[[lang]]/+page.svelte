<script lang="ts">
	import type { PageData } from './$types';
	import { deserialize } from '$app/forms';
	import SyntaxHighlighter from '$lib/components/SyntaxHighlighter.svelte';

	export let data: PageData;

	const { paste, language } = data;

	let editingTitle = false;
	let titleInputValue = '';
	let currentTitle = paste.title;

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

	function startTitleEdit() {
		titleInputValue = currentTitle || '';
		editingTitle = true;
	}

	async function submitTitleUpdate() {
		if (!editingTitle) return;

		const newTitle = titleInputValue.trim() || null;
		editingTitle = false;

		const previousTitle = currentTitle;
		currentTitle = newTitle;

		const formData = new FormData();
		formData.set('title', newTitle ?? '');

		try {
			const response = await fetch('?/updateTitle', {
				method: 'POST',
				body: formData
			});
			const result = deserialize(await response.text());
			if (result.type !== 'success') {
				currentTitle = previousTitle;
			}
		} catch {
			currentTitle = previousTitle;
		}
	}

	function handleTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			submitTitleUpdate();
		} else if (e.key === 'Escape') {
			editingTitle = false;
		}
	}

	$: isOwner = data.session?.user?.id === paste.userId;
	$: isImage = paste.type === 'image';
	$: titleSuffix = language ? ` (${language})` : '';
	$: displayTitle = currentTitle || 'Untitled Paste';
</script>

<svelte:head>
	<title>{displayTitle}{titleSuffix} - paste.</title>
</svelte:head>

<header>
	<hgroup>
		{#if isOwner && editingTitle}
			<input
				type="text"
				bind:value={titleInputValue}
				on:keydown={handleTitleKeydown}
				on:blur={submitTitleUpdate}
				placeholder="Untitled Paste"
				autofocus
				class="title-edit-input"
			/>
		{:else}
			<h1>
				{displayTitle}
				{#if isOwner}
					<button
						type="button"
						on:click={startTitleEdit}
						aria-label="Edit title"
						class="title-edit-btn"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
						</svg>
					</button>
				{/if}
			</h1>
		{/if}
		<p>
			Created: {formatDate(paste.createdAt)} • Visibility: {paste.visibility}{language
				? ` • Language: ${language}`
				: ''}
		</p>
	</hgroup>
</header>

<section>
	{#if isImage}
		<img
			src="/api/image/{paste.slug}"
			alt={paste.title || 'Image paste'}
			style="max-width: 100%;"
		/>
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

<style>
	.title-edit-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0 0.25em;
		line-height: 1;
		color: inherit;
		vertical-align: middle;
		display: inline-flex;
		align-items: center;
		margin-left: 0.25em;
		opacity: 0.4;
		transition: opacity 0.15s;
	}

	.title-edit-btn:hover {
		opacity: 1;
		background: none;
	}

	.title-edit-input {
		font-size: 2rem;
		font-weight: bold;
		width: 100%;
		margin-bottom: 0.5rem;
	}
</style>
