// The database's start-up (connect, migrate, seed) as one promise that
// requests and scheduled jobs wait for.
let ready: Promise<void> | null = null;

export function setDatabaseReady(promise: Promise<void>) {
  ready = promise;
  promise.catch((error) => console.error("[db] start-up failed", error));
}

export async function databaseReady() {
  if (!ready) throw new Error("Database start-up has not begun");
  await ready;
}
