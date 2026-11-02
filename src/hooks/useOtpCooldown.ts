import { useEffect, useState } from 'react';

const OTP_COOLDOWN_SECONDS = 45;

/** Blocks a second OTP request until the countdown expires. */
export function useOtpCooldown(seconds = OTP_COOLDOWN_SECONDS) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  return {
    waiting: remaining > 0,
    remaining,
    start: () => setRemaining(seconds),
  };
}
