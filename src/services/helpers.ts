export const fmtTime = (value: unknown): string => {
  if (!value) return '';

  const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : (value as Date);

  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';

  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const norm = (s?: any) => (s ?? '').toString().trim();

export const normLower = (s?: any) => norm(s).toLowerCase();

export const currentUserId = (auth: any) =>
  [auth?.user?.id, auth?.user?.userId, (auth as any)?.userId]
    .map(norm)
    .find((v) => v !== '');

export const currentUsername = (auth: any) =>
  [auth?.user?.username, auth?.user?.userName, auth?.user?.name, (auth as any)?.username]
    .map(normLower)
    .find((v) => v !== '');