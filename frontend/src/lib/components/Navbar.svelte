<script lang="ts">
	import { authClient } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ThemeToggle from './ThemeToggle.svelte';
	import Settings from '@lucide/svelte/icons/settings';
	import LogOut from '@lucide/svelte/icons/log-out';

	let { user }: { user: { name: string; image?: string | null; role?: string | null } } = $props();

	function initials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	async function logout() {
		await authClient.signOut();
		window.location.href = '/login';
	}
</script>

<nav class="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/60">
	<div class="container mx-auto px-4 py-3 flex items-center justify-between">
		<a href="/" class="text-xl font-bold hover:text-primary transition-colors">Game Deals</a>

		<div class="flex items-center gap-2">
			<ThemeToggle />
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="ghost" class="flex items-center gap-2">
						<Avatar.Root class="h-8 w-8">
							{#if user.image}
								<Avatar.Image src={user.image} alt={user.name} />
							{/if}
							<Avatar.Fallback>{initials(user.name)}</Avatar.Fallback>
						</Avatar.Root>
						<span class="text-sm hidden sm:inline">{user.name}</span>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					{#if user.role === 'admin'}
						<a href="/settings">
							<DropdownMenu.Item>
								<Settings class="mr-2 h-4 w-4" />
								Settings
							</DropdownMenu.Item>
						</a>
						<DropdownMenu.Separator />
					{/if}
					<DropdownMenu.Item onclick={logout}>
						<LogOut class="mr-2 h-4 w-4" />
						Sign out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
</nav>
