import { Cron } from "croner";
import { exampleJob } from "./jobs/example";

export function scheduledJobs() {
  // Runs every hour
  new Cron("0 * * * *", () => {
    console.log("⏰ Running example job");
    exampleJob();
  });

  // Add more scheduled jobs here:
  // new Cron("*/15 * * * *", () => checkGameDeals());
  // new Cron("0 9 * * *", () => dailyDigest());

  console.log("📅 Scheduled jobs registered");
}