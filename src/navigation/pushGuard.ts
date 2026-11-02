import type { ImperativeRouter } from 'expo-router';

type PushHref = Parameters<ImperativeRouter['push']>[0];

/**
 * A tap only stops reaching the old screen once the new one has rendered, so a
 * burst of taps used to enqueue one navigation each and stack two or three
 * copies of the same screen — which the user then had to back out of one by
 * one. The first push of a burst claims its destination and the repeats are
 * dropped until the app has actually moved.
 */
const CLAIM_TTL_MS = 1200;
/** A landing only frees the destination once the transition behind it is over. */
const MIN_CLAIM_MS = 700;

let claim: { href: string; at: number } | undefined;

/** Stable identity of a target, so `{ pathname, params }` and its string form collide. */
export function pushHrefKey(href: PushHref): string {
  if (typeof href === 'string') return href;
  const object = href as { pathname?: string; params?: Record<string, unknown> };
  const query = Object.entries(object.params ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${String(value)}`)
    .join('&');
  return `${object.pathname ?? ''}?${query}`;
}

/** @returns false when the same destination is already on its way in. */
export function claimPush(href: string): boolean {
  const now = Date.now();
  if (claim && claim.href === href && now - claim.at < CLAIM_TTL_MS) return false;
  claim = { href, at: now };
  return true;
}

/**
 * Called on every path change. The push that just landed is the one being
 * followed up on, so it keeps the claim while the transition is still running —
 * a slow device leaves the old screen tappable for a few hundred milliseconds —
 * and frees it once the destination has been settled on. The ttl is the backstop
 * for a push that never arrives (a redirect, an invalid href), so a claim cannot
 * lock a destination out.
 */
export function clearPushClaim(): void {
  if (claim && Date.now() - claim.at >= MIN_CLAIM_MS) claim = undefined;
}
