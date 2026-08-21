import type { FsEntry } from '../shared/types';
import { formatBytes, formatKind } from './lib/format';

/**
 * "Ask V" — the assistant contract (handoff §2.2).
 *
 * Optional and host-agnostic, exactly like TerminalApi: `<Explorer/>` renders the
 * feature only when one is injected. The standalone app talks to V's brain over
 * its WebSocket; V's own Command Hub would pass an adapter that calls the brain
 * it already has a connection to, rather than opening a second one.
 */
export interface AssistantContext {
  /** The folder the question is being asked from. */
  cwd: string;
  /** The selected rows, if any. */
  selection: FsEntry[];
  /** Everything in view, used only for counts when nothing is selected. */
  visible: FsEntry[];
}

export interface AssistantApi {
  /** Human-readable name of what's on the other end, for the dialog title. */
  readonly name: string;
  /**
   * Ask a question. Reply text streams to `onDelta`; `onDone` fires once with
   * the complete text. Returns a cancel function.
   */
  ask(
    prompt: string,
    context: AssistantContext,
    handlers: {
      onDelta: (chunk: string) => void;
      onDone: (full: string) => void;
      onError: (message: string) => void;
    },
  ): () => void;
}

/**
 * Turn the current selection into something a text-only brain can reason about.
 *
 * Deliberately paths + metadata, never file CONTENTS: sending the bytes of
 * whatever happens to be selected to another process — even a local one — is not
 * a thing a file manager should do without being asked. V can read any of these
 * paths itself if it wants to; it has its own filesystem skills.
 */
export function describeContext(ctx: AssistantContext): string {
  const lines: string[] = [`Folder: ${ctx.cwd}`];

  if (ctx.selection.length > 0) {
    lines.push(`Selected (${ctx.selection.length}):`);
    for (const e of ctx.selection.slice(0, 60)) {
      const size = e.kind === 'dir' ? '' : `, ${formatBytes(e.size)}`;
      lines.push(
        `  - ${e.name} (${formatKind(e)}${size}, modified ${new Date(e.modified).toISOString().slice(0, 10)})`,
      );
    }
    if (ctx.selection.length > 60) lines.push(`  …and ${ctx.selection.length - 60} more`);
  } else {
    const dirs = ctx.visible.filter((e) => e.kind === 'dir' || e.kind === 'junction').length;
    const files = ctx.visible.length - dirs;
    lines.push(`Nothing selected. The folder shows ${dirs} folders and ${files} files.`);
    const sample = ctx.visible.slice(0, 30).map((e) => e.name);
    if (sample.length) lines.push(`Names: ${sample.join(', ')}${ctx.visible.length > 30 ? ', …' : ''}`);
  }

  return lines.join('\n');
}

/**
 * AssistantApi over V's brain WebSocket (`ws://127.0.0.1:8765/ws`).
 *
 * Protocol, from the brain's own reference client (scripts/chat.py):
 *   <- {"type":"hello","payload":{"mode":…}}
 *   -> {"type":"text.in","payload":{"text":…}}
 *   <- {"type":"text.delta","payload":{"text":…}}   (repeats, may be absent)
 *   <- {"type":"text.out","payload":{"text":…}}     (final)
 *   <- {"type":"error","payload":{"message":…}}
 *
 * A fresh socket per question: the brain is a local process that may be started
 * and stopped at will, and a long-lived socket would spend most of its life
 * broken. Connecting takes milliseconds on loopback.
 */
export function createBrainAssistantApi(
  url = 'ws://127.0.0.1:8765/ws',
  token = '',
): AssistantApi {
  return {
    name: 'V',
    ask(prompt, context, { onDelta, onDone, onError }) {
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      const full = new URL(url);
      full.searchParams.set('session', 'onyx');
      if (token) full.searchParams.set('token', token);

      let socket: WebSocket;
      try {
        socket = new WebSocket(full.toString());
      } catch (e) {
        onError(`Could not reach ${url}: ${String(e)}`);
        return () => undefined;
      }

      let text = '';
      let sawDelta = false;

      const timer = setTimeout(() => {
        finish(() => onError(`No reply from V at ${full.host}. Is the brain running?`));
        socket.close();
      }, 60_000);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: 'text.in',
            payload: { text: `${describeContext(context)}\n\nQuestion: ${prompt}` },
          }),
        );
      };

      socket.onmessage = (event) => {
        let msg: { type?: string; payload?: { text?: string; message?: string } };
        try {
          msg = JSON.parse(String(event.data));
        } catch {
          return; // not ours to interpret
        }
        if (msg.type === 'text.delta') {
          sawDelta = true;
          const chunk = msg.payload?.text ?? '';
          text += chunk;
          onDelta(chunk);
        } else if (msg.type === 'text.out') {
          // Without deltas the final message carries the whole reply.
          if (!sawDelta) {
            text = msg.payload?.text ?? '';
            onDelta(text);
          }
          clearTimeout(timer);
          finish(() => onDone(text));
          socket.close();
        } else if (msg.type === 'error') {
          clearTimeout(timer);
          finish(() => onError(msg.payload?.message ?? 'The brain reported an error'));
          socket.close();
        }
      };

      socket.onerror = () => {
        clearTimeout(timer);
        finish(() =>
          onError(`Could not connect to V at ${full.host}. Start the brain with \`uv run python -m brain\`.`),
        );
      };

      socket.onclose = () => {
        clearTimeout(timer);
        // A close before any reply is a failure; after text.out it's routine.
        finish(() => (text ? onDone(text) : onError('V closed the connection before replying.')));
      };

      return () => {
        clearTimeout(timer);
        settled = true;
        socket.close();
      };
    },
  };
}
