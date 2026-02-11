export default {
	async scheduled(_event: ScheduledEvent, env: { APP_URL: string; CRON_SECRET: string }) {
		await fetch(`${env.APP_URL}/api/cron/refresh`, {
			method: 'POST',
			headers: { 'x-cron-secret': env.CRON_SECRET }
		});
	}
};
