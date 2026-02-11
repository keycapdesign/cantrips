<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { children } = $props();
	const session = authClient.useSession();
	let approved = $state<boolean | null>(null);

	const publicPaths = ['/login'];

	$effect(() => {
		if (!$session.isPending && !$session.data && !publicPaths.includes(page.url.pathname)) {
			goto('/login');
		}
	});

	// After login, check for pending invite code and approval status
	$effect(() => {
		if (!$session.data) {
			approved = null;
			return;
		}

		checkApproval();
	});

	async function checkApproval() {
		// Try to redeem a pending invite code from the login flow
		const pendingCode = localStorage.getItem('pendingInviteCode');
		if (pendingCode) {
			localStorage.removeItem('pendingInviteCode');
			try {
				await api.invites.redeem(pendingCode);
				approved = true;
				return;
			} catch {
				// Code may have been taken — fall through to status check
			}
		}

		try {
			const { approved: isApproved } = await api.invites.status();
			approved = isApproved;
			if (!isApproved && page.url.pathname !== '/login') {
				goto('/login');
			}
		} catch {
			approved = false;
		}
	}
</script>

<svelte:head><title>Game Deals Tracker</title></svelte:head>

<div class="min-h-screen">
	{#if $session.data && approved}
		<Navbar user={$session.data.user} />
	{/if}

	{#if publicPaths.includes(page.url.pathname)}
		<main class="container mx-auto px-4 py-8">{@render children()}</main>
	{:else if $session.data && approved}
		<main class="container mx-auto px-4 py-8">{@render children()}</main>
	{:else if $session.data && approved === false}
		<div class="flex items-center justify-center min-h-[80vh]">
			<div class="text-center space-y-4">
				<p class="text-lg text-muted-foreground">You need a valid invite code to access this app.</p>
				<p class="text-sm text-muted-foreground">Please sign in again with an invite code.</p>
				<Button
					variant="link"
					onclick={() => { authClient.signOut(); goto('/login'); }}
				>
					Back to login
				</Button>
			</div>
		</div>
	{/if}
</div>
<Toaster />
