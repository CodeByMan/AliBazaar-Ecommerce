const pkrFormatter = new Intl.NumberFormat('en-PK', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatPKR = (value: number | string | null | undefined) => {
  const amount = Number(value);
  return `PKR ${pkrFormatter.format(Number.isFinite(amount) ? amount : 0)}`;
};

export const formatOrderDate = (value: string | Date | null | undefined) => {
  if (!value) return 'Not available';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
