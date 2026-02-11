<script lang="ts">
	import { api } from '$lib/api';
	import { authClient } from '$lib/auth';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Plus from '@lucide/svelte/icons/plus';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const session = authClient.useSession();

	let users = $state<any[]>([]);
	let inviteCodes = $state<any[]>([]);
	let loading = $state(true);
	let loadingInvites = $state(true);
	let refreshing = $state(false);
	let generating = $state(false);

	$effect(() => {
		if ($session.data?.user?.role !== 'admin') return;
		loadUsers();
		loadInviteCodes();
	});

	async function loadUsers() {
		loading = true;
		try {
			const data = (await api.admin.users()) as any;
			users = data.users || data || [];
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to load users');
		} finally {
			loading = false;
		}
	}

	async function loadInviteCodes() {
		loadingInvites = true;
		try {
			inviteCodes = (await api.invites.list()) as any[];
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to load invite codes');
		} finally {
			loadingInvites = false;
		}
	}

	async function triggerRefresh() {
		refreshing = true;
		try {
			await api.admin.refresh();
			toast.success('Price refresh complete!');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Refresh failed');
		} finally {
			refreshing = false;
		}
	}

	async function toggleAdmin(userId: string, currentRole: string) {
		const newRole = currentRole === 'admin' ? 'user' : 'admin';
		try {
			await api.admin.setRole(userId, newRole);
			await loadUsers();
			toast.success(`Role updated to ${newRole}`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to update role');
		}
	}

	async function generateCode() {
		generating = true;
		try {
			const { codes } = await api.invites.generate(1);
			await loadInviteCodes();
			await navigator.clipboard.writeText(codes[0]);
			toast.success(`Code ${codes[0]} copied to clipboard`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to generate code');
		} finally {
			generating = false;
		}
	}

	async function copyCode(code: string) {
		await navigator.clipboard.writeText(code);
		toast.success('Copied to clipboard');
	}

	async function deleteCode(id: number) {
		try {
			await api.invites.remove(id);
			await loadInviteCodes();
			toast.success('Invite code deleted');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to delete code');
		}
	}

	function initials(name: string): string {
		return name
			.split(' ')
			.map((n: string) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'Z').toLocaleDateString();
	}
</script>

{#if $session.data?.user?.role !== 'admin'}
	<p class="text-muted-foreground text-center py-12">Admin access required</p>
{:else}
	<div class="space-y-8 max-w-3xl mx-auto">
		<div class="space-y-2">
			<Button variant="ghost" href="/" size="sm">
				<ArrowLeft class="h-4 w-4" />
				Back to Watchlist
			</Button>
			<h1 class="text-2xl font-bold">Settings</h1>
		</div>

		<!-- Price Refresh -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Price Refresh</Card.Title>
				<Card.Description>
					Manually trigger a price check across all tracked games. This runs automatically
					every Sunday at 8 AM Eastern.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Button onclick={triggerRefresh} disabled={refreshing}>
					<RefreshCw class="h-4 w-4 {refreshing ? 'animate-spin' : ''}" />
					{refreshing ? 'Refreshing...' : 'Refresh Prices'}
				</Button>
			</Card.Content>
		</Card.Root>

		<!-- Invite Codes -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title>Invite Codes</Card.Title>
						<Card.Description>Generate and manage invite codes for new users</Card.Description>
					</div>
					<Button onclick={generateCode} disabled={generating} size="sm">
						<Plus class="h-4 w-4" />
						{generating ? 'Generating...' : 'Generate Code'}
					</Button>
				</div>
			</Card.Header>
			<Card.Content>
				{#if loadingInvites}
					<div class="space-y-2">
						{#each Array(3) as _, i (i)}
							<Skeleton class="h-12 w-full" />
						{/each}
					</div>
				{:else if inviteCodes.length === 0}
					<p class="text-muted-foreground text-center py-4">No invite codes yet</p>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Code</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head>Created</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each inviteCodes as invite (invite.id)}
								<Table.Row>
									<Table.Cell>
										<code class="text-sm font-mono bg-muted px-2 py-1 rounded">
											{invite.code}
										</code>
									</Table.Cell>
									<Table.Cell>
										{#if invite.redeemed_by}
											<Badge variant="secondary">
												Redeemed by {invite.redeemed_by_name || 'unknown'}
											</Badge>
										{:else}
											<Badge variant="default">Available</Badge>
										{/if}
									</Table.Cell>
									<Table.Cell class="text-muted-foreground">
										{formatDate(invite.created_at)}
									</Table.Cell>
									<Table.Cell class="text-right">
										{#if !invite.redeemed_by}
											<Button
												variant="ghost"
												size="sm"
												onclick={() => copyCode(invite.code)}
											>
												<Copy class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => deleteCode(invite.id)}
											>
												<Trash2 class="h-4 w-4 text-destructive" />
											</Button>
										{:else}
											<span class="text-xs text-muted-foreground">
												{invite.redeemed_at ? formatDate(invite.redeemed_at) : ''}
											</span>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- User Management -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Users</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if loading}
					<div class="space-y-2">
						{#each Array(3) as _, i (i)}
							<Skeleton class="h-12 w-full" />
						{/each}
					</div>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>User</Table.Head>
								<Table.Head>Email</Table.Head>
								<Table.Head>Role</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each users as user (user.id)}
								<Table.Row>
									<Table.Cell>
										<div class="flex items-center gap-3">
											<Avatar.Root class="h-8 w-8">
												{#if user.image}
													<Avatar.Image src={user.image} alt={user.name} />
												{/if}
												<Avatar.Fallback>{initials(user.name)}</Avatar.Fallback>
											</Avatar.Root>
											<span class="font-medium">{user.name}</span>
										</div>
									</Table.Cell>
									<Table.Cell class="text-muted-foreground">
										{user.email}
									</Table.Cell>
									<Table.Cell>
										<Badge
											variant={user.role === 'admin' ? 'default' : 'secondary'}
										>
											{user.role || 'user'}
										</Badge>
									</Table.Cell>
									<Table.Cell class="text-right">
										{#if user.id !== $session.data?.user?.id}
											<Button
												variant="ghost"
												size="sm"
												onclick={() =>
													toggleAdmin(user.id, user.role || 'user')}
											>
												{user.role === 'admin' ? 'Remove admin' : 'Make admin'}
											</Button>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{/if}
