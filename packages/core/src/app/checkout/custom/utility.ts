
export function formatedDate(mmddyyyy: string) {
  if (!mmddyyyy) return '';

  const [month, day, year] = mmddyyyy.split('/').map(Number);

  // IMPORTANT: local date, no UTC parsing
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}