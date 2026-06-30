const formatter = new Intl.NumberFormat('en-PK', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export const formatPKR = (value) => `PKR ${formatter.format(Number(value) || 0)}`;
export const formatDateTime = (value) => value ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
