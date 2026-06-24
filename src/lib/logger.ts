// Logger strutturato minimale.
//
// Wrapper sottile su `console` che emette JSON con livello, messaggio, timestamp e
// contesto opzionale. Centralizza il logging server-side (route API, error boundary)
// così da poter in seguito instradare verso un servizio esterno (Sentry, Logtail…)
// senza toccare i call site. In dev resta leggibile su console.

type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

function emit(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
  const entry: Record<string, unknown> = {
    level,
    message,
    time: new Date().toISOString(),
  };
  if (context) entry.context = context;
  if (error instanceof Error) {
    entry.error = { name: error.name, message: error.message, stack: error.stack };
  } else if (error !== undefined) {
    entry.error = error;
  }

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, error?: unknown, context?: LogContext) =>
    emit("error", message, context, error),
};
