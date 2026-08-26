type DiagnosticsWindow = Window & { __mscDiagnosticsInstalled?: boolean };

if (typeof window !== "undefined") {
  const w = window as DiagnosticsWindow;
  if (!w.__mscDiagnosticsInstalled) {
    w.__mscDiagnosticsInstalled = true;

    const send = (kind: string, message: string, stack?: string) => {
      const payload = {
        kind: String(kind).slice(0, 40),
        message: String(message || "Unknown client error").slice(0, 1200),
        stack: String(stack || "").slice(0, 5000),
        href: window.location.href.slice(0, 500),
        userAgent: navigator.userAgent.slice(0, 500),
        at: new Date().toISOString(),
      };
      void fetch("/api/diagnostics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener("error", event => {
      const error = event.error as Error | undefined;
      send("window.error", event.message || error?.message || "Unknown error", error?.stack);
    });

    window.addEventListener("unhandledrejection", event => {
      const reason = event.reason;
      if (reason instanceof Error) send("unhandledrejection", reason.message, reason.stack);
      else send("unhandledrejection", String(reason));
    });
  }
}

export {};
