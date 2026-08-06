type LogLevel = 'info' | 'warn' | 'error'

type LogPayload = Record<string, unknown>

/**
 * Structured logger for the Nikela-OS front end.
 *
 * Surfaces never call the console directly; every diagnostic is emitted here so
 * that log shape stays consistent and can be shipped to the platform's
 * observability pipeline without touching call sites.
 */
function emit(level: LogLevel, message: string, payload?: LogPayload): void {
  const record = {
    ts: new Date().toISOString(),
    level,
    scope: 'nikela-os/web',
    message,
    ...(payload ?? {}),
  }

  const serialised = JSON.stringify(record)
  const sink = globalThis.console as
    | {
        info?: (value: string) => void
        warn?: (value: string) => void
        error?: (value: string) => void
      }
    | undefined

  if (level === 'error') {
    sink?.error?.(serialised)
    return
  }
  if (level === 'warn') {
    sink?.warn?.(serialised)
    return
  }
  sink?.info?.(serialised)
}

export const logger = {
  info: (message: string, payload?: LogPayload) => emit('info', message, payload),
  warn: (message: string, payload?: LogPayload) => emit('warn', message, payload),
  error: (message: string, payload?: LogPayload) => emit('error', message, payload),
}
