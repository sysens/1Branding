// $fetch for the dashboard's API: a lost session goes to /login, a user
// without 2FA to /setup-2fa; errors become one readable line.
import { toast } from "vue-sonner";

type FetchOptions = Parameters<typeof $fetch>[1];

export function apiError(error: unknown): string {
  const e = error as { data?: { message?: string; statusMessage?: string; data?: { issues?: Array<{ message?: string }> } }; statusMessage?: string; message?: string };
  const issue = e?.data?.data?.issues?.[0]?.message;
  return e?.data?.message || issue || e?.statusMessage || e?.message || "Что-то пошло не так";
}

export async function api<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  try {
    return (await $fetch(url, options as never)) as T;
  } catch (error) {
    const status = (error as { statusCode?: number; status?: number })?.statusCode ?? (error as { status?: number })?.status;
    const message = apiError(error);
    if (status === 401 && !url.startsWith("/api/auth/")) await navigateTo("/login");
    else if (status === 403 && message === "2fa_setup_required") await navigateTo("/setup-2fa");
    throw error;
  }
}

/** Runs an action and shows its error as a toast; returns null when it failed. */
export async function attempt<T>(action: () => Promise<T>, success?: string): Promise<T | null> {
  try {
    const result = await action();
    if (success) toast.success(success);
    return result;
  } catch (error) {
    toast.error(apiError(error));
    return null;
  }
}
