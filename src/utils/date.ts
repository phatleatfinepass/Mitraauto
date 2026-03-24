function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function formatDateForSupabase(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

