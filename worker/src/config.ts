// Every tunable of the report proxy in one place. All values here are PROVISIONAL, sized for
// about 10-15 friends (see QA_PLAN.md); change them here, not inline.
export const LIMITS = {
  /** Largest request body accepted, in bytes. A run save plus a fight scenario plus a log is far below this. */
  maxBodyBytes: 256 * 1024,
  maxTextChars: 2000,
  maxNameChars: 60,
  maxBuildChars: 64,
  /** The plan's number: 20 reports an hour per anonymous tester ID. */
  reportsPerHourPerId: 20,
  /** The ID is chosen by the client and so can be spoofed; this caps one network address regardless of ID. */
  reportsPerHourPerIp: 60,
  /** How long a stored snapshot is kept before KV deletes it (QA_PLAN.md left this open: 90 days for now). */
  snapshotTtlSeconds: 90 * 24 * 60 * 60,
  /** Longest GitHub issue title we generate. */
  titleChars: 70,
} as const;

export const HOUR_MS = 60 * 60 * 1000;
