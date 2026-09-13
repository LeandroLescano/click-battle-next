type ClassicTimerState = {
  previousRemainingTime: number;
  status: string;
  timerSeconds: number;
};

export const getClassicRemainingTime = ({
  previousRemainingTime,
  status,
  timerSeconds
}: ClassicTimerState) =>
  status === "countdown" ? timerSeconds : previousRemainingTime;
