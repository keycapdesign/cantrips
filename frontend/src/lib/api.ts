const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...options.headers
		}
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(err.error || "Request failed");
	}
	return res.json();
}

export const api = {
	games: {
		list: () => request("/api/games"),
		get: (id: string | number) => request(`/api/games/${id}`),
		search: (q: string) => request(`/api/games/search?q=${encodeURIComponent(q)}`),
		add: (game: { itadId: string; title: string }) =>
			request("/api/games", { method: "POST", body: JSON.stringify(game) }),
		remove: (id: string | number) =>
			request(`/api/games/${id}`, { method: "DELETE" }),
		history: (id: string | number) => request(`/api/games/${id}/history`)
	},
	deals: {
		latest: () => request("/api/deals/latest")
	},
	admin: {
		refresh: () => request("/api/admin/refresh", { method: "POST" }),
		users: () => request("/api/admin/users"),
		setRole: (userId: string, role: string) =>
			request(`/api/admin/users/${userId}/role`, {
				method: "PUT",
				body: JSON.stringify({ role })
			})
	},
	invites: {
		validate: (code: string) =>
			request<{ valid: boolean }>(`/api/invites/validate/${encodeURIComponent(code)}`),
		redeem: (code: string) =>
			request("/api/invites/redeem", { method: "POST", body: JSON.stringify({ code }) }),
		status: () => request<{ approved: boolean }>("/api/invites/status"),
		list: () => request<any[]>("/api/invites"),
		generate: (count = 1) =>
			request<{ codes: string[] }>("/api/invites", {
				method: "POST",
				body: JSON.stringify({ count })
			}),
		remove: (id: number) =>
			request(`/api/invites/${id}`, { method: "DELETE" })
	}
};
