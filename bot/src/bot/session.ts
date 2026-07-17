interface Session {
  step: 'idle' | string;
  data: Record<string, unknown>;
}

const sessions = new Map<string, Session>();

export function getSession(noWa: string): Session {
  if (!sessions.has(noWa)) {
    sessions.set(noWa, { step: 'idle', data: {} });
  }
  return sessions.get(noWa)!;
}

export function setSession(noWa: string, s: Session) {
  sessions.set(noWa, s);
}

export function clearSession(noWa: string) {
  sessions.delete(noWa);
}
