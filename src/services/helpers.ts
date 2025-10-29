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

export const rcKey = (m: any) =>
  `rc:${normLower(m?.username)}|${norm(m?.content)}`;

export const getInitials = (name?: string): string => {
  if (!name) return "?";
  const clean = name.trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};