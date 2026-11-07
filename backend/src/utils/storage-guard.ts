/**
 * Production never starts on storage that a redeploy wipes when it was not
 * asked for: the container's SQLite file (DATABASE_URL missing) or its local
 * upload folder (UPLOAD_PROVIDER=r2 with incomplete R2_* variables). The
 * config files only log these fallbacks, because `strapi build` loads them too;
 * this check runs at server start only. On Railway a failed start fails the
 * deploy's healthcheck, so the previous deployment keeps serving the site
 * instead of an empty database or uploads that vanish on the next deploy.
 *
 * Choosing SQLite or the local disk explicitly (DATABASE_CLIENT=sqlite,
 * UPLOAD_PROVIDER=local) is still allowed, as in the e2e tests.
 */
export const durableStorageProblems = (
  env: Record<string, string | undefined>,
  databaseClient: unknown,
  uploadProvider: unknown,
): string[] => {
  if (env.NODE_ENV !== 'production') return [];
  const problems: string[] = [];
  if (databaseClient === 'sqlite' && !env.DATABASE_CLIENT?.trim()) {
    problems.push('the database fell back to SQLite because DATABASE_URL is not set');
  }
  if (env.UPLOAD_PROVIDER?.trim().toLowerCase() === 'r2' && uploadProvider !== 'aws-s3') {
    problems.push('UPLOAD_PROVIDER=r2 but the R2_* variables are incomplete, so uploads would go to the local disk');
  }
  return problems;
};

export const assertDurableStorage = (strapi: any): void => {
  const problems = durableStorageProblems(
    process.env,
    strapi.config.get('database.connection.client'),
    strapi.config.get('plugin::upload')?.provider,
  );
  if (problems.length) {
    throw new Error(`Refusing to start in production: ${problems.join('; ')}.`);
  }
};
