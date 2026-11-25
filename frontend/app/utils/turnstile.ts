/**
 * Cloudflare Turnstile for the request form, loaded only when the form opens
 * and only with NUXT_PUBLIC_TURNSTILE_SITE_KEY set. The widget stays out of
 * sight unless Cloudflare wants the visitor to click (appearance
 * "interaction-only"); its token goes with the request and the dashboard
 * checks it.
 */
type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string | undefined;
  reset: (widget?: string) => void;
  remove: (widget: string) => void;
};

let loading: Promise<TurnstileApi | null> | null = null;

const loadTurnstile = () => {
  loading ??= new Promise((resolve) => {
    const w = window as Window & { turnstile?: TurnstileApi };
    if (w.turnstile) return resolve(w.turnstile);
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve(w.turnstile ?? null);
    script.onerror = () => {
      loading = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return loading;
};

const TOKEN_WAIT_MS = 6_000;

/** One widget: started on an element, asked for its token at submission, reset after it. */
export const createTurnstile = (siteKey: string) => {
  let api: TurnstileApi | null = null;
  let widget = "";
  let token = "";
  let waiting: Array<(value: string) => void> = [];
  const settle = (value: string) => {
    token = value;
    if (!value) return;
    waiting.forEach((resolve) => resolve(value));
    waiting = [];
  };

  return {
    async start(element: HTMLElement) {
      if (!siteKey || widget) return;
      api = await loadTurnstile();
      if (!api || !element.isConnected || widget) return;
      widget = api.render(element, {
        sitekey: siteKey,
        theme: "dark",
        size: "flexible",
        appearance: "interaction-only",
        callback: settle,
        "expired-callback": () => {
          token = "";
          api?.reset(widget);
        },
        "error-callback": () => {
          token = "";
        },
      }) || "";
    },
    /** The token, waiting a few seconds for one; "" without (the request goes without it). */
    token(): Promise<string> {
      if (token || !widget) return Promise.resolve(token);
      return new Promise((resolve) => {
        waiting.push(resolve);
        setTimeout(() => resolve(token), TOKEN_WAIT_MS);
      });
    },
    /** A token is good for one request. */
    reset() {
      token = "";
      if (api && widget) api.reset(widget);
    },
    stop() {
      if (api && widget) api.remove(widget);
      widget = "";
      token = "";
      waiting = [];
    },
  };
};
