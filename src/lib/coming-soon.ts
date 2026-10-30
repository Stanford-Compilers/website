import { SITE } from '../config/site';

/**
 * Whether this build is held behind the coming-soon page. The switch is
 * `SITE.features.comingSoon`; the dev server and `FULL_SITE=1` builds always
 * render the full site so content can still be reviewed (and e2e-tested).
 */
export const COMING_SOON: boolean =
  SITE.features.comingSoon && import.meta.env.PROD && !import.meta.env.FULL_SITE;
