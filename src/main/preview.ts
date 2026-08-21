import { promises as fs } from 'node:fs';
import path from 'node:path';
import { mediaUrl, type PreviewKind, type PreviewPayload } from '../shared/types';
import { describeError, normalize } from './fs-service';

/** Read cap for text previews — enough to read, small enough to stay instant. */
const TEXT_CAP = 256 * 1024;

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif', 'svg']);
/** Only formats Chromium can actually decode — no mkv/avi/wmv false promises. */
const VIDEO_EXT = new Set(['mp4', 'webm', 'ogv', 'm4v', 'mov']);
const AUDIO_EXT = new Set(['mp3', 'wav', 'ogg', 'oga', 'flac', 'm4a', 'aac', 'opus']);

/** Extension -> syntax-highlight language hint for the preview pane. */
const LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', mjs: 'javascript',
  cjs: 'javascript', json: 'json', md: 'markdown', css: 'css', scss: 'scss',
  html: 'html', xml: 'xml', yml: 'yaml', yaml: 'yaml', toml: 'toml', ini: 'ini',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java', c: 'c', h: 'c',
  cpp: 'cpp', hpp: 'cpp', cs: 'csharp', php: 'php', sh: 'bash', bash: 'bash',
  ps1: 'powershell', psm1: 'powershell', sql: 'sql', lua: 'lua', swift: 'swift',
  kt: 'kotlin', r: 'r', pl: 'perl', vim: 'vim', dockerfile: 'dockerfile',
};

/** Files with no extension that are still plainly text. */
const TEXT_NAMES = new Set([
  'readme', 'license', 'licence', 'changelog', 'authors', 'contributing',
  'makefile', 'dockerfile', 'procfile', 'gemfile', 'rakefile', 'notice',
  '.gitignore', '.gitattributes', '.npmrc', '.editorconfig', '.env',
  '.eslintrc', '.prettierrc', '.babelrc', '.nvmrc', '.python-version',
]);

const TEXT_EXT = new Set([
  ...Object.keys(LANG),
  'txt', 'log', 'csv', 'tsv', 'gitignore', 'gitattributes', 'env', 'lock',
  'cfg', 'conf', 'properties', 'patch', 'diff', 'srt', 'vtt', 'tex', 'bib',
]);

function classify(name: string, ext: string): PreviewKind {
  if (IMAGE_EXT.has(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (VIDEO_EXT.has(ext)) return 'video';
  if (AUDIO_EXT.has(ext)) return 'audio';
  if (TEXT_EXT.has(ext)) return 'text';
  if (!ext && TEXT_NAMES.has(name.toLowerCase())) return 'text';
  return 'binary';
}

/** A NUL byte in the first block is the standard "this is not text" tell. */
function looksBinary(buf: Buffer): boolean {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

export async function preview(rawPath: string): Promise<PreviewPayload> {
  const p = normalize(rawPath);
  const base: PreviewPayload = { path: p, kind: 'none', size: 0, modified: 0 };

  let st;
  try {
    st = await fs.stat(p);
  } catch (e) {
    return { ...base, error: describeError(e) };
  }
  base.size = st.size;
  base.modified = st.mtimeMs;

  if (st.isDirectory()) {
    try {
      const items = await fs.readdir(p, { withFileTypes: true });
      let dirs = 0;
      let files = 0;
      for (const d of items) (d.isDirectory() ? dirs++ : files++);
      return { ...base, kind: 'dir', childCount: { dirs, files } };
    } catch (e) {
      return { ...base, kind: 'dir', error: describeError(e) };
    }
  }

  const name = path.win32.basename(p);
  const ext = (path.win32.extname(name).slice(1) || '').toLowerCase();
  const kind = classify(name, ext);

  try {
    switch (kind) {
      case 'image':
      case 'pdf':
      case 'video':
      case 'audio':
        // Streamed by Chromium straight off disk — never loaded into a string.
        return { ...base, kind, src: mediaUrl(p) };
      case 'text': {
        const handle = await fs.open(p, 'r');
        try {
          const buf = Buffer.alloc(Math.min(st.size, TEXT_CAP));
          const { bytesRead } = await handle.read(buf, 0, buf.length, 0);
          const slice = buf.subarray(0, bytesRead);
          if (looksBinary(slice)) return { ...base, kind: 'binary' };
          return {
            ...base,
            kind: 'text',
            text: slice.toString('utf8'),
            truncated: st.size > TEXT_CAP,
            lang: LANG[ext],
          };
        } finally {
          // Never hold a handle open on something the user may want to rename
          // or delete a second later (handoff §9.12).
          await handle.close();
        }
      }
      default:
        return { ...base, kind: 'binary' };
    }
  } catch (e) {
    return { ...base, kind, error: describeError(e) };
  }
}
