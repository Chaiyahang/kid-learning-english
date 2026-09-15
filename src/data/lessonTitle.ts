export function formatDateLabel(date: Date = new Date()): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function buildLessonTitle(dateLabel: string, existingTitles: string[]): string {
  const base = `${dateLabel}复习`;
  if (!existingTitles.includes(base)) return base;
  let suffix = 2;
  while (existingTitles.includes(`${base} ${suffix}`)) suffix += 1;
  return `${base} ${suffix}`;
}
