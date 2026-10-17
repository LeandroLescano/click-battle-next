export const getRoomStatsDateRange = (
  startDate?: string | null,
  endDate?: string | null
) => ({
  end: endDate ? new Date(`${endDate}T23:59:59.999`) : undefined,
  start: startDate ? new Date(`${startDate}T00:00:00.000`) : undefined
});
