export function getTimeSeriesDataEntryCurrentTime(): string {
  const date = new Date();
  const currentTime = `${date.getHours()}:${date.getMinutes()}`;
  return currentTime;
}

export function getCurrentDataForFileName(): string {
  const date = new Date();
  const currentDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  return currentDate;
}
