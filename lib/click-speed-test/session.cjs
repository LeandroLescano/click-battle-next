const CLICK_SPEED_TEST_DURATION_SECONDS = 5;

function isClickSpeedTestFinished(remainingSeconds) {
  return remainingSeconds <= 0;
}

function buildClickSpeedTestResult(clicks) {
  return {
    clicks,
    clicksPerSecond: Number(
      (clicks / CLICK_SPEED_TEST_DURATION_SECONDS).toFixed(1)
    ),
    durationSeconds: CLICK_SPEED_TEST_DURATION_SECONDS
  };
}

module.exports = {
  CLICK_SPEED_TEST_DURATION_SECONDS,
  buildClickSpeedTestResult,
  isClickSpeedTestFinished
};
