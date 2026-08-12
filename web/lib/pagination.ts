export function skipTake(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}

export function paginate<T>(data: T[], total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data,
    page,
    pageSize: limit,
    total,
    totalPages,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}
