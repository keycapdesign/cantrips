import { Cron } from "croner";
import { exampleJob } from "./jobs/example";
import { priceRefreshJob } from "./jobs/price-refresh";

export function scheduledJobs() {
  // Runs every hour
  new Cron("0 * * * *", () => {
    console.log("Running example job");
    exampleJob();
  });

  // Weekly price refresh: Every Sunday at 8 AM Eastern
  new Cron("0 8 * * 0", { timezone: "America/New_York" }, async () => {
    console.log("Running weekly price refresh");
    try {
      await priceRefreshJob();
    } catch (error) {
      console.error("Price refresh cron failed:", error);
    }
  });

  console.log("Scheduled jobs registered");
}