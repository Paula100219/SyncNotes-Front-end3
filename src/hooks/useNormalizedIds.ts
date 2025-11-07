import { useMemo } from 'react';

export const useNormalizedIds = (auth: any, roomDetails: any) => {
  const myId = useMemo(
    () => auth?.user?.id ?? auth?.user?._id ?? auth?.user?.userId ?? null,
    [auth?.user]
  );

  const ownerId = useMemo(
    () =>
      roomDetails?.ownerId ??
      roomDetails?.owner?.id ??
      roomDetails?.owner?._id ??
      roomDetails?.createdBy?.id ??
      roomDetails?.createdBy?._id ??
      null,
    [roomDetails]
  );

  const members = roomDetails?.members ?? [];

  return { myId, ownerId, members };
};