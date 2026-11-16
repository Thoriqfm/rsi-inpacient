const IS_POSTGRES = process.env.DATABASE_URL?.startsWith("postgres");

/**
 * PostgreSQL `contains` in Prisma is case-sensitive unless `mode: "insensitive"` is passed,
 * whereas MySQL Prisma Client rejects `mode`. Select behavior from DATABASE_URL.
 */
export function containsInsensitive(value) {
    return IS_POSTGRES ? { contains: value, mode: "insensitive" } : { contains: value };
}
