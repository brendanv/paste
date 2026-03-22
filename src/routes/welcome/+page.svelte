<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
</script>

<svelte:head>
	<title>paste. - Code & Text Sharing</title>
	<meta
		name="description"
		content="A paste service for sharing code and text with privacy controls, syntax highlighting, and expiration options."
	/>
</svelte:head>

<header>
	<hgroup>
		<h1>Welcome to paste.</h1>
		<p>A semi-private paste service for sharing code, text, and images</p>
	</hgroup>
</header>

<section>
	<article>
		<h3>Key Features</h3>
		<ul>
			<li>
				<strong>Privacy controls</strong> - Choose who can view your pastes (public, private, or logged-in
				users only)
			</li>
			<li>
				<strong>Syntax highlighting</strong> - Code formatting for popular programming languages
			</li>
			<li>
				<strong>Expiration options</strong> - Set pastes to expire from 1 hour to 1 year, or keep forever
			</li>
			<li><strong>Image uploads</strong> - Store and share images via API (JPEG, PNG, GIF, WebP, SVG)</li>
			<li><strong>API access</strong> - Simple JSON API for creating pastes and uploading images</li>
		</ul>

		<h3>Examples</h3>
		<p>View example pastes to see the features in action:</p>
		<ul>
			<li><a href="/p/python-example/python">Python code</a> - Script with syntax highlighting</li>
			<li><a href="/p/web-dev-example/html">Web development</a> - HTML, CSS, JavaScript</li>
			<li><a href="/p/config-example/json">Configuration files</a> - JSON, YAML, TOML</li>
			<li><a href="/p/shell-example/bash">Shell scripts</a> - Bash and PowerShell</li>
			<li><a href="/p/data-example/xml">Data formats</a> - CSV, XML, structured data</li>
			<li><a href="/p/text-example">Plain text</a> - Simple text sharing</li>
			<li><a href="/p/sample-image">Sample image</a> - Image upload and display</li>
		</ul>
	</article>
</section>

<section>
	<article
		style="text-align: center; padding: 2rem; background: var(--pico-card-background-color); border-radius: var(--pico-border-radius);"
	>
		<h2>Get Started</h2>
		<p>Sign in to create and manage pastes.</p>
		<button
			type="button"
			class="contrast"
			style="margin: 1rem;"
			on:click={() => signIn('auth0', { callbackUrl: '/' })}
		>
			Sign In
		</button>
	</article>
</section>
