export const CLICK_SPEED_TEST_DURATION_SECONDS: number;

export function isClickSpeedTestFinished(remainingSeconds: number): boolean;

export function buildClickSpeedTestResult(clicks: number): {
  clicks: number;
  clicksPerSecond: number;
  durationSeconds: number;
};
