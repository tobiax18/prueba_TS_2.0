export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startReportScheduler } =
      await import("@/server/services/report-cron.service");
    startReportScheduler();
  }
}
