<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import { authClient } from '$lib/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { children } = $props();
	const session = authClient.useSession();
	let approved = $state<boolean | null>(null);
	let inviteCode = $state('');
	let inviteError = $state('');
	let redeeming = $state(false);

	const publicPaths = ['/login'];

	$effect(() => {
		if (!$session.isPending && !$session.data && !publicPaths.includes(page.url.pathname)) {
			goto('/login');
		}
	});

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
		} catch {
			approved = false;
		}
	}

	async function redeemInvite() {
		if (!inviteCode.trim()) {
			inviteError = 'Please enter an invite code';
			return;
		}
		redeeming = true;
		inviteError = '';
		try {
			await api.invites.redeem(inviteCode.trim());
			approved = true;
		} catch {
			inviteError = 'Invalid or already used invite code';
		}
		redeeming = false;
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
			<Card.Root class="w-full max-w-md">
				<Card.Header class="text-center">
					<Card.Title class="text-xl">Invite Code Required</Card.Title>
					<Card.Description>Enter an invite code to access the app</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="flex gap-2">
						<Input
							bind:value={inviteCode}
							placeholder="Enter invite code"
							class="text-center uppercase tracking-widest"
							onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && redeemInvite()}
						/>
						<Button onclick={redeemInvite} disabled={redeeming || !inviteCode.trim()}>
							{redeeming ? '...' : 'Submit'}
						</Button>
					</div>
					{#if inviteError}
						<p class="text-sm text-destructive text-center">{inviteError}</p>
					{/if}
					<div class="text-center">
						<Button
							variant="link"
							size="sm"
							onclick={() => { authClient.signOut(); goto('/login'); }}
						>
							Sign out
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
<Toaster />
