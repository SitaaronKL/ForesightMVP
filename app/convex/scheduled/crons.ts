import { cronJobs } from "convex/server";
import { internal } from "../_generated/api";

const crons = cronJobs();

// In production we would schedule per-nurse. For the demo, we expose a
// hook here but trigger manually from the admin page.

// Example schedule (commented out for demo):
// crons.cron("morning briefing", "0 11 * * *", internal.scheduled.briefings.generateMorningForNurse, { nurseId: ... });

export default crons;
