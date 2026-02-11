export function parseTags(tags: string | null | undefined): string[] {
	if (!tags) return [];
	try {
		return JSON.parse(tags);
	} catch {
		return [];
	}
}

export function releaseStatus(
	releaseDate: string | null | undefined,
	earlyAccess: number | null | undefined
): { label: string; class: string } {
	if (earlyAccess) {
		return { label: 'Early Access', class: 'bg-primary/80 text-primary-foreground border-transparent' };
	}

	if (!releaseDate) {
		return { label: 'Release TBA', class: 'bg-muted text-muted-foreground border-transparent' };
	}

	const release = new Date(releaseDate);
	const now = new Date();

	if (release > now) {
		const formatted = release.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
		return { label: formatted, class: 'bg-primary text-primary-foreground border-transparent' };
	}

	return { label: 'Released', class: '' };
}
