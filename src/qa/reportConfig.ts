// Where bug reports go. See QA_PLAN.md. The proxy address is not secret. The shared secret is read
// at build time from VITE_REPORT_SECRET (a GitHub Actions secret on deploy, a git-ignored
// .env.local locally); it ends up in the built page, so it only stops casual abuse.

/** The deployed report proxy (worker/). */
export const REPORT_URL = 'https://first-real-game-reports.michael-e-leonhard.workers.dev';

/** The shared secret the proxy expects, or '' when this build was made without one. */
export const REPORT_SECRET: string = (import.meta.env?.VITE_REPORT_SECRET as string | undefined) ?? '';

/** Longest report text the proxy accepts (worker/src/config.ts maxTextChars); keep the two equal. */
export const REPORT_TEXT_LIMIT = 2000;
/** Longest name the proxy accepts (worker/src/config.ts maxNameChars). */
export const REPORT_NAME_LIMIT = 60;
