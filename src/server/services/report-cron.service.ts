import cron from "node-cron";

import { logger } from "@/server/logs/logger";
import { scheduledReportService } from "@/server/services/scheduled-report.service";
import { env } from "@/server/utils/env";

const globalForScheduler = globalThis as { reportCronStarted?: boolean };

export function startReportScheduler() {
  if (!env.reportCronEnabled || globalForScheduler.reportCronStarted) {
    return;
  }

  cron.schedule(env.reportCronSchedule, async () => {
    logger.info("Running scheduled administrative report");

    try {
      await scheduledReportService.execute(
        {
          plantilla: "administrativo",
          formato: "pdf",
        },
        "cron",
      );
    } catch (error) {
      logger.error("Scheduled report execution failed", error);
    }
  });

  globalForScheduler.reportCronStarted = true;
  logger.info(
    `Report scheduler started with cron expression ${env.reportCronSchedule}`,
  );
}
