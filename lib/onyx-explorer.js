import { jsxs as W, jsx as S, Fragment as Ot } from "react/jsx-runtime";
import xo, { useState as Q, useCallback as ae, useRef as Re, useLayoutEffect as bc, useEffect as me, useMemo as Lt, useReducer as yc } from "react";
const Uo = ["B", "KB", "MB", "GB", "TB", "PB"];
function Xt(e) {
  if (!Number.isFinite(e) || e < 0) return "";
  if (e === 0) return "0 B";
  const t = Math.min(Uo.length - 1, Math.floor(Math.log(e) / Math.log(1024))), s = e / 1024 ** t, r = t === 0 ? 0 : s < 10 ? 1 : 0;
  return `${s.toFixed(r)} ${Uo[t]}`;
}
const Cc = new Intl.DateTimeFormat(void 0, { hour: "2-digit", minute: "2-digit" }), xc = new Intl.DateTimeFormat(void 0, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
function kc(e) {
  if (!e) return "";
  const t = new Date(e), s = /* @__PURE__ */ new Date();
  return t.getFullYear() === s.getFullYear() && t.getMonth() === s.getMonth() && t.getDate() === s.getDate() ? Cc.format(t) : xc.format(t);
}
function Lc(e) {
  return e ? new Date(e).toLocaleString() : "";
}
const Mc = {
  dir: "Folder",
  file: "File",
  symlink: "Shortcut",
  junction: "Junction",
  unknown: ""
};
function Gl(e) {
  return e.kind !== "file" ? Mc[e.kind] : e.ext ? `${e.ext.toUpperCase()} file` : "File";
}
function Ec(e) {
  if (!e) return [];
  const t = /^(\\\\[^\\]+\\[^\\]+)(\\.*)?$/.exec(e);
  let s, r;
  t ? (s = t[1], r = (t[2] ?? "").replace(/^\\/, "")) : (s = e.slice(0, 3), r = e.slice(3));
  const n = [{ label: s.replace(/\\$/, "") || s, path: s }];
  if (!r) return n;
  let o = s.endsWith("\\") ? s.slice(0, -1) : s;
  for (const a of r.split("\\").filter(Boolean))
    o = `${o}\\${a}`, n.push({ label: a, path: o });
  return n;
}
function Pt(e) {
  const t = e.replace(/\\+$/, ""), s = t.lastIndexOf("\\");
  return s === -1 ? t : t.slice(s + 1) || t;
}
let Ko = 0;
function Tr(e = "p") {
  return Ko += 1, `${e}${Date.now().toString(36)}${Ko.toString(36)}`;
}
function ko(e, t = "name") {
  return {
    type: "leaf",
    id: Tr(),
    path: e,
    history: [e],
    historyIndex: 0,
    sortKey: t,
    sortDir: "asc",
    viewMode: "details",
    filter: ""
  };
}
function Ti(e) {
  return e.type === "leaf" ? [e] : [...Ti(e.a), ...Ti(e.b)];
}
function Ui(e, t) {
  return e.type === "leaf" ? e.id === t ? e : null : Ui(e.a, t) ?? Ui(e.b, t);
}
function Sn(e) {
  return e.type === "leaf" ? e : Sn(e.a);
}
function bn(e, t, s) {
  if (e.type === "leaf") return e.id === t ? s(e) : e;
  const r = bn(e.a, t, s), n = bn(e.b, t, s);
  return r === e.a && n === e.b ? e : { ...e, a: r, b: n };
}
function Dc(e, t, s, r) {
  let n = null;
  const o = (a) => {
    if (a.type === "leaf")
      return a.id !== t ? a : (n = ko(r, a.sortKey), { type: "split", id: Tr("s"), dir: s, ratio: 0.5, a, b: n });
    const l = o(a.a), c = l === a.a ? o(a.b) : a.b;
    return l === a.a && c === a.b ? a : { ...a, a: l, b: c };
  };
  return { tree: o(e), created: n };
}
function yn(e, t) {
  if (e.type === "leaf") return e.id === t ? null : e;
  const s = yn(e.a, t), r = yn(e.b, t);
  return s === null ? r : r === null ? s : s === e.a && r === e.b ? e : { ...e, a: s, b: r };
}
function Cn(e, t, s) {
  if (e.type === "leaf") return e;
  if (e.id === t)
    return { ...e, ratio: Math.min(0.9, Math.max(0.1, s)) };
  const r = Cn(e.a, t, s), n = Cn(e.b, t, s);
  return r === e.a && n === e.b ? e : { ...e, a: r, b: n };
}
function Rc(e, t) {
  if (e.path === t) return e;
  const s = [...e.history.slice(0, e.historyIndex + 1), t], r = s.length > 200 ? s.slice(s.length - 200) : s;
  return {
    ...e,
    path: t,
    history: r,
    historyIndex: r.length - 1,
    // A filter belongs to the folder you typed it in, not to the pane forever.
    filter: ""
  };
}
function Vo(e) {
  if (e.historyIndex <= 0) return e;
  const t = e.historyIndex - 1;
  return { ...e, historyIndex: t, path: e.history[t], filter: "" };
}
function qo(e) {
  if (e.historyIndex >= e.history.length - 1) return e;
  const t = e.historyIndex + 1;
  return { ...e, historyIndex: t, path: e.history[t], filter: "" };
}
function Tc(e, t) {
  const s = Ti(e);
  if (s.length < 2) return null;
  const r = s.findIndex((n) => n.id === t);
  return r === -1 ? null : s[(r + 1) % s.length].id;
}
const Bc = {
  folder: "M1.5 3.5h4l1.5 2h7.5v8h-13z",
  "folder-link": "M1.5 3.5h4l1.5 2h7.5v8h-13z M6 9.5h4 M8.5 8l1.5 1.5-1.5 1.5",
  file: "M3.5 1.5h6l3 3v10h-9z M9.5 1.5v3h3",
  image: "M2 3h12v10H2z M4.5 7.5a1 1 0 100-2 1 1 0 000 2z M2 11l3.5-3 3 2.5L11 8l3 3",
  code: "M5.5 5L2.5 8l3 3 M10.5 5l3 3-3 3 M9.5 3.5l-3 9",
  text: "M3.5 1.5h6l3 3v10h-9z M9.5 1.5v3h3 M5.5 8h5 M5.5 10.5h5",
  archive: "M2 3h12v3H2z M3 6v8h10V6 M7 8.5h2",
  video: "M2 4h9v8H2z M11 7l3-2v6l-3-2z",
  audio: "M6 10V3l6-1.5v7 M6 12a2 2 0 11-4 0 2 2 0 014 0z M14 10.5a2 2 0 11-4 0 2 2 0 014 0z",
  pdf: "M3.5 1.5h6l3 3v10h-9z M9.5 1.5v3h3 M5.5 9.5h1.5a1 1 0 000-2H5.5v4",
  link: "M6.5 9.5a3 3 0 004.2 0l2.1-2.1a3 3 0 10-4.2-4.2L7.5 4.3 M9.5 6.5a3 3 0 00-4.2 0L3.2 8.6a3 3 0 104.2 4.2l1.1-1.1",
  drive: "M2 8h12v5H2z M3.5 8V3.5h9V8 M4.5 10.5h2",
  star: "M8 1.8l1.9 4 4.3.6-3.1 3 .7 4.3L8 11.7l-3.8 2 .7-4.3-3.1-3 4.3-.6z",
  back: "M10 3.5L5.5 8l4.5 4.5",
  forward: "M6 3.5L10.5 8 6 12.5",
  up: "M3.5 10L8 5.5l4.5 4.5",
  refresh: "M13 8a5 5 0 11-1.6-3.7 M13 2v3h-3",
  "split-h": "M2 3h12v10H2z M8 3v10",
  "split-v": "M2 3h12v10H2z M2 8h12",
  close: "M4 4l8 8 M12 4l-8 8",
  minimize: "M3.5 8h9",
  maximize: "M3.5 3.5h9v9h-9z",
  restore: "M5.5 5.5V3.5h7v7h-2 M3.5 5.5h7v7h-7z",
  search: "M11.5 11.5L14 14 M12.5 7a5 5 0 11-10 0 5 5 0 0110 0z",
  settings: "M8 10a2 2 0 100-4 2 2 0 000 4z M8 1.5v2 M8 12.5v2 M1.5 8h2 M12.5 8h2 M3.4 3.4l1.4 1.4 M11.2 11.2l1.4 1.4 M12.6 3.4l-1.4 1.4 M4.8 11.2l-1.4 1.4",
  plus: "M8 3.5v9 M3.5 8h9",
  terminal: "M2 3h12v10H2z M4.5 6l2 2-2 2 M8.5 10.5h3",
  "chevron-right": "M6.5 4.5L10 8l-3.5 3.5",
  eye: "M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z M9.75 8a1.75 1.75 0 11-3.5 0 1.75 1.75 0 013.5 0z"
};
function Yt({ name: e, size: t = 14 }) {
  return /* @__PURE__ */ S(
    "svg",
    {
      width: t,
      height: t,
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.25,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      children: Bc[e].split(" M").map((s, r) => /* @__PURE__ */ S("path", { d: r === 0 ? s : `M${s}` }, r))
    }
  );
}
const Pc = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  bmp: "image",
  svg: "image",
  ico: "image",
  avif: "image",
  mp4: "video",
  webm: "video",
  mkv: "video",
  mov: "video",
  avi: "video",
  m4v: "video",
  mp3: "audio",
  wav: "audio",
  flac: "audio",
  ogg: "audio",
  m4a: "audio",
  aac: "audio",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  xz: "archive",
  pdf: "pdf",
  ts: "code",
  tsx: "code",
  js: "code",
  jsx: "code",
  json: "code",
  py: "code",
  rs: "code",
  go: "code",
  java: "code",
  c: "code",
  cpp: "code",
  cs: "code",
  rb: "code",
  php: "code",
  sh: "code",
  ps1: "code",
  html: "code",
  css: "code",
  yml: "code",
  yaml: "code",
  toml: "code",
  xml: "code",
  sql: "code",
  txt: "text",
  md: "text",
  log: "text",
  csv: "text",
  ini: "text",
  cfg: "text"
};
function Yo(e, t) {
  return e === "dir" ? "folder" : e === "junction" ? "folder-link" : e === "symlink" ? "link" : Pc[t] ?? "file";
}
function Ac({
  x: e,
  y: t,
  items: s,
  onClose: r
}) {
  const n = Re(null), [o, a] = Q({ x: e, y: t });
  return bc(() => {
    const l = n.current;
    if (!l) return;
    const c = l.getBoundingClientRect();
    a({
      x: e + c.width > window.innerWidth ? Math.max(0, window.innerWidth - c.width - 4) : e,
      y: t + c.height > window.innerHeight ? Math.max(0, window.innerHeight - c.height - 4) : t
    });
  }, [e, t]), me(() => {
    const l = () => r(), c = (h) => {
      h.key === "Escape" && r();
    };
    return window.addEventListener("mousedown", l, !0), window.addEventListener("resize", l), window.addEventListener("keydown", c, !0), () => {
      window.removeEventListener("mousedown", l, !0), window.removeEventListener("resize", l), window.removeEventListener("keydown", c, !0);
    };
  }, [r]), /* @__PURE__ */ S(
    "div",
    {
      ref: n,
      className: "ctxmenu",
      style: { left: o.x, top: o.y },
      onMouseDown: (l) => l.stopPropagation(),
      onContextMenu: (l) => l.preventDefault(),
      children: s.map(
        (l, c) => l.separator ? /* @__PURE__ */ S("div", { className: "ctxmenu__sep" }, c) : /* @__PURE__ */ W(
          "button",
          {
            type: "button",
            className: `ctxmenu__item${l.danger ? " ctxmenu__item--danger" : ""}`,
            disabled: l.disabled,
            onClick: () => {
              var h;
              r(), (h = l.onClick) == null || h.call(l);
            },
            children: [
              /* @__PURE__ */ S("span", { children: l.label }),
              l.accel && /* @__PURE__ */ S("span", { className: "ctxmenu__key", children: l.accel })
            ]
          },
          c
        )
      )
    }
  );
}
function Hs({
  title: e,
  children: t,
  footer: s,
  onClose: r,
  wide: n
}) {
  return me(() => {
    const o = (a) => {
      a.key === "Escape" && (a.stopPropagation(), r());
    };
    return window.addEventListener("keydown", o, !0), () => window.removeEventListener("keydown", o, !0);
  }, [r]), /* @__PURE__ */ S("div", { className: "overlay", onMouseDown: r, children: /* @__PURE__ */ W(
    "div",
    {
      className: `modal${n ? " settings" : ""}`,
      onMouseDown: (o) => o.stopPropagation(),
      role: "dialog",
      "aria-modal": "true",
      "aria-label": e,
      children: [
        /* @__PURE__ */ S("div", { className: "modal__title", children: e }),
        /* @__PURE__ */ S("div", { className: "modal__body", children: t }),
        /* @__PURE__ */ S("div", { className: "modal__foot", children: s })
      ]
    }
  ) });
}
function Nc() {
  const [e, t] = Q(null), s = ae(
    (l) => new Promise((c) => {
      t({ ...l, kind: "ask", resolve: c });
    }),
    []
  ), r = ae(
    (l) => new Promise((c) => {
      t({ ...l, kind: "confirm", resolve: c });
    }),
    []
  ), n = ae(
    (l) => new Promise((c) => {
      t({ ...l, kind: "choose", resolve: c });
    }),
    []
  ), o = ae(
    (l) => {
      e == null || e.resolve(l), t(null);
    },
    [e]
  );
  let a = null;
  return (e == null ? void 0 : e.kind) === "ask" ? a = /* @__PURE__ */ S(Oc, { req: e, onDone: (l) => o(l) }, "ask") : (e == null ? void 0 : e.kind) === "confirm" && (a = /* @__PURE__ */ W(
    Hs,
    {
      title: e.title,
      onClose: () => o(!1),
      footer: /* @__PURE__ */ W(Ot, { children: [
        /* @__PURE__ */ S("button", { type: "button", className: "btn", onClick: () => o(!1), children: "Cancel" }),
        /* @__PURE__ */ S(
          "button",
          {
            type: "button",
            className: `btn ${e.danger ? "btn--danger" : "btn--primary"}`,
            onClick: () => o(!0),
            autoFocus: !0,
            children: e.confirmLabel
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ S("p", { className: "modal__message", children: e.message }),
        e.items && e.items.length > 0 && /* @__PURE__ */ W("ul", { className: "modal__list", children: [
          e.items.slice(0, 40).map((l) => /* @__PURE__ */ S("li", { children: l }, l)),
          e.items.length > 40 && /* @__PURE__ */ W("li", { children: [
            "…and ",
            e.items.length - 40,
            " more"
          ] })
        ] })
      ]
    }
  )), (e == null ? void 0 : e.kind) === "choose" && (a = /* @__PURE__ */ W(
    Hs,
    {
      title: e.title,
      onClose: () => o(null),
      footer: /* @__PURE__ */ W(Ot, { children: [
        /* @__PURE__ */ S("button", { type: "button", className: "btn", onClick: () => o(null), children: "Cancel" }),
        e.choices.map((l) => /* @__PURE__ */ S(
          "button",
          {
            type: "button",
            className: `btn${l.primary ? " btn--primary" : ""}${l.danger ? " btn--danger" : ""}`,
            title: l.hint,
            onClick: () => o(l.id),
            children: l.label
          },
          l.id
        ))
      ] }),
      children: [
        /* @__PURE__ */ S("p", { className: "modal__message", children: e.message }),
        e.items && e.items.length > 0 && /* @__PURE__ */ W("ul", { className: "modal__list", children: [
          e.items.slice(0, 40).map((l) => /* @__PURE__ */ S("li", { children: l }, l)),
          e.items.length > 40 && /* @__PURE__ */ W("li", { children: [
            "…and ",
            e.items.length - 40,
            " more"
          ] })
        ] }),
        /* @__PURE__ */ S("dl", { className: "preview__meta", style: { border: "none", padding: 0 }, children: e.choices.filter((l) => l.hint).map((l) => /* @__PURE__ */ W(xo.Fragment, { children: [
          /* @__PURE__ */ S("dt", { children: l.label }),
          /* @__PURE__ */ S("dd", { children: l.hint })
        ] }, l.id)) })
      ]
    }
  )), { ask: s, confirm: r, choose: n, node: a };
}
function Oc({
  req: e,
  onDone: t
}) {
  const [s, r] = Q(e.initial), [n, o] = Q(null), a = Re(null);
  me(() => {
    const c = a.current;
    if (!c) return;
    c.focus();
    const h = e.selectStem ? e.initial.lastIndexOf(".") : -1;
    h > 0 ? c.setSelectionRange(0, h) : c.select();
  }, [e.initial, e.selectStem]);
  const l = () => {
    var h;
    const c = ((h = e.validate) == null ? void 0 : h.call(e, s)) ?? null;
    if (c) {
      o(c);
      return;
    }
    t(s);
  };
  return /* @__PURE__ */ W(
    Hs,
    {
      title: e.title,
      onClose: () => t(null),
      footer: /* @__PURE__ */ W(Ot, { children: [
        /* @__PURE__ */ S("button", { type: "button", className: "btn", onClick: () => t(null), children: "Cancel" }),
        /* @__PURE__ */ S("button", { type: "button", className: "btn btn--primary", onClick: l, children: e.confirmLabel })
      ] }),
      children: [
        e.label && /* @__PURE__ */ S("p", { className: "modal__message", children: e.label }),
        /* @__PURE__ */ S(
          "input",
          {
            ref: a,
            className: "modal__input",
            value: s,
            spellCheck: !1,
            onChange: (c) => {
              r(c.target.value), o(null);
            },
            onKeyDown: (c) => {
              c.key === "Enter" && (c.preventDefault(), l());
            }
          }
        ),
        /* @__PURE__ */ S("div", { className: "modal__error", children: n })
      ]
    }
  );
}
const Ic = /[<>:"/\\|?*\u0000-\u001f]/;
function Fc({
  entries: e,
  onApply: t,
  onClose: s
}) {
  const [r, n] = Q(""), [o, a] = Q(""), [l, c] = Q(!1), [h, d] = Q("none"), [u, f] = Q(""), [_, g] = Q(2), { rows: y, error: D, changedCount: R } = Lt(() => {
    let M = null;
    if (r && l)
      try {
        M = new RegExp(r, "g");
      } catch (Z) {
        return { rows: [], error: `Invalid pattern: ${Z.message}`, changedCount: 0 };
      }
    const k = u.trim() === "" ? null : Number(u);
    if (k !== null && !Number.isFinite(k))
      return { rows: [], error: "Start number must be a number", changedCount: 0 };
    const B = /* @__PURE__ */ new Map(), U = e.map((Z, _e) => {
      const Y = Z.kind === "file" ? Z.name.lastIndexOf(".") : -1;
      let v = Y > 0 ? Z.name.slice(0, Y) : Z.name;
      const p = Y > 0 ? Z.name.slice(Y) : "";
      switch (r && (v = M ? v.replace(M, o) : v.split(r).join(o)), h) {
        case "lower":
          v = v.toLowerCase();
          break;
        case "upper":
          v = v.toUpperCase();
          break;
        case "title":
          v = v.replace(/\b\w/g, (b) => b.toUpperCase());
          break;
      }
      k !== null && (v = `${v}${String(k + _e).padStart(_, "0")}`);
      const w = `${v}${p}`, m = w.toLowerCase();
      return B.set(m, (B.get(m) ?? 0) + 1), { entry: Z, newName: w, key: m };
    }).map((Z) => ({
      ...Z,
      // Windows filenames are case-insensitive, so "A.txt" and "a.txt" collide.
      duplicate: (B.get(Z.key) ?? 0) > 1,
      illegal: !Z.newName.trim() || Ic.test(Z.newName) || Z.newName.endsWith(".")
    })), ie = U.find((Z) => Z.duplicate || Z.illegal);
    return {
      rows: U,
      error: ie ? ie.illegal ? `"${ie.newName}" is not a valid filename` : `"${ie.newName}" would collide with another renamed file` : null,
      changedCount: U.filter((Z) => Z.newName !== Z.entry.name).length
    };
  }, [e, r, o, l, h, u, _]), H = () => {
    D || R === 0 || t(
      y.filter((M) => M.newName !== M.entry.name).map((M) => ({ path: M.entry.path, newName: M.newName }))
    );
  };
  return /* @__PURE__ */ W(
    Hs,
    {
      title: `Batch rename — ${e.length} item${e.length === 1 ? "" : "s"}`,
      onClose: s,
      wide: !0,
      footer: /* @__PURE__ */ W(Ot, { children: [
        /* @__PURE__ */ S("button", { type: "button", className: "btn", onClick: s, children: "Cancel" }),
        /* @__PURE__ */ W(
          "button",
          {
            type: "button",
            className: "btn btn--primary",
            disabled: !!D || R === 0,
            onClick: H,
            children: [
              "Rename ",
              R || ""
            ]
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ W("div", { className: "rename__grid", children: [
          /* @__PURE__ */ S("label", { htmlFor: "br-find", children: "Find" }),
          /* @__PURE__ */ S(
            "input",
            {
              id: "br-find",
              className: "modal__input",
              value: r,
              spellCheck: !1,
              placeholder: l ? "(\\d+)" : "text to replace",
              onChange: (M) => n(M.target.value)
            }
          ),
          /* @__PURE__ */ S("label", { htmlFor: "br-replace", children: "Replace" }),
          /* @__PURE__ */ S(
            "input",
            {
              id: "br-replace",
              className: "modal__input",
              value: o,
              spellCheck: !1,
              placeholder: l ? "$1" : "replacement",
              onChange: (M) => a(M.target.value)
            }
          ),
          /* @__PURE__ */ S("label", { htmlFor: "br-case", children: "Options" }),
          /* @__PURE__ */ W("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ S(
              "button",
              {
                type: "button",
                className: `search__toggle${l ? " search__toggle--on" : ""}`,
                onClick: () => c((M) => !M),
                title: "Treat Find as a regular expression ($1 in Replace inserts a group)",
                children: "Regex"
              }
            ),
            /* @__PURE__ */ W(
              "select",
              {
                id: "br-case",
                className: "modal__input",
                style: { width: 120 },
                value: h,
                onChange: (M) => d(M.target.value),
                children: [
                  /* @__PURE__ */ S("option", { value: "none", children: "Keep case" }),
                  /* @__PURE__ */ S("option", { value: "lower", children: "lowercase" }),
                  /* @__PURE__ */ S("option", { value: "upper", children: "UPPERCASE" }),
                  /* @__PURE__ */ S("option", { value: "title", children: "Title Case" })
                ]
              }
            ),
            /* @__PURE__ */ S(
              "input",
              {
                className: "modal__input",
                style: { width: 108 },
                value: u,
                placeholder: "number from",
                onChange: (M) => f(M.target.value),
                title: "Append a sequential number starting at this value"
              }
            ),
            /* @__PURE__ */ S(
              "input",
              {
                className: "modal__input",
                style: { width: 64 },
                type: "number",
                min: 1,
                max: 8,
                value: _,
                onChange: (M) => g(Number(M.target.value) || 1),
                title: "Digits to pad the number to"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ S("div", { className: "rename__preview", children: y.map((M) => /* @__PURE__ */ W("div", { className: "rename__row", children: [
          /* @__PURE__ */ S("span", { className: "rename__from", title: M.entry.name, children: M.entry.name }),
          /* @__PURE__ */ S("span", { className: "rename__arrow", children: "→" }),
          /* @__PURE__ */ S(
            "span",
            {
              className: [
                "rename__to",
                M.newName === M.entry.name ? "rename__to--same" : "",
                M.duplicate || M.illegal ? "rename__to--bad" : ""
              ].filter(Boolean).join(" "),
              title: M.newName,
              children: M.newName
            }
          )
        ] }, M.entry.path)) }),
        /* @__PURE__ */ S("div", { className: "modal__error", children: D })
      ]
    }
  );
}
const zc = /* @__PURE__ */ new Set(["\\", "/", " ", "-", "_", ".", ":"]);
function Wc(e, t) {
  if (!e) return { score: 0, positions: [] };
  const s = e.toLowerCase(), r = t.toLowerCase(), n = [];
  let o = 0, a = 0, l = 0;
  for (let c = 0; c < s.length; c++) {
    const h = s[c];
    if (h === " ") {
      l = 0;
      continue;
    }
    let d = -1;
    for (let u = a; u < r.length; u++)
      if (r[u] === h) {
        d = u;
        break;
      }
    if (d === -1) return null;
    d === 0 ? o += 15 : zc.has(r[d - 1]) ? o += 10 : t[d] >= "A" && t[d] <= "Z" && (o += 6), d === a && c > 0 ? (l += 1, o += 5 + l * 2) : l = 0, o -= Math.min(d - a, 10) * 0.5, n.push(d), a = d + 1;
  }
  return o -= r.length * 0.05, { score: o, positions: n };
}
function $c(e, t, s, r = 50) {
  const n = [];
  for (const o of t) {
    const a = Wc(e, s(o));
    a && n.push({ item: o, match: a });
  }
  return n.sort((o, a) => a.match.score - o.match.score), n.slice(0, r);
}
function Hc({ text: e, positions: t }) {
  if (t.length === 0) return /* @__PURE__ */ S(Ot, { children: e });
  const s = new Set(t);
  return /* @__PURE__ */ S(Ot, { children: [...e].map(
    (r, n) => s.has(n) ? /* @__PURE__ */ S("span", { className: "palette__match", children: r }, n) : /* @__PURE__ */ S(xo.Fragment, { children: r }, n)
  ) });
}
function jo({
  placeholder: e,
  items: t,
  resolveExtra: s,
  onClose: r
}) {
  const [n, o] = Q(""), [a, l] = Q(0), [c, h] = Q([]), d = Re(null);
  me(() => {
    const _ = (g) => {
      g.key === "Escape" && (g.preventDefault(), g.stopPropagation(), r());
    };
    return window.addEventListener("keydown", _, !0), () => window.removeEventListener("keydown", _, !0);
  }, [r]), me(() => {
    if (!s) return;
    let _ = !1;
    const g = setTimeout(() => {
      s(n).then((y) => {
        _ || h(y);
      });
    }, 140);
    return () => {
      _ = !0, clearTimeout(g);
    };
  }, [n, s]);
  const u = Lt(() => {
    const _ = $c(n, t, (g) => g.label, 60);
    return [
      ...c.map((g) => ({ item: g, match: { score: 1 / 0, positions: [] } })),
      ..._
    ];
  }, [n, t, c]);
  me(() => l(0), [n, c]), me(() => {
    var _, g;
    (g = (_ = d.current) == null ? void 0 : _.querySelector(".palette__item--active")) == null || g.scrollIntoView({ block: "nearest" });
  }, [a]);
  const f = (_) => {
    const g = u[_];
    g && (r(), g.item.run());
  };
  return /* @__PURE__ */ S("div", { className: "overlay", onMouseDown: r, children: /* @__PURE__ */ W("div", { className: "palette", onMouseDown: (_) => _.stopPropagation(), children: [
    /* @__PURE__ */ S(
      "input",
      {
        className: "palette__input",
        autoFocus: !0,
        spellCheck: !1,
        placeholder: e,
        value: n,
        onChange: (_) => o(_.target.value),
        onKeyDown: (_) => {
          switch (_.stopPropagation(), _.key) {
            case "ArrowDown":
              _.preventDefault(), l((g) => Math.min(u.length - 1, g + 1));
              break;
            case "ArrowUp":
              _.preventDefault(), l((g) => Math.max(0, g - 1));
              break;
            case "Enter":
              _.preventDefault(), f(a);
              break;
            case "Escape":
              _.preventDefault(), r();
              break;
          }
        }
      }
    ),
    /* @__PURE__ */ S("div", { className: "palette__list", ref: d, children: u.length === 0 ? /* @__PURE__ */ S("div", { className: "palette__empty", children: "No matches" }) : u.map((_, g) => /* @__PURE__ */ W(
      "button",
      {
        type: "button",
        className: `palette__item${g === a ? " palette__item--active" : ""}`,
        onMouseEnter: () => l(g),
        onClick: () => f(g),
        children: [
          /* @__PURE__ */ S("span", { className: "palette__label", children: /* @__PURE__ */ S(Hc, { text: _.item.label, positions: _.match.positions }) }),
          _.item.hint && /* @__PURE__ */ S("span", { className: "palette__hint", children: _.item.hint })
        ]
      },
      _.item.id
    )) })
  ] }) });
}
const Uc = {
  b: 1,
  k: 1024,
  kb: 1024,
  m: 1024 ** 2,
  mb: 1024 ** 2,
  g: 1024 ** 3,
  gb: 1024 ** 3,
  t: 1024 ** 4,
  tb: 1024 ** 4
};
function Kc(e) {
  const t = [], s = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let r;
  for (; (r = s.exec(e)) !== null; )
    t.push(r[1] ?? r[2] ?? r[3] ?? "");
  return t.filter(Boolean);
}
function Vc(e) {
  const t = /^(>=|<=|>|<|=)?\s*([\d.]+)\s*([a-z]*)$/i.exec(e.trim());
  if (!t) return null;
  const s = t[1] ?? "=", r = Number(t[2]);
  if (!Number.isFinite(r)) return null;
  const n = Uc[(t[3] || "b").toLowerCase()];
  if (!n) return null;
  const o = r * n;
  switch (s) {
    case ">":
      return (a) => a.size > o;
    case ">=":
      return (a) => a.size >= o;
    case "<":
      return (a) => a.size < o;
    case "<=":
      return (a) => a.size <= o;
    default:
      return (a) => Math.abs(a.size - o) <= Math.max(1024, o * 0.01);
  }
}
function rs(e = 0) {
  const t = /* @__PURE__ */ new Date();
  return t.setHours(0, 0, 0, 0), t.setDate(t.getDate() - e), t.getTime();
}
function qc(e) {
  const t = e.trim().toLowerCase();
  switch (t) {
    case "today":
      return (n) => n.modified >= rs(0);
    case "yesterday":
      return (n) => n.modified >= rs(1) && n.modified < rs(0);
    case "week":
      return (n) => n.modified >= rs(7);
    case "month":
      return (n) => n.modified >= rs(30);
    case "year":
      return (n) => n.modified >= rs(365);
  }
  const s = /^(>=|<=|>|<)?\s*(\d{4}-\d{2}-\d{2})$/.exec(t);
  if (!s) return null;
  const r = Date.parse(s[2]);
  if (Number.isNaN(r)) return null;
  switch (s[1]) {
    case "<":
    case "<=":
      return (n) => n.modified <= r + 864e5;
    default:
      return (n) => n.modified >= r;
  }
}
function Yc(e) {
  switch (e.trim().toLowerCase()) {
    case "dir":
    case "folder":
      return (t) => t.kind === "dir" || t.kind === "junction";
    case "file":
      return (t) => t.kind === "file";
    case "link":
    case "symlink":
      return (t) => t.kind === "symlink" || t.kind === "junction";
    default:
      return null;
  }
}
function Go(e) {
  const t = e.toLowerCase();
  return (s) => s.name.toLowerCase().includes(t);
}
function jc(e) {
  let t = !1, s = e;
  s.startsWith("-") && s.length > 1 && (t = !0, s = s.slice(1));
  const r = s.indexOf(":");
  let n = null;
  if (r > 0) {
    const o = s.slice(0, r).toLowerCase(), a = s.slice(r + 1);
    switch (o) {
      case "ext": {
        const l = new Set(
          a.toLowerCase().split(",").map((c) => c.replace(/^\./, "").trim()).filter(Boolean)
        );
        n = l.size ? (c) => l.has(c.ext) : null;
        break;
      }
      case "size":
        n = Vc(a);
        break;
      case "mod":
      case "modified":
        n = qc(a);
        break;
      case "type":
        n = Yc(a);
        break;
      case "name":
        n = Go(a);
        break;
      default:
        n = null;
    }
  }
  return n || (n = Go(s)), t ? (o) => !n(o) : n;
}
function Gc(e) {
  const t = Kc(e);
  if (t.length === 0) return null;
  const s = t.map(jc);
  return (r) => s.every((n) => n(r));
}
const Fr = new Intl.Collator(void 0, { numeric: !0, sensitivity: "base" });
function Xc(e, t, s, r) {
  const n = s === "asc" ? 1 : -1, o = (a) => a.kind === "dir" || a.kind === "junction";
  return [...e].sort((a, l) => {
    if (r) {
      const h = o(a) ? 0 : 1, d = o(l) ? 0 : 1;
      if (h !== d) return h - d;
    }
    let c = 0;
    switch (t) {
      case "size":
        c = a.size - l.size;
        break;
      case "modified":
        c = a.modified - l.modified;
        break;
      case "ext":
        c = Fr.compare(a.ext, l.ext);
        break;
      case "kind":
        c = Fr.compare(a.kind, l.kind);
        break;
      default:
        c = 0;
    }
    return c === 0 && (c = Fr.compare(a.name, l.name)), c * n;
  });
}
function Zc(e) {
  return `onyx-media://f/?p=${encodeURIComponent(e)}`;
}
const Xo = 26, Zo = 8, zr = 124, Wr = 104, Jc = /* @__PURE__ */ new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "avif", "svg"]), Qc = [
  { key: "name", label: "Name", className: "row__name" },
  { key: "size", label: "Size", className: "col-size" },
  { key: "modified", label: "Modified", className: "col-modified" },
  { key: "kind", label: "Type", className: "col-kind" }
];
function ed(e) {
  const {
    entries: t,
    listing: s,
    loading: r,
    currentPath: n,
    selection: o,
    cursor: a,
    sortKey: l,
    sortDir: c,
    viewMode: h,
    gitEntries: d,
    folderSizes: u,
    showFolderSizes: f,
    cutPaths: _,
    renaming: g,
    autoFocus: y,
    onSelectionChange: D,
    onOpen: R,
    onSort: H,
    onContextMenu: M,
    onDropPaths: k,
    onRenameCommit: B,
    onRenameCancel: N,
    onFocus: U
  } = e, ie = Re(null), [Z, _e] = Q(0), [Y, v] = Q(600), [p, w] = Q(900), [m, b] = Q(null), L = Re(null);
  me(() => {
    const T = ie.current;
    if (!T) return;
    const q = () => {
      v(T.clientHeight), w(T.clientWidth);
    }, te = new ResizeObserver(q);
    return te.observe(T), q(), () => te.disconnect();
  }, []), me(() => {
    var T;
    (T = ie.current) == null || T.scrollTo({ top: 0 }), _e(0);
  }, [n]), me(() => {
    var T;
    y && ((T = ie.current) == null || T.focus({ preventScroll: !0 }));
  }, []);
  const x = h === "grid", A = x ? Math.max(1, Math.floor(p / zr)) : 1, I = x ? Wr : Xo, se = Math.max(0, Math.floor(Z / I) - Zo), he = Math.ceil((Z + Y) / I) + Zo, re = se * A, ce = Math.min(t.length, he * A), pe = t.slice(re, ce), ge = Math.ceil(t.length / A) * I, be = Lt(() => {
    if (!f) return 0;
    let T = 0;
    for (const q of t) {
      if (q.kind !== "dir") continue;
      const te = u[q.path];
      te && te > T && (T = te);
    }
    return T;
  }, [t, u, f]), fe = ae(
    (T) => {
      const q = ie.current;
      if (!q) return;
      const te = Math.floor(T / A) * I;
      te < q.scrollTop ? q.scrollTo({ top: te }) : te + I > q.scrollTop + q.clientHeight && q.scrollTo({ top: te + I - q.clientHeight });
    },
    [A, I]
  ), ye = ae(
    (T, q) => {
      var $;
      const te = T ? t.findIndex((V) => V.path === T) : -1, ke = Math.min(te === -1 ? q : te, q), F = Math.max(te === -1 ? q : te, q);
      D(
        t.slice(ke, F + 1).map((V) => V.path),
        (($ = t[q]) == null ? void 0 : $.path) ?? null
      );
    },
    [t, D]
  ), ee = (T, q, te) => {
    if (U(), T.button === 2) {
      o.has(q.path) || (L.current = q.path, D([q.path], q.path));
      return;
    }
    if (T.shiftKey) {
      ye(L.current, te);
      return;
    }
    if (T.ctrlKey || T.metaKey) {
      const ke = new Set(o);
      ke.has(q.path) ? ke.delete(q.path) : ke.add(q.path), L.current = q.path, D([...ke], q.path);
      return;
    }
    o.has(q.path) && o.size > 1 || (L.current = q.path, D([q.path], q.path));
  }, ve = (T, q) => {
    T.button !== 0 || T.shiftKey || T.ctrlKey || T.metaKey || o.has(q.path) && o.size > 1 && (L.current = q.path, D([q.path], q.path));
  }, le = (T) => {
    const q = a ? t.findIndex((F) => F.path === a) : -1, te = (F) => {
      if (t.length === 0) return;
      const $ = Math.min(t.length - 1, Math.max(0, (q === -1 ? 0 : q) + F));
      T.preventDefault(), T.shiftKey ? ye(L.current ?? a, $) : (L.current = t[$].path, D([t[$].path], t[$].path)), fe($);
    }, ke = Math.max(1, Math.floor(Y / I) - 1) * A;
    switch (T.key) {
      case "ArrowDown":
        return te(A);
      case "ArrowUp":
        return te(-A);
      case "ArrowRight":
        return x ? te(1) : void 0;
      case "ArrowLeft":
        return x ? te(-1) : void 0;
      case "PageDown":
        return te(ke);
      case "PageUp":
        return te(-ke);
      case "Home":
        return te(-t.length);
      case "End":
        return te(t.length);
      case "Enter": {
        q >= 0 && (T.preventDefault(), R(t[q]));
        return;
      }
      case "a":
      case "A":
        if (T.ctrlKey) {
          T.preventDefault(), D(t.map((F) => F.path), a);
          return;
        }
        break;
    }
  }, j = ae(
    (T) => o.has(T.path) ? [...o] : [T.path],
    [o]
  ), G = (T, q) => {
    const te = j(q);
    if (T.altKey) {
      T.preventDefault(), window.onyx.startDrag(te);
      return;
    }
    T.dataTransfer.effectAllowed = "copyMove", T.dataTransfer.setData("application/x-onyx-paths", JSON.stringify(te)), T.dataTransfer.setData("text/plain", te.join(`\r
`));
  }, Ce = (T) => {
    const q = T.dataTransfer.getData("application/x-onyx-paths");
    if (q)
      try {
        return JSON.parse(q);
      } catch {
        return [];
      }
    return [...T.dataTransfer.files].map((te) => window.onyx.getPathForFile(te)).filter(Boolean);
  }, Oe = (T, q) => {
    T.preventDefault(), T.stopPropagation(), b(null);
    const te = Ce(T);
    te.length && k(te, q, T.ctrlKey);
  }, St = (T, q) => {
    T.preventDefault(), T.stopPropagation(), T.dataTransfer.dropEffect = T.ctrlKey ? "copy" : "move", b(q);
  };
  return r && t.length === 0 ? /* @__PURE__ */ S("div", { className: "list__empty", children: "Reading…" }) : /* @__PURE__ */ W("div", { className: "list", children: [
    !x && /* @__PURE__ */ W("div", { className: "list__head", children: [
      /* @__PURE__ */ S("span", { className: "row__icon" }),
      Qc.map((T) => /* @__PURE__ */ W(
        "button",
        {
          type: "button",
          className: T.className,
          style: T.key === "name" ? void 0 : { justifyContent: "flex-end" },
          onClick: () => H(T.key),
          children: [
            /* @__PURE__ */ S("span", { children: T.label }),
            l === T.key && /* @__PURE__ */ S("span", { className: "list__sortmark", children: c === "asc" ? "▲" : "▼" })
          ]
        },
        T.key
      ))
    ] }),
    /* @__PURE__ */ W(
      "div",
      {
        ref: ie,
        className: "list__scroll",
        tabIndex: 0,
        onScroll: (T) => _e(T.currentTarget.scrollTop),
        onKeyDown: le,
        onFocus: U,
        onMouseDown: (T) => {
          (T.target === T.currentTarget || T.target.classList.contains("list__spacer")) && (U(), L.current = null, D([], null));
        },
        onContextMenu: (T) => {
          (T.target === T.currentTarget || T.target.classList.contains("list__spacer")) && M(T, null);
        },
        onDragOver: (T) => St(T, null),
        onDragLeave: () => b(null),
        onDrop: (T) => Oe(T, n),
        children: [
          (s == null ? void 0 : s.error) && /* @__PURE__ */ S("div", { className: "list__empty list__error", children: s.error }),
          !(s != null && s.error) && t.length === 0 && !r && /* @__PURE__ */ S("div", { className: "list__empty", children: "This folder is empty" }),
          /* @__PURE__ */ S("div", { className: "list__spacer", style: { height: ge }, children: pe.map((T, q) => {
            const te = re + q, ke = T.kind === "dir" || T.kind === "junction", F = d == null ? void 0 : d[T.path], $ = ke ? u[T.path] : T.size, V = ke && f && be > 0 && $ ? Math.max(2, Math.round($ / be * 100)) : 0, we = [x ? "tile" : "row"];
            !x && te % 2 === 1 && we.push("row--alt"), o.has(T.path) && we.push(x ? "tile--selected" : "row--selected"), a === T.path && we.push(x ? "tile--cursor" : "row--cursor"), _.has(T.path) && we.push("row--cut"), T.hidden && we.push("row--hidden"), T.inaccessible && we.push("row--inaccessible"), F === "ignored" && we.push("row--ignored"), m === T.path && we.push(x ? "tile--droptarget" : "row--droptarget");
            const Ie = x ? {
              top: Math.floor(te / A) * Wr,
              left: te % A * zr,
              width: zr,
              height: Wr
            } : { top: te * Xo }, ii = {
              className: we.join(" "),
              style: Ie,
              draggable: !0,
              onDragStart: (Me) => G(Me, T),
              onDragOver: (Me) => ke ? St(Me, T.path) : St(Me, null),
              onDragLeave: () => b(null),
              onDrop: (Me) => Oe(Me, ke ? T.path : n),
              onMouseDown: (Me) => ee(Me, T, te),
              onMouseUp: (Me) => ve(Me, T),
              onDoubleClick: () => R(T),
              onContextMenu: (Me) => M(Me, T)
            };
            if (x) {
              const Me = T.kind === "file" && Jc.has(T.ext);
              return /* @__PURE__ */ W("div", { ...ii, title: T.name, children: [
                /* @__PURE__ */ W("div", { className: `tile__art${ke ? " tile__art--dir" : ""}`, children: [
                  Me ? /* @__PURE__ */ S(
                    "img",
                    {
                      className: "tile__thumb",
                      src: Zc(T.path),
                      alt: "",
                      loading: "lazy",
                      decoding: "async",
                      onError: (It) => {
                        It.currentTarget.style.display = "none";
                      }
                    }
                  ) : /* @__PURE__ */ S(Yt, { name: Yo(T.kind, T.ext), size: 30 }),
                  F && F !== "ignored" && /* @__PURE__ */ S("span", { className: `gitdot gitdot--${F}` })
                ] }),
                g === T.path ? /* @__PURE__ */ S(
                  Jo,
                  {
                    initial: T.name,
                    onCommit: (It) => B(T.path, It),
                    onCancel: N
                  }
                ) : /* @__PURE__ */ S("div", { className: "tile__name", children: T.name })
              ] }, T.path);
            }
            return /* @__PURE__ */ W("div", { ...ii, children: [
              /* @__PURE__ */ S("span", { className: `row__icon${ke ? " row__icon--dir" : ""}`, children: /* @__PURE__ */ S(Yt, { name: Yo(T.kind, T.ext) }) }),
              F && F !== "ignored" && /* @__PURE__ */ S("span", { className: `gitdot gitdot--${F}` }),
              g === T.path ? /* @__PURE__ */ S(
                Jo,
                {
                  initial: T.name,
                  onCommit: (Me) => B(T.path, Me),
                  onCancel: N
                }
              ) : /* @__PURE__ */ S("span", { className: "row__name", title: T.name, children: T.name }),
              /* @__PURE__ */ W("span", { className: "row__col col-size sizebar", children: [
                ke ? $ ? Xt($) : "—" : Xt(T.size),
                V > 0 && /* @__PURE__ */ S("span", { className: "sizebar__fill", style: { width: `${V}%` } })
              ] }),
              /* @__PURE__ */ S("span", { className: "row__col col-modified", children: kc(T.modified) }),
              /* @__PURE__ */ S("span", { className: "row__col col-kind", children: Gl(T) })
            ] }, T.path);
          }) })
        ]
      }
    )
  ] });
}
function Jo({
  initial: e,
  onCommit: t,
  onCancel: s
}) {
  const [r, n] = Q(e), o = Re(null);
  return me(() => {
    const a = o.current;
    if (!a) return;
    a.focus();
    const l = e.lastIndexOf(".");
    l > 0 ? a.setSelectionRange(0, l) : a.select();
  }, [e]), /* @__PURE__ */ S(
    "input",
    {
      ref: o,
      className: "row__rename",
      value: r,
      spellCheck: !1,
      onChange: (a) => n(a.target.value),
      onMouseDown: (a) => a.stopPropagation(),
      onDoubleClick: (a) => a.stopPropagation(),
      onBlur: () => r.trim() && r !== e ? t(r) : s(),
      onKeyDown: (a) => {
        a.stopPropagation(), a.key === "Enter" ? (a.preventDefault(), r.trim() && r !== e ? t(r) : s()) : a.key === "Escape" && (a.preventDefault(), s());
      }
    }
  );
}
const $r = 2e3, td = 350;
let Qo = 0;
function id({
  fsApi: e,
  root: t,
  onOpenHit: s,
  onRevealHit: r,
  onClose: n
}) {
  const [o, a] = Q(""), [l, c] = Q(!1), [h, d] = Q(!1), [u, f] = Q([]), [_, g] = Q(!1), [y, D] = Q(!1), R = Re(null), H = ae(() => {
    var M;
    (M = R.current) == null || M.call(R), R.current = null, g(!1);
  }, []);
  return me(() => H, [H, t]), me(() => {
    if (H(), f([]), D(!1), o.trim().length < 2) return;
    const M = setTimeout(() => {
      Qo += 1;
      const k = `s${Qo}`;
      let B = [];
      const N = () => {
        if (B.length === 0) return;
        const Z = B;
        B = [], f((_e) => _e.length >= $r ? _e : [..._e, ...Z]);
      }, U = setInterval(N, 120);
      g(!0);
      const ie = e.search(
        {
          id: k,
          root: t,
          name: o.trim(),
          content: l ? o.trim() : "",
          regex: h,
          caseSensitive: !1,
          includeHidden: !1,
          maxHits: $r
        },
        (Z) => B.push(Z),
        (Z) => {
          clearInterval(U), N(), D(Z), g(!1);
        }
      );
      R.current = () => {
        clearInterval(U), ie();
      };
    }, td);
    return () => clearTimeout(M);
  }, [o, l, h, t, e, H]), /* @__PURE__ */ W("div", { className: "search", children: [
    /* @__PURE__ */ W("div", { className: "search__bar", children: [
      /* @__PURE__ */ S(
        "input",
        {
          autoFocus: !0,
          spellCheck: !1,
          value: o,
          placeholder: `Search in ${t}…`,
          onChange: (M) => a(M.target.value),
          onKeyDown: (M) => {
            M.stopPropagation(), M.key === "Escape" && n();
          }
        }
      ),
      /* @__PURE__ */ S(
        "button",
        {
          type: "button",
          className: `search__toggle${l ? " search__toggle--on" : ""}`,
          title: "Also search inside file contents",
          onClick: () => c((M) => !M),
          children: "Text"
        }
      ),
      /* @__PURE__ */ S(
        "button",
        {
          type: "button",
          className: `search__toggle${h ? " search__toggle--on" : ""}`,
          title: "Treat the query as a regular expression",
          onClick: () => d((M) => !M),
          children: ".*"
        }
      ),
      /* @__PURE__ */ S("button", { type: "button", className: "search__toggle", onClick: n, title: "Close (Esc)", children: "✕" })
    ] }),
    /* @__PURE__ */ S("div", { className: "search__results", children: u.map((M, k) => /* @__PURE__ */ W(
      "button",
      {
        type: "button",
        className: "search__hit",
        onClick: () => s(M),
        onDoubleClick: () => r(M),
        title: M.path,
        children: [
          /* @__PURE__ */ W("div", { className: "search__hitname", children: [
            M.name,
            M.kind === "file" && /* @__PURE__ */ W("span", { className: "search__hitpath", children: [
              " · ",
              Xt(M.size)
            ] })
          ] }),
          /* @__PURE__ */ S("div", { className: "search__hitpath", children: M.dir }),
          M.line && /* @__PURE__ */ W("div", { className: "search__hitline", children: [
            M.lineNo,
            ": ",
            M.line.trim()
          ] })
        ]
      },
      `${M.path}:${M.lineNo ?? k}`
    )) }),
    /* @__PURE__ */ W("div", { className: "search__status", children: [
      o.trim().length < 2 ? "Type at least 2 characters" : _ ? `Searching… ${u.length} found` : `${u.length} result${u.length === 1 ? "" : "s"}${y ? ` (stopped at ${$r})` : ""}`,
      " · click to jump, double-click to reveal"
    ] })
  ] });
}
const sd = 150;
function rd(e) {
  const {
    leaf: t,
    active: s,
    multi: r,
    settings: n,
    fsApi: o,
    selection: a,
    cutPaths: l,
    renaming: c,
    searchOpen: h,
    onActivate: d,
    onNavigate: u,
    onBack: f,
    onForward: _,
    onUp: g,
    onSort: y,
    onToggleView: D,
    onFilterChange: R,
    onSelectionChange: H,
    onListing: M,
    onOpenFile: k,
    onContextMenu: B,
    onDropPaths: N,
    onRenameCommit: U,
    onRenameCancel: ie,
    onCloseSearch: Z,
    refreshKey: _e,
    onRefresh: Y
  } = e, [v, p] = Q(null), [w, m] = Q(!0), [b, L] = Q(null), [x, A] = Q({}), [I, se] = Q(null), he = Re(null), re = ae(
    async (ee) => {
      const ve = await o.readDir(ee);
      return p((le) => le && le.path !== ee && ee !== t.path ? le : ve), m(!1), ve;
    },
    [o, t.path]
  );
  me(() => {
    let ee = !1;
    m(!0), A({}), L(null), (async () => {
      const le = await o.readDir(t.path);
      ee || (p(le), m(!1));
    })();
    const ve = o.watch(t.path, () => {
      ee || re(t.path);
    });
    return () => {
      ee = !0, ve();
    };
  }, [o, t.path, re, _e]), me(() => {
    if (!n.showGitStatus || !(v != null && v.gitRoot)) {
      L(null);
      return;
    }
    let ee = !1;
    return o.gitStatus(v.path).then((ve) => {
      ee || L(ve);
    }), () => {
      ee = !0;
    };
  }, [o, v == null ? void 0 : v.gitRoot, v == null ? void 0 : v.path, v, n.showGitStatus]), me(() => {
    if (!n.showFolderSizes || !v) return;
    const ee = v.entries.filter((le) => le.kind === "dir");
    if (ee.length === 0 || ee.length > sd) return;
    let ve = !1;
    for (const le of ee)
      o.folderSize(le.path).then((j) => {
        ve || !j || A((G) => G[le.path] === j ? G : { ...G, [le.path]: j });
      });
    return () => {
      ve = !0;
    };
  }, [o, v, n.showFolderSizes]);
  const ce = Lt(() => {
    if (!v) return [];
    let ee = v.entries;
    n.showHidden || (ee = ee.filter((le) => !le.hidden)), n.showSystem || (ee = ee.filter((le) => !le.system));
    const ve = Gc(t.filter);
    return ve && (ee = ee.filter(ve)), Xc(ee, t.sortKey, t.sortDir, n.foldersFirst);
  }, [v, t.filter, t.sortKey, t.sortDir, n.showHidden, n.showSystem, n.foldersFirst]);
  me(() => {
    M(t.id, v, ce);
  }, [M, t.id, v, ce]);
  const pe = Lt(() => new Set(a.paths), [a.paths]), ge = Lt(() => Ec(t.path), [t.path]), be = (ee) => {
    ee.kind === "dir" || ee.kind === "junction" ? u(ee.path) : k(ee);
  }, fe = async (ee) => {
    se(null);
    const ve = await o.resolvePath(ee, t.path);
    ve && u(ve);
  }, ye = v ? v.entries.length - ce.length - (t.filter, 0) : 0;
  return /* @__PURE__ */ W(
    "div",
    {
      className: `pane${s && r ? " pane--active-multi" : ""}`,
      onMouseDown: d,
      children: [
        /* @__PURE__ */ W("div", { className: "pane__bar", children: [
          /* @__PURE__ */ S(
            "button",
            {
              type: "button",
              className: "navbtn",
              title: "Back (Alt+Left)",
              disabled: t.historyIndex <= 0,
              onClick: f,
              children: /* @__PURE__ */ S(Yt, { name: "back" })
            }
          ),
          /* @__PURE__ */ S(
            "button",
            {
              type: "button",
              className: "navbtn",
              title: "Forward (Alt+Right)",
              disabled: t.historyIndex >= t.history.length - 1,
              onClick: _,
              children: /* @__PURE__ */ S(Yt, { name: "forward" })
            }
          ),
          /* @__PURE__ */ S("button", { type: "button", className: "navbtn", title: "Up (Backspace)", onClick: g, children: /* @__PURE__ */ S(Yt, { name: "up" }) }),
          /* @__PURE__ */ S(
            "button",
            {
              type: "button",
              className: "navbtn",
              title: "Refresh (Ctrl+R)",
              onClick: Y,
              children: /* @__PURE__ */ S(Yt, { name: "refresh" })
            }
          ),
          /* @__PURE__ */ S(
            "button",
            {
              type: "button",
              className: "navbtn",
              title: t.viewMode === "grid" ? "Details view" : "Grid view",
              onClick: D,
              children: /* @__PURE__ */ S(Yt, { name: t.viewMode === "grid" ? "split-v" : "split-h" })
            }
          ),
          I !== null ? /* @__PURE__ */ S(
            "input",
            {
              className: "crumbs__edit",
              autoFocus: !0,
              spellCheck: !1,
              defaultValue: I,
              onBlur: (ee) => void fe(ee.target.value),
              onKeyDown: (ee) => {
                ee.stopPropagation(), ee.key === "Enter" ? fe(ee.currentTarget.value) : ee.key === "Escape" && se(null);
              }
            }
          ) : /* @__PURE__ */ W(
            "div",
            {
              className: "crumbs",
              title: "Click a segment to jump — click the empty space to type a path",
              onDoubleClick: () => se(t.path),
              children: [
                /* @__PURE__ */ S("div", { className: "crumbs__scroll", children: /* @__PURE__ */ S("div", { className: "crumbs__inner", children: ge.map((ee, ve) => /* @__PURE__ */ W(xo.Fragment, { children: [
                  ve > 0 && /* @__PURE__ */ S("span", { className: "crumb__sep", children: "›" }),
                  /* @__PURE__ */ S(
                    "button",
                    {
                      type: "button",
                      className: `crumb${ve === ge.length - 1 ? " crumb--last" : ""}`,
                      onClick: () => u(ee.path),
                      children: ee.label
                    }
                  )
                ] }, ee.path)) }) }),
                b && /* @__PURE__ */ W("span", { className: "gitbranch", title: `${b.dirty} changed · ${b.root}`, children: [
                  b.branch || "detached",
                  b.dirty > 0 && /* @__PURE__ */ W("span", { className: "gitbranch__dirty", children: [
                    "●",
                    b.dirty
                  ] }),
                  b.ahead > 0 && /* @__PURE__ */ W("span", { children: [
                    "↑",
                    b.ahead
                  ] }),
                  b.behind > 0 && /* @__PURE__ */ W("span", { children: [
                    "↓",
                    b.behind
                  ] })
                ] })
              ]
            }
          )
        ] }),
        t.filter !== "" || s ? /* @__PURE__ */ W("div", { className: "filterbar", children: [
          /* @__PURE__ */ S("span", { className: "filterbar__icon", children: "▸" }),
          /* @__PURE__ */ S(
            "input",
            {
              ref: he,
              "data-pane-filter": t.id,
              value: t.filter,
              spellCheck: !1,
              placeholder: "Filter — ext:png  size:>10mb  mod:today  -draft",
              onChange: (ee) => R(ee.target.value),
              onKeyDown: (ee) => {
                ee.stopPropagation(), ee.key === "Escape" && (R(""), ee.currentTarget.blur());
              }
            }
          ),
          /* @__PURE__ */ W("span", { className: "filterbar__count", children: [
            ce.length,
            v && ce.length !== v.entries.length && ` / ${v.entries.length}`
          ] })
        ] }) : null,
        h ? /* @__PURE__ */ S(
          id,
          {
            fsApi: o,
            root: t.path,
            onOpenHit: (ee) => u(ee.dir),
            onRevealHit: (ee) => void o.revealInExplorer(ee.path),
            onClose: Z
          }
        ) : /* @__PURE__ */ S(
          ed,
          {
            entries: ce,
            listing: v,
            loading: w,
            currentPath: t.path,
            selection: pe,
            cursor: a.cursor,
            sortKey: t.sortKey,
            sortDir: t.sortDir,
            viewMode: t.viewMode,
            gitEntries: (b == null ? void 0 : b.entries) ?? null,
            folderSizes: x,
            showFolderSizes: n.showFolderSizes,
            cutPaths: l,
            renaming: c,
            autoFocus: s,
            onSelectionChange: H,
            onOpen: be,
            onSort: y,
            onContextMenu: B,
            onDropPaths: N,
            onRenameCommit: U,
            onRenameCancel: ie,
            onFocus: d
          }
        ),
        (v == null ? void 0 : v.warning) && /* @__PURE__ */ W("div", { className: "search__status", title: v.warning, children: [
          v.warning,
          ye > 0 && !n.showHidden ? " · hidden items filtered" : ""
        ] })
      ]
    }
  );
}
function xn({
  node: e,
  renderLeaf: t,
  onRatioChange: s
}) {
  return e.type === "leaf" ? /* @__PURE__ */ S(Ot, { children: t(e) }) : /* @__PURE__ */ S(nd, { node: e, renderLeaf: t, onRatioChange: s });
}
function nd({
  node: e,
  renderLeaf: t,
  onRatioChange: s
}) {
  const r = Re(null), [n, o] = Q(!1), a = ae(
    (h) => {
      h.preventDefault();
      const d = r.current;
      if (!d) return;
      o(!0);
      const u = (_) => {
        const g = d.getBoundingClientRect(), y = e.dir === "h" ? (_.clientX - g.left) / g.width : (_.clientY - g.top) / g.height;
        Number.isFinite(y) && s(e.id, y);
      }, f = () => {
        o(!1), window.removeEventListener("mousemove", u), window.removeEventListener("mouseup", f), document.body.style.cursor = "";
      };
      document.body.style.cursor = e.dir === "h" ? "col-resize" : "row-resize", window.addEventListener("mousemove", u), window.addEventListener("mouseup", f);
    },
    [e.dir, e.id, s]
  ), l = { flex: `${e.ratio} 1 0`, minWidth: 0, minHeight: 0, display: "flex" }, c = { flex: `${1 - e.ratio} 1 0`, minWidth: 0, minHeight: 0, display: "flex" };
  return /* @__PURE__ */ W("div", { ref: r, className: `panetree panetree--${e.dir}`, children: [
    /* @__PURE__ */ S("div", { style: l, children: /* @__PURE__ */ S(xn, { node: e.a, renderLeaf: t, onRatioChange: s }) }),
    /* @__PURE__ */ S(
      "div",
      {
        className: `divider divider--${e.dir}${n ? " divider--dragging" : ""}`,
        onMouseDown: a,
        role: "separator",
        "aria-orientation": e.dir === "h" ? "vertical" : "horizontal"
      }
    ),
    /* @__PURE__ */ S("div", { style: c, children: /* @__PURE__ */ S(xn, { node: e.b, renderLeaf: t, onRatioChange: s }) })
  ] });
}
function Xl({ data: e }) {
  if (e.error) return /* @__PURE__ */ S("div", { className: "preview__none", children: e.error });
  switch (e.kind) {
    case "image":
      return /* @__PURE__ */ S("img", { className: "preview__media", src: e.src, alt: Pt(e.path) });
    case "video":
      return /* @__PURE__ */ S("video", { className: "preview__media", src: e.src, controls: !0, preload: "metadata" });
    case "audio":
      return /* @__PURE__ */ S("audio", { style: { width: "100%" }, src: e.src, controls: !0, preload: "metadata" });
    case "pdf":
      return /* @__PURE__ */ S("iframe", { title: Pt(e.path), src: e.src, style: { width: "100%", height: 420, border: "none", background: "#fff" } });
    case "text":
      return /* @__PURE__ */ W("pre", { className: "preview__text", children: [
        e.text,
        e.truncated && `

… truncated`
      ] });
    case "dir":
      return /* @__PURE__ */ S("div", { className: "preview__none", children: e.childCount ? `${e.childCount.dirs} folder${e.childCount.dirs === 1 ? "" : "s"}, ${e.childCount.files} file${e.childCount.files === 1 ? "" : "s"}` : "Folder" });
    case "binary":
      return /* @__PURE__ */ S("div", { className: "preview__none", children: "No preview for this file type" });
    default:
      return /* @__PURE__ */ S("div", { className: "preview__none", children: "Nothing selected" });
  }
}
function Zl({ data: e }) {
  return /* @__PURE__ */ W("dl", { className: "preview__meta", children: [
    e.kind !== "dir" && /* @__PURE__ */ W(Ot, { children: [
      /* @__PURE__ */ S("dt", { children: "Size" }),
      /* @__PURE__ */ S("dd", { children: Xt(e.size) })
    ] }),
    /* @__PURE__ */ S("dt", { children: "Modified" }),
    /* @__PURE__ */ S("dd", { children: Lc(e.modified) }),
    /* @__PURE__ */ S("dt", { children: "Path" }),
    /* @__PURE__ */ S("dd", { children: e.path })
  ] });
}
function Jl(e, t) {
  const [s, r] = Q(null);
  return me(() => {
    if (!t) {
      r(null);
      return;
    }
    let n = !1;
    const o = setTimeout(() => {
      e.preview(t).then((a) => {
        n || r(a);
      });
    }, 90);
    return () => {
      n = !0, clearTimeout(o);
    };
  }, [e, t]), s;
}
function od({
  fsApi: e,
  path: t,
  multiCount: s
}) {
  const r = Jl(e, s === 1 ? t : null);
  return /* @__PURE__ */ W("div", { className: "preview", children: [
    /* @__PURE__ */ S("div", { className: "preview__head", children: t ? Pt(t) : "Preview" }),
    /* @__PURE__ */ S("div", { className: "preview__body", children: s > 1 ? /* @__PURE__ */ W("div", { className: "preview__none", children: [
      s,
      " items selected"
    ] }) : r ? /* @__PURE__ */ S(Xl, { data: r }) : /* @__PURE__ */ S("div", { className: "preview__none", children: "Select a file to preview it" }) }),
    r && s === 1 && /* @__PURE__ */ S(Zl, { data: r })
  ] });
}
function ad({
  fsApi: e,
  path: t,
  onClose: s
}) {
  const r = Jl(e, t);
  return me(() => {
    const n = (o) => {
      (o.key === "Escape" || o.key === " ") && (o.preventDefault(), o.stopPropagation(), s());
    };
    return window.addEventListener("keydown", n, !0), () => window.removeEventListener("keydown", n, !0);
  }, [s]), /* @__PURE__ */ S("div", { className: "peek", onMouseDown: s, children: /* @__PURE__ */ W("div", { className: "peek__inner", onMouseDown: (n) => n.stopPropagation(), children: [
    /* @__PURE__ */ S("div", { className: "preview__head", children: Pt(t) }),
    /* @__PURE__ */ S("div", { className: "peek__body", children: r ? /* @__PURE__ */ S(Xl, { data: r }) : /* @__PURE__ */ S("div", { className: "preview__none", children: "Loading…" }) }),
    r && /* @__PURE__ */ S(Zl, { data: r })
  ] }) });
}
function ld({
  pinned: e,
  known: t,
  drives: s,
  currentPath: r,
  onNavigate: n,
  onPin: o,
  onUnpin: a,
  onDropPaths: l
}) {
  const [c, h] = Q(null), d = (g) => {
    const y = g.dataTransfer.getData("application/x-onyx-paths");
    if (y)
      try {
        return JSON.parse(y);
      } catch {
        return [];
      }
    return [...g.dataTransfer.files].map((D) => window.onyx.getPathForFile(D)).filter(Boolean);
  }, u = (g) => ({
    onDragOver: (y) => {
      y.preventDefault(), y.dataTransfer.dropEffect = y.ctrlKey ? "copy" : "move", h(g);
    },
    onDragLeave: () => h((y) => y === g ? null : y),
    onDrop: (y) => {
      y.preventDefault(), h(null);
      const D = d(y);
      D.length && l(D, g, y.ctrlKey);
    }
  }), f = (g) => g.toLowerCase() === r.toLowerCase(), _ = (g, y) => /* @__PURE__ */ W(
    "button",
    {
      type: "button",
      className: [
        "place",
        f(g.path) ? "place--active" : "",
        c === g.path ? "place--drop" : ""
      ].filter(Boolean).join(" "),
      title: g.path,
      onClick: () => n(g.path),
      ...u(g.path),
      children: [
        /* @__PURE__ */ S(Yt, { name: y ? "star" : "folder" }),
        /* @__PURE__ */ S("span", { className: "place__name", children: g.name }),
        y && /* @__PURE__ */ S(
          "span",
          {
            className: "place__unpin",
            title: "Unpin",
            role: "button",
            tabIndex: -1,
            onClick: (D) => {
              D.stopPropagation(), a(g.path);
            },
            children: "✕"
          }
        )
      ]
    },
    g.path
  );
  return /* @__PURE__ */ W("div", { className: "sidebar", children: [
    /* @__PURE__ */ W("div", { className: "sidebar__section", children: [
      /* @__PURE__ */ W("div", { className: "sidebar__heading", children: [
        /* @__PURE__ */ S("span", { children: "Pinned" }),
        /* @__PURE__ */ S(
          "button",
          {
            type: "button",
            className: "sidebar__add",
            title: "Pin the current folder",
            onClick: o,
            children: "+"
          }
        )
      ] }),
      e.length === 0 ? /* @__PURE__ */ S("div", { className: "place", style: { opacity: 0.5, cursor: "default" }, children: /* @__PURE__ */ S("span", { className: "place__name", children: "Nothing pinned yet" }) }) : e.map((g) => _(g, !0))
    ] }),
    /* @__PURE__ */ W("div", { className: "sidebar__section", children: [
      /* @__PURE__ */ S("div", { className: "sidebar__heading", children: /* @__PURE__ */ S("span", { children: "Quick access" }) }),
      t.map((g) => _(g, !1))
    ] }),
    /* @__PURE__ */ W("div", { className: "sidebar__section", children: [
      /* @__PURE__ */ S("div", { className: "sidebar__heading", children: /* @__PURE__ */ S("span", { children: "Drives" }) }),
      s.map((g) => {
        const y = g.total > 0 ? g.total - g.free : 0, D = g.total > 0 ? Math.round(y / g.total * 100) : 0, R = D >= 92 ? " drive__fill--crit" : D >= 80 ? " drive__fill--warn" : "";
        return /* @__PURE__ */ W(
          "button",
          {
            type: "button",
            className: [
              "drive",
              f(g.path) ? "drive--active" : "",
              c === g.path ? "place--drop" : ""
            ].filter(Boolean).join(" "),
            style: { display: "block", width: "100%", textAlign: "left" },
            title: g.ready ? `${g.label} (${g.letter}) — ${Xt(g.free)} free of ${Xt(g.total)}` : `${g.letter} — not ready`,
            onClick: () => n(g.path),
            ...u(g.path),
            children: [
              /* @__PURE__ */ W("div", { className: "drive__top", children: [
                /* @__PURE__ */ W("span", { className: "drive__label", children: [
                  g.label,
                  " (",
                  g.letter,
                  ")"
                ] }),
                /* @__PURE__ */ S("span", { className: "drive__pct", children: g.ready ? `${D}%` : "—" })
              ] }),
              g.ready && /* @__PURE__ */ W(Ot, { children: [
                /* @__PURE__ */ S("div", { className: "drive__bar", children: /* @__PURE__ */ S("div", { className: `drive__fill${R}`, style: { width: `${D}%` } }) }),
                /* @__PURE__ */ W("div", { className: "drive__pct", style: { marginTop: 3 }, children: [
                  Xt(g.free),
                  " free"
                ] })
              ] })
            ]
          },
          g.path
        );
      })
    ] })
  ] });
}
function hd(e) {
  const t = Ui(e.root, e.activePaneId) ?? Ti(e.root)[0], s = Pt(t.path) || t.path, r = Ti(e.root).length;
  return r > 1 ? `${s} +${r - 1}` : s;
}
function cd({
  tabs: e,
  activeTabId: t,
  onSelect: s,
  onClose: r,
  onNew: n
}) {
  return /* @__PURE__ */ W("div", { className: "tabstrip", children: [
    e.map((o) => {
      var a;
      return /* @__PURE__ */ W(
        "div",
        {
          className: `tab${o.id === t ? " tab--active" : ""}`,
          onMouseDown: (l) => {
            l.button === 1 ? (l.preventDefault(), r(o.id)) : l.button === 0 && s(o.id);
          },
          title: ((a = Ui(o.root, o.activePaneId)) == null ? void 0 : a.path) ?? "",
          children: [
            /* @__PURE__ */ S("span", { className: "tab__label", children: hd(o) }),
            /* @__PURE__ */ S(
              "button",
              {
                type: "button",
                className: "tab__close",
                title: "Close tab (Ctrl+W)",
                onClick: (l) => {
                  l.stopPropagation(), r(o.id);
                },
                children: "✕"
              }
            )
          ]
        },
        o.id
      );
    }),
    /* @__PURE__ */ S("button", { type: "button", className: "tabstrip__new", title: "New tab (Ctrl+T)", onClick: n, children: /* @__PURE__ */ S(Yt, { name: "plus" }) })
  ] });
}
const dd = '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, ui-monospace, monospace';
function ri(e, t, s) {
  const r = t / 100, n = s / 100, o = r * Math.min(n, 1 - n), a = (c) => {
    const h = (c + e / 30) % 12, d = n - o * Math.max(-1, Math.min(h - 3, 9 - h, 1));
    return Math.round(255 * d);
  }, l = (c) => c.toString(16).padStart(2, "0");
  return `#${l(a(0))}${l(a(8))}${l(a(4))}`;
}
const Hr = 150, Ur = 9, ud = {
  gitModified: "#d4e157",
  gitAdded: "#a3e635",
  gitUntracked: "#4fc3f7",
  gitDeleted: "#ff5c7a"
};
function Ct(e, { h: t, s, l: r, glow: n = 1, bgL: o = 3.5 }) {
  const a = ri(t, s, r);
  return {
    name: e,
    glowStrength: n,
    font: { family: dd, size: 13 },
    chrome: {
      chromeBg: ri(Hr, Ur, o),
      panelBg: ri(Hr, Ur, o + 2.5),
      rowBg: ri(Hr, Ur, o + 1.4),
      fg: ri(90, 6, 90),
      // warm light gray (Hub foreground), shared
      dimFg: ri(120, 5, 52),
      accent: a,
      // Accent-derived chrome — saturation clamped so low-sat palettes (Mono)
      // stay muted instead of forcing a green tint.
      border: ri(t, Math.min(s, 45), 22),
      selectionBg: ri(t, Math.min(s, 42), 18),
      scrollbar: ri(t, Math.min(s, 32), 30),
      ...ud
    }
  };
}
Ct("Lime", { h: 104, s: 86, l: 60, glow: 1 }), Ct("Bright", { h: 90, s: 95, l: 60, glow: 1.5 }), Ct("Emerald", { h: 152, s: 80, l: 47, glow: 1.1 }), Ct("Cyan", { h: 184, s: 85, l: 50, glow: 1.15 }), Ct("Ice", { h: 202, s: 90, l: 62, glow: 1.15 }), Ct("Violet", { h: 266, s: 82, l: 68, glow: 1.25 }), Ct("Synthwave", { h: 318, s: 88, l: 64, glow: 1.35 }), Ct("Magenta", { h: 330, s: 90, l: 60, glow: 1.3 }), Ct("Crimson", { h: 352, s: 82, l: 57, glow: 1.2 }), Ct("Amber", { h: 38, s: 95, l: 55, glow: 1.1 }), Ct("Gold", { h: 46, s: 90, l: 58, glow: 1 }), Ct("Mono", { h: 150, s: 5, l: 82, glow: 0.5 }), Ct("Noir", { h: 104, s: 55, l: 50, glow: 0.4, bgL: 2.5 });
const _d = {
  black: "#11160f",
  red: "#ff5c7a",
  green: "#a3e635",
  yellow: "#d4e157",
  blue: "#4fc3f7",
  magenta: "#c792ea",
  cyan: "#56e0c0",
  white: "#cfe8b4",
  brightBlack: "#3a4a32",
  brightRed: "#ff7a93",
  brightGreen: "#bdf64f",
  brightYellow: "#e6f06a",
  brightBlue: "#73d4ff",
  brightMagenta: "#dca8ff",
  brightCyan: "#7af0d6",
  brightWhite: "#eaffd6"
};
function fd(e) {
  return {
    foreground: e.chrome.fg,
    background: e.chrome.chromeBg,
    cursor: e.chrome.accent,
    cursorAccent: e.chrome.chromeBg,
    selectionBackground: e.chrome.selectionBg,
    ..._d
  };
}
/**
 * Copyright (c) 2014-2024 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 * @license MIT
 *
 * Originally forked from (with the author's permission):
 *   Fabrice Bellard's javascript vt100 for jslinux:
 *   http://bellard.org/jslinux/
 *   Copyright (c) 2011 Fabrice Bellard
 */
var Ql = Object.defineProperty, pd = Object.getOwnPropertyDescriptor, gd = (e, t) => {
  for (var s in t) Ql(e, s, { get: t[s], enumerable: !0 });
}, $e = (e, t, s, r) => {
  for (var n = r > 1 ? void 0 : r ? pd(t, s) : t, o = e.length - 1, a; o >= 0; o--) (a = e[o]) && (n = (r ? a(t, s, n) : a(n)) || n);
  return r && n && Ql(t, s, n), n;
}, X = (e, t) => (s, r) => t(s, r, e), ea = "Terminal input", kn = { get: () => ea, set: (e) => ea = e }, ta = "Too much output to announce, navigate to rows manually to read", Ln = { get: () => ta, set: (e) => ta = e };
function vd(e) {
  return e.replace(/\r?\n/g, "\r");
}
function md(e, t) {
  return t ? "\x1B[200~" + e + "\x1B[201~" : e;
}
function wd(e, t) {
  e.clipboardData && e.clipboardData.setData("text/plain", t.selectionText), e.preventDefault();
}
function Sd(e, t, s, r) {
  if (e.stopPropagation(), e.clipboardData) {
    let n = e.clipboardData.getData("text/plain");
    eh(n, t, s, r);
  }
}
function eh(e, t, s, r) {
  e = vd(e), e = md(e, s.decPrivateModes.bracketedPasteMode && r.rawOptions.ignoreBracketedPasteMode !== !0), s.triggerDataEvent(e, !0), t.value = "";
}
function th(e, t, s) {
  let r = s.getBoundingClientRect(), n = e.clientX - r.left - 10, o = e.clientY - r.top - 10;
  t.style.width = "20px", t.style.height = "20px", t.style.left = `${n}px`, t.style.top = `${o}px`, t.style.zIndex = "1000", t.focus();
}
function ia(e, t, s, r, n) {
  th(e, t, s), n && r.rightClickSelect(e), t.value = r.selectionText, t.select();
}
function Di(e) {
  return e > 65535 ? (e -= 65536, String.fromCharCode((e >> 10) + 55296) + String.fromCharCode(e % 1024 + 56320)) : String.fromCharCode(e);
}
function Br(e, t = 0, s = e.length) {
  let r = "";
  for (let n = t; n < s; ++n) {
    let o = e[n];
    o > 65535 ? (o -= 65536, r += String.fromCharCode((o >> 10) + 55296) + String.fromCharCode(o % 1024 + 56320)) : r += String.fromCharCode(o);
  }
  return r;
}
var bd = class {
  constructor() {
    this._interim = 0;
  }
  clear() {
    this._interim = 0;
  }
  decode(e, t) {
    let s = e.length;
    if (!s) return 0;
    let r = 0, n = 0;
    if (this._interim) {
      let o = e.charCodeAt(n++);
      56320 <= o && o <= 57343 ? t[r++] = (this._interim - 55296) * 1024 + o - 56320 + 65536 : (t[r++] = this._interim, t[r++] = o), this._interim = 0;
    }
    for (let o = n; o < s; ++o) {
      let a = e.charCodeAt(o);
      if (55296 <= a && a <= 56319) {
        if (++o >= s) return this._interim = a, r;
        let l = e.charCodeAt(o);
        56320 <= l && l <= 57343 ? t[r++] = (a - 55296) * 1024 + l - 56320 + 65536 : (t[r++] = a, t[r++] = l);
        continue;
      }
      a !== 65279 && (t[r++] = a);
    }
    return r;
  }
}, yd = class {
  constructor() {
    this.interim = new Uint8Array(3);
  }
  clear() {
    this.interim.fill(0);
  }
  decode(e, t) {
    let s = e.length;
    if (!s) return 0;
    let r = 0, n, o, a, l, c = 0, h = 0;
    if (this.interim[0]) {
      let f = !1, _ = this.interim[0];
      _ &= (_ & 224) === 192 ? 31 : (_ & 240) === 224 ? 15 : 7;
      let g = 0, y;
      for (; (y = this.interim[++g] & 63) && g < 4; ) _ <<= 6, _ |= y;
      let D = (this.interim[0] & 224) === 192 ? 2 : (this.interim[0] & 240) === 224 ? 3 : 4, R = D - g;
      for (; h < R; ) {
        if (h >= s) return 0;
        if (y = e[h++], (y & 192) !== 128) {
          h--, f = !0;
          break;
        } else this.interim[g++] = y, _ <<= 6, _ |= y & 63;
      }
      f || (D === 2 ? _ < 128 ? h-- : t[r++] = _ : D === 3 ? _ < 2048 || _ >= 55296 && _ <= 57343 || _ === 65279 || (t[r++] = _) : _ < 65536 || _ > 1114111 || (t[r++] = _)), this.interim.fill(0);
    }
    let d = s - 4, u = h;
    for (; u < s; ) {
      for (; u < d && !((n = e[u]) & 128) && !((o = e[u + 1]) & 128) && !((a = e[u + 2]) & 128) && !((l = e[u + 3]) & 128); ) t[r++] = n, t[r++] = o, t[r++] = a, t[r++] = l, u += 4;
      if (n = e[u++], n < 128) t[r++] = n;
      else if ((n & 224) === 192) {
        if (u >= s) return this.interim[0] = n, r;
        if (o = e[u++], (o & 192) !== 128) {
          u--;
          continue;
        }
        if (c = (n & 31) << 6 | o & 63, c < 128) {
          u--;
          continue;
        }
        t[r++] = c;
      } else if ((n & 240) === 224) {
        if (u >= s) return this.interim[0] = n, r;
        if (o = e[u++], (o & 192) !== 128) {
          u--;
          continue;
        }
        if (u >= s) return this.interim[0] = n, this.interim[1] = o, r;
        if (a = e[u++], (a & 192) !== 128) {
          u--;
          continue;
        }
        if (c = (n & 15) << 12 | (o & 63) << 6 | a & 63, c < 2048 || c >= 55296 && c <= 57343 || c === 65279) continue;
        t[r++] = c;
      } else if ((n & 248) === 240) {
        if (u >= s) return this.interim[0] = n, r;
        if (o = e[u++], (o & 192) !== 128) {
          u--;
          continue;
        }
        if (u >= s) return this.interim[0] = n, this.interim[1] = o, r;
        if (a = e[u++], (a & 192) !== 128) {
          u--;
          continue;
        }
        if (u >= s) return this.interim[0] = n, this.interim[1] = o, this.interim[2] = a, r;
        if (l = e[u++], (l & 192) !== 128) {
          u--;
          continue;
        }
        if (c = (n & 7) << 18 | (o & 63) << 12 | (a & 63) << 6 | l & 63, c < 65536 || c > 1114111) continue;
        t[r++] = c;
      }
    }
    return r;
  }
}, ih = "", Ri = " ", Ys = class sh {
  constructor() {
    this.fg = 0, this.bg = 0, this.extended = new yr();
  }
  static toColorRGB(t) {
    return [t >>> 16 & 255, t >>> 8 & 255, t & 255];
  }
  static fromColorRGB(t) {
    return (t[0] & 255) << 16 | (t[1] & 255) << 8 | t[2] & 255;
  }
  clone() {
    let t = new sh();
    return t.fg = this.fg, t.bg = this.bg, t.extended = this.extended.clone(), t;
  }
  isInverse() {
    return this.fg & 67108864;
  }
  isBold() {
    return this.fg & 134217728;
  }
  isUnderline() {
    return this.hasExtendedAttrs() && this.extended.underlineStyle !== 0 ? 1 : this.fg & 268435456;
  }
  isBlink() {
    return this.fg & 536870912;
  }
  isInvisible() {
    return this.fg & 1073741824;
  }
  isItalic() {
    return this.bg & 67108864;
  }
  isDim() {
    return this.bg & 134217728;
  }
  isStrikethrough() {
    return this.fg & 2147483648;
  }
  isProtected() {
    return this.bg & 536870912;
  }
  isOverline() {
    return this.bg & 1073741824;
  }
  getFgColorMode() {
    return this.fg & 50331648;
  }
  getBgColorMode() {
    return this.bg & 50331648;
  }
  isFgRGB() {
    return (this.fg & 50331648) === 50331648;
  }
  isBgRGB() {
    return (this.bg & 50331648) === 50331648;
  }
  isFgPalette() {
    return (this.fg & 50331648) === 16777216 || (this.fg & 50331648) === 33554432;
  }
  isBgPalette() {
    return (this.bg & 50331648) === 16777216 || (this.bg & 50331648) === 33554432;
  }
  isFgDefault() {
    return (this.fg & 50331648) === 0;
  }
  isBgDefault() {
    return (this.bg & 50331648) === 0;
  }
  isAttributeDefault() {
    return this.fg === 0 && this.bg === 0;
  }
  getFgColor() {
    switch (this.fg & 50331648) {
      case 16777216:
      case 33554432:
        return this.fg & 255;
      case 50331648:
        return this.fg & 16777215;
      default:
        return -1;
    }
  }
  getBgColor() {
    switch (this.bg & 50331648) {
      case 16777216:
      case 33554432:
        return this.bg & 255;
      case 50331648:
        return this.bg & 16777215;
      default:
        return -1;
    }
  }
  hasExtendedAttrs() {
    return this.bg & 268435456;
  }
  updateExtended() {
    this.extended.isEmpty() ? this.bg &= -268435457 : this.bg |= 268435456;
  }
  getUnderlineColor() {
    if (this.bg & 268435456 && ~this.extended.underlineColor) switch (this.extended.underlineColor & 50331648) {
      case 16777216:
      case 33554432:
        return this.extended.underlineColor & 255;
      case 50331648:
        return this.extended.underlineColor & 16777215;
      default:
        return this.getFgColor();
    }
    return this.getFgColor();
  }
  getUnderlineColorMode() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? this.extended.underlineColor & 50331648 : this.getFgColorMode();
  }
  isUnderlineColorRGB() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 50331648 : this.isFgRGB();
  }
  isUnderlineColorPalette() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 16777216 || (this.extended.underlineColor & 50331648) === 33554432 : this.isFgPalette();
  }
  isUnderlineColorDefault() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 0 : this.isFgDefault();
  }
  getUnderlineStyle() {
    return this.fg & 268435456 ? this.bg & 268435456 ? this.extended.underlineStyle : 1 : 0;
  }
  getUnderlineVariantOffset() {
    return this.extended.underlineVariantOffset;
  }
}, yr = class rh {
  constructor(t = 0, s = 0) {
    this._ext = 0, this._urlId = 0, this._ext = t, this._urlId = s;
  }
  get ext() {
    return this._urlId ? this._ext & -469762049 | this.underlineStyle << 26 : this._ext;
  }
  set ext(t) {
    this._ext = t;
  }
  get underlineStyle() {
    return this._urlId ? 5 : (this._ext & 469762048) >> 26;
  }
  set underlineStyle(t) {
    this._ext &= -469762049, this._ext |= t << 26 & 469762048;
  }
  get underlineColor() {
    return this._ext & 67108863;
  }
  set underlineColor(t) {
    this._ext &= -67108864, this._ext |= t & 67108863;
  }
  get urlId() {
    return this._urlId;
  }
  set urlId(t) {
    this._urlId = t;
  }
  get underlineVariantOffset() {
    let t = (this._ext & 3758096384) >> 29;
    return t < 0 ? t ^ 4294967288 : t;
  }
  set underlineVariantOffset(t) {
    this._ext &= 536870911, this._ext |= t << 29 & 3758096384;
  }
  clone() {
    return new rh(this._ext, this._urlId);
  }
  isEmpty() {
    return this.underlineStyle === 0 && this._urlId === 0;
  }
}, Nt = class nh extends Ys {
  constructor() {
    super(...arguments), this.content = 0, this.fg = 0, this.bg = 0, this.extended = new yr(), this.combinedData = "";
  }
  static fromCharData(t) {
    let s = new nh();
    return s.setFromCharData(t), s;
  }
  isCombined() {
    return this.content & 2097152;
  }
  getWidth() {
    return this.content >> 22;
  }
  getChars() {
    return this.content & 2097152 ? this.combinedData : this.content & 2097151 ? Di(this.content & 2097151) : "";
  }
  getCode() {
    return this.isCombined() ? this.combinedData.charCodeAt(this.combinedData.length - 1) : this.content & 2097151;
  }
  setFromCharData(t) {
    this.fg = t[0], this.bg = 0;
    let s = !1;
    if (t[1].length > 2) s = !0;
    else if (t[1].length === 2) {
      let r = t[1].charCodeAt(0);
      if (55296 <= r && r <= 56319) {
        let n = t[1].charCodeAt(1);
        56320 <= n && n <= 57343 ? this.content = (r - 55296) * 1024 + n - 56320 + 65536 | t[2] << 22 : s = !0;
      } else s = !0;
    } else this.content = t[1].charCodeAt(0) | t[2] << 22;
    s && (this.combinedData = t[1], this.content = 2097152 | t[2] << 22);
  }
  getAsCharData() {
    return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
  }
}, sa = "di$target", Mn = "di$dependencies", Kr = /* @__PURE__ */ new Map();
function Cd(e) {
  return e[Mn] || [];
}
function at(e) {
  if (Kr.has(e)) return Kr.get(e);
  let t = function(s, r, n) {
    if (arguments.length !== 3) throw new Error("@IServiceName-decorator can only be used to decorate a parameter");
    xd(t, s, n);
  };
  return t._id = e, Kr.set(e, t), t;
}
function xd(e, t, s) {
  t[sa] === t ? t[Mn].push({ id: e, index: s }) : (t[Mn] = [{ id: e, index: s }], t[sa] = t);
}
var mt = at("BufferService"), oh = at("CoreMouseService"), Gi = at("CoreService"), kd = at("CharsetService"), Lo = at("InstantiationService"), ah = at("LogService"), wt = at("OptionsService"), lh = at("OscLinkService"), Ld = at("UnicodeService"), js = at("DecorationService"), En = class {
  constructor(e, t, s) {
    this._bufferService = e, this._optionsService = t, this._oscLinkService = s;
  }
  provideLinks(e, t) {
    var s;
    let r = this._bufferService.buffer.lines.get(e - 1);
    if (!r) {
      t(void 0);
      return;
    }
    let n = [], o = this._optionsService.rawOptions.linkHandler, a = new Nt(), l = r.getTrimmedLength(), c = -1, h = -1, d = !1;
    for (let u = 0; u < l; u++) if (!(h === -1 && !r.hasContent(u))) {
      if (r.loadCell(u, a), a.hasExtendedAttrs() && a.extended.urlId) if (h === -1) {
        h = u, c = a.extended.urlId;
        continue;
      } else d = a.extended.urlId !== c;
      else h !== -1 && (d = !0);
      if (d || h !== -1 && u === l - 1) {
        let f = (s = this._oscLinkService.getLinkData(c)) == null ? void 0 : s.uri;
        if (f) {
          let _ = { start: { x: h + 1, y: e }, end: { x: u + (!d && u === l - 1 ? 1 : 0), y: e } }, g = !1;
          if (!(o != null && o.allowNonHttpProtocols)) try {
            let y = new URL(f);
            ["http:", "https:"].includes(y.protocol) || (g = !0);
          } catch {
            g = !0;
          }
          g || n.push({ text: f, range: _, activate: (y, D) => o ? o.activate(y, D, _) : Md(y, D), hover: (y, D) => {
            var R;
            return (R = o == null ? void 0 : o.hover) == null ? void 0 : R.call(o, y, D, _);
          }, leave: (y, D) => {
            var R;
            return (R = o == null ? void 0 : o.leave) == null ? void 0 : R.call(o, y, D, _);
          } });
        }
        d = !1, a.hasExtendedAttrs() && a.extended.urlId ? (h = u, c = a.extended.urlId) : (h = -1, c = -1);
      }
    }
    t(n);
  }
};
En = $e([X(0, mt), X(1, wt), X(2, lh)], En);
function Md(e, t) {
  if (confirm(`Do you want to navigate to ${t}?

WARNING: This link could potentially be dangerous`)) {
    let s = window.open();
    if (s) {
      try {
        s.opener = null;
      } catch {
      }
      s.location.href = t;
    } else console.warn("Opening link blocked as opener could not be cleared");
  }
}
var Pr = at("CharSizeService"), di = at("CoreBrowserService"), Mo = at("MouseService"), ui = at("RenderService"), Ed = at("SelectionService"), hh = at("CharacterJoinerService"), vs = at("ThemeService"), ch = at("LinkProviderService"), Dd = class {
  constructor() {
    this.listeners = [], this.unexpectedErrorHandler = function(e) {
      setTimeout(() => {
        throw e.stack ? ra.isErrorNoTelemetry(e) ? new ra(e.message + `

` + e.stack) : new Error(e.message + `

` + e.stack) : e;
      }, 0);
    };
  }
  addListener(e) {
    return this.listeners.push(e), () => {
      this._removeListener(e);
    };
  }
  emit(e) {
    this.listeners.forEach((t) => {
      t(e);
    });
  }
  _removeListener(e) {
    this.listeners.splice(this.listeners.indexOf(e), 1);
  }
  setUnexpectedErrorHandler(e) {
    this.unexpectedErrorHandler = e;
  }
  getUnexpectedErrorHandler() {
    return this.unexpectedErrorHandler;
  }
  onUnexpectedError(e) {
    this.unexpectedErrorHandler(e), this.emit(e);
  }
  onUnexpectedExternalError(e) {
    this.unexpectedErrorHandler(e);
  }
}, Rd = new Dd();
function _r(e) {
  Td(e) || Rd.onUnexpectedError(e);
}
var Dn = "Canceled";
function Td(e) {
  return e instanceof Bd ? !0 : e instanceof Error && e.name === Dn && e.message === Dn;
}
var Bd = class extends Error {
  constructor() {
    super(Dn), this.name = this.message;
  }
};
function Pd(e) {
  return new Error(`Illegal argument: ${e}`);
}
var ra = class Rn extends Error {
  constructor(t) {
    super(t), this.name = "CodeExpectedError";
  }
  static fromError(t) {
    if (t instanceof Rn) return t;
    let s = new Rn();
    return s.message = t.message, s.stack = t.stack, s;
  }
  static isErrorNoTelemetry(t) {
    return t.name === "CodeExpectedError";
  }
}, Tn = class dh extends Error {
  constructor(t) {
    super(t || "An unexpected bug occurred."), Object.setPrototypeOf(this, dh.prototype);
  }
};
function xt(e, t = 0) {
  return e[e.length - (1 + t)];
}
var na;
((e) => {
  function t(o) {
    return o < 0;
  }
  e.isLessThan = t;
  function s(o) {
    return o <= 0;
  }
  e.isLessThanOrEqual = s;
  function r(o) {
    return o > 0;
  }
  e.isGreaterThan = r;
  function n(o) {
    return o === 0;
  }
  e.isNeitherLessOrGreaterThan = n, e.greaterThan = 1, e.lessThan = -1, e.neitherLessOrGreaterThan = 0;
})(na || (na = {}));
function Ad(e, t) {
  let s = this, r = !1, n;
  return function() {
    return r || (r = !0, n = e.apply(s, arguments)), n;
  };
}
var Bn;
((e) => {
  function t(k) {
    return k && typeof k == "object" && typeof k[Symbol.iterator] == "function";
  }
  e.is = t;
  let s = Object.freeze([]);
  function r() {
    return s;
  }
  e.empty = r;
  function* n(k) {
    yield k;
  }
  e.single = n;
  function o(k) {
    return t(k) ? k : n(k);
  }
  e.wrap = o;
  function a(k) {
    return k || s;
  }
  e.from = a;
  function* l(k) {
    for (let B = k.length - 1; B >= 0; B--) yield k[B];
  }
  e.reverse = l;
  function c(k) {
    return !k || k[Symbol.iterator]().next().done === !0;
  }
  e.isEmpty = c;
  function h(k) {
    return k[Symbol.iterator]().next().value;
  }
  e.first = h;
  function d(k, B) {
    let N = 0;
    for (let U of k) if (B(U, N++)) return !0;
    return !1;
  }
  e.some = d;
  function u(k, B) {
    for (let N of k) if (B(N)) return N;
  }
  e.find = u;
  function* f(k, B) {
    for (let N of k) B(N) && (yield N);
  }
  e.filter = f;
  function* _(k, B) {
    let N = 0;
    for (let U of k) yield B(U, N++);
  }
  e.map = _;
  function* g(k, B) {
    let N = 0;
    for (let U of k) yield* B(U, N++);
  }
  e.flatMap = g;
  function* y(...k) {
    for (let B of k) yield* B;
  }
  e.concat = y;
  function D(k, B, N) {
    let U = N;
    for (let ie of k) U = B(U, ie);
    return U;
  }
  e.reduce = D;
  function* R(k, B, N = k.length) {
    for (B < 0 && (B += k.length), N < 0 ? N += k.length : N > k.length && (N = k.length); B < N; B++) yield k[B];
  }
  e.slice = R;
  function H(k, B = Number.POSITIVE_INFINITY) {
    let N = [];
    if (B === 0) return [N, k];
    let U = k[Symbol.iterator]();
    for (let ie = 0; ie < B; ie++) {
      let Z = U.next();
      if (Z.done) return [N, e.empty()];
      N.push(Z.value);
    }
    return [N, { [Symbol.iterator]() {
      return U;
    } }];
  }
  e.consume = H;
  async function M(k) {
    let B = [];
    for await (let N of k) B.push(N);
    return Promise.resolve(B);
  }
  e.asyncToArray = M;
})(Bn || (Bn = {}));
function Yi(e) {
  if (Bn.is(e)) {
    let t = [];
    for (let s of e) if (s) try {
      s.dispose();
    } catch (r) {
      t.push(r);
    }
    if (t.length === 1) throw t[0];
    if (t.length > 1) throw new AggregateError(t, "Encountered errors while disposing of store");
    return Array.isArray(e) ? [] : e;
  } else if (e) return e.dispose(), e;
}
function Nd(...e) {
  return Ae(() => Yi(e));
}
function Ae(e) {
  return { dispose: Ad(() => {
    e();
  }) };
}
var uh = class _h {
  constructor() {
    this._toDispose = /* @__PURE__ */ new Set(), this._isDisposed = !1;
  }
  dispose() {
    this._isDisposed || (this._isDisposed = !0, this.clear());
  }
  get isDisposed() {
    return this._isDisposed;
  }
  clear() {
    if (this._toDispose.size !== 0) try {
      Yi(this._toDispose);
    } finally {
      this._toDispose.clear();
    }
  }
  add(t) {
    if (!t) return t;
    if (t === this) throw new Error("Cannot register a disposable on itself!");
    return this._isDisposed ? _h.DISABLE_DISPOSED_WARNING || console.warn(new Error("Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!").stack) : this._toDispose.add(t), t;
  }
  delete(t) {
    if (t) {
      if (t === this) throw new Error("Cannot dispose a disposable on itself!");
      this._toDispose.delete(t), t.dispose();
    }
  }
  deleteAndLeak(t) {
    t && this._toDispose.has(t) && this._toDispose.delete(t);
  }
};
uh.DISABLE_DISPOSED_WARNING = !1;
var Bi = uh, ue = class {
  constructor() {
    this._store = new Bi(), this._store;
  }
  dispose() {
    this._store.dispose();
  }
  _register(e) {
    if (e === this) throw new Error("Cannot register a disposable on itself!");
    return this._store.add(e);
  }
};
ue.None = Object.freeze({ dispose() {
} });
var gs = class {
  constructor() {
    this._isDisposed = !1;
  }
  get value() {
    return this._isDisposed ? void 0 : this._value;
  }
  set value(e) {
    var t;
    this._isDisposed || e === this._value || ((t = this._value) == null || t.dispose(), this._value = e);
  }
  clear() {
    this.value = void 0;
  }
  dispose() {
    var e;
    this._isDisposed = !0, (e = this._value) == null || e.dispose(), this._value = void 0;
  }
  clearAndLeak() {
    let e = this._value;
    return this._value = void 0, e;
  }
}, ci = typeof window == "object" ? window : globalThis, Pn = class An {
  constructor(t) {
    this.element = t, this.next = An.Undefined, this.prev = An.Undefined;
  }
};
Pn.Undefined = new Pn(void 0);
var Ne = Pn, oa = class {
  constructor() {
    this._first = Ne.Undefined, this._last = Ne.Undefined, this._size = 0;
  }
  get size() {
    return this._size;
  }
  isEmpty() {
    return this._first === Ne.Undefined;
  }
  clear() {
    let e = this._first;
    for (; e !== Ne.Undefined; ) {
      let t = e.next;
      e.prev = Ne.Undefined, e.next = Ne.Undefined, e = t;
    }
    this._first = Ne.Undefined, this._last = Ne.Undefined, this._size = 0;
  }
  unshift(e) {
    return this._insert(e, !1);
  }
  push(e) {
    return this._insert(e, !0);
  }
  _insert(e, t) {
    let s = new Ne(e);
    if (this._first === Ne.Undefined) this._first = s, this._last = s;
    else if (t) {
      let n = this._last;
      this._last = s, s.prev = n, n.next = s;
    } else {
      let n = this._first;
      this._first = s, s.next = n, n.prev = s;
    }
    this._size += 1;
    let r = !1;
    return () => {
      r || (r = !0, this._remove(s));
    };
  }
  shift() {
    if (this._first !== Ne.Undefined) {
      let e = this._first.element;
      return this._remove(this._first), e;
    }
  }
  pop() {
    if (this._last !== Ne.Undefined) {
      let e = this._last.element;
      return this._remove(this._last), e;
    }
  }
  _remove(e) {
    if (e.prev !== Ne.Undefined && e.next !== Ne.Undefined) {
      let t = e.prev;
      t.next = e.next, e.next.prev = t;
    } else e.prev === Ne.Undefined && e.next === Ne.Undefined ? (this._first = Ne.Undefined, this._last = Ne.Undefined) : e.next === Ne.Undefined ? (this._last = this._last.prev, this._last.next = Ne.Undefined) : e.prev === Ne.Undefined && (this._first = this._first.next, this._first.prev = Ne.Undefined);
    this._size -= 1;
  }
  *[Symbol.iterator]() {
    let e = this._first;
    for (; e !== Ne.Undefined; ) yield e.element, e = e.next;
  }
}, Od = globalThis.performance && typeof globalThis.performance.now == "function", Id = class fh {
  static create(t) {
    return new fh(t);
  }
  constructor(t) {
    this._now = Od && t === !1 ? Date.now : globalThis.performance.now.bind(globalThis.performance), this._startTime = this._now(), this._stopTime = -1;
  }
  stop() {
    this._stopTime = this._now();
  }
  reset() {
    this._startTime = this._now(), this._stopTime = -1;
  }
  elapsed() {
    return this._stopTime !== -1 ? this._stopTime - this._startTime : this._now() - this._startTime;
  }
}, ot;
((e) => {
  e.None = () => ue.None;
  function t(v, p) {
    return u(v, () => {
    }, 0, void 0, !0, void 0, p);
  }
  e.defer = t;
  function s(v) {
    return (p, w = null, m) => {
      let b = !1, L;
      return L = v((x) => {
        if (!b) return L ? L.dispose() : b = !0, p.call(w, x);
      }, null, m), b && L.dispose(), L;
    };
  }
  e.once = s;
  function r(v, p, w) {
    return h((m, b = null, L) => v((x) => m.call(b, p(x)), null, L), w);
  }
  e.map = r;
  function n(v, p, w) {
    return h((m, b = null, L) => v((x) => {
      p(x), m.call(b, x);
    }, null, L), w);
  }
  e.forEach = n;
  function o(v, p, w) {
    return h((m, b = null, L) => v((x) => p(x) && m.call(b, x), null, L), w);
  }
  e.filter = o;
  function a(v) {
    return v;
  }
  e.signal = a;
  function l(...v) {
    return (p, w = null, m) => {
      let b = Nd(...v.map((L) => L((x) => p.call(w, x))));
      return d(b, m);
    };
  }
  e.any = l;
  function c(v, p, w, m) {
    let b = w;
    return r(v, (L) => (b = p(b, L), b), m);
  }
  e.reduce = c;
  function h(v, p) {
    let w, m = { onWillAddFirstListener() {
      w = v(b.fire, b);
    }, onDidRemoveLastListener() {
      w == null || w.dispose();
    } }, b = new K(m);
    return p == null || p.add(b), b.event;
  }
  function d(v, p) {
    return p instanceof Array ? p.push(v) : p && p.add(v), v;
  }
  function u(v, p, w = 100, m = !1, b = !1, L, x) {
    let A, I, se, he = 0, re, ce = { leakWarningThreshold: L, onWillAddFirstListener() {
      A = v((ge) => {
        he++, I = p(I, ge), m && !se && (pe.fire(I), I = void 0), re = () => {
          let be = I;
          I = void 0, se = void 0, (!m || he > 1) && pe.fire(be), he = 0;
        }, typeof w == "number" ? (clearTimeout(se), se = setTimeout(re, w)) : se === void 0 && (se = 0, queueMicrotask(re));
      });
    }, onWillRemoveListener() {
      b && he > 0 && (re == null || re());
    }, onDidRemoveLastListener() {
      re = void 0, A.dispose();
    } }, pe = new K(ce);
    return x == null || x.add(pe), pe.event;
  }
  e.debounce = u;
  function f(v, p = 0, w) {
    return e.debounce(v, (m, b) => m ? (m.push(b), m) : [b], p, void 0, !0, void 0, w);
  }
  e.accumulate = f;
  function _(v, p = (m, b) => m === b, w) {
    let m = !0, b;
    return o(v, (L) => {
      let x = m || !p(L, b);
      return m = !1, b = L, x;
    }, w);
  }
  e.latch = _;
  function g(v, p, w) {
    return [e.filter(v, p, w), e.filter(v, (m) => !p(m), w)];
  }
  e.split = g;
  function y(v, p = !1, w = [], m) {
    let b = w.slice(), L = v((I) => {
      b ? b.push(I) : A.fire(I);
    });
    m && m.add(L);
    let x = () => {
      b == null || b.forEach((I) => A.fire(I)), b = null;
    }, A = new K({ onWillAddFirstListener() {
      L || (L = v((I) => A.fire(I)), m && m.add(L));
    }, onDidAddFirstListener() {
      b && (p ? setTimeout(x) : x());
    }, onDidRemoveLastListener() {
      L && L.dispose(), L = null;
    } });
    return m && m.add(A), A.event;
  }
  e.buffer = y;
  function D(v, p) {
    return (w, m, b) => {
      let L = p(new H());
      return v(function(x) {
        let A = L.evaluate(x);
        A !== R && w.call(m, A);
      }, void 0, b);
    };
  }
  e.chain = D;
  let R = Symbol("HaltChainable");
  class H {
    constructor() {
      this.steps = [];
    }
    map(p) {
      return this.steps.push(p), this;
    }
    forEach(p) {
      return this.steps.push((w) => (p(w), w)), this;
    }
    filter(p) {
      return this.steps.push((w) => p(w) ? w : R), this;
    }
    reduce(p, w) {
      let m = w;
      return this.steps.push((b) => (m = p(m, b), m)), this;
    }
    latch(p = (w, m) => w === m) {
      let w = !0, m;
      return this.steps.push((b) => {
        let L = w || !p(b, m);
        return w = !1, m = b, L ? b : R;
      }), this;
    }
    evaluate(p) {
      for (let w of this.steps) if (p = w(p), p === R) break;
      return p;
    }
  }
  function M(v, p, w = (m) => m) {
    let m = (...A) => x.fire(w(...A)), b = () => v.on(p, m), L = () => v.removeListener(p, m), x = new K({ onWillAddFirstListener: b, onDidRemoveLastListener: L });
    return x.event;
  }
  e.fromNodeEventEmitter = M;
  function k(v, p, w = (m) => m) {
    let m = (...A) => x.fire(w(...A)), b = () => v.addEventListener(p, m), L = () => v.removeEventListener(p, m), x = new K({ onWillAddFirstListener: b, onDidRemoveLastListener: L });
    return x.event;
  }
  e.fromDOMEventEmitter = k;
  function B(v) {
    return new Promise((p) => s(v)(p));
  }
  e.toPromise = B;
  function N(v) {
    let p = new K();
    return v.then((w) => {
      p.fire(w);
    }, () => {
      p.fire(void 0);
    }).finally(() => {
      p.dispose();
    }), p.event;
  }
  e.fromPromise = N;
  function U(v, p) {
    return v((w) => p.fire(w));
  }
  e.forward = U;
  function ie(v, p, w) {
    return p(w), v((m) => p(m));
  }
  e.runAndSubscribe = ie;
  class Z {
    constructor(p, w) {
      this._observable = p, this._counter = 0, this._hasChanged = !1;
      let m = { onWillAddFirstListener: () => {
        p.addObserver(this);
      }, onDidRemoveLastListener: () => {
        p.removeObserver(this);
      } };
      this.emitter = new K(m), w && w.add(this.emitter);
    }
    beginUpdate(p) {
      this._counter++;
    }
    handlePossibleChange(p) {
    }
    handleChange(p, w) {
      this._hasChanged = !0;
    }
    endUpdate(p) {
      this._counter--, this._counter === 0 && (this._observable.reportChanges(), this._hasChanged && (this._hasChanged = !1, this.emitter.fire(this._observable.get())));
    }
  }
  function _e(v, p) {
    return new Z(v, p).emitter.event;
  }
  e.fromObservable = _e;
  function Y(v) {
    return (p, w, m) => {
      let b = 0, L = !1, x = { beginUpdate() {
        b++;
      }, endUpdate() {
        b--, b === 0 && (v.reportChanges(), L && (L = !1, p.call(w)));
      }, handlePossibleChange() {
      }, handleChange() {
        L = !0;
      } };
      v.addObserver(x), v.reportChanges();
      let A = { dispose() {
        v.removeObserver(x);
      } };
      return m instanceof Bi ? m.add(A) : Array.isArray(m) && m.push(A), A;
    };
  }
  e.fromObservableLight = Y;
})(ot || (ot = {}));
var Nn = class On {
  constructor(t) {
    this.listenerCount = 0, this.invocationCount = 0, this.elapsedOverall = 0, this.durations = [], this.name = `${t}_${On._idPool++}`, On.all.add(this);
  }
  start(t) {
    this._stopWatch = new Id(), this.listenerCount = t;
  }
  stop() {
    if (this._stopWatch) {
      let t = this._stopWatch.elapsed();
      this.durations.push(t), this.elapsedOverall += t, this.invocationCount += 1, this._stopWatch = void 0;
    }
  }
};
Nn.all = /* @__PURE__ */ new Set(), Nn._idPool = 0;
var Fd = Nn, zd = -1, ph = class gh {
  constructor(t, s, r = (gh._idPool++).toString(16).padStart(3, "0")) {
    this._errorHandler = t, this.threshold = s, this.name = r, this._warnCountdown = 0;
  }
  dispose() {
    var t;
    (t = this._stacks) == null || t.clear();
  }
  check(t, s) {
    let r = this.threshold;
    if (r <= 0 || s < r) return;
    this._stacks || (this._stacks = /* @__PURE__ */ new Map());
    let n = this._stacks.get(t.value) || 0;
    if (this._stacks.set(t.value, n + 1), this._warnCountdown -= 1, this._warnCountdown <= 0) {
      this._warnCountdown = r * 0.5;
      let [o, a] = this.getMostFrequentStack(), l = `[${this.name}] potential listener LEAK detected, having ${s} listeners already. MOST frequent listener (${a}):`;
      console.warn(l), console.warn(o);
      let c = new Hd(l, o);
      this._errorHandler(c);
    }
    return () => {
      let o = this._stacks.get(t.value) || 0;
      this._stacks.set(t.value, o - 1);
    };
  }
  getMostFrequentStack() {
    if (!this._stacks) return;
    let t, s = 0;
    for (let [r, n] of this._stacks) (!t || s < n) && (t = [r, n], s = n);
    return t;
  }
};
ph._idPool = 1;
var Wd = ph, $d = class vh {
  constructor(t) {
    this.value = t;
  }
  static create() {
    let t = new Error();
    return new vh(t.stack ?? "");
  }
  print() {
    console.warn(this.value.split(`
`).slice(2).join(`
`));
  }
}, Hd = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerLeakError", this.stack = t;
  }
}, Ud = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerRefusalError", this.stack = t;
  }
}, Kd = 0, Vr = class {
  constructor(e) {
    this.value = e, this.id = Kd++;
  }
}, Vd = 2, K = class {
  constructor(e) {
    var t, s, r, n;
    this._size = 0, this._options = e, this._leakageMon = (t = this._options) != null && t.leakWarningThreshold ? new Wd((e == null ? void 0 : e.onListenerError) ?? _r, ((s = this._options) == null ? void 0 : s.leakWarningThreshold) ?? zd) : void 0, this._perfMon = (r = this._options) != null && r._profName ? new Fd(this._options._profName) : void 0, this._deliveryQueue = (n = this._options) == null ? void 0 : n.deliveryQueue;
  }
  dispose() {
    var e, t, s, r;
    this._disposed || (this._disposed = !0, ((e = this._deliveryQueue) == null ? void 0 : e.current) === this && this._deliveryQueue.reset(), this._listeners && (this._listeners = void 0, this._size = 0), (s = (t = this._options) == null ? void 0 : t.onDidRemoveLastListener) == null || s.call(t), (r = this._leakageMon) == null || r.dispose());
  }
  get event() {
    return this._event ?? (this._event = (e, t, s) => {
      var r, n, o, a, l;
      if (this._leakageMon && this._size > this._leakageMon.threshold ** 2) {
        let u = `[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far (${this._size} vs ${this._leakageMon.threshold})`;
        console.warn(u);
        let f = this._leakageMon.getMostFrequentStack() ?? ["UNKNOWN stack", -1], _ = new Ud(`${u}. HINT: Stack shows most frequent listener (${f[1]}-times)`, f[0]);
        return (((r = this._options) == null ? void 0 : r.onListenerError) || _r)(_), ue.None;
      }
      if (this._disposed) return ue.None;
      t && (e = e.bind(t));
      let c = new Vr(e), h;
      this._leakageMon && this._size >= Math.ceil(this._leakageMon.threshold * 0.2) && (c.stack = $d.create(), h = this._leakageMon.check(c.stack, this._size + 1)), this._listeners ? this._listeners instanceof Vr ? (this._deliveryQueue ?? (this._deliveryQueue = new qd()), this._listeners = [this._listeners, c]) : this._listeners.push(c) : ((o = (n = this._options) == null ? void 0 : n.onWillAddFirstListener) == null || o.call(n, this), this._listeners = c, (l = (a = this._options) == null ? void 0 : a.onDidAddFirstListener) == null || l.call(a, this)), this._size++;
      let d = Ae(() => {
        h == null || h(), this._removeListener(c);
      });
      return s instanceof Bi ? s.add(d) : Array.isArray(s) && s.push(d), d;
    }), this._event;
  }
  _removeListener(e) {
    var t, s, r, n;
    if ((s = (t = this._options) == null ? void 0 : t.onWillRemoveListener) == null || s.call(t, this), !this._listeners) return;
    if (this._size === 1) {
      this._listeners = void 0, (n = (r = this._options) == null ? void 0 : r.onDidRemoveLastListener) == null || n.call(r, this), this._size = 0;
      return;
    }
    let o = this._listeners, a = o.indexOf(e);
    if (a === -1) throw console.log("disposed?", this._disposed), console.log("size?", this._size), console.log("arr?", JSON.stringify(this._listeners)), new Error("Attempted to dispose unknown listener");
    this._size--, o[a] = void 0;
    let l = this._deliveryQueue.current === this;
    if (this._size * Vd <= o.length) {
      let c = 0;
      for (let h = 0; h < o.length; h++) o[h] ? o[c++] = o[h] : l && (this._deliveryQueue.end--, c < this._deliveryQueue.i && this._deliveryQueue.i--);
      o.length = c;
    }
  }
  _deliver(e, t) {
    var s;
    if (!e) return;
    let r = ((s = this._options) == null ? void 0 : s.onListenerError) || _r;
    if (!r) {
      e.value(t);
      return;
    }
    try {
      e.value(t);
    } catch (n) {
      r(n);
    }
  }
  _deliverQueue(e) {
    let t = e.current._listeners;
    for (; e.i < e.end; ) this._deliver(t[e.i++], e.value);
    e.reset();
  }
  fire(e) {
    var t, s, r, n;
    if ((t = this._deliveryQueue) != null && t.current && (this._deliverQueue(this._deliveryQueue), (s = this._perfMon) == null || s.stop()), (r = this._perfMon) == null || r.start(this._size), this._listeners) if (this._listeners instanceof Vr) this._deliver(this._listeners, e);
    else {
      let o = this._deliveryQueue;
      o.enqueue(this, e, this._listeners.length), this._deliverQueue(o);
    }
    (n = this._perfMon) == null || n.stop();
  }
  hasListeners() {
    return this._size > 0;
  }
}, qd = class {
  constructor() {
    this.i = -1, this.end = 0;
  }
  enqueue(e, t, s) {
    this.i = 0, this.end = s, this.current = e, this.value = t;
  }
  reset() {
    this.i = this.end, this.current = void 0, this.value = void 0;
  }
}, In = class {
  constructor() {
    this.mapWindowIdToZoomLevel = /* @__PURE__ */ new Map(), this._onDidChangeZoomLevel = new K(), this.onDidChangeZoomLevel = this._onDidChangeZoomLevel.event, this.mapWindowIdToZoomFactor = /* @__PURE__ */ new Map(), this._onDidChangeFullscreen = new K(), this.onDidChangeFullscreen = this._onDidChangeFullscreen.event, this.mapWindowIdToFullScreen = /* @__PURE__ */ new Map();
  }
  getZoomLevel(e) {
    return this.mapWindowIdToZoomLevel.get(this.getWindowId(e)) ?? 0;
  }
  setZoomLevel(e, t) {
    if (this.getZoomLevel(t) === e) return;
    let s = this.getWindowId(t);
    this.mapWindowIdToZoomLevel.set(s, e), this._onDidChangeZoomLevel.fire(s);
  }
  getZoomFactor(e) {
    return this.mapWindowIdToZoomFactor.get(this.getWindowId(e)) ?? 1;
  }
  setZoomFactor(e, t) {
    this.mapWindowIdToZoomFactor.set(this.getWindowId(t), e);
  }
  setFullscreen(e, t) {
    if (this.isFullscreen(t) === e) return;
    let s = this.getWindowId(t);
    this.mapWindowIdToFullScreen.set(s, e), this._onDidChangeFullscreen.fire(s);
  }
  isFullscreen(e) {
    return !!this.mapWindowIdToFullScreen.get(this.getWindowId(e));
  }
  getWindowId(e) {
    return e.vscodeWindowId;
  }
};
In.INSTANCE = new In();
var Eo = In;
function Yd(e, t, s) {
  typeof t == "string" && (t = e.matchMedia(t)), t.addEventListener("change", s);
}
Eo.INSTANCE.onDidChangeZoomLevel;
function jd(e) {
  return Eo.INSTANCE.getZoomFactor(e);
}
Eo.INSTANCE.onDidChangeFullscreen;
var ms = typeof navigator == "object" ? navigator.userAgent : "", Fn = ms.indexOf("Firefox") >= 0, Gd = ms.indexOf("AppleWebKit") >= 0, Do = ms.indexOf("Chrome") >= 0, Xd = !Do && ms.indexOf("Safari") >= 0;
ms.indexOf("Electron/") >= 0;
ms.indexOf("Android") >= 0;
var qr = !1;
if (typeof ci.matchMedia == "function") {
  let e = ci.matchMedia("(display-mode: standalone) or (display-mode: window-controls-overlay)"), t = ci.matchMedia("(display-mode: fullscreen)");
  qr = e.matches, Yd(ci, e, ({ matches: s }) => {
    qr && t.matches || (qr = s);
  });
}
var cs = "en", zn = !1, Wn = !1, fr = !1, mh = !1, ir, pr = cs, aa = cs, Zd, Ut, Ki = globalThis, pt, la;
typeof Ki.vscode < "u" && typeof Ki.vscode.process < "u" ? pt = Ki.vscode.process : typeof process < "u" && typeof ((la = process == null ? void 0 : process.versions) == null ? void 0 : la.node) == "string" && (pt = process);
var ha, Jd = typeof ((ha = pt == null ? void 0 : pt.versions) == null ? void 0 : ha.electron) == "string", Qd = Jd && (pt == null ? void 0 : pt.type) === "renderer", ca;
if (typeof pt == "object") {
  zn = pt.platform === "win32", Wn = pt.platform === "darwin", fr = pt.platform === "linux", fr && pt.env.SNAP && pt.env.SNAP_REVISION, pt.env.CI || pt.env.BUILD_ARTIFACTSTAGINGDIRECTORY, ir = cs, pr = cs;
  let e = pt.env.VSCODE_NLS_CONFIG;
  if (e) try {
    let t = JSON.parse(e);
    ir = t.userLocale, aa = t.osLocale, pr = t.resolvedLanguage || cs, Zd = (ca = t.languagePack) == null ? void 0 : ca.translationsConfigFile;
  } catch {
  }
  mh = !0;
} else typeof navigator == "object" && !Qd ? (Ut = navigator.userAgent, zn = Ut.indexOf("Windows") >= 0, Wn = Ut.indexOf("Macintosh") >= 0, (Ut.indexOf("Macintosh") >= 0 || Ut.indexOf("iPad") >= 0 || Ut.indexOf("iPhone") >= 0) && navigator.maxTouchPoints && navigator.maxTouchPoints > 0, fr = Ut.indexOf("Linux") >= 0, (Ut == null ? void 0 : Ut.indexOf("Mobi")) >= 0, pr = globalThis._VSCODE_NLS_LANGUAGE || cs, ir = navigator.language.toLowerCase(), aa = ir) : console.error("Unable to resolve platform.");
var wh = zn, Zt = Wn, eu = fr, da = mh, Jt = Ut, yi = pr, ua;
((e) => {
  function t() {
    return yi;
  }
  e.value = t;
  function s() {
    return yi.length === 2 ? yi === "en" : yi.length >= 3 ? yi[0] === "e" && yi[1] === "n" && yi[2] === "-" : !1;
  }
  e.isDefaultVariant = s;
  function r() {
    return yi === "en";
  }
  e.isDefault = r;
})(ua || (ua = {}));
var tu = typeof Ki.postMessage == "function" && !Ki.importScripts;
(() => {
  if (tu) {
    let e = [];
    Ki.addEventListener("message", (s) => {
      if (s.data && s.data.vscodeScheduleAsyncWork) for (let r = 0, n = e.length; r < n; r++) {
        let o = e[r];
        if (o.id === s.data.vscodeScheduleAsyncWork) {
          e.splice(r, 1), o.callback();
          return;
        }
      }
    });
    let t = 0;
    return (s) => {
      let r = ++t;
      e.push({ id: r, callback: s }), Ki.postMessage({ vscodeScheduleAsyncWork: r }, "*");
    };
  }
  return (e) => setTimeout(e);
})();
var iu = !!(Jt && Jt.indexOf("Chrome") >= 0);
Jt && Jt.indexOf("Firefox") >= 0;
!iu && Jt && Jt.indexOf("Safari") >= 0;
Jt && Jt.indexOf("Edg/") >= 0;
Jt && Jt.indexOf("Android") >= 0;
var ns = typeof navigator == "object" ? navigator : {};
da || document.queryCommandSupported && document.queryCommandSupported("copy") || ns && ns.clipboard && ns.clipboard.writeText, da || ns && ns.clipboard && ns.clipboard.readText;
var Ro = class {
  constructor() {
    this._keyCodeToStr = [], this._strToKeyCode = /* @__PURE__ */ Object.create(null);
  }
  define(e, t) {
    this._keyCodeToStr[e] = t, this._strToKeyCode[t.toLowerCase()] = e;
  }
  keyCodeToStr(e) {
    return this._keyCodeToStr[e];
  }
  strToKeyCode(e) {
    return this._strToKeyCode[e.toLowerCase()] || 0;
  }
}, Yr = new Ro(), _a = new Ro(), fa = new Ro(), su = new Array(230), $n;
((e) => {
  function t(l) {
    return Yr.keyCodeToStr(l);
  }
  e.toString = t;
  function s(l) {
    return Yr.strToKeyCode(l);
  }
  e.fromString = s;
  function r(l) {
    return _a.keyCodeToStr(l);
  }
  e.toUserSettingsUS = r;
  function n(l) {
    return fa.keyCodeToStr(l);
  }
  e.toUserSettingsGeneral = n;
  function o(l) {
    return _a.strToKeyCode(l) || fa.strToKeyCode(l);
  }
  e.fromUserSettings = o;
  function a(l) {
    if (l >= 98 && l <= 113) return null;
    switch (l) {
      case 16:
        return "Up";
      case 18:
        return "Down";
      case 15:
        return "Left";
      case 17:
        return "Right";
    }
    return Yr.keyCodeToStr(l);
  }
  e.toElectronAccelerator = a;
})($n || ($n = {}));
var ru = class Sh {
  constructor(t, s, r, n, o) {
    this.ctrlKey = t, this.shiftKey = s, this.altKey = r, this.metaKey = n, this.keyCode = o;
  }
  equals(t) {
    return t instanceof Sh && this.ctrlKey === t.ctrlKey && this.shiftKey === t.shiftKey && this.altKey === t.altKey && this.metaKey === t.metaKey && this.keyCode === t.keyCode;
  }
  getHashCode() {
    let t = this.ctrlKey ? "1" : "0", s = this.shiftKey ? "1" : "0", r = this.altKey ? "1" : "0", n = this.metaKey ? "1" : "0";
    return `K${t}${s}${r}${n}${this.keyCode}`;
  }
  isModifierKey() {
    return this.keyCode === 0 || this.keyCode === 5 || this.keyCode === 57 || this.keyCode === 6 || this.keyCode === 4;
  }
  toKeybinding() {
    return new nu([this]);
  }
  isDuplicateModifierCase() {
    return this.ctrlKey && this.keyCode === 5 || this.shiftKey && this.keyCode === 4 || this.altKey && this.keyCode === 6 || this.metaKey && this.keyCode === 57;
  }
}, nu = class {
  constructor(e) {
    if (e.length === 0) throw Pd("chords");
    this.chords = e;
  }
  getHashCode() {
    let e = "";
    for (let t = 0, s = this.chords.length; t < s; t++) t !== 0 && (e += ";"), e += this.chords[t].getHashCode();
    return e;
  }
  equals(e) {
    if (e === null || this.chords.length !== e.chords.length) return !1;
    for (let t = 0; t < this.chords.length; t++) if (!this.chords[t].equals(e.chords[t])) return !1;
    return !0;
  }
};
function ou(e) {
  if (e.charCode) {
    let s = String.fromCharCode(e.charCode).toUpperCase();
    return $n.fromString(s);
  }
  let t = e.keyCode;
  if (t === 3) return 7;
  if (Fn) switch (t) {
    case 59:
      return 85;
    case 60:
      if (eu) return 97;
      break;
    case 61:
      return 86;
    case 107:
      return 109;
    case 109:
      return 111;
    case 173:
      return 88;
    case 224:
      if (Zt) return 57;
      break;
  }
  else if (Gd && (Zt && t === 93 || !Zt && t === 92))
    return 57;
  return su[t] || 0;
}
var au = Zt ? 256 : 2048, lu = 512, hu = 1024, cu = Zt ? 2048 : 256, pa = class {
  constructor(e) {
    var t;
    this._standardKeyboardEventBrand = !0;
    let s = e;
    this.browserEvent = s, this.target = s.target, this.ctrlKey = s.ctrlKey, this.shiftKey = s.shiftKey, this.altKey = s.altKey, this.metaKey = s.metaKey, this.altGraphKey = (t = s.getModifierState) == null ? void 0 : t.call(s, "AltGraph"), this.keyCode = ou(s), this.code = s.code, this.ctrlKey = this.ctrlKey || this.keyCode === 5, this.altKey = this.altKey || this.keyCode === 6, this.shiftKey = this.shiftKey || this.keyCode === 4, this.metaKey = this.metaKey || this.keyCode === 57, this._asKeybinding = this._computeKeybinding(), this._asKeyCodeChord = this._computeKeyCodeChord();
  }
  preventDefault() {
    this.browserEvent && this.browserEvent.preventDefault && this.browserEvent.preventDefault();
  }
  stopPropagation() {
    this.browserEvent && this.browserEvent.stopPropagation && this.browserEvent.stopPropagation();
  }
  toKeyCodeChord() {
    return this._asKeyCodeChord;
  }
  equals(e) {
    return this._asKeybinding === e;
  }
  _computeKeybinding() {
    let e = 0;
    this.keyCode !== 5 && this.keyCode !== 4 && this.keyCode !== 6 && this.keyCode !== 57 && (e = this.keyCode);
    let t = 0;
    return this.ctrlKey && (t |= au), this.altKey && (t |= lu), this.shiftKey && (t |= hu), this.metaKey && (t |= cu), t |= e, t;
  }
  _computeKeyCodeChord() {
    let e = 0;
    return this.keyCode !== 5 && this.keyCode !== 4 && this.keyCode !== 6 && this.keyCode !== 57 && (e = this.keyCode), new ru(this.ctrlKey, this.shiftKey, this.altKey, this.metaKey, e);
  }
}, ga = /* @__PURE__ */ new WeakMap();
function du(e) {
  if (!e.parent || e.parent === e) return null;
  try {
    let t = e.location, s = e.parent.location;
    if (t.origin !== "null" && s.origin !== "null" && t.origin !== s.origin) return null;
  } catch {
    return null;
  }
  return e.parent;
}
var uu = class {
  static getSameOriginWindowChain(e) {
    let t = ga.get(e);
    if (!t) {
      t = [], ga.set(e, t);
      let s = e, r;
      do
        r = du(s), r ? t.push({ window: new WeakRef(s), iframeElement: s.frameElement || null }) : t.push({ window: new WeakRef(s), iframeElement: null }), s = r;
      while (s);
    }
    return t.slice(0);
  }
  static getPositionOfChildWindowRelativeToAncestorWindow(e, t) {
    if (!t || e === t) return { top: 0, left: 0 };
    let s = 0, r = 0, n = this.getSameOriginWindowChain(e);
    for (let o of n) {
      let a = o.window.deref();
      if (s += (a == null ? void 0 : a.scrollY) ?? 0, r += (a == null ? void 0 : a.scrollX) ?? 0, a === t || !o.iframeElement) break;
      let l = o.iframeElement.getBoundingClientRect();
      s += l.top, r += l.left;
    }
    return { top: s, left: r };
  }
}, sr = class {
  constructor(e, t) {
    this.timestamp = Date.now(), this.browserEvent = t, this.leftButton = t.button === 0, this.middleButton = t.button === 1, this.rightButton = t.button === 2, this.buttons = t.buttons, this.target = t.target, this.detail = t.detail || 1, t.type === "dblclick" && (this.detail = 2), this.ctrlKey = t.ctrlKey, this.shiftKey = t.shiftKey, this.altKey = t.altKey, this.metaKey = t.metaKey, typeof t.pageX == "number" ? (this.posx = t.pageX, this.posy = t.pageY) : (this.posx = t.clientX + this.target.ownerDocument.body.scrollLeft + this.target.ownerDocument.documentElement.scrollLeft, this.posy = t.clientY + this.target.ownerDocument.body.scrollTop + this.target.ownerDocument.documentElement.scrollTop);
    let s = uu.getPositionOfChildWindowRelativeToAncestorWindow(e, t.view);
    this.posx -= s.left, this.posy -= s.top;
  }
  preventDefault() {
    this.browserEvent.preventDefault();
  }
  stopPropagation() {
    this.browserEvent.stopPropagation();
  }
}, va = class {
  constructor(e, t = 0, s = 0) {
    var r;
    this.browserEvent = e || null, this.target = e ? e.target || e.targetNode || e.srcElement : null, this.deltaY = s, this.deltaX = t;
    let n = !1;
    if (Do) {
      let o = navigator.userAgent.match(/Chrome\/(\d+)/);
      n = (o ? parseInt(o[1]) : 123) <= 122;
    }
    if (e) {
      let o = e, a = e, l = ((r = e.view) == null ? void 0 : r.devicePixelRatio) || 1;
      if (typeof o.wheelDeltaY < "u") n ? this.deltaY = o.wheelDeltaY / (120 * l) : this.deltaY = o.wheelDeltaY / 120;
      else if (typeof a.VERTICAL_AXIS < "u" && a.axis === a.VERTICAL_AXIS) this.deltaY = -a.detail / 3;
      else if (e.type === "wheel") {
        let c = e;
        c.deltaMode === c.DOM_DELTA_LINE ? Fn && !Zt ? this.deltaY = -e.deltaY / 3 : this.deltaY = -e.deltaY : this.deltaY = -e.deltaY / 40;
      }
      if (typeof o.wheelDeltaX < "u") Xd && wh ? this.deltaX = -(o.wheelDeltaX / 120) : n ? this.deltaX = o.wheelDeltaX / (120 * l) : this.deltaX = o.wheelDeltaX / 120;
      else if (typeof a.HORIZONTAL_AXIS < "u" && a.axis === a.HORIZONTAL_AXIS) this.deltaX = -e.detail / 3;
      else if (e.type === "wheel") {
        let c = e;
        c.deltaMode === c.DOM_DELTA_LINE ? Fn && !Zt ? this.deltaX = -e.deltaX / 3 : this.deltaX = -e.deltaX : this.deltaX = -e.deltaX / 40;
      }
      this.deltaY === 0 && this.deltaX === 0 && e.wheelDelta && (n ? this.deltaY = e.wheelDelta / (120 * l) : this.deltaY = e.wheelDelta / 120);
    }
  }
  preventDefault() {
    var e;
    (e = this.browserEvent) == null || e.preventDefault();
  }
  stopPropagation() {
    var e;
    (e = this.browserEvent) == null || e.stopPropagation();
  }
}, bh = Object.freeze(function(e, t) {
  let s = setTimeout(e.bind(t), 0);
  return { dispose() {
    clearTimeout(s);
  } };
}), ma;
((e) => {
  function t(s) {
    return s === e.None || s === e.Cancelled || s instanceof _u ? !0 : !s || typeof s != "object" ? !1 : typeof s.isCancellationRequested == "boolean" && typeof s.onCancellationRequested == "function";
  }
  e.isCancellationToken = t, e.None = Object.freeze({ isCancellationRequested: !1, onCancellationRequested: ot.None }), e.Cancelled = Object.freeze({ isCancellationRequested: !0, onCancellationRequested: bh });
})(ma || (ma = {}));
var _u = class {
  constructor() {
    this._isCancelled = !1, this._emitter = null;
  }
  cancel() {
    this._isCancelled || (this._isCancelled = !0, this._emitter && (this._emitter.fire(void 0), this.dispose()));
  }
  get isCancellationRequested() {
    return this._isCancelled;
  }
  get onCancellationRequested() {
    return this._isCancelled ? bh : (this._emitter || (this._emitter = new K()), this._emitter.event);
  }
  dispose() {
    this._emitter && (this._emitter.dispose(), this._emitter = null);
  }
}, To = class {
  constructor(e, t) {
    this._isDisposed = !1, this._token = -1, typeof e == "function" && typeof t == "number" && this.setIfNotSet(e, t);
  }
  dispose() {
    this.cancel(), this._isDisposed = !0;
  }
  cancel() {
    this._token !== -1 && (clearTimeout(this._token), this._token = -1);
  }
  cancelAndSet(e, t) {
    if (this._isDisposed) throw new Tn("Calling 'cancelAndSet' on a disposed TimeoutTimer");
    this.cancel(), this._token = setTimeout(() => {
      this._token = -1, e();
    }, t);
  }
  setIfNotSet(e, t) {
    if (this._isDisposed) throw new Tn("Calling 'setIfNotSet' on a disposed TimeoutTimer");
    this._token === -1 && (this._token = setTimeout(() => {
      this._token = -1, e();
    }, t));
  }
}, fu = class {
  constructor() {
    this.disposable = void 0, this.isDisposed = !1;
  }
  cancel() {
    var e;
    (e = this.disposable) == null || e.dispose(), this.disposable = void 0;
  }
  cancelAndSet(e, t, s = globalThis) {
    if (this.isDisposed) throw new Tn("Calling 'cancelAndSet' on a disposed IntervalTimer");
    this.cancel();
    let r = s.setInterval(() => {
      e();
    }, t);
    this.disposable = Ae(() => {
      s.clearInterval(r), this.disposable = void 0;
    });
  }
  dispose() {
    this.cancel(), this.isDisposed = !0;
  }
}, wa;
((e) => {
  async function t(r) {
    let n, o = await Promise.all(r.map((a) => a.then((l) => l, (l) => {
      n || (n = l);
    })));
    if (typeof n < "u") throw n;
    return o;
  }
  e.settled = t;
  function s(r) {
    return new Promise(async (n, o) => {
      try {
        await r(n, o);
      } catch (a) {
        o(a);
      }
    });
  }
  e.withAsyncBody = s;
})(wa || (wa = {}));
var Sa = class Et {
  static fromArray(t) {
    return new Et((s) => {
      s.emitMany(t);
    });
  }
  static fromPromise(t) {
    return new Et(async (s) => {
      s.emitMany(await t);
    });
  }
  static fromPromises(t) {
    return new Et(async (s) => {
      await Promise.all(t.map(async (r) => s.emitOne(await r)));
    });
  }
  static merge(t) {
    return new Et(async (s) => {
      await Promise.all(t.map(async (r) => {
        for await (let n of r) s.emitOne(n);
      }));
    });
  }
  constructor(t, s) {
    this._state = 0, this._results = [], this._error = null, this._onReturn = s, this._onStateChanged = new K(), queueMicrotask(async () => {
      let r = { emitOne: (n) => this.emitOne(n), emitMany: (n) => this.emitMany(n), reject: (n) => this.reject(n) };
      try {
        await Promise.resolve(t(r)), this.resolve();
      } catch (n) {
        this.reject(n);
      } finally {
        r.emitOne = void 0, r.emitMany = void 0, r.reject = void 0;
      }
    });
  }
  [Symbol.asyncIterator]() {
    let t = 0;
    return { next: async () => {
      do {
        if (this._state === 2) throw this._error;
        if (t < this._results.length) return { done: !1, value: this._results[t++] };
        if (this._state === 1) return { done: !0, value: void 0 };
        await ot.toPromise(this._onStateChanged.event);
      } while (!0);
    }, return: async () => {
      var s;
      return (s = this._onReturn) == null || s.call(this), { done: !0, value: void 0 };
    } };
  }
  static map(t, s) {
    return new Et(async (r) => {
      for await (let n of t) r.emitOne(s(n));
    });
  }
  map(t) {
    return Et.map(this, t);
  }
  static filter(t, s) {
    return new Et(async (r) => {
      for await (let n of t) s(n) && r.emitOne(n);
    });
  }
  filter(t) {
    return Et.filter(this, t);
  }
  static coalesce(t) {
    return Et.filter(t, (s) => !!s);
  }
  coalesce() {
    return Et.coalesce(this);
  }
  static async toPromise(t) {
    let s = [];
    for await (let r of t) s.push(r);
    return s;
  }
  toPromise() {
    return Et.toPromise(this);
  }
  emitOne(t) {
    this._state === 0 && (this._results.push(t), this._onStateChanged.fire());
  }
  emitMany(t) {
    this._state === 0 && (this._results = this._results.concat(t), this._onStateChanged.fire());
  }
  resolve() {
    this._state === 0 && (this._state = 1, this._onStateChanged.fire());
  }
  reject(t) {
    this._state === 0 && (this._state = 2, this._error = t, this._onStateChanged.fire());
  }
};
Sa.EMPTY = Sa.fromArray([]);
var { getWindow: jt, getWindowId: pu, onDidRegisterWindow: gu } = function() {
  let e = /* @__PURE__ */ new Map(), t = { window: ci, disposables: new Bi() };
  e.set(ci.vscodeWindowId, t);
  let s = new K(), r = new K(), n = new K();
  function o(a, l) {
    return (typeof a == "number" ? e.get(a) : void 0) ?? (l ? t : void 0);
  }
  return { onDidRegisterWindow: s.event, onWillUnregisterWindow: n.event, onDidUnregisterWindow: r.event, registerWindow(a) {
    if (e.has(a.vscodeWindowId)) return ue.None;
    let l = new Bi(), c = { window: a, disposables: l.add(new Bi()) };
    return e.set(a.vscodeWindowId, c), l.add(Ae(() => {
      e.delete(a.vscodeWindowId), r.fire(a);
    })), l.add(oe(a, Qe.BEFORE_UNLOAD, () => {
      n.fire(a);
    })), s.fire(c), l;
  }, getWindows() {
    return e.values();
  }, getWindowsCount() {
    return e.size;
  }, getWindowId(a) {
    return a.vscodeWindowId;
  }, hasWindow(a) {
    return e.has(a);
  }, getWindowById: o, getWindow(a) {
    var l;
    let c = a;
    if ((l = c == null ? void 0 : c.ownerDocument) != null && l.defaultView) return c.ownerDocument.defaultView.window;
    let h = a;
    return h != null && h.view ? h.view.window : ci;
  }, getDocument(a) {
    return jt(a).document;
  } };
}(), vu = class {
  constructor(e, t, s, r) {
    this._node = e, this._type = t, this._handler = s, this._options = r || !1, this._node.addEventListener(this._type, this._handler, this._options);
  }
  dispose() {
    this._handler && (this._node.removeEventListener(this._type, this._handler, this._options), this._node = null, this._handler = null);
  }
};
function oe(e, t, s, r) {
  return new vu(e, t, s, r);
}
var ba = function(e, t, s, r) {
  return oe(e, t, s, r);
}, Bo, mu = class extends fu {
  constructor(e) {
    super(), this.defaultTarget = e && jt(e);
  }
  cancelAndSet(e, t, s) {
    return super.cancelAndSet(e, t, s ?? this.defaultTarget);
  }
}, ya = class {
  constructor(e, t = 0) {
    this._runner = e, this.priority = t, this._canceled = !1;
  }
  dispose() {
    this._canceled = !0;
  }
  execute() {
    if (!this._canceled) try {
      this._runner();
    } catch (e) {
      _r(e);
    }
  }
  static sort(e, t) {
    return t.priority - e.priority;
  }
};
(function() {
  let e = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), n = (o) => {
    s.set(o, !1);
    let a = e.get(o) ?? [];
    for (t.set(o, a), e.set(o, []), r.set(o, !0); a.length > 0; ) a.sort(ya.sort), a.shift().execute();
    r.set(o, !1);
  };
  Bo = (o, a, l = 0) => {
    let c = pu(o), h = new ya(a, l), d = e.get(c);
    return d || (d = [], e.set(c, d)), d.push(h), s.get(c) || (s.set(c, !0), o.requestAnimationFrame(() => n(c))), h;
  };
})();
function wu(e) {
  let t = e.getBoundingClientRect(), s = jt(e);
  return { left: t.left + s.scrollX, top: t.top + s.scrollY, width: t.width, height: t.height };
}
var Qe = { CLICK: "click", MOUSE_DOWN: "mousedown", MOUSE_OVER: "mouseover", MOUSE_LEAVE: "mouseleave", MOUSE_WHEEL: "wheel", POINTER_UP: "pointerup", POINTER_DOWN: "pointerdown", POINTER_MOVE: "pointermove", KEY_DOWN: "keydown", KEY_UP: "keyup", BEFORE_UNLOAD: "beforeunload", CHANGE: "change", FOCUS: "focus", BLUR: "blur", INPUT: "input" }, Su = class {
  constructor(e) {
    this.domNode = e, this._maxWidth = "", this._width = "", this._height = "", this._top = "", this._left = "", this._bottom = "", this._right = "", this._paddingTop = "", this._paddingLeft = "", this._paddingBottom = "", this._paddingRight = "", this._fontFamily = "", this._fontWeight = "", this._fontSize = "", this._fontStyle = "", this._fontFeatureSettings = "", this._fontVariationSettings = "", this._textDecoration = "", this._lineHeight = "", this._letterSpacing = "", this._className = "", this._display = "", this._position = "", this._visibility = "", this._color = "", this._backgroundColor = "", this._layerHint = !1, this._contain = "none", this._boxShadow = "";
  }
  setMaxWidth(e) {
    let t = bt(e);
    this._maxWidth !== t && (this._maxWidth = t, this.domNode.style.maxWidth = this._maxWidth);
  }
  setWidth(e) {
    let t = bt(e);
    this._width !== t && (this._width = t, this.domNode.style.width = this._width);
  }
  setHeight(e) {
    let t = bt(e);
    this._height !== t && (this._height = t, this.domNode.style.height = this._height);
  }
  setTop(e) {
    let t = bt(e);
    this._top !== t && (this._top = t, this.domNode.style.top = this._top);
  }
  setLeft(e) {
    let t = bt(e);
    this._left !== t && (this._left = t, this.domNode.style.left = this._left);
  }
  setBottom(e) {
    let t = bt(e);
    this._bottom !== t && (this._bottom = t, this.domNode.style.bottom = this._bottom);
  }
  setRight(e) {
    let t = bt(e);
    this._right !== t && (this._right = t, this.domNode.style.right = this._right);
  }
  setPaddingTop(e) {
    let t = bt(e);
    this._paddingTop !== t && (this._paddingTop = t, this.domNode.style.paddingTop = this._paddingTop);
  }
  setPaddingLeft(e) {
    let t = bt(e);
    this._paddingLeft !== t && (this._paddingLeft = t, this.domNode.style.paddingLeft = this._paddingLeft);
  }
  setPaddingBottom(e) {
    let t = bt(e);
    this._paddingBottom !== t && (this._paddingBottom = t, this.domNode.style.paddingBottom = this._paddingBottom);
  }
  setPaddingRight(e) {
    let t = bt(e);
    this._paddingRight !== t && (this._paddingRight = t, this.domNode.style.paddingRight = this._paddingRight);
  }
  setFontFamily(e) {
    this._fontFamily !== e && (this._fontFamily = e, this.domNode.style.fontFamily = this._fontFamily);
  }
  setFontWeight(e) {
    this._fontWeight !== e && (this._fontWeight = e, this.domNode.style.fontWeight = this._fontWeight);
  }
  setFontSize(e) {
    let t = bt(e);
    this._fontSize !== t && (this._fontSize = t, this.domNode.style.fontSize = this._fontSize);
  }
  setFontStyle(e) {
    this._fontStyle !== e && (this._fontStyle = e, this.domNode.style.fontStyle = this._fontStyle);
  }
  setFontFeatureSettings(e) {
    this._fontFeatureSettings !== e && (this._fontFeatureSettings = e, this.domNode.style.fontFeatureSettings = this._fontFeatureSettings);
  }
  setFontVariationSettings(e) {
    this._fontVariationSettings !== e && (this._fontVariationSettings = e, this.domNode.style.fontVariationSettings = this._fontVariationSettings);
  }
  setTextDecoration(e) {
    this._textDecoration !== e && (this._textDecoration = e, this.domNode.style.textDecoration = this._textDecoration);
  }
  setLineHeight(e) {
    let t = bt(e);
    this._lineHeight !== t && (this._lineHeight = t, this.domNode.style.lineHeight = this._lineHeight);
  }
  setLetterSpacing(e) {
    let t = bt(e);
    this._letterSpacing !== t && (this._letterSpacing = t, this.domNode.style.letterSpacing = this._letterSpacing);
  }
  setClassName(e) {
    this._className !== e && (this._className = e, this.domNode.className = this._className);
  }
  toggleClassName(e, t) {
    this.domNode.classList.toggle(e, t), this._className = this.domNode.className;
  }
  setDisplay(e) {
    this._display !== e && (this._display = e, this.domNode.style.display = this._display);
  }
  setPosition(e) {
    this._position !== e && (this._position = e, this.domNode.style.position = this._position);
  }
  setVisibility(e) {
    this._visibility !== e && (this._visibility = e, this.domNode.style.visibility = this._visibility);
  }
  setColor(e) {
    this._color !== e && (this._color = e, this.domNode.style.color = this._color);
  }
  setBackgroundColor(e) {
    this._backgroundColor !== e && (this._backgroundColor = e, this.domNode.style.backgroundColor = this._backgroundColor);
  }
  setLayerHinting(e) {
    this._layerHint !== e && (this._layerHint = e, this.domNode.style.transform = this._layerHint ? "translate3d(0px, 0px, 0px)" : "");
  }
  setBoxShadow(e) {
    this._boxShadow !== e && (this._boxShadow = e, this.domNode.style.boxShadow = e);
  }
  setContain(e) {
    this._contain !== e && (this._contain = e, this.domNode.style.contain = this._contain);
  }
  setAttribute(e, t) {
    this.domNode.setAttribute(e, t);
  }
  removeAttribute(e) {
    this.domNode.removeAttribute(e);
  }
  appendChild(e) {
    this.domNode.appendChild(e.domNode);
  }
  removeChild(e) {
    this.domNode.removeChild(e.domNode);
  }
};
function bt(e) {
  return typeof e == "number" ? `${e}px` : e;
}
function Fs(e) {
  return new Su(e);
}
var yh = class {
  constructor() {
    this._hooks = new Bi(), this._pointerMoveCallback = null, this._onStopCallback = null;
  }
  dispose() {
    this.stopMonitoring(!1), this._hooks.dispose();
  }
  stopMonitoring(e, t) {
    if (!this.isMonitoring()) return;
    this._hooks.clear(), this._pointerMoveCallback = null;
    let s = this._onStopCallback;
    this._onStopCallback = null, e && s && s(t);
  }
  isMonitoring() {
    return !!this._pointerMoveCallback;
  }
  startMonitoring(e, t, s, r, n) {
    this.isMonitoring() && this.stopMonitoring(!1), this._pointerMoveCallback = r, this._onStopCallback = n;
    let o = e;
    try {
      e.setPointerCapture(t), this._hooks.add(Ae(() => {
        try {
          e.releasePointerCapture(t);
        } catch {
        }
      }));
    } catch {
      o = jt(e);
    }
    this._hooks.add(oe(o, Qe.POINTER_MOVE, (a) => {
      if (a.buttons !== s) {
        this.stopMonitoring(!0);
        return;
      }
      a.preventDefault(), this._pointerMoveCallback(a);
    })), this._hooks.add(oe(o, Qe.POINTER_UP, (a) => this.stopMonitoring(!0)));
  }
};
function bu(e, t, s) {
  let r = null, n = null;
  if (typeof s.value == "function" ? (r = "value", n = s.value, n.length !== 0 && console.warn("Memoize should only be used in functions with zero parameters")) : typeof s.get == "function" && (r = "get", n = s.get), !n) throw new Error("not supported");
  let o = `$memoize$${t}`;
  s[r] = function(...a) {
    return this.hasOwnProperty(o) || Object.defineProperty(this, o, { configurable: !1, enumerable: !1, writable: !1, value: n.apply(this, a) }), this[o];
  };
}
var Ft;
((e) => (e.Tap = "-xterm-gesturetap", e.Change = "-xterm-gesturechange", e.Start = "-xterm-gesturestart", e.End = "-xterm-gesturesend", e.Contextmenu = "-xterm-gesturecontextmenu"))(Ft || (Ft = {}));
var Ps = class ht extends ue {
  constructor() {
    super(), this.dispatched = !1, this.targets = new oa(), this.ignoreTargets = new oa(), this.activeTouches = {}, this.handle = null, this._lastSetTapCountTime = 0, this._register(ot.runAndSubscribe(gu, ({ window: t, disposables: s }) => {
      s.add(oe(t.document, "touchstart", (r) => this.onTouchStart(r), { passive: !1 })), s.add(oe(t.document, "touchend", (r) => this.onTouchEnd(t, r))), s.add(oe(t.document, "touchmove", (r) => this.onTouchMove(r), { passive: !1 }));
    }, { window: ci, disposables: this._store }));
  }
  static addTarget(t) {
    if (!ht.isTouchDevice()) return ue.None;
    ht.INSTANCE || (ht.INSTANCE = new ht());
    let s = ht.INSTANCE.targets.push(t);
    return Ae(s);
  }
  static ignoreTarget(t) {
    if (!ht.isTouchDevice()) return ue.None;
    ht.INSTANCE || (ht.INSTANCE = new ht());
    let s = ht.INSTANCE.ignoreTargets.push(t);
    return Ae(s);
  }
  static isTouchDevice() {
    return "ontouchstart" in ci || navigator.maxTouchPoints > 0;
  }
  dispose() {
    this.handle && (this.handle.dispose(), this.handle = null), super.dispose();
  }
  onTouchStart(t) {
    let s = Date.now();
    this.handle && (this.handle.dispose(), this.handle = null);
    for (let r = 0, n = t.targetTouches.length; r < n; r++) {
      let o = t.targetTouches.item(r);
      this.activeTouches[o.identifier] = { id: o.identifier, initialTarget: o.target, initialTimeStamp: s, initialPageX: o.pageX, initialPageY: o.pageY, rollingTimestamps: [s], rollingPageX: [o.pageX], rollingPageY: [o.pageY] };
      let a = this.newGestureEvent(Ft.Start, o.target);
      a.pageX = o.pageX, a.pageY = o.pageY, this.dispatchEvent(a);
    }
    this.dispatched && (t.preventDefault(), t.stopPropagation(), this.dispatched = !1);
  }
  onTouchEnd(t, s) {
    let r = Date.now(), n = Object.keys(this.activeTouches).length;
    for (let o = 0, a = s.changedTouches.length; o < a; o++) {
      let l = s.changedTouches.item(o);
      if (!this.activeTouches.hasOwnProperty(String(l.identifier))) {
        console.warn("move of an UNKNOWN touch", l);
        continue;
      }
      let c = this.activeTouches[l.identifier], h = Date.now() - c.initialTimeStamp;
      if (h < ht.HOLD_DELAY && Math.abs(c.initialPageX - xt(c.rollingPageX)) < 30 && Math.abs(c.initialPageY - xt(c.rollingPageY)) < 30) {
        let d = this.newGestureEvent(Ft.Tap, c.initialTarget);
        d.pageX = xt(c.rollingPageX), d.pageY = xt(c.rollingPageY), this.dispatchEvent(d);
      } else if (h >= ht.HOLD_DELAY && Math.abs(c.initialPageX - xt(c.rollingPageX)) < 30 && Math.abs(c.initialPageY - xt(c.rollingPageY)) < 30) {
        let d = this.newGestureEvent(Ft.Contextmenu, c.initialTarget);
        d.pageX = xt(c.rollingPageX), d.pageY = xt(c.rollingPageY), this.dispatchEvent(d);
      } else if (n === 1) {
        let d = xt(c.rollingPageX), u = xt(c.rollingPageY), f = xt(c.rollingTimestamps) - c.rollingTimestamps[0], _ = d - c.rollingPageX[0], g = u - c.rollingPageY[0], y = [...this.targets].filter((D) => c.initialTarget instanceof Node && D.contains(c.initialTarget));
        this.inertia(t, y, r, Math.abs(_) / f, _ > 0 ? 1 : -1, d, Math.abs(g) / f, g > 0 ? 1 : -1, u);
      }
      this.dispatchEvent(this.newGestureEvent(Ft.End, c.initialTarget)), delete this.activeTouches[l.identifier];
    }
    this.dispatched && (s.preventDefault(), s.stopPropagation(), this.dispatched = !1);
  }
  newGestureEvent(t, s) {
    let r = document.createEvent("CustomEvent");
    return r.initEvent(t, !1, !0), r.initialTarget = s, r.tapCount = 0, r;
  }
  dispatchEvent(t) {
    if (t.type === Ft.Tap) {
      let s = (/* @__PURE__ */ new Date()).getTime(), r = 0;
      s - this._lastSetTapCountTime > ht.CLEAR_TAP_COUNT_TIME ? r = 1 : r = 2, this._lastSetTapCountTime = s, t.tapCount = r;
    } else (t.type === Ft.Change || t.type === Ft.Contextmenu) && (this._lastSetTapCountTime = 0);
    if (t.initialTarget instanceof Node) {
      for (let r of this.ignoreTargets) if (r.contains(t.initialTarget)) return;
      let s = [];
      for (let r of this.targets) if (r.contains(t.initialTarget)) {
        let n = 0, o = t.initialTarget;
        for (; o && o !== r; ) n++, o = o.parentElement;
        s.push([n, r]);
      }
      s.sort((r, n) => r[0] - n[0]);
      for (let [r, n] of s) n.dispatchEvent(t), this.dispatched = !0;
    }
  }
  inertia(t, s, r, n, o, a, l, c, h) {
    this.handle = Bo(t, () => {
      let d = Date.now(), u = d - r, f = 0, _ = 0, g = !0;
      n += ht.SCROLL_FRICTION * u, l += ht.SCROLL_FRICTION * u, n > 0 && (g = !1, f = o * n * u), l > 0 && (g = !1, _ = c * l * u);
      let y = this.newGestureEvent(Ft.Change);
      y.translationX = f, y.translationY = _, s.forEach((D) => D.dispatchEvent(y)), g || this.inertia(t, s, d, n, o, a + f, l, c, h + _);
    });
  }
  onTouchMove(t) {
    let s = Date.now();
    for (let r = 0, n = t.changedTouches.length; r < n; r++) {
      let o = t.changedTouches.item(r);
      if (!this.activeTouches.hasOwnProperty(String(o.identifier))) {
        console.warn("end of an UNKNOWN touch", o);
        continue;
      }
      let a = this.activeTouches[o.identifier], l = this.newGestureEvent(Ft.Change, a.initialTarget);
      l.translationX = o.pageX - xt(a.rollingPageX), l.translationY = o.pageY - xt(a.rollingPageY), l.pageX = o.pageX, l.pageY = o.pageY, this.dispatchEvent(l), a.rollingPageX.length > 3 && (a.rollingPageX.shift(), a.rollingPageY.shift(), a.rollingTimestamps.shift()), a.rollingPageX.push(o.pageX), a.rollingPageY.push(o.pageY), a.rollingTimestamps.push(s);
    }
    this.dispatched && (t.preventDefault(), t.stopPropagation(), this.dispatched = !1);
  }
};
Ps.SCROLL_FRICTION = -5e-3, Ps.HOLD_DELAY = 700, Ps.CLEAR_TAP_COUNT_TIME = 400, $e([bu], Ps, "isTouchDevice", 1);
var yu = Ps, Po = class extends ue {
  onclick(e, t) {
    this._register(oe(e, Qe.CLICK, (s) => t(new sr(jt(e), s))));
  }
  onmousedown(e, t) {
    this._register(oe(e, Qe.MOUSE_DOWN, (s) => t(new sr(jt(e), s))));
  }
  onmouseover(e, t) {
    this._register(oe(e, Qe.MOUSE_OVER, (s) => t(new sr(jt(e), s))));
  }
  onmouseleave(e, t) {
    this._register(oe(e, Qe.MOUSE_LEAVE, (s) => t(new sr(jt(e), s))));
  }
  onkeydown(e, t) {
    this._register(oe(e, Qe.KEY_DOWN, (s) => t(new pa(s))));
  }
  onkeyup(e, t) {
    this._register(oe(e, Qe.KEY_UP, (s) => t(new pa(s))));
  }
  oninput(e, t) {
    this._register(oe(e, Qe.INPUT, t));
  }
  onblur(e, t) {
    this._register(oe(e, Qe.BLUR, t));
  }
  onfocus(e, t) {
    this._register(oe(e, Qe.FOCUS, t));
  }
  onchange(e, t) {
    this._register(oe(e, Qe.CHANGE, t));
  }
  ignoreGesture(e) {
    return yu.ignoreTarget(e);
  }
}, Ca = 11, Cu = class extends Po {
  constructor(e) {
    super(), this._onActivate = e.onActivate, this.bgDomNode = document.createElement("div"), this.bgDomNode.className = "arrow-background", this.bgDomNode.style.position = "absolute", this.bgDomNode.style.width = e.bgWidth + "px", this.bgDomNode.style.height = e.bgHeight + "px", typeof e.top < "u" && (this.bgDomNode.style.top = "0px"), typeof e.left < "u" && (this.bgDomNode.style.left = "0px"), typeof e.bottom < "u" && (this.bgDomNode.style.bottom = "0px"), typeof e.right < "u" && (this.bgDomNode.style.right = "0px"), this.domNode = document.createElement("div"), this.domNode.className = e.className, this.domNode.style.position = "absolute", this.domNode.style.width = Ca + "px", this.domNode.style.height = Ca + "px", typeof e.top < "u" && (this.domNode.style.top = e.top + "px"), typeof e.left < "u" && (this.domNode.style.left = e.left + "px"), typeof e.bottom < "u" && (this.domNode.style.bottom = e.bottom + "px"), typeof e.right < "u" && (this.domNode.style.right = e.right + "px"), this._pointerMoveMonitor = this._register(new yh()), this._register(ba(this.bgDomNode, Qe.POINTER_DOWN, (t) => this._arrowPointerDown(t))), this._register(ba(this.domNode, Qe.POINTER_DOWN, (t) => this._arrowPointerDown(t))), this._pointerdownRepeatTimer = this._register(new mu()), this._pointerdownScheduleRepeatTimer = this._register(new To());
  }
  _arrowPointerDown(e) {
    if (!e.target || !(e.target instanceof Element)) return;
    let t = () => {
      this._pointerdownRepeatTimer.cancelAndSet(() => this._onActivate(), 1e3 / 24, jt(e));
    };
    this._onActivate(), this._pointerdownRepeatTimer.cancel(), this._pointerdownScheduleRepeatTimer.cancelAndSet(t, 200), this._pointerMoveMonitor.startMonitoring(e.target, e.pointerId, e.buttons, (s) => {
    }, () => {
      this._pointerdownRepeatTimer.cancel(), this._pointerdownScheduleRepeatTimer.cancel();
    }), e.preventDefault();
  }
}, xu = class Hn {
  constructor(t, s, r, n, o, a, l) {
    this._forceIntegerValues = t, this._scrollStateBrand = void 0, this._forceIntegerValues && (s = s | 0, r = r | 0, n = n | 0, o = o | 0, a = a | 0, l = l | 0), this.rawScrollLeft = n, this.rawScrollTop = l, s < 0 && (s = 0), n + s > r && (n = r - s), n < 0 && (n = 0), o < 0 && (o = 0), l + o > a && (l = a - o), l < 0 && (l = 0), this.width = s, this.scrollWidth = r, this.scrollLeft = n, this.height = o, this.scrollHeight = a, this.scrollTop = l;
  }
  equals(t) {
    return this.rawScrollLeft === t.rawScrollLeft && this.rawScrollTop === t.rawScrollTop && this.width === t.width && this.scrollWidth === t.scrollWidth && this.scrollLeft === t.scrollLeft && this.height === t.height && this.scrollHeight === t.scrollHeight && this.scrollTop === t.scrollTop;
  }
  withScrollDimensions(t, s) {
    return new Hn(this._forceIntegerValues, typeof t.width < "u" ? t.width : this.width, typeof t.scrollWidth < "u" ? t.scrollWidth : this.scrollWidth, s ? this.rawScrollLeft : this.scrollLeft, typeof t.height < "u" ? t.height : this.height, typeof t.scrollHeight < "u" ? t.scrollHeight : this.scrollHeight, s ? this.rawScrollTop : this.scrollTop);
  }
  withScrollPosition(t) {
    return new Hn(this._forceIntegerValues, this.width, this.scrollWidth, typeof t.scrollLeft < "u" ? t.scrollLeft : this.rawScrollLeft, this.height, this.scrollHeight, typeof t.scrollTop < "u" ? t.scrollTop : this.rawScrollTop);
  }
  createScrollEvent(t, s) {
    let r = this.width !== t.width, n = this.scrollWidth !== t.scrollWidth, o = this.scrollLeft !== t.scrollLeft, a = this.height !== t.height, l = this.scrollHeight !== t.scrollHeight, c = this.scrollTop !== t.scrollTop;
    return { inSmoothScrolling: s, oldWidth: t.width, oldScrollWidth: t.scrollWidth, oldScrollLeft: t.scrollLeft, width: this.width, scrollWidth: this.scrollWidth, scrollLeft: this.scrollLeft, oldHeight: t.height, oldScrollHeight: t.scrollHeight, oldScrollTop: t.scrollTop, height: this.height, scrollHeight: this.scrollHeight, scrollTop: this.scrollTop, widthChanged: r, scrollWidthChanged: n, scrollLeftChanged: o, heightChanged: a, scrollHeightChanged: l, scrollTopChanged: c };
  }
}, ku = class extends ue {
  constructor(e) {
    super(), this._scrollableBrand = void 0, this._onScroll = this._register(new K()), this.onScroll = this._onScroll.event, this._smoothScrollDuration = e.smoothScrollDuration, this._scheduleAtNextAnimationFrame = e.scheduleAtNextAnimationFrame, this._state = new xu(e.forceIntegerValues, 0, 0, 0, 0, 0, 0), this._smoothScrolling = null;
  }
  dispose() {
    this._smoothScrolling && (this._smoothScrolling.dispose(), this._smoothScrolling = null), super.dispose();
  }
  setSmoothScrollDuration(e) {
    this._smoothScrollDuration = e;
  }
  validateScrollPosition(e) {
    return this._state.withScrollPosition(e);
  }
  getScrollDimensions() {
    return this._state;
  }
  setScrollDimensions(e, t) {
    var s;
    let r = this._state.withScrollDimensions(e, t);
    this._setState(r, !!this._smoothScrolling), (s = this._smoothScrolling) == null || s.acceptScrollDimensions(this._state);
  }
  getFutureScrollPosition() {
    return this._smoothScrolling ? this._smoothScrolling.to : this._state;
  }
  getCurrentScrollPosition() {
    return this._state;
  }
  setScrollPositionNow(e) {
    let t = this._state.withScrollPosition(e);
    this._smoothScrolling && (this._smoothScrolling.dispose(), this._smoothScrolling = null), this._setState(t, !1);
  }
  setScrollPositionSmooth(e, t) {
    if (this._smoothScrollDuration === 0) return this.setScrollPositionNow(e);
    if (this._smoothScrolling) {
      e = { scrollLeft: typeof e.scrollLeft > "u" ? this._smoothScrolling.to.scrollLeft : e.scrollLeft, scrollTop: typeof e.scrollTop > "u" ? this._smoothScrolling.to.scrollTop : e.scrollTop };
      let s = this._state.withScrollPosition(e);
      if (this._smoothScrolling.to.scrollLeft === s.scrollLeft && this._smoothScrolling.to.scrollTop === s.scrollTop) return;
      let r;
      t ? r = new ka(this._smoothScrolling.from, s, this._smoothScrolling.startTime, this._smoothScrolling.duration) : r = this._smoothScrolling.combine(this._state, s, this._smoothScrollDuration), this._smoothScrolling.dispose(), this._smoothScrolling = r;
    } else {
      let s = this._state.withScrollPosition(e);
      this._smoothScrolling = ka.start(this._state, s, this._smoothScrollDuration);
    }
    this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
      this._smoothScrolling && (this._smoothScrolling.animationFrameDisposable = null, this._performSmoothScrolling());
    });
  }
  hasPendingScrollAnimation() {
    return !!this._smoothScrolling;
  }
  _performSmoothScrolling() {
    if (!this._smoothScrolling) return;
    let e = this._smoothScrolling.tick(), t = this._state.withScrollPosition(e);
    if (this._setState(t, !0), !!this._smoothScrolling) {
      if (e.isDone) {
        this._smoothScrolling.dispose(), this._smoothScrolling = null;
        return;
      }
      this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
        this._smoothScrolling && (this._smoothScrolling.animationFrameDisposable = null, this._performSmoothScrolling());
      });
    }
  }
  _setState(e, t) {
    let s = this._state;
    s.equals(e) || (this._state = e, this._onScroll.fire(this._state.createScrollEvent(s, t)));
  }
}, xa = class {
  constructor(e, t, s) {
    this.scrollLeft = e, this.scrollTop = t, this.isDone = s;
  }
};
function jr(e, t) {
  let s = t - e;
  return function(r) {
    return e + s * Eu(r);
  };
}
function Lu(e, t, s) {
  return function(r) {
    return r < s ? e(r / s) : t((r - s) / (1 - s));
  };
}
var ka = class Un {
  constructor(t, s, r, n) {
    this.from = t, this.to = s, this.duration = n, this.startTime = r, this.animationFrameDisposable = null, this._initAnimations();
  }
  _initAnimations() {
    this.scrollLeft = this._initAnimation(this.from.scrollLeft, this.to.scrollLeft, this.to.width), this.scrollTop = this._initAnimation(this.from.scrollTop, this.to.scrollTop, this.to.height);
  }
  _initAnimation(t, s, r) {
    if (Math.abs(t - s) > 2.5 * r) {
      let n, o;
      return t < s ? (n = t + 0.75 * r, o = s - 0.75 * r) : (n = t - 0.75 * r, o = s + 0.75 * r), Lu(jr(t, n), jr(o, s), 0.33);
    }
    return jr(t, s);
  }
  dispose() {
    this.animationFrameDisposable !== null && (this.animationFrameDisposable.dispose(), this.animationFrameDisposable = null);
  }
  acceptScrollDimensions(t) {
    this.to = t.withScrollPosition(this.to), this._initAnimations();
  }
  tick() {
    return this._tick(Date.now());
  }
  _tick(t) {
    let s = (t - this.startTime) / this.duration;
    if (s < 1) {
      let r = this.scrollLeft(s), n = this.scrollTop(s);
      return new xa(r, n, !1);
    }
    return new xa(this.to.scrollLeft, this.to.scrollTop, !0);
  }
  combine(t, s, r) {
    return Un.start(t, s, r);
  }
  static start(t, s, r) {
    r = r + 10;
    let n = Date.now() - 10;
    return new Un(t, s, n, r);
  }
};
function Mu(e) {
  return Math.pow(e, 3);
}
function Eu(e) {
  return 1 - Mu(1 - e);
}
var Du = class extends ue {
  constructor(e, t, s) {
    super(), this._visibility = e, this._visibleClassName = t, this._invisibleClassName = s, this._domNode = null, this._isVisible = !1, this._isNeeded = !1, this._rawShouldBeVisible = !1, this._shouldBeVisible = !1, this._revealTimer = this._register(new To());
  }
  setVisibility(e) {
    this._visibility !== e && (this._visibility = e, this._updateShouldBeVisible());
  }
  setShouldBeVisible(e) {
    this._rawShouldBeVisible = e, this._updateShouldBeVisible();
  }
  _applyVisibilitySetting() {
    return this._visibility === 2 ? !1 : this._visibility === 3 ? !0 : this._rawShouldBeVisible;
  }
  _updateShouldBeVisible() {
    let e = this._applyVisibilitySetting();
    this._shouldBeVisible !== e && (this._shouldBeVisible = e, this.ensureVisibility());
  }
  setIsNeeded(e) {
    this._isNeeded !== e && (this._isNeeded = e, this.ensureVisibility());
  }
  setDomNode(e) {
    this._domNode = e, this._domNode.setClassName(this._invisibleClassName), this.setShouldBeVisible(!1);
  }
  ensureVisibility() {
    if (!this._isNeeded) {
      this._hide(!1);
      return;
    }
    this._shouldBeVisible ? this._reveal() : this._hide(!0);
  }
  _reveal() {
    this._isVisible || (this._isVisible = !0, this._revealTimer.setIfNotSet(() => {
      var e;
      (e = this._domNode) == null || e.setClassName(this._visibleClassName);
    }, 0));
  }
  _hide(e) {
    var t;
    this._revealTimer.cancel(), this._isVisible && (this._isVisible = !1, (t = this._domNode) == null || t.setClassName(this._invisibleClassName + (e ? " fade" : "")));
  }
}, Ru = 140, Ch = class extends Po {
  constructor(e) {
    super(), this._lazyRender = e.lazyRender, this._host = e.host, this._scrollable = e.scrollable, this._scrollByPage = e.scrollByPage, this._scrollbarState = e.scrollbarState, this._visibilityController = this._register(new Du(e.visibility, "visible scrollbar " + e.extraScrollbarClassName, "invisible scrollbar " + e.extraScrollbarClassName)), this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._pointerMoveMonitor = this._register(new yh()), this._shouldRender = !0, this.domNode = Fs(document.createElement("div")), this.domNode.setAttribute("role", "presentation"), this.domNode.setAttribute("aria-hidden", "true"), this._visibilityController.setDomNode(this.domNode), this.domNode.setPosition("absolute"), this._register(oe(this.domNode.domNode, Qe.POINTER_DOWN, (t) => this._domNodePointerDown(t)));
  }
  _createArrow(e) {
    let t = this._register(new Cu(e));
    this.domNode.domNode.appendChild(t.bgDomNode), this.domNode.domNode.appendChild(t.domNode);
  }
  _createSlider(e, t, s, r) {
    this.slider = Fs(document.createElement("div")), this.slider.setClassName("slider"), this.slider.setPosition("absolute"), this.slider.setTop(e), this.slider.setLeft(t), typeof s == "number" && this.slider.setWidth(s), typeof r == "number" && this.slider.setHeight(r), this.slider.setLayerHinting(!0), this.slider.setContain("strict"), this.domNode.domNode.appendChild(this.slider.domNode), this._register(oe(this.slider.domNode, Qe.POINTER_DOWN, (n) => {
      n.button === 0 && (n.preventDefault(), this._sliderPointerDown(n));
    })), this.onclick(this.slider.domNode, (n) => {
      n.leftButton && n.stopPropagation();
    });
  }
  _onElementSize(e) {
    return this._scrollbarState.setVisibleSize(e) && (this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._shouldRender = !0, this._lazyRender || this.render()), this._shouldRender;
  }
  _onElementScrollSize(e) {
    return this._scrollbarState.setScrollSize(e) && (this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._shouldRender = !0, this._lazyRender || this.render()), this._shouldRender;
  }
  _onElementScrollPosition(e) {
    return this._scrollbarState.setScrollPosition(e) && (this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._shouldRender = !0, this._lazyRender || this.render()), this._shouldRender;
  }
  beginReveal() {
    this._visibilityController.setShouldBeVisible(!0);
  }
  beginHide() {
    this._visibilityController.setShouldBeVisible(!1);
  }
  render() {
    this._shouldRender && (this._shouldRender = !1, this._renderDomNode(this._scrollbarState.getRectangleLargeSize(), this._scrollbarState.getRectangleSmallSize()), this._updateSlider(this._scrollbarState.getSliderSize(), this._scrollbarState.getArrowSize() + this._scrollbarState.getSliderPosition()));
  }
  _domNodePointerDown(e) {
    e.target === this.domNode.domNode && this._onPointerDown(e);
  }
  delegatePointerDown(e) {
    let t = this.domNode.domNode.getClientRects()[0].top, s = t + this._scrollbarState.getSliderPosition(), r = t + this._scrollbarState.getSliderPosition() + this._scrollbarState.getSliderSize(), n = this._sliderPointerPosition(e);
    s <= n && n <= r ? e.button === 0 && (e.preventDefault(), this._sliderPointerDown(e)) : this._onPointerDown(e);
  }
  _onPointerDown(e) {
    let t, s;
    if (e.target === this.domNode.domNode && typeof e.offsetX == "number" && typeof e.offsetY == "number") t = e.offsetX, s = e.offsetY;
    else {
      let n = wu(this.domNode.domNode);
      t = e.pageX - n.left, s = e.pageY - n.top;
    }
    let r = this._pointerDownRelativePosition(t, s);
    this._setDesiredScrollPositionNow(this._scrollByPage ? this._scrollbarState.getDesiredScrollPositionFromOffsetPaged(r) : this._scrollbarState.getDesiredScrollPositionFromOffset(r)), e.button === 0 && (e.preventDefault(), this._sliderPointerDown(e));
  }
  _sliderPointerDown(e) {
    if (!e.target || !(e.target instanceof Element)) return;
    let t = this._sliderPointerPosition(e), s = this._sliderOrthogonalPointerPosition(e), r = this._scrollbarState.clone();
    this.slider.toggleClassName("active", !0), this._pointerMoveMonitor.startMonitoring(e.target, e.pointerId, e.buttons, (n) => {
      let o = this._sliderOrthogonalPointerPosition(n), a = Math.abs(o - s);
      if (wh && a > Ru) {
        this._setDesiredScrollPositionNow(r.getScrollPosition());
        return;
      }
      let l = this._sliderPointerPosition(n) - t;
      this._setDesiredScrollPositionNow(r.getDesiredScrollPositionFromDelta(l));
    }, () => {
      this.slider.toggleClassName("active", !1), this._host.onDragEnd();
    }), this._host.onDragStart();
  }
  _setDesiredScrollPositionNow(e) {
    let t = {};
    this.writeScrollPosition(t, e), this._scrollable.setScrollPositionNow(t);
  }
  updateScrollbarSize(e) {
    this._updateScrollbarSize(e), this._scrollbarState.setScrollbarSize(e), this._shouldRender = !0, this._lazyRender || this.render();
  }
  isNeeded() {
    return this._scrollbarState.isNeeded();
  }
}, xh = class Kn {
  constructor(t, s, r, n, o, a) {
    this._scrollbarSize = Math.round(s), this._oppositeScrollbarSize = Math.round(r), this._arrowSize = Math.round(t), this._visibleSize = n, this._scrollSize = o, this._scrollPosition = a, this._computedAvailableSize = 0, this._computedIsNeeded = !1, this._computedSliderSize = 0, this._computedSliderRatio = 0, this._computedSliderPosition = 0, this._refreshComputedValues();
  }
  clone() {
    return new Kn(this._arrowSize, this._scrollbarSize, this._oppositeScrollbarSize, this._visibleSize, this._scrollSize, this._scrollPosition);
  }
  setVisibleSize(t) {
    let s = Math.round(t);
    return this._visibleSize !== s ? (this._visibleSize = s, this._refreshComputedValues(), !0) : !1;
  }
  setScrollSize(t) {
    let s = Math.round(t);
    return this._scrollSize !== s ? (this._scrollSize = s, this._refreshComputedValues(), !0) : !1;
  }
  setScrollPosition(t) {
    let s = Math.round(t);
    return this._scrollPosition !== s ? (this._scrollPosition = s, this._refreshComputedValues(), !0) : !1;
  }
  setScrollbarSize(t) {
    this._scrollbarSize = Math.round(t);
  }
  setOppositeScrollbarSize(t) {
    this._oppositeScrollbarSize = Math.round(t);
  }
  static _computeValues(t, s, r, n, o) {
    let a = Math.max(0, r - t), l = Math.max(0, a - 2 * s), c = n > 0 && n > r;
    if (!c) return { computedAvailableSize: Math.round(a), computedIsNeeded: c, computedSliderSize: Math.round(l), computedSliderRatio: 0, computedSliderPosition: 0 };
    let h = Math.round(Math.max(20, Math.floor(r * l / n))), d = (l - h) / (n - r), u = o * d;
    return { computedAvailableSize: Math.round(a), computedIsNeeded: c, computedSliderSize: Math.round(h), computedSliderRatio: d, computedSliderPosition: Math.round(u) };
  }
  _refreshComputedValues() {
    let t = Kn._computeValues(this._oppositeScrollbarSize, this._arrowSize, this._visibleSize, this._scrollSize, this._scrollPosition);
    this._computedAvailableSize = t.computedAvailableSize, this._computedIsNeeded = t.computedIsNeeded, this._computedSliderSize = t.computedSliderSize, this._computedSliderRatio = t.computedSliderRatio, this._computedSliderPosition = t.computedSliderPosition;
  }
  getArrowSize() {
    return this._arrowSize;
  }
  getScrollPosition() {
    return this._scrollPosition;
  }
  getRectangleLargeSize() {
    return this._computedAvailableSize;
  }
  getRectangleSmallSize() {
    return this._scrollbarSize;
  }
  isNeeded() {
    return this._computedIsNeeded;
  }
  getSliderSize() {
    return this._computedSliderSize;
  }
  getSliderPosition() {
    return this._computedSliderPosition;
  }
  getDesiredScrollPositionFromOffset(t) {
    if (!this._computedIsNeeded) return 0;
    let s = t - this._arrowSize - this._computedSliderSize / 2;
    return Math.round(s / this._computedSliderRatio);
  }
  getDesiredScrollPositionFromOffsetPaged(t) {
    if (!this._computedIsNeeded) return 0;
    let s = t - this._arrowSize, r = this._scrollPosition;
    return s < this._computedSliderPosition ? r -= this._visibleSize : r += this._visibleSize, r;
  }
  getDesiredScrollPositionFromDelta(t) {
    if (!this._computedIsNeeded) return 0;
    let s = this._computedSliderPosition + t;
    return Math.round(s / this._computedSliderRatio);
  }
}, Tu = class extends Ch {
  constructor(e, t, s) {
    let r = e.getScrollDimensions(), n = e.getCurrentScrollPosition();
    if (super({ lazyRender: t.lazyRender, host: s, scrollbarState: new xh(t.horizontalHasArrows ? t.arrowSize : 0, t.horizontal === 2 ? 0 : t.horizontalScrollbarSize, t.vertical === 2 ? 0 : t.verticalScrollbarSize, r.width, r.scrollWidth, n.scrollLeft), visibility: t.horizontal, extraScrollbarClassName: "horizontal", scrollable: e, scrollByPage: t.scrollByPage }), t.horizontalHasArrows) throw new Error("horizontalHasArrows is not supported in xterm.js");
    this._createSlider(Math.floor((t.horizontalScrollbarSize - t.horizontalSliderSize) / 2), 0, void 0, t.horizontalSliderSize);
  }
  _updateSlider(e, t) {
    this.slider.setWidth(e), this.slider.setLeft(t);
  }
  _renderDomNode(e, t) {
    this.domNode.setWidth(e), this.domNode.setHeight(t), this.domNode.setLeft(0), this.domNode.setBottom(0);
  }
  onDidScroll(e) {
    return this._shouldRender = this._onElementScrollSize(e.scrollWidth) || this._shouldRender, this._shouldRender = this._onElementScrollPosition(e.scrollLeft) || this._shouldRender, this._shouldRender = this._onElementSize(e.width) || this._shouldRender, this._shouldRender;
  }
  _pointerDownRelativePosition(e, t) {
    return e;
  }
  _sliderPointerPosition(e) {
    return e.pageX;
  }
  _sliderOrthogonalPointerPosition(e) {
    return e.pageY;
  }
  _updateScrollbarSize(e) {
    this.slider.setHeight(e);
  }
  writeScrollPosition(e, t) {
    e.scrollLeft = t;
  }
  updateOptions(e) {
    this.updateScrollbarSize(e.horizontal === 2 ? 0 : e.horizontalScrollbarSize), this._scrollbarState.setOppositeScrollbarSize(e.vertical === 2 ? 0 : e.verticalScrollbarSize), this._visibilityController.setVisibility(e.horizontal), this._scrollByPage = e.scrollByPage;
  }
}, Bu = class extends Ch {
  constructor(e, t, s) {
    let r = e.getScrollDimensions(), n = e.getCurrentScrollPosition();
    if (super({ lazyRender: t.lazyRender, host: s, scrollbarState: new xh(t.verticalHasArrows ? t.arrowSize : 0, t.vertical === 2 ? 0 : t.verticalScrollbarSize, 0, r.height, r.scrollHeight, n.scrollTop), visibility: t.vertical, extraScrollbarClassName: "vertical", scrollable: e, scrollByPage: t.scrollByPage }), t.verticalHasArrows) throw new Error("horizontalHasArrows is not supported in xterm.js");
    this._createSlider(0, Math.floor((t.verticalScrollbarSize - t.verticalSliderSize) / 2), t.verticalSliderSize, void 0);
  }
  _updateSlider(e, t) {
    this.slider.setHeight(e), this.slider.setTop(t);
  }
  _renderDomNode(e, t) {
    this.domNode.setWidth(t), this.domNode.setHeight(e), this.domNode.setRight(0), this.domNode.setTop(0);
  }
  onDidScroll(e) {
    return this._shouldRender = this._onElementScrollSize(e.scrollHeight) || this._shouldRender, this._shouldRender = this._onElementScrollPosition(e.scrollTop) || this._shouldRender, this._shouldRender = this._onElementSize(e.height) || this._shouldRender, this._shouldRender;
  }
  _pointerDownRelativePosition(e, t) {
    return t;
  }
  _sliderPointerPosition(e) {
    return e.pageY;
  }
  _sliderOrthogonalPointerPosition(e) {
    return e.pageX;
  }
  _updateScrollbarSize(e) {
    this.slider.setWidth(e);
  }
  writeScrollPosition(e, t) {
    e.scrollTop = t;
  }
  updateOptions(e) {
    this.updateScrollbarSize(e.vertical === 2 ? 0 : e.verticalScrollbarSize), this._scrollbarState.setOppositeScrollbarSize(0), this._visibilityController.setVisibility(e.vertical), this._scrollByPage = e.scrollByPage;
  }
}, Pu = 500, La = 50, Au = class {
  constructor(e, t, s) {
    this.timestamp = e, this.deltaX = t, this.deltaY = s, this.score = 0;
  }
}, Vn = class {
  constructor() {
    this._capacity = 5, this._memory = [], this._front = -1, this._rear = -1;
  }
  isPhysicalMouseWheel() {
    if (this._front === -1 && this._rear === -1) return !1;
    let e = 1, t = 0, s = 1, r = this._rear;
    do {
      let n = r === this._front ? e : Math.pow(2, -s);
      if (e -= n, t += this._memory[r].score * n, r === this._front) break;
      r = (this._capacity + r - 1) % this._capacity, s++;
    } while (!0);
    return t <= 0.5;
  }
  acceptStandardWheelEvent(e) {
    if (Do) {
      let t = jt(e.browserEvent), s = jd(t);
      this.accept(Date.now(), e.deltaX * s, e.deltaY * s);
    } else this.accept(Date.now(), e.deltaX, e.deltaY);
  }
  accept(e, t, s) {
    let r = null, n = new Au(e, t, s);
    this._front === -1 && this._rear === -1 ? (this._memory[0] = n, this._front = 0, this._rear = 0) : (r = this._memory[this._rear], this._rear = (this._rear + 1) % this._capacity, this._rear === this._front && (this._front = (this._front + 1) % this._capacity), this._memory[this._rear] = n), n.score = this._computeScore(n, r);
  }
  _computeScore(e, t) {
    if (Math.abs(e.deltaX) > 0 && Math.abs(e.deltaY) > 0) return 1;
    let s = 0.5;
    if ((!this._isAlmostInt(e.deltaX) || !this._isAlmostInt(e.deltaY)) && (s += 0.25), t) {
      let r = Math.abs(e.deltaX), n = Math.abs(e.deltaY), o = Math.abs(t.deltaX), a = Math.abs(t.deltaY), l = Math.max(Math.min(r, o), 1), c = Math.max(Math.min(n, a), 1), h = Math.max(r, o), d = Math.max(n, a);
      h % l === 0 && d % c === 0 && (s -= 0.5);
    }
    return Math.min(Math.max(s, 0), 1);
  }
  _isAlmostInt(e) {
    return Math.abs(Math.round(e) - e) < 0.01;
  }
};
Vn.INSTANCE = new Vn();
var Nu = Vn, Ou = class extends Po {
  constructor(e, t, s) {
    super(), this._onScroll = this._register(new K()), this.onScroll = this._onScroll.event, this._onWillScroll = this._register(new K()), this.onWillScroll = this._onWillScroll.event, this._options = Fu(t), this._scrollable = s, this._register(this._scrollable.onScroll((n) => {
      this._onWillScroll.fire(n), this._onDidScroll(n), this._onScroll.fire(n);
    }));
    let r = { onMouseWheel: (n) => this._onMouseWheel(n), onDragStart: () => this._onDragStart(), onDragEnd: () => this._onDragEnd() };
    this._verticalScrollbar = this._register(new Bu(this._scrollable, this._options, r)), this._horizontalScrollbar = this._register(new Tu(this._scrollable, this._options, r)), this._domNode = document.createElement("div"), this._domNode.className = "xterm-scrollable-element " + this._options.className, this._domNode.setAttribute("role", "presentation"), this._domNode.style.position = "relative", this._domNode.appendChild(e), this._domNode.appendChild(this._horizontalScrollbar.domNode.domNode), this._domNode.appendChild(this._verticalScrollbar.domNode.domNode), this._options.useShadows ? (this._leftShadowDomNode = Fs(document.createElement("div")), this._leftShadowDomNode.setClassName("shadow"), this._domNode.appendChild(this._leftShadowDomNode.domNode), this._topShadowDomNode = Fs(document.createElement("div")), this._topShadowDomNode.setClassName("shadow"), this._domNode.appendChild(this._topShadowDomNode.domNode), this._topLeftShadowDomNode = Fs(document.createElement("div")), this._topLeftShadowDomNode.setClassName("shadow"), this._domNode.appendChild(this._topLeftShadowDomNode.domNode)) : (this._leftShadowDomNode = null, this._topShadowDomNode = null, this._topLeftShadowDomNode = null), this._listenOnDomNode = this._options.listenOnDomNode || this._domNode, this._mouseWheelToDispose = [], this._setListeningToMouseWheel(this._options.handleMouseWheel), this.onmouseover(this._listenOnDomNode, (n) => this._onMouseOver(n)), this.onmouseleave(this._listenOnDomNode, (n) => this._onMouseLeave(n)), this._hideTimeout = this._register(new To()), this._isDragging = !1, this._mouseIsOver = !1, this._shouldRender = !0, this._revealOnScroll = !0;
  }
  get options() {
    return this._options;
  }
  dispose() {
    this._mouseWheelToDispose = Yi(this._mouseWheelToDispose), super.dispose();
  }
  getDomNode() {
    return this._domNode;
  }
  getOverviewRulerLayoutInfo() {
    return { parent: this._domNode, insertBefore: this._verticalScrollbar.domNode.domNode };
  }
  delegateVerticalScrollbarPointerDown(e) {
    this._verticalScrollbar.delegatePointerDown(e);
  }
  getScrollDimensions() {
    return this._scrollable.getScrollDimensions();
  }
  setScrollDimensions(e) {
    this._scrollable.setScrollDimensions(e, !1);
  }
  updateClassName(e) {
    this._options.className = e, Zt && (this._options.className += " mac"), this._domNode.className = "xterm-scrollable-element " + this._options.className;
  }
  updateOptions(e) {
    typeof e.handleMouseWheel < "u" && (this._options.handleMouseWheel = e.handleMouseWheel, this._setListeningToMouseWheel(this._options.handleMouseWheel)), typeof e.mouseWheelScrollSensitivity < "u" && (this._options.mouseWheelScrollSensitivity = e.mouseWheelScrollSensitivity), typeof e.fastScrollSensitivity < "u" && (this._options.fastScrollSensitivity = e.fastScrollSensitivity), typeof e.scrollPredominantAxis < "u" && (this._options.scrollPredominantAxis = e.scrollPredominantAxis), typeof e.horizontal < "u" && (this._options.horizontal = e.horizontal), typeof e.vertical < "u" && (this._options.vertical = e.vertical), typeof e.horizontalScrollbarSize < "u" && (this._options.horizontalScrollbarSize = e.horizontalScrollbarSize), typeof e.verticalScrollbarSize < "u" && (this._options.verticalScrollbarSize = e.verticalScrollbarSize), typeof e.scrollByPage < "u" && (this._options.scrollByPage = e.scrollByPage), this._horizontalScrollbar.updateOptions(this._options), this._verticalScrollbar.updateOptions(this._options), this._options.lazyRender || this._render();
  }
  setRevealOnScroll(e) {
    this._revealOnScroll = e;
  }
  delegateScrollFromMouseWheelEvent(e) {
    this._onMouseWheel(new va(e));
  }
  _setListeningToMouseWheel(e) {
    if (this._mouseWheelToDispose.length > 0 !== e && (this._mouseWheelToDispose = Yi(this._mouseWheelToDispose), e)) {
      let t = (s) => {
        this._onMouseWheel(new va(s));
      };
      this._mouseWheelToDispose.push(oe(this._listenOnDomNode, Qe.MOUSE_WHEEL, t, { passive: !1 }));
    }
  }
  _onMouseWheel(e) {
    var t;
    if ((t = e.browserEvent) != null && t.defaultPrevented) return;
    let s = Nu.INSTANCE;
    s.acceptStandardWheelEvent(e);
    let r = !1;
    if (e.deltaY || e.deltaX) {
      let o = e.deltaY * this._options.mouseWheelScrollSensitivity, a = e.deltaX * this._options.mouseWheelScrollSensitivity;
      this._options.scrollPredominantAxis && (this._options.scrollYToX && a + o === 0 ? a = o = 0 : Math.abs(o) >= Math.abs(a) ? a = 0 : o = 0), this._options.flipAxes && ([o, a] = [a, o]);
      let l = !Zt && e.browserEvent && e.browserEvent.shiftKey;
      (this._options.scrollYToX || l) && !a && (a = o, o = 0), e.browserEvent && e.browserEvent.altKey && (a = a * this._options.fastScrollSensitivity, o = o * this._options.fastScrollSensitivity);
      let c = this._scrollable.getFutureScrollPosition(), h = {};
      if (o) {
        let d = La * o, u = c.scrollTop - (d < 0 ? Math.floor(d) : Math.ceil(d));
        this._verticalScrollbar.writeScrollPosition(h, u);
      }
      if (a) {
        let d = La * a, u = c.scrollLeft - (d < 0 ? Math.floor(d) : Math.ceil(d));
        this._horizontalScrollbar.writeScrollPosition(h, u);
      }
      h = this._scrollable.validateScrollPosition(h), (c.scrollLeft !== h.scrollLeft || c.scrollTop !== h.scrollTop) && (this._options.mouseWheelSmoothScroll && s.isPhysicalMouseWheel() ? this._scrollable.setScrollPositionSmooth(h) : this._scrollable.setScrollPositionNow(h), r = !0);
    }
    let n = r;
    !n && this._options.alwaysConsumeMouseWheel && (n = !0), !n && this._options.consumeMouseWheelIfScrollbarIsNeeded && (this._verticalScrollbar.isNeeded() || this._horizontalScrollbar.isNeeded()) && (n = !0), n && (e.preventDefault(), e.stopPropagation());
  }
  _onDidScroll(e) {
    this._shouldRender = this._horizontalScrollbar.onDidScroll(e) || this._shouldRender, this._shouldRender = this._verticalScrollbar.onDidScroll(e) || this._shouldRender, this._options.useShadows && (this._shouldRender = !0), this._revealOnScroll && this._reveal(), this._options.lazyRender || this._render();
  }
  renderNow() {
    if (!this._options.lazyRender) throw new Error("Please use `lazyRender` together with `renderNow`!");
    this._render();
  }
  _render() {
    if (this._shouldRender && (this._shouldRender = !1, this._horizontalScrollbar.render(), this._verticalScrollbar.render(), this._options.useShadows)) {
      let e = this._scrollable.getCurrentScrollPosition(), t = e.scrollTop > 0, s = e.scrollLeft > 0, r = s ? " left" : "", n = t ? " top" : "", o = s || t ? " top-left-corner" : "";
      this._leftShadowDomNode.setClassName(`shadow${r}`), this._topShadowDomNode.setClassName(`shadow${n}`), this._topLeftShadowDomNode.setClassName(`shadow${o}${n}${r}`);
    }
  }
  _onDragStart() {
    this._isDragging = !0, this._reveal();
  }
  _onDragEnd() {
    this._isDragging = !1, this._hide();
  }
  _onMouseLeave(e) {
    this._mouseIsOver = !1, this._hide();
  }
  _onMouseOver(e) {
    this._mouseIsOver = !0, this._reveal();
  }
  _reveal() {
    this._verticalScrollbar.beginReveal(), this._horizontalScrollbar.beginReveal(), this._scheduleHide();
  }
  _hide() {
    !this._mouseIsOver && !this._isDragging && (this._verticalScrollbar.beginHide(), this._horizontalScrollbar.beginHide());
  }
  _scheduleHide() {
    !this._mouseIsOver && !this._isDragging && this._hideTimeout.cancelAndSet(() => this._hide(), Pu);
  }
}, Iu = class extends Ou {
  constructor(e, t, s) {
    super(e, t, s);
  }
  setScrollPosition(e) {
    e.reuseAnimation ? this._scrollable.setScrollPositionSmooth(e, e.reuseAnimation) : this._scrollable.setScrollPositionNow(e);
  }
  getScrollPosition() {
    return this._scrollable.getCurrentScrollPosition();
  }
};
function Fu(e) {
  let t = { lazyRender: typeof e.lazyRender < "u" ? e.lazyRender : !1, className: typeof e.className < "u" ? e.className : "", useShadows: typeof e.useShadows < "u" ? e.useShadows : !0, handleMouseWheel: typeof e.handleMouseWheel < "u" ? e.handleMouseWheel : !0, flipAxes: typeof e.flipAxes < "u" ? e.flipAxes : !1, consumeMouseWheelIfScrollbarIsNeeded: typeof e.consumeMouseWheelIfScrollbarIsNeeded < "u" ? e.consumeMouseWheelIfScrollbarIsNeeded : !1, alwaysConsumeMouseWheel: typeof e.alwaysConsumeMouseWheel < "u" ? e.alwaysConsumeMouseWheel : !1, scrollYToX: typeof e.scrollYToX < "u" ? e.scrollYToX : !1, mouseWheelScrollSensitivity: typeof e.mouseWheelScrollSensitivity < "u" ? e.mouseWheelScrollSensitivity : 1, fastScrollSensitivity: typeof e.fastScrollSensitivity < "u" ? e.fastScrollSensitivity : 5, scrollPredominantAxis: typeof e.scrollPredominantAxis < "u" ? e.scrollPredominantAxis : !0, mouseWheelSmoothScroll: typeof e.mouseWheelSmoothScroll < "u" ? e.mouseWheelSmoothScroll : !0, arrowSize: typeof e.arrowSize < "u" ? e.arrowSize : 11, listenOnDomNode: typeof e.listenOnDomNode < "u" ? e.listenOnDomNode : null, horizontal: typeof e.horizontal < "u" ? e.horizontal : 1, horizontalScrollbarSize: typeof e.horizontalScrollbarSize < "u" ? e.horizontalScrollbarSize : 10, horizontalSliderSize: typeof e.horizontalSliderSize < "u" ? e.horizontalSliderSize : 0, horizontalHasArrows: typeof e.horizontalHasArrows < "u" ? e.horizontalHasArrows : !1, vertical: typeof e.vertical < "u" ? e.vertical : 1, verticalScrollbarSize: typeof e.verticalScrollbarSize < "u" ? e.verticalScrollbarSize : 10, verticalHasArrows: typeof e.verticalHasArrows < "u" ? e.verticalHasArrows : !1, verticalSliderSize: typeof e.verticalSliderSize < "u" ? e.verticalSliderSize : 0, scrollByPage: typeof e.scrollByPage < "u" ? e.scrollByPage : !1 };
  return t.horizontalSliderSize = typeof e.horizontalSliderSize < "u" ? e.horizontalSliderSize : t.horizontalScrollbarSize, t.verticalSliderSize = typeof e.verticalSliderSize < "u" ? e.verticalSliderSize : t.verticalScrollbarSize, Zt && (t.className += " mac"), t;
}
var qn = class extends ue {
  constructor(e, t, s, r, n, o, a, l) {
    super(), this._bufferService = s, this._optionsService = a, this._renderService = l, this._onRequestScrollLines = this._register(new K()), this.onRequestScrollLines = this._onRequestScrollLines.event, this._isSyncing = !1, this._isHandlingScroll = !1, this._suppressOnScrollHandler = !1;
    let c = this._register(new ku({ forceIntegerValues: !1, smoothScrollDuration: this._optionsService.rawOptions.smoothScrollDuration, scheduleAtNextAnimationFrame: (h) => Bo(r.window, h) }));
    this._register(this._optionsService.onSpecificOptionChange("smoothScrollDuration", () => {
      c.setSmoothScrollDuration(this._optionsService.rawOptions.smoothScrollDuration);
    })), this._scrollableElement = this._register(new Iu(t, { vertical: 1, horizontal: 2, useShadows: !1, mouseWheelSmoothScroll: !0, ...this._getChangeOptions() }, c)), this._register(this._optionsService.onMultipleOptionChange(["scrollSensitivity", "fastScrollSensitivity", "overviewRuler"], () => this._scrollableElement.updateOptions(this._getChangeOptions()))), this._register(n.onProtocolChange((h) => {
      this._scrollableElement.updateOptions({ handleMouseWheel: !(h & 16) });
    })), this._scrollableElement.setScrollDimensions({ height: 0, scrollHeight: 0 }), this._register(ot.runAndSubscribe(o.onChangeColors, () => {
      this._scrollableElement.getDomNode().style.backgroundColor = o.colors.background.css;
    })), e.appendChild(this._scrollableElement.getDomNode()), this._register(Ae(() => this._scrollableElement.getDomNode().remove())), this._styleElement = r.mainDocument.createElement("style"), t.appendChild(this._styleElement), this._register(Ae(() => this._styleElement.remove())), this._register(ot.runAndSubscribe(o.onChangeColors, () => {
      this._styleElement.textContent = [".xterm .xterm-scrollable-element > .scrollbar > .slider {", `  background: ${o.colors.scrollbarSliderBackground.css};`, "}", ".xterm .xterm-scrollable-element > .scrollbar > .slider:hover {", `  background: ${o.colors.scrollbarSliderHoverBackground.css};`, "}", ".xterm .xterm-scrollable-element > .scrollbar > .slider.active {", `  background: ${o.colors.scrollbarSliderActiveBackground.css};`, "}"].join(`
`);
    })), this._register(this._bufferService.onResize(() => this.queueSync())), this._register(this._bufferService.buffers.onBufferActivate(() => {
      this._latestYDisp = void 0, this.queueSync();
    })), this._register(this._bufferService.onScroll(() => this._sync())), this._register(this._scrollableElement.onScroll((h) => this._handleScroll(h)));
  }
  scrollLines(e) {
    let t = this._scrollableElement.getScrollPosition();
    this._scrollableElement.setScrollPosition({ reuseAnimation: !0, scrollTop: t.scrollTop + e * this._renderService.dimensions.css.cell.height });
  }
  scrollToLine(e, t) {
    t && (this._latestYDisp = e), this._scrollableElement.setScrollPosition({ reuseAnimation: !t, scrollTop: e * this._renderService.dimensions.css.cell.height });
  }
  _getChangeOptions() {
    var e;
    return { mouseWheelScrollSensitivity: this._optionsService.rawOptions.scrollSensitivity, fastScrollSensitivity: this._optionsService.rawOptions.fastScrollSensitivity, verticalScrollbarSize: ((e = this._optionsService.rawOptions.overviewRuler) == null ? void 0 : e.width) || 14 };
  }
  queueSync(e) {
    e !== void 0 && (this._latestYDisp = e), this._queuedAnimationFrame === void 0 && (this._queuedAnimationFrame = this._renderService.addRefreshCallback(() => {
      this._queuedAnimationFrame = void 0, this._sync(this._latestYDisp);
    }));
  }
  _sync(e = this._bufferService.buffer.ydisp) {
    !this._renderService || this._isSyncing || (this._isSyncing = !0, this._suppressOnScrollHandler = !0, this._scrollableElement.setScrollDimensions({ height: this._renderService.dimensions.css.canvas.height, scrollHeight: this._renderService.dimensions.css.cell.height * this._bufferService.buffer.lines.length }), this._suppressOnScrollHandler = !1, e !== this._latestYDisp && this._scrollableElement.setScrollPosition({ scrollTop: e * this._renderService.dimensions.css.cell.height }), this._isSyncing = !1);
  }
  _handleScroll(e) {
    if (!this._renderService || this._isHandlingScroll || this._suppressOnScrollHandler) return;
    this._isHandlingScroll = !0;
    let t = Math.round(e.scrollTop / this._renderService.dimensions.css.cell.height), s = t - this._bufferService.buffer.ydisp;
    s !== 0 && (this._latestYDisp = t, this._onRequestScrollLines.fire(s)), this._isHandlingScroll = !1;
  }
};
qn = $e([X(2, mt), X(3, di), X(4, oh), X(5, vs), X(6, wt), X(7, ui)], qn);
var Yn = class extends ue {
  constructor(e, t, s, r, n) {
    super(), this._screenElement = e, this._bufferService = t, this._coreBrowserService = s, this._decorationService = r, this._renderService = n, this._decorationElements = /* @__PURE__ */ new Map(), this._altBufferIsActive = !1, this._dimensionsChanged = !1, this._container = document.createElement("div"), this._container.classList.add("xterm-decoration-container"), this._screenElement.appendChild(this._container), this._register(this._renderService.onRenderedViewportChange(() => this._doRefreshDecorations())), this._register(this._renderService.onDimensionsChange(() => {
      this._dimensionsChanged = !0, this._queueRefresh();
    })), this._register(this._coreBrowserService.onDprChange(() => this._queueRefresh())), this._register(this._bufferService.buffers.onBufferActivate(() => {
      this._altBufferIsActive = this._bufferService.buffer === this._bufferService.buffers.alt;
    })), this._register(this._decorationService.onDecorationRegistered(() => this._queueRefresh())), this._register(this._decorationService.onDecorationRemoved((o) => this._removeDecoration(o))), this._register(Ae(() => {
      this._container.remove(), this._decorationElements.clear();
    }));
  }
  _queueRefresh() {
    this._animationFrame === void 0 && (this._animationFrame = this._renderService.addRefreshCallback(() => {
      this._doRefreshDecorations(), this._animationFrame = void 0;
    }));
  }
  _doRefreshDecorations() {
    for (let e of this._decorationService.decorations) this._renderDecoration(e);
    this._dimensionsChanged = !1;
  }
  _renderDecoration(e) {
    this._refreshStyle(e), this._dimensionsChanged && this._refreshXPosition(e);
  }
  _createElement(e) {
    var t;
    let s = this._coreBrowserService.mainDocument.createElement("div");
    s.classList.add("xterm-decoration"), s.classList.toggle("xterm-decoration-top-layer", ((t = e == null ? void 0 : e.options) == null ? void 0 : t.layer) === "top"), s.style.width = `${Math.round((e.options.width || 1) * this._renderService.dimensions.css.cell.width)}px`, s.style.height = `${(e.options.height || 1) * this._renderService.dimensions.css.cell.height}px`, s.style.top = `${(e.marker.line - this._bufferService.buffers.active.ydisp) * this._renderService.dimensions.css.cell.height}px`, s.style.lineHeight = `${this._renderService.dimensions.css.cell.height}px`;
    let r = e.options.x ?? 0;
    return r && r > this._bufferService.cols && (s.style.display = "none"), this._refreshXPosition(e, s), s;
  }
  _refreshStyle(e) {
    let t = e.marker.line - this._bufferService.buffers.active.ydisp;
    if (t < 0 || t >= this._bufferService.rows) e.element && (e.element.style.display = "none", e.onRenderEmitter.fire(e.element));
    else {
      let s = this._decorationElements.get(e);
      s || (s = this._createElement(e), e.element = s, this._decorationElements.set(e, s), this._container.appendChild(s), e.onDispose(() => {
        this._decorationElements.delete(e), s.remove();
      })), s.style.display = this._altBufferIsActive ? "none" : "block", this._altBufferIsActive || (s.style.width = `${Math.round((e.options.width || 1) * this._renderService.dimensions.css.cell.width)}px`, s.style.height = `${(e.options.height || 1) * this._renderService.dimensions.css.cell.height}px`, s.style.top = `${t * this._renderService.dimensions.css.cell.height}px`, s.style.lineHeight = `${this._renderService.dimensions.css.cell.height}px`), e.onRenderEmitter.fire(s);
    }
  }
  _refreshXPosition(e, t = e.element) {
    if (!t) return;
    let s = e.options.x ?? 0;
    (e.options.anchor || "left") === "right" ? t.style.right = s ? `${s * this._renderService.dimensions.css.cell.width}px` : "" : t.style.left = s ? `${s * this._renderService.dimensions.css.cell.width}px` : "";
  }
  _removeDecoration(e) {
    var t;
    (t = this._decorationElements.get(e)) == null || t.remove(), this._decorationElements.delete(e), e.dispose();
  }
};
Yn = $e([X(1, mt), X(2, di), X(3, js), X(4, ui)], Yn);
var zu = class {
  constructor() {
    this._zones = [], this._zonePool = [], this._zonePoolIndex = 0, this._linePadding = { full: 0, left: 0, center: 0, right: 0 };
  }
  get zones() {
    return this._zonePool.length = Math.min(this._zonePool.length, this._zones.length), this._zones;
  }
  clear() {
    this._zones.length = 0, this._zonePoolIndex = 0;
  }
  addDecoration(e) {
    if (e.options.overviewRulerOptions) {
      for (let t of this._zones) if (t.color === e.options.overviewRulerOptions.color && t.position === e.options.overviewRulerOptions.position) {
        if (this._lineIntersectsZone(t, e.marker.line)) return;
        if (this._lineAdjacentToZone(t, e.marker.line, e.options.overviewRulerOptions.position)) {
          this._addLineToZone(t, e.marker.line);
          return;
        }
      }
      if (this._zonePoolIndex < this._zonePool.length) {
        this._zonePool[this._zonePoolIndex].color = e.options.overviewRulerOptions.color, this._zonePool[this._zonePoolIndex].position = e.options.overviewRulerOptions.position, this._zonePool[this._zonePoolIndex].startBufferLine = e.marker.line, this._zonePool[this._zonePoolIndex].endBufferLine = e.marker.line, this._zones.push(this._zonePool[this._zonePoolIndex++]);
        return;
      }
      this._zones.push({ color: e.options.overviewRulerOptions.color, position: e.options.overviewRulerOptions.position, startBufferLine: e.marker.line, endBufferLine: e.marker.line }), this._zonePool.push(this._zones[this._zones.length - 1]), this._zonePoolIndex++;
    }
  }
  setPadding(e) {
    this._linePadding = e;
  }
  _lineIntersectsZone(e, t) {
    return t >= e.startBufferLine && t <= e.endBufferLine;
  }
  _lineAdjacentToZone(e, t, s) {
    return t >= e.startBufferLine - this._linePadding[s || "full"] && t <= e.endBufferLine + this._linePadding[s || "full"];
  }
  _addLineToZone(e, t) {
    e.startBufferLine = Math.min(e.startBufferLine, t), e.endBufferLine = Math.max(e.endBufferLine, t);
  }
}, Wt = { full: 0, left: 0, center: 0, right: 0 }, Ci = { full: 0, left: 0, center: 0, right: 0 }, Cs = { full: 0, left: 0, center: 0, right: 0 }, Cr = class extends ue {
  constructor(e, t, s, r, n, o, a, l) {
    var c;
    super(), this._viewportElement = e, this._screenElement = t, this._bufferService = s, this._decorationService = r, this._renderService = n, this._optionsService = o, this._themeService = a, this._coreBrowserService = l, this._colorZoneStore = new zu(), this._shouldUpdateDimensions = !0, this._shouldUpdateAnchor = !0, this._lastKnownBufferLength = 0, this._canvas = this._coreBrowserService.mainDocument.createElement("canvas"), this._canvas.classList.add("xterm-decoration-overview-ruler"), this._refreshCanvasDimensions(), (c = this._viewportElement.parentElement) == null || c.insertBefore(this._canvas, this._viewportElement), this._register(Ae(() => {
      var d;
      return (d = this._canvas) == null ? void 0 : d.remove();
    }));
    let h = this._canvas.getContext("2d");
    if (h) this._ctx = h;
    else throw new Error("Ctx cannot be null");
    this._register(this._decorationService.onDecorationRegistered(() => this._queueRefresh(void 0, !0))), this._register(this._decorationService.onDecorationRemoved(() => this._queueRefresh(void 0, !0))), this._register(this._renderService.onRenderedViewportChange(() => this._queueRefresh())), this._register(this._bufferService.buffers.onBufferActivate(() => {
      this._canvas.style.display = this._bufferService.buffer === this._bufferService.buffers.alt ? "none" : "block";
    })), this._register(this._bufferService.onScroll(() => {
      this._lastKnownBufferLength !== this._bufferService.buffers.normal.lines.length && (this._refreshDrawHeightConstants(), this._refreshColorZonePadding());
    })), this._register(this._renderService.onRender(() => {
      (!this._containerHeight || this._containerHeight !== this._screenElement.clientHeight) && (this._queueRefresh(!0), this._containerHeight = this._screenElement.clientHeight);
    })), this._register(this._coreBrowserService.onDprChange(() => this._queueRefresh(!0))), this._register(this._optionsService.onSpecificOptionChange("overviewRuler", () => this._queueRefresh(!0))), this._register(this._themeService.onChangeColors(() => this._queueRefresh())), this._queueRefresh(!0);
  }
  get _width() {
    var e;
    return ((e = this._optionsService.options.overviewRuler) == null ? void 0 : e.width) || 0;
  }
  _refreshDrawConstants() {
    let e = Math.floor((this._canvas.width - 1) / 3), t = Math.ceil((this._canvas.width - 1) / 3);
    Ci.full = this._canvas.width, Ci.left = e, Ci.center = t, Ci.right = e, this._refreshDrawHeightConstants(), Cs.full = 1, Cs.left = 1, Cs.center = 1 + Ci.left, Cs.right = 1 + Ci.left + Ci.center;
  }
  _refreshDrawHeightConstants() {
    Wt.full = Math.round(2 * this._coreBrowserService.dpr);
    let e = this._canvas.height / this._bufferService.buffer.lines.length, t = Math.round(Math.max(Math.min(e, 12), 6) * this._coreBrowserService.dpr);
    Wt.left = t, Wt.center = t, Wt.right = t;
  }
  _refreshColorZonePadding() {
    this._colorZoneStore.setPadding({ full: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * Wt.full), left: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * Wt.left), center: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * Wt.center), right: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * Wt.right) }), this._lastKnownBufferLength = this._bufferService.buffers.normal.lines.length;
  }
  _refreshCanvasDimensions() {
    this._canvas.style.width = `${this._width}px`, this._canvas.width = Math.round(this._width * this._coreBrowserService.dpr), this._canvas.style.height = `${this._screenElement.clientHeight}px`, this._canvas.height = Math.round(this._screenElement.clientHeight * this._coreBrowserService.dpr), this._refreshDrawConstants(), this._refreshColorZonePadding();
  }
  _refreshDecorations() {
    this._shouldUpdateDimensions && this._refreshCanvasDimensions(), this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height), this._colorZoneStore.clear();
    for (let t of this._decorationService.decorations) this._colorZoneStore.addDecoration(t);
    this._ctx.lineWidth = 1, this._renderRulerOutline();
    let e = this._colorZoneStore.zones;
    for (let t of e) t.position !== "full" && this._renderColorZone(t);
    for (let t of e) t.position === "full" && this._renderColorZone(t);
    this._shouldUpdateDimensions = !1, this._shouldUpdateAnchor = !1;
  }
  _renderRulerOutline() {
    this._ctx.fillStyle = this._themeService.colors.overviewRulerBorder.css, this._ctx.fillRect(0, 0, 1, this._canvas.height), this._optionsService.rawOptions.overviewRuler.showTopBorder && this._ctx.fillRect(1, 0, this._canvas.width - 1, 1), this._optionsService.rawOptions.overviewRuler.showBottomBorder && this._ctx.fillRect(1, this._canvas.height - 1, this._canvas.width - 1, this._canvas.height);
  }
  _renderColorZone(e) {
    this._ctx.fillStyle = e.color, this._ctx.fillRect(Cs[e.position || "full"], Math.round((this._canvas.height - 1) * (e.startBufferLine / this._bufferService.buffers.active.lines.length) - Wt[e.position || "full"] / 2), Ci[e.position || "full"], Math.round((this._canvas.height - 1) * ((e.endBufferLine - e.startBufferLine) / this._bufferService.buffers.active.lines.length) + Wt[e.position || "full"]));
  }
  _queueRefresh(e, t) {
    this._shouldUpdateDimensions = e || this._shouldUpdateDimensions, this._shouldUpdateAnchor = t || this._shouldUpdateAnchor, this._animationFrame === void 0 && (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
      this._refreshDecorations(), this._animationFrame = void 0;
    }));
  }
};
Cr = $e([X(2, mt), X(3, js), X(4, ui), X(5, wt), X(6, vs), X(7, di)], Cr);
var O;
((e) => (e.NUL = "\0", e.SOH = "", e.STX = "", e.ETX = "", e.EOT = "", e.ENQ = "", e.ACK = "", e.BEL = "\x07", e.BS = "\b", e.HT = "	", e.LF = `
`, e.VT = "\v", e.FF = "\f", e.CR = "\r", e.SO = "", e.SI = "", e.DLE = "", e.DC1 = "", e.DC2 = "", e.DC3 = "", e.DC4 = "", e.NAK = "", e.SYN = "", e.ETB = "", e.CAN = "", e.EM = "", e.SUB = "", e.ESC = "\x1B", e.FS = "", e.GS = "", e.RS = "", e.US = "", e.SP = " ", e.DEL = ""))(O || (O = {}));
var zs;
((e) => (e.PAD = "", e.HOP = "", e.BPH = "", e.NBH = "", e.IND = "", e.NEL = "", e.SSA = "", e.ESA = "", e.HTS = "", e.HTJ = "", e.VTS = "", e.PLD = "", e.PLU = "", e.RI = "", e.SS2 = "", e.SS3 = "", e.DCS = "", e.PU1 = "", e.PU2 = "", e.STS = "", e.CCH = "", e.MW = "", e.SPA = "", e.EPA = "", e.SOS = "", e.SGCI = "", e.SCI = "", e.CSI = "", e.ST = "", e.OSC = "", e.PM = "", e.APC = ""))(zs || (zs = {}));
var jn;
((e) => e.ST = `${O.ESC}\\`)(jn || (jn = {}));
var Gn = class {
  constructor(e, t, s, r, n, o) {
    this._textarea = e, this._compositionView = t, this._bufferService = s, this._optionsService = r, this._coreService = n, this._renderService = o, this._isComposing = !1, this._isSendingComposition = !1, this._compositionPosition = { start: 0, end: 0 }, this._dataAlreadySent = "";
  }
  get isComposing() {
    return this._isComposing;
  }
  compositionstart() {
    this._isComposing = !0, this._compositionPosition.start = this._textarea.value.length, this._compositionView.textContent = "", this._dataAlreadySent = "", this._compositionView.classList.add("active");
  }
  compositionupdate(e) {
    this._compositionView.textContent = e.data, this.updateCompositionElements(), setTimeout(() => {
      this._compositionPosition.end = this._textarea.value.length;
    }, 0);
  }
  compositionend() {
    this._finalizeComposition(!0);
  }
  keydown(e) {
    if (this._isComposing || this._isSendingComposition) {
      if (e.keyCode === 20 || e.keyCode === 229 || e.keyCode === 16 || e.keyCode === 17 || e.keyCode === 18) return !1;
      this._finalizeComposition(!1);
    }
    return e.keyCode === 229 ? (this._handleAnyTextareaChanges(), !1) : !0;
  }
  _finalizeComposition(e) {
    if (this._compositionView.classList.remove("active"), this._isComposing = !1, e) {
      let t = { start: this._compositionPosition.start, end: this._compositionPosition.end };
      this._isSendingComposition = !0, setTimeout(() => {
        if (this._isSendingComposition) {
          this._isSendingComposition = !1;
          let s;
          t.start += this._dataAlreadySent.length, this._isComposing ? s = this._textarea.value.substring(t.start, this._compositionPosition.start) : s = this._textarea.value.substring(t.start), s.length > 0 && this._coreService.triggerDataEvent(s, !0);
        }
      }, 0);
    } else {
      this._isSendingComposition = !1;
      let t = this._textarea.value.substring(this._compositionPosition.start, this._compositionPosition.end);
      this._coreService.triggerDataEvent(t, !0);
    }
  }
  _handleAnyTextareaChanges() {
    let e = this._textarea.value;
    setTimeout(() => {
      if (!this._isComposing) {
        let t = this._textarea.value, s = t.replace(e, "");
        this._dataAlreadySent = s, t.length > e.length ? this._coreService.triggerDataEvent(s, !0) : t.length < e.length ? this._coreService.triggerDataEvent(`${O.DEL}`, !0) : t.length === e.length && t !== e && this._coreService.triggerDataEvent(t, !0);
      }
    }, 0);
  }
  updateCompositionElements(e) {
    if (this._isComposing) {
      if (this._bufferService.buffer.isCursorInViewport) {
        let t = Math.min(this._bufferService.buffer.x, this._bufferService.cols - 1), s = this._renderService.dimensions.css.cell.height, r = this._bufferService.buffer.y * this._renderService.dimensions.css.cell.height, n = t * this._renderService.dimensions.css.cell.width;
        this._compositionView.style.left = n + "px", this._compositionView.style.top = r + "px", this._compositionView.style.height = s + "px", this._compositionView.style.lineHeight = s + "px", this._compositionView.style.fontFamily = this._optionsService.rawOptions.fontFamily, this._compositionView.style.fontSize = this._optionsService.rawOptions.fontSize + "px";
        let o = this._compositionView.getBoundingClientRect();
        this._textarea.style.left = n + "px", this._textarea.style.top = r + "px", this._textarea.style.width = Math.max(o.width, 1) + "px", this._textarea.style.height = Math.max(o.height, 1) + "px", this._textarea.style.lineHeight = o.height + "px";
      }
      e || setTimeout(() => this.updateCompositionElements(!0), 0);
    }
  }
};
Gn = $e([X(2, mt), X(3, wt), X(4, Gi), X(5, ui)], Gn);
var et = 0, tt = 0, it = 0, ze = 0, Ma = { css: "#00000000", rgba: 0 }, Ue;
((e) => {
  function t(n, o, a, l) {
    return l !== void 0 ? `#${Ii(n)}${Ii(o)}${Ii(a)}${Ii(l)}` : `#${Ii(n)}${Ii(o)}${Ii(a)}`;
  }
  e.toCss = t;
  function s(n, o, a, l = 255) {
    return (n << 24 | o << 16 | a << 8 | l) >>> 0;
  }
  e.toRgba = s;
  function r(n, o, a, l) {
    return { css: e.toCss(n, o, a, l), rgba: e.toRgba(n, o, a, l) };
  }
  e.toColor = r;
})(Ue || (Ue = {}));
var De;
((e) => {
  function t(c, h) {
    if (ze = (h.rgba & 255) / 255, ze === 1) return { css: h.css, rgba: h.rgba };
    let d = h.rgba >> 24 & 255, u = h.rgba >> 16 & 255, f = h.rgba >> 8 & 255, _ = c.rgba >> 24 & 255, g = c.rgba >> 16 & 255, y = c.rgba >> 8 & 255;
    et = _ + Math.round((d - _) * ze), tt = g + Math.round((u - g) * ze), it = y + Math.round((f - y) * ze);
    let D = Ue.toCss(et, tt, it), R = Ue.toRgba(et, tt, it);
    return { css: D, rgba: R };
  }
  e.blend = t;
  function s(c) {
    return (c.rgba & 255) === 255;
  }
  e.isOpaque = s;
  function r(c, h, d) {
    let u = Ws.ensureContrastRatio(c.rgba, h.rgba, d);
    if (u) return Ue.toColor(u >> 24 & 255, u >> 16 & 255, u >> 8 & 255);
  }
  e.ensureContrastRatio = r;
  function n(c) {
    let h = (c.rgba | 255) >>> 0;
    return [et, tt, it] = Ws.toChannels(h), { css: Ue.toCss(et, tt, it), rgba: h };
  }
  e.opaque = n;
  function o(c, h) {
    return ze = Math.round(h * 255), [et, tt, it] = Ws.toChannels(c.rgba), { css: Ue.toCss(et, tt, it, ze), rgba: Ue.toRgba(et, tt, it, ze) };
  }
  e.opacity = o;
  function a(c, h) {
    return ze = c.rgba & 255, o(c, ze * h / 255);
  }
  e.multiplyOpacity = a;
  function l(c) {
    return [c.rgba >> 24 & 255, c.rgba >> 16 & 255, c.rgba >> 8 & 255];
  }
  e.toColorRGB = l;
})(De || (De = {}));
var Pe;
((e) => {
  let t, s;
  try {
    let n = document.createElement("canvas");
    n.width = 1, n.height = 1;
    let o = n.getContext("2d", { willReadFrequently: !0 });
    o && (t = o, t.globalCompositeOperation = "copy", s = t.createLinearGradient(0, 0, 1, 1));
  } catch {
  }
  function r(n) {
    if (n.match(/#[\da-f]{3,8}/i)) switch (n.length) {
      case 4:
        return et = parseInt(n.slice(1, 2).repeat(2), 16), tt = parseInt(n.slice(2, 3).repeat(2), 16), it = parseInt(n.slice(3, 4).repeat(2), 16), Ue.toColor(et, tt, it);
      case 5:
        return et = parseInt(n.slice(1, 2).repeat(2), 16), tt = parseInt(n.slice(2, 3).repeat(2), 16), it = parseInt(n.slice(3, 4).repeat(2), 16), ze = parseInt(n.slice(4, 5).repeat(2), 16), Ue.toColor(et, tt, it, ze);
      case 7:
        return { css: n, rgba: (parseInt(n.slice(1), 16) << 8 | 255) >>> 0 };
      case 9:
        return { css: n, rgba: parseInt(n.slice(1), 16) >>> 0 };
    }
    let o = n.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|\d?\.(\d+))\s*)?\)/);
    if (o) return et = parseInt(o[1]), tt = parseInt(o[2]), it = parseInt(o[3]), ze = Math.round((o[5] === void 0 ? 1 : parseFloat(o[5])) * 255), Ue.toColor(et, tt, it, ze);
    if (!t || !s) throw new Error("css.toColor: Unsupported css format");
    if (t.fillStyle = s, t.fillStyle = n, typeof t.fillStyle != "string") throw new Error("css.toColor: Unsupported css format");
    if (t.fillRect(0, 0, 1, 1), [et, tt, it, ze] = t.getImageData(0, 0, 1, 1).data, ze !== 255) throw new Error("css.toColor: Unsupported css format");
    return { rgba: Ue.toRgba(et, tt, it, ze), css: n };
  }
  e.toColor = r;
})(Pe || (Pe = {}));
var ct;
((e) => {
  function t(r) {
    return s(r >> 16 & 255, r >> 8 & 255, r & 255);
  }
  e.relativeLuminance = t;
  function s(r, n, o) {
    let a = r / 255, l = n / 255, c = o / 255, h = a <= 0.03928 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4), d = l <= 0.03928 ? l / 12.92 : Math.pow((l + 0.055) / 1.055, 2.4), u = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return h * 0.2126 + d * 0.7152 + u * 0.0722;
  }
  e.relativeLuminance2 = s;
})(ct || (ct = {}));
var Ws;
((e) => {
  function t(a, l) {
    if (ze = (l & 255) / 255, ze === 1) return l;
    let c = l >> 24 & 255, h = l >> 16 & 255, d = l >> 8 & 255, u = a >> 24 & 255, f = a >> 16 & 255, _ = a >> 8 & 255;
    return et = u + Math.round((c - u) * ze), tt = f + Math.round((h - f) * ze), it = _ + Math.round((d - _) * ze), Ue.toRgba(et, tt, it);
  }
  e.blend = t;
  function s(a, l, c) {
    let h = ct.relativeLuminance(a >> 8), d = ct.relativeLuminance(l >> 8);
    if (ni(h, d) < c) {
      if (d < h) {
        let _ = r(a, l, c), g = ni(h, ct.relativeLuminance(_ >> 8));
        if (g < c) {
          let y = n(a, l, c), D = ni(h, ct.relativeLuminance(y >> 8));
          return g > D ? _ : y;
        }
        return _;
      }
      let u = n(a, l, c), f = ni(h, ct.relativeLuminance(u >> 8));
      if (f < c) {
        let _ = r(a, l, c), g = ni(h, ct.relativeLuminance(_ >> 8));
        return f > g ? u : _;
      }
      return u;
    }
  }
  e.ensureContrastRatio = s;
  function r(a, l, c) {
    let h = a >> 24 & 255, d = a >> 16 & 255, u = a >> 8 & 255, f = l >> 24 & 255, _ = l >> 16 & 255, g = l >> 8 & 255, y = ni(ct.relativeLuminance2(f, _, g), ct.relativeLuminance2(h, d, u));
    for (; y < c && (f > 0 || _ > 0 || g > 0); ) f -= Math.max(0, Math.ceil(f * 0.1)), _ -= Math.max(0, Math.ceil(_ * 0.1)), g -= Math.max(0, Math.ceil(g * 0.1)), y = ni(ct.relativeLuminance2(f, _, g), ct.relativeLuminance2(h, d, u));
    return (f << 24 | _ << 16 | g << 8 | 255) >>> 0;
  }
  e.reduceLuminance = r;
  function n(a, l, c) {
    let h = a >> 24 & 255, d = a >> 16 & 255, u = a >> 8 & 255, f = l >> 24 & 255, _ = l >> 16 & 255, g = l >> 8 & 255, y = ni(ct.relativeLuminance2(f, _, g), ct.relativeLuminance2(h, d, u));
    for (; y < c && (f < 255 || _ < 255 || g < 255); ) f = Math.min(255, f + Math.ceil((255 - f) * 0.1)), _ = Math.min(255, _ + Math.ceil((255 - _) * 0.1)), g = Math.min(255, g + Math.ceil((255 - g) * 0.1)), y = ni(ct.relativeLuminance2(f, _, g), ct.relativeLuminance2(h, d, u));
    return (f << 24 | _ << 16 | g << 8 | 255) >>> 0;
  }
  e.increaseLuminance = n;
  function o(a) {
    return [a >> 24 & 255, a >> 16 & 255, a >> 8 & 255, a & 255];
  }
  e.toChannels = o;
})(Ws || (Ws = {}));
function Ii(e) {
  let t = e.toString(16);
  return t.length < 2 ? "0" + t : t;
}
function ni(e, t) {
  return e < t ? (t + 0.05) / (e + 0.05) : (e + 0.05) / (t + 0.05);
}
var Wu = class extends Ys {
  constructor(e, t, s) {
    super(), this.content = 0, this.combinedData = "", this.fg = e.fg, this.bg = e.bg, this.combinedData = t, this._width = s;
  }
  isCombined() {
    return 2097152;
  }
  getWidth() {
    return this._width;
  }
  getChars() {
    return this.combinedData;
  }
  getCode() {
    return 2097151;
  }
  setFromCharData(e) {
    throw new Error("not implemented");
  }
  getAsCharData() {
    return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
  }
}, xr = class {
  constructor(e) {
    this._bufferService = e, this._characterJoiners = [], this._nextCharacterJoinerId = 0, this._workCell = new Nt();
  }
  register(e) {
    let t = { id: this._nextCharacterJoinerId++, handler: e };
    return this._characterJoiners.push(t), t.id;
  }
  deregister(e) {
    for (let t = 0; t < this._characterJoiners.length; t++) if (this._characterJoiners[t].id === e) return this._characterJoiners.splice(t, 1), !0;
    return !1;
  }
  getJoinedCharacters(e) {
    if (this._characterJoiners.length === 0) return [];
    let t = this._bufferService.buffer.lines.get(e);
    if (!t || t.length === 0) return [];
    let s = [], r = t.translateToString(!0), n = 0, o = 0, a = 0, l = t.getFg(0), c = t.getBg(0);
    for (let h = 0; h < t.getTrimmedLength(); h++) if (t.loadCell(h, this._workCell), this._workCell.getWidth() !== 0) {
      if (this._workCell.fg !== l || this._workCell.bg !== c) {
        if (h - n > 1) {
          let d = this._getJoinedRanges(r, a, o, t, n);
          for (let u = 0; u < d.length; u++) s.push(d[u]);
        }
        n = h, a = o, l = this._workCell.fg, c = this._workCell.bg;
      }
      o += this._workCell.getChars().length || Ri.length;
    }
    if (this._bufferService.cols - n > 1) {
      let h = this._getJoinedRanges(r, a, o, t, n);
      for (let d = 0; d < h.length; d++) s.push(h[d]);
    }
    return s;
  }
  _getJoinedRanges(e, t, s, r, n) {
    let o = e.substring(t, s), a = [];
    try {
      a = this._characterJoiners[0].handler(o);
    } catch (l) {
      console.error(l);
    }
    for (let l = 1; l < this._characterJoiners.length; l++) try {
      let c = this._characterJoiners[l].handler(o);
      for (let h = 0; h < c.length; h++) xr._mergeRanges(a, c[h]);
    } catch (c) {
      console.error(c);
    }
    return this._stringRangesToCellRanges(a, r, n), a;
  }
  _stringRangesToCellRanges(e, t, s) {
    let r = 0, n = !1, o = 0, a = e[r];
    if (a) {
      for (let l = s; l < this._bufferService.cols; l++) {
        let c = t.getWidth(l), h = t.getString(l).length || Ri.length;
        if (c !== 0) {
          if (!n && a[0] <= o && (a[0] = l, n = !0), a[1] <= o) {
            if (a[1] = l, a = e[++r], !a) break;
            a[0] <= o ? (a[0] = l, n = !0) : n = !1;
          }
          o += h;
        }
      }
      a && (a[1] = this._bufferService.cols);
    }
  }
  static _mergeRanges(e, t) {
    let s = !1;
    for (let r = 0; r < e.length; r++) {
      let n = e[r];
      if (s) {
        if (t[1] <= n[0]) return e[r - 1][1] = t[1], e;
        if (t[1] <= n[1]) return e[r - 1][1] = Math.max(t[1], n[1]), e.splice(r, 1), e;
        e.splice(r, 1), r--;
      } else {
        if (t[1] <= n[0]) return e.splice(r, 0, t), e;
        if (t[1] <= n[1]) return n[0] = Math.min(t[0], n[0]), e;
        t[0] < n[1] && (n[0] = Math.min(t[0], n[0]), s = !0);
        continue;
      }
    }
    return s ? e[e.length - 1][1] = t[1] : e.push(t), e;
  }
};
xr = $e([X(0, mt)], xr);
function $u(e) {
  return 57508 <= e && e <= 57558;
}
function Hu(e) {
  return 9472 <= e && e <= 9631;
}
function Uu(e) {
  return $u(e) || Hu(e);
}
function Ku() {
  return { css: { canvas: rr(), cell: rr() }, device: { canvas: rr(), cell: rr(), char: { width: 0, height: 0, left: 0, top: 0 } } };
}
function rr() {
  return { width: 0, height: 0 };
}
var Xn = class {
  constructor(e, t, s, r, n, o, a) {
    this._document = e, this._characterJoinerService = t, this._optionsService = s, this._coreBrowserService = r, this._coreService = n, this._decorationService = o, this._themeService = a, this._workCell = new Nt(), this._columnSelectMode = !1, this.defaultSpacing = 0;
  }
  handleSelectionChanged(e, t, s) {
    this._selectionStart = e, this._selectionEnd = t, this._columnSelectMode = s;
  }
  createRow(e, t, s, r, n, o, a, l, c, h, d) {
    let u = [], f = this._characterJoinerService.getJoinedCharacters(t), _ = this._themeService.colors, g = e.getNoBgTrimmedLength();
    s && g < o + 1 && (g = o + 1);
    let y, D = 0, R = "", H = 0, M = 0, k = 0, B = 0, N = !1, U = 0, ie = !1, Z = 0, _e = 0, Y = [], v = h !== -1 && d !== -1;
    for (let p = 0; p < g; p++) {
      e.loadCell(p, this._workCell);
      let w = this._workCell.getWidth();
      if (w === 0) continue;
      let m = !1, b = p >= _e, L = p, x = this._workCell;
      if (f.length > 0 && p === f[0][0] && b) {
        let j = f.shift(), G = this._isCellInSelection(j[0], t);
        for (H = j[0] + 1; H < j[1]; H++) b && (b = G === this._isCellInSelection(H, t));
        b && (b = !s || o < j[0] || o >= j[1]), b ? (m = !0, x = new Wu(this._workCell, e.translateToString(!0, j[0], j[1]), j[1] - j[0]), L = j[1] - 1, w = x.getWidth()) : _e = j[1];
      }
      let A = this._isCellInSelection(p, t), I = s && p === o, se = v && p >= h && p <= d, he = !1;
      this._decorationService.forEachDecorationAtCell(p, t, void 0, (j) => {
        he = !0;
      });
      let re = x.getChars() || Ri;
      if (re === " " && (x.isUnderline() || x.isOverline()) && (re = " "), Z = w * l - c.get(re, x.isBold(), x.isItalic()), !y) y = this._document.createElement("span");
      else if (D && (A && ie || !A && !ie && x.bg === M) && (A && ie && _.selectionForeground || x.fg === k) && x.extended.ext === B && se === N && Z === U && !I && !m && !he && b) {
        x.isInvisible() ? R += Ri : R += re, D++;
        continue;
      } else D && (y.textContent = R), y = this._document.createElement("span"), D = 0, R = "";
      if (M = x.bg, k = x.fg, B = x.extended.ext, N = se, U = Z, ie = A, m && o >= p && o <= L && (o = p), !this._coreService.isCursorHidden && I && this._coreService.isCursorInitialized) {
        if (Y.push("xterm-cursor"), this._coreBrowserService.isFocused) a && Y.push("xterm-cursor-blink"), Y.push(r === "bar" ? "xterm-cursor-bar" : r === "underline" ? "xterm-cursor-underline" : "xterm-cursor-block");
        else if (n) switch (n) {
          case "outline":
            Y.push("xterm-cursor-outline");
            break;
          case "block":
            Y.push("xterm-cursor-block");
            break;
          case "bar":
            Y.push("xterm-cursor-bar");
            break;
          case "underline":
            Y.push("xterm-cursor-underline");
            break;
        }
      }
      if (x.isBold() && Y.push("xterm-bold"), x.isItalic() && Y.push("xterm-italic"), x.isDim() && Y.push("xterm-dim"), x.isInvisible() ? R = Ri : R = x.getChars() || Ri, x.isUnderline() && (Y.push(`xterm-underline-${x.extended.underlineStyle}`), R === " " && (R = " "), !x.isUnderlineColorDefault())) if (x.isUnderlineColorRGB()) y.style.textDecorationColor = `rgb(${Ys.toColorRGB(x.getUnderlineColor()).join(",")})`;
      else {
        let j = x.getUnderlineColor();
        this._optionsService.rawOptions.drawBoldTextInBrightColors && x.isBold() && j < 8 && (j += 8), y.style.textDecorationColor = _.ansi[j].css;
      }
      x.isOverline() && (Y.push("xterm-overline"), R === " " && (R = " ")), x.isStrikethrough() && Y.push("xterm-strikethrough"), se && (y.style.textDecoration = "underline");
      let ce = x.getFgColor(), pe = x.getFgColorMode(), ge = x.getBgColor(), be = x.getBgColorMode(), fe = !!x.isInverse();
      if (fe) {
        let j = ce;
        ce = ge, ge = j;
        let G = pe;
        pe = be, be = G;
      }
      let ye, ee, ve = !1;
      this._decorationService.forEachDecorationAtCell(p, t, void 0, (j) => {
        j.options.layer !== "top" && ve || (j.backgroundColorRGB && (be = 50331648, ge = j.backgroundColorRGB.rgba >> 8 & 16777215, ye = j.backgroundColorRGB), j.foregroundColorRGB && (pe = 50331648, ce = j.foregroundColorRGB.rgba >> 8 & 16777215, ee = j.foregroundColorRGB), ve = j.options.layer === "top");
      }), !ve && A && (ye = this._coreBrowserService.isFocused ? _.selectionBackgroundOpaque : _.selectionInactiveBackgroundOpaque, ge = ye.rgba >> 8 & 16777215, be = 50331648, ve = !0, _.selectionForeground && (pe = 50331648, ce = _.selectionForeground.rgba >> 8 & 16777215, ee = _.selectionForeground)), ve && Y.push("xterm-decoration-top");
      let le;
      switch (be) {
        case 16777216:
        case 33554432:
          le = _.ansi[ge], Y.push(`xterm-bg-${ge}`);
          break;
        case 50331648:
          le = Ue.toColor(ge >> 16, ge >> 8 & 255, ge & 255), this._addStyle(y, `background-color:#${Ea((ge >>> 0).toString(16), "0", 6)}`);
          break;
        case 0:
        default:
          fe ? (le = _.foreground, Y.push("xterm-bg-257")) : le = _.background;
      }
      switch (ye || x.isDim() && (ye = De.multiplyOpacity(le, 0.5)), pe) {
        case 16777216:
        case 33554432:
          x.isBold() && ce < 8 && this._optionsService.rawOptions.drawBoldTextInBrightColors && (ce += 8), this._applyMinimumContrast(y, le, _.ansi[ce], x, ye, void 0) || Y.push(`xterm-fg-${ce}`);
          break;
        case 50331648:
          let j = Ue.toColor(ce >> 16 & 255, ce >> 8 & 255, ce & 255);
          this._applyMinimumContrast(y, le, j, x, ye, ee) || this._addStyle(y, `color:#${Ea(ce.toString(16), "0", 6)}`);
          break;
        case 0:
        default:
          this._applyMinimumContrast(y, le, _.foreground, x, ye, ee) || fe && Y.push("xterm-fg-257");
      }
      Y.length && (y.className = Y.join(" "), Y.length = 0), !I && !m && !he && b ? D++ : y.textContent = R, Z !== this.defaultSpacing && (y.style.letterSpacing = `${Z}px`), u.push(y), p = L;
    }
    return y && D && (y.textContent = R), u;
  }
  _applyMinimumContrast(e, t, s, r, n, o) {
    if (this._optionsService.rawOptions.minimumContrastRatio === 1 || Uu(r.getCode())) return !1;
    let a = this._getContrastCache(r), l;
    if (!n && !o && (l = a.getColor(t.rgba, s.rgba)), l === void 0) {
      let c = this._optionsService.rawOptions.minimumContrastRatio / (r.isDim() ? 2 : 1);
      l = De.ensureContrastRatio(n || t, o || s, c), a.setColor((n || t).rgba, (o || s).rgba, l ?? null);
    }
    return l ? (this._addStyle(e, `color:${l.css}`), !0) : !1;
  }
  _getContrastCache(e) {
    return e.isDim() ? this._themeService.colors.halfContrastCache : this._themeService.colors.contrastCache;
  }
  _addStyle(e, t) {
    e.setAttribute("style", `${e.getAttribute("style") || ""}${t};`);
  }
  _isCellInSelection(e, t) {
    let s = this._selectionStart, r = this._selectionEnd;
    return !s || !r ? !1 : this._columnSelectMode ? s[0] <= r[0] ? e >= s[0] && t >= s[1] && e < r[0] && t <= r[1] : e < s[0] && t >= s[1] && e >= r[0] && t <= r[1] : t > s[1] && t < r[1] || s[1] === r[1] && t === s[1] && e >= s[0] && e < r[0] || s[1] < r[1] && t === r[1] && e < r[0] || s[1] < r[1] && t === s[1] && e >= s[0];
  }
};
Xn = $e([X(1, hh), X(2, wt), X(3, di), X(4, Gi), X(5, js), X(6, vs)], Xn);
function Ea(e, t, s) {
  for (; e.length < s; ) e = t + e;
  return e;
}
var Vu = class {
  constructor(e, t) {
    this._flat = new Float32Array(256), this._font = "", this._fontSize = 0, this._weight = "normal", this._weightBold = "bold", this._measureElements = [], this._container = e.createElement("div"), this._container.classList.add("xterm-width-cache-measure-container"), this._container.setAttribute("aria-hidden", "true"), this._container.style.whiteSpace = "pre", this._container.style.fontKerning = "none";
    let s = e.createElement("span");
    s.classList.add("xterm-char-measure-element");
    let r = e.createElement("span");
    r.classList.add("xterm-char-measure-element"), r.style.fontWeight = "bold";
    let n = e.createElement("span");
    n.classList.add("xterm-char-measure-element"), n.style.fontStyle = "italic";
    let o = e.createElement("span");
    o.classList.add("xterm-char-measure-element"), o.style.fontWeight = "bold", o.style.fontStyle = "italic", this._measureElements = [s, r, n, o], this._container.appendChild(s), this._container.appendChild(r), this._container.appendChild(n), this._container.appendChild(o), t.appendChild(this._container), this.clear();
  }
  dispose() {
    this._container.remove(), this._measureElements.length = 0, this._holey = void 0;
  }
  clear() {
    this._flat.fill(-9999), this._holey = /* @__PURE__ */ new Map();
  }
  setFont(e, t, s, r) {
    e === this._font && t === this._fontSize && s === this._weight && r === this._weightBold || (this._font = e, this._fontSize = t, this._weight = s, this._weightBold = r, this._container.style.fontFamily = this._font, this._container.style.fontSize = `${this._fontSize}px`, this._measureElements[0].style.fontWeight = `${s}`, this._measureElements[1].style.fontWeight = `${r}`, this._measureElements[2].style.fontWeight = `${s}`, this._measureElements[3].style.fontWeight = `${r}`, this.clear());
  }
  get(e, t, s) {
    let r = 0;
    if (!t && !s && e.length === 1 && (r = e.charCodeAt(0)) < 256) {
      if (this._flat[r] !== -9999) return this._flat[r];
      let a = this._measure(e, 0);
      return a > 0 && (this._flat[r] = a), a;
    }
    let n = e;
    t && (n += "B"), s && (n += "I");
    let o = this._holey.get(n);
    if (o === void 0) {
      let a = 0;
      t && (a |= 1), s && (a |= 2), o = this._measure(e, a), o > 0 && this._holey.set(n, o);
    }
    return o;
  }
  _measure(e, t) {
    let s = this._measureElements[t];
    return s.textContent = e.repeat(32), s.offsetWidth / 32;
  }
}, qu = class {
  constructor() {
    this.clear();
  }
  clear() {
    this.hasSelection = !1, this.columnSelectMode = !1, this.viewportStartRow = 0, this.viewportEndRow = 0, this.viewportCappedStartRow = 0, this.viewportCappedEndRow = 0, this.startCol = 0, this.endCol = 0, this.selectionStart = void 0, this.selectionEnd = void 0;
  }
  update(e, t, s, r = !1) {
    if (this.selectionStart = t, this.selectionEnd = s, !t || !s || t[0] === s[0] && t[1] === s[1]) {
      this.clear();
      return;
    }
    let n = e.buffers.active.ydisp, o = t[1] - n, a = s[1] - n, l = Math.max(o, 0), c = Math.min(a, e.rows - 1);
    if (l >= e.rows || c < 0) {
      this.clear();
      return;
    }
    this.hasSelection = !0, this.columnSelectMode = r, this.viewportStartRow = o, this.viewportEndRow = a, this.viewportCappedStartRow = l, this.viewportCappedEndRow = c, this.startCol = t[0], this.endCol = s[0];
  }
  isCellSelected(e, t, s) {
    return this.hasSelection ? (s -= e.buffer.active.viewportY, this.columnSelectMode ? this.startCol <= this.endCol ? t >= this.startCol && s >= this.viewportCappedStartRow && t < this.endCol && s <= this.viewportCappedEndRow : t < this.startCol && s >= this.viewportCappedStartRow && t >= this.endCol && s <= this.viewportCappedEndRow : s > this.viewportStartRow && s < this.viewportEndRow || this.viewportStartRow === this.viewportEndRow && s === this.viewportStartRow && t >= this.startCol && t < this.endCol || this.viewportStartRow < this.viewportEndRow && s === this.viewportEndRow && t < this.endCol || this.viewportStartRow < this.viewportEndRow && s === this.viewportStartRow && t >= this.startCol) : !1;
  }
};
function Yu() {
  return new qu();
}
var Gr = "xterm-dom-renderer-owner-", Mt = "xterm-rows", nr = "xterm-fg-", Da = "xterm-bg-", xs = "xterm-focus", or = "xterm-selection", ju = 1, Zn = class extends ue {
  constructor(e, t, s, r, n, o, a, l, c, h, d, u, f, _) {
    super(), this._terminal = e, this._document = t, this._element = s, this._screenElement = r, this._viewportElement = n, this._helperContainer = o, this._linkifier2 = a, this._charSizeService = c, this._optionsService = h, this._bufferService = d, this._coreService = u, this._coreBrowserService = f, this._themeService = _, this._terminalClass = ju++, this._rowElements = [], this._selectionRenderModel = Yu(), this.onRequestRedraw = this._register(new K()).event, this._rowContainer = this._document.createElement("div"), this._rowContainer.classList.add(Mt), this._rowContainer.style.lineHeight = "normal", this._rowContainer.setAttribute("aria-hidden", "true"), this._refreshRowElements(this._bufferService.cols, this._bufferService.rows), this._selectionContainer = this._document.createElement("div"), this._selectionContainer.classList.add(or), this._selectionContainer.setAttribute("aria-hidden", "true"), this.dimensions = Ku(), this._updateDimensions(), this._register(this._optionsService.onOptionChange(() => this._handleOptionsChanged())), this._register(this._themeService.onChangeColors((g) => this._injectCss(g))), this._injectCss(this._themeService.colors), this._rowFactory = l.createInstance(Xn, document), this._element.classList.add(Gr + this._terminalClass), this._screenElement.appendChild(this._rowContainer), this._screenElement.appendChild(this._selectionContainer), this._register(this._linkifier2.onShowLinkUnderline((g) => this._handleLinkHover(g))), this._register(this._linkifier2.onHideLinkUnderline((g) => this._handleLinkLeave(g))), this._register(Ae(() => {
      this._element.classList.remove(Gr + this._terminalClass), this._rowContainer.remove(), this._selectionContainer.remove(), this._widthCache.dispose(), this._themeStyleElement.remove(), this._dimensionsStyleElement.remove();
    })), this._widthCache = new Vu(this._document, this._helperContainer), this._widthCache.setFont(this._optionsService.rawOptions.fontFamily, this._optionsService.rawOptions.fontSize, this._optionsService.rawOptions.fontWeight, this._optionsService.rawOptions.fontWeightBold), this._setDefaultSpacing();
  }
  _updateDimensions() {
    let e = this._coreBrowserService.dpr;
    this.dimensions.device.char.width = this._charSizeService.width * e, this.dimensions.device.char.height = Math.ceil(this._charSizeService.height * e), this.dimensions.device.cell.width = this.dimensions.device.char.width + Math.round(this._optionsService.rawOptions.letterSpacing), this.dimensions.device.cell.height = Math.floor(this.dimensions.device.char.height * this._optionsService.rawOptions.lineHeight), this.dimensions.device.char.left = 0, this.dimensions.device.char.top = 0, this.dimensions.device.canvas.width = this.dimensions.device.cell.width * this._bufferService.cols, this.dimensions.device.canvas.height = this.dimensions.device.cell.height * this._bufferService.rows, this.dimensions.css.canvas.width = Math.round(this.dimensions.device.canvas.width / e), this.dimensions.css.canvas.height = Math.round(this.dimensions.device.canvas.height / e), this.dimensions.css.cell.width = this.dimensions.css.canvas.width / this._bufferService.cols, this.dimensions.css.cell.height = this.dimensions.css.canvas.height / this._bufferService.rows;
    for (let s of this._rowElements) s.style.width = `${this.dimensions.css.canvas.width}px`, s.style.height = `${this.dimensions.css.cell.height}px`, s.style.lineHeight = `${this.dimensions.css.cell.height}px`, s.style.overflow = "hidden";
    this._dimensionsStyleElement || (this._dimensionsStyleElement = this._document.createElement("style"), this._screenElement.appendChild(this._dimensionsStyleElement));
    let t = `${this._terminalSelector} .${Mt} span { display: inline-block; height: 100%; vertical-align: top;}`;
    this._dimensionsStyleElement.textContent = t, this._selectionContainer.style.height = this._viewportElement.style.height, this._screenElement.style.width = `${this.dimensions.css.canvas.width}px`, this._screenElement.style.height = `${this.dimensions.css.canvas.height}px`;
  }
  _injectCss(e) {
    this._themeStyleElement || (this._themeStyleElement = this._document.createElement("style"), this._screenElement.appendChild(this._themeStyleElement));
    let t = `${this._terminalSelector} .${Mt} { pointer-events: none; color: ${e.foreground.css}; font-family: ${this._optionsService.rawOptions.fontFamily}; font-size: ${this._optionsService.rawOptions.fontSize}px; font-kerning: none; white-space: pre}`;
    t += `${this._terminalSelector} .${Mt} .xterm-dim { color: ${De.multiplyOpacity(e.foreground, 0.5).css};}`, t += `${this._terminalSelector} span:not(.xterm-bold) { font-weight: ${this._optionsService.rawOptions.fontWeight};}${this._terminalSelector} span.xterm-bold { font-weight: ${this._optionsService.rawOptions.fontWeightBold};}${this._terminalSelector} span.xterm-italic { font-style: italic;}`;
    let s = `blink_underline_${this._terminalClass}`, r = `blink_bar_${this._terminalClass}`, n = `blink_block_${this._terminalClass}`;
    t += `@keyframes ${s} { 50% {  border-bottom-style: hidden; }}`, t += `@keyframes ${r} { 50% {  box-shadow: none; }}`, t += `@keyframes ${n} { 0% {  background-color: ${e.cursor.css};  color: ${e.cursorAccent.css}; } 50% {  background-color: inherit;  color: ${e.cursor.css}; }}`, t += `${this._terminalSelector} .${Mt}.${xs} .xterm-cursor.xterm-cursor-blink.xterm-cursor-underline { animation: ${s} 1s step-end infinite;}${this._terminalSelector} .${Mt}.${xs} .xterm-cursor.xterm-cursor-blink.xterm-cursor-bar { animation: ${r} 1s step-end infinite;}${this._terminalSelector} .${Mt}.${xs} .xterm-cursor.xterm-cursor-blink.xterm-cursor-block { animation: ${n} 1s step-end infinite;}${this._terminalSelector} .${Mt} .xterm-cursor.xterm-cursor-block { background-color: ${e.cursor.css}; color: ${e.cursorAccent.css};}${this._terminalSelector} .${Mt} .xterm-cursor.xterm-cursor-block:not(.xterm-cursor-blink) { background-color: ${e.cursor.css} !important; color: ${e.cursorAccent.css} !important;}${this._terminalSelector} .${Mt} .xterm-cursor.xterm-cursor-outline { outline: 1px solid ${e.cursor.css}; outline-offset: -1px;}${this._terminalSelector} .${Mt} .xterm-cursor.xterm-cursor-bar { box-shadow: ${this._optionsService.rawOptions.cursorWidth}px 0 0 ${e.cursor.css} inset;}${this._terminalSelector} .${Mt} .xterm-cursor.xterm-cursor-underline { border-bottom: 1px ${e.cursor.css}; border-bottom-style: solid; height: calc(100% - 1px);}`, t += `${this._terminalSelector} .${or} { position: absolute; top: 0; left: 0; z-index: 1; pointer-events: none;}${this._terminalSelector}.focus .${or} div { position: absolute; background-color: ${e.selectionBackgroundOpaque.css};}${this._terminalSelector} .${or} div { position: absolute; background-color: ${e.selectionInactiveBackgroundOpaque.css};}`;
    for (let [o, a] of e.ansi.entries()) t += `${this._terminalSelector} .${nr}${o} { color: ${a.css}; }${this._terminalSelector} .${nr}${o}.xterm-dim { color: ${De.multiplyOpacity(a, 0.5).css}; }${this._terminalSelector} .${Da}${o} { background-color: ${a.css}; }`;
    t += `${this._terminalSelector} .${nr}257 { color: ${De.opaque(e.background).css}; }${this._terminalSelector} .${nr}257.xterm-dim { color: ${De.multiplyOpacity(De.opaque(e.background), 0.5).css}; }${this._terminalSelector} .${Da}257 { background-color: ${e.foreground.css}; }`, this._themeStyleElement.textContent = t;
  }
  _setDefaultSpacing() {
    let e = this.dimensions.css.cell.width - this._widthCache.get("W", !1, !1);
    this._rowContainer.style.letterSpacing = `${e}px`, this._rowFactory.defaultSpacing = e;
  }
  handleDevicePixelRatioChange() {
    this._updateDimensions(), this._widthCache.clear(), this._setDefaultSpacing();
  }
  _refreshRowElements(e, t) {
    for (let s = this._rowElements.length; s <= t; s++) {
      let r = this._document.createElement("div");
      this._rowContainer.appendChild(r), this._rowElements.push(r);
    }
    for (; this._rowElements.length > t; ) this._rowContainer.removeChild(this._rowElements.pop());
  }
  handleResize(e, t) {
    this._refreshRowElements(e, t), this._updateDimensions(), this.handleSelectionChanged(this._selectionRenderModel.selectionStart, this._selectionRenderModel.selectionEnd, this._selectionRenderModel.columnSelectMode);
  }
  handleCharSizeChanged() {
    this._updateDimensions(), this._widthCache.clear(), this._setDefaultSpacing();
  }
  handleBlur() {
    this._rowContainer.classList.remove(xs), this.renderRows(0, this._bufferService.rows - 1);
  }
  handleFocus() {
    this._rowContainer.classList.add(xs), this.renderRows(this._bufferService.buffer.y, this._bufferService.buffer.y);
  }
  handleSelectionChanged(e, t, s) {
    if (this._selectionContainer.replaceChildren(), this._rowFactory.handleSelectionChanged(e, t, s), this.renderRows(0, this._bufferService.rows - 1), !e || !t || (this._selectionRenderModel.update(this._terminal, e, t, s), !this._selectionRenderModel.hasSelection)) return;
    let r = this._selectionRenderModel.viewportStartRow, n = this._selectionRenderModel.viewportEndRow, o = this._selectionRenderModel.viewportCappedStartRow, a = this._selectionRenderModel.viewportCappedEndRow, l = this._document.createDocumentFragment();
    if (s) {
      let c = e[0] > t[0];
      l.appendChild(this._createSelectionElement(o, c ? t[0] : e[0], c ? e[0] : t[0], a - o + 1));
    } else {
      let c = r === o ? e[0] : 0, h = o === n ? t[0] : this._bufferService.cols;
      l.appendChild(this._createSelectionElement(o, c, h));
      let d = a - o - 1;
      if (l.appendChild(this._createSelectionElement(o + 1, 0, this._bufferService.cols, d)), o !== a) {
        let u = n === a ? t[0] : this._bufferService.cols;
        l.appendChild(this._createSelectionElement(a, 0, u));
      }
    }
    this._selectionContainer.appendChild(l);
  }
  _createSelectionElement(e, t, s, r = 1) {
    let n = this._document.createElement("div"), o = t * this.dimensions.css.cell.width, a = this.dimensions.css.cell.width * (s - t);
    return o + a > this.dimensions.css.canvas.width && (a = this.dimensions.css.canvas.width - o), n.style.height = `${r * this.dimensions.css.cell.height}px`, n.style.top = `${e * this.dimensions.css.cell.height}px`, n.style.left = `${o}px`, n.style.width = `${a}px`, n;
  }
  handleCursorMove() {
  }
  _handleOptionsChanged() {
    this._updateDimensions(), this._injectCss(this._themeService.colors), this._widthCache.setFont(this._optionsService.rawOptions.fontFamily, this._optionsService.rawOptions.fontSize, this._optionsService.rawOptions.fontWeight, this._optionsService.rawOptions.fontWeightBold), this._setDefaultSpacing();
  }
  clear() {
    for (let e of this._rowElements) e.replaceChildren();
  }
  renderRows(e, t) {
    let s = this._bufferService.buffer, r = s.ybase + s.y, n = Math.min(s.x, this._bufferService.cols - 1), o = this._coreService.decPrivateModes.cursorBlink ?? this._optionsService.rawOptions.cursorBlink, a = this._coreService.decPrivateModes.cursorStyle ?? this._optionsService.rawOptions.cursorStyle, l = this._optionsService.rawOptions.cursorInactiveStyle;
    for (let c = e; c <= t; c++) {
      let h = c + s.ydisp, d = this._rowElements[c], u = s.lines.get(h);
      if (!d || !u) break;
      d.replaceChildren(...this._rowFactory.createRow(u, h, h === r, a, l, n, o, this.dimensions.css.cell.width, this._widthCache, -1, -1));
    }
  }
  get _terminalSelector() {
    return `.${Gr}${this._terminalClass}`;
  }
  _handleLinkHover(e) {
    this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, !0);
  }
  _handleLinkLeave(e) {
    this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, !1);
  }
  _setCellUnderline(e, t, s, r, n, o) {
    s < 0 && (e = 0), r < 0 && (t = 0);
    let a = this._bufferService.rows - 1;
    s = Math.max(Math.min(s, a), 0), r = Math.max(Math.min(r, a), 0), n = Math.min(n, this._bufferService.cols);
    let l = this._bufferService.buffer, c = l.ybase + l.y, h = Math.min(l.x, n - 1), d = this._optionsService.rawOptions.cursorBlink, u = this._optionsService.rawOptions.cursorStyle, f = this._optionsService.rawOptions.cursorInactiveStyle;
    for (let _ = s; _ <= r; ++_) {
      let g = _ + l.ydisp, y = this._rowElements[_], D = l.lines.get(g);
      if (!y || !D) break;
      y.replaceChildren(...this._rowFactory.createRow(D, g, g === c, u, f, h, d, this.dimensions.css.cell.width, this._widthCache, o ? _ === s ? e : 0 : -1, o ? (_ === r ? t : n) - 1 : -1));
    }
  }
};
Zn = $e([X(7, Lo), X(8, Pr), X(9, wt), X(10, mt), X(11, Gi), X(12, di), X(13, vs)], Zn);
var Jn = class extends ue {
  constructor(e, t, s) {
    super(), this._optionsService = s, this.width = 0, this.height = 0, this._onCharSizeChange = this._register(new K()), this.onCharSizeChange = this._onCharSizeChange.event;
    try {
      this._measureStrategy = this._register(new Xu(this._optionsService));
    } catch {
      this._measureStrategy = this._register(new Gu(e, t, this._optionsService));
    }
    this._register(this._optionsService.onMultipleOptionChange(["fontFamily", "fontSize"], () => this.measure()));
  }
  get hasValidSize() {
    return this.width > 0 && this.height > 0;
  }
  measure() {
    let e = this._measureStrategy.measure();
    (e.width !== this.width || e.height !== this.height) && (this.width = e.width, this.height = e.height, this._onCharSizeChange.fire());
  }
};
Jn = $e([X(2, wt)], Jn);
var kh = class extends ue {
  constructor() {
    super(...arguments), this._result = { width: 0, height: 0 };
  }
  _validateAndSet(e, t) {
    e !== void 0 && e > 0 && t !== void 0 && t > 0 && (this._result.width = e, this._result.height = t);
  }
}, Gu = class extends kh {
  constructor(e, t, s) {
    super(), this._document = e, this._parentElement = t, this._optionsService = s, this._measureElement = this._document.createElement("span"), this._measureElement.classList.add("xterm-char-measure-element"), this._measureElement.textContent = "W".repeat(32), this._measureElement.setAttribute("aria-hidden", "true"), this._measureElement.style.whiteSpace = "pre", this._measureElement.style.fontKerning = "none", this._parentElement.appendChild(this._measureElement);
  }
  measure() {
    return this._measureElement.style.fontFamily = this._optionsService.rawOptions.fontFamily, this._measureElement.style.fontSize = `${this._optionsService.rawOptions.fontSize}px`, this._validateAndSet(Number(this._measureElement.offsetWidth) / 32, Number(this._measureElement.offsetHeight)), this._result;
  }
}, Xu = class extends kh {
  constructor(e) {
    super(), this._optionsService = e, this._canvas = new OffscreenCanvas(100, 100), this._ctx = this._canvas.getContext("2d");
    let t = this._ctx.measureText("W");
    if (!("width" in t && "fontBoundingBoxAscent" in t && "fontBoundingBoxDescent" in t)) throw new Error("Required font metrics not supported");
  }
  measure() {
    this._ctx.font = `${this._optionsService.rawOptions.fontSize}px ${this._optionsService.rawOptions.fontFamily}`;
    let e = this._ctx.measureText("W");
    return this._validateAndSet(e.width, e.fontBoundingBoxAscent + e.fontBoundingBoxDescent), this._result;
  }
}, Zu = class extends ue {
  constructor(e, t, s) {
    super(), this._textarea = e, this._window = t, this.mainDocument = s, this._isFocused = !1, this._cachedIsFocused = void 0, this._screenDprMonitor = this._register(new Ju(this._window)), this._onDprChange = this._register(new K()), this.onDprChange = this._onDprChange.event, this._onWindowChange = this._register(new K()), this.onWindowChange = this._onWindowChange.event, this._register(this.onWindowChange((r) => this._screenDprMonitor.setWindow(r))), this._register(ot.forward(this._screenDprMonitor.onDprChange, this._onDprChange)), this._register(oe(this._textarea, "focus", () => this._isFocused = !0)), this._register(oe(this._textarea, "blur", () => this._isFocused = !1));
  }
  get window() {
    return this._window;
  }
  set window(e) {
    this._window !== e && (this._window = e, this._onWindowChange.fire(this._window));
  }
  get dpr() {
    return this.window.devicePixelRatio;
  }
  get isFocused() {
    return this._cachedIsFocused === void 0 && (this._cachedIsFocused = this._isFocused && this._textarea.ownerDocument.hasFocus(), queueMicrotask(() => this._cachedIsFocused = void 0)), this._cachedIsFocused;
  }
}, Ju = class extends ue {
  constructor(e) {
    super(), this._parentWindow = e, this._windowResizeListener = this._register(new gs()), this._onDprChange = this._register(new K()), this.onDprChange = this._onDprChange.event, this._outerListener = () => this._setDprAndFireIfDiffers(), this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio, this._updateDpr(), this._setWindowResizeListener(), this._register(Ae(() => this.clearListener()));
  }
  setWindow(e) {
    this._parentWindow = e, this._setWindowResizeListener(), this._setDprAndFireIfDiffers();
  }
  _setWindowResizeListener() {
    this._windowResizeListener.value = oe(this._parentWindow, "resize", () => this._setDprAndFireIfDiffers());
  }
  _setDprAndFireIfDiffers() {
    this._parentWindow.devicePixelRatio !== this._currentDevicePixelRatio && this._onDprChange.fire(this._parentWindow.devicePixelRatio), this._updateDpr();
  }
  _updateDpr() {
    var e;
    this._outerListener && ((e = this._resolutionMediaMatchList) == null || e.removeListener(this._outerListener), this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio, this._resolutionMediaMatchList = this._parentWindow.matchMedia(`screen and (resolution: ${this._parentWindow.devicePixelRatio}dppx)`), this._resolutionMediaMatchList.addListener(this._outerListener));
  }
  clearListener() {
    !this._resolutionMediaMatchList || !this._outerListener || (this._resolutionMediaMatchList.removeListener(this._outerListener), this._resolutionMediaMatchList = void 0, this._outerListener = void 0);
  }
}, Qu = class extends ue {
  constructor() {
    super(), this.linkProviders = [], this._register(Ae(() => this.linkProviders.length = 0));
  }
  registerLinkProvider(e) {
    return this.linkProviders.push(e), { dispose: () => {
      let t = this.linkProviders.indexOf(e);
      t !== -1 && this.linkProviders.splice(t, 1);
    } };
  }
};
function Ao(e, t, s) {
  let r = s.getBoundingClientRect(), n = e.getComputedStyle(s), o = parseInt(n.getPropertyValue("padding-left")), a = parseInt(n.getPropertyValue("padding-top"));
  return [t.clientX - r.left - o, t.clientY - r.top - a];
}
function e_(e, t, s, r, n, o, a, l, c) {
  if (!o) return;
  let h = Ao(e, t, s);
  if (h) return h[0] = Math.ceil((h[0] + (c ? a / 2 : 0)) / a), h[1] = Math.ceil(h[1] / l), h[0] = Math.min(Math.max(h[0], 1), r + (c ? 1 : 0)), h[1] = Math.min(Math.max(h[1], 1), n), h;
}
var Qn = class {
  constructor(e, t) {
    this._renderService = e, this._charSizeService = t;
  }
  getCoords(e, t, s, r, n) {
    return e_(window, e, t, s, r, this._charSizeService.hasValidSize, this._renderService.dimensions.css.cell.width, this._renderService.dimensions.css.cell.height, n);
  }
  getMouseReportCoords(e, t) {
    let s = Ao(window, e, t);
    if (this._charSizeService.hasValidSize) return s[0] = Math.min(Math.max(s[0], 0), this._renderService.dimensions.css.canvas.width - 1), s[1] = Math.min(Math.max(s[1], 0), this._renderService.dimensions.css.canvas.height - 1), { col: Math.floor(s[0] / this._renderService.dimensions.css.cell.width), row: Math.floor(s[1] / this._renderService.dimensions.css.cell.height), x: Math.floor(s[0]), y: Math.floor(s[1]) };
  }
};
Qn = $e([X(0, ui), X(1, Pr)], Qn);
var t_ = class {
  constructor(e, t) {
    this._renderCallback = e, this._coreBrowserService = t, this._refreshCallbacks = [];
  }
  dispose() {
    this._animationFrame && (this._coreBrowserService.window.cancelAnimationFrame(this._animationFrame), this._animationFrame = void 0);
  }
  addRefreshCallback(e) {
    return this._refreshCallbacks.push(e), this._animationFrame || (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._innerRefresh())), this._animationFrame;
  }
  refresh(e, t, s) {
    this._rowCount = s, e = e !== void 0 ? e : 0, t = t !== void 0 ? t : this._rowCount - 1, this._rowStart = this._rowStart !== void 0 ? Math.min(this._rowStart, e) : e, this._rowEnd = this._rowEnd !== void 0 ? Math.max(this._rowEnd, t) : t, !this._animationFrame && (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._innerRefresh()));
  }
  _innerRefresh() {
    if (this._animationFrame = void 0, this._rowStart === void 0 || this._rowEnd === void 0 || this._rowCount === void 0) {
      this._runRefreshCallbacks();
      return;
    }
    let e = Math.max(this._rowStart, 0), t = Math.min(this._rowEnd, this._rowCount - 1);
    this._rowStart = void 0, this._rowEnd = void 0, this._renderCallback(e, t), this._runRefreshCallbacks();
  }
  _runRefreshCallbacks() {
    for (let e of this._refreshCallbacks) e(0);
    this._refreshCallbacks = [];
  }
}, Lh = {};
gd(Lh, { getSafariVersion: () => s_, isChromeOS: () => Rh, isFirefox: () => Mh, isIpad: () => r_, isIphone: () => n_, isLegacyEdge: () => i_, isLinux: () => No, isMac: () => kr, isNode: () => Ar, isSafari: () => Eh, isWindows: () => Dh });
var Ar = typeof process < "u" && "title" in process, Gs = Ar ? "node" : navigator.userAgent, Xs = Ar ? "node" : navigator.platform, Mh = Gs.includes("Firefox"), i_ = Gs.includes("Edge"), Eh = /^((?!chrome|android).)*safari/i.test(Gs);
function s_() {
  if (!Eh) return 0;
  let e = Gs.match(/Version\/(\d+)/);
  return e === null || e.length < 2 ? 0 : parseInt(e[1]);
}
var kr = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"].includes(Xs), r_ = Xs === "iPad", n_ = Xs === "iPhone", Dh = ["Windows", "Win16", "Win32", "WinCE"].includes(Xs), No = Xs.indexOf("Linux") >= 0, Rh = /\bCrOS\b/.test(Gs), Th = class {
  constructor() {
    this._tasks = [], this._i = 0;
  }
  enqueue(e) {
    this._tasks.push(e), this._start();
  }
  flush() {
    for (; this._i < this._tasks.length; ) this._tasks[this._i]() || this._i++;
    this.clear();
  }
  clear() {
    this._idleCallback && (this._cancelCallback(this._idleCallback), this._idleCallback = void 0), this._i = 0, this._tasks.length = 0;
  }
  _start() {
    this._idleCallback || (this._idleCallback = this._requestCallback(this._process.bind(this)));
  }
  _process(e) {
    this._idleCallback = void 0;
    let t = 0, s = 0, r = e.timeRemaining(), n = 0;
    for (; this._i < this._tasks.length; ) {
      if (t = performance.now(), this._tasks[this._i]() || this._i++, t = Math.max(1, performance.now() - t), s = Math.max(t, s), n = e.timeRemaining(), s * 1.5 > n) {
        r - t < -20 && console.warn(`task queue exceeded allotted deadline by ${Math.abs(Math.round(r - t))}ms`), this._start();
        return;
      }
      r = n;
    }
    this.clear();
  }
}, o_ = class extends Th {
  _requestCallback(e) {
    return setTimeout(() => e(this._createDeadline(16)));
  }
  _cancelCallback(e) {
    clearTimeout(e);
  }
  _createDeadline(e) {
    let t = performance.now() + e;
    return { timeRemaining: () => Math.max(0, t - performance.now()) };
  }
}, a_ = class extends Th {
  _requestCallback(e) {
    return requestIdleCallback(e);
  }
  _cancelCallback(e) {
    cancelIdleCallback(e);
  }
}, Lr = !Ar && "requestIdleCallback" in window ? a_ : o_, l_ = class {
  constructor() {
    this._queue = new Lr();
  }
  set(e) {
    this._queue.clear(), this._queue.enqueue(e);
  }
  flush() {
    this._queue.flush();
  }
}, eo = class extends ue {
  constructor(e, t, s, r, n, o, a, l, c) {
    super(), this._rowCount = e, this._optionsService = s, this._charSizeService = r, this._coreService = n, this._coreBrowserService = l, this._renderer = this._register(new gs()), this._pausedResizeTask = new l_(), this._observerDisposable = this._register(new gs()), this._isPaused = !1, this._needsFullRefresh = !1, this._isNextRenderRedrawOnly = !0, this._needsSelectionRefresh = !1, this._canvasWidth = 0, this._canvasHeight = 0, this._selectionState = { start: void 0, end: void 0, columnSelectMode: !1 }, this._onDimensionsChange = this._register(new K()), this.onDimensionsChange = this._onDimensionsChange.event, this._onRenderedViewportChange = this._register(new K()), this.onRenderedViewportChange = this._onRenderedViewportChange.event, this._onRender = this._register(new K()), this.onRender = this._onRender.event, this._onRefreshRequest = this._register(new K()), this.onRefreshRequest = this._onRefreshRequest.event, this._renderDebouncer = new t_((h, d) => this._renderRows(h, d), this._coreBrowserService), this._register(this._renderDebouncer), this._syncOutputHandler = new h_(this._coreBrowserService, this._coreService, () => this._fullRefresh()), this._register(Ae(() => this._syncOutputHandler.dispose())), this._register(this._coreBrowserService.onDprChange(() => this.handleDevicePixelRatioChange())), this._register(a.onResize(() => this._fullRefresh())), this._register(a.buffers.onBufferActivate(() => {
      var h;
      return (h = this._renderer.value) == null ? void 0 : h.clear();
    })), this._register(this._optionsService.onOptionChange(() => this._handleOptionsChanged())), this._register(this._charSizeService.onCharSizeChange(() => this.handleCharSizeChanged())), this._register(o.onDecorationRegistered(() => this._fullRefresh())), this._register(o.onDecorationRemoved(() => this._fullRefresh())), this._register(this._optionsService.onMultipleOptionChange(["customGlyphs", "drawBoldTextInBrightColors", "letterSpacing", "lineHeight", "fontFamily", "fontSize", "fontWeight", "fontWeightBold", "minimumContrastRatio", "rescaleOverlappingGlyphs"], () => {
      this.clear(), this.handleResize(a.cols, a.rows), this._fullRefresh();
    })), this._register(this._optionsService.onMultipleOptionChange(["cursorBlink", "cursorStyle"], () => this.refreshRows(a.buffer.y, a.buffer.y, !0))), this._register(c.onChangeColors(() => this._fullRefresh())), this._registerIntersectionObserver(this._coreBrowserService.window, t), this._register(this._coreBrowserService.onWindowChange((h) => this._registerIntersectionObserver(h, t)));
  }
  get dimensions() {
    return this._renderer.value.dimensions;
  }
  _registerIntersectionObserver(e, t) {
    if ("IntersectionObserver" in e) {
      let s = new e.IntersectionObserver((r) => this._handleIntersectionChange(r[r.length - 1]), { threshold: 0 });
      s.observe(t), this._observerDisposable.value = Ae(() => s.disconnect());
    }
  }
  _handleIntersectionChange(e) {
    this._isPaused = e.isIntersecting === void 0 ? e.intersectionRatio === 0 : !e.isIntersecting, !this._isPaused && !this._charSizeService.hasValidSize && this._charSizeService.measure(), !this._isPaused && this._needsFullRefresh && (this._pausedResizeTask.flush(), this.refreshRows(0, this._rowCount - 1), this._needsFullRefresh = !1);
  }
  refreshRows(e, t, s = !1) {
    if (this._isPaused) {
      this._needsFullRefresh = !0;
      return;
    }
    if (this._coreService.decPrivateModes.synchronizedOutput) {
      this._syncOutputHandler.bufferRows(e, t);
      return;
    }
    let r = this._syncOutputHandler.flush();
    r && (e = Math.min(e, r.start), t = Math.max(t, r.end)), s || (this._isNextRenderRedrawOnly = !1), this._renderDebouncer.refresh(e, t, this._rowCount);
  }
  _renderRows(e, t) {
    if (this._renderer.value) {
      if (this._coreService.decPrivateModes.synchronizedOutput) {
        this._syncOutputHandler.bufferRows(e, t);
        return;
      }
      e = Math.min(e, this._rowCount - 1), t = Math.min(t, this._rowCount - 1), this._renderer.value.renderRows(e, t), this._needsSelectionRefresh && (this._renderer.value.handleSelectionChanged(this._selectionState.start, this._selectionState.end, this._selectionState.columnSelectMode), this._needsSelectionRefresh = !1), this._isNextRenderRedrawOnly || this._onRenderedViewportChange.fire({ start: e, end: t }), this._onRender.fire({ start: e, end: t }), this._isNextRenderRedrawOnly = !0;
    }
  }
  resize(e, t) {
    this._rowCount = t, this._fireOnCanvasResize();
  }
  _handleOptionsChanged() {
    this._renderer.value && (this.refreshRows(0, this._rowCount - 1), this._fireOnCanvasResize());
  }
  _fireOnCanvasResize() {
    this._renderer.value && (this._renderer.value.dimensions.css.canvas.width === this._canvasWidth && this._renderer.value.dimensions.css.canvas.height === this._canvasHeight || this._onDimensionsChange.fire(this._renderer.value.dimensions));
  }
  hasRenderer() {
    return !!this._renderer.value;
  }
  setRenderer(e) {
    this._renderer.value = e, this._renderer.value && (this._renderer.value.onRequestRedraw((t) => this.refreshRows(t.start, t.end, !0)), this._needsSelectionRefresh = !0, this._fullRefresh());
  }
  addRefreshCallback(e) {
    return this._renderDebouncer.addRefreshCallback(e);
  }
  _fullRefresh() {
    this._isPaused ? this._needsFullRefresh = !0 : this.refreshRows(0, this._rowCount - 1);
  }
  clearTextureAtlas() {
    var e, t;
    this._renderer.value && ((t = (e = this._renderer.value).clearTextureAtlas) == null || t.call(e), this._fullRefresh());
  }
  handleDevicePixelRatioChange() {
    this._charSizeService.measure(), this._renderer.value && (this._renderer.value.handleDevicePixelRatioChange(), this.refreshRows(0, this._rowCount - 1));
  }
  handleResize(e, t) {
    this._renderer.value && (this._isPaused ? this._pausedResizeTask.set(() => {
      var s;
      return (s = this._renderer.value) == null ? void 0 : s.handleResize(e, t);
    }) : this._renderer.value.handleResize(e, t), this._fullRefresh());
  }
  handleCharSizeChanged() {
    var e;
    (e = this._renderer.value) == null || e.handleCharSizeChanged();
  }
  handleBlur() {
    var e;
    (e = this._renderer.value) == null || e.handleBlur();
  }
  handleFocus() {
    var e;
    (e = this._renderer.value) == null || e.handleFocus();
  }
  handleSelectionChanged(e, t, s) {
    var r;
    this._selectionState.start = e, this._selectionState.end = t, this._selectionState.columnSelectMode = s, (r = this._renderer.value) == null || r.handleSelectionChanged(e, t, s);
  }
  handleCursorMove() {
    var e;
    (e = this._renderer.value) == null || e.handleCursorMove();
  }
  clear() {
    var e;
    (e = this._renderer.value) == null || e.clear();
  }
};
eo = $e([X(2, wt), X(3, Pr), X(4, Gi), X(5, js), X(6, mt), X(7, di), X(8, vs)], eo);
var h_ = class {
  constructor(e, t, s) {
    this._coreBrowserService = e, this._coreService = t, this._onTimeout = s, this._start = 0, this._end = 0, this._isBuffering = !1;
  }
  bufferRows(e, t) {
    this._isBuffering ? (this._start = Math.min(this._start, e), this._end = Math.max(this._end, t)) : (this._start = e, this._end = t, this._isBuffering = !0), this._timeout === void 0 && (this._timeout = this._coreBrowserService.window.setTimeout(() => {
      this._timeout = void 0, this._coreService.decPrivateModes.synchronizedOutput = !1, this._onTimeout();
    }, 1e3));
  }
  flush() {
    if (this._timeout !== void 0 && (this._coreBrowserService.window.clearTimeout(this._timeout), this._timeout = void 0), !this._isBuffering) return;
    let e = { start: this._start, end: this._end };
    return this._isBuffering = !1, e;
  }
  dispose() {
    this._timeout !== void 0 && (this._coreBrowserService.window.clearTimeout(this._timeout), this._timeout = void 0);
  }
};
function c_(e, t, s, r) {
  let n = s.buffer.x, o = s.buffer.y;
  if (!s.buffer.hasScrollback) return __(n, o, e, t, s, r) + Nr(o, t, s, r) + f_(n, o, e, t, s, r);
  let a;
  if (o === t) return a = n > e ? "D" : "C", Ks(Math.abs(n - e), Us(a, r));
  a = o > t ? "D" : "C";
  let l = Math.abs(o - t), c = u_(o > t ? e : n, s) + (l - 1) * s.cols + 1 + d_(o > t ? n : e);
  return Ks(c, Us(a, r));
}
function d_(e, t) {
  return e - 1;
}
function u_(e, t) {
  return t.cols - e;
}
function __(e, t, s, r, n, o) {
  return Nr(t, r, n, o).length === 0 ? "" : Ks(Ph(e, t, e, t - ji(t, n), !1, n).length, Us("D", o));
}
function Nr(e, t, s, r) {
  let n = e - ji(e, s), o = t - ji(t, s), a = Math.abs(n - o) - p_(e, t, s);
  return Ks(a, Us(Bh(e, t), r));
}
function f_(e, t, s, r, n, o) {
  let a;
  Nr(t, r, n, o).length > 0 ? a = r - ji(r, n) : a = t;
  let l = r, c = g_(e, t, s, r, n, o);
  return Ks(Ph(e, a, s, l, c === "C", n).length, Us(c, o));
}
function p_(e, t, s) {
  var r;
  let n = 0, o = e - ji(e, s), a = t - ji(t, s);
  for (let l = 0; l < Math.abs(o - a); l++) {
    let c = Bh(e, t) === "A" ? -1 : 1;
    (r = s.buffer.lines.get(o + c * l)) != null && r.isWrapped && n++;
  }
  return n;
}
function ji(e, t) {
  let s = 0, r = t.buffer.lines.get(e), n = r == null ? void 0 : r.isWrapped;
  for (; n && e >= 0 && e < t.rows; ) s++, r = t.buffer.lines.get(--e), n = r == null ? void 0 : r.isWrapped;
  return s;
}
function g_(e, t, s, r, n, o) {
  let a;
  return Nr(s, r, n, o).length > 0 ? a = r - ji(r, n) : a = t, e < s && a <= r || e >= s && a < r ? "C" : "D";
}
function Bh(e, t) {
  return e > t ? "A" : "B";
}
function Ph(e, t, s, r, n, o) {
  let a = e, l = t, c = "";
  for (; (a !== s || l !== r) && l >= 0 && l < o.buffer.lines.length; ) a += n ? 1 : -1, n && a > o.cols - 1 ? (c += o.buffer.translateBufferLineToString(l, !1, e, a), a = 0, e = 0, l++) : !n && a < 0 && (c += o.buffer.translateBufferLineToString(l, !1, 0, e + 1), a = o.cols - 1, e = a, l--);
  return c + o.buffer.translateBufferLineToString(l, !1, e, a);
}
function Us(e, t) {
  let s = t ? "O" : "[";
  return O.ESC + s + e;
}
function Ks(e, t) {
  e = Math.floor(e);
  let s = "";
  for (let r = 0; r < e; r++) s += t;
  return s;
}
var v_ = class {
  constructor(e) {
    this._bufferService = e, this.isSelectAllActive = !1, this.selectionStartLength = 0;
  }
  clearSelection() {
    this.selectionStart = void 0, this.selectionEnd = void 0, this.isSelectAllActive = !1, this.selectionStartLength = 0;
  }
  get finalSelectionStart() {
    return this.isSelectAllActive ? [0, 0] : !this.selectionEnd || !this.selectionStart ? this.selectionStart : this.areSelectionValuesReversed() ? this.selectionEnd : this.selectionStart;
  }
  get finalSelectionEnd() {
    if (this.isSelectAllActive) return [this._bufferService.cols, this._bufferService.buffer.ybase + this._bufferService.rows - 1];
    if (this.selectionStart) {
      if (!this.selectionEnd || this.areSelectionValuesReversed()) {
        let e = this.selectionStart[0] + this.selectionStartLength;
        return e > this._bufferService.cols ? e % this._bufferService.cols === 0 ? [this._bufferService.cols, this.selectionStart[1] + Math.floor(e / this._bufferService.cols) - 1] : [e % this._bufferService.cols, this.selectionStart[1] + Math.floor(e / this._bufferService.cols)] : [e, this.selectionStart[1]];
      }
      if (this.selectionStartLength && this.selectionEnd[1] === this.selectionStart[1]) {
        let e = this.selectionStart[0] + this.selectionStartLength;
        return e > this._bufferService.cols ? [e % this._bufferService.cols, this.selectionStart[1] + Math.floor(e / this._bufferService.cols)] : [Math.max(e, this.selectionEnd[0]), this.selectionEnd[1]];
      }
      return this.selectionEnd;
    }
  }
  areSelectionValuesReversed() {
    let e = this.selectionStart, t = this.selectionEnd;
    return !e || !t ? !1 : e[1] > t[1] || e[1] === t[1] && e[0] > t[0];
  }
  handleTrim(e) {
    return this.selectionStart && (this.selectionStart[1] -= e), this.selectionEnd && (this.selectionEnd[1] -= e), this.selectionEnd && this.selectionEnd[1] < 0 ? (this.clearSelection(), !0) : (this.selectionStart && this.selectionStart[1] < 0 && (this.selectionStart[1] = 0), !1);
  }
};
function Ra(e, t) {
  if (e.start.y > e.end.y) throw new Error(`Buffer range end (${e.end.x}, ${e.end.y}) cannot be before start (${e.start.x}, ${e.start.y})`);
  return t * (e.end.y - e.start.y) + (e.end.x - e.start.x + 1);
}
var Xr = 50, m_ = 15, w_ = 50, S_ = 500, b_ = " ", y_ = new RegExp(b_, "g"), to = class extends ue {
  constructor(e, t, s, r, n, o, a, l, c) {
    super(), this._element = e, this._screenElement = t, this._linkifier = s, this._bufferService = r, this._coreService = n, this._mouseService = o, this._optionsService = a, this._renderService = l, this._coreBrowserService = c, this._dragScrollAmount = 0, this._enabled = !0, this._workCell = new Nt(), this._mouseDownTimeStamp = 0, this._oldHasSelection = !1, this._oldSelectionStart = void 0, this._oldSelectionEnd = void 0, this._onLinuxMouseSelection = this._register(new K()), this.onLinuxMouseSelection = this._onLinuxMouseSelection.event, this._onRedrawRequest = this._register(new K()), this.onRequestRedraw = this._onRedrawRequest.event, this._onSelectionChange = this._register(new K()), this.onSelectionChange = this._onSelectionChange.event, this._onRequestScrollLines = this._register(new K()), this.onRequestScrollLines = this._onRequestScrollLines.event, this._mouseMoveListener = (h) => this._handleMouseMove(h), this._mouseUpListener = (h) => this._handleMouseUp(h), this._coreService.onUserInput(() => {
      this.hasSelection && this.clearSelection();
    }), this._trimListener = this._bufferService.buffer.lines.onTrim((h) => this._handleTrim(h)), this._register(this._bufferService.buffers.onBufferActivate((h) => this._handleBufferActivate(h))), this.enable(), this._model = new v_(this._bufferService), this._activeSelectionMode = 0, this._register(Ae(() => {
      this._removeMouseDownListeners();
    })), this._register(this._bufferService.onResize((h) => {
      h.rowsChanged && this.clearSelection();
    }));
  }
  reset() {
    this.clearSelection();
  }
  disable() {
    this.clearSelection(), this._enabled = !1;
  }
  enable() {
    this._enabled = !0;
  }
  get selectionStart() {
    return this._model.finalSelectionStart;
  }
  get selectionEnd() {
    return this._model.finalSelectionEnd;
  }
  get hasSelection() {
    let e = this._model.finalSelectionStart, t = this._model.finalSelectionEnd;
    return !e || !t ? !1 : e[0] !== t[0] || e[1] !== t[1];
  }
  get selectionText() {
    let e = this._model.finalSelectionStart, t = this._model.finalSelectionEnd;
    if (!e || !t) return "";
    let s = this._bufferService.buffer, r = [];
    if (this._activeSelectionMode === 3) {
      if (e[0] === t[0]) return "";
      let n = e[0] < t[0] ? e[0] : t[0], o = e[0] < t[0] ? t[0] : e[0];
      for (let a = e[1]; a <= t[1]; a++) {
        let l = s.translateBufferLineToString(a, !0, n, o);
        r.push(l);
      }
    } else {
      let n = e[1] === t[1] ? t[0] : void 0;
      r.push(s.translateBufferLineToString(e[1], !0, e[0], n));
      for (let o = e[1] + 1; o <= t[1] - 1; o++) {
        let a = s.lines.get(o), l = s.translateBufferLineToString(o, !0);
        a != null && a.isWrapped ? r[r.length - 1] += l : r.push(l);
      }
      if (e[1] !== t[1]) {
        let o = s.lines.get(t[1]), a = s.translateBufferLineToString(t[1], !0, 0, t[0]);
        o && o.isWrapped ? r[r.length - 1] += a : r.push(a);
      }
    }
    return r.map((n) => n.replace(y_, " ")).join(Dh ? `\r
` : `
`);
  }
  clearSelection() {
    this._model.clearSelection(), this._removeMouseDownListeners(), this.refresh(), this._onSelectionChange.fire();
  }
  refresh(e) {
    this._refreshAnimationFrame || (this._refreshAnimationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._refresh())), No && e && this.selectionText.length && this._onLinuxMouseSelection.fire(this.selectionText);
  }
  _refresh() {
    this._refreshAnimationFrame = void 0, this._onRedrawRequest.fire({ start: this._model.finalSelectionStart, end: this._model.finalSelectionEnd, columnSelectMode: this._activeSelectionMode === 3 });
  }
  _isClickInSelection(e) {
    let t = this._getMouseBufferCoords(e), s = this._model.finalSelectionStart, r = this._model.finalSelectionEnd;
    return !s || !r || !t ? !1 : this._areCoordsInSelection(t, s, r);
  }
  isCellInSelection(e, t) {
    let s = this._model.finalSelectionStart, r = this._model.finalSelectionEnd;
    return !s || !r ? !1 : this._areCoordsInSelection([e, t], s, r);
  }
  _areCoordsInSelection(e, t, s) {
    return e[1] > t[1] && e[1] < s[1] || t[1] === s[1] && e[1] === t[1] && e[0] >= t[0] && e[0] < s[0] || t[1] < s[1] && e[1] === s[1] && e[0] < s[0] || t[1] < s[1] && e[1] === t[1] && e[0] >= t[0];
  }
  _selectWordAtCursor(e, t) {
    var s, r;
    let n = (r = (s = this._linkifier.currentLink) == null ? void 0 : s.link) == null ? void 0 : r.range;
    if (n) return this._model.selectionStart = [n.start.x - 1, n.start.y - 1], this._model.selectionStartLength = Ra(n, this._bufferService.cols), this._model.selectionEnd = void 0, !0;
    let o = this._getMouseBufferCoords(e);
    return o ? (this._selectWordAt(o, t), this._model.selectionEnd = void 0, !0) : !1;
  }
  selectAll() {
    this._model.isSelectAllActive = !0, this.refresh(), this._onSelectionChange.fire();
  }
  selectLines(e, t) {
    this._model.clearSelection(), e = Math.max(e, 0), t = Math.min(t, this._bufferService.buffer.lines.length - 1), this._model.selectionStart = [0, e], this._model.selectionEnd = [this._bufferService.cols, t], this.refresh(), this._onSelectionChange.fire();
  }
  _handleTrim(e) {
    this._model.handleTrim(e) && this.refresh();
  }
  _getMouseBufferCoords(e) {
    let t = this._mouseService.getCoords(e, this._screenElement, this._bufferService.cols, this._bufferService.rows, !0);
    if (t) return t[0]--, t[1]--, t[1] += this._bufferService.buffer.ydisp, t;
  }
  _getMouseEventScrollAmount(e) {
    let t = Ao(this._coreBrowserService.window, e, this._screenElement)[1], s = this._renderService.dimensions.css.canvas.height;
    return t >= 0 && t <= s ? 0 : (t > s && (t -= s), t = Math.min(Math.max(t, -Xr), Xr), t /= Xr, t / Math.abs(t) + Math.round(t * (m_ - 1)));
  }
  shouldForceSelection(e) {
    return kr ? e.altKey && this._optionsService.rawOptions.macOptionClickForcesSelection : e.shiftKey;
  }
  handleMouseDown(e) {
    if (this._mouseDownTimeStamp = e.timeStamp, !(e.button === 2 && this.hasSelection) && e.button === 0) {
      if (!this._enabled) {
        if (!this.shouldForceSelection(e)) return;
        e.stopPropagation();
      }
      e.preventDefault(), this._dragScrollAmount = 0, this._enabled && e.shiftKey ? this._handleIncrementalClick(e) : e.detail === 1 ? this._handleSingleClick(e) : e.detail === 2 ? this._handleDoubleClick(e) : e.detail === 3 && this._handleTripleClick(e), this._addMouseDownListeners(), this.refresh(!0);
    }
  }
  _addMouseDownListeners() {
    this._screenElement.ownerDocument && (this._screenElement.ownerDocument.addEventListener("mousemove", this._mouseMoveListener), this._screenElement.ownerDocument.addEventListener("mouseup", this._mouseUpListener)), this._dragScrollIntervalTimer = this._coreBrowserService.window.setInterval(() => this._dragScroll(), w_);
  }
  _removeMouseDownListeners() {
    this._screenElement.ownerDocument && (this._screenElement.ownerDocument.removeEventListener("mousemove", this._mouseMoveListener), this._screenElement.ownerDocument.removeEventListener("mouseup", this._mouseUpListener)), this._coreBrowserService.window.clearInterval(this._dragScrollIntervalTimer), this._dragScrollIntervalTimer = void 0;
  }
  _handleIncrementalClick(e) {
    this._model.selectionStart && (this._model.selectionEnd = this._getMouseBufferCoords(e));
  }
  _handleSingleClick(e) {
    if (this._model.selectionStartLength = 0, this._model.isSelectAllActive = !1, this._activeSelectionMode = this.shouldColumnSelect(e) ? 3 : 0, this._model.selectionStart = this._getMouseBufferCoords(e), !this._model.selectionStart) return;
    this._model.selectionEnd = void 0;
    let t = this._bufferService.buffer.lines.get(this._model.selectionStart[1]);
    t && t.length !== this._model.selectionStart[0] && t.hasWidth(this._model.selectionStart[0]) === 0 && this._model.selectionStart[0]++;
  }
  _handleDoubleClick(e) {
    this._selectWordAtCursor(e, !0) && (this._activeSelectionMode = 1);
  }
  _handleTripleClick(e) {
    let t = this._getMouseBufferCoords(e);
    t && (this._activeSelectionMode = 2, this._selectLineAt(t[1]));
  }
  shouldColumnSelect(e) {
    return e.altKey && !(kr && this._optionsService.rawOptions.macOptionClickForcesSelection);
  }
  _handleMouseMove(e) {
    if (e.stopImmediatePropagation(), !this._model.selectionStart) return;
    let t = this._model.selectionEnd ? [this._model.selectionEnd[0], this._model.selectionEnd[1]] : null;
    if (this._model.selectionEnd = this._getMouseBufferCoords(e), !this._model.selectionEnd) {
      this.refresh(!0);
      return;
    }
    this._activeSelectionMode === 2 ? this._model.selectionEnd[1] < this._model.selectionStart[1] ? this._model.selectionEnd[0] = 0 : this._model.selectionEnd[0] = this._bufferService.cols : this._activeSelectionMode === 1 && this._selectToWordAt(this._model.selectionEnd), this._dragScrollAmount = this._getMouseEventScrollAmount(e), this._activeSelectionMode !== 3 && (this._dragScrollAmount > 0 ? this._model.selectionEnd[0] = this._bufferService.cols : this._dragScrollAmount < 0 && (this._model.selectionEnd[0] = 0));
    let s = this._bufferService.buffer;
    if (this._model.selectionEnd[1] < s.lines.length) {
      let r = s.lines.get(this._model.selectionEnd[1]);
      r && r.hasWidth(this._model.selectionEnd[0]) === 0 && this._model.selectionEnd[0] < this._bufferService.cols && this._model.selectionEnd[0]++;
    }
    (!t || t[0] !== this._model.selectionEnd[0] || t[1] !== this._model.selectionEnd[1]) && this.refresh(!0);
  }
  _dragScroll() {
    if (!(!this._model.selectionEnd || !this._model.selectionStart) && this._dragScrollAmount) {
      this._onRequestScrollLines.fire({ amount: this._dragScrollAmount, suppressScrollEvent: !1 });
      let e = this._bufferService.buffer;
      this._dragScrollAmount > 0 ? (this._activeSelectionMode !== 3 && (this._model.selectionEnd[0] = this._bufferService.cols), this._model.selectionEnd[1] = Math.min(e.ydisp + this._bufferService.rows, e.lines.length - 1)) : (this._activeSelectionMode !== 3 && (this._model.selectionEnd[0] = 0), this._model.selectionEnd[1] = e.ydisp), this.refresh();
    }
  }
  _handleMouseUp(e) {
    let t = e.timeStamp - this._mouseDownTimeStamp;
    if (this._removeMouseDownListeners(), this.selectionText.length <= 1 && t < S_ && e.altKey && this._optionsService.rawOptions.altClickMovesCursor) {
      if (this._bufferService.buffer.ybase === this._bufferService.buffer.ydisp) {
        let s = this._mouseService.getCoords(e, this._element, this._bufferService.cols, this._bufferService.rows, !1);
        if (s && s[0] !== void 0 && s[1] !== void 0) {
          let r = c_(s[0] - 1, s[1] - 1, this._bufferService, this._coreService.decPrivateModes.applicationCursorKeys);
          this._coreService.triggerDataEvent(r, !0);
        }
      }
    } else this._fireEventIfSelectionChanged();
  }
  _fireEventIfSelectionChanged() {
    let e = this._model.finalSelectionStart, t = this._model.finalSelectionEnd, s = !!e && !!t && (e[0] !== t[0] || e[1] !== t[1]);
    if (!s) {
      this._oldHasSelection && this._fireOnSelectionChange(e, t, s);
      return;
    }
    !e || !t || (!this._oldSelectionStart || !this._oldSelectionEnd || e[0] !== this._oldSelectionStart[0] || e[1] !== this._oldSelectionStart[1] || t[0] !== this._oldSelectionEnd[0] || t[1] !== this._oldSelectionEnd[1]) && this._fireOnSelectionChange(e, t, s);
  }
  _fireOnSelectionChange(e, t, s) {
    this._oldSelectionStart = e, this._oldSelectionEnd = t, this._oldHasSelection = s, this._onSelectionChange.fire();
  }
  _handleBufferActivate(e) {
    this.clearSelection(), this._trimListener.dispose(), this._trimListener = e.activeBuffer.lines.onTrim((t) => this._handleTrim(t));
  }
  _convertViewportColToCharacterIndex(e, t) {
    let s = t;
    for (let r = 0; t >= r; r++) {
      let n = e.loadCell(r, this._workCell).getChars().length;
      this._workCell.getWidth() === 0 ? s-- : n > 1 && t !== r && (s += n - 1);
    }
    return s;
  }
  setSelection(e, t, s) {
    this._model.clearSelection(), this._removeMouseDownListeners(), this._model.selectionStart = [e, t], this._model.selectionStartLength = s, this.refresh(), this._fireEventIfSelectionChanged();
  }
  rightClickSelect(e) {
    this._isClickInSelection(e) || (this._selectWordAtCursor(e, !1) && this.refresh(!0), this._fireEventIfSelectionChanged());
  }
  _getWordAt(e, t, s = !0, r = !0) {
    if (e[0] >= this._bufferService.cols) return;
    let n = this._bufferService.buffer, o = n.lines.get(e[1]);
    if (!o) return;
    let a = n.translateBufferLineToString(e[1], !1), l = this._convertViewportColToCharacterIndex(o, e[0]), c = l, h = e[0] - l, d = 0, u = 0, f = 0, _ = 0;
    if (a.charAt(l) === " ") {
      for (; l > 0 && a.charAt(l - 1) === " "; ) l--;
      for (; c < a.length && a.charAt(c + 1) === " "; ) c++;
    } else {
      let D = e[0], R = e[0];
      o.getWidth(D) === 0 && (d++, D--), o.getWidth(R) === 2 && (u++, R++);
      let H = o.getString(R).length;
      for (H > 1 && (_ += H - 1, c += H - 1); D > 0 && l > 0 && !this._isCharWordSeparator(o.loadCell(D - 1, this._workCell)); ) {
        o.loadCell(D - 1, this._workCell);
        let M = this._workCell.getChars().length;
        this._workCell.getWidth() === 0 ? (d++, D--) : M > 1 && (f += M - 1, l -= M - 1), l--, D--;
      }
      for (; R < o.length && c + 1 < a.length && !this._isCharWordSeparator(o.loadCell(R + 1, this._workCell)); ) {
        o.loadCell(R + 1, this._workCell);
        let M = this._workCell.getChars().length;
        this._workCell.getWidth() === 2 ? (u++, R++) : M > 1 && (_ += M - 1, c += M - 1), c++, R++;
      }
    }
    c++;
    let g = l + h - d + f, y = Math.min(this._bufferService.cols, c - l + d + u - f - _);
    if (!(!t && a.slice(l, c).trim() === "")) {
      if (s && g === 0 && o.getCodePoint(0) !== 32) {
        let D = n.lines.get(e[1] - 1);
        if (D && o.isWrapped && D.getCodePoint(this._bufferService.cols - 1) !== 32) {
          let R = this._getWordAt([this._bufferService.cols - 1, e[1] - 1], !1, !0, !1);
          if (R) {
            let H = this._bufferService.cols - R.start;
            g -= H, y += H;
          }
        }
      }
      if (r && g + y === this._bufferService.cols && o.getCodePoint(this._bufferService.cols - 1) !== 32) {
        let D = n.lines.get(e[1] + 1);
        if (D != null && D.isWrapped && D.getCodePoint(0) !== 32) {
          let R = this._getWordAt([0, e[1] + 1], !1, !1, !0);
          R && (y += R.length);
        }
      }
      return { start: g, length: y };
    }
  }
  _selectWordAt(e, t) {
    let s = this._getWordAt(e, t);
    if (s) {
      for (; s.start < 0; ) s.start += this._bufferService.cols, e[1]--;
      this._model.selectionStart = [s.start, e[1]], this._model.selectionStartLength = s.length;
    }
  }
  _selectToWordAt(e) {
    let t = this._getWordAt(e, !0);
    if (t) {
      let s = e[1];
      for (; t.start < 0; ) t.start += this._bufferService.cols, s--;
      if (!this._model.areSelectionValuesReversed()) for (; t.start + t.length > this._bufferService.cols; ) t.length -= this._bufferService.cols, s++;
      this._model.selectionEnd = [this._model.areSelectionValuesReversed() ? t.start : t.start + t.length, s];
    }
  }
  _isCharWordSeparator(e) {
    return e.getWidth() === 0 ? !1 : this._optionsService.rawOptions.wordSeparator.indexOf(e.getChars()) >= 0;
  }
  _selectLineAt(e) {
    let t = this._bufferService.buffer.getWrappedRangeForLine(e), s = { start: { x: 0, y: t.first }, end: { x: this._bufferService.cols - 1, y: t.last } };
    this._model.selectionStart = [0, t.first], this._model.selectionEnd = void 0, this._model.selectionStartLength = Ra(s, this._bufferService.cols);
  }
};
to = $e([X(3, mt), X(4, Gi), X(5, Mo), X(6, wt), X(7, ui), X(8, di)], to);
var Ta = class {
  constructor() {
    this._data = {};
  }
  set(e, t, s) {
    this._data[e] || (this._data[e] = {}), this._data[e][t] = s;
  }
  get(e, t) {
    return this._data[e] ? this._data[e][t] : void 0;
  }
  clear() {
    this._data = {};
  }
}, Ba = class {
  constructor() {
    this._color = new Ta(), this._css = new Ta();
  }
  setCss(e, t, s) {
    this._css.set(e, t, s);
  }
  getCss(e, t) {
    return this._css.get(e, t);
  }
  setColor(e, t, s) {
    this._color.set(e, t, s);
  }
  getColor(e, t) {
    return this._color.get(e, t);
  }
  clear() {
    this._color.clear(), this._css.clear();
  }
}, qe = Object.freeze((() => {
  let e = [Pe.toColor("#2e3436"), Pe.toColor("#cc0000"), Pe.toColor("#4e9a06"), Pe.toColor("#c4a000"), Pe.toColor("#3465a4"), Pe.toColor("#75507b"), Pe.toColor("#06989a"), Pe.toColor("#d3d7cf"), Pe.toColor("#555753"), Pe.toColor("#ef2929"), Pe.toColor("#8ae234"), Pe.toColor("#fce94f"), Pe.toColor("#729fcf"), Pe.toColor("#ad7fa8"), Pe.toColor("#34e2e2"), Pe.toColor("#eeeeec")], t = [0, 95, 135, 175, 215, 255];
  for (let s = 0; s < 216; s++) {
    let r = t[s / 36 % 6 | 0], n = t[s / 6 % 6 | 0], o = t[s % 6];
    e.push({ css: Ue.toCss(r, n, o), rgba: Ue.toRgba(r, n, o) });
  }
  for (let s = 0; s < 24; s++) {
    let r = 8 + s * 10;
    e.push({ css: Ue.toCss(r, r, r), rgba: Ue.toRgba(r, r, r) });
  }
  return e;
})()), zi = Pe.toColor("#ffffff"), As = Pe.toColor("#000000"), Pa = Pe.toColor("#ffffff"), Aa = As, ks = { css: "rgba(255, 255, 255, 0.3)", rgba: 4294967117 }, C_ = zi, io = class extends ue {
  constructor(e) {
    super(), this._optionsService = e, this._contrastCache = new Ba(), this._halfContrastCache = new Ba(), this._onChangeColors = this._register(new K()), this.onChangeColors = this._onChangeColors.event, this._colors = { foreground: zi, background: As, cursor: Pa, cursorAccent: Aa, selectionForeground: void 0, selectionBackgroundTransparent: ks, selectionBackgroundOpaque: De.blend(As, ks), selectionInactiveBackgroundTransparent: ks, selectionInactiveBackgroundOpaque: De.blend(As, ks), scrollbarSliderBackground: De.opacity(zi, 0.2), scrollbarSliderHoverBackground: De.opacity(zi, 0.4), scrollbarSliderActiveBackground: De.opacity(zi, 0.5), overviewRulerBorder: zi, ansi: qe.slice(), contrastCache: this._contrastCache, halfContrastCache: this._halfContrastCache }, this._updateRestoreColors(), this._setTheme(this._optionsService.rawOptions.theme), this._register(this._optionsService.onSpecificOptionChange("minimumContrastRatio", () => this._contrastCache.clear())), this._register(this._optionsService.onSpecificOptionChange("theme", () => this._setTheme(this._optionsService.rawOptions.theme)));
  }
  get colors() {
    return this._colors;
  }
  _setTheme(e = {}) {
    let t = this._colors;
    if (t.foreground = Le(e.foreground, zi), t.background = Le(e.background, As), t.cursor = De.blend(t.background, Le(e.cursor, Pa)), t.cursorAccent = De.blend(t.background, Le(e.cursorAccent, Aa)), t.selectionBackgroundTransparent = Le(e.selectionBackground, ks), t.selectionBackgroundOpaque = De.blend(t.background, t.selectionBackgroundTransparent), t.selectionInactiveBackgroundTransparent = Le(e.selectionInactiveBackground, t.selectionBackgroundTransparent), t.selectionInactiveBackgroundOpaque = De.blend(t.background, t.selectionInactiveBackgroundTransparent), t.selectionForeground = e.selectionForeground ? Le(e.selectionForeground, Ma) : void 0, t.selectionForeground === Ma && (t.selectionForeground = void 0), De.isOpaque(t.selectionBackgroundTransparent) && (t.selectionBackgroundTransparent = De.opacity(t.selectionBackgroundTransparent, 0.3)), De.isOpaque(t.selectionInactiveBackgroundTransparent) && (t.selectionInactiveBackgroundTransparent = De.opacity(t.selectionInactiveBackgroundTransparent, 0.3)), t.scrollbarSliderBackground = Le(e.scrollbarSliderBackground, De.opacity(t.foreground, 0.2)), t.scrollbarSliderHoverBackground = Le(e.scrollbarSliderHoverBackground, De.opacity(t.foreground, 0.4)), t.scrollbarSliderActiveBackground = Le(e.scrollbarSliderActiveBackground, De.opacity(t.foreground, 0.5)), t.overviewRulerBorder = Le(e.overviewRulerBorder, C_), t.ansi = qe.slice(), t.ansi[0] = Le(e.black, qe[0]), t.ansi[1] = Le(e.red, qe[1]), t.ansi[2] = Le(e.green, qe[2]), t.ansi[3] = Le(e.yellow, qe[3]), t.ansi[4] = Le(e.blue, qe[4]), t.ansi[5] = Le(e.magenta, qe[5]), t.ansi[6] = Le(e.cyan, qe[6]), t.ansi[7] = Le(e.white, qe[7]), t.ansi[8] = Le(e.brightBlack, qe[8]), t.ansi[9] = Le(e.brightRed, qe[9]), t.ansi[10] = Le(e.brightGreen, qe[10]), t.ansi[11] = Le(e.brightYellow, qe[11]), t.ansi[12] = Le(e.brightBlue, qe[12]), t.ansi[13] = Le(e.brightMagenta, qe[13]), t.ansi[14] = Le(e.brightCyan, qe[14]), t.ansi[15] = Le(e.brightWhite, qe[15]), e.extendedAnsi) {
      let s = Math.min(t.ansi.length - 16, e.extendedAnsi.length);
      for (let r = 0; r < s; r++) t.ansi[r + 16] = Le(e.extendedAnsi[r], qe[r + 16]);
    }
    this._contrastCache.clear(), this._halfContrastCache.clear(), this._updateRestoreColors(), this._onChangeColors.fire(this.colors);
  }
  restoreColor(e) {
    this._restoreColor(e), this._onChangeColors.fire(this.colors);
  }
  _restoreColor(e) {
    if (e === void 0) {
      for (let t = 0; t < this._restoreColors.ansi.length; ++t) this._colors.ansi[t] = this._restoreColors.ansi[t];
      return;
    }
    switch (e) {
      case 256:
        this._colors.foreground = this._restoreColors.foreground;
        break;
      case 257:
        this._colors.background = this._restoreColors.background;
        break;
      case 258:
        this._colors.cursor = this._restoreColors.cursor;
        break;
      default:
        this._colors.ansi[e] = this._restoreColors.ansi[e];
    }
  }
  modifyColors(e) {
    e(this._colors), this._onChangeColors.fire(this.colors);
  }
  _updateRestoreColors() {
    this._restoreColors = { foreground: this._colors.foreground, background: this._colors.background, cursor: this._colors.cursor, ansi: this._colors.ansi.slice() };
  }
};
io = $e([X(0, wt)], io);
function Le(e, t) {
  if (e !== void 0) try {
    return Pe.toColor(e);
  } catch {
  }
  return t;
}
var x_ = class {
  constructor(...e) {
    this._entries = /* @__PURE__ */ new Map();
    for (let [t, s] of e) this.set(t, s);
  }
  set(e, t) {
    let s = this._entries.get(e);
    return this._entries.set(e, t), s;
  }
  forEach(e) {
    for (let [t, s] of this._entries.entries()) e(t, s);
  }
  has(e) {
    return this._entries.has(e);
  }
  get(e) {
    return this._entries.get(e);
  }
}, k_ = class {
  constructor() {
    this._services = new x_(), this._services.set(Lo, this);
  }
  setService(e, t) {
    this._services.set(e, t);
  }
  getService(e) {
    return this._services.get(e);
  }
  createInstance(e, ...t) {
    let s = Cd(e).sort((o, a) => o.index - a.index), r = [];
    for (let o of s) {
      let a = this._services.get(o.id);
      if (!a) throw new Error(`[createInstance] ${e.name} depends on UNKNOWN service ${o.id._id}.`);
      r.push(a);
    }
    let n = s.length > 0 ? s[0].index : t.length;
    if (t.length !== n) throw new Error(`[createInstance] First service dependency of ${e.name} at position ${n + 1} conflicts with ${t.length} static arguments`);
    return new e(...t, ...r);
  }
}, L_ = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, off: 5 }, M_ = "xterm.js: ", so = class extends ue {
  constructor(e) {
    super(), this._optionsService = e, this._logLevel = 5, this._updateLogLevel(), this._register(this._optionsService.onSpecificOptionChange("logLevel", () => this._updateLogLevel()));
  }
  get logLevel() {
    return this._logLevel;
  }
  _updateLogLevel() {
    this._logLevel = L_[this._optionsService.rawOptions.logLevel];
  }
  _evalLazyOptionalParams(e) {
    for (let t = 0; t < e.length; t++) typeof e[t] == "function" && (e[t] = e[t]());
  }
  _log(e, t, s) {
    this._evalLazyOptionalParams(s), e.call(console, (this._optionsService.options.logger ? "" : M_) + t, ...s);
  }
  trace(e, ...t) {
    var s;
    this._logLevel <= 0 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.trace.bind(this._optionsService.options.logger)) ?? console.log, e, t);
  }
  debug(e, ...t) {
    var s;
    this._logLevel <= 1 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.debug.bind(this._optionsService.options.logger)) ?? console.log, e, t);
  }
  info(e, ...t) {
    var s;
    this._logLevel <= 2 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.info.bind(this._optionsService.options.logger)) ?? console.info, e, t);
  }
  warn(e, ...t) {
    var s;
    this._logLevel <= 3 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.warn.bind(this._optionsService.options.logger)) ?? console.warn, e, t);
  }
  error(e, ...t) {
    var s;
    this._logLevel <= 4 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.error.bind(this._optionsService.options.logger)) ?? console.error, e, t);
  }
};
so = $e([X(0, wt)], so);
var Na = class extends ue {
  constructor(e) {
    super(), this._maxLength = e, this.onDeleteEmitter = this._register(new K()), this.onDelete = this.onDeleteEmitter.event, this.onInsertEmitter = this._register(new K()), this.onInsert = this.onInsertEmitter.event, this.onTrimEmitter = this._register(new K()), this.onTrim = this.onTrimEmitter.event, this._array = new Array(this._maxLength), this._startIndex = 0, this._length = 0;
  }
  get maxLength() {
    return this._maxLength;
  }
  set maxLength(e) {
    if (this._maxLength === e) return;
    let t = new Array(e);
    for (let s = 0; s < Math.min(e, this.length); s++) t[s] = this._array[this._getCyclicIndex(s)];
    this._array = t, this._maxLength = e, this._startIndex = 0;
  }
  get length() {
    return this._length;
  }
  set length(e) {
    if (e > this._length) for (let t = this._length; t < e; t++) this._array[t] = void 0;
    this._length = e;
  }
  get(e) {
    return this._array[this._getCyclicIndex(e)];
  }
  set(e, t) {
    this._array[this._getCyclicIndex(e)] = t;
  }
  push(e) {
    this._array[this._getCyclicIndex(this._length)] = e, this._length === this._maxLength ? (this._startIndex = ++this._startIndex % this._maxLength, this.onTrimEmitter.fire(1)) : this._length++;
  }
  recycle() {
    if (this._length !== this._maxLength) throw new Error("Can only recycle when the buffer is full");
    return this._startIndex = ++this._startIndex % this._maxLength, this.onTrimEmitter.fire(1), this._array[this._getCyclicIndex(this._length - 1)];
  }
  get isFull() {
    return this._length === this._maxLength;
  }
  pop() {
    return this._array[this._getCyclicIndex(this._length-- - 1)];
  }
  splice(e, t, ...s) {
    if (t) {
      for (let r = e; r < this._length - t; r++) this._array[this._getCyclicIndex(r)] = this._array[this._getCyclicIndex(r + t)];
      this._length -= t, this.onDeleteEmitter.fire({ index: e, amount: t });
    }
    for (let r = this._length - 1; r >= e; r--) this._array[this._getCyclicIndex(r + s.length)] = this._array[this._getCyclicIndex(r)];
    for (let r = 0; r < s.length; r++) this._array[this._getCyclicIndex(e + r)] = s[r];
    if (s.length && this.onInsertEmitter.fire({ index: e, amount: s.length }), this._length + s.length > this._maxLength) {
      let r = this._length + s.length - this._maxLength;
      this._startIndex += r, this._length = this._maxLength, this.onTrimEmitter.fire(r);
    } else this._length += s.length;
  }
  trimStart(e) {
    e > this._length && (e = this._length), this._startIndex += e, this._length -= e, this.onTrimEmitter.fire(e);
  }
  shiftElements(e, t, s) {
    if (!(t <= 0)) {
      if (e < 0 || e >= this._length) throw new Error("start argument out of range");
      if (e + s < 0) throw new Error("Cannot shift elements in list beyond index 0");
      if (s > 0) {
        for (let n = t - 1; n >= 0; n--) this.set(e + n + s, this.get(e + n));
        let r = e + t + s - this._length;
        if (r > 0) for (this._length += r; this._length > this._maxLength; ) this._length--, this._startIndex++, this.onTrimEmitter.fire(1);
      } else for (let r = 0; r < t; r++) this.set(e + r + s, this.get(e + r));
    }
  }
  _getCyclicIndex(e) {
    return (this._startIndex + e) % this._maxLength;
  }
}, de = 3, Ke = Object.freeze(new Ys()), ar = 0, Zr = 2, Ns = class Ah {
  constructor(t, s, r = !1) {
    this.isWrapped = r, this._combined = {}, this._extendedAttrs = {}, this._data = new Uint32Array(t * de);
    let n = s || Nt.fromCharData([0, ih, 1, 0]);
    for (let o = 0; o < t; ++o) this.setCell(o, n);
    this.length = t;
  }
  get(t) {
    let s = this._data[t * de + 0], r = s & 2097151;
    return [this._data[t * de + 1], s & 2097152 ? this._combined[t] : r ? Di(r) : "", s >> 22, s & 2097152 ? this._combined[t].charCodeAt(this._combined[t].length - 1) : r];
  }
  set(t, s) {
    this._data[t * de + 1] = s[0], s[1].length > 1 ? (this._combined[t] = s[1], this._data[t * de + 0] = t | 2097152 | s[2] << 22) : this._data[t * de + 0] = s[1].charCodeAt(0) | s[2] << 22;
  }
  getWidth(t) {
    return this._data[t * de + 0] >> 22;
  }
  hasWidth(t) {
    return this._data[t * de + 0] & 12582912;
  }
  getFg(t) {
    return this._data[t * de + 1];
  }
  getBg(t) {
    return this._data[t * de + 2];
  }
  hasContent(t) {
    return this._data[t * de + 0] & 4194303;
  }
  getCodePoint(t) {
    let s = this._data[t * de + 0];
    return s & 2097152 ? this._combined[t].charCodeAt(this._combined[t].length - 1) : s & 2097151;
  }
  isCombined(t) {
    return this._data[t * de + 0] & 2097152;
  }
  getString(t) {
    let s = this._data[t * de + 0];
    return s & 2097152 ? this._combined[t] : s & 2097151 ? Di(s & 2097151) : "";
  }
  isProtected(t) {
    return this._data[t * de + 2] & 536870912;
  }
  loadCell(t, s) {
    return ar = t * de, s.content = this._data[ar + 0], s.fg = this._data[ar + 1], s.bg = this._data[ar + 2], s.content & 2097152 && (s.combinedData = this._combined[t]), s.bg & 268435456 && (s.extended = this._extendedAttrs[t]), s;
  }
  setCell(t, s) {
    s.content & 2097152 && (this._combined[t] = s.combinedData), s.bg & 268435456 && (this._extendedAttrs[t] = s.extended), this._data[t * de + 0] = s.content, this._data[t * de + 1] = s.fg, this._data[t * de + 2] = s.bg;
  }
  setCellFromCodepoint(t, s, r, n) {
    n.bg & 268435456 && (this._extendedAttrs[t] = n.extended), this._data[t * de + 0] = s | r << 22, this._data[t * de + 1] = n.fg, this._data[t * de + 2] = n.bg;
  }
  addCodepointToCell(t, s, r) {
    let n = this._data[t * de + 0];
    n & 2097152 ? this._combined[t] += Di(s) : n & 2097151 ? (this._combined[t] = Di(n & 2097151) + Di(s), n &= -2097152, n |= 2097152) : n = s | 1 << 22, r && (n &= -12582913, n |= r << 22), this._data[t * de + 0] = n;
  }
  insertCells(t, s, r) {
    if (t %= this.length, t && this.getWidth(t - 1) === 2 && this.setCellFromCodepoint(t - 1, 0, 1, r), s < this.length - t) {
      let n = new Nt();
      for (let o = this.length - t - s - 1; o >= 0; --o) this.setCell(t + s + o, this.loadCell(t + o, n));
      for (let o = 0; o < s; ++o) this.setCell(t + o, r);
    } else for (let n = t; n < this.length; ++n) this.setCell(n, r);
    this.getWidth(this.length - 1) === 2 && this.setCellFromCodepoint(this.length - 1, 0, 1, r);
  }
  deleteCells(t, s, r) {
    if (t %= this.length, s < this.length - t) {
      let n = new Nt();
      for (let o = 0; o < this.length - t - s; ++o) this.setCell(t + o, this.loadCell(t + s + o, n));
      for (let o = this.length - s; o < this.length; ++o) this.setCell(o, r);
    } else for (let n = t; n < this.length; ++n) this.setCell(n, r);
    t && this.getWidth(t - 1) === 2 && this.setCellFromCodepoint(t - 1, 0, 1, r), this.getWidth(t) === 0 && !this.hasContent(t) && this.setCellFromCodepoint(t, 0, 1, r);
  }
  replaceCells(t, s, r, n = !1) {
    if (n) {
      for (t && this.getWidth(t - 1) === 2 && !this.isProtected(t - 1) && this.setCellFromCodepoint(t - 1, 0, 1, r), s < this.length && this.getWidth(s - 1) === 2 && !this.isProtected(s) && this.setCellFromCodepoint(s, 0, 1, r); t < s && t < this.length; ) this.isProtected(t) || this.setCell(t, r), t++;
      return;
    }
    for (t && this.getWidth(t - 1) === 2 && this.setCellFromCodepoint(t - 1, 0, 1, r), s < this.length && this.getWidth(s - 1) === 2 && this.setCellFromCodepoint(s, 0, 1, r); t < s && t < this.length; ) this.setCell(t++, r);
  }
  resize(t, s) {
    if (t === this.length) return this._data.length * 4 * Zr < this._data.buffer.byteLength;
    let r = t * de;
    if (t > this.length) {
      if (this._data.buffer.byteLength >= r * 4) this._data = new Uint32Array(this._data.buffer, 0, r);
      else {
        let n = new Uint32Array(r);
        n.set(this._data), this._data = n;
      }
      for (let n = this.length; n < t; ++n) this.setCell(n, s);
    } else {
      this._data = this._data.subarray(0, r);
      let n = Object.keys(this._combined);
      for (let a = 0; a < n.length; a++) {
        let l = parseInt(n[a], 10);
        l >= t && delete this._combined[l];
      }
      let o = Object.keys(this._extendedAttrs);
      for (let a = 0; a < o.length; a++) {
        let l = parseInt(o[a], 10);
        l >= t && delete this._extendedAttrs[l];
      }
    }
    return this.length = t, r * 4 * Zr < this._data.buffer.byteLength;
  }
  cleanupMemory() {
    if (this._data.length * 4 * Zr < this._data.buffer.byteLength) {
      let t = new Uint32Array(this._data.length);
      return t.set(this._data), this._data = t, 1;
    }
    return 0;
  }
  fill(t, s = !1) {
    if (s) {
      for (let r = 0; r < this.length; ++r) this.isProtected(r) || this.setCell(r, t);
      return;
    }
    this._combined = {}, this._extendedAttrs = {};
    for (let r = 0; r < this.length; ++r) this.setCell(r, t);
  }
  copyFrom(t) {
    this.length !== t.length ? this._data = new Uint32Array(t._data) : this._data.set(t._data), this.length = t.length, this._combined = {};
    for (let s in t._combined) this._combined[s] = t._combined[s];
    this._extendedAttrs = {};
    for (let s in t._extendedAttrs) this._extendedAttrs[s] = t._extendedAttrs[s];
    this.isWrapped = t.isWrapped;
  }
  clone() {
    let t = new Ah(0);
    t._data = new Uint32Array(this._data), t.length = this.length;
    for (let s in this._combined) t._combined[s] = this._combined[s];
    for (let s in this._extendedAttrs) t._extendedAttrs[s] = this._extendedAttrs[s];
    return t.isWrapped = this.isWrapped, t;
  }
  getTrimmedLength() {
    for (let t = this.length - 1; t >= 0; --t) if (this._data[t * de + 0] & 4194303) return t + (this._data[t * de + 0] >> 22);
    return 0;
  }
  getNoBgTrimmedLength() {
    for (let t = this.length - 1; t >= 0; --t) if (this._data[t * de + 0] & 4194303 || this._data[t * de + 2] & 50331648) return t + (this._data[t * de + 0] >> 22);
    return 0;
  }
  copyCellsFrom(t, s, r, n, o) {
    let a = t._data;
    if (o) for (let c = n - 1; c >= 0; c--) {
      for (let h = 0; h < de; h++) this._data[(r + c) * de + h] = a[(s + c) * de + h];
      a[(s + c) * de + 2] & 268435456 && (this._extendedAttrs[r + c] = t._extendedAttrs[s + c]);
    }
    else for (let c = 0; c < n; c++) {
      for (let h = 0; h < de; h++) this._data[(r + c) * de + h] = a[(s + c) * de + h];
      a[(s + c) * de + 2] & 268435456 && (this._extendedAttrs[r + c] = t._extendedAttrs[s + c]);
    }
    let l = Object.keys(t._combined);
    for (let c = 0; c < l.length; c++) {
      let h = parseInt(l[c], 10);
      h >= s && (this._combined[h - s + r] = t._combined[h]);
    }
  }
  translateToString(t, s, r, n) {
    s = s ?? 0, r = r ?? this.length, t && (r = Math.min(r, this.getTrimmedLength())), n && (n.length = 0);
    let o = "";
    for (; s < r; ) {
      let a = this._data[s * de + 0], l = a & 2097151, c = a & 2097152 ? this._combined[s] : l ? Di(l) : Ri;
      if (o += c, n) for (let h = 0; h < c.length; ++h) n.push(s);
      s += a >> 22 || 1;
    }
    return n && n.push(s), o;
  }
};
function E_(e, t, s, r, n, o) {
  let a = [];
  for (let l = 0; l < e.length - 1; l++) {
    let c = l, h = e.get(++c);
    if (!h.isWrapped) continue;
    let d = [e.get(l)];
    for (; c < e.length && h.isWrapped; ) d.push(h), h = e.get(++c);
    if (!o && r >= l && r < c) {
      l += d.length - 1;
      continue;
    }
    let u = 0, f = Vs(d, u, t), _ = 1, g = 0;
    for (; _ < d.length; ) {
      let D = Vs(d, _, t), R = D - g, H = s - f, M = Math.min(R, H);
      d[u].copyCellsFrom(d[_], g, f, M, !1), f += M, f === s && (u++, f = 0), g += M, g === D && (_++, g = 0), f === 0 && u !== 0 && d[u - 1].getWidth(s - 1) === 2 && (d[u].copyCellsFrom(d[u - 1], s - 1, f++, 1, !1), d[u - 1].setCell(s - 1, n));
    }
    d[u].replaceCells(f, s, n);
    let y = 0;
    for (let D = d.length - 1; D > 0 && (D > u || d[D].getTrimmedLength() === 0); D--) y++;
    y > 0 && (a.push(l + d.length - y), a.push(y)), l += d.length - 1;
  }
  return a;
}
function D_(e, t) {
  let s = [], r = 0, n = t[r], o = 0;
  for (let a = 0; a < e.length; a++) if (n === a) {
    let l = t[++r];
    e.onDeleteEmitter.fire({ index: a - o, amount: l }), a += l - 1, o += l, n = t[++r];
  } else s.push(a);
  return { layout: s, countRemoved: o };
}
function R_(e, t) {
  let s = [];
  for (let r = 0; r < t.length; r++) s.push(e.get(t[r]));
  for (let r = 0; r < s.length; r++) e.set(r, s[r]);
  e.length = t.length;
}
function T_(e, t, s) {
  let r = [], n = e.map((c, h) => Vs(e, h, t)).reduce((c, h) => c + h), o = 0, a = 0, l = 0;
  for (; l < n; ) {
    if (n - l < s) {
      r.push(n - l);
      break;
    }
    o += s;
    let c = Vs(e, a, t);
    o > c && (o -= c, a++);
    let h = e[a].getWidth(o - 1) === 2;
    h && o--;
    let d = h ? s - 1 : s;
    r.push(d), l += d;
  }
  return r;
}
function Vs(e, t, s) {
  if (t === e.length - 1) return e[t].getTrimmedLength();
  let r = !e[t].hasContent(s - 1) && e[t].getWidth(s - 1) === 1, n = e[t + 1].getWidth(0) === 2;
  return r && n ? s - 1 : s;
}
var Nh = class Oh {
  constructor(t) {
    this.line = t, this.isDisposed = !1, this._disposables = [], this._id = Oh._nextId++, this._onDispose = this.register(new K()), this.onDispose = this._onDispose.event;
  }
  get id() {
    return this._id;
  }
  dispose() {
    this.isDisposed || (this.isDisposed = !0, this.line = -1, this._onDispose.fire(), Yi(this._disposables), this._disposables.length = 0);
  }
  register(t) {
    return this._disposables.push(t), t;
  }
};
Nh._nextId = 1;
var B_ = Nh, je = {}, Wi = je.B;
je[0] = { "`": "◆", a: "▒", b: "␉", c: "␌", d: "␍", e: "␊", f: "°", g: "±", h: "␤", i: "␋", j: "┘", k: "┐", l: "┌", m: "└", n: "┼", o: "⎺", p: "⎻", q: "─", r: "⎼", s: "⎽", t: "├", u: "┤", v: "┴", w: "┬", x: "│", y: "≤", z: "≥", "{": "π", "|": "≠", "}": "£", "~": "·" };
je.A = { "#": "£" };
je.B = void 0;
je[4] = { "#": "£", "@": "¾", "[": "ij", "\\": "½", "]": "|", "{": "¨", "|": "f", "}": "¼", "~": "´" };
je.C = je[5] = { "[": "Ä", "\\": "Ö", "]": "Å", "^": "Ü", "`": "é", "{": "ä", "|": "ö", "}": "å", "~": "ü" };
je.R = { "#": "£", "@": "à", "[": "°", "\\": "ç", "]": "§", "{": "é", "|": "ù", "}": "è", "~": "¨" };
je.Q = { "@": "à", "[": "â", "\\": "ç", "]": "ê", "^": "î", "`": "ô", "{": "é", "|": "ù", "}": "è", "~": "û" };
je.K = { "@": "§", "[": "Ä", "\\": "Ö", "]": "Ü", "{": "ä", "|": "ö", "}": "ü", "~": "ß" };
je.Y = { "#": "£", "@": "§", "[": "°", "\\": "ç", "]": "é", "`": "ù", "{": "à", "|": "ò", "}": "è", "~": "ì" };
je.E = je[6] = { "@": "Ä", "[": "Æ", "\\": "Ø", "]": "Å", "^": "Ü", "`": "ä", "{": "æ", "|": "ø", "}": "å", "~": "ü" };
je.Z = { "#": "£", "@": "§", "[": "¡", "\\": "Ñ", "]": "¿", "{": "°", "|": "ñ", "}": "ç" };
je.H = je[7] = { "@": "É", "[": "Ä", "\\": "Ö", "]": "Å", "^": "Ü", "`": "é", "{": "ä", "|": "ö", "}": "å", "~": "ü" };
je["="] = { "#": "ù", "@": "à", "[": "é", "\\": "ç", "]": "ê", "^": "î", _: "è", "`": "ô", "{": "ä", "|": "ö", "}": "ü", "~": "û" };
var Oa = 4294967295, Ia = class {
  constructor(e, t, s) {
    this._hasScrollback = e, this._optionsService = t, this._bufferService = s, this.ydisp = 0, this.ybase = 0, this.y = 0, this.x = 0, this.tabs = {}, this.savedY = 0, this.savedX = 0, this.savedCurAttrData = Ke.clone(), this.savedCharset = Wi, this.markers = [], this._nullCell = Nt.fromCharData([0, ih, 1, 0]), this._whitespaceCell = Nt.fromCharData([0, Ri, 1, 32]), this._isClearing = !1, this._memoryCleanupQueue = new Lr(), this._memoryCleanupPosition = 0, this._cols = this._bufferService.cols, this._rows = this._bufferService.rows, this.lines = new Na(this._getCorrectBufferLength(this._rows)), this.scrollTop = 0, this.scrollBottom = this._rows - 1, this.setupTabStops();
  }
  getNullCell(e) {
    return e ? (this._nullCell.fg = e.fg, this._nullCell.bg = e.bg, this._nullCell.extended = e.extended) : (this._nullCell.fg = 0, this._nullCell.bg = 0, this._nullCell.extended = new yr()), this._nullCell;
  }
  getWhitespaceCell(e) {
    return e ? (this._whitespaceCell.fg = e.fg, this._whitespaceCell.bg = e.bg, this._whitespaceCell.extended = e.extended) : (this._whitespaceCell.fg = 0, this._whitespaceCell.bg = 0, this._whitespaceCell.extended = new yr()), this._whitespaceCell;
  }
  getBlankLine(e, t) {
    return new Ns(this._bufferService.cols, this.getNullCell(e), t);
  }
  get hasScrollback() {
    return this._hasScrollback && this.lines.maxLength > this._rows;
  }
  get isCursorInViewport() {
    let e = this.ybase + this.y - this.ydisp;
    return e >= 0 && e < this._rows;
  }
  _getCorrectBufferLength(e) {
    if (!this._hasScrollback) return e;
    let t = e + this._optionsService.rawOptions.scrollback;
    return t > Oa ? Oa : t;
  }
  fillViewportRows(e) {
    if (this.lines.length === 0) {
      e === void 0 && (e = Ke);
      let t = this._rows;
      for (; t--; ) this.lines.push(this.getBlankLine(e));
    }
  }
  clear() {
    this.ydisp = 0, this.ybase = 0, this.y = 0, this.x = 0, this.lines = new Na(this._getCorrectBufferLength(this._rows)), this.scrollTop = 0, this.scrollBottom = this._rows - 1, this.setupTabStops();
  }
  resize(e, t) {
    let s = this.getNullCell(Ke), r = 0, n = this._getCorrectBufferLength(t);
    if (n > this.lines.maxLength && (this.lines.maxLength = n), this.lines.length > 0) {
      if (this._cols < e) for (let a = 0; a < this.lines.length; a++) r += +this.lines.get(a).resize(e, s);
      let o = 0;
      if (this._rows < t) for (let a = this._rows; a < t; a++) this.lines.length < t + this.ybase && (this._optionsService.rawOptions.windowsMode || this._optionsService.rawOptions.windowsPty.backend !== void 0 || this._optionsService.rawOptions.windowsPty.buildNumber !== void 0 ? this.lines.push(new Ns(e, s)) : this.ybase > 0 && this.lines.length <= this.ybase + this.y + o + 1 ? (this.ybase--, o++, this.ydisp > 0 && this.ydisp--) : this.lines.push(new Ns(e, s)));
      else for (let a = this._rows; a > t; a--) this.lines.length > t + this.ybase && (this.lines.length > this.ybase + this.y + 1 ? this.lines.pop() : (this.ybase++, this.ydisp++));
      if (n < this.lines.maxLength) {
        let a = this.lines.length - n;
        a > 0 && (this.lines.trimStart(a), this.ybase = Math.max(this.ybase - a, 0), this.ydisp = Math.max(this.ydisp - a, 0), this.savedY = Math.max(this.savedY - a, 0)), this.lines.maxLength = n;
      }
      this.x = Math.min(this.x, e - 1), this.y = Math.min(this.y, t - 1), o && (this.y += o), this.savedX = Math.min(this.savedX, e - 1), this.scrollTop = 0;
    }
    if (this.scrollBottom = t - 1, this._isReflowEnabled && (this._reflow(e, t), this._cols > e)) for (let o = 0; o < this.lines.length; o++) r += +this.lines.get(o).resize(e, s);
    this._cols = e, this._rows = t, this._memoryCleanupQueue.clear(), r > 0.1 * this.lines.length && (this._memoryCleanupPosition = 0, this._memoryCleanupQueue.enqueue(() => this._batchedMemoryCleanup()));
  }
  _batchedMemoryCleanup() {
    let e = !0;
    this._memoryCleanupPosition >= this.lines.length && (this._memoryCleanupPosition = 0, e = !1);
    let t = 0;
    for (; this._memoryCleanupPosition < this.lines.length; ) if (t += this.lines.get(this._memoryCleanupPosition++).cleanupMemory(), t > 100) return !0;
    return e;
  }
  get _isReflowEnabled() {
    let e = this._optionsService.rawOptions.windowsPty;
    return e && e.buildNumber ? this._hasScrollback && e.backend === "conpty" && e.buildNumber >= 21376 : this._hasScrollback && !this._optionsService.rawOptions.windowsMode;
  }
  _reflow(e, t) {
    this._cols !== e && (e > this._cols ? this._reflowLarger(e, t) : this._reflowSmaller(e, t));
  }
  _reflowLarger(e, t) {
    let s = this._optionsService.rawOptions.reflowCursorLine, r = E_(this.lines, this._cols, e, this.ybase + this.y, this.getNullCell(Ke), s);
    if (r.length > 0) {
      let n = D_(this.lines, r);
      R_(this.lines, n.layout), this._reflowLargerAdjustViewport(e, t, n.countRemoved);
    }
  }
  _reflowLargerAdjustViewport(e, t, s) {
    let r = this.getNullCell(Ke), n = s;
    for (; n-- > 0; ) this.ybase === 0 ? (this.y > 0 && this.y--, this.lines.length < t && this.lines.push(new Ns(e, r))) : (this.ydisp === this.ybase && this.ydisp--, this.ybase--);
    this.savedY = Math.max(this.savedY - s, 0);
  }
  _reflowSmaller(e, t) {
    let s = this._optionsService.rawOptions.reflowCursorLine, r = this.getNullCell(Ke), n = [], o = 0;
    for (let a = this.lines.length - 1; a >= 0; a--) {
      let l = this.lines.get(a);
      if (!l || !l.isWrapped && l.getTrimmedLength() <= e) continue;
      let c = [l];
      for (; l.isWrapped && a > 0; ) l = this.lines.get(--a), c.unshift(l);
      if (!s) {
        let M = this.ybase + this.y;
        if (M >= a && M < a + c.length) continue;
      }
      let h = c[c.length - 1].getTrimmedLength(), d = T_(c, this._cols, e), u = d.length - c.length, f;
      this.ybase === 0 && this.y !== this.lines.length - 1 ? f = Math.max(0, this.y - this.lines.maxLength + u) : f = Math.max(0, this.lines.length - this.lines.maxLength + u);
      let _ = [];
      for (let M = 0; M < u; M++) {
        let k = this.getBlankLine(Ke, !0);
        _.push(k);
      }
      _.length > 0 && (n.push({ start: a + c.length + o, newLines: _ }), o += _.length), c.push(..._);
      let g = d.length - 1, y = d[g];
      y === 0 && (g--, y = d[g]);
      let D = c.length - u - 1, R = h;
      for (; D >= 0; ) {
        let M = Math.min(R, y);
        if (c[g] === void 0) break;
        if (c[g].copyCellsFrom(c[D], R - M, y - M, M, !0), y -= M, y === 0 && (g--, y = d[g]), R -= M, R === 0) {
          D--;
          let k = Math.max(D, 0);
          R = Vs(c, k, this._cols);
        }
      }
      for (let M = 0; M < c.length; M++) d[M] < e && c[M].setCell(d[M], r);
      let H = u - f;
      for (; H-- > 0; ) this.ybase === 0 ? this.y < t - 1 ? (this.y++, this.lines.pop()) : (this.ybase++, this.ydisp++) : this.ybase < Math.min(this.lines.maxLength, this.lines.length + o) - t && (this.ybase === this.ydisp && this.ydisp++, this.ybase++);
      this.savedY = Math.min(this.savedY + u, this.ybase + t - 1);
    }
    if (n.length > 0) {
      let a = [], l = [];
      for (let y = 0; y < this.lines.length; y++) l.push(this.lines.get(y));
      let c = this.lines.length, h = c - 1, d = 0, u = n[d];
      this.lines.length = Math.min(this.lines.maxLength, this.lines.length + o);
      let f = 0;
      for (let y = Math.min(this.lines.maxLength - 1, c + o - 1); y >= 0; y--) if (u && u.start > h + f) {
        for (let D = u.newLines.length - 1; D >= 0; D--) this.lines.set(y--, u.newLines[D]);
        y++, a.push({ index: h + 1, amount: u.newLines.length }), f += u.newLines.length, u = n[++d];
      } else this.lines.set(y, l[h--]);
      let _ = 0;
      for (let y = a.length - 1; y >= 0; y--) a[y].index += _, this.lines.onInsertEmitter.fire(a[y]), _ += a[y].amount;
      let g = Math.max(0, c + o - this.lines.maxLength);
      g > 0 && this.lines.onTrimEmitter.fire(g);
    }
  }
  translateBufferLineToString(e, t, s = 0, r) {
    let n = this.lines.get(e);
    return n ? n.translateToString(t, s, r) : "";
  }
  getWrappedRangeForLine(e) {
    let t = e, s = e;
    for (; t > 0 && this.lines.get(t).isWrapped; ) t--;
    for (; s + 1 < this.lines.length && this.lines.get(s + 1).isWrapped; ) s++;
    return { first: t, last: s };
  }
  setupTabStops(e) {
    for (e != null ? this.tabs[e] || (e = this.prevStop(e)) : (this.tabs = {}, e = 0); e < this._cols; e += this._optionsService.rawOptions.tabStopWidth) this.tabs[e] = !0;
  }
  prevStop(e) {
    for (e == null && (e = this.x); !this.tabs[--e] && e > 0; ) ;
    return e >= this._cols ? this._cols - 1 : e < 0 ? 0 : e;
  }
  nextStop(e) {
    for (e == null && (e = this.x); !this.tabs[++e] && e < this._cols; ) ;
    return e >= this._cols ? this._cols - 1 : e < 0 ? 0 : e;
  }
  clearMarkers(e) {
    this._isClearing = !0;
    for (let t = 0; t < this.markers.length; t++) this.markers[t].line === e && (this.markers[t].dispose(), this.markers.splice(t--, 1));
    this._isClearing = !1;
  }
  clearAllMarkers() {
    this._isClearing = !0;
    for (let e = 0; e < this.markers.length; e++) this.markers[e].dispose();
    this.markers.length = 0, this._isClearing = !1;
  }
  addMarker(e) {
    let t = new B_(e);
    return this.markers.push(t), t.register(this.lines.onTrim((s) => {
      t.line -= s, t.line < 0 && t.dispose();
    })), t.register(this.lines.onInsert((s) => {
      t.line >= s.index && (t.line += s.amount);
    })), t.register(this.lines.onDelete((s) => {
      t.line >= s.index && t.line < s.index + s.amount && t.dispose(), t.line > s.index && (t.line -= s.amount);
    })), t.register(t.onDispose(() => this._removeMarker(t))), t;
  }
  _removeMarker(e) {
    this._isClearing || this.markers.splice(this.markers.indexOf(e), 1);
  }
}, P_ = class extends ue {
  constructor(e, t) {
    super(), this._optionsService = e, this._bufferService = t, this._onBufferActivate = this._register(new K()), this.onBufferActivate = this._onBufferActivate.event, this.reset(), this._register(this._optionsService.onSpecificOptionChange("scrollback", () => this.resize(this._bufferService.cols, this._bufferService.rows))), this._register(this._optionsService.onSpecificOptionChange("tabStopWidth", () => this.setupTabStops()));
  }
  reset() {
    this._normal = new Ia(!0, this._optionsService, this._bufferService), this._normal.fillViewportRows(), this._alt = new Ia(!1, this._optionsService, this._bufferService), this._activeBuffer = this._normal, this._onBufferActivate.fire({ activeBuffer: this._normal, inactiveBuffer: this._alt }), this.setupTabStops();
  }
  get alt() {
    return this._alt;
  }
  get active() {
    return this._activeBuffer;
  }
  get normal() {
    return this._normal;
  }
  activateNormalBuffer() {
    this._activeBuffer !== this._normal && (this._normal.x = this._alt.x, this._normal.y = this._alt.y, this._alt.clearAllMarkers(), this._alt.clear(), this._activeBuffer = this._normal, this._onBufferActivate.fire({ activeBuffer: this._normal, inactiveBuffer: this._alt }));
  }
  activateAltBuffer(e) {
    this._activeBuffer !== this._alt && (this._alt.fillViewportRows(e), this._alt.x = this._normal.x, this._alt.y = this._normal.y, this._activeBuffer = this._alt, this._onBufferActivate.fire({ activeBuffer: this._alt, inactiveBuffer: this._normal }));
  }
  resize(e, t) {
    this._normal.resize(e, t), this._alt.resize(e, t), this.setupTabStops(e);
  }
  setupTabStops(e) {
    this._normal.setupTabStops(e), this._alt.setupTabStops(e);
  }
}, Ih = 2, Fh = 1, ro = class extends ue {
  constructor(e) {
    super(), this.isUserScrolling = !1, this._onResize = this._register(new K()), this.onResize = this._onResize.event, this._onScroll = this._register(new K()), this.onScroll = this._onScroll.event, this.cols = Math.max(e.rawOptions.cols || 0, Ih), this.rows = Math.max(e.rawOptions.rows || 0, Fh), this.buffers = this._register(new P_(e, this)), this._register(this.buffers.onBufferActivate((t) => {
      this._onScroll.fire(t.activeBuffer.ydisp);
    }));
  }
  get buffer() {
    return this.buffers.active;
  }
  resize(e, t) {
    let s = this.cols !== e, r = this.rows !== t;
    this.cols = e, this.rows = t, this.buffers.resize(e, t), this._onResize.fire({ cols: e, rows: t, colsChanged: s, rowsChanged: r });
  }
  reset() {
    this.buffers.reset(), this.isUserScrolling = !1;
  }
  scroll(e, t = !1) {
    let s = this.buffer, r;
    r = this._cachedBlankLine, (!r || r.length !== this.cols || r.getFg(0) !== e.fg || r.getBg(0) !== e.bg) && (r = s.getBlankLine(e, t), this._cachedBlankLine = r), r.isWrapped = t;
    let n = s.ybase + s.scrollTop, o = s.ybase + s.scrollBottom;
    if (s.scrollTop === 0) {
      let a = s.lines.isFull;
      o === s.lines.length - 1 ? a ? s.lines.recycle().copyFrom(r) : s.lines.push(r.clone()) : s.lines.splice(o + 1, 0, r.clone()), a ? this.isUserScrolling && (s.ydisp = Math.max(s.ydisp - 1, 0)) : (s.ybase++, this.isUserScrolling || s.ydisp++);
    } else {
      let a = o - n + 1;
      s.lines.shiftElements(n + 1, a - 1, -1), s.lines.set(o, r.clone());
    }
    this.isUserScrolling || (s.ydisp = s.ybase), this._onScroll.fire(s.ydisp);
  }
  scrollLines(e, t) {
    let s = this.buffer;
    if (e < 0) {
      if (s.ydisp === 0) return;
      this.isUserScrolling = !0;
    } else e + s.ydisp >= s.ybase && (this.isUserScrolling = !1);
    let r = s.ydisp;
    s.ydisp = Math.max(Math.min(s.ydisp + e, s.ybase), 0), r !== s.ydisp && (t || this._onScroll.fire(s.ydisp));
  }
};
ro = $e([X(0, wt)], ro);
var os = { cols: 80, rows: 24, cursorBlink: !1, cursorStyle: "block", cursorWidth: 1, cursorInactiveStyle: "outline", customGlyphs: !0, drawBoldTextInBrightColors: !0, documentOverride: null, fastScrollModifier: "alt", fastScrollSensitivity: 5, fontFamily: "monospace", fontSize: 15, fontWeight: "normal", fontWeightBold: "bold", ignoreBracketedPasteMode: !1, lineHeight: 1, letterSpacing: 0, linkHandler: null, logLevel: "info", logger: null, scrollback: 1e3, scrollOnEraseInDisplay: !1, scrollOnUserInput: !0, scrollSensitivity: 1, screenReaderMode: !1, smoothScrollDuration: 0, macOptionIsMeta: !1, macOptionClickForcesSelection: !1, minimumContrastRatio: 1, disableStdin: !1, allowProposedApi: !1, allowTransparency: !1, tabStopWidth: 8, theme: {}, reflowCursorLine: !1, rescaleOverlappingGlyphs: !1, rightClickSelectsWord: kr, windowOptions: {}, windowsMode: !1, windowsPty: {}, wordSeparator: " ()[]{}',\"`", altClickMovesCursor: !0, convertEol: !1, termName: "xterm", cancelEvents: !1, overviewRuler: {} }, A_ = ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"], N_ = class extends ue {
  constructor(e) {
    super(), this._onOptionChange = this._register(new K()), this.onOptionChange = this._onOptionChange.event;
    let t = { ...os };
    for (let s in e) if (s in t) try {
      let r = e[s];
      t[s] = this._sanitizeAndValidateOption(s, r);
    } catch (r) {
      console.error(r);
    }
    this.rawOptions = t, this.options = { ...t }, this._setupOptions(), this._register(Ae(() => {
      this.rawOptions.linkHandler = null, this.rawOptions.documentOverride = null;
    }));
  }
  onSpecificOptionChange(e, t) {
    return this.onOptionChange((s) => {
      s === e && t(this.rawOptions[e]);
    });
  }
  onMultipleOptionChange(e, t) {
    return this.onOptionChange((s) => {
      e.indexOf(s) !== -1 && t();
    });
  }
  _setupOptions() {
    let e = (s) => {
      if (!(s in os)) throw new Error(`No option with key "${s}"`);
      return this.rawOptions[s];
    }, t = (s, r) => {
      if (!(s in os)) throw new Error(`No option with key "${s}"`);
      r = this._sanitizeAndValidateOption(s, r), this.rawOptions[s] !== r && (this.rawOptions[s] = r, this._onOptionChange.fire(s));
    };
    for (let s in this.rawOptions) {
      let r = { get: e.bind(this, s), set: t.bind(this, s) };
      Object.defineProperty(this.options, s, r);
    }
  }
  _sanitizeAndValidateOption(e, t) {
    switch (e) {
      case "cursorStyle":
        if (t || (t = os[e]), !O_(t)) throw new Error(`"${t}" is not a valid value for ${e}`);
        break;
      case "wordSeparator":
        t || (t = os[e]);
        break;
      case "fontWeight":
      case "fontWeightBold":
        if (typeof t == "number" && 1 <= t && t <= 1e3) break;
        t = A_.includes(t) ? t : os[e];
        break;
      case "cursorWidth":
        t = Math.floor(t);
      case "lineHeight":
      case "tabStopWidth":
        if (t < 1) throw new Error(`${e} cannot be less than 1, value: ${t}`);
        break;
      case "minimumContrastRatio":
        t = Math.max(1, Math.min(21, Math.round(t * 10) / 10));
        break;
      case "scrollback":
        if (t = Math.min(t, 4294967295), t < 0) throw new Error(`${e} cannot be less than 0, value: ${t}`);
        break;
      case "fastScrollSensitivity":
      case "scrollSensitivity":
        if (t <= 0) throw new Error(`${e} cannot be less than or equal to 0, value: ${t}`);
        break;
      case "rows":
      case "cols":
        if (!t && t !== 0) throw new Error(`${e} must be numeric, value: ${t}`);
        break;
      case "windowsPty":
        t = t ?? {};
        break;
    }
    return t;
  }
};
function O_(e) {
  return e === "block" || e === "underline" || e === "bar";
}
function Os(e, t = 5) {
  if (typeof e != "object") return e;
  let s = Array.isArray(e) ? [] : {};
  for (let r in e) s[r] = t <= 1 ? e[r] : e[r] && Os(e[r], t - 1);
  return s;
}
var Fa = Object.freeze({ insertMode: !1 }), za = Object.freeze({ applicationCursorKeys: !1, applicationKeypad: !1, bracketedPasteMode: !1, cursorBlink: void 0, cursorStyle: void 0, origin: !1, reverseWraparound: !1, sendFocus: !1, synchronizedOutput: !1, wraparound: !0 }), no = class extends ue {
  constructor(e, t, s) {
    super(), this._bufferService = e, this._logService = t, this._optionsService = s, this.isCursorInitialized = !1, this.isCursorHidden = !1, this._onData = this._register(new K()), this.onData = this._onData.event, this._onUserInput = this._register(new K()), this.onUserInput = this._onUserInput.event, this._onBinary = this._register(new K()), this.onBinary = this._onBinary.event, this._onRequestScrollToBottom = this._register(new K()), this.onRequestScrollToBottom = this._onRequestScrollToBottom.event, this.modes = Os(Fa), this.decPrivateModes = Os(za);
  }
  reset() {
    this.modes = Os(Fa), this.decPrivateModes = Os(za);
  }
  triggerDataEvent(e, t = !1) {
    if (this._optionsService.rawOptions.disableStdin) return;
    let s = this._bufferService.buffer;
    t && this._optionsService.rawOptions.scrollOnUserInput && s.ybase !== s.ydisp && this._onRequestScrollToBottom.fire(), t && this._onUserInput.fire(), this._logService.debug(`sending data "${e}"`), this._logService.trace("sending data (codes)", () => e.split("").map((r) => r.charCodeAt(0))), this._onData.fire(e);
  }
  triggerBinaryEvent(e) {
    this._optionsService.rawOptions.disableStdin || (this._logService.debug(`sending binary "${e}"`), this._logService.trace("sending binary (codes)", () => e.split("").map((t) => t.charCodeAt(0))), this._onBinary.fire(e));
  }
};
no = $e([X(0, mt), X(1, ah), X(2, wt)], no);
var Wa = { NONE: { events: 0, restrict: () => !1 }, X10: { events: 1, restrict: (e) => e.button === 4 || e.action !== 1 ? !1 : (e.ctrl = !1, e.alt = !1, e.shift = !1, !0) }, VT200: { events: 19, restrict: (e) => e.action !== 32 }, DRAG: { events: 23, restrict: (e) => !(e.action === 32 && e.button === 3) }, ANY: { events: 31, restrict: (e) => !0 } };
function Jr(e, t) {
  let s = (e.ctrl ? 16 : 0) | (e.shift ? 4 : 0) | (e.alt ? 8 : 0);
  return e.button === 4 ? (s |= 64, s |= e.action) : (s |= e.button & 3, e.button & 4 && (s |= 64), e.button & 8 && (s |= 128), e.action === 32 ? s |= 32 : e.action === 0 && !t && (s |= 3)), s;
}
var Qr = String.fromCharCode, $a = { DEFAULT: (e) => {
  let t = [Jr(e, !1) + 32, e.col + 32, e.row + 32];
  return t[0] > 255 || t[1] > 255 || t[2] > 255 ? "" : `\x1B[M${Qr(t[0])}${Qr(t[1])}${Qr(t[2])}`;
}, SGR: (e) => {
  let t = e.action === 0 && e.button !== 4 ? "m" : "M";
  return `\x1B[<${Jr(e, !0)};${e.col};${e.row}${t}`;
}, SGR_PIXELS: (e) => {
  let t = e.action === 0 && e.button !== 4 ? "m" : "M";
  return `\x1B[<${Jr(e, !0)};${e.x};${e.y}${t}`;
} }, oo = class extends ue {
  constructor(e, t, s) {
    super(), this._bufferService = e, this._coreService = t, this._optionsService = s, this._protocols = {}, this._encodings = {}, this._activeProtocol = "", this._activeEncoding = "", this._lastEvent = null, this._wheelPartialScroll = 0, this._onProtocolChange = this._register(new K()), this.onProtocolChange = this._onProtocolChange.event;
    for (let r of Object.keys(Wa)) this.addProtocol(r, Wa[r]);
    for (let r of Object.keys($a)) this.addEncoding(r, $a[r]);
    this.reset();
  }
  addProtocol(e, t) {
    this._protocols[e] = t;
  }
  addEncoding(e, t) {
    this._encodings[e] = t;
  }
  get activeProtocol() {
    return this._activeProtocol;
  }
  get areMouseEventsActive() {
    return this._protocols[this._activeProtocol].events !== 0;
  }
  set activeProtocol(e) {
    if (!this._protocols[e]) throw new Error(`unknown protocol "${e}"`);
    this._activeProtocol = e, this._onProtocolChange.fire(this._protocols[e].events);
  }
  get activeEncoding() {
    return this._activeEncoding;
  }
  set activeEncoding(e) {
    if (!this._encodings[e]) throw new Error(`unknown encoding "${e}"`);
    this._activeEncoding = e;
  }
  reset() {
    this.activeProtocol = "NONE", this.activeEncoding = "DEFAULT", this._lastEvent = null, this._wheelPartialScroll = 0;
  }
  consumeWheelEvent(e, t, s) {
    if (e.deltaY === 0 || e.shiftKey || t === void 0 || s === void 0) return 0;
    let r = t / s, n = this._applyScrollModifier(e.deltaY, e);
    return e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? (n /= r + 0, Math.abs(e.deltaY) < 50 && (n *= 0.3), this._wheelPartialScroll += n, n = Math.floor(Math.abs(this._wheelPartialScroll)) * (this._wheelPartialScroll > 0 ? 1 : -1), this._wheelPartialScroll %= 1) : e.deltaMode === WheelEvent.DOM_DELTA_PAGE && (n *= this._bufferService.rows), n;
  }
  _applyScrollModifier(e, t) {
    return t.altKey || t.ctrlKey || t.shiftKey ? e * this._optionsService.rawOptions.fastScrollSensitivity * this._optionsService.rawOptions.scrollSensitivity : e * this._optionsService.rawOptions.scrollSensitivity;
  }
  triggerMouseEvent(e) {
    if (e.col < 0 || e.col >= this._bufferService.cols || e.row < 0 || e.row >= this._bufferService.rows || e.button === 4 && e.action === 32 || e.button === 3 && e.action !== 32 || e.button !== 4 && (e.action === 2 || e.action === 3) || (e.col++, e.row++, e.action === 32 && this._lastEvent && this._equalEvents(this._lastEvent, e, this._activeEncoding === "SGR_PIXELS")) || !this._protocols[this._activeProtocol].restrict(e)) return !1;
    let t = this._encodings[this._activeEncoding](e);
    return t && (this._activeEncoding === "DEFAULT" ? this._coreService.triggerBinaryEvent(t) : this._coreService.triggerDataEvent(t, !0)), this._lastEvent = e, !0;
  }
  explainEvents(e) {
    return { down: !!(e & 1), up: !!(e & 2), drag: !!(e & 4), move: !!(e & 8), wheel: !!(e & 16) };
  }
  _equalEvents(e, t, s) {
    if (s) {
      if (e.x !== t.x || e.y !== t.y) return !1;
    } else if (e.col !== t.col || e.row !== t.row) return !1;
    return !(e.button !== t.button || e.action !== t.action || e.ctrl !== t.ctrl || e.alt !== t.alt || e.shift !== t.shift);
  }
};
oo = $e([X(0, mt), X(1, Gi), X(2, wt)], oo);
var en = [[768, 879], [1155, 1158], [1160, 1161], [1425, 1469], [1471, 1471], [1473, 1474], [1476, 1477], [1479, 1479], [1536, 1539], [1552, 1557], [1611, 1630], [1648, 1648], [1750, 1764], [1767, 1768], [1770, 1773], [1807, 1807], [1809, 1809], [1840, 1866], [1958, 1968], [2027, 2035], [2305, 2306], [2364, 2364], [2369, 2376], [2381, 2381], [2385, 2388], [2402, 2403], [2433, 2433], [2492, 2492], [2497, 2500], [2509, 2509], [2530, 2531], [2561, 2562], [2620, 2620], [2625, 2626], [2631, 2632], [2635, 2637], [2672, 2673], [2689, 2690], [2748, 2748], [2753, 2757], [2759, 2760], [2765, 2765], [2786, 2787], [2817, 2817], [2876, 2876], [2879, 2879], [2881, 2883], [2893, 2893], [2902, 2902], [2946, 2946], [3008, 3008], [3021, 3021], [3134, 3136], [3142, 3144], [3146, 3149], [3157, 3158], [3260, 3260], [3263, 3263], [3270, 3270], [3276, 3277], [3298, 3299], [3393, 3395], [3405, 3405], [3530, 3530], [3538, 3540], [3542, 3542], [3633, 3633], [3636, 3642], [3655, 3662], [3761, 3761], [3764, 3769], [3771, 3772], [3784, 3789], [3864, 3865], [3893, 3893], [3895, 3895], [3897, 3897], [3953, 3966], [3968, 3972], [3974, 3975], [3984, 3991], [3993, 4028], [4038, 4038], [4141, 4144], [4146, 4146], [4150, 4151], [4153, 4153], [4184, 4185], [4448, 4607], [4959, 4959], [5906, 5908], [5938, 5940], [5970, 5971], [6002, 6003], [6068, 6069], [6071, 6077], [6086, 6086], [6089, 6099], [6109, 6109], [6155, 6157], [6313, 6313], [6432, 6434], [6439, 6440], [6450, 6450], [6457, 6459], [6679, 6680], [6912, 6915], [6964, 6964], [6966, 6970], [6972, 6972], [6978, 6978], [7019, 7027], [7616, 7626], [7678, 7679], [8203, 8207], [8234, 8238], [8288, 8291], [8298, 8303], [8400, 8431], [12330, 12335], [12441, 12442], [43014, 43014], [43019, 43019], [43045, 43046], [64286, 64286], [65024, 65039], [65056, 65059], [65279, 65279], [65529, 65531]], I_ = [[68097, 68099], [68101, 68102], [68108, 68111], [68152, 68154], [68159, 68159], [119143, 119145], [119155, 119170], [119173, 119179], [119210, 119213], [119362, 119364], [917505, 917505], [917536, 917631], [917760, 917999]], Ye;
function F_(e, t) {
  let s = 0, r = t.length - 1, n;
  if (e < t[0][0] || e > t[r][1]) return !1;
  for (; r >= s; ) if (n = s + r >> 1, e > t[n][1]) s = n + 1;
  else if (e < t[n][0]) r = n - 1;
  else return !0;
  return !1;
}
var z_ = class {
  constructor() {
    if (this.version = "6", !Ye) {
      Ye = new Uint8Array(65536), Ye.fill(1), Ye[0] = 0, Ye.fill(0, 1, 32), Ye.fill(0, 127, 160), Ye.fill(2, 4352, 4448), Ye[9001] = 2, Ye[9002] = 2, Ye.fill(2, 11904, 42192), Ye[12351] = 1, Ye.fill(2, 44032, 55204), Ye.fill(2, 63744, 64256), Ye.fill(2, 65040, 65050), Ye.fill(2, 65072, 65136), Ye.fill(2, 65280, 65377), Ye.fill(2, 65504, 65511);
      for (let e = 0; e < en.length; ++e) Ye.fill(0, en[e][0], en[e][1] + 1);
    }
  }
  wcwidth(e) {
    return e < 32 ? 0 : e < 127 ? 1 : e < 65536 ? Ye[e] : F_(e, I_) ? 0 : e >= 131072 && e <= 196605 || e >= 196608 && e <= 262141 ? 2 : 1;
  }
  charProperties(e, t) {
    let s = this.wcwidth(e), r = s === 0 && t !== 0;
    if (r) {
      let n = $i.extractWidth(t);
      n === 0 ? r = !1 : n > s && (s = n);
    }
    return $i.createPropertyValue(0, s, r);
  }
}, $i = class gr {
  constructor() {
    this._providers = /* @__PURE__ */ Object.create(null), this._active = "", this._onChange = new K(), this.onChange = this._onChange.event;
    let t = new z_();
    this.register(t), this._active = t.version, this._activeProvider = t;
  }
  static extractShouldJoin(t) {
    return (t & 1) !== 0;
  }
  static extractWidth(t) {
    return t >> 1 & 3;
  }
  static extractCharKind(t) {
    return t >> 3;
  }
  static createPropertyValue(t, s, r = !1) {
    return (t & 16777215) << 3 | (s & 3) << 1 | (r ? 1 : 0);
  }
  dispose() {
    this._onChange.dispose();
  }
  get versions() {
    return Object.keys(this._providers);
  }
  get activeVersion() {
    return this._active;
  }
  set activeVersion(t) {
    if (!this._providers[t]) throw new Error(`unknown Unicode version "${t}"`);
    this._active = t, this._activeProvider = this._providers[t], this._onChange.fire(t);
  }
  register(t) {
    this._providers[t.version] = t;
  }
  wcwidth(t) {
    return this._activeProvider.wcwidth(t);
  }
  getStringCellWidth(t) {
    let s = 0, r = 0, n = t.length;
    for (let o = 0; o < n; ++o) {
      let a = t.charCodeAt(o);
      if (55296 <= a && a <= 56319) {
        if (++o >= n) return s + this.wcwidth(a);
        let h = t.charCodeAt(o);
        56320 <= h && h <= 57343 ? a = (a - 55296) * 1024 + h - 56320 + 65536 : s += this.wcwidth(h);
      }
      let l = this.charProperties(a, r), c = gr.extractWidth(l);
      gr.extractShouldJoin(l) && (c -= gr.extractWidth(r)), s += c, r = l;
    }
    return s;
  }
  charProperties(t, s) {
    return this._activeProvider.charProperties(t, s);
  }
}, W_ = class {
  constructor() {
    this.glevel = 0, this._charsets = [];
  }
  reset() {
    this.charset = void 0, this._charsets = [], this.glevel = 0;
  }
  setgLevel(e) {
    this.glevel = e, this.charset = this._charsets[e];
  }
  setgCharset(e, t) {
    this._charsets[e] = t, this.glevel === e && (this.charset = t);
  }
};
function Ha(e) {
  var t;
  let s = (t = e.buffer.lines.get(e.buffer.ybase + e.buffer.y - 1)) == null ? void 0 : t.get(e.cols - 1), r = e.buffer.lines.get(e.buffer.ybase + e.buffer.y);
  r && s && (r.isWrapped = s[3] !== 0 && s[3] !== 32);
}
var Ls = 2147483647, $_ = 256, zh = class ao {
  constructor(t = 32, s = 32) {
    if (this.maxLength = t, this.maxSubParamsLength = s, s > $_) throw new Error("maxSubParamsLength must not be greater than 256");
    this.params = new Int32Array(t), this.length = 0, this._subParams = new Int32Array(s), this._subParamsLength = 0, this._subParamsIdx = new Uint16Array(t), this._rejectDigits = !1, this._rejectSubDigits = !1, this._digitIsSub = !1;
  }
  static fromArray(t) {
    let s = new ao();
    if (!t.length) return s;
    for (let r = Array.isArray(t[0]) ? 1 : 0; r < t.length; ++r) {
      let n = t[r];
      if (Array.isArray(n)) for (let o = 0; o < n.length; ++o) s.addSubParam(n[o]);
      else s.addParam(n);
    }
    return s;
  }
  clone() {
    let t = new ao(this.maxLength, this.maxSubParamsLength);
    return t.params.set(this.params), t.length = this.length, t._subParams.set(this._subParams), t._subParamsLength = this._subParamsLength, t._subParamsIdx.set(this._subParamsIdx), t._rejectDigits = this._rejectDigits, t._rejectSubDigits = this._rejectSubDigits, t._digitIsSub = this._digitIsSub, t;
  }
  toArray() {
    let t = [];
    for (let s = 0; s < this.length; ++s) {
      t.push(this.params[s]);
      let r = this._subParamsIdx[s] >> 8, n = this._subParamsIdx[s] & 255;
      n - r > 0 && t.push(Array.prototype.slice.call(this._subParams, r, n));
    }
    return t;
  }
  reset() {
    this.length = 0, this._subParamsLength = 0, this._rejectDigits = !1, this._rejectSubDigits = !1, this._digitIsSub = !1;
  }
  addParam(t) {
    if (this._digitIsSub = !1, this.length >= this.maxLength) {
      this._rejectDigits = !0;
      return;
    }
    if (t < -1) throw new Error("values lesser than -1 are not allowed");
    this._subParamsIdx[this.length] = this._subParamsLength << 8 | this._subParamsLength, this.params[this.length++] = t > Ls ? Ls : t;
  }
  addSubParam(t) {
    if (this._digitIsSub = !0, !!this.length) {
      if (this._rejectDigits || this._subParamsLength >= this.maxSubParamsLength) {
        this._rejectSubDigits = !0;
        return;
      }
      if (t < -1) throw new Error("values lesser than -1 are not allowed");
      this._subParams[this._subParamsLength++] = t > Ls ? Ls : t, this._subParamsIdx[this.length - 1]++;
    }
  }
  hasSubParams(t) {
    return (this._subParamsIdx[t] & 255) - (this._subParamsIdx[t] >> 8) > 0;
  }
  getSubParams(t) {
    let s = this._subParamsIdx[t] >> 8, r = this._subParamsIdx[t] & 255;
    return r - s > 0 ? this._subParams.subarray(s, r) : null;
  }
  getSubParamsAll() {
    let t = {};
    for (let s = 0; s < this.length; ++s) {
      let r = this._subParamsIdx[s] >> 8, n = this._subParamsIdx[s] & 255;
      n - r > 0 && (t[s] = this._subParams.slice(r, n));
    }
    return t;
  }
  addDigit(t) {
    let s;
    if (this._rejectDigits || !(s = this._digitIsSub ? this._subParamsLength : this.length) || this._digitIsSub && this._rejectSubDigits) return;
    let r = this._digitIsSub ? this._subParams : this.params, n = r[s - 1];
    r[s - 1] = ~n ? Math.min(n * 10 + t, Ls) : t;
  }
}, Ms = [], H_ = class {
  constructor() {
    this._state = 0, this._active = Ms, this._id = -1, this._handlers = /* @__PURE__ */ Object.create(null), this._handlerFb = () => {
    }, this._stack = { paused: !1, loopPosition: 0, fallThrough: !1 };
  }
  registerHandler(e, t) {
    this._handlers[e] === void 0 && (this._handlers[e] = []);
    let s = this._handlers[e];
    return s.push(t), { dispose: () => {
      let r = s.indexOf(t);
      r !== -1 && s.splice(r, 1);
    } };
  }
  clearHandler(e) {
    this._handlers[e] && delete this._handlers[e];
  }
  setHandlerFallback(e) {
    this._handlerFb = e;
  }
  dispose() {
    this._handlers = /* @__PURE__ */ Object.create(null), this._handlerFb = () => {
    }, this._active = Ms;
  }
  reset() {
    if (this._state === 2) for (let e = this._stack.paused ? this._stack.loopPosition - 1 : this._active.length - 1; e >= 0; --e) this._active[e].end(!1);
    this._stack.paused = !1, this._active = Ms, this._id = -1, this._state = 0;
  }
  _start() {
    if (this._active = this._handlers[this._id] || Ms, !this._active.length) this._handlerFb(this._id, "START");
    else for (let e = this._active.length - 1; e >= 0; e--) this._active[e].start();
  }
  _put(e, t, s) {
    if (!this._active.length) this._handlerFb(this._id, "PUT", Br(e, t, s));
    else for (let r = this._active.length - 1; r >= 0; r--) this._active[r].put(e, t, s);
  }
  start() {
    this.reset(), this._state = 1;
  }
  put(e, t, s) {
    if (this._state !== 3) {
      if (this._state === 1) for (; t < s; ) {
        let r = e[t++];
        if (r === 59) {
          this._state = 2, this._start();
          break;
        }
        if (r < 48 || 57 < r) {
          this._state = 3;
          return;
        }
        this._id === -1 && (this._id = 0), this._id = this._id * 10 + r - 48;
      }
      this._state === 2 && s - t > 0 && this._put(e, t, s);
    }
  }
  end(e, t = !0) {
    if (this._state !== 0) {
      if (this._state !== 3) if (this._state === 1 && this._start(), !this._active.length) this._handlerFb(this._id, "END", e);
      else {
        let s = !1, r = this._active.length - 1, n = !1;
        if (this._stack.paused && (r = this._stack.loopPosition - 1, s = t, n = this._stack.fallThrough, this._stack.paused = !1), !n && s === !1) {
          for (; r >= 0 && (s = this._active[r].end(e), s !== !0); r--) if (s instanceof Promise) return this._stack.paused = !0, this._stack.loopPosition = r, this._stack.fallThrough = !1, s;
          r--;
        }
        for (; r >= 0; r--) if (s = this._active[r].end(!1), s instanceof Promise) return this._stack.paused = !0, this._stack.loopPosition = r, this._stack.fallThrough = !0, s;
      }
      this._active = Ms, this._id = -1, this._state = 0;
    }
  }
}, kt = class {
  constructor(e) {
    this._handler = e, this._data = "", this._hitLimit = !1;
  }
  start() {
    this._data = "", this._hitLimit = !1;
  }
  put(e, t, s) {
    this._hitLimit || (this._data += Br(e, t, s), this._data.length > 1e7 && (this._data = "", this._hitLimit = !0));
  }
  end(e) {
    let t = !1;
    if (this._hitLimit) t = !1;
    else if (e && (t = this._handler(this._data), t instanceof Promise)) return t.then((s) => (this._data = "", this._hitLimit = !1, s));
    return this._data = "", this._hitLimit = !1, t;
  }
}, Es = [], U_ = class {
  constructor() {
    this._handlers = /* @__PURE__ */ Object.create(null), this._active = Es, this._ident = 0, this._handlerFb = () => {
    }, this._stack = { paused: !1, loopPosition: 0, fallThrough: !1 };
  }
  dispose() {
    this._handlers = /* @__PURE__ */ Object.create(null), this._handlerFb = () => {
    }, this._active = Es;
  }
  registerHandler(e, t) {
    this._handlers[e] === void 0 && (this._handlers[e] = []);
    let s = this._handlers[e];
    return s.push(t), { dispose: () => {
      let r = s.indexOf(t);
      r !== -1 && s.splice(r, 1);
    } };
  }
  clearHandler(e) {
    this._handlers[e] && delete this._handlers[e];
  }
  setHandlerFallback(e) {
    this._handlerFb = e;
  }
  reset() {
    if (this._active.length) for (let e = this._stack.paused ? this._stack.loopPosition - 1 : this._active.length - 1; e >= 0; --e) this._active[e].unhook(!1);
    this._stack.paused = !1, this._active = Es, this._ident = 0;
  }
  hook(e, t) {
    if (this.reset(), this._ident = e, this._active = this._handlers[e] || Es, !this._active.length) this._handlerFb(this._ident, "HOOK", t);
    else for (let s = this._active.length - 1; s >= 0; s--) this._active[s].hook(t);
  }
  put(e, t, s) {
    if (!this._active.length) this._handlerFb(this._ident, "PUT", Br(e, t, s));
    else for (let r = this._active.length - 1; r >= 0; r--) this._active[r].put(e, t, s);
  }
  unhook(e, t = !0) {
    if (!this._active.length) this._handlerFb(this._ident, "UNHOOK", e);
    else {
      let s = !1, r = this._active.length - 1, n = !1;
      if (this._stack.paused && (r = this._stack.loopPosition - 1, s = t, n = this._stack.fallThrough, this._stack.paused = !1), !n && s === !1) {
        for (; r >= 0 && (s = this._active[r].unhook(e), s !== !0); r--) if (s instanceof Promise) return this._stack.paused = !0, this._stack.loopPosition = r, this._stack.fallThrough = !1, s;
        r--;
      }
      for (; r >= 0; r--) if (s = this._active[r].unhook(!1), s instanceof Promise) return this._stack.paused = !0, this._stack.loopPosition = r, this._stack.fallThrough = !0, s;
    }
    this._active = Es, this._ident = 0;
  }
}, Is = new zh();
Is.addParam(0);
var Ua = class {
  constructor(e) {
    this._handler = e, this._data = "", this._params = Is, this._hitLimit = !1;
  }
  hook(e) {
    this._params = e.length > 1 || e.params[0] ? e.clone() : Is, this._data = "", this._hitLimit = !1;
  }
  put(e, t, s) {
    this._hitLimit || (this._data += Br(e, t, s), this._data.length > 1e7 && (this._data = "", this._hitLimit = !0));
  }
  unhook(e) {
    let t = !1;
    if (this._hitLimit) t = !1;
    else if (e && (t = this._handler(this._data, this._params), t instanceof Promise)) return t.then((s) => (this._params = Is, this._data = "", this._hitLimit = !1, s));
    return this._params = Is, this._data = "", this._hitLimit = !1, t;
  }
}, K_ = class {
  constructor(e) {
    this.table = new Uint8Array(e);
  }
  setDefault(e, t) {
    this.table.fill(e << 4 | t);
  }
  add(e, t, s, r) {
    this.table[t << 8 | e] = s << 4 | r;
  }
  addMany(e, t, s, r) {
    for (let n = 0; n < e.length; n++) this.table[t << 8 | e[n]] = s << 4 | r;
  }
}, Bt = 160, V_ = function() {
  let e = new K_(4095), t = Array.apply(null, Array(256)).map((l, c) => c), s = (l, c) => t.slice(l, c), r = s(32, 127), n = s(0, 24);
  n.push(25), n.push.apply(n, s(28, 32));
  let o = s(0, 14), a;
  e.setDefault(1, 0), e.addMany(r, 0, 2, 0);
  for (a in o) e.addMany([24, 26, 153, 154], a, 3, 0), e.addMany(s(128, 144), a, 3, 0), e.addMany(s(144, 152), a, 3, 0), e.add(156, a, 0, 0), e.add(27, a, 11, 1), e.add(157, a, 4, 8), e.addMany([152, 158, 159], a, 0, 7), e.add(155, a, 11, 3), e.add(144, a, 11, 9);
  return e.addMany(n, 0, 3, 0), e.addMany(n, 1, 3, 1), e.add(127, 1, 0, 1), e.addMany(n, 8, 0, 8), e.addMany(n, 3, 3, 3), e.add(127, 3, 0, 3), e.addMany(n, 4, 3, 4), e.add(127, 4, 0, 4), e.addMany(n, 6, 3, 6), e.addMany(n, 5, 3, 5), e.add(127, 5, 0, 5), e.addMany(n, 2, 3, 2), e.add(127, 2, 0, 2), e.add(93, 1, 4, 8), e.addMany(r, 8, 5, 8), e.add(127, 8, 5, 8), e.addMany([156, 27, 24, 26, 7], 8, 6, 0), e.addMany(s(28, 32), 8, 0, 8), e.addMany([88, 94, 95], 1, 0, 7), e.addMany(r, 7, 0, 7), e.addMany(n, 7, 0, 7), e.add(156, 7, 0, 0), e.add(127, 7, 0, 7), e.add(91, 1, 11, 3), e.addMany(s(64, 127), 3, 7, 0), e.addMany(s(48, 60), 3, 8, 4), e.addMany([60, 61, 62, 63], 3, 9, 4), e.addMany(s(48, 60), 4, 8, 4), e.addMany(s(64, 127), 4, 7, 0), e.addMany([60, 61, 62, 63], 4, 0, 6), e.addMany(s(32, 64), 6, 0, 6), e.add(127, 6, 0, 6), e.addMany(s(64, 127), 6, 0, 0), e.addMany(s(32, 48), 3, 9, 5), e.addMany(s(32, 48), 5, 9, 5), e.addMany(s(48, 64), 5, 0, 6), e.addMany(s(64, 127), 5, 7, 0), e.addMany(s(32, 48), 4, 9, 5), e.addMany(s(32, 48), 1, 9, 2), e.addMany(s(32, 48), 2, 9, 2), e.addMany(s(48, 127), 2, 10, 0), e.addMany(s(48, 80), 1, 10, 0), e.addMany(s(81, 88), 1, 10, 0), e.addMany([89, 90, 92], 1, 10, 0), e.addMany(s(96, 127), 1, 10, 0), e.add(80, 1, 11, 9), e.addMany(n, 9, 0, 9), e.add(127, 9, 0, 9), e.addMany(s(28, 32), 9, 0, 9), e.addMany(s(32, 48), 9, 9, 12), e.addMany(s(48, 60), 9, 8, 10), e.addMany([60, 61, 62, 63], 9, 9, 10), e.addMany(n, 11, 0, 11), e.addMany(s(32, 128), 11, 0, 11), e.addMany(s(28, 32), 11, 0, 11), e.addMany(n, 10, 0, 10), e.add(127, 10, 0, 10), e.addMany(s(28, 32), 10, 0, 10), e.addMany(s(48, 60), 10, 8, 10), e.addMany([60, 61, 62, 63], 10, 0, 11), e.addMany(s(32, 48), 10, 9, 12), e.addMany(n, 12, 0, 12), e.add(127, 12, 0, 12), e.addMany(s(28, 32), 12, 0, 12), e.addMany(s(32, 48), 12, 9, 12), e.addMany(s(48, 64), 12, 0, 11), e.addMany(s(64, 127), 12, 12, 13), e.addMany(s(64, 127), 10, 12, 13), e.addMany(s(64, 127), 9, 12, 13), e.addMany(n, 13, 13, 13), e.addMany(r, 13, 13, 13), e.add(127, 13, 0, 13), e.addMany([27, 156, 24, 26], 13, 14, 0), e.add(Bt, 0, 2, 0), e.add(Bt, 8, 5, 8), e.add(Bt, 6, 0, 6), e.add(Bt, 11, 0, 11), e.add(Bt, 13, 13, 13), e;
}(), q_ = class extends ue {
  constructor(e = V_) {
    super(), this._transitions = e, this._parseStack = { state: 0, handlers: [], handlerPos: 0, transition: 0, chunkPos: 0 }, this.initialState = 0, this.currentState = this.initialState, this._params = new zh(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0, this._printHandlerFb = (t, s, r) => {
    }, this._executeHandlerFb = (t) => {
    }, this._csiHandlerFb = (t, s) => {
    }, this._escHandlerFb = (t) => {
    }, this._errorHandlerFb = (t) => t, this._printHandler = this._printHandlerFb, this._executeHandlers = /* @__PURE__ */ Object.create(null), this._csiHandlers = /* @__PURE__ */ Object.create(null), this._escHandlers = /* @__PURE__ */ Object.create(null), this._register(Ae(() => {
      this._csiHandlers = /* @__PURE__ */ Object.create(null), this._executeHandlers = /* @__PURE__ */ Object.create(null), this._escHandlers = /* @__PURE__ */ Object.create(null);
    })), this._oscParser = this._register(new H_()), this._dcsParser = this._register(new U_()), this._errorHandler = this._errorHandlerFb, this.registerEscHandler({ final: "\\" }, () => !0);
  }
  _identifier(e, t = [64, 126]) {
    let s = 0;
    if (e.prefix) {
      if (e.prefix.length > 1) throw new Error("only one byte as prefix supported");
      if (s = e.prefix.charCodeAt(0), s && 60 > s || s > 63) throw new Error("prefix must be in range 0x3c .. 0x3f");
    }
    if (e.intermediates) {
      if (e.intermediates.length > 2) throw new Error("only two bytes as intermediates are supported");
      for (let n = 0; n < e.intermediates.length; ++n) {
        let o = e.intermediates.charCodeAt(n);
        if (32 > o || o > 47) throw new Error("intermediate must be in range 0x20 .. 0x2f");
        s <<= 8, s |= o;
      }
    }
    if (e.final.length !== 1) throw new Error("final must be a single byte");
    let r = e.final.charCodeAt(0);
    if (t[0] > r || r > t[1]) throw new Error(`final must be in range ${t[0]} .. ${t[1]}`);
    return s <<= 8, s |= r, s;
  }
  identToString(e) {
    let t = [];
    for (; e; ) t.push(String.fromCharCode(e & 255)), e >>= 8;
    return t.reverse().join("");
  }
  setPrintHandler(e) {
    this._printHandler = e;
  }
  clearPrintHandler() {
    this._printHandler = this._printHandlerFb;
  }
  registerEscHandler(e, t) {
    let s = this._identifier(e, [48, 126]);
    this._escHandlers[s] === void 0 && (this._escHandlers[s] = []);
    let r = this._escHandlers[s];
    return r.push(t), { dispose: () => {
      let n = r.indexOf(t);
      n !== -1 && r.splice(n, 1);
    } };
  }
  clearEscHandler(e) {
    this._escHandlers[this._identifier(e, [48, 126])] && delete this._escHandlers[this._identifier(e, [48, 126])];
  }
  setEscHandlerFallback(e) {
    this._escHandlerFb = e;
  }
  setExecuteHandler(e, t) {
    this._executeHandlers[e.charCodeAt(0)] = t;
  }
  clearExecuteHandler(e) {
    this._executeHandlers[e.charCodeAt(0)] && delete this._executeHandlers[e.charCodeAt(0)];
  }
  setExecuteHandlerFallback(e) {
    this._executeHandlerFb = e;
  }
  registerCsiHandler(e, t) {
    let s = this._identifier(e);
    this._csiHandlers[s] === void 0 && (this._csiHandlers[s] = []);
    let r = this._csiHandlers[s];
    return r.push(t), { dispose: () => {
      let n = r.indexOf(t);
      n !== -1 && r.splice(n, 1);
    } };
  }
  clearCsiHandler(e) {
    this._csiHandlers[this._identifier(e)] && delete this._csiHandlers[this._identifier(e)];
  }
  setCsiHandlerFallback(e) {
    this._csiHandlerFb = e;
  }
  registerDcsHandler(e, t) {
    return this._dcsParser.registerHandler(this._identifier(e), t);
  }
  clearDcsHandler(e) {
    this._dcsParser.clearHandler(this._identifier(e));
  }
  setDcsHandlerFallback(e) {
    this._dcsParser.setHandlerFallback(e);
  }
  registerOscHandler(e, t) {
    return this._oscParser.registerHandler(e, t);
  }
  clearOscHandler(e) {
    this._oscParser.clearHandler(e);
  }
  setOscHandlerFallback(e) {
    this._oscParser.setHandlerFallback(e);
  }
  setErrorHandler(e) {
    this._errorHandler = e;
  }
  clearErrorHandler() {
    this._errorHandler = this._errorHandlerFb;
  }
  reset() {
    this.currentState = this.initialState, this._oscParser.reset(), this._dcsParser.reset(), this._params.reset(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0, this._parseStack.state !== 0 && (this._parseStack.state = 2, this._parseStack.handlers = []);
  }
  _preserveStack(e, t, s, r, n) {
    this._parseStack.state = e, this._parseStack.handlers = t, this._parseStack.handlerPos = s, this._parseStack.transition = r, this._parseStack.chunkPos = n;
  }
  parse(e, t, s) {
    let r = 0, n = 0, o = 0, a;
    if (this._parseStack.state) if (this._parseStack.state === 2) this._parseStack.state = 0, o = this._parseStack.chunkPos + 1;
    else {
      if (s === void 0 || this._parseStack.state === 1) throw this._parseStack.state = 1, new Error("improper continuation due to previous async handler, giving up parsing");
      let l = this._parseStack.handlers, c = this._parseStack.handlerPos - 1;
      switch (this._parseStack.state) {
        case 3:
          if (s === !1 && c > -1) {
            for (; c >= 0 && (a = l[c](this._params), a !== !0); c--) if (a instanceof Promise) return this._parseStack.handlerPos = c, a;
          }
          this._parseStack.handlers = [];
          break;
        case 4:
          if (s === !1 && c > -1) {
            for (; c >= 0 && (a = l[c](), a !== !0); c--) if (a instanceof Promise) return this._parseStack.handlerPos = c, a;
          }
          this._parseStack.handlers = [];
          break;
        case 6:
          if (r = e[this._parseStack.chunkPos], a = this._dcsParser.unhook(r !== 24 && r !== 26, s), a) return a;
          r === 27 && (this._parseStack.transition |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0;
          break;
        case 5:
          if (r = e[this._parseStack.chunkPos], a = this._oscParser.end(r !== 24 && r !== 26, s), a) return a;
          r === 27 && (this._parseStack.transition |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0;
          break;
      }
      this._parseStack.state = 0, o = this._parseStack.chunkPos + 1, this.precedingJoinState = 0, this.currentState = this._parseStack.transition & 15;
    }
    for (let l = o; l < t; ++l) {
      switch (r = e[l], n = this._transitions.table[this.currentState << 8 | (r < 160 ? r : Bt)], n >> 4) {
        case 2:
          for (let f = l + 1; ; ++f) {
            if (f >= t || (r = e[f]) < 32 || r > 126 && r < Bt) {
              this._printHandler(e, l, f), l = f - 1;
              break;
            }
            if (++f >= t || (r = e[f]) < 32 || r > 126 && r < Bt) {
              this._printHandler(e, l, f), l = f - 1;
              break;
            }
            if (++f >= t || (r = e[f]) < 32 || r > 126 && r < Bt) {
              this._printHandler(e, l, f), l = f - 1;
              break;
            }
            if (++f >= t || (r = e[f]) < 32 || r > 126 && r < Bt) {
              this._printHandler(e, l, f), l = f - 1;
              break;
            }
          }
          break;
        case 3:
          this._executeHandlers[r] ? this._executeHandlers[r]() : this._executeHandlerFb(r), this.precedingJoinState = 0;
          break;
        case 0:
          break;
        case 1:
          if (this._errorHandler({ position: l, code: r, currentState: this.currentState, collect: this._collect, params: this._params, abort: !1 }).abort) return;
          break;
        case 7:
          let c = this._csiHandlers[this._collect << 8 | r], h = c ? c.length - 1 : -1;
          for (; h >= 0 && (a = c[h](this._params), a !== !0); h--) if (a instanceof Promise) return this._preserveStack(3, c, h, n, l), a;
          h < 0 && this._csiHandlerFb(this._collect << 8 | r, this._params), this.precedingJoinState = 0;
          break;
        case 8:
          do
            switch (r) {
              case 59:
                this._params.addParam(0);
                break;
              case 58:
                this._params.addSubParam(-1);
                break;
              default:
                this._params.addDigit(r - 48);
            }
          while (++l < t && (r = e[l]) > 47 && r < 60);
          l--;
          break;
        case 9:
          this._collect <<= 8, this._collect |= r;
          break;
        case 10:
          let d = this._escHandlers[this._collect << 8 | r], u = d ? d.length - 1 : -1;
          for (; u >= 0 && (a = d[u](), a !== !0); u--) if (a instanceof Promise) return this._preserveStack(4, d, u, n, l), a;
          u < 0 && this._escHandlerFb(this._collect << 8 | r), this.precedingJoinState = 0;
          break;
        case 11:
          this._params.reset(), this._params.addParam(0), this._collect = 0;
          break;
        case 12:
          this._dcsParser.hook(this._collect << 8 | r, this._params);
          break;
        case 13:
          for (let f = l + 1; ; ++f) if (f >= t || (r = e[f]) === 24 || r === 26 || r === 27 || r > 127 && r < Bt) {
            this._dcsParser.put(e, l, f), l = f - 1;
            break;
          }
          break;
        case 14:
          if (a = this._dcsParser.unhook(r !== 24 && r !== 26), a) return this._preserveStack(6, [], 0, n, l), a;
          r === 27 && (n |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0;
          break;
        case 4:
          this._oscParser.start();
          break;
        case 5:
          for (let f = l + 1; ; f++) if (f >= t || (r = e[f]) < 32 || r > 127 && r < Bt) {
            this._oscParser.put(e, l, f), l = f - 1;
            break;
          }
          break;
        case 6:
          if (a = this._oscParser.end(r !== 24 && r !== 26), a) return this._preserveStack(5, [], 0, n, l), a;
          r === 27 && (n |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0;
          break;
      }
      this.currentState = n & 15;
    }
  }
}, Y_ = /^([\da-f])\/([\da-f])\/([\da-f])$|^([\da-f]{2})\/([\da-f]{2})\/([\da-f]{2})$|^([\da-f]{3})\/([\da-f]{3})\/([\da-f]{3})$|^([\da-f]{4})\/([\da-f]{4})\/([\da-f]{4})$/, j_ = /^[\da-f]+$/;
function Ka(e) {
  if (!e) return;
  let t = e.toLowerCase();
  if (t.indexOf("rgb:") === 0) {
    t = t.slice(4);
    let s = Y_.exec(t);
    if (s) {
      let r = s[1] ? 15 : s[4] ? 255 : s[7] ? 4095 : 65535;
      return [Math.round(parseInt(s[1] || s[4] || s[7] || s[10], 16) / r * 255), Math.round(parseInt(s[2] || s[5] || s[8] || s[11], 16) / r * 255), Math.round(parseInt(s[3] || s[6] || s[9] || s[12], 16) / r * 255)];
    }
  } else if (t.indexOf("#") === 0 && (t = t.slice(1), j_.exec(t) && [3, 6, 9, 12].includes(t.length))) {
    let s = t.length / 3, r = [0, 0, 0];
    for (let n = 0; n < 3; ++n) {
      let o = parseInt(t.slice(s * n, s * n + s), 16);
      r[n] = s === 1 ? o << 4 : s === 2 ? o : s === 3 ? o >> 4 : o >> 8;
    }
    return r;
  }
}
function tn(e, t) {
  let s = e.toString(16), r = s.length < 2 ? "0" + s : s;
  switch (t) {
    case 4:
      return s[0];
    case 8:
      return r;
    case 12:
      return (r + r).slice(0, 3);
    default:
      return r + r;
  }
}
function G_(e, t = 16) {
  let [s, r, n] = e;
  return `rgb:${tn(s, t)}/${tn(r, t)}/${tn(n, t)}`;
}
var X_ = { "(": 0, ")": 1, "*": 2, "+": 3, "-": 1, ".": 2 }, xi = 131072, Va = 10;
function qa(e, t) {
  if (e > 24) return t.setWinLines || !1;
  switch (e) {
    case 1:
      return !!t.restoreWin;
    case 2:
      return !!t.minimizeWin;
    case 3:
      return !!t.setWinPosition;
    case 4:
      return !!t.setWinSizePixels;
    case 5:
      return !!t.raiseWin;
    case 6:
      return !!t.lowerWin;
    case 7:
      return !!t.refreshWin;
    case 8:
      return !!t.setWinSizeChars;
    case 9:
      return !!t.maximizeWin;
    case 10:
      return !!t.fullscreenWin;
    case 11:
      return !!t.getWinState;
    case 13:
      return !!t.getWinPosition;
    case 14:
      return !!t.getWinSizePixels;
    case 15:
      return !!t.getScreenSizePixels;
    case 16:
      return !!t.getCellSizePixels;
    case 18:
      return !!t.getWinSizeChars;
    case 19:
      return !!t.getScreenSizeChars;
    case 20:
      return !!t.getIconTitle;
    case 21:
      return !!t.getWinTitle;
    case 22:
      return !!t.pushTitle;
    case 23:
      return !!t.popTitle;
    case 24:
      return !!t.setWinLines;
  }
  return !1;
}
var Ya = 5e3, ja = 0, Z_ = class extends ue {
  constructor(e, t, s, r, n, o, a, l, c = new q_()) {
    super(), this._bufferService = e, this._charsetService = t, this._coreService = s, this._logService = r, this._optionsService = n, this._oscLinkService = o, this._coreMouseService = a, this._unicodeService = l, this._parser = c, this._parseBuffer = new Uint32Array(4096), this._stringDecoder = new bd(), this._utf8Decoder = new yd(), this._windowTitle = "", this._iconName = "", this._windowTitleStack = [], this._iconNameStack = [], this._curAttrData = Ke.clone(), this._eraseAttrDataInternal = Ke.clone(), this._onRequestBell = this._register(new K()), this.onRequestBell = this._onRequestBell.event, this._onRequestRefreshRows = this._register(new K()), this.onRequestRefreshRows = this._onRequestRefreshRows.event, this._onRequestReset = this._register(new K()), this.onRequestReset = this._onRequestReset.event, this._onRequestSendFocus = this._register(new K()), this.onRequestSendFocus = this._onRequestSendFocus.event, this._onRequestSyncScrollBar = this._register(new K()), this.onRequestSyncScrollBar = this._onRequestSyncScrollBar.event, this._onRequestWindowsOptionsReport = this._register(new K()), this.onRequestWindowsOptionsReport = this._onRequestWindowsOptionsReport.event, this._onA11yChar = this._register(new K()), this.onA11yChar = this._onA11yChar.event, this._onA11yTab = this._register(new K()), this.onA11yTab = this._onA11yTab.event, this._onCursorMove = this._register(new K()), this.onCursorMove = this._onCursorMove.event, this._onLineFeed = this._register(new K()), this.onLineFeed = this._onLineFeed.event, this._onScroll = this._register(new K()), this.onScroll = this._onScroll.event, this._onTitleChange = this._register(new K()), this.onTitleChange = this._onTitleChange.event, this._onColor = this._register(new K()), this.onColor = this._onColor.event, this._parseStack = { paused: !1, cursorStartX: 0, cursorStartY: 0, decodedLength: 0, position: 0 }, this._specialColors = [256, 257, 258], this._register(this._parser), this._dirtyRowTracker = new lo(this._bufferService), this._activeBuffer = this._bufferService.buffer, this._register(this._bufferService.buffers.onBufferActivate((h) => this._activeBuffer = h.activeBuffer)), this._parser.setCsiHandlerFallback((h, d) => {
      this._logService.debug("Unknown CSI code: ", { identifier: this._parser.identToString(h), params: d.toArray() });
    }), this._parser.setEscHandlerFallback((h) => {
      this._logService.debug("Unknown ESC code: ", { identifier: this._parser.identToString(h) });
    }), this._parser.setExecuteHandlerFallback((h) => {
      this._logService.debug("Unknown EXECUTE code: ", { code: h });
    }), this._parser.setOscHandlerFallback((h, d, u) => {
      this._logService.debug("Unknown OSC code: ", { identifier: h, action: d, data: u });
    }), this._parser.setDcsHandlerFallback((h, d, u) => {
      d === "HOOK" && (u = u.toArray()), this._logService.debug("Unknown DCS code: ", { identifier: this._parser.identToString(h), action: d, payload: u });
    }), this._parser.setPrintHandler((h, d, u) => this.print(h, d, u)), this._parser.registerCsiHandler({ final: "@" }, (h) => this.insertChars(h)), this._parser.registerCsiHandler({ intermediates: " ", final: "@" }, (h) => this.scrollLeft(h)), this._parser.registerCsiHandler({ final: "A" }, (h) => this.cursorUp(h)), this._parser.registerCsiHandler({ intermediates: " ", final: "A" }, (h) => this.scrollRight(h)), this._parser.registerCsiHandler({ final: "B" }, (h) => this.cursorDown(h)), this._parser.registerCsiHandler({ final: "C" }, (h) => this.cursorForward(h)), this._parser.registerCsiHandler({ final: "D" }, (h) => this.cursorBackward(h)), this._parser.registerCsiHandler({ final: "E" }, (h) => this.cursorNextLine(h)), this._parser.registerCsiHandler({ final: "F" }, (h) => this.cursorPrecedingLine(h)), this._parser.registerCsiHandler({ final: "G" }, (h) => this.cursorCharAbsolute(h)), this._parser.registerCsiHandler({ final: "H" }, (h) => this.cursorPosition(h)), this._parser.registerCsiHandler({ final: "I" }, (h) => this.cursorForwardTab(h)), this._parser.registerCsiHandler({ final: "J" }, (h) => this.eraseInDisplay(h, !1)), this._parser.registerCsiHandler({ prefix: "?", final: "J" }, (h) => this.eraseInDisplay(h, !0)), this._parser.registerCsiHandler({ final: "K" }, (h) => this.eraseInLine(h, !1)), this._parser.registerCsiHandler({ prefix: "?", final: "K" }, (h) => this.eraseInLine(h, !0)), this._parser.registerCsiHandler({ final: "L" }, (h) => this.insertLines(h)), this._parser.registerCsiHandler({ final: "M" }, (h) => this.deleteLines(h)), this._parser.registerCsiHandler({ final: "P" }, (h) => this.deleteChars(h)), this._parser.registerCsiHandler({ final: "S" }, (h) => this.scrollUp(h)), this._parser.registerCsiHandler({ final: "T" }, (h) => this.scrollDown(h)), this._parser.registerCsiHandler({ final: "X" }, (h) => this.eraseChars(h)), this._parser.registerCsiHandler({ final: "Z" }, (h) => this.cursorBackwardTab(h)), this._parser.registerCsiHandler({ final: "`" }, (h) => this.charPosAbsolute(h)), this._parser.registerCsiHandler({ final: "a" }, (h) => this.hPositionRelative(h)), this._parser.registerCsiHandler({ final: "b" }, (h) => this.repeatPrecedingCharacter(h)), this._parser.registerCsiHandler({ final: "c" }, (h) => this.sendDeviceAttributesPrimary(h)), this._parser.registerCsiHandler({ prefix: ">", final: "c" }, (h) => this.sendDeviceAttributesSecondary(h)), this._parser.registerCsiHandler({ final: "d" }, (h) => this.linePosAbsolute(h)), this._parser.registerCsiHandler({ final: "e" }, (h) => this.vPositionRelative(h)), this._parser.registerCsiHandler({ final: "f" }, (h) => this.hVPosition(h)), this._parser.registerCsiHandler({ final: "g" }, (h) => this.tabClear(h)), this._parser.registerCsiHandler({ final: "h" }, (h) => this.setMode(h)), this._parser.registerCsiHandler({ prefix: "?", final: "h" }, (h) => this.setModePrivate(h)), this._parser.registerCsiHandler({ final: "l" }, (h) => this.resetMode(h)), this._parser.registerCsiHandler({ prefix: "?", final: "l" }, (h) => this.resetModePrivate(h)), this._parser.registerCsiHandler({ final: "m" }, (h) => this.charAttributes(h)), this._parser.registerCsiHandler({ final: "n" }, (h) => this.deviceStatus(h)), this._parser.registerCsiHandler({ prefix: "?", final: "n" }, (h) => this.deviceStatusPrivate(h)), this._parser.registerCsiHandler({ intermediates: "!", final: "p" }, (h) => this.softReset(h)), this._parser.registerCsiHandler({ intermediates: " ", final: "q" }, (h) => this.setCursorStyle(h)), this._parser.registerCsiHandler({ final: "r" }, (h) => this.setScrollRegion(h)), this._parser.registerCsiHandler({ final: "s" }, (h) => this.saveCursor(h)), this._parser.registerCsiHandler({ final: "t" }, (h) => this.windowOptions(h)), this._parser.registerCsiHandler({ final: "u" }, (h) => this.restoreCursor(h)), this._parser.registerCsiHandler({ intermediates: "'", final: "}" }, (h) => this.insertColumns(h)), this._parser.registerCsiHandler({ intermediates: "'", final: "~" }, (h) => this.deleteColumns(h)), this._parser.registerCsiHandler({ intermediates: '"', final: "q" }, (h) => this.selectProtected(h)), this._parser.registerCsiHandler({ intermediates: "$", final: "p" }, (h) => this.requestMode(h, !0)), this._parser.registerCsiHandler({ prefix: "?", intermediates: "$", final: "p" }, (h) => this.requestMode(h, !1)), this._parser.setExecuteHandler(O.BEL, () => this.bell()), this._parser.setExecuteHandler(O.LF, () => this.lineFeed()), this._parser.setExecuteHandler(O.VT, () => this.lineFeed()), this._parser.setExecuteHandler(O.FF, () => this.lineFeed()), this._parser.setExecuteHandler(O.CR, () => this.carriageReturn()), this._parser.setExecuteHandler(O.BS, () => this.backspace()), this._parser.setExecuteHandler(O.HT, () => this.tab()), this._parser.setExecuteHandler(O.SO, () => this.shiftOut()), this._parser.setExecuteHandler(O.SI, () => this.shiftIn()), this._parser.setExecuteHandler(zs.IND, () => this.index()), this._parser.setExecuteHandler(zs.NEL, () => this.nextLine()), this._parser.setExecuteHandler(zs.HTS, () => this.tabSet()), this._parser.registerOscHandler(0, new kt((h) => (this.setTitle(h), this.setIconName(h), !0))), this._parser.registerOscHandler(1, new kt((h) => this.setIconName(h))), this._parser.registerOscHandler(2, new kt((h) => this.setTitle(h))), this._parser.registerOscHandler(4, new kt((h) => this.setOrReportIndexedColor(h))), this._parser.registerOscHandler(8, new kt((h) => this.setHyperlink(h))), this._parser.registerOscHandler(10, new kt((h) => this.setOrReportFgColor(h))), this._parser.registerOscHandler(11, new kt((h) => this.setOrReportBgColor(h))), this._parser.registerOscHandler(12, new kt((h) => this.setOrReportCursorColor(h))), this._parser.registerOscHandler(104, new kt((h) => this.restoreIndexedColor(h))), this._parser.registerOscHandler(110, new kt((h) => this.restoreFgColor(h))), this._parser.registerOscHandler(111, new kt((h) => this.restoreBgColor(h))), this._parser.registerOscHandler(112, new kt((h) => this.restoreCursorColor(h))), this._parser.registerEscHandler({ final: "7" }, () => this.saveCursor()), this._parser.registerEscHandler({ final: "8" }, () => this.restoreCursor()), this._parser.registerEscHandler({ final: "D" }, () => this.index()), this._parser.registerEscHandler({ final: "E" }, () => this.nextLine()), this._parser.registerEscHandler({ final: "H" }, () => this.tabSet()), this._parser.registerEscHandler({ final: "M" }, () => this.reverseIndex()), this._parser.registerEscHandler({ final: "=" }, () => this.keypadApplicationMode()), this._parser.registerEscHandler({ final: ">" }, () => this.keypadNumericMode()), this._parser.registerEscHandler({ final: "c" }, () => this.fullReset()), this._parser.registerEscHandler({ final: "n" }, () => this.setgLevel(2)), this._parser.registerEscHandler({ final: "o" }, () => this.setgLevel(3)), this._parser.registerEscHandler({ final: "|" }, () => this.setgLevel(3)), this._parser.registerEscHandler({ final: "}" }, () => this.setgLevel(2)), this._parser.registerEscHandler({ final: "~" }, () => this.setgLevel(1)), this._parser.registerEscHandler({ intermediates: "%", final: "@" }, () => this.selectDefaultCharset()), this._parser.registerEscHandler({ intermediates: "%", final: "G" }, () => this.selectDefaultCharset());
    for (let h in je) this._parser.registerEscHandler({ intermediates: "(", final: h }, () => this.selectCharset("(" + h)), this._parser.registerEscHandler({ intermediates: ")", final: h }, () => this.selectCharset(")" + h)), this._parser.registerEscHandler({ intermediates: "*", final: h }, () => this.selectCharset("*" + h)), this._parser.registerEscHandler({ intermediates: "+", final: h }, () => this.selectCharset("+" + h)), this._parser.registerEscHandler({ intermediates: "-", final: h }, () => this.selectCharset("-" + h)), this._parser.registerEscHandler({ intermediates: ".", final: h }, () => this.selectCharset("." + h)), this._parser.registerEscHandler({ intermediates: "/", final: h }, () => this.selectCharset("/" + h));
    this._parser.registerEscHandler({ intermediates: "#", final: "8" }, () => this.screenAlignmentPattern()), this._parser.setErrorHandler((h) => (this._logService.error("Parsing error: ", h), h)), this._parser.registerDcsHandler({ intermediates: "$", final: "q" }, new Ua((h, d) => this.requestStatusString(h, d)));
  }
  getAttrData() {
    return this._curAttrData;
  }
  _preserveStack(e, t, s, r) {
    this._parseStack.paused = !0, this._parseStack.cursorStartX = e, this._parseStack.cursorStartY = t, this._parseStack.decodedLength = s, this._parseStack.position = r;
  }
  _logSlowResolvingAsync(e) {
    this._logService.logLevel <= 3 && Promise.race([e, new Promise((t, s) => setTimeout(() => s("#SLOW_TIMEOUT"), Ya))]).catch((t) => {
      if (t !== "#SLOW_TIMEOUT") throw t;
      console.warn(`async parser handler taking longer than ${Ya} ms`);
    });
  }
  _getCurrentLinkId() {
    return this._curAttrData.extended.urlId;
  }
  parse(e, t) {
    let s, r = this._activeBuffer.x, n = this._activeBuffer.y, o = 0, a = this._parseStack.paused;
    if (a) {
      if (s = this._parser.parse(this._parseBuffer, this._parseStack.decodedLength, t)) return this._logSlowResolvingAsync(s), s;
      r = this._parseStack.cursorStartX, n = this._parseStack.cursorStartY, this._parseStack.paused = !1, e.length > xi && (o = this._parseStack.position + xi);
    }
    if (this._logService.logLevel <= 1 && this._logService.debug(`parsing data ${typeof e == "string" ? ` "${e}"` : ` "${Array.prototype.map.call(e, (h) => String.fromCharCode(h)).join("")}"`}`), this._logService.logLevel === 0 && this._logService.trace("parsing data (codes)", typeof e == "string" ? e.split("").map((h) => h.charCodeAt(0)) : e), this._parseBuffer.length < e.length && this._parseBuffer.length < xi && (this._parseBuffer = new Uint32Array(Math.min(e.length, xi))), a || this._dirtyRowTracker.clearRange(), e.length > xi) for (let h = o; h < e.length; h += xi) {
      let d = h + xi < e.length ? h + xi : e.length, u = typeof e == "string" ? this._stringDecoder.decode(e.substring(h, d), this._parseBuffer) : this._utf8Decoder.decode(e.subarray(h, d), this._parseBuffer);
      if (s = this._parser.parse(this._parseBuffer, u)) return this._preserveStack(r, n, u, h), this._logSlowResolvingAsync(s), s;
    }
    else if (!a) {
      let h = typeof e == "string" ? this._stringDecoder.decode(e, this._parseBuffer) : this._utf8Decoder.decode(e, this._parseBuffer);
      if (s = this._parser.parse(this._parseBuffer, h)) return this._preserveStack(r, n, h, 0), this._logSlowResolvingAsync(s), s;
    }
    (this._activeBuffer.x !== r || this._activeBuffer.y !== n) && this._onCursorMove.fire();
    let l = this._dirtyRowTracker.end + (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp), c = this._dirtyRowTracker.start + (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
    c < this._bufferService.rows && this._onRequestRefreshRows.fire({ start: Math.min(c, this._bufferService.rows - 1), end: Math.min(l, this._bufferService.rows - 1) });
  }
  print(e, t, s) {
    let r, n, o = this._charsetService.charset, a = this._optionsService.rawOptions.screenReaderMode, l = this._bufferService.cols, c = this._coreService.decPrivateModes.wraparound, h = this._coreService.modes.insertMode, d = this._curAttrData, u = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
    this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._activeBuffer.x && s - t > 0 && u.getWidth(this._activeBuffer.x - 1) === 2 && u.setCellFromCodepoint(this._activeBuffer.x - 1, 0, 1, d);
    let f = this._parser.precedingJoinState;
    for (let _ = t; _ < s; ++_) {
      if (r = e[_], r < 127 && o) {
        let R = o[String.fromCharCode(r)];
        R && (r = R.charCodeAt(0));
      }
      let g = this._unicodeService.charProperties(r, f);
      n = $i.extractWidth(g);
      let y = $i.extractShouldJoin(g), D = y ? $i.extractWidth(f) : 0;
      if (f = g, a && this._onA11yChar.fire(Di(r)), this._getCurrentLinkId() && this._oscLinkService.addLineToLink(this._getCurrentLinkId(), this._activeBuffer.ybase + this._activeBuffer.y), this._activeBuffer.x + n - D > l) {
        if (c) {
          let R = u, H = this._activeBuffer.x - D;
          for (this._activeBuffer.x = D, this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData(), !0)) : (this._activeBuffer.y >= this._bufferService.rows && (this._activeBuffer.y = this._bufferService.rows - 1), this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = !0), u = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y), D > 0 && u instanceof Ns && u.copyCellsFrom(R, H, 0, D, !1); H < l; ) R.setCellFromCodepoint(H++, 0, 1, d);
        } else if (this._activeBuffer.x = l - 1, n === 2) continue;
      }
      if (y && this._activeBuffer.x) {
        let R = u.getWidth(this._activeBuffer.x - 1) ? 1 : 2;
        u.addCodepointToCell(this._activeBuffer.x - R, r, n);
        for (let H = n - D; --H >= 0; ) u.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, d);
        continue;
      }
      if (h && (u.insertCells(this._activeBuffer.x, n - D, this._activeBuffer.getNullCell(d)), u.getWidth(l - 1) === 2 && u.setCellFromCodepoint(l - 1, 0, 1, d)), u.setCellFromCodepoint(this._activeBuffer.x++, r, n, d), n > 0) for (; --n; ) u.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, d);
    }
    this._parser.precedingJoinState = f, this._activeBuffer.x < l && s - t > 0 && u.getWidth(this._activeBuffer.x) === 0 && !u.hasContent(this._activeBuffer.x) && u.setCellFromCodepoint(this._activeBuffer.x, 0, 1, d), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
  }
  registerCsiHandler(e, t) {
    return e.final === "t" && !e.prefix && !e.intermediates ? this._parser.registerCsiHandler(e, (s) => qa(s.params[0], this._optionsService.rawOptions.windowOptions) ? t(s) : !0) : this._parser.registerCsiHandler(e, t);
  }
  registerDcsHandler(e, t) {
    return this._parser.registerDcsHandler(e, new Ua(t));
  }
  registerEscHandler(e, t) {
    return this._parser.registerEscHandler(e, t);
  }
  registerOscHandler(e, t) {
    return this._parser.registerOscHandler(e, new kt(t));
  }
  bell() {
    return this._onRequestBell.fire(), !0;
  }
  lineFeed() {
    return this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._optionsService.rawOptions.convertEol && (this._activeBuffer.x = 0), this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData())) : this._activeBuffer.y >= this._bufferService.rows ? this._activeBuffer.y = this._bufferService.rows - 1 : this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = !1, this._activeBuffer.x >= this._bufferService.cols && this._activeBuffer.x--, this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._onLineFeed.fire(), !0;
  }
  carriageReturn() {
    return this._activeBuffer.x = 0, !0;
  }
  backspace() {
    var e;
    if (!this._coreService.decPrivateModes.reverseWraparound) return this._restrictCursor(), this._activeBuffer.x > 0 && this._activeBuffer.x--, !0;
    if (this._restrictCursor(this._bufferService.cols), this._activeBuffer.x > 0) this._activeBuffer.x--;
    else if (this._activeBuffer.x === 0 && this._activeBuffer.y > this._activeBuffer.scrollTop && this._activeBuffer.y <= this._activeBuffer.scrollBottom && (e = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y)) != null && e.isWrapped) {
      this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = !1, this._activeBuffer.y--, this._activeBuffer.x = this._bufferService.cols - 1;
      let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
      t.hasWidth(this._activeBuffer.x) && !t.hasContent(this._activeBuffer.x) && this._activeBuffer.x--;
    }
    return this._restrictCursor(), !0;
  }
  tab() {
    if (this._activeBuffer.x >= this._bufferService.cols) return !0;
    let e = this._activeBuffer.x;
    return this._activeBuffer.x = this._activeBuffer.nextStop(), this._optionsService.rawOptions.screenReaderMode && this._onA11yTab.fire(this._activeBuffer.x - e), !0;
  }
  shiftOut() {
    return this._charsetService.setgLevel(1), !0;
  }
  shiftIn() {
    return this._charsetService.setgLevel(0), !0;
  }
  _restrictCursor(e = this._bufferService.cols - 1) {
    this._activeBuffer.x = Math.min(e, Math.max(0, this._activeBuffer.x)), this._activeBuffer.y = this._coreService.decPrivateModes.origin ? Math.min(this._activeBuffer.scrollBottom, Math.max(this._activeBuffer.scrollTop, this._activeBuffer.y)) : Math.min(this._bufferService.rows - 1, Math.max(0, this._activeBuffer.y)), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
  }
  _setCursor(e, t) {
    this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._coreService.decPrivateModes.origin ? (this._activeBuffer.x = e, this._activeBuffer.y = this._activeBuffer.scrollTop + t) : (this._activeBuffer.x = e, this._activeBuffer.y = t), this._restrictCursor(), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
  }
  _moveCursor(e, t) {
    this._restrictCursor(), this._setCursor(this._activeBuffer.x + e, this._activeBuffer.y + t);
  }
  cursorUp(e) {
    let t = this._activeBuffer.y - this._activeBuffer.scrollTop;
    return t >= 0 ? this._moveCursor(0, -Math.min(t, e.params[0] || 1)) : this._moveCursor(0, -(e.params[0] || 1)), !0;
  }
  cursorDown(e) {
    let t = this._activeBuffer.scrollBottom - this._activeBuffer.y;
    return t >= 0 ? this._moveCursor(0, Math.min(t, e.params[0] || 1)) : this._moveCursor(0, e.params[0] || 1), !0;
  }
  cursorForward(e) {
    return this._moveCursor(e.params[0] || 1, 0), !0;
  }
  cursorBackward(e) {
    return this._moveCursor(-(e.params[0] || 1), 0), !0;
  }
  cursorNextLine(e) {
    return this.cursorDown(e), this._activeBuffer.x = 0, !0;
  }
  cursorPrecedingLine(e) {
    return this.cursorUp(e), this._activeBuffer.x = 0, !0;
  }
  cursorCharAbsolute(e) {
    return this._setCursor((e.params[0] || 1) - 1, this._activeBuffer.y), !0;
  }
  cursorPosition(e) {
    return this._setCursor(e.length >= 2 ? (e.params[1] || 1) - 1 : 0, (e.params[0] || 1) - 1), !0;
  }
  charPosAbsolute(e) {
    return this._setCursor((e.params[0] || 1) - 1, this._activeBuffer.y), !0;
  }
  hPositionRelative(e) {
    return this._moveCursor(e.params[0] || 1, 0), !0;
  }
  linePosAbsolute(e) {
    return this._setCursor(this._activeBuffer.x, (e.params[0] || 1) - 1), !0;
  }
  vPositionRelative(e) {
    return this._moveCursor(0, e.params[0] || 1), !0;
  }
  hVPosition(e) {
    return this.cursorPosition(e), !0;
  }
  tabClear(e) {
    let t = e.params[0];
    return t === 0 ? delete this._activeBuffer.tabs[this._activeBuffer.x] : t === 3 && (this._activeBuffer.tabs = {}), !0;
  }
  cursorForwardTab(e) {
    if (this._activeBuffer.x >= this._bufferService.cols) return !0;
    let t = e.params[0] || 1;
    for (; t--; ) this._activeBuffer.x = this._activeBuffer.nextStop();
    return !0;
  }
  cursorBackwardTab(e) {
    if (this._activeBuffer.x >= this._bufferService.cols) return !0;
    let t = e.params[0] || 1;
    for (; t--; ) this._activeBuffer.x = this._activeBuffer.prevStop();
    return !0;
  }
  selectProtected(e) {
    let t = e.params[0];
    return t === 1 && (this._curAttrData.bg |= 536870912), (t === 2 || t === 0) && (this._curAttrData.bg &= -536870913), !0;
  }
  _eraseInBufferLine(e, t, s, r = !1, n = !1) {
    let o = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
    o.replaceCells(t, s, this._activeBuffer.getNullCell(this._eraseAttrData()), n), r && (o.isWrapped = !1);
  }
  _resetBufferLine(e, t = !1) {
    let s = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
    s && (s.fill(this._activeBuffer.getNullCell(this._eraseAttrData()), t), this._bufferService.buffer.clearMarkers(this._activeBuffer.ybase + e), s.isWrapped = !1);
  }
  eraseInDisplay(e, t = !1) {
    var s;
    this._restrictCursor(this._bufferService.cols);
    let r;
    switch (e.params[0]) {
      case 0:
        for (r = this._activeBuffer.y, this._dirtyRowTracker.markDirty(r), this._eraseInBufferLine(r++, this._activeBuffer.x, this._bufferService.cols, this._activeBuffer.x === 0, t); r < this._bufferService.rows; r++) this._resetBufferLine(r, t);
        this._dirtyRowTracker.markDirty(r);
        break;
      case 1:
        for (r = this._activeBuffer.y, this._dirtyRowTracker.markDirty(r), this._eraseInBufferLine(r, 0, this._activeBuffer.x + 1, !0, t), this._activeBuffer.x + 1 >= this._bufferService.cols && (this._activeBuffer.lines.get(r + 1).isWrapped = !1); r--; ) this._resetBufferLine(r, t);
        this._dirtyRowTracker.markDirty(0);
        break;
      case 2:
        if (this._optionsService.rawOptions.scrollOnEraseInDisplay) {
          for (r = this._bufferService.rows, this._dirtyRowTracker.markRangeDirty(0, r - 1); r-- && !((s = this._activeBuffer.lines.get(this._activeBuffer.ybase + r)) != null && s.getTrimmedLength()); ) ;
          for (; r >= 0; r--) this._bufferService.scroll(this._eraseAttrData());
        } else {
          for (r = this._bufferService.rows, this._dirtyRowTracker.markDirty(r - 1); r--; ) this._resetBufferLine(r, t);
          this._dirtyRowTracker.markDirty(0);
        }
        break;
      case 3:
        let n = this._activeBuffer.lines.length - this._bufferService.rows;
        n > 0 && (this._activeBuffer.lines.trimStart(n), this._activeBuffer.ybase = Math.max(this._activeBuffer.ybase - n, 0), this._activeBuffer.ydisp = Math.max(this._activeBuffer.ydisp - n, 0), this._onScroll.fire(0));
        break;
    }
    return !0;
  }
  eraseInLine(e, t = !1) {
    switch (this._restrictCursor(this._bufferService.cols), e.params[0]) {
      case 0:
        this._eraseInBufferLine(this._activeBuffer.y, this._activeBuffer.x, this._bufferService.cols, this._activeBuffer.x === 0, t);
        break;
      case 1:
        this._eraseInBufferLine(this._activeBuffer.y, 0, this._activeBuffer.x + 1, !1, t);
        break;
      case 2:
        this._eraseInBufferLine(this._activeBuffer.y, 0, this._bufferService.cols, !0, t);
        break;
    }
    return this._dirtyRowTracker.markDirty(this._activeBuffer.y), !0;
  }
  insertLines(e) {
    this._restrictCursor();
    let t = e.params[0] || 1;
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
    let s = this._activeBuffer.ybase + this._activeBuffer.y, r = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom, n = this._bufferService.rows - 1 + this._activeBuffer.ybase - r + 1;
    for (; t--; ) this._activeBuffer.lines.splice(n - 1, 1), this._activeBuffer.lines.splice(s, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y, this._activeBuffer.scrollBottom), this._activeBuffer.x = 0, !0;
  }
  deleteLines(e) {
    this._restrictCursor();
    let t = e.params[0] || 1;
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
    let s = this._activeBuffer.ybase + this._activeBuffer.y, r;
    for (r = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom, r = this._bufferService.rows - 1 + this._activeBuffer.ybase - r; t--; ) this._activeBuffer.lines.splice(s, 1), this._activeBuffer.lines.splice(r, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y, this._activeBuffer.scrollBottom), this._activeBuffer.x = 0, !0;
  }
  insertChars(e) {
    this._restrictCursor();
    let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
    return t && (t.insertCells(this._activeBuffer.x, e.params[0] || 1, this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), !0;
  }
  deleteChars(e) {
    this._restrictCursor();
    let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
    return t && (t.deleteCells(this._activeBuffer.x, e.params[0] || 1, this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), !0;
  }
  scrollUp(e) {
    let t = e.params[0] || 1;
    for (; t--; ) this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollTop, 1), this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollBottom, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
  }
  scrollDown(e) {
    let t = e.params[0] || 1;
    for (; t--; ) this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollBottom, 1), this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollTop, 0, this._activeBuffer.getBlankLine(Ke));
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
  }
  scrollLeft(e) {
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
    let t = e.params[0] || 1;
    for (let s = this._activeBuffer.scrollTop; s <= this._activeBuffer.scrollBottom; ++s) {
      let r = this._activeBuffer.lines.get(this._activeBuffer.ybase + s);
      r.deleteCells(0, t, this._activeBuffer.getNullCell(this._eraseAttrData())), r.isWrapped = !1;
    }
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
  }
  scrollRight(e) {
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
    let t = e.params[0] || 1;
    for (let s = this._activeBuffer.scrollTop; s <= this._activeBuffer.scrollBottom; ++s) {
      let r = this._activeBuffer.lines.get(this._activeBuffer.ybase + s);
      r.insertCells(0, t, this._activeBuffer.getNullCell(this._eraseAttrData())), r.isWrapped = !1;
    }
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
  }
  insertColumns(e) {
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
    let t = e.params[0] || 1;
    for (let s = this._activeBuffer.scrollTop; s <= this._activeBuffer.scrollBottom; ++s) {
      let r = this._activeBuffer.lines.get(this._activeBuffer.ybase + s);
      r.insertCells(this._activeBuffer.x, t, this._activeBuffer.getNullCell(this._eraseAttrData())), r.isWrapped = !1;
    }
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
  }
  deleteColumns(e) {
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
    let t = e.params[0] || 1;
    for (let s = this._activeBuffer.scrollTop; s <= this._activeBuffer.scrollBottom; ++s) {
      let r = this._activeBuffer.lines.get(this._activeBuffer.ybase + s);
      r.deleteCells(this._activeBuffer.x, t, this._activeBuffer.getNullCell(this._eraseAttrData())), r.isWrapped = !1;
    }
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
  }
  eraseChars(e) {
    this._restrictCursor();
    let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
    return t && (t.replaceCells(this._activeBuffer.x, this._activeBuffer.x + (e.params[0] || 1), this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), !0;
  }
  repeatPrecedingCharacter(e) {
    let t = this._parser.precedingJoinState;
    if (!t) return !0;
    let s = e.params[0] || 1, r = $i.extractWidth(t), n = this._activeBuffer.x - r, o = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).getString(n), a = new Uint32Array(o.length * s), l = 0;
    for (let h = 0; h < o.length; ) {
      let d = o.codePointAt(h) || 0;
      a[l++] = d, h += d > 65535 ? 2 : 1;
    }
    let c = l;
    for (let h = 1; h < s; ++h) a.copyWithin(c, 0, l), c += l;
    return this.print(a, 0, c), !0;
  }
  sendDeviceAttributesPrimary(e) {
    return e.params[0] > 0 || (this._is("xterm") || this._is("rxvt-unicode") || this._is("screen") ? this._coreService.triggerDataEvent(O.ESC + "[?1;2c") : this._is("linux") && this._coreService.triggerDataEvent(O.ESC + "[?6c")), !0;
  }
  sendDeviceAttributesSecondary(e) {
    return e.params[0] > 0 || (this._is("xterm") ? this._coreService.triggerDataEvent(O.ESC + "[>0;276;0c") : this._is("rxvt-unicode") ? this._coreService.triggerDataEvent(O.ESC + "[>85;95;0c") : this._is("linux") ? this._coreService.triggerDataEvent(e.params[0] + "c") : this._is("screen") && this._coreService.triggerDataEvent(O.ESC + "[>83;40003;0c")), !0;
  }
  _is(e) {
    return (this._optionsService.rawOptions.termName + "").indexOf(e) === 0;
  }
  setMode(e) {
    for (let t = 0; t < e.length; t++) switch (e.params[t]) {
      case 4:
        this._coreService.modes.insertMode = !0;
        break;
      case 20:
        this._optionsService.options.convertEol = !0;
        break;
    }
    return !0;
  }
  setModePrivate(e) {
    for (let t = 0; t < e.length; t++) switch (e.params[t]) {
      case 1:
        this._coreService.decPrivateModes.applicationCursorKeys = !0;
        break;
      case 2:
        this._charsetService.setgCharset(0, Wi), this._charsetService.setgCharset(1, Wi), this._charsetService.setgCharset(2, Wi), this._charsetService.setgCharset(3, Wi);
        break;
      case 3:
        this._optionsService.rawOptions.windowOptions.setWinLines && (this._bufferService.resize(132, this._bufferService.rows), this._onRequestReset.fire());
        break;
      case 6:
        this._coreService.decPrivateModes.origin = !0, this._setCursor(0, 0);
        break;
      case 7:
        this._coreService.decPrivateModes.wraparound = !0;
        break;
      case 12:
        this._optionsService.options.cursorBlink = !0;
        break;
      case 45:
        this._coreService.decPrivateModes.reverseWraparound = !0;
        break;
      case 66:
        this._logService.debug("Serial port requested application keypad."), this._coreService.decPrivateModes.applicationKeypad = !0, this._onRequestSyncScrollBar.fire();
        break;
      case 9:
        this._coreMouseService.activeProtocol = "X10";
        break;
      case 1e3:
        this._coreMouseService.activeProtocol = "VT200";
        break;
      case 1002:
        this._coreMouseService.activeProtocol = "DRAG";
        break;
      case 1003:
        this._coreMouseService.activeProtocol = "ANY";
        break;
      case 1004:
        this._coreService.decPrivateModes.sendFocus = !0, this._onRequestSendFocus.fire();
        break;
      case 1005:
        this._logService.debug("DECSET 1005 not supported (see #2507)");
        break;
      case 1006:
        this._coreMouseService.activeEncoding = "SGR";
        break;
      case 1015:
        this._logService.debug("DECSET 1015 not supported (see #2507)");
        break;
      case 1016:
        this._coreMouseService.activeEncoding = "SGR_PIXELS";
        break;
      case 25:
        this._coreService.isCursorHidden = !1;
        break;
      case 1048:
        this.saveCursor();
        break;
      case 1049:
        this.saveCursor();
      case 47:
      case 1047:
        this._bufferService.buffers.activateAltBuffer(this._eraseAttrData()), this._coreService.isCursorInitialized = !0, this._onRequestRefreshRows.fire(void 0), this._onRequestSyncScrollBar.fire();
        break;
      case 2004:
        this._coreService.decPrivateModes.bracketedPasteMode = !0;
        break;
      case 2026:
        this._coreService.decPrivateModes.synchronizedOutput = !0;
        break;
    }
    return !0;
  }
  resetMode(e) {
    for (let t = 0; t < e.length; t++) switch (e.params[t]) {
      case 4:
        this._coreService.modes.insertMode = !1;
        break;
      case 20:
        this._optionsService.options.convertEol = !1;
        break;
    }
    return !0;
  }
  resetModePrivate(e) {
    for (let t = 0; t < e.length; t++) switch (e.params[t]) {
      case 1:
        this._coreService.decPrivateModes.applicationCursorKeys = !1;
        break;
      case 3:
        this._optionsService.rawOptions.windowOptions.setWinLines && (this._bufferService.resize(80, this._bufferService.rows), this._onRequestReset.fire());
        break;
      case 6:
        this._coreService.decPrivateModes.origin = !1, this._setCursor(0, 0);
        break;
      case 7:
        this._coreService.decPrivateModes.wraparound = !1;
        break;
      case 12:
        this._optionsService.options.cursorBlink = !1;
        break;
      case 45:
        this._coreService.decPrivateModes.reverseWraparound = !1;
        break;
      case 66:
        this._logService.debug("Switching back to normal keypad."), this._coreService.decPrivateModes.applicationKeypad = !1, this._onRequestSyncScrollBar.fire();
        break;
      case 9:
      case 1e3:
      case 1002:
      case 1003:
        this._coreMouseService.activeProtocol = "NONE";
        break;
      case 1004:
        this._coreService.decPrivateModes.sendFocus = !1;
        break;
      case 1005:
        this._logService.debug("DECRST 1005 not supported (see #2507)");
        break;
      case 1006:
        this._coreMouseService.activeEncoding = "DEFAULT";
        break;
      case 1015:
        this._logService.debug("DECRST 1015 not supported (see #2507)");
        break;
      case 1016:
        this._coreMouseService.activeEncoding = "DEFAULT";
        break;
      case 25:
        this._coreService.isCursorHidden = !0;
        break;
      case 1048:
        this.restoreCursor();
        break;
      case 1049:
      case 47:
      case 1047:
        this._bufferService.buffers.activateNormalBuffer(), e.params[t] === 1049 && this.restoreCursor(), this._coreService.isCursorInitialized = !0, this._onRequestRefreshRows.fire(void 0), this._onRequestSyncScrollBar.fire();
        break;
      case 2004:
        this._coreService.decPrivateModes.bracketedPasteMode = !1;
        break;
      case 2026:
        this._coreService.decPrivateModes.synchronizedOutput = !1, this._onRequestRefreshRows.fire(void 0);
        break;
    }
    return !0;
  }
  requestMode(e, t) {
    ((g) => (g[g.NOT_RECOGNIZED = 0] = "NOT_RECOGNIZED", g[g.SET = 1] = "SET", g[g.RESET = 2] = "RESET", g[g.PERMANENTLY_SET = 3] = "PERMANENTLY_SET", g[g.PERMANENTLY_RESET = 4] = "PERMANENTLY_RESET"))(i = {});
    let s = this._coreService.decPrivateModes, { activeProtocol: r, activeEncoding: n } = this._coreMouseService, o = this._coreService, { buffers: a, cols: l } = this._bufferService, { active: c, alt: h } = a, d = this._optionsService.rawOptions, u = (g, y) => (o.triggerDataEvent(`${O.ESC}[${t ? "" : "?"}${g};${y}$y`), !0), f = (g) => g ? 1 : 2, _ = e.params[0];
    return t ? _ === 2 ? u(_, 4) : _ === 4 ? u(_, f(o.modes.insertMode)) : _ === 12 ? u(_, 3) : _ === 20 ? u(_, f(d.convertEol)) : u(_, 0) : _ === 1 ? u(_, f(s.applicationCursorKeys)) : _ === 3 ? u(_, d.windowOptions.setWinLines ? l === 80 ? 2 : l === 132 ? 1 : 0 : 0) : _ === 6 ? u(_, f(s.origin)) : _ === 7 ? u(_, f(s.wraparound)) : _ === 8 ? u(_, 3) : _ === 9 ? u(_, f(r === "X10")) : _ === 12 ? u(_, f(d.cursorBlink)) : _ === 25 ? u(_, f(!o.isCursorHidden)) : _ === 45 ? u(_, f(s.reverseWraparound)) : _ === 66 ? u(_, f(s.applicationKeypad)) : _ === 67 ? u(_, 4) : _ === 1e3 ? u(_, f(r === "VT200")) : _ === 1002 ? u(_, f(r === "DRAG")) : _ === 1003 ? u(_, f(r === "ANY")) : _ === 1004 ? u(_, f(s.sendFocus)) : _ === 1005 ? u(_, 4) : _ === 1006 ? u(_, f(n === "SGR")) : _ === 1015 ? u(_, 4) : _ === 1016 ? u(_, f(n === "SGR_PIXELS")) : _ === 1048 ? u(_, 1) : _ === 47 || _ === 1047 || _ === 1049 ? u(_, f(c === h)) : _ === 2004 ? u(_, f(s.bracketedPasteMode)) : _ === 2026 ? u(_, f(s.synchronizedOutput)) : u(_, 0);
  }
  _updateAttrColor(e, t, s, r, n) {
    return t === 2 ? (e |= 50331648, e &= -16777216, e |= Ys.fromColorRGB([s, r, n])) : t === 5 && (e &= -50331904, e |= 33554432 | s & 255), e;
  }
  _extractColor(e, t, s) {
    let r = [0, 0, -1, 0, 0, 0], n = 0, o = 0;
    do {
      if (r[o + n] = e.params[t + o], e.hasSubParams(t + o)) {
        let a = e.getSubParams(t + o), l = 0;
        do
          r[1] === 5 && (n = 1), r[o + l + 1 + n] = a[l];
        while (++l < a.length && l + o + 1 + n < r.length);
        break;
      }
      if (r[1] === 5 && o + n >= 2 || r[1] === 2 && o + n >= 5) break;
      r[1] && (n = 1);
    } while (++o + t < e.length && o + n < r.length);
    for (let a = 2; a < r.length; ++a) r[a] === -1 && (r[a] = 0);
    switch (r[0]) {
      case 38:
        s.fg = this._updateAttrColor(s.fg, r[1], r[3], r[4], r[5]);
        break;
      case 48:
        s.bg = this._updateAttrColor(s.bg, r[1], r[3], r[4], r[5]);
        break;
      case 58:
        s.extended = s.extended.clone(), s.extended.underlineColor = this._updateAttrColor(s.extended.underlineColor, r[1], r[3], r[4], r[5]);
    }
    return o;
  }
  _processUnderline(e, t) {
    t.extended = t.extended.clone(), (!~e || e > 5) && (e = 1), t.extended.underlineStyle = e, t.fg |= 268435456, e === 0 && (t.fg &= -268435457), t.updateExtended();
  }
  _processSGR0(e) {
    e.fg = Ke.fg, e.bg = Ke.bg, e.extended = e.extended.clone(), e.extended.underlineStyle = 0, e.extended.underlineColor &= -67108864, e.updateExtended();
  }
  charAttributes(e) {
    if (e.length === 1 && e.params[0] === 0) return this._processSGR0(this._curAttrData), !0;
    let t = e.length, s, r = this._curAttrData;
    for (let n = 0; n < t; n++) s = e.params[n], s >= 30 && s <= 37 ? (r.fg &= -50331904, r.fg |= 16777216 | s - 30) : s >= 40 && s <= 47 ? (r.bg &= -50331904, r.bg |= 16777216 | s - 40) : s >= 90 && s <= 97 ? (r.fg &= -50331904, r.fg |= 16777216 | s - 90 | 8) : s >= 100 && s <= 107 ? (r.bg &= -50331904, r.bg |= 16777216 | s - 100 | 8) : s === 0 ? this._processSGR0(r) : s === 1 ? r.fg |= 134217728 : s === 3 ? r.bg |= 67108864 : s === 4 ? (r.fg |= 268435456, this._processUnderline(e.hasSubParams(n) ? e.getSubParams(n)[0] : 1, r)) : s === 5 ? r.fg |= 536870912 : s === 7 ? r.fg |= 67108864 : s === 8 ? r.fg |= 1073741824 : s === 9 ? r.fg |= 2147483648 : s === 2 ? r.bg |= 134217728 : s === 21 ? this._processUnderline(2, r) : s === 22 ? (r.fg &= -134217729, r.bg &= -134217729) : s === 23 ? r.bg &= -67108865 : s === 24 ? (r.fg &= -268435457, this._processUnderline(0, r)) : s === 25 ? r.fg &= -536870913 : s === 27 ? r.fg &= -67108865 : s === 28 ? r.fg &= -1073741825 : s === 29 ? r.fg &= 2147483647 : s === 39 ? (r.fg &= -67108864, r.fg |= Ke.fg & 16777215) : s === 49 ? (r.bg &= -67108864, r.bg |= Ke.bg & 16777215) : s === 38 || s === 48 || s === 58 ? n += this._extractColor(e, n, r) : s === 53 ? r.bg |= 1073741824 : s === 55 ? r.bg &= -1073741825 : s === 59 ? (r.extended = r.extended.clone(), r.extended.underlineColor = -1, r.updateExtended()) : s === 100 ? (r.fg &= -67108864, r.fg |= Ke.fg & 16777215, r.bg &= -67108864, r.bg |= Ke.bg & 16777215) : this._logService.debug("Unknown SGR attribute: %d.", s);
    return !0;
  }
  deviceStatus(e) {
    switch (e.params[0]) {
      case 5:
        this._coreService.triggerDataEvent(`${O.ESC}[0n`);
        break;
      case 6:
        let t = this._activeBuffer.y + 1, s = this._activeBuffer.x + 1;
        this._coreService.triggerDataEvent(`${O.ESC}[${t};${s}R`);
        break;
    }
    return !0;
  }
  deviceStatusPrivate(e) {
    switch (e.params[0]) {
      case 6:
        let t = this._activeBuffer.y + 1, s = this._activeBuffer.x + 1;
        this._coreService.triggerDataEvent(`${O.ESC}[?${t};${s}R`);
        break;
    }
    return !0;
  }
  softReset(e) {
    return this._coreService.isCursorHidden = !1, this._onRequestSyncScrollBar.fire(), this._activeBuffer.scrollTop = 0, this._activeBuffer.scrollBottom = this._bufferService.rows - 1, this._curAttrData = Ke.clone(), this._coreService.reset(), this._charsetService.reset(), this._activeBuffer.savedX = 0, this._activeBuffer.savedY = this._activeBuffer.ybase, this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg, this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg, this._activeBuffer.savedCharset = this._charsetService.charset, this._coreService.decPrivateModes.origin = !1, !0;
  }
  setCursorStyle(e) {
    let t = e.length === 0 ? 1 : e.params[0];
    if (t === 0) this._coreService.decPrivateModes.cursorStyle = void 0, this._coreService.decPrivateModes.cursorBlink = void 0;
    else {
      switch (t) {
        case 1:
        case 2:
          this._coreService.decPrivateModes.cursorStyle = "block";
          break;
        case 3:
        case 4:
          this._coreService.decPrivateModes.cursorStyle = "underline";
          break;
        case 5:
        case 6:
          this._coreService.decPrivateModes.cursorStyle = "bar";
          break;
      }
      let s = t % 2 === 1;
      this._coreService.decPrivateModes.cursorBlink = s;
    }
    return !0;
  }
  setScrollRegion(e) {
    let t = e.params[0] || 1, s;
    return (e.length < 2 || (s = e.params[1]) > this._bufferService.rows || s === 0) && (s = this._bufferService.rows), s > t && (this._activeBuffer.scrollTop = t - 1, this._activeBuffer.scrollBottom = s - 1, this._setCursor(0, 0)), !0;
  }
  windowOptions(e) {
    if (!qa(e.params[0], this._optionsService.rawOptions.windowOptions)) return !0;
    let t = e.length > 1 ? e.params[1] : 0;
    switch (e.params[0]) {
      case 14:
        t !== 2 && this._onRequestWindowsOptionsReport.fire(0);
        break;
      case 16:
        this._onRequestWindowsOptionsReport.fire(1);
        break;
      case 18:
        this._bufferService && this._coreService.triggerDataEvent(`${O.ESC}[8;${this._bufferService.rows};${this._bufferService.cols}t`);
        break;
      case 22:
        (t === 0 || t === 2) && (this._windowTitleStack.push(this._windowTitle), this._windowTitleStack.length > Va && this._windowTitleStack.shift()), (t === 0 || t === 1) && (this._iconNameStack.push(this._iconName), this._iconNameStack.length > Va && this._iconNameStack.shift());
        break;
      case 23:
        (t === 0 || t === 2) && this._windowTitleStack.length && this.setTitle(this._windowTitleStack.pop()), (t === 0 || t === 1) && this._iconNameStack.length && this.setIconName(this._iconNameStack.pop());
        break;
    }
    return !0;
  }
  saveCursor(e) {
    return this._activeBuffer.savedX = this._activeBuffer.x, this._activeBuffer.savedY = this._activeBuffer.ybase + this._activeBuffer.y, this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg, this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg, this._activeBuffer.savedCharset = this._charsetService.charset, !0;
  }
  restoreCursor(e) {
    return this._activeBuffer.x = this._activeBuffer.savedX || 0, this._activeBuffer.y = Math.max(this._activeBuffer.savedY - this._activeBuffer.ybase, 0), this._curAttrData.fg = this._activeBuffer.savedCurAttrData.fg, this._curAttrData.bg = this._activeBuffer.savedCurAttrData.bg, this._charsetService.charset = this._savedCharset, this._activeBuffer.savedCharset && (this._charsetService.charset = this._activeBuffer.savedCharset), this._restrictCursor(), !0;
  }
  setTitle(e) {
    return this._windowTitle = e, this._onTitleChange.fire(e), !0;
  }
  setIconName(e) {
    return this._iconName = e, !0;
  }
  setOrReportIndexedColor(e) {
    let t = [], s = e.split(";");
    for (; s.length > 1; ) {
      let r = s.shift(), n = s.shift();
      if (/^\d+$/.exec(r)) {
        let o = parseInt(r);
        if (Ga(o)) if (n === "?") t.push({ type: 0, index: o });
        else {
          let a = Ka(n);
          a && t.push({ type: 1, index: o, color: a });
        }
      }
    }
    return t.length && this._onColor.fire(t), !0;
  }
  setHyperlink(e) {
    let t = e.indexOf(";");
    if (t === -1) return !0;
    let s = e.slice(0, t).trim(), r = e.slice(t + 1);
    return r ? this._createHyperlink(s, r) : s.trim() ? !1 : this._finishHyperlink();
  }
  _createHyperlink(e, t) {
    this._getCurrentLinkId() && this._finishHyperlink();
    let s = e.split(":"), r, n = s.findIndex((o) => o.startsWith("id="));
    return n !== -1 && (r = s[n].slice(3) || void 0), this._curAttrData.extended = this._curAttrData.extended.clone(), this._curAttrData.extended.urlId = this._oscLinkService.registerLink({ id: r, uri: t }), this._curAttrData.updateExtended(), !0;
  }
  _finishHyperlink() {
    return this._curAttrData.extended = this._curAttrData.extended.clone(), this._curAttrData.extended.urlId = 0, this._curAttrData.updateExtended(), !0;
  }
  _setOrReportSpecialColor(e, t) {
    let s = e.split(";");
    for (let r = 0; r < s.length && !(t >= this._specialColors.length); ++r, ++t) if (s[r] === "?") this._onColor.fire([{ type: 0, index: this._specialColors[t] }]);
    else {
      let n = Ka(s[r]);
      n && this._onColor.fire([{ type: 1, index: this._specialColors[t], color: n }]);
    }
    return !0;
  }
  setOrReportFgColor(e) {
    return this._setOrReportSpecialColor(e, 0);
  }
  setOrReportBgColor(e) {
    return this._setOrReportSpecialColor(e, 1);
  }
  setOrReportCursorColor(e) {
    return this._setOrReportSpecialColor(e, 2);
  }
  restoreIndexedColor(e) {
    if (!e) return this._onColor.fire([{ type: 2 }]), !0;
    let t = [], s = e.split(";");
    for (let r = 0; r < s.length; ++r) if (/^\d+$/.exec(s[r])) {
      let n = parseInt(s[r]);
      Ga(n) && t.push({ type: 2, index: n });
    }
    return t.length && this._onColor.fire(t), !0;
  }
  restoreFgColor(e) {
    return this._onColor.fire([{ type: 2, index: 256 }]), !0;
  }
  restoreBgColor(e) {
    return this._onColor.fire([{ type: 2, index: 257 }]), !0;
  }
  restoreCursorColor(e) {
    return this._onColor.fire([{ type: 2, index: 258 }]), !0;
  }
  nextLine() {
    return this._activeBuffer.x = 0, this.index(), !0;
  }
  keypadApplicationMode() {
    return this._logService.debug("Serial port requested application keypad."), this._coreService.decPrivateModes.applicationKeypad = !0, this._onRequestSyncScrollBar.fire(), !0;
  }
  keypadNumericMode() {
    return this._logService.debug("Switching back to normal keypad."), this._coreService.decPrivateModes.applicationKeypad = !1, this._onRequestSyncScrollBar.fire(), !0;
  }
  selectDefaultCharset() {
    return this._charsetService.setgLevel(0), this._charsetService.setgCharset(0, Wi), !0;
  }
  selectCharset(e) {
    return e.length !== 2 ? (this.selectDefaultCharset(), !0) : (e[0] === "/" || this._charsetService.setgCharset(X_[e[0]], je[e[1]] || Wi), !0);
  }
  index() {
    return this._restrictCursor(), this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData())) : this._activeBuffer.y >= this._bufferService.rows && (this._activeBuffer.y = this._bufferService.rows - 1), this._restrictCursor(), !0;
  }
  tabSet() {
    return this._activeBuffer.tabs[this._activeBuffer.x] = !0, !0;
  }
  reverseIndex() {
    if (this._restrictCursor(), this._activeBuffer.y === this._activeBuffer.scrollTop) {
      let e = this._activeBuffer.scrollBottom - this._activeBuffer.scrollTop;
      this._activeBuffer.lines.shiftElements(this._activeBuffer.ybase + this._activeBuffer.y, e, 1), this._activeBuffer.lines.set(this._activeBuffer.ybase + this._activeBuffer.y, this._activeBuffer.getBlankLine(this._eraseAttrData())), this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom);
    } else this._activeBuffer.y--, this._restrictCursor();
    return !0;
  }
  fullReset() {
    return this._parser.reset(), this._onRequestReset.fire(), !0;
  }
  reset() {
    this._curAttrData = Ke.clone(), this._eraseAttrDataInternal = Ke.clone();
  }
  _eraseAttrData() {
    return this._eraseAttrDataInternal.bg &= -67108864, this._eraseAttrDataInternal.bg |= this._curAttrData.bg & 67108863, this._eraseAttrDataInternal;
  }
  setgLevel(e) {
    return this._charsetService.setgLevel(e), !0;
  }
  screenAlignmentPattern() {
    let e = new Nt();
    e.content = 1 << 22 | 69, e.fg = this._curAttrData.fg, e.bg = this._curAttrData.bg, this._setCursor(0, 0);
    for (let t = 0; t < this._bufferService.rows; ++t) {
      let s = this._activeBuffer.ybase + this._activeBuffer.y + t, r = this._activeBuffer.lines.get(s);
      r && (r.fill(e), r.isWrapped = !1);
    }
    return this._dirtyRowTracker.markAllDirty(), this._setCursor(0, 0), !0;
  }
  requestStatusString(e, t) {
    let s = (o) => (this._coreService.triggerDataEvent(`${O.ESC}${o}${O.ESC}\\`), !0), r = this._bufferService.buffer, n = this._optionsService.rawOptions;
    return s(e === '"q' ? `P1$r${this._curAttrData.isProtected() ? 1 : 0}"q` : e === '"p' ? 'P1$r61;1"p' : e === "r" ? `P1$r${r.scrollTop + 1};${r.scrollBottom + 1}r` : e === "m" ? "P1$r0m" : e === " q" ? `P1$r${{ block: 2, underline: 4, bar: 6 }[n.cursorStyle] - (n.cursorBlink ? 1 : 0)} q` : "P0$r");
  }
  markRangeDirty(e, t) {
    this._dirtyRowTracker.markRangeDirty(e, t);
  }
}, lo = class {
  constructor(e) {
    this._bufferService = e, this.clearRange();
  }
  clearRange() {
    this.start = this._bufferService.buffer.y, this.end = this._bufferService.buffer.y;
  }
  markDirty(e) {
    e < this.start ? this.start = e : e > this.end && (this.end = e);
  }
  markRangeDirty(e, t) {
    e > t && (ja = e, e = t, t = ja), e < this.start && (this.start = e), t > this.end && (this.end = t);
  }
  markAllDirty() {
    this.markRangeDirty(0, this._bufferService.rows - 1);
  }
};
lo = $e([X(0, mt)], lo);
function Ga(e) {
  return 0 <= e && e < 256;
}
var J_ = 5e7, Xa = 12, Q_ = 50, ef = class extends ue {
  constructor(e) {
    super(), this._action = e, this._writeBuffer = [], this._callbacks = [], this._pendingData = 0, this._bufferOffset = 0, this._isSyncWriting = !1, this._syncCalls = 0, this._didUserInput = !1, this._onWriteParsed = this._register(new K()), this.onWriteParsed = this._onWriteParsed.event;
  }
  handleUserInput() {
    this._didUserInput = !0;
  }
  writeSync(e, t) {
    if (t !== void 0 && this._syncCalls > t) {
      this._syncCalls = 0;
      return;
    }
    if (this._pendingData += e.length, this._writeBuffer.push(e), this._callbacks.push(void 0), this._syncCalls++, this._isSyncWriting) return;
    this._isSyncWriting = !0;
    let s;
    for (; s = this._writeBuffer.shift(); ) {
      this._action(s);
      let r = this._callbacks.shift();
      r && r();
    }
    this._pendingData = 0, this._bufferOffset = 2147483647, this._isSyncWriting = !1, this._syncCalls = 0;
  }
  write(e, t) {
    if (this._pendingData > J_) throw new Error("write data discarded, use flow control to avoid losing data");
    if (!this._writeBuffer.length) {
      if (this._bufferOffset = 0, this._didUserInput) {
        this._didUserInput = !1, this._pendingData += e.length, this._writeBuffer.push(e), this._callbacks.push(t), this._innerWrite();
        return;
      }
      setTimeout(() => this._innerWrite());
    }
    this._pendingData += e.length, this._writeBuffer.push(e), this._callbacks.push(t);
  }
  _innerWrite(e = 0, t = !0) {
    let s = e || performance.now();
    for (; this._writeBuffer.length > this._bufferOffset; ) {
      let r = this._writeBuffer[this._bufferOffset], n = this._action(r, t);
      if (n) {
        let a = (l) => performance.now() - s >= Xa ? setTimeout(() => this._innerWrite(0, l)) : this._innerWrite(s, l);
        n.catch((l) => (queueMicrotask(() => {
          throw l;
        }), Promise.resolve(!1))).then(a);
        return;
      }
      let o = this._callbacks[this._bufferOffset];
      if (o && o(), this._bufferOffset++, this._pendingData -= r.length, performance.now() - s >= Xa) break;
    }
    this._writeBuffer.length > this._bufferOffset ? (this._bufferOffset > Q_ && (this._writeBuffer = this._writeBuffer.slice(this._bufferOffset), this._callbacks = this._callbacks.slice(this._bufferOffset), this._bufferOffset = 0), setTimeout(() => this._innerWrite())) : (this._writeBuffer.length = 0, this._callbacks.length = 0, this._pendingData = 0, this._bufferOffset = 0), this._onWriteParsed.fire();
  }
}, ho = class {
  constructor(e) {
    this._bufferService = e, this._nextId = 1, this._entriesWithId = /* @__PURE__ */ new Map(), this._dataByLinkId = /* @__PURE__ */ new Map();
  }
  registerLink(e) {
    let t = this._bufferService.buffer;
    if (e.id === void 0) {
      let l = t.addMarker(t.ybase + t.y), c = { data: e, id: this._nextId++, lines: [l] };
      return l.onDispose(() => this._removeMarkerFromLink(c, l)), this._dataByLinkId.set(c.id, c), c.id;
    }
    let s = e, r = this._getEntryIdKey(s), n = this._entriesWithId.get(r);
    if (n) return this.addLineToLink(n.id, t.ybase + t.y), n.id;
    let o = t.addMarker(t.ybase + t.y), a = { id: this._nextId++, key: this._getEntryIdKey(s), data: s, lines: [o] };
    return o.onDispose(() => this._removeMarkerFromLink(a, o)), this._entriesWithId.set(a.key, a), this._dataByLinkId.set(a.id, a), a.id;
  }
  addLineToLink(e, t) {
    let s = this._dataByLinkId.get(e);
    if (s && s.lines.every((r) => r.line !== t)) {
      let r = this._bufferService.buffer.addMarker(t);
      s.lines.push(r), r.onDispose(() => this._removeMarkerFromLink(s, r));
    }
  }
  getLinkData(e) {
    var t;
    return (t = this._dataByLinkId.get(e)) == null ? void 0 : t.data;
  }
  _getEntryIdKey(e) {
    return `${e.id};;${e.uri}`;
  }
  _removeMarkerFromLink(e, t) {
    let s = e.lines.indexOf(t);
    s !== -1 && (e.lines.splice(s, 1), e.lines.length === 0 && (e.data.id !== void 0 && this._entriesWithId.delete(e.key), this._dataByLinkId.delete(e.id)));
  }
};
ho = $e([X(0, mt)], ho);
var Za = !1, tf = class extends ue {
  constructor(e) {
    super(), this._windowsWrappingHeuristics = this._register(new gs()), this._onBinary = this._register(new K()), this.onBinary = this._onBinary.event, this._onData = this._register(new K()), this.onData = this._onData.event, this._onLineFeed = this._register(new K()), this.onLineFeed = this._onLineFeed.event, this._onResize = this._register(new K()), this.onResize = this._onResize.event, this._onWriteParsed = this._register(new K()), this.onWriteParsed = this._onWriteParsed.event, this._onScroll = this._register(new K()), this._instantiationService = new k_(), this.optionsService = this._register(new N_(e)), this._instantiationService.setService(wt, this.optionsService), this._bufferService = this._register(this._instantiationService.createInstance(ro)), this._instantiationService.setService(mt, this._bufferService), this._logService = this._register(this._instantiationService.createInstance(so)), this._instantiationService.setService(ah, this._logService), this.coreService = this._register(this._instantiationService.createInstance(no)), this._instantiationService.setService(Gi, this.coreService), this.coreMouseService = this._register(this._instantiationService.createInstance(oo)), this._instantiationService.setService(oh, this.coreMouseService), this.unicodeService = this._register(this._instantiationService.createInstance($i)), this._instantiationService.setService(Ld, this.unicodeService), this._charsetService = this._instantiationService.createInstance(W_), this._instantiationService.setService(kd, this._charsetService), this._oscLinkService = this._instantiationService.createInstance(ho), this._instantiationService.setService(lh, this._oscLinkService), this._inputHandler = this._register(new Z_(this._bufferService, this._charsetService, this.coreService, this._logService, this.optionsService, this._oscLinkService, this.coreMouseService, this.unicodeService)), this._register(ot.forward(this._inputHandler.onLineFeed, this._onLineFeed)), this._register(this._inputHandler), this._register(ot.forward(this._bufferService.onResize, this._onResize)), this._register(ot.forward(this.coreService.onData, this._onData)), this._register(ot.forward(this.coreService.onBinary, this._onBinary)), this._register(this.coreService.onRequestScrollToBottom(() => this.scrollToBottom(!0))), this._register(this.coreService.onUserInput(() => this._writeBuffer.handleUserInput())), this._register(this.optionsService.onMultipleOptionChange(["windowsMode", "windowsPty"], () => this._handleWindowsPtyOptionChange())), this._register(this._bufferService.onScroll(() => {
      this._onScroll.fire({ position: this._bufferService.buffer.ydisp }), this._inputHandler.markRangeDirty(this._bufferService.buffer.scrollTop, this._bufferService.buffer.scrollBottom);
    })), this._writeBuffer = this._register(new ef((t, s) => this._inputHandler.parse(t, s))), this._register(ot.forward(this._writeBuffer.onWriteParsed, this._onWriteParsed));
  }
  get onScroll() {
    return this._onScrollApi || (this._onScrollApi = this._register(new K()), this._onScroll.event((e) => {
      var t;
      (t = this._onScrollApi) == null || t.fire(e.position);
    })), this._onScrollApi.event;
  }
  get cols() {
    return this._bufferService.cols;
  }
  get rows() {
    return this._bufferService.rows;
  }
  get buffers() {
    return this._bufferService.buffers;
  }
  get options() {
    return this.optionsService.options;
  }
  set options(e) {
    for (let t in e) this.optionsService.options[t] = e[t];
  }
  write(e, t) {
    this._writeBuffer.write(e, t);
  }
  writeSync(e, t) {
    this._logService.logLevel <= 3 && !Za && (this._logService.warn("writeSync is unreliable and will be removed soon."), Za = !0), this._writeBuffer.writeSync(e, t);
  }
  input(e, t = !0) {
    this.coreService.triggerDataEvent(e, t);
  }
  resize(e, t) {
    isNaN(e) || isNaN(t) || (e = Math.max(e, Ih), t = Math.max(t, Fh), this._bufferService.resize(e, t));
  }
  scroll(e, t = !1) {
    this._bufferService.scroll(e, t);
  }
  scrollLines(e, t) {
    this._bufferService.scrollLines(e, t);
  }
  scrollPages(e) {
    this.scrollLines(e * (this.rows - 1));
  }
  scrollToTop() {
    this.scrollLines(-this._bufferService.buffer.ydisp);
  }
  scrollToBottom(e) {
    this.scrollLines(this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
  }
  scrollToLine(e) {
    let t = e - this._bufferService.buffer.ydisp;
    t !== 0 && this.scrollLines(t);
  }
  registerEscHandler(e, t) {
    return this._inputHandler.registerEscHandler(e, t);
  }
  registerDcsHandler(e, t) {
    return this._inputHandler.registerDcsHandler(e, t);
  }
  registerCsiHandler(e, t) {
    return this._inputHandler.registerCsiHandler(e, t);
  }
  registerOscHandler(e, t) {
    return this._inputHandler.registerOscHandler(e, t);
  }
  _setup() {
    this._handleWindowsPtyOptionChange();
  }
  reset() {
    this._inputHandler.reset(), this._bufferService.reset(), this._charsetService.reset(), this.coreService.reset(), this.coreMouseService.reset();
  }
  _handleWindowsPtyOptionChange() {
    let e = !1, t = this.optionsService.rawOptions.windowsPty;
    t && t.buildNumber !== void 0 && t.buildNumber !== void 0 ? e = t.backend === "conpty" && t.buildNumber < 21376 : this.optionsService.rawOptions.windowsMode && (e = !0), e ? this._enableWindowsWrappingHeuristics() : this._windowsWrappingHeuristics.clear();
  }
  _enableWindowsWrappingHeuristics() {
    if (!this._windowsWrappingHeuristics.value) {
      let e = [];
      e.push(this.onLineFeed(Ha.bind(null, this._bufferService))), e.push(this.registerCsiHandler({ final: "H" }, () => (Ha(this._bufferService), !1))), this._windowsWrappingHeuristics.value = Ae(() => {
        for (let t of e) t.dispose();
      });
    }
  }
}, sf = { 48: ["0", ")"], 49: ["1", "!"], 50: ["2", "@"], 51: ["3", "#"], 52: ["4", "$"], 53: ["5", "%"], 54: ["6", "^"], 55: ["7", "&"], 56: ["8", "*"], 57: ["9", "("], 186: [";", ":"], 187: ["=", "+"], 188: [",", "<"], 189: ["-", "_"], 190: [".", ">"], 191: ["/", "?"], 192: ["`", "~"], 219: ["[", "{"], 220: ["\\", "|"], 221: ["]", "}"], 222: ["'", '"'] };
function rf(e, t, s, r) {
  var n;
  let o = { type: 0, cancel: !1, key: void 0 }, a = (e.shiftKey ? 1 : 0) | (e.altKey ? 2 : 0) | (e.ctrlKey ? 4 : 0) | (e.metaKey ? 8 : 0);
  switch (e.keyCode) {
    case 0:
      e.key === "UIKeyInputUpArrow" ? t ? o.key = O.ESC + "OA" : o.key = O.ESC + "[A" : e.key === "UIKeyInputLeftArrow" ? t ? o.key = O.ESC + "OD" : o.key = O.ESC + "[D" : e.key === "UIKeyInputRightArrow" ? t ? o.key = O.ESC + "OC" : o.key = O.ESC + "[C" : e.key === "UIKeyInputDownArrow" && (t ? o.key = O.ESC + "OB" : o.key = O.ESC + "[B");
      break;
    case 8:
      o.key = e.ctrlKey ? "\b" : O.DEL, e.altKey && (o.key = O.ESC + o.key);
      break;
    case 9:
      if (e.shiftKey) {
        o.key = O.ESC + "[Z";
        break;
      }
      o.key = O.HT, o.cancel = !0;
      break;
    case 13:
      o.key = e.altKey ? O.ESC + O.CR : O.CR, o.cancel = !0;
      break;
    case 27:
      o.key = O.ESC, e.altKey && (o.key = O.ESC + O.ESC), o.cancel = !0;
      break;
    case 37:
      if (e.metaKey) break;
      a ? o.key = O.ESC + "[1;" + (a + 1) + "D" : t ? o.key = O.ESC + "OD" : o.key = O.ESC + "[D";
      break;
    case 39:
      if (e.metaKey) break;
      a ? o.key = O.ESC + "[1;" + (a + 1) + "C" : t ? o.key = O.ESC + "OC" : o.key = O.ESC + "[C";
      break;
    case 38:
      if (e.metaKey) break;
      a ? o.key = O.ESC + "[1;" + (a + 1) + "A" : t ? o.key = O.ESC + "OA" : o.key = O.ESC + "[A";
      break;
    case 40:
      if (e.metaKey) break;
      a ? o.key = O.ESC + "[1;" + (a + 1) + "B" : t ? o.key = O.ESC + "OB" : o.key = O.ESC + "[B";
      break;
    case 45:
      !e.shiftKey && !e.ctrlKey && (o.key = O.ESC + "[2~");
      break;
    case 46:
      a ? o.key = O.ESC + "[3;" + (a + 1) + "~" : o.key = O.ESC + "[3~";
      break;
    case 36:
      a ? o.key = O.ESC + "[1;" + (a + 1) + "H" : t ? o.key = O.ESC + "OH" : o.key = O.ESC + "[H";
      break;
    case 35:
      a ? o.key = O.ESC + "[1;" + (a + 1) + "F" : t ? o.key = O.ESC + "OF" : o.key = O.ESC + "[F";
      break;
    case 33:
      e.shiftKey ? o.type = 2 : e.ctrlKey ? o.key = O.ESC + "[5;" + (a + 1) + "~" : o.key = O.ESC + "[5~";
      break;
    case 34:
      e.shiftKey ? o.type = 3 : e.ctrlKey ? o.key = O.ESC + "[6;" + (a + 1) + "~" : o.key = O.ESC + "[6~";
      break;
    case 112:
      a ? o.key = O.ESC + "[1;" + (a + 1) + "P" : o.key = O.ESC + "OP";
      break;
    case 113:
      a ? o.key = O.ESC + "[1;" + (a + 1) + "Q" : o.key = O.ESC + "OQ";
      break;
    case 114:
      a ? o.key = O.ESC + "[1;" + (a + 1) + "R" : o.key = O.ESC + "OR";
      break;
    case 115:
      a ? o.key = O.ESC + "[1;" + (a + 1) + "S" : o.key = O.ESC + "OS";
      break;
    case 116:
      a ? o.key = O.ESC + "[15;" + (a + 1) + "~" : o.key = O.ESC + "[15~";
      break;
    case 117:
      a ? o.key = O.ESC + "[17;" + (a + 1) + "~" : o.key = O.ESC + "[17~";
      break;
    case 118:
      a ? o.key = O.ESC + "[18;" + (a + 1) + "~" : o.key = O.ESC + "[18~";
      break;
    case 119:
      a ? o.key = O.ESC + "[19;" + (a + 1) + "~" : o.key = O.ESC + "[19~";
      break;
    case 120:
      a ? o.key = O.ESC + "[20;" + (a + 1) + "~" : o.key = O.ESC + "[20~";
      break;
    case 121:
      a ? o.key = O.ESC + "[21;" + (a + 1) + "~" : o.key = O.ESC + "[21~";
      break;
    case 122:
      a ? o.key = O.ESC + "[23;" + (a + 1) + "~" : o.key = O.ESC + "[23~";
      break;
    case 123:
      a ? o.key = O.ESC + "[24;" + (a + 1) + "~" : o.key = O.ESC + "[24~";
      break;
    default:
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) e.keyCode >= 65 && e.keyCode <= 90 ? o.key = String.fromCharCode(e.keyCode - 64) : e.keyCode === 32 ? o.key = O.NUL : e.keyCode >= 51 && e.keyCode <= 55 ? o.key = String.fromCharCode(e.keyCode - 51 + 27) : e.keyCode === 56 ? o.key = O.DEL : e.keyCode === 219 ? o.key = O.ESC : e.keyCode === 220 ? o.key = O.FS : e.keyCode === 221 && (o.key = O.GS);
      else if ((!s || r) && e.altKey && !e.metaKey) {
        let l = (n = sf[e.keyCode]) == null ? void 0 : n[e.shiftKey ? 1 : 0];
        if (l) o.key = O.ESC + l;
        else if (e.keyCode >= 65 && e.keyCode <= 90) {
          let c = e.ctrlKey ? e.keyCode - 64 : e.keyCode + 32, h = String.fromCharCode(c);
          e.shiftKey && (h = h.toUpperCase()), o.key = O.ESC + h;
        } else if (e.keyCode === 32) o.key = O.ESC + (e.ctrlKey ? O.NUL : " ");
        else if (e.key === "Dead" && e.code.startsWith("Key")) {
          let c = e.code.slice(3, 4);
          e.shiftKey || (c = c.toLowerCase()), o.key = O.ESC + c, o.cancel = !0;
        }
      } else s && !e.altKey && !e.ctrlKey && !e.shiftKey && e.metaKey ? e.keyCode === 65 && (o.type = 1) : e.key && !e.ctrlKey && !e.altKey && !e.metaKey && e.keyCode >= 48 && e.key.length === 1 ? o.key = e.key : e.key && e.ctrlKey && (e.key === "_" && (o.key = O.US), e.key === "@" && (o.key = O.NUL));
      break;
  }
  return o;
}
var He = 0, nf = class {
  constructor(e) {
    this._getKey = e, this._array = [], this._insertedValues = [], this._flushInsertedTask = new Lr(), this._isFlushingInserted = !1, this._deletedIndices = [], this._flushDeletedTask = new Lr(), this._isFlushingDeleted = !1;
  }
  clear() {
    this._array.length = 0, this._insertedValues.length = 0, this._flushInsertedTask.clear(), this._isFlushingInserted = !1, this._deletedIndices.length = 0, this._flushDeletedTask.clear(), this._isFlushingDeleted = !1;
  }
  insert(e) {
    this._flushCleanupDeleted(), this._insertedValues.length === 0 && this._flushInsertedTask.enqueue(() => this._flushInserted()), this._insertedValues.push(e);
  }
  _flushInserted() {
    let e = this._insertedValues.sort((n, o) => this._getKey(n) - this._getKey(o)), t = 0, s = 0, r = new Array(this._array.length + this._insertedValues.length);
    for (let n = 0; n < r.length; n++) s >= this._array.length || this._getKey(e[t]) <= this._getKey(this._array[s]) ? (r[n] = e[t], t++) : r[n] = this._array[s++];
    this._array = r, this._insertedValues.length = 0;
  }
  _flushCleanupInserted() {
    !this._isFlushingInserted && this._insertedValues.length > 0 && this._flushInsertedTask.flush();
  }
  delete(e) {
    if (this._flushCleanupInserted(), this._array.length === 0) return !1;
    let t = this._getKey(e);
    if (t === void 0 || (He = this._search(t), He === -1) || this._getKey(this._array[He]) !== t) return !1;
    do
      if (this._array[He] === e) return this._deletedIndices.length === 0 && this._flushDeletedTask.enqueue(() => this._flushDeleted()), this._deletedIndices.push(He), !0;
    while (++He < this._array.length && this._getKey(this._array[He]) === t);
    return !1;
  }
  _flushDeleted() {
    this._isFlushingDeleted = !0;
    let e = this._deletedIndices.sort((n, o) => n - o), t = 0, s = new Array(this._array.length - e.length), r = 0;
    for (let n = 0; n < this._array.length; n++) e[t] === n ? t++ : s[r++] = this._array[n];
    this._array = s, this._deletedIndices.length = 0, this._isFlushingDeleted = !1;
  }
  _flushCleanupDeleted() {
    !this._isFlushingDeleted && this._deletedIndices.length > 0 && this._flushDeletedTask.flush();
  }
  *getKeyIterator(e) {
    if (this._flushCleanupInserted(), this._flushCleanupDeleted(), this._array.length !== 0 && (He = this._search(e), !(He < 0 || He >= this._array.length) && this._getKey(this._array[He]) === e)) do
      yield this._array[He];
    while (++He < this._array.length && this._getKey(this._array[He]) === e);
  }
  forEachByKey(e, t) {
    if (this._flushCleanupInserted(), this._flushCleanupDeleted(), this._array.length !== 0 && (He = this._search(e), !(He < 0 || He >= this._array.length) && this._getKey(this._array[He]) === e)) do
      t(this._array[He]);
    while (++He < this._array.length && this._getKey(this._array[He]) === e);
  }
  values() {
    return this._flushCleanupInserted(), this._flushCleanupDeleted(), [...this._array].values();
  }
  _search(e) {
    let t = 0, s = this._array.length - 1;
    for (; s >= t; ) {
      let r = t + s >> 1, n = this._getKey(this._array[r]);
      if (n > e) s = r - 1;
      else if (n < e) t = r + 1;
      else {
        for (; r > 0 && this._getKey(this._array[r - 1]) === e; ) r--;
        return r;
      }
    }
    return t;
  }
}, sn = 0, Ja = 0, of = class extends ue {
  constructor() {
    super(), this._decorations = new nf((e) => e == null ? void 0 : e.marker.line), this._onDecorationRegistered = this._register(new K()), this.onDecorationRegistered = this._onDecorationRegistered.event, this._onDecorationRemoved = this._register(new K()), this.onDecorationRemoved = this._onDecorationRemoved.event, this._register(Ae(() => this.reset()));
  }
  get decorations() {
    return this._decorations.values();
  }
  registerDecoration(e) {
    if (e.marker.isDisposed) return;
    let t = new af(e);
    if (t) {
      let s = t.marker.onDispose(() => t.dispose()), r = t.onDispose(() => {
        r.dispose(), t && (this._decorations.delete(t) && this._onDecorationRemoved.fire(t), s.dispose());
      });
      this._decorations.insert(t), this._onDecorationRegistered.fire(t);
    }
    return t;
  }
  reset() {
    for (let e of this._decorations.values()) e.dispose();
    this._decorations.clear();
  }
  *getDecorationsAtCell(e, t, s) {
    let r = 0, n = 0;
    for (let o of this._decorations.getKeyIterator(t)) r = o.options.x ?? 0, n = r + (o.options.width ?? 1), e >= r && e < n && (!s || (o.options.layer ?? "bottom") === s) && (yield o);
  }
  forEachDecorationAtCell(e, t, s, r) {
    this._decorations.forEachByKey(t, (n) => {
      sn = n.options.x ?? 0, Ja = sn + (n.options.width ?? 1), e >= sn && e < Ja && (!s || (n.options.layer ?? "bottom") === s) && r(n);
    });
  }
}, af = class extends Bi {
  constructor(e) {
    super(), this.options = e, this.onRenderEmitter = this.add(new K()), this.onRender = this.onRenderEmitter.event, this._onDispose = this.add(new K()), this.onDispose = this._onDispose.event, this._cachedBg = null, this._cachedFg = null, this.marker = e.marker, this.options.overviewRulerOptions && !this.options.overviewRulerOptions.position && (this.options.overviewRulerOptions.position = "full");
  }
  get backgroundColorRGB() {
    return this._cachedBg === null && (this.options.backgroundColor ? this._cachedBg = Pe.toColor(this.options.backgroundColor) : this._cachedBg = void 0), this._cachedBg;
  }
  get foregroundColorRGB() {
    return this._cachedFg === null && (this.options.foregroundColor ? this._cachedFg = Pe.toColor(this.options.foregroundColor) : this._cachedFg = void 0), this._cachedFg;
  }
  dispose() {
    this._onDispose.fire(), super.dispose();
  }
}, lf = 1e3, hf = class {
  constructor(e, t = lf) {
    this._renderCallback = e, this._debounceThresholdMS = t, this._lastRefreshMs = 0, this._additionalRefreshRequested = !1;
  }
  dispose() {
    this._refreshTimeoutID && clearTimeout(this._refreshTimeoutID);
  }
  refresh(e, t, s) {
    this._rowCount = s, e = e !== void 0 ? e : 0, t = t !== void 0 ? t : this._rowCount - 1, this._rowStart = this._rowStart !== void 0 ? Math.min(this._rowStart, e) : e, this._rowEnd = this._rowEnd !== void 0 ? Math.max(this._rowEnd, t) : t;
    let r = performance.now();
    if (r - this._lastRefreshMs >= this._debounceThresholdMS) this._lastRefreshMs = r, this._innerRefresh();
    else if (!this._additionalRefreshRequested) {
      let n = r - this._lastRefreshMs, o = this._debounceThresholdMS - n;
      this._additionalRefreshRequested = !0, this._refreshTimeoutID = window.setTimeout(() => {
        this._lastRefreshMs = performance.now(), this._innerRefresh(), this._additionalRefreshRequested = !1, this._refreshTimeoutID = void 0;
      }, o);
    }
  }
  _innerRefresh() {
    if (this._rowStart === void 0 || this._rowEnd === void 0 || this._rowCount === void 0) return;
    let e = Math.max(this._rowStart, 0), t = Math.min(this._rowEnd, this._rowCount - 1);
    this._rowStart = void 0, this._rowEnd = void 0, this._renderCallback(e, t);
  }
}, Qa = 20, Mr = class extends ue {
  constructor(e, t, s, r) {
    super(), this._terminal = e, this._coreBrowserService = s, this._renderService = r, this._rowColumns = /* @__PURE__ */ new WeakMap(), this._liveRegionLineCount = 0, this._charsToConsume = [], this._charsToAnnounce = "";
    let n = this._coreBrowserService.mainDocument;
    this._accessibilityContainer = n.createElement("div"), this._accessibilityContainer.classList.add("xterm-accessibility"), this._rowContainer = n.createElement("div"), this._rowContainer.setAttribute("role", "list"), this._rowContainer.classList.add("xterm-accessibility-tree"), this._rowElements = [];
    for (let o = 0; o < this._terminal.rows; o++) this._rowElements[o] = this._createAccessibilityTreeNode(), this._rowContainer.appendChild(this._rowElements[o]);
    if (this._topBoundaryFocusListener = (o) => this._handleBoundaryFocus(o, 0), this._bottomBoundaryFocusListener = (o) => this._handleBoundaryFocus(o, 1), this._rowElements[0].addEventListener("focus", this._topBoundaryFocusListener), this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._accessibilityContainer.appendChild(this._rowContainer), this._liveRegion = n.createElement("div"), this._liveRegion.classList.add("live-region"), this._liveRegion.setAttribute("aria-live", "assertive"), this._accessibilityContainer.appendChild(this._liveRegion), this._liveRegionDebouncer = this._register(new hf(this._renderRows.bind(this))), !this._terminal.element) throw new Error("Cannot enable accessibility before Terminal.open");
    this._terminal.element.insertAdjacentElement("afterbegin", this._accessibilityContainer), this._register(this._terminal.onResize((o) => this._handleResize(o.rows))), this._register(this._terminal.onRender((o) => this._refreshRows(o.start, o.end))), this._register(this._terminal.onScroll(() => this._refreshRows())), this._register(this._terminal.onA11yChar((o) => this._handleChar(o))), this._register(this._terminal.onLineFeed(() => this._handleChar(`
`))), this._register(this._terminal.onA11yTab((o) => this._handleTab(o))), this._register(this._terminal.onKey((o) => this._handleKey(o.key))), this._register(this._terminal.onBlur(() => this._clearLiveRegion())), this._register(this._renderService.onDimensionsChange(() => this._refreshRowsDimensions())), this._register(oe(n, "selectionchange", () => this._handleSelectionChange())), this._register(this._coreBrowserService.onDprChange(() => this._refreshRowsDimensions())), this._refreshRowsDimensions(), this._refreshRows(), this._register(Ae(() => {
      this._accessibilityContainer.remove(), this._rowElements.length = 0;
    }));
  }
  _handleTab(e) {
    for (let t = 0; t < e; t++) this._handleChar(" ");
  }
  _handleChar(e) {
    this._liveRegionLineCount < Qa + 1 && (this._charsToConsume.length > 0 ? this._charsToConsume.shift() !== e && (this._charsToAnnounce += e) : this._charsToAnnounce += e, e === `
` && (this._liveRegionLineCount++, this._liveRegionLineCount === Qa + 1 && (this._liveRegion.textContent += Ln.get())));
  }
  _clearLiveRegion() {
    this._liveRegion.textContent = "", this._liveRegionLineCount = 0;
  }
  _handleKey(e) {
    this._clearLiveRegion(), new RegExp("\\p{Control}", "u").test(e) || this._charsToConsume.push(e);
  }
  _refreshRows(e, t) {
    this._liveRegionDebouncer.refresh(e, t, this._terminal.rows);
  }
  _renderRows(e, t) {
    let s = this._terminal.buffer, r = s.lines.length.toString();
    for (let n = e; n <= t; n++) {
      let o = s.lines.get(s.ydisp + n), a = [], l = (o == null ? void 0 : o.translateToString(!0, void 0, void 0, a)) || "", c = (s.ydisp + n + 1).toString(), h = this._rowElements[n];
      h && (l.length === 0 ? (h.textContent = " ", this._rowColumns.set(h, [0, 1])) : (h.textContent = l, this._rowColumns.set(h, a)), h.setAttribute("aria-posinset", c), h.setAttribute("aria-setsize", r), this._alignRowWidth(h));
    }
    this._announceCharacters();
  }
  _announceCharacters() {
    this._charsToAnnounce.length !== 0 && (this._liveRegion.textContent += this._charsToAnnounce, this._charsToAnnounce = "");
  }
  _handleBoundaryFocus(e, t) {
    let s = e.target, r = this._rowElements[t === 0 ? 1 : this._rowElements.length - 2], n = s.getAttribute("aria-posinset"), o = t === 0 ? "1" : `${this._terminal.buffer.lines.length}`;
    if (n === o || e.relatedTarget !== r) return;
    let a, l;
    if (t === 0 ? (a = s, l = this._rowElements.pop(), this._rowContainer.removeChild(l)) : (a = this._rowElements.shift(), l = s, this._rowContainer.removeChild(a)), a.removeEventListener("focus", this._topBoundaryFocusListener), l.removeEventListener("focus", this._bottomBoundaryFocusListener), t === 0) {
      let c = this._createAccessibilityTreeNode();
      this._rowElements.unshift(c), this._rowContainer.insertAdjacentElement("afterbegin", c);
    } else {
      let c = this._createAccessibilityTreeNode();
      this._rowElements.push(c), this._rowContainer.appendChild(c);
    }
    this._rowElements[0].addEventListener("focus", this._topBoundaryFocusListener), this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._terminal.scrollLines(t === 0 ? -1 : 1), this._rowElements[t === 0 ? 1 : this._rowElements.length - 2].focus(), e.preventDefault(), e.stopImmediatePropagation();
  }
  _handleSelectionChange() {
    var e;
    if (this._rowElements.length === 0) return;
    let t = this._coreBrowserService.mainDocument.getSelection();
    if (!t) return;
    if (t.isCollapsed) {
      this._rowContainer.contains(t.anchorNode) && this._terminal.clearSelection();
      return;
    }
    if (!t.anchorNode || !t.focusNode) {
      console.error("anchorNode and/or focusNode are null");
      return;
    }
    let s = { node: t.anchorNode, offset: t.anchorOffset }, r = { node: t.focusNode, offset: t.focusOffset };
    if ((s.node.compareDocumentPosition(r.node) & Node.DOCUMENT_POSITION_PRECEDING || s.node === r.node && s.offset > r.offset) && ([s, r] = [r, s]), s.node.compareDocumentPosition(this._rowElements[0]) & (Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING) && (s = { node: this._rowElements[0].childNodes[0], offset: 0 }), !this._rowContainer.contains(s.node)) return;
    let n = this._rowElements.slice(-1)[0];
    if (r.node.compareDocumentPosition(n) & (Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_PRECEDING) && (r = { node: n, offset: ((e = n.textContent) == null ? void 0 : e.length) ?? 0 }), !this._rowContainer.contains(r.node)) return;
    let o = ({ node: c, offset: h }) => {
      let d = c instanceof Text ? c.parentNode : c, u = parseInt(d == null ? void 0 : d.getAttribute("aria-posinset"), 10) - 1;
      if (isNaN(u)) return console.warn("row is invalid. Race condition?"), null;
      let f = this._rowColumns.get(d);
      if (!f) return console.warn("columns is null. Race condition?"), null;
      let _ = h < f.length ? f[h] : f.slice(-1)[0] + 1;
      return _ >= this._terminal.cols && (++u, _ = 0), { row: u, column: _ };
    }, a = o(s), l = o(r);
    if (!(!a || !l)) {
      if (a.row > l.row || a.row === l.row && a.column >= l.column) throw new Error("invalid range");
      this._terminal.select(a.column, a.row, (l.row - a.row) * this._terminal.cols - a.column + l.column);
    }
  }
  _handleResize(e) {
    this._rowElements[this._rowElements.length - 1].removeEventListener("focus", this._bottomBoundaryFocusListener);
    for (let t = this._rowContainer.children.length; t < this._terminal.rows; t++) this._rowElements[t] = this._createAccessibilityTreeNode(), this._rowContainer.appendChild(this._rowElements[t]);
    for (; this._rowElements.length > e; ) this._rowContainer.removeChild(this._rowElements.pop());
    this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._refreshRowsDimensions();
  }
  _createAccessibilityTreeNode() {
    let e = this._coreBrowserService.mainDocument.createElement("div");
    return e.setAttribute("role", "listitem"), e.tabIndex = -1, this._refreshRowDimensions(e), e;
  }
  _refreshRowsDimensions() {
    if (this._renderService.dimensions.css.cell.height) {
      Object.assign(this._accessibilityContainer.style, { width: `${this._renderService.dimensions.css.canvas.width}px`, fontSize: `${this._terminal.options.fontSize}px` }), this._rowElements.length !== this._terminal.rows && this._handleResize(this._terminal.rows);
      for (let e = 0; e < this._terminal.rows; e++) this._refreshRowDimensions(this._rowElements[e]), this._alignRowWidth(this._rowElements[e]);
    }
  }
  _refreshRowDimensions(e) {
    e.style.height = `${this._renderService.dimensions.css.cell.height}px`;
  }
  _alignRowWidth(e) {
    var t, s;
    e.style.transform = "";
    let r = e.getBoundingClientRect().width, n = (s = (t = this._rowColumns.get(e)) == null ? void 0 : t.slice(-1)) == null ? void 0 : s[0];
    if (!n) return;
    let o = n * this._renderService.dimensions.css.cell.width;
    e.style.transform = `scaleX(${o / r})`;
  }
};
Mr = $e([X(1, Lo), X(2, di), X(3, ui)], Mr);
var co = class extends ue {
  constructor(e, t, s, r, n) {
    super(), this._element = e, this._mouseService = t, this._renderService = s, this._bufferService = r, this._linkProviderService = n, this._linkCacheDisposables = [], this._isMouseOut = !0, this._wasResized = !1, this._activeLine = -1, this._onShowLinkUnderline = this._register(new K()), this.onShowLinkUnderline = this._onShowLinkUnderline.event, this._onHideLinkUnderline = this._register(new K()), this.onHideLinkUnderline = this._onHideLinkUnderline.event, this._register(Ae(() => {
      var o;
      Yi(this._linkCacheDisposables), this._linkCacheDisposables.length = 0, this._lastMouseEvent = void 0, (o = this._activeProviderReplies) == null || o.clear();
    })), this._register(this._bufferService.onResize(() => {
      this._clearCurrentLink(), this._wasResized = !0;
    })), this._register(oe(this._element, "mouseleave", () => {
      this._isMouseOut = !0, this._clearCurrentLink();
    })), this._register(oe(this._element, "mousemove", this._handleMouseMove.bind(this))), this._register(oe(this._element, "mousedown", this._handleMouseDown.bind(this))), this._register(oe(this._element, "mouseup", this._handleMouseUp.bind(this)));
  }
  get currentLink() {
    return this._currentLink;
  }
  _handleMouseMove(e) {
    this._lastMouseEvent = e;
    let t = this._positionFromMouseEvent(e, this._element, this._mouseService);
    if (!t) return;
    this._isMouseOut = !1;
    let s = e.composedPath();
    for (let r = 0; r < s.length; r++) {
      let n = s[r];
      if (n.classList.contains("xterm")) break;
      if (n.classList.contains("xterm-hover")) return;
    }
    (!this._lastBufferCell || t.x !== this._lastBufferCell.x || t.y !== this._lastBufferCell.y) && (this._handleHover(t), this._lastBufferCell = t);
  }
  _handleHover(e) {
    if (this._activeLine !== e.y || this._wasResized) {
      this._clearCurrentLink(), this._askForLink(e, !1), this._wasResized = !1;
      return;
    }
    this._currentLink && this._linkAtPosition(this._currentLink.link, e) || (this._clearCurrentLink(), this._askForLink(e, !0));
  }
  _askForLink(e, t) {
    var s, r;
    (!this._activeProviderReplies || !t) && ((s = this._activeProviderReplies) == null || s.forEach((o) => {
      o == null || o.forEach((a) => {
        a.link.dispose && a.link.dispose();
      });
    }), this._activeProviderReplies = /* @__PURE__ */ new Map(), this._activeLine = e.y);
    let n = !1;
    for (let [o, a] of this._linkProviderService.linkProviders.entries()) t ? (r = this._activeProviderReplies) != null && r.get(o) && (n = this._checkLinkProviderResult(o, e, n)) : a.provideLinks(e.y, (l) => {
      var c, h;
      if (this._isMouseOut) return;
      let d = l == null ? void 0 : l.map((u) => ({ link: u }));
      (c = this._activeProviderReplies) == null || c.set(o, d), n = this._checkLinkProviderResult(o, e, n), ((h = this._activeProviderReplies) == null ? void 0 : h.size) === this._linkProviderService.linkProviders.length && this._removeIntersectingLinks(e.y, this._activeProviderReplies);
    });
  }
  _removeIntersectingLinks(e, t) {
    let s = /* @__PURE__ */ new Set();
    for (let r = 0; r < t.size; r++) {
      let n = t.get(r);
      if (n) for (let o = 0; o < n.length; o++) {
        let a = n[o], l = a.link.range.start.y < e ? 0 : a.link.range.start.x, c = a.link.range.end.y > e ? this._bufferService.cols : a.link.range.end.x;
        for (let h = l; h <= c; h++) {
          if (s.has(h)) {
            n.splice(o--, 1);
            break;
          }
          s.add(h);
        }
      }
    }
  }
  _checkLinkProviderResult(e, t, s) {
    var r;
    if (!this._activeProviderReplies) return s;
    let n = this._activeProviderReplies.get(e), o = !1;
    for (let a = 0; a < e; a++) (!this._activeProviderReplies.has(a) || this._activeProviderReplies.get(a)) && (o = !0);
    if (!o && n) {
      let a = n.find((l) => this._linkAtPosition(l.link, t));
      a && (s = !0, this._handleNewLink(a));
    }
    if (this._activeProviderReplies.size === this._linkProviderService.linkProviders.length && !s) for (let a = 0; a < this._activeProviderReplies.size; a++) {
      let l = (r = this._activeProviderReplies.get(a)) == null ? void 0 : r.find((c) => this._linkAtPosition(c.link, t));
      if (l) {
        s = !0, this._handleNewLink(l);
        break;
      }
    }
    return s;
  }
  _handleMouseDown() {
    this._mouseDownLink = this._currentLink;
  }
  _handleMouseUp(e) {
    if (!this._currentLink) return;
    let t = this._positionFromMouseEvent(e, this._element, this._mouseService);
    t && this._mouseDownLink && cf(this._mouseDownLink.link, this._currentLink.link) && this._linkAtPosition(this._currentLink.link, t) && this._currentLink.link.activate(e, this._currentLink.link.text);
  }
  _clearCurrentLink(e, t) {
    !this._currentLink || !this._lastMouseEvent || (!e || !t || this._currentLink.link.range.start.y >= e && this._currentLink.link.range.end.y <= t) && (this._linkLeave(this._element, this._currentLink.link, this._lastMouseEvent), this._currentLink = void 0, Yi(this._linkCacheDisposables), this._linkCacheDisposables.length = 0);
  }
  _handleNewLink(e) {
    if (!this._lastMouseEvent) return;
    let t = this._positionFromMouseEvent(this._lastMouseEvent, this._element, this._mouseService);
    t && this._linkAtPosition(e.link, t) && (this._currentLink = e, this._currentLink.state = { decorations: { underline: e.link.decorations === void 0 ? !0 : e.link.decorations.underline, pointerCursor: e.link.decorations === void 0 ? !0 : e.link.decorations.pointerCursor }, isHovered: !0 }, this._linkHover(this._element, e.link, this._lastMouseEvent), e.link.decorations = {}, Object.defineProperties(e.link.decorations, { pointerCursor: { get: () => {
      var s, r;
      return (r = (s = this._currentLink) == null ? void 0 : s.state) == null ? void 0 : r.decorations.pointerCursor;
    }, set: (s) => {
      var r;
      (r = this._currentLink) != null && r.state && this._currentLink.state.decorations.pointerCursor !== s && (this._currentLink.state.decorations.pointerCursor = s, this._currentLink.state.isHovered && this._element.classList.toggle("xterm-cursor-pointer", s));
    } }, underline: { get: () => {
      var s, r;
      return (r = (s = this._currentLink) == null ? void 0 : s.state) == null ? void 0 : r.decorations.underline;
    }, set: (s) => {
      var r, n, o;
      (r = this._currentLink) != null && r.state && ((o = (n = this._currentLink) == null ? void 0 : n.state) == null ? void 0 : o.decorations.underline) !== s && (this._currentLink.state.decorations.underline = s, this._currentLink.state.isHovered && this._fireUnderlineEvent(e.link, s));
    } } }), this._linkCacheDisposables.push(this._renderService.onRenderedViewportChange((s) => {
      if (!this._currentLink) return;
      let r = s.start === 0 ? 0 : s.start + 1 + this._bufferService.buffer.ydisp, n = this._bufferService.buffer.ydisp + 1 + s.end;
      if (this._currentLink.link.range.start.y >= r && this._currentLink.link.range.end.y <= n && (this._clearCurrentLink(r, n), this._lastMouseEvent)) {
        let o = this._positionFromMouseEvent(this._lastMouseEvent, this._element, this._mouseService);
        o && this._askForLink(o, !1);
      }
    })));
  }
  _linkHover(e, t, s) {
    var r;
    (r = this._currentLink) != null && r.state && (this._currentLink.state.isHovered = !0, this._currentLink.state.decorations.underline && this._fireUnderlineEvent(t, !0), this._currentLink.state.decorations.pointerCursor && e.classList.add("xterm-cursor-pointer")), t.hover && t.hover(s, t.text);
  }
  _fireUnderlineEvent(e, t) {
    let s = e.range, r = this._bufferService.buffer.ydisp, n = this._createLinkUnderlineEvent(s.start.x - 1, s.start.y - r - 1, s.end.x, s.end.y - r - 1, void 0);
    (t ? this._onShowLinkUnderline : this._onHideLinkUnderline).fire(n);
  }
  _linkLeave(e, t, s) {
    var r;
    (r = this._currentLink) != null && r.state && (this._currentLink.state.isHovered = !1, this._currentLink.state.decorations.underline && this._fireUnderlineEvent(t, !1), this._currentLink.state.decorations.pointerCursor && e.classList.remove("xterm-cursor-pointer")), t.leave && t.leave(s, t.text);
  }
  _linkAtPosition(e, t) {
    let s = e.range.start.y * this._bufferService.cols + e.range.start.x, r = e.range.end.y * this._bufferService.cols + e.range.end.x, n = t.y * this._bufferService.cols + t.x;
    return s <= n && n <= r;
  }
  _positionFromMouseEvent(e, t, s) {
    let r = s.getCoords(e, t, this._bufferService.cols, this._bufferService.rows);
    if (r) return { x: r[0], y: r[1] + this._bufferService.buffer.ydisp };
  }
  _createLinkUnderlineEvent(e, t, s, r, n) {
    return { x1: e, y1: t, x2: s, y2: r, cols: this._bufferService.cols, fg: n };
  }
};
co = $e([X(1, Mo), X(2, ui), X(3, mt), X(4, ch)], co);
function cf(e, t) {
  return e.text === t.text && e.range.start.x === t.range.start.x && e.range.start.y === t.range.start.y && e.range.end.x === t.range.end.x && e.range.end.y === t.range.end.y;
}
var df = class extends tf {
  constructor(e = {}) {
    super(e), this._linkifier = this._register(new gs()), this.browser = Lh, this._keyDownHandled = !1, this._keyDownSeen = !1, this._keyPressHandled = !1, this._unprocessedDeadKey = !1, this._accessibilityManager = this._register(new gs()), this._onCursorMove = this._register(new K()), this.onCursorMove = this._onCursorMove.event, this._onKey = this._register(new K()), this.onKey = this._onKey.event, this._onRender = this._register(new K()), this.onRender = this._onRender.event, this._onSelectionChange = this._register(new K()), this.onSelectionChange = this._onSelectionChange.event, this._onTitleChange = this._register(new K()), this.onTitleChange = this._onTitleChange.event, this._onBell = this._register(new K()), this.onBell = this._onBell.event, this._onFocus = this._register(new K()), this._onBlur = this._register(new K()), this._onA11yCharEmitter = this._register(new K()), this._onA11yTabEmitter = this._register(new K()), this._onWillOpen = this._register(new K()), this._setup(), this._decorationService = this._instantiationService.createInstance(of), this._instantiationService.setService(js, this._decorationService), this._linkProviderService = this._instantiationService.createInstance(Qu), this._instantiationService.setService(ch, this._linkProviderService), this._linkProviderService.registerLinkProvider(this._instantiationService.createInstance(En)), this._register(this._inputHandler.onRequestBell(() => this._onBell.fire())), this._register(this._inputHandler.onRequestRefreshRows((t) => this.refresh((t == null ? void 0 : t.start) ?? 0, (t == null ? void 0 : t.end) ?? this.rows - 1))), this._register(this._inputHandler.onRequestSendFocus(() => this._reportFocus())), this._register(this._inputHandler.onRequestReset(() => this.reset())), this._register(this._inputHandler.onRequestWindowsOptionsReport((t) => this._reportWindowsOptions(t))), this._register(this._inputHandler.onColor((t) => this._handleColorEvent(t))), this._register(ot.forward(this._inputHandler.onCursorMove, this._onCursorMove)), this._register(ot.forward(this._inputHandler.onTitleChange, this._onTitleChange)), this._register(ot.forward(this._inputHandler.onA11yChar, this._onA11yCharEmitter)), this._register(ot.forward(this._inputHandler.onA11yTab, this._onA11yTabEmitter)), this._register(this._bufferService.onResize((t) => this._afterResize(t.cols, t.rows))), this._register(Ae(() => {
      var t, s;
      this._customKeyEventHandler = void 0, (s = (t = this.element) == null ? void 0 : t.parentNode) == null || s.removeChild(this.element);
    }));
  }
  get linkifier() {
    return this._linkifier.value;
  }
  get onFocus() {
    return this._onFocus.event;
  }
  get onBlur() {
    return this._onBlur.event;
  }
  get onA11yChar() {
    return this._onA11yCharEmitter.event;
  }
  get onA11yTab() {
    return this._onA11yTabEmitter.event;
  }
  get onWillOpen() {
    return this._onWillOpen.event;
  }
  _handleColorEvent(e) {
    if (this._themeService) for (let t of e) {
      let s, r = "";
      switch (t.index) {
        case 256:
          s = "foreground", r = "10";
          break;
        case 257:
          s = "background", r = "11";
          break;
        case 258:
          s = "cursor", r = "12";
          break;
        default:
          s = "ansi", r = "4;" + t.index;
      }
      switch (t.type) {
        case 0:
          let n = De.toColorRGB(s === "ansi" ? this._themeService.colors.ansi[t.index] : this._themeService.colors[s]);
          this.coreService.triggerDataEvent(`${O.ESC}]${r};${G_(n)}${jn.ST}`);
          break;
        case 1:
          if (s === "ansi") this._themeService.modifyColors((o) => o.ansi[t.index] = Ue.toColor(...t.color));
          else {
            let o = s;
            this._themeService.modifyColors((a) => a[o] = Ue.toColor(...t.color));
          }
          break;
        case 2:
          this._themeService.restoreColor(t.index);
          break;
      }
    }
  }
  _setup() {
    super._setup(), this._customKeyEventHandler = void 0;
  }
  get buffer() {
    return this.buffers.active;
  }
  focus() {
    this.textarea && this.textarea.focus({ preventScroll: !0 });
  }
  _handleScreenReaderModeOptionChange(e) {
    e ? !this._accessibilityManager.value && this._renderService && (this._accessibilityManager.value = this._instantiationService.createInstance(Mr, this)) : this._accessibilityManager.clear();
  }
  _handleTextAreaFocus(e) {
    this.coreService.decPrivateModes.sendFocus && this.coreService.triggerDataEvent(O.ESC + "[I"), this.element.classList.add("focus"), this._showCursor(), this._onFocus.fire();
  }
  blur() {
    var e;
    return (e = this.textarea) == null ? void 0 : e.blur();
  }
  _handleTextAreaBlur() {
    this.textarea.value = "", this.refresh(this.buffer.y, this.buffer.y), this.coreService.decPrivateModes.sendFocus && this.coreService.triggerDataEvent(O.ESC + "[O"), this.element.classList.remove("focus"), this._onBlur.fire();
  }
  _syncTextArea() {
    if (!this.textarea || !this.buffer.isCursorInViewport || this._compositionHelper.isComposing || !this._renderService) return;
    let e = this.buffer.ybase + this.buffer.y, t = this.buffer.lines.get(e);
    if (!t) return;
    let s = Math.min(this.buffer.x, this.cols - 1), r = this._renderService.dimensions.css.cell.height, n = t.getWidth(s), o = this._renderService.dimensions.css.cell.width * n, a = this.buffer.y * this._renderService.dimensions.css.cell.height, l = s * this._renderService.dimensions.css.cell.width;
    this.textarea.style.left = l + "px", this.textarea.style.top = a + "px", this.textarea.style.width = o + "px", this.textarea.style.height = r + "px", this.textarea.style.lineHeight = r + "px", this.textarea.style.zIndex = "-5";
  }
  _initGlobal() {
    this._bindKeys(), this._register(oe(this.element, "copy", (t) => {
      this.hasSelection() && wd(t, this._selectionService);
    }));
    let e = (t) => Sd(t, this.textarea, this.coreService, this.optionsService);
    this._register(oe(this.textarea, "paste", e)), this._register(oe(this.element, "paste", e)), Mh ? this._register(oe(this.element, "mousedown", (t) => {
      t.button === 2 && ia(t, this.textarea, this.screenElement, this._selectionService, this.options.rightClickSelectsWord);
    })) : this._register(oe(this.element, "contextmenu", (t) => {
      ia(t, this.textarea, this.screenElement, this._selectionService, this.options.rightClickSelectsWord);
    })), No && this._register(oe(this.element, "auxclick", (t) => {
      t.button === 1 && th(t, this.textarea, this.screenElement);
    }));
  }
  _bindKeys() {
    this._register(oe(this.textarea, "keyup", (e) => this._keyUp(e), !0)), this._register(oe(this.textarea, "keydown", (e) => this._keyDown(e), !0)), this._register(oe(this.textarea, "keypress", (e) => this._keyPress(e), !0)), this._register(oe(this.textarea, "compositionstart", () => this._compositionHelper.compositionstart())), this._register(oe(this.textarea, "compositionupdate", (e) => this._compositionHelper.compositionupdate(e))), this._register(oe(this.textarea, "compositionend", () => this._compositionHelper.compositionend())), this._register(oe(this.textarea, "input", (e) => this._inputEvent(e), !0)), this._register(this.onRender(() => this._compositionHelper.updateCompositionElements()));
  }
  open(e) {
    var t;
    if (!e) throw new Error("Terminal requires a parent element.");
    if (e.isConnected || this._logService.debug("Terminal.open was called on an element that was not attached to the DOM"), ((t = this.element) == null ? void 0 : t.ownerDocument.defaultView) && this._coreBrowserService) {
      this.element.ownerDocument.defaultView !== this._coreBrowserService.window && (this._coreBrowserService.window = this.element.ownerDocument.defaultView);
      return;
    }
    this._document = e.ownerDocument, this.options.documentOverride && this.options.documentOverride instanceof Document && (this._document = this.optionsService.rawOptions.documentOverride), this.element = this._document.createElement("div"), this.element.dir = "ltr", this.element.classList.add("terminal"), this.element.classList.add("xterm"), e.appendChild(this.element);
    let s = this._document.createDocumentFragment();
    this._viewportElement = this._document.createElement("div"), this._viewportElement.classList.add("xterm-viewport"), s.appendChild(this._viewportElement), this.screenElement = this._document.createElement("div"), this.screenElement.classList.add("xterm-screen"), this._register(oe(this.screenElement, "mousemove", (o) => this.updateCursorStyle(o))), this._helperContainer = this._document.createElement("div"), this._helperContainer.classList.add("xterm-helpers"), this.screenElement.appendChild(this._helperContainer), s.appendChild(this.screenElement);
    let r = this.textarea = this._document.createElement("textarea");
    this.textarea.classList.add("xterm-helper-textarea"), this.textarea.setAttribute("aria-label", kn.get()), Rh || this.textarea.setAttribute("aria-multiline", "false"), this.textarea.setAttribute("autocorrect", "off"), this.textarea.setAttribute("autocapitalize", "off"), this.textarea.setAttribute("spellcheck", "false"), this.textarea.tabIndex = 0, this._register(this.optionsService.onSpecificOptionChange("disableStdin", () => r.readOnly = this.optionsService.rawOptions.disableStdin)), this.textarea.readOnly = this.optionsService.rawOptions.disableStdin, this._coreBrowserService = this._register(this._instantiationService.createInstance(Zu, this.textarea, e.ownerDocument.defaultView ?? window, this._document ?? typeof window < "u" ? window.document : null)), this._instantiationService.setService(di, this._coreBrowserService), this._register(oe(this.textarea, "focus", (o) => this._handleTextAreaFocus(o))), this._register(oe(this.textarea, "blur", () => this._handleTextAreaBlur())), this._helperContainer.appendChild(this.textarea), this._charSizeService = this._instantiationService.createInstance(Jn, this._document, this._helperContainer), this._instantiationService.setService(Pr, this._charSizeService), this._themeService = this._instantiationService.createInstance(io), this._instantiationService.setService(vs, this._themeService), this._characterJoinerService = this._instantiationService.createInstance(xr), this._instantiationService.setService(hh, this._characterJoinerService), this._renderService = this._register(this._instantiationService.createInstance(eo, this.rows, this.screenElement)), this._instantiationService.setService(ui, this._renderService), this._register(this._renderService.onRenderedViewportChange((o) => this._onRender.fire(o))), this.onResize((o) => this._renderService.resize(o.cols, o.rows)), this._compositionView = this._document.createElement("div"), this._compositionView.classList.add("composition-view"), this._compositionHelper = this._instantiationService.createInstance(Gn, this.textarea, this._compositionView), this._helperContainer.appendChild(this._compositionView), this._mouseService = this._instantiationService.createInstance(Qn), this._instantiationService.setService(Mo, this._mouseService);
    let n = this._linkifier.value = this._register(this._instantiationService.createInstance(co, this.screenElement));
    this.element.appendChild(s);
    try {
      this._onWillOpen.fire(this.element);
    } catch {
    }
    this._renderService.hasRenderer() || this._renderService.setRenderer(this._createRenderer()), this._register(this.onCursorMove(() => {
      this._renderService.handleCursorMove(), this._syncTextArea();
    })), this._register(this.onResize(() => this._renderService.handleResize(this.cols, this.rows))), this._register(this.onBlur(() => this._renderService.handleBlur())), this._register(this.onFocus(() => this._renderService.handleFocus())), this._viewport = this._register(this._instantiationService.createInstance(qn, this.element, this.screenElement)), this._register(this._viewport.onRequestScrollLines((o) => {
      super.scrollLines(o, !1), this.refresh(0, this.rows - 1);
    })), this._selectionService = this._register(this._instantiationService.createInstance(to, this.element, this.screenElement, n)), this._instantiationService.setService(Ed, this._selectionService), this._register(this._selectionService.onRequestScrollLines((o) => this.scrollLines(o.amount, o.suppressScrollEvent))), this._register(this._selectionService.onSelectionChange(() => this._onSelectionChange.fire())), this._register(this._selectionService.onRequestRedraw((o) => this._renderService.handleSelectionChanged(o.start, o.end, o.columnSelectMode))), this._register(this._selectionService.onLinuxMouseSelection((o) => {
      this.textarea.value = o, this.textarea.focus(), this.textarea.select();
    })), this._register(ot.any(this._onScroll.event, this._inputHandler.onScroll)(() => {
      var o;
      this._selectionService.refresh(), (o = this._viewport) == null || o.queueSync();
    })), this._register(this._instantiationService.createInstance(Yn, this.screenElement)), this._register(oe(this.element, "mousedown", (o) => this._selectionService.handleMouseDown(o))), this.coreMouseService.areMouseEventsActive ? (this._selectionService.disable(), this.element.classList.add("enable-mouse-events")) : this._selectionService.enable(), this.options.screenReaderMode && (this._accessibilityManager.value = this._instantiationService.createInstance(Mr, this)), this._register(this.optionsService.onSpecificOptionChange("screenReaderMode", (o) => this._handleScreenReaderModeOptionChange(o))), this.options.overviewRuler.width && (this._overviewRulerRenderer = this._register(this._instantiationService.createInstance(Cr, this._viewportElement, this.screenElement))), this.optionsService.onSpecificOptionChange("overviewRuler", (o) => {
      !this._overviewRulerRenderer && o && this._viewportElement && this.screenElement && (this._overviewRulerRenderer = this._register(this._instantiationService.createInstance(Cr, this._viewportElement, this.screenElement)));
    }), this._charSizeService.measure(), this.refresh(0, this.rows - 1), this._initGlobal(), this.bindMouse();
  }
  _createRenderer() {
    return this._instantiationService.createInstance(Zn, this, this._document, this.element, this.screenElement, this._viewportElement, this._helperContainer, this.linkifier);
  }
  bindMouse() {
    let e = this, t = this.element;
    function s(o) {
      var a, l, c, h, d;
      let u = e._mouseService.getMouseReportCoords(o, e.screenElement);
      if (!u) return !1;
      let f, _;
      switch (o.overrideType || o.type) {
        case "mousemove":
          _ = 32, o.buttons === void 0 ? (f = 3, o.button !== void 0 && (f = o.button < 3 ? o.button : 3)) : f = o.buttons & 1 ? 0 : o.buttons & 4 ? 1 : o.buttons & 2 ? 2 : 3;
          break;
        case "mouseup":
          _ = 0, f = o.button < 3 ? o.button : 3;
          break;
        case "mousedown":
          _ = 1, f = o.button < 3 ? o.button : 3;
          break;
        case "wheel":
          if (e._customWheelEventHandler && e._customWheelEventHandler(o) === !1) return !1;
          let g = o.deltaY;
          if (g === 0 || e.coreMouseService.consumeWheelEvent(o, (h = (c = (l = (a = e._renderService) == null ? void 0 : a.dimensions) == null ? void 0 : l.device) == null ? void 0 : c.cell) == null ? void 0 : h.height, (d = e._coreBrowserService) == null ? void 0 : d.dpr) === 0) return !1;
          _ = g < 0 ? 0 : 1, f = 4;
          break;
        default:
          return !1;
      }
      return _ === void 0 || f === void 0 || f > 4 ? !1 : e.coreMouseService.triggerMouseEvent({ col: u.col, row: u.row, x: u.x, y: u.y, button: f, action: _, ctrl: o.ctrlKey, alt: o.altKey, shift: o.shiftKey });
    }
    let r = { mouseup: null, wheel: null, mousedrag: null, mousemove: null }, n = { mouseup: (o) => (s(o), o.buttons || (this._document.removeEventListener("mouseup", r.mouseup), r.mousedrag && this._document.removeEventListener("mousemove", r.mousedrag)), this.cancel(o)), wheel: (o) => (s(o), this.cancel(o, !0)), mousedrag: (o) => {
      o.buttons && s(o);
    }, mousemove: (o) => {
      o.buttons || s(o);
    } };
    this._register(this.coreMouseService.onProtocolChange((o) => {
      o ? (this.optionsService.rawOptions.logLevel === "debug" && this._logService.debug("Binding to mouse events:", this.coreMouseService.explainEvents(o)), this.element.classList.add("enable-mouse-events"), this._selectionService.disable()) : (this._logService.debug("Unbinding from mouse events."), this.element.classList.remove("enable-mouse-events"), this._selectionService.enable()), o & 8 ? r.mousemove || (t.addEventListener("mousemove", n.mousemove), r.mousemove = n.mousemove) : (t.removeEventListener("mousemove", r.mousemove), r.mousemove = null), o & 16 ? r.wheel || (t.addEventListener("wheel", n.wheel, { passive: !1 }), r.wheel = n.wheel) : (t.removeEventListener("wheel", r.wheel), r.wheel = null), o & 2 ? r.mouseup || (r.mouseup = n.mouseup) : (this._document.removeEventListener("mouseup", r.mouseup), r.mouseup = null), o & 4 ? r.mousedrag || (r.mousedrag = n.mousedrag) : (this._document.removeEventListener("mousemove", r.mousedrag), r.mousedrag = null);
    })), this.coreMouseService.activeProtocol = this.coreMouseService.activeProtocol, this._register(oe(t, "mousedown", (o) => {
      if (o.preventDefault(), this.focus(), !(!this.coreMouseService.areMouseEventsActive || this._selectionService.shouldForceSelection(o))) return s(o), r.mouseup && this._document.addEventListener("mouseup", r.mouseup), r.mousedrag && this._document.addEventListener("mousemove", r.mousedrag), this.cancel(o);
    })), this._register(oe(t, "wheel", (o) => {
      var a, l, c, h, d;
      if (!r.wheel) {
        if (this._customWheelEventHandler && this._customWheelEventHandler(o) === !1) return !1;
        if (!this.buffer.hasScrollback) {
          if (o.deltaY === 0) return !1;
          if (e.coreMouseService.consumeWheelEvent(o, (h = (c = (l = (a = e._renderService) == null ? void 0 : a.dimensions) == null ? void 0 : l.device) == null ? void 0 : c.cell) == null ? void 0 : h.height, (d = e._coreBrowserService) == null ? void 0 : d.dpr) === 0) return this.cancel(o, !0);
          let u = O.ESC + (this.coreService.decPrivateModes.applicationCursorKeys ? "O" : "[") + (o.deltaY < 0 ? "A" : "B");
          return this.coreService.triggerDataEvent(u, !0), this.cancel(o, !0);
        }
      }
    }, { passive: !1 }));
  }
  refresh(e, t) {
    var s;
    (s = this._renderService) == null || s.refreshRows(e, t);
  }
  updateCursorStyle(e) {
    var t;
    (t = this._selectionService) != null && t.shouldColumnSelect(e) ? this.element.classList.add("column-select") : this.element.classList.remove("column-select");
  }
  _showCursor() {
    this.coreService.isCursorInitialized || (this.coreService.isCursorInitialized = !0, this.refresh(this.buffer.y, this.buffer.y));
  }
  scrollLines(e, t) {
    this._viewport ? this._viewport.scrollLines(e) : super.scrollLines(e, t), this.refresh(0, this.rows - 1);
  }
  scrollPages(e) {
    this.scrollLines(e * (this.rows - 1));
  }
  scrollToTop() {
    this.scrollLines(-this._bufferService.buffer.ydisp);
  }
  scrollToBottom(e) {
    e && this._viewport ? this._viewport.scrollToLine(this.buffer.ybase, !0) : this.scrollLines(this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
  }
  scrollToLine(e) {
    let t = e - this._bufferService.buffer.ydisp;
    t !== 0 && this.scrollLines(t);
  }
  paste(e) {
    eh(e, this.textarea, this.coreService, this.optionsService);
  }
  attachCustomKeyEventHandler(e) {
    this._customKeyEventHandler = e;
  }
  attachCustomWheelEventHandler(e) {
    this._customWheelEventHandler = e;
  }
  registerLinkProvider(e) {
    return this._linkProviderService.registerLinkProvider(e);
  }
  registerCharacterJoiner(e) {
    if (!this._characterJoinerService) throw new Error("Terminal must be opened first");
    let t = this._characterJoinerService.register(e);
    return this.refresh(0, this.rows - 1), t;
  }
  deregisterCharacterJoiner(e) {
    if (!this._characterJoinerService) throw new Error("Terminal must be opened first");
    this._characterJoinerService.deregister(e) && this.refresh(0, this.rows - 1);
  }
  get markers() {
    return this.buffer.markers;
  }
  registerMarker(e) {
    return this.buffer.addMarker(this.buffer.ybase + this.buffer.y + e);
  }
  registerDecoration(e) {
    return this._decorationService.registerDecoration(e);
  }
  hasSelection() {
    return this._selectionService ? this._selectionService.hasSelection : !1;
  }
  select(e, t, s) {
    this._selectionService.setSelection(e, t, s);
  }
  getSelection() {
    return this._selectionService ? this._selectionService.selectionText : "";
  }
  getSelectionPosition() {
    if (!(!this._selectionService || !this._selectionService.hasSelection)) return { start: { x: this._selectionService.selectionStart[0], y: this._selectionService.selectionStart[1] }, end: { x: this._selectionService.selectionEnd[0], y: this._selectionService.selectionEnd[1] } };
  }
  clearSelection() {
    var e;
    (e = this._selectionService) == null || e.clearSelection();
  }
  selectAll() {
    var e;
    (e = this._selectionService) == null || e.selectAll();
  }
  selectLines(e, t) {
    var s;
    (s = this._selectionService) == null || s.selectLines(e, t);
  }
  _keyDown(e) {
    if (this._keyDownHandled = !1, this._keyDownSeen = !0, this._customKeyEventHandler && this._customKeyEventHandler(e) === !1) return !1;
    let t = this.browser.isMac && this.options.macOptionIsMeta && e.altKey;
    if (!t && !this._compositionHelper.keydown(e)) return this.options.scrollOnUserInput && this.buffer.ybase !== this.buffer.ydisp && this.scrollToBottom(!0), !1;
    !t && (e.key === "Dead" || e.key === "AltGraph") && (this._unprocessedDeadKey = !0);
    let s = rf(e, this.coreService.decPrivateModes.applicationCursorKeys, this.browser.isMac, this.options.macOptionIsMeta);
    if (this.updateCursorStyle(e), s.type === 3 || s.type === 2) {
      let r = this.rows - 1;
      return this.scrollLines(s.type === 2 ? -r : r), this.cancel(e, !0);
    }
    if (s.type === 1 && this.selectAll(), this._isThirdLevelShift(this.browser, e) || (s.cancel && this.cancel(e, !0), !s.key) || e.key && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && e.key.charCodeAt(0) >= 65 && e.key.charCodeAt(0) <= 90) return !0;
    if (this._unprocessedDeadKey) return this._unprocessedDeadKey = !1, !0;
    if ((s.key === O.ETX || s.key === O.CR) && (this.textarea.value = ""), this._onKey.fire({ key: s.key, domEvent: e }), this._showCursor(), this.coreService.triggerDataEvent(s.key, !0), !this.optionsService.rawOptions.screenReaderMode || e.altKey || e.ctrlKey) return this.cancel(e, !0);
    this._keyDownHandled = !0;
  }
  _isThirdLevelShift(e, t) {
    let s = e.isMac && !this.options.macOptionIsMeta && t.altKey && !t.ctrlKey && !t.metaKey || e.isWindows && t.altKey && t.ctrlKey && !t.metaKey || e.isWindows && t.getModifierState("AltGraph");
    return t.type === "keypress" ? s : s && (!t.keyCode || t.keyCode > 47);
  }
  _keyUp(e) {
    this._keyDownSeen = !1, !(this._customKeyEventHandler && this._customKeyEventHandler(e) === !1) && (uf(e) || this.focus(), this.updateCursorStyle(e), this._keyPressHandled = !1);
  }
  _keyPress(e) {
    let t;
    if (this._keyPressHandled = !1, this._keyDownHandled || this._customKeyEventHandler && this._customKeyEventHandler(e) === !1) return !1;
    if (this.cancel(e), e.charCode) t = e.charCode;
    else if (e.which === null || e.which === void 0) t = e.keyCode;
    else if (e.which !== 0 && e.charCode !== 0) t = e.which;
    else return !1;
    return !t || (e.altKey || e.ctrlKey || e.metaKey) && !this._isThirdLevelShift(this.browser, e) ? !1 : (t = String.fromCharCode(t), this._onKey.fire({ key: t, domEvent: e }), this._showCursor(), this.coreService.triggerDataEvent(t, !0), this._keyPressHandled = !0, this._unprocessedDeadKey = !1, !0);
  }
  _inputEvent(e) {
    if (e.data && e.inputType === "insertText" && (!e.composed || !this._keyDownSeen) && !this.optionsService.rawOptions.screenReaderMode) {
      if (this._keyPressHandled) return !1;
      this._unprocessedDeadKey = !1;
      let t = e.data;
      return this.coreService.triggerDataEvent(t, !0), this.cancel(e), !0;
    }
    return !1;
  }
  resize(e, t) {
    if (e === this.cols && t === this.rows) {
      this._charSizeService && !this._charSizeService.hasValidSize && this._charSizeService.measure();
      return;
    }
    super.resize(e, t);
  }
  _afterResize(e, t) {
    var s;
    (s = this._charSizeService) == null || s.measure();
  }
  clear() {
    if (!(this.buffer.ybase === 0 && this.buffer.y === 0)) {
      this.buffer.clearAllMarkers(), this.buffer.lines.set(0, this.buffer.lines.get(this.buffer.ybase + this.buffer.y)), this.buffer.lines.length = 1, this.buffer.ydisp = 0, this.buffer.ybase = 0, this.buffer.y = 0;
      for (let e = 1; e < this.rows; e++) this.buffer.lines.push(this.buffer.getBlankLine(Ke));
      this._onScroll.fire({ position: this.buffer.ydisp }), this.refresh(0, this.rows - 1);
    }
  }
  reset() {
    var e;
    this.options.rows = this.rows, this.options.cols = this.cols;
    let t = this._customKeyEventHandler;
    this._setup(), super.reset(), (e = this._selectionService) == null || e.reset(), this._decorationService.reset(), this._customKeyEventHandler = t, this.refresh(0, this.rows - 1);
  }
  clearTextureAtlas() {
    var e;
    (e = this._renderService) == null || e.clearTextureAtlas();
  }
  _reportFocus() {
    var e;
    (e = this.element) != null && e.classList.contains("focus") ? this.coreService.triggerDataEvent(O.ESC + "[I") : this.coreService.triggerDataEvent(O.ESC + "[O");
  }
  _reportWindowsOptions(e) {
    if (this._renderService) switch (e) {
      case 0:
        let t = this._renderService.dimensions.css.canvas.width.toFixed(0), s = this._renderService.dimensions.css.canvas.height.toFixed(0);
        this.coreService.triggerDataEvent(`${O.ESC}[4;${s};${t}t`);
        break;
      case 1:
        let r = this._renderService.dimensions.css.cell.width.toFixed(0), n = this._renderService.dimensions.css.cell.height.toFixed(0);
        this.coreService.triggerDataEvent(`${O.ESC}[6;${n};${r}t`);
        break;
    }
  }
  cancel(e, t) {
    if (!(!this.options.cancelEvents && !t)) return e.preventDefault(), e.stopPropagation(), !1;
  }
};
function uf(e) {
  return e.keyCode === 16 || e.keyCode === 17 || e.keyCode === 18;
}
var _f = class {
  constructor() {
    this._addons = [];
  }
  dispose() {
    for (let e = this._addons.length - 1; e >= 0; e--) this._addons[e].instance.dispose();
  }
  loadAddon(e, t) {
    let s = { instance: t, dispose: t.dispose, isDisposed: !1 };
    this._addons.push(s), t.dispose = () => this._wrappedAddonDispose(s), t.activate(e);
  }
  _wrappedAddonDispose(e) {
    if (e.isDisposed) return;
    let t = -1;
    for (let s = 0; s < this._addons.length; s++) if (this._addons[s] === e) {
      t = s;
      break;
    }
    if (t === -1) throw new Error("Could not dispose an addon that has not been loaded");
    e.isDisposed = !0, e.dispose.apply(e.instance), this._addons.splice(t, 1);
  }
}, ff = class {
  constructor(e) {
    this._line = e;
  }
  get isWrapped() {
    return this._line.isWrapped;
  }
  get length() {
    return this._line.length;
  }
  getCell(e, t) {
    if (!(e < 0 || e >= this._line.length)) return t ? (this._line.loadCell(e, t), t) : this._line.loadCell(e, new Nt());
  }
  translateToString(e, t, s) {
    return this._line.translateToString(e, t, s);
  }
}, el = class {
  constructor(e, t) {
    this._buffer = e, this.type = t;
  }
  init(e) {
    return this._buffer = e, this;
  }
  get cursorY() {
    return this._buffer.y;
  }
  get cursorX() {
    return this._buffer.x;
  }
  get viewportY() {
    return this._buffer.ydisp;
  }
  get baseY() {
    return this._buffer.ybase;
  }
  get length() {
    return this._buffer.lines.length;
  }
  getLine(e) {
    let t = this._buffer.lines.get(e);
    if (t) return new ff(t);
  }
  getNullCell() {
    return new Nt();
  }
}, pf = class extends ue {
  constructor(e) {
    super(), this._core = e, this._onBufferChange = this._register(new K()), this.onBufferChange = this._onBufferChange.event, this._normal = new el(this._core.buffers.normal, "normal"), this._alternate = new el(this._core.buffers.alt, "alternate"), this._core.buffers.onBufferActivate(() => this._onBufferChange.fire(this.active));
  }
  get active() {
    if (this._core.buffers.active === this._core.buffers.normal) return this.normal;
    if (this._core.buffers.active === this._core.buffers.alt) return this.alternate;
    throw new Error("Active buffer is neither normal nor alternate");
  }
  get normal() {
    return this._normal.init(this._core.buffers.normal);
  }
  get alternate() {
    return this._alternate.init(this._core.buffers.alt);
  }
}, gf = class {
  constructor(e) {
    this._core = e;
  }
  registerCsiHandler(e, t) {
    return this._core.registerCsiHandler(e, (s) => t(s.toArray()));
  }
  addCsiHandler(e, t) {
    return this.registerCsiHandler(e, t);
  }
  registerDcsHandler(e, t) {
    return this._core.registerDcsHandler(e, (s, r) => t(s, r.toArray()));
  }
  addDcsHandler(e, t) {
    return this.registerDcsHandler(e, t);
  }
  registerEscHandler(e, t) {
    return this._core.registerEscHandler(e, t);
  }
  addEscHandler(e, t) {
    return this.registerEscHandler(e, t);
  }
  registerOscHandler(e, t) {
    return this._core.registerOscHandler(e, t);
  }
  addOscHandler(e, t) {
    return this.registerOscHandler(e, t);
  }
}, vf = class {
  constructor(e) {
    this._core = e;
  }
  register(e) {
    this._core.unicodeService.register(e);
  }
  get versions() {
    return this._core.unicodeService.versions;
  }
  get activeVersion() {
    return this._core.unicodeService.activeVersion;
  }
  set activeVersion(e) {
    this._core.unicodeService.activeVersion = e;
  }
}, mf = ["cols", "rows"], $t = 0, wf = class extends ue {
  constructor(e) {
    super(), this._core = this._register(new df(e)), this._addonManager = this._register(new _f()), this._publicOptions = { ...this._core.options };
    let t = (r) => this._core.options[r], s = (r, n) => {
      this._checkReadonlyOptions(r), this._core.options[r] = n;
    };
    for (let r in this._core.options) {
      let n = { get: t.bind(this, r), set: s.bind(this, r) };
      Object.defineProperty(this._publicOptions, r, n);
    }
  }
  _checkReadonlyOptions(e) {
    if (mf.includes(e)) throw new Error(`Option "${e}" can only be set in the constructor`);
  }
  _checkProposedApi() {
    if (!this._core.optionsService.rawOptions.allowProposedApi) throw new Error("You must set the allowProposedApi option to true to use proposed API");
  }
  get onBell() {
    return this._core.onBell;
  }
  get onBinary() {
    return this._core.onBinary;
  }
  get onCursorMove() {
    return this._core.onCursorMove;
  }
  get onData() {
    return this._core.onData;
  }
  get onKey() {
    return this._core.onKey;
  }
  get onLineFeed() {
    return this._core.onLineFeed;
  }
  get onRender() {
    return this._core.onRender;
  }
  get onResize() {
    return this._core.onResize;
  }
  get onScroll() {
    return this._core.onScroll;
  }
  get onSelectionChange() {
    return this._core.onSelectionChange;
  }
  get onTitleChange() {
    return this._core.onTitleChange;
  }
  get onWriteParsed() {
    return this._core.onWriteParsed;
  }
  get element() {
    return this._core.element;
  }
  get parser() {
    return this._parser || (this._parser = new gf(this._core)), this._parser;
  }
  get unicode() {
    return this._checkProposedApi(), new vf(this._core);
  }
  get textarea() {
    return this._core.textarea;
  }
  get rows() {
    return this._core.rows;
  }
  get cols() {
    return this._core.cols;
  }
  get buffer() {
    return this._buffer || (this._buffer = this._register(new pf(this._core))), this._buffer;
  }
  get markers() {
    return this._checkProposedApi(), this._core.markers;
  }
  get modes() {
    let e = this._core.coreService.decPrivateModes, t = "none";
    switch (this._core.coreMouseService.activeProtocol) {
      case "X10":
        t = "x10";
        break;
      case "VT200":
        t = "vt200";
        break;
      case "DRAG":
        t = "drag";
        break;
      case "ANY":
        t = "any";
        break;
    }
    return { applicationCursorKeysMode: e.applicationCursorKeys, applicationKeypadMode: e.applicationKeypad, bracketedPasteMode: e.bracketedPasteMode, insertMode: this._core.coreService.modes.insertMode, mouseTrackingMode: t, originMode: e.origin, reverseWraparoundMode: e.reverseWraparound, sendFocusMode: e.sendFocus, synchronizedOutputMode: e.synchronizedOutput, wraparoundMode: e.wraparound };
  }
  get options() {
    return this._publicOptions;
  }
  set options(e) {
    for (let t in e) this._publicOptions[t] = e[t];
  }
  blur() {
    this._core.blur();
  }
  focus() {
    this._core.focus();
  }
  input(e, t = !0) {
    this._core.input(e, t);
  }
  resize(e, t) {
    this._verifyIntegers(e, t), this._core.resize(e, t);
  }
  open(e) {
    this._core.open(e);
  }
  attachCustomKeyEventHandler(e) {
    this._core.attachCustomKeyEventHandler(e);
  }
  attachCustomWheelEventHandler(e) {
    this._core.attachCustomWheelEventHandler(e);
  }
  registerLinkProvider(e) {
    return this._core.registerLinkProvider(e);
  }
  registerCharacterJoiner(e) {
    return this._checkProposedApi(), this._core.registerCharacterJoiner(e);
  }
  deregisterCharacterJoiner(e) {
    this._checkProposedApi(), this._core.deregisterCharacterJoiner(e);
  }
  registerMarker(e = 0) {
    return this._verifyIntegers(e), this._core.registerMarker(e);
  }
  registerDecoration(e) {
    return this._checkProposedApi(), this._verifyPositiveIntegers(e.x ?? 0, e.width ?? 0, e.height ?? 0), this._core.registerDecoration(e);
  }
  hasSelection() {
    return this._core.hasSelection();
  }
  select(e, t, s) {
    this._verifyIntegers(e, t, s), this._core.select(e, t, s);
  }
  getSelection() {
    return this._core.getSelection();
  }
  getSelectionPosition() {
    return this._core.getSelectionPosition();
  }
  clearSelection() {
    this._core.clearSelection();
  }
  selectAll() {
    this._core.selectAll();
  }
  selectLines(e, t) {
    this._verifyIntegers(e, t), this._core.selectLines(e, t);
  }
  dispose() {
    super.dispose();
  }
  scrollLines(e) {
    this._verifyIntegers(e), this._core.scrollLines(e);
  }
  scrollPages(e) {
    this._verifyIntegers(e), this._core.scrollPages(e);
  }
  scrollToTop() {
    this._core.scrollToTop();
  }
  scrollToBottom() {
    this._core.scrollToBottom();
  }
  scrollToLine(e) {
    this._verifyIntegers(e), this._core.scrollToLine(e);
  }
  clear() {
    this._core.clear();
  }
  write(e, t) {
    this._core.write(e, t);
  }
  writeln(e, t) {
    this._core.write(e), this._core.write(`\r
`, t);
  }
  paste(e) {
    this._core.paste(e);
  }
  refresh(e, t) {
    this._verifyIntegers(e, t), this._core.refresh(e, t);
  }
  reset() {
    this._core.reset();
  }
  clearTextureAtlas() {
    this._core.clearTextureAtlas();
  }
  loadAddon(e) {
    this._addonManager.loadAddon(this, e);
  }
  static get strings() {
    return { get promptLabel() {
      return kn.get();
    }, set promptLabel(e) {
      kn.set(e);
    }, get tooMuchOutput() {
      return Ln.get();
    }, set tooMuchOutput(e) {
      Ln.set(e);
    } };
  }
  _verifyIntegers(...e) {
    for ($t of e) if ($t === 1 / 0 || isNaN($t) || $t % 1 !== 0) throw new Error("This API only accepts integers");
  }
  _verifyPositiveIntegers(...e) {
    for ($t of e) if ($t && ($t === 1 / 0 || isNaN($t) || $t % 1 !== 0 || $t < 0)) throw new Error("This API only accepts positive integers");
  }
};
/**
 * Copyright (c) 2014-2024 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 * @license MIT
 *
 * Originally forked from (with the author's permission):
 *   Fabrice Bellard's javascript vt100 for jslinux:
 *   http://bellard.org/jslinux/
 *   Copyright (c) 2011 Fabrice Bellard
 */
var Sf = 2, bf = 1, yf = class {
  activate(e) {
    this._terminal = e;
  }
  dispose() {
  }
  fit() {
    let e = this.proposeDimensions();
    if (!e || !this._terminal || isNaN(e.cols) || isNaN(e.rows)) return;
    let t = this._terminal._core;
    (this._terminal.rows !== e.rows || this._terminal.cols !== e.cols) && (t._renderService.clear(), this._terminal.resize(e.cols, e.rows));
  }
  proposeDimensions() {
    var e;
    if (!this._terminal || !this._terminal.element || !this._terminal.element.parentElement) return;
    let t = this._terminal._core._renderService.dimensions;
    if (t.css.cell.width === 0 || t.css.cell.height === 0) return;
    let s = this._terminal.options.scrollback === 0 ? 0 : ((e = this._terminal.options.overviewRuler) == null ? void 0 : e.width) || 14, r = window.getComputedStyle(this._terminal.element.parentElement), n = parseInt(r.getPropertyValue("height")), o = Math.max(0, parseInt(r.getPropertyValue("width"))), a = window.getComputedStyle(this._terminal.element), l = { top: parseInt(a.getPropertyValue("padding-top")), bottom: parseInt(a.getPropertyValue("padding-bottom")), right: parseInt(a.getPropertyValue("padding-right")), left: parseInt(a.getPropertyValue("padding-left")) }, c = l.top + l.bottom, h = l.right + l.left, d = n - c, u = o - h - s;
    return { cols: Math.max(Sf, Math.floor(u / t.css.cell.width)), rows: Math.max(bf, Math.floor(d / t.css.cell.height)) };
  }
};
/**
 * Copyright (c) 2014-2024 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 * @license MIT
 *
 * Originally forked from (with the author's permission):
 *   Fabrice Bellard's javascript vt100 for jslinux:
 *   http://bellard.org/jslinux/
 *   Copyright (c) 2011 Fabrice Bellard
 */
var Cf = (e, t, s, r) => {
  for (var n = t, o = e.length - 1, a; o >= 0; o--) (a = e[o]) && (n = a(n) || n);
  return n;
}, xf = (e, t) => (s, r) => t(s, r, e), kf = class {
  constructor() {
    this.listeners = [], this.unexpectedErrorHandler = function(e) {
      setTimeout(() => {
        throw e.stack ? tl.isErrorNoTelemetry(e) ? new tl(e.message + `

` + e.stack) : new Error(e.message + `

` + e.stack) : e;
      }, 0);
    };
  }
  addListener(e) {
    return this.listeners.push(e), () => {
      this._removeListener(e);
    };
  }
  emit(e) {
    this.listeners.forEach((t) => {
      t(e);
    });
  }
  _removeListener(e) {
    this.listeners.splice(this.listeners.indexOf(e), 1);
  }
  setUnexpectedErrorHandler(e) {
    this.unexpectedErrorHandler = e;
  }
  getUnexpectedErrorHandler() {
    return this.unexpectedErrorHandler;
  }
  onUnexpectedError(e) {
    this.unexpectedErrorHandler(e), this.emit(e);
  }
  onUnexpectedExternalError(e) {
    this.unexpectedErrorHandler(e);
  }
}, Lf = new kf();
function rn(e) {
  Mf(e) || Lf.onUnexpectedError(e);
}
var uo = "Canceled";
function Mf(e) {
  return e instanceof Ef ? !0 : e instanceof Error && e.name === uo && e.message === uo;
}
var Ef = class extends Error {
  constructor() {
    super(uo), this.name = this.message;
  }
}, tl = class _o extends Error {
  constructor(t) {
    super(t), this.name = "CodeExpectedError";
  }
  static fromError(t) {
    if (t instanceof _o) return t;
    let s = new _o();
    return s.message = t.message, s.stack = t.stack, s;
  }
  static isErrorNoTelemetry(t) {
    return t.name === "CodeExpectedError";
  }
}, il;
((e) => {
  function t(o) {
    return o < 0;
  }
  e.isLessThan = t;
  function s(o) {
    return o <= 0;
  }
  e.isLessThanOrEqual = s;
  function r(o) {
    return o > 0;
  }
  e.isGreaterThan = r;
  function n(o) {
    return o === 0;
  }
  e.isNeitherLessOrGreaterThan = n, e.greaterThan = 1, e.lessThan = -1, e.neitherLessOrGreaterThan = 0;
})(il || (il = {}));
function Df(e, t) {
  let s = this, r = !1, n;
  return function() {
    return r || (r = !0, n = e.apply(s, arguments)), n;
  };
}
var fo;
((e) => {
  function t(k) {
    return k && typeof k == "object" && typeof k[Symbol.iterator] == "function";
  }
  e.is = t;
  let s = Object.freeze([]);
  function r() {
    return s;
  }
  e.empty = r;
  function* n(k) {
    yield k;
  }
  e.single = n;
  function o(k) {
    return t(k) ? k : n(k);
  }
  e.wrap = o;
  function a(k) {
    return k || s;
  }
  e.from = a;
  function* l(k) {
    for (let B = k.length - 1; B >= 0; B--) yield k[B];
  }
  e.reverse = l;
  function c(k) {
    return !k || k[Symbol.iterator]().next().done === !0;
  }
  e.isEmpty = c;
  function h(k) {
    return k[Symbol.iterator]().next().value;
  }
  e.first = h;
  function d(k, B) {
    let N = 0;
    for (let U of k) if (B(U, N++)) return !0;
    return !1;
  }
  e.some = d;
  function u(k, B) {
    for (let N of k) if (B(N)) return N;
  }
  e.find = u;
  function* f(k, B) {
    for (let N of k) B(N) && (yield N);
  }
  e.filter = f;
  function* _(k, B) {
    let N = 0;
    for (let U of k) yield B(U, N++);
  }
  e.map = _;
  function* g(k, B) {
    let N = 0;
    for (let U of k) yield* B(U, N++);
  }
  e.flatMap = g;
  function* y(...k) {
    for (let B of k) yield* B;
  }
  e.concat = y;
  function D(k, B, N) {
    let U = N;
    for (let ie of k) U = B(U, ie);
    return U;
  }
  e.reduce = D;
  function* R(k, B, N = k.length) {
    for (B < 0 && (B += k.length), N < 0 ? N += k.length : N > k.length && (N = k.length); B < N; B++) yield k[B];
  }
  e.slice = R;
  function H(k, B = Number.POSITIVE_INFINITY) {
    let N = [];
    if (B === 0) return [N, k];
    let U = k[Symbol.iterator]();
    for (let ie = 0; ie < B; ie++) {
      let Z = U.next();
      if (Z.done) return [N, e.empty()];
      N.push(Z.value);
    }
    return [N, { [Symbol.iterator]() {
      return U;
    } }];
  }
  e.consume = H;
  async function M(k) {
    let B = [];
    for await (let N of k) B.push(N);
    return Promise.resolve(B);
  }
  e.asyncToArray = M;
})(fo || (fo = {}));
function Wh(e) {
  if (fo.is(e)) {
    let t = [];
    for (let s of e) if (s) try {
      s.dispose();
    } catch (r) {
      t.push(r);
    }
    if (t.length === 1) throw t[0];
    if (t.length > 1) throw new AggregateError(t, "Encountered errors while disposing of store");
    return Array.isArray(e) ? [] : e;
  } else if (e) return e.dispose(), e;
}
function $h(...e) {
  return _t(() => Wh(e));
}
function _t(e) {
  return { dispose: Df(() => {
    e();
  }) };
}
var Hh = class Uh {
  constructor() {
    this._toDispose = /* @__PURE__ */ new Set(), this._isDisposed = !1;
  }
  dispose() {
    this._isDisposed || (this._isDisposed = !0, this.clear());
  }
  get isDisposed() {
    return this._isDisposed;
  }
  clear() {
    if (this._toDispose.size !== 0) try {
      Wh(this._toDispose);
    } finally {
      this._toDispose.clear();
    }
  }
  add(t) {
    if (!t) return t;
    if (t === this) throw new Error("Cannot register a disposable on itself!");
    return this._isDisposed ? Uh.DISABLE_DISPOSED_WARNING || console.warn(new Error("Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!").stack) : this._toDispose.add(t), t;
  }
  delete(t) {
    if (t) {
      if (t === this) throw new Error("Cannot dispose a disposable on itself!");
      this._toDispose.delete(t), t.dispose();
    }
  }
  deleteAndLeak(t) {
    t && this._toDispose.has(t) && this._toDispose.delete(t);
  }
};
Hh.DISABLE_DISPOSED_WARNING = !1;
var ps = Hh, zt = class {
  constructor() {
    this._store = new ps(), this._store;
  }
  dispose() {
    this._store.dispose();
  }
  _register(e) {
    if (e === this) throw new Error("Cannot register a disposable on itself!");
    return this._store.add(e);
  }
};
zt.None = Object.freeze({ dispose() {
} });
var Ds = class {
  constructor() {
    this._isDisposed = !1;
  }
  get value() {
    return this._isDisposed ? void 0 : this._value;
  }
  set value(e) {
    var t;
    this._isDisposed || e === this._value || ((t = this._value) == null || t.dispose(), this._value = e);
  }
  clear() {
    this.value = void 0;
  }
  dispose() {
    var e;
    this._isDisposed = !0, (e = this._value) == null || e.dispose(), this._value = void 0;
  }
  clearAndLeak() {
    let e = this._value;
    return this._value = void 0, e;
  }
}, Oo = typeof process < "u" && "title" in process, Or = Oo ? "node" : navigator.userAgent, Rf = Oo ? "node" : navigator.platform, Tf = Or.includes("Firefox"), Bf = Or.includes("Edge"), Kh = /^((?!chrome|android).)*safari/i.test(Or);
function Pf() {
  if (!Kh) return 0;
  let e = Or.match(/Version\/(\d+)/);
  return e === null || e.length < 2 ? 0 : parseInt(e[1]);
}
Rf.indexOf("Linux") >= 0;
var Af = "", st = 0, rt = 0, nt = 0, We = 0, Dt = { css: "#00000000", rgba: 0 }, ut;
((e) => {
  function t(n, o, a, l) {
    return l !== void 0 ? `#${Fi(n)}${Fi(o)}${Fi(a)}${Fi(l)}` : `#${Fi(n)}${Fi(o)}${Fi(a)}`;
  }
  e.toCss = t;
  function s(n, o, a, l = 255) {
    return (n << 24 | o << 16 | a << 8 | l) >>> 0;
  }
  e.toRgba = s;
  function r(n, o, a, l) {
    return { css: e.toCss(n, o, a, l), rgba: e.toRgba(n, o, a, l) };
  }
  e.toColor = r;
})(ut || (ut = {}));
var ds;
((e) => {
  function t(c, h) {
    if (We = (h.rgba & 255) / 255, We === 1) return { css: h.css, rgba: h.rgba };
    let d = h.rgba >> 24 & 255, u = h.rgba >> 16 & 255, f = h.rgba >> 8 & 255, _ = c.rgba >> 24 & 255, g = c.rgba >> 16 & 255, y = c.rgba >> 8 & 255;
    st = _ + Math.round((d - _) * We), rt = g + Math.round((u - g) * We), nt = y + Math.round((f - y) * We);
    let D = ut.toCss(st, rt, nt), R = ut.toRgba(st, rt, nt);
    return { css: D, rgba: R };
  }
  e.blend = t;
  function s(c) {
    return (c.rgba & 255) === 255;
  }
  e.isOpaque = s;
  function r(c, h, d) {
    let u = Pi.ensureContrastRatio(c.rgba, h.rgba, d);
    if (u) return ut.toColor(u >> 24 & 255, u >> 16 & 255, u >> 8 & 255);
  }
  e.ensureContrastRatio = r;
  function n(c) {
    let h = (c.rgba | 255) >>> 0;
    return [st, rt, nt] = Pi.toChannels(h), { css: ut.toCss(st, rt, nt), rgba: h };
  }
  e.opaque = n;
  function o(c, h) {
    return We = Math.round(h * 255), [st, rt, nt] = Pi.toChannels(c.rgba), { css: ut.toCss(st, rt, nt, We), rgba: ut.toRgba(st, rt, nt, We) };
  }
  e.opacity = o;
  function a(c, h) {
    return We = c.rgba & 255, o(c, We * h / 255);
  }
  e.multiplyOpacity = a;
  function l(c) {
    return [c.rgba >> 24 & 255, c.rgba >> 16 & 255, c.rgba >> 8 & 255];
  }
  e.toColorRGB = l;
})(ds || (ds = {}));
var sl;
((e) => {
  let t, s;
  try {
    let n = document.createElement("canvas");
    n.width = 1, n.height = 1;
    let o = n.getContext("2d", { willReadFrequently: !0 });
    o && (t = o, t.globalCompositeOperation = "copy", s = t.createLinearGradient(0, 0, 1, 1));
  } catch {
  }
  function r(n) {
    if (n.match(/#[\da-f]{3,8}/i)) switch (n.length) {
      case 4:
        return st = parseInt(n.slice(1, 2).repeat(2), 16), rt = parseInt(n.slice(2, 3).repeat(2), 16), nt = parseInt(n.slice(3, 4).repeat(2), 16), ut.toColor(st, rt, nt);
      case 5:
        return st = parseInt(n.slice(1, 2).repeat(2), 16), rt = parseInt(n.slice(2, 3).repeat(2), 16), nt = parseInt(n.slice(3, 4).repeat(2), 16), We = parseInt(n.slice(4, 5).repeat(2), 16), ut.toColor(st, rt, nt, We);
      case 7:
        return { css: n, rgba: (parseInt(n.slice(1), 16) << 8 | 255) >>> 0 };
      case 9:
        return { css: n, rgba: parseInt(n.slice(1), 16) >>> 0 };
    }
    let o = n.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|\d?\.(\d+))\s*)?\)/);
    if (o) return st = parseInt(o[1]), rt = parseInt(o[2]), nt = parseInt(o[3]), We = Math.round((o[5] === void 0 ? 1 : parseFloat(o[5])) * 255), ut.toColor(st, rt, nt, We);
    if (!t || !s) throw new Error("css.toColor: Unsupported css format");
    if (t.fillStyle = s, t.fillStyle = n, typeof t.fillStyle != "string") throw new Error("css.toColor: Unsupported css format");
    if (t.fillRect(0, 0, 1, 1), [st, rt, nt, We] = t.getImageData(0, 0, 1, 1).data, We !== 255) throw new Error("css.toColor: Unsupported css format");
    return { rgba: ut.toRgba(st, rt, nt, We), css: n };
  }
  e.toColor = r;
})(sl || (sl = {}));
var dt;
((e) => {
  function t(r) {
    return s(r >> 16 & 255, r >> 8 & 255, r & 255);
  }
  e.relativeLuminance = t;
  function s(r, n, o) {
    let a = r / 255, l = n / 255, c = o / 255, h = a <= 0.03928 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4), d = l <= 0.03928 ? l / 12.92 : Math.pow((l + 0.055) / 1.055, 2.4), u = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return h * 0.2126 + d * 0.7152 + u * 0.0722;
  }
  e.relativeLuminance2 = s;
})(dt || (dt = {}));
var Pi;
((e) => {
  function t(a, l) {
    if (We = (l & 255) / 255, We === 1) return l;
    let c = l >> 24 & 255, h = l >> 16 & 255, d = l >> 8 & 255, u = a >> 24 & 255, f = a >> 16 & 255, _ = a >> 8 & 255;
    return st = u + Math.round((c - u) * We), rt = f + Math.round((h - f) * We), nt = _ + Math.round((d - _) * We), ut.toRgba(st, rt, nt);
  }
  e.blend = t;
  function s(a, l, c) {
    let h = dt.relativeLuminance(a >> 8), d = dt.relativeLuminance(l >> 8);
    if (oi(h, d) < c) {
      if (d < h) {
        let _ = r(a, l, c), g = oi(h, dt.relativeLuminance(_ >> 8));
        if (g < c) {
          let y = n(a, l, c), D = oi(h, dt.relativeLuminance(y >> 8));
          return g > D ? _ : y;
        }
        return _;
      }
      let u = n(a, l, c), f = oi(h, dt.relativeLuminance(u >> 8));
      if (f < c) {
        let _ = r(a, l, c), g = oi(h, dt.relativeLuminance(_ >> 8));
        return f > g ? u : _;
      }
      return u;
    }
  }
  e.ensureContrastRatio = s;
  function r(a, l, c) {
    let h = a >> 24 & 255, d = a >> 16 & 255, u = a >> 8 & 255, f = l >> 24 & 255, _ = l >> 16 & 255, g = l >> 8 & 255, y = oi(dt.relativeLuminance2(f, _, g), dt.relativeLuminance2(h, d, u));
    for (; y < c && (f > 0 || _ > 0 || g > 0); ) f -= Math.max(0, Math.ceil(f * 0.1)), _ -= Math.max(0, Math.ceil(_ * 0.1)), g -= Math.max(0, Math.ceil(g * 0.1)), y = oi(dt.relativeLuminance2(f, _, g), dt.relativeLuminance2(h, d, u));
    return (f << 24 | _ << 16 | g << 8 | 255) >>> 0;
  }
  e.reduceLuminance = r;
  function n(a, l, c) {
    let h = a >> 24 & 255, d = a >> 16 & 255, u = a >> 8 & 255, f = l >> 24 & 255, _ = l >> 16 & 255, g = l >> 8 & 255, y = oi(dt.relativeLuminance2(f, _, g), dt.relativeLuminance2(h, d, u));
    for (; y < c && (f < 255 || _ < 255 || g < 255); ) f = Math.min(255, f + Math.ceil((255 - f) * 0.1)), _ = Math.min(255, _ + Math.ceil((255 - _) * 0.1)), g = Math.min(255, g + Math.ceil((255 - g) * 0.1)), y = oi(dt.relativeLuminance2(f, _, g), dt.relativeLuminance2(h, d, u));
    return (f << 24 | _ << 16 | g << 8 | 255) >>> 0;
  }
  e.increaseLuminance = n;
  function o(a) {
    return [a >> 24 & 255, a >> 16 & 255, a >> 8 & 255, a & 255];
  }
  e.toChannels = o;
})(Pi || (Pi = {}));
function Fi(e) {
  let t = e.toString(16);
  return t.length < 2 ? "0" + t : t;
}
function oi(e, t) {
  return e < t ? (t + 0.05) / (e + 0.05) : (e + 0.05) / (t + 0.05);
}
function Ve(e) {
  if (!e) throw new Error("value must not be falsy");
  return e;
}
function Io(e) {
  return 57508 <= e && e <= 57558;
}
function Nf(e) {
  return 57520 <= e && e <= 57527;
}
function Of(e) {
  return 57344 <= e && e <= 63743;
}
function If(e) {
  return 9472 <= e && e <= 9631;
}
function Ff(e) {
  return e >= 128512 && e <= 128591 || e >= 127744 && e <= 128511 || e >= 128640 && e <= 128767 || e >= 9728 && e <= 9983 || e >= 9984 && e <= 10175 || e >= 65024 && e <= 65039 || e >= 129280 && e <= 129535 || e >= 127462 && e <= 127487;
}
function zf(e, t, s, r) {
  return t === 1 && s > Math.ceil(r * 1.5) && e !== void 0 && e > 255 && !Ff(e) && !Io(e) && !Of(e);
}
function Vh(e) {
  return Io(e) || If(e);
}
function Wf() {
  return { css: { canvas: lr(), cell: lr() }, device: { canvas: lr(), cell: lr(), char: { width: 0, height: 0, left: 0, top: 0 } } };
}
function lr() {
  return { width: 0, height: 0 };
}
function $f(e, t, s = 0) {
  return (e - (Math.round(t) * 2 - s)) % (Math.round(t) * 2);
}
var lt = 0, Je = 0, Ht = !1, ai = !1, hr = !1, yt, nn = 0, Hf = class {
  constructor(e, t, s, r, n, o) {
    this._terminal = e, this._optionService = t, this._selectionRenderModel = s, this._decorationService = r, this._coreBrowserService = n, this._themeService = o, this.result = { fg: 0, bg: 0, ext: 0 };
  }
  resolve(e, t, s, r) {
    if (this.result.bg = e.bg, this.result.fg = e.fg, this.result.ext = e.bg & 268435456 ? e.extended.ext : 0, Je = 0, lt = 0, ai = !1, Ht = !1, hr = !1, yt = this._themeService.colors, nn = 0, e.getCode() !== 0 && e.extended.underlineStyle === 4) {
      let n = Math.max(1, Math.floor(this._optionService.rawOptions.fontSize * this._coreBrowserService.dpr / 15));
      nn = t * r % (Math.round(n) * 2);
    }
    if (this._decorationService.forEachDecorationAtCell(t, s, "bottom", (n) => {
      n.backgroundColorRGB && (Je = n.backgroundColorRGB.rgba >> 8 & 16777215, ai = !0), n.foregroundColorRGB && (lt = n.foregroundColorRGB.rgba >> 8 & 16777215, Ht = !0);
    }), hr = this._selectionRenderModel.isCellSelected(this._terminal, t, s), hr) {
      if (this.result.fg & 67108864 || this.result.bg & 50331648) {
        if (this.result.fg & 67108864) switch (this.result.fg & 50331648) {
          case 16777216:
          case 33554432:
            Je = this._themeService.colors.ansi[this.result.fg & 255].rgba;
            break;
          case 50331648:
            Je = (this.result.fg & 16777215) << 8 | 255;
            break;
          case 0:
          default:
            Je = this._themeService.colors.foreground.rgba;
        }
        else switch (this.result.bg & 50331648) {
          case 16777216:
          case 33554432:
            Je = this._themeService.colors.ansi[this.result.bg & 255].rgba;
            break;
          case 50331648:
            Je = (this.result.bg & 16777215) << 8 | 255;
            break;
        }
        Je = Pi.blend(Je, (this._coreBrowserService.isFocused ? yt.selectionBackgroundOpaque : yt.selectionInactiveBackgroundOpaque).rgba & 4294967040 | 128) >> 8 & 16777215;
      } else Je = (this._coreBrowserService.isFocused ? yt.selectionBackgroundOpaque : yt.selectionInactiveBackgroundOpaque).rgba >> 8 & 16777215;
      if (ai = !0, yt.selectionForeground && (lt = yt.selectionForeground.rgba >> 8 & 16777215, Ht = !0), Vh(e.getCode())) {
        if (this.result.fg & 67108864 && !(this.result.bg & 50331648)) lt = (this._coreBrowserService.isFocused ? yt.selectionBackgroundOpaque : yt.selectionInactiveBackgroundOpaque).rgba >> 8 & 16777215;
        else {
          if (this.result.fg & 67108864) switch (this.result.bg & 50331648) {
            case 16777216:
            case 33554432:
              lt = this._themeService.colors.ansi[this.result.bg & 255].rgba;
              break;
            case 50331648:
              lt = (this.result.bg & 16777215) << 8 | 255;
              break;
          }
          else switch (this.result.fg & 50331648) {
            case 16777216:
            case 33554432:
              lt = this._themeService.colors.ansi[this.result.fg & 255].rgba;
              break;
            case 50331648:
              lt = (this.result.fg & 16777215) << 8 | 255;
              break;
            case 0:
            default:
              lt = this._themeService.colors.foreground.rgba;
          }
          lt = Pi.blend(lt, (this._coreBrowserService.isFocused ? yt.selectionBackgroundOpaque : yt.selectionInactiveBackgroundOpaque).rgba & 4294967040 | 128) >> 8 & 16777215;
        }
        Ht = !0;
      }
    }
    this._decorationService.forEachDecorationAtCell(t, s, "top", (n) => {
      n.backgroundColorRGB && (Je = n.backgroundColorRGB.rgba >> 8 & 16777215, ai = !0), n.foregroundColorRGB && (lt = n.foregroundColorRGB.rgba >> 8 & 16777215, Ht = !0);
    }), ai && (hr ? Je = e.bg & -16777216 & -134217729 | Je | 50331648 : Je = e.bg & -16777216 | Je | 50331648), Ht && (lt = e.fg & -16777216 & -67108865 | lt | 50331648), this.result.fg & 67108864 && (ai && !Ht && (this.result.bg & 50331648 ? lt = this.result.fg & -134217728 | this.result.bg & 67108863 : lt = this.result.fg & -134217728 | yt.background.rgba >> 8 & 16777215 & 16777215 | 50331648, Ht = !0), !ai && Ht && (this.result.fg & 50331648 ? Je = this.result.bg & -67108864 | this.result.fg & 67108863 : Je = this.result.bg & -67108864 | yt.foreground.rgba >> 8 & 16777215 & 16777215 | 50331648, ai = !0)), yt = void 0, this.result.bg = ai ? Je : this.result.bg, this.result.fg = Ht ? lt : this.result.fg, this.result.ext &= 536870911, this.result.ext |= nn << 29 & 3758096384;
  }
}, Uf = 0.5, qh = Tf || Bf ? "bottom" : "ideographic", Kf = { "▀": [{ x: 0, y: 0, w: 8, h: 4 }], "▁": [{ x: 0, y: 7, w: 8, h: 1 }], "▂": [{ x: 0, y: 6, w: 8, h: 2 }], "▃": [{ x: 0, y: 5, w: 8, h: 3 }], "▄": [{ x: 0, y: 4, w: 8, h: 4 }], "▅": [{ x: 0, y: 3, w: 8, h: 5 }], "▆": [{ x: 0, y: 2, w: 8, h: 6 }], "▇": [{ x: 0, y: 1, w: 8, h: 7 }], "█": [{ x: 0, y: 0, w: 8, h: 8 }], "▉": [{ x: 0, y: 0, w: 7, h: 8 }], "▊": [{ x: 0, y: 0, w: 6, h: 8 }], "▋": [{ x: 0, y: 0, w: 5, h: 8 }], "▌": [{ x: 0, y: 0, w: 4, h: 8 }], "▍": [{ x: 0, y: 0, w: 3, h: 8 }], "▎": [{ x: 0, y: 0, w: 2, h: 8 }], "▏": [{ x: 0, y: 0, w: 1, h: 8 }], "▐": [{ x: 4, y: 0, w: 4, h: 8 }], "▔": [{ x: 0, y: 0, w: 8, h: 1 }], "▕": [{ x: 7, y: 0, w: 1, h: 8 }], "▖": [{ x: 0, y: 4, w: 4, h: 4 }], "▗": [{ x: 4, y: 4, w: 4, h: 4 }], "▘": [{ x: 0, y: 0, w: 4, h: 4 }], "▙": [{ x: 0, y: 0, w: 4, h: 8 }, { x: 0, y: 4, w: 8, h: 4 }], "▚": [{ x: 0, y: 0, w: 4, h: 4 }, { x: 4, y: 4, w: 4, h: 4 }], "▛": [{ x: 0, y: 0, w: 4, h: 8 }, { x: 4, y: 0, w: 4, h: 4 }], "▜": [{ x: 0, y: 0, w: 8, h: 4 }, { x: 4, y: 0, w: 4, h: 8 }], "▝": [{ x: 4, y: 0, w: 4, h: 4 }], "▞": [{ x: 4, y: 0, w: 4, h: 4 }, { x: 0, y: 4, w: 4, h: 4 }], "▟": [{ x: 4, y: 0, w: 4, h: 8 }, { x: 0, y: 4, w: 8, h: 4 }], "🭰": [{ x: 1, y: 0, w: 1, h: 8 }], "🭱": [{ x: 2, y: 0, w: 1, h: 8 }], "🭲": [{ x: 3, y: 0, w: 1, h: 8 }], "🭳": [{ x: 4, y: 0, w: 1, h: 8 }], "🭴": [{ x: 5, y: 0, w: 1, h: 8 }], "🭵": [{ x: 6, y: 0, w: 1, h: 8 }], "🭶": [{ x: 0, y: 1, w: 8, h: 1 }], "🭷": [{ x: 0, y: 2, w: 8, h: 1 }], "🭸": [{ x: 0, y: 3, w: 8, h: 1 }], "🭹": [{ x: 0, y: 4, w: 8, h: 1 }], "🭺": [{ x: 0, y: 5, w: 8, h: 1 }], "🭻": [{ x: 0, y: 6, w: 8, h: 1 }], "🭼": [{ x: 0, y: 0, w: 1, h: 8 }, { x: 0, y: 7, w: 8, h: 1 }], "🭽": [{ x: 0, y: 0, w: 1, h: 8 }, { x: 0, y: 0, w: 8, h: 1 }], "🭾": [{ x: 7, y: 0, w: 1, h: 8 }, { x: 0, y: 0, w: 8, h: 1 }], "🭿": [{ x: 7, y: 0, w: 1, h: 8 }, { x: 0, y: 7, w: 8, h: 1 }], "🮀": [{ x: 0, y: 0, w: 8, h: 1 }, { x: 0, y: 7, w: 8, h: 1 }], "🮁": [{ x: 0, y: 0, w: 8, h: 1 }, { x: 0, y: 2, w: 8, h: 1 }, { x: 0, y: 4, w: 8, h: 1 }, { x: 0, y: 7, w: 8, h: 1 }], "🮂": [{ x: 0, y: 0, w: 8, h: 2 }], "🮃": [{ x: 0, y: 0, w: 8, h: 3 }], "🮄": [{ x: 0, y: 0, w: 8, h: 5 }], "🮅": [{ x: 0, y: 0, w: 8, h: 6 }], "🮆": [{ x: 0, y: 0, w: 8, h: 7 }], "🮇": [{ x: 6, y: 0, w: 2, h: 8 }], "🮈": [{ x: 5, y: 0, w: 3, h: 8 }], "🮉": [{ x: 3, y: 0, w: 5, h: 8 }], "🮊": [{ x: 2, y: 0, w: 6, h: 8 }], "🮋": [{ x: 1, y: 0, w: 7, h: 8 }], "🮕": [{ x: 0, y: 0, w: 2, h: 2 }, { x: 4, y: 0, w: 2, h: 2 }, { x: 2, y: 2, w: 2, h: 2 }, { x: 6, y: 2, w: 2, h: 2 }, { x: 0, y: 4, w: 2, h: 2 }, { x: 4, y: 4, w: 2, h: 2 }, { x: 2, y: 6, w: 2, h: 2 }, { x: 6, y: 6, w: 2, h: 2 }], "🮖": [{ x: 2, y: 0, w: 2, h: 2 }, { x: 6, y: 0, w: 2, h: 2 }, { x: 0, y: 2, w: 2, h: 2 }, { x: 4, y: 2, w: 2, h: 2 }, { x: 2, y: 4, w: 2, h: 2 }, { x: 6, y: 4, w: 2, h: 2 }, { x: 0, y: 6, w: 2, h: 2 }, { x: 4, y: 6, w: 2, h: 2 }], "🮗": [{ x: 0, y: 2, w: 8, h: 2 }, { x: 0, y: 6, w: 8, h: 2 }] }, Vf = { "░": [[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0]], "▒": [[1, 0], [0, 0], [0, 1], [0, 0]], "▓": [[0, 1], [1, 1], [1, 0], [1, 1]] }, qf = { "─": { 1: "M0,.5 L1,.5" }, "━": { 3: "M0,.5 L1,.5" }, "│": { 1: "M.5,0 L.5,1" }, "┃": { 3: "M.5,0 L.5,1" }, "┌": { 1: "M0.5,1 L.5,.5 L1,.5" }, "┏": { 3: "M0.5,1 L.5,.5 L1,.5" }, "┐": { 1: "M0,.5 L.5,.5 L.5,1" }, "┓": { 3: "M0,.5 L.5,.5 L.5,1" }, "└": { 1: "M.5,0 L.5,.5 L1,.5" }, "┗": { 3: "M.5,0 L.5,.5 L1,.5" }, "┘": { 1: "M.5,0 L.5,.5 L0,.5" }, "┛": { 3: "M.5,0 L.5,.5 L0,.5" }, "├": { 1: "M.5,0 L.5,1 M.5,.5 L1,.5" }, "┣": { 3: "M.5,0 L.5,1 M.5,.5 L1,.5" }, "┤": { 1: "M.5,0 L.5,1 M.5,.5 L0,.5" }, "┫": { 3: "M.5,0 L.5,1 M.5,.5 L0,.5" }, "┬": { 1: "M0,.5 L1,.5 M.5,.5 L.5,1" }, "┳": { 3: "M0,.5 L1,.5 M.5,.5 L.5,1" }, "┴": { 1: "M0,.5 L1,.5 M.5,.5 L.5,0" }, "┻": { 3: "M0,.5 L1,.5 M.5,.5 L.5,0" }, "┼": { 1: "M0,.5 L1,.5 M.5,0 L.5,1" }, "╋": { 3: "M0,.5 L1,.5 M.5,0 L.5,1" }, "╴": { 1: "M.5,.5 L0,.5" }, "╸": { 3: "M.5,.5 L0,.5" }, "╵": { 1: "M.5,.5 L.5,0" }, "╹": { 3: "M.5,.5 L.5,0" }, "╶": { 1: "M.5,.5 L1,.5" }, "╺": { 3: "M.5,.5 L1,.5" }, "╷": { 1: "M.5,.5 L.5,1" }, "╻": { 3: "M.5,.5 L.5,1" }, "═": { 1: (e, t) => `M0,${0.5 - t} L1,${0.5 - t} M0,${0.5 + t} L1,${0.5 + t}` }, "║": { 1: (e, t) => `M${0.5 - e},0 L${0.5 - e},1 M${0.5 + e},0 L${0.5 + e},1` }, "╒": { 1: (e, t) => `M.5,1 L.5,${0.5 - t} L1,${0.5 - t} M.5,${0.5 + t} L1,${0.5 + t}` }, "╓": { 1: (e, t) => `M${0.5 - e},1 L${0.5 - e},.5 L1,.5 M${0.5 + e},.5 L${0.5 + e},1` }, "╔": { 1: (e, t) => `M1,${0.5 - t} L${0.5 - e},${0.5 - t} L${0.5 - e},1 M1,${0.5 + t} L${0.5 + e},${0.5 + t} L${0.5 + e},1` }, "╕": { 1: (e, t) => `M0,${0.5 - t} L.5,${0.5 - t} L.5,1 M0,${0.5 + t} L.5,${0.5 + t}` }, "╖": { 1: (e, t) => `M${0.5 + e},1 L${0.5 + e},.5 L0,.5 M${0.5 - e},.5 L${0.5 - e},1` }, "╗": { 1: (e, t) => `M0,${0.5 + t} L${0.5 - e},${0.5 + t} L${0.5 - e},1 M0,${0.5 - t} L${0.5 + e},${0.5 - t} L${0.5 + e},1` }, "╘": { 1: (e, t) => `M.5,0 L.5,${0.5 + t} L1,${0.5 + t} M.5,${0.5 - t} L1,${0.5 - t}` }, "╙": { 1: (e, t) => `M1,.5 L${0.5 - e},.5 L${0.5 - e},0 M${0.5 + e},.5 L${0.5 + e},0` }, "╚": { 1: (e, t) => `M1,${0.5 - t} L${0.5 + e},${0.5 - t} L${0.5 + e},0 M1,${0.5 + t} L${0.5 - e},${0.5 + t} L${0.5 - e},0` }, "╛": { 1: (e, t) => `M0,${0.5 + t} L.5,${0.5 + t} L.5,0 M0,${0.5 - t} L.5,${0.5 - t}` }, "╜": { 1: (e, t) => `M0,.5 L${0.5 + e},.5 L${0.5 + e},0 M${0.5 - e},.5 L${0.5 - e},0` }, "╝": { 1: (e, t) => `M0,${0.5 - t} L${0.5 - e},${0.5 - t} L${0.5 - e},0 M0,${0.5 + t} L${0.5 + e},${0.5 + t} L${0.5 + e},0` }, "╞": { 1: (e, t) => `M.5,0 L.5,1 M.5,${0.5 - t} L1,${0.5 - t} M.5,${0.5 + t} L1,${0.5 + t}` }, "╟": { 1: (e, t) => `M${0.5 - e},0 L${0.5 - e},1 M${0.5 + e},0 L${0.5 + e},1 M${0.5 + e},.5 L1,.5` }, "╠": { 1: (e, t) => `M${0.5 - e},0 L${0.5 - e},1 M1,${0.5 + t} L${0.5 + e},${0.5 + t} L${0.5 + e},1 M1,${0.5 - t} L${0.5 + e},${0.5 - t} L${0.5 + e},0` }, "╡": { 1: (e, t) => `M.5,0 L.5,1 M0,${0.5 - t} L.5,${0.5 - t} M0,${0.5 + t} L.5,${0.5 + t}` }, "╢": { 1: (e, t) => `M0,.5 L${0.5 - e},.5 M${0.5 - e},0 L${0.5 - e},1 M${0.5 + e},0 L${0.5 + e},1` }, "╣": { 1: (e, t) => `M${0.5 + e},0 L${0.5 + e},1 M0,${0.5 + t} L${0.5 - e},${0.5 + t} L${0.5 - e},1 M0,${0.5 - t} L${0.5 - e},${0.5 - t} L${0.5 - e},0` }, "╤": { 1: (e, t) => `M0,${0.5 - t} L1,${0.5 - t} M0,${0.5 + t} L1,${0.5 + t} M.5,${0.5 + t} L.5,1` }, "╥": { 1: (e, t) => `M0,.5 L1,.5 M${0.5 - e},.5 L${0.5 - e},1 M${0.5 + e},.5 L${0.5 + e},1` }, "╦": { 1: (e, t) => `M0,${0.5 - t} L1,${0.5 - t} M0,${0.5 + t} L${0.5 - e},${0.5 + t} L${0.5 - e},1 M1,${0.5 + t} L${0.5 + e},${0.5 + t} L${0.5 + e},1` }, "╧": { 1: (e, t) => `M.5,0 L.5,${0.5 - t} M0,${0.5 - t} L1,${0.5 - t} M0,${0.5 + t} L1,${0.5 + t}` }, "╨": { 1: (e, t) => `M0,.5 L1,.5 M${0.5 - e},.5 L${0.5 - e},0 M${0.5 + e},.5 L${0.5 + e},0` }, "╩": { 1: (e, t) => `M0,${0.5 + t} L1,${0.5 + t} M0,${0.5 - t} L${0.5 - e},${0.5 - t} L${0.5 - e},0 M1,${0.5 - t} L${0.5 + e},${0.5 - t} L${0.5 + e},0` }, "╪": { 1: (e, t) => `M.5,0 L.5,1 M0,${0.5 - t} L1,${0.5 - t} M0,${0.5 + t} L1,${0.5 + t}` }, "╫": { 1: (e, t) => `M0,.5 L1,.5 M${0.5 - e},0 L${0.5 - e},1 M${0.5 + e},0 L${0.5 + e},1` }, "╬": { 1: (e, t) => `M0,${0.5 + t} L${0.5 - e},${0.5 + t} L${0.5 - e},1 M1,${0.5 + t} L${0.5 + e},${0.5 + t} L${0.5 + e},1 M0,${0.5 - t} L${0.5 - e},${0.5 - t} L${0.5 - e},0 M1,${0.5 - t} L${0.5 + e},${0.5 - t} L${0.5 + e},0` }, "╱": { 1: "M1,0 L0,1" }, "╲": { 1: "M0,0 L1,1" }, "╳": { 1: "M1,0 L0,1 M0,0 L1,1" }, "╼": { 1: "M.5,.5 L0,.5", 3: "M.5,.5 L1,.5" }, "╽": { 1: "M.5,.5 L.5,0", 3: "M.5,.5 L.5,1" }, "╾": { 1: "M.5,.5 L1,.5", 3: "M.5,.5 L0,.5" }, "╿": { 1: "M.5,.5 L.5,1", 3: "M.5,.5 L.5,0" }, "┍": { 1: "M.5,.5 L.5,1", 3: "M.5,.5 L1,.5" }, "┎": { 1: "M.5,.5 L1,.5", 3: "M.5,.5 L.5,1" }, "┑": { 1: "M.5,.5 L.5,1", 3: "M.5,.5 L0,.5" }, "┒": { 1: "M.5,.5 L0,.5", 3: "M.5,.5 L.5,1" }, "┕": { 1: "M.5,.5 L.5,0", 3: "M.5,.5 L1,.5" }, "┖": { 1: "M.5,.5 L1,.5", 3: "M.5,.5 L.5,0" }, "┙": { 1: "M.5,.5 L.5,0", 3: "M.5,.5 L0,.5" }, "┚": { 1: "M.5,.5 L0,.5", 3: "M.5,.5 L.5,0" }, "┝": { 1: "M.5,0 L.5,1", 3: "M.5,.5 L1,.5" }, "┞": { 1: "M0.5,1 L.5,.5 L1,.5", 3: "M.5,.5 L.5,0" }, "┟": { 1: "M.5,0 L.5,.5 L1,.5", 3: "M.5,.5 L.5,1" }, "┠": { 1: "M.5,.5 L1,.5", 3: "M.5,0 L.5,1" }, "┡": { 1: "M.5,.5 L.5,1", 3: "M.5,0 L.5,.5 L1,.5" }, "┢": { 1: "M.5,.5 L.5,0", 3: "M0.5,1 L.5,.5 L1,.5" }, "┥": { 1: "M.5,0 L.5,1", 3: "M.5,.5 L0,.5" }, "┦": { 1: "M0,.5 L.5,.5 L.5,1", 3: "M.5,.5 L.5,0" }, "┧": { 1: "M.5,0 L.5,.5 L0,.5", 3: "M.5,.5 L.5,1" }, "┨": { 1: "M.5,.5 L0,.5", 3: "M.5,0 L.5,1" }, "┩": { 1: "M.5,.5 L.5,1", 3: "M.5,0 L.5,.5 L0,.5" }, "┪": { 1: "M.5,.5 L.5,0", 3: "M0,.5 L.5,.5 L.5,1" }, "┭": { 1: "M0.5,1 L.5,.5 L1,.5", 3: "M.5,.5 L0,.5" }, "┮": { 1: "M0,.5 L.5,.5 L.5,1", 3: "M.5,.5 L1,.5" }, "┯": { 1: "M.5,.5 L.5,1", 3: "M0,.5 L1,.5" }, "┰": { 1: "M0,.5 L1,.5", 3: "M.5,.5 L.5,1" }, "┱": { 1: "M.5,.5 L1,.5", 3: "M0,.5 L.5,.5 L.5,1" }, "┲": { 1: "M.5,.5 L0,.5", 3: "M0.5,1 L.5,.5 L1,.5" }, "┵": { 1: "M.5,0 L.5,.5 L1,.5", 3: "M.5,.5 L0,.5" }, "┶": { 1: "M.5,0 L.5,.5 L0,.5", 3: "M.5,.5 L1,.5" }, "┷": { 1: "M.5,.5 L.5,0", 3: "M0,.5 L1,.5" }, "┸": { 1: "M0,.5 L1,.5", 3: "M.5,.5 L.5,0" }, "┹": { 1: "M.5,.5 L1,.5", 3: "M.5,0 L.5,.5 L0,.5" }, "┺": { 1: "M.5,.5 L0,.5", 3: "M.5,0 L.5,.5 L1,.5" }, "┽": { 1: "M.5,0 L.5,1 M.5,.5 L1,.5", 3: "M.5,.5 L0,.5" }, "┾": { 1: "M.5,0 L.5,1 M.5,.5 L0,.5", 3: "M.5,.5 L1,.5" }, "┿": { 1: "M.5,0 L.5,1", 3: "M0,.5 L1,.5" }, "╀": { 1: "M0,.5 L1,.5 M.5,.5 L.5,1", 3: "M.5,.5 L.5,0" }, "╁": { 1: "M.5,.5 L.5,0 M0,.5 L1,.5", 3: "M.5,.5 L.5,1" }, "╂": { 1: "M0,.5 L1,.5", 3: "M.5,0 L.5,1" }, "╃": { 1: "M0.5,1 L.5,.5 L1,.5", 3: "M.5,0 L.5,.5 L0,.5" }, "╄": { 1: "M0,.5 L.5,.5 L.5,1", 3: "M.5,0 L.5,.5 L1,.5" }, "╅": { 1: "M.5,0 L.5,.5 L1,.5", 3: "M0,.5 L.5,.5 L.5,1" }, "╆": { 1: "M.5,0 L.5,.5 L0,.5", 3: "M0.5,1 L.5,.5 L1,.5" }, "╇": { 1: "M.5,.5 L.5,1", 3: "M.5,.5 L.5,0 M0,.5 L1,.5" }, "╈": { 1: "M.5,.5 L.5,0", 3: "M0,.5 L1,.5 M.5,.5 L.5,1" }, "╉": { 1: "M.5,.5 L1,.5", 3: "M.5,0 L.5,1 M.5,.5 L0,.5" }, "╊": { 1: "M.5,.5 L0,.5", 3: "M.5,0 L.5,1 M.5,.5 L1,.5" }, "╌": { 1: "M.1,.5 L.4,.5 M.6,.5 L.9,.5" }, "╍": { 3: "M.1,.5 L.4,.5 M.6,.5 L.9,.5" }, "┄": { 1: "M.0667,.5 L.2667,.5 M.4,.5 L.6,.5 M.7333,.5 L.9333,.5" }, "┅": { 3: "M.0667,.5 L.2667,.5 M.4,.5 L.6,.5 M.7333,.5 L.9333,.5" }, "┈": { 1: "M.05,.5 L.2,.5 M.3,.5 L.45,.5 M.55,.5 L.7,.5 M.8,.5 L.95,.5" }, "┉": { 3: "M.05,.5 L.2,.5 M.3,.5 L.45,.5 M.55,.5 L.7,.5 M.8,.5 L.95,.5" }, "╎": { 1: "M.5,.1 L.5,.4 M.5,.6 L.5,.9" }, "╏": { 3: "M.5,.1 L.5,.4 M.5,.6 L.5,.9" }, "┆": { 1: "M.5,.0667 L.5,.2667 M.5,.4 L.5,.6 M.5,.7333 L.5,.9333" }, "┇": { 3: "M.5,.0667 L.5,.2667 M.5,.4 L.5,.6 M.5,.7333 L.5,.9333" }, "┊": { 1: "M.5,.05 L.5,.2 M.5,.3 L.5,.45 L.5,.55 M.5,.7 L.5,.95" }, "┋": { 3: "M.5,.05 L.5,.2 M.5,.3 L.5,.45 L.5,.55 M.5,.7 L.5,.95" }, "╭": { 1: (e, t) => `M.5,1 L.5,${0.5 + t / 0.15 * 0.5} C.5,${0.5 + t / 0.15 * 0.5},.5,.5,1,.5` }, "╮": { 1: (e, t) => `M.5,1 L.5,${0.5 + t / 0.15 * 0.5} C.5,${0.5 + t / 0.15 * 0.5},.5,.5,0,.5` }, "╯": { 1: (e, t) => `M.5,0 L.5,${0.5 - t / 0.15 * 0.5} C.5,${0.5 - t / 0.15 * 0.5},.5,.5,0,.5` }, "╰": { 1: (e, t) => `M.5,0 L.5,${0.5 - t / 0.15 * 0.5} C.5,${0.5 - t / 0.15 * 0.5},.5,.5,1,.5` } }, qs = { "": { d: "M.3,1 L.03,1 L.03,.88 C.03,.82,.06,.78,.11,.73 C.15,.7,.2,.68,.28,.65 L.43,.6 C.49,.58,.53,.56,.56,.53 C.59,.5,.6,.47,.6,.43 L.6,.27 L.4,.27 L.69,.1 L.98,.27 L.78,.27 L.78,.46 C.78,.52,.76,.56,.72,.61 C.68,.66,.63,.67,.56,.7 L.48,.72 C.42,.74,.38,.76,.35,.78 C.32,.8,.31,.84,.31,.88 L.31,1 M.3,.5 L.03,.59 L.03,.09 L.3,.09 L.3,.655", type: 0 }, "": { d: "M.7,.4 L.7,.47 L.2,.47 L.2,.03 L.355,.03 L.355,.4 L.705,.4 M.7,.5 L.86,.5 L.86,.95 L.69,.95 L.44,.66 L.46,.86 L.46,.95 L.3,.95 L.3,.49 L.46,.49 L.71,.78 L.69,.565 L.69,.5", type: 0 }, "": { d: "M.25,.94 C.16,.94,.11,.92,.11,.87 L.11,.53 C.11,.48,.15,.455,.23,.45 L.23,.3 C.23,.25,.26,.22,.31,.19 C.36,.16,.43,.15,.51,.15 C.59,.15,.66,.16,.71,.19 C.77,.22,.79,.26,.79,.3 L.79,.45 C.87,.45,.91,.48,.91,.53 L.91,.87 C.91,.92,.86,.94,.77,.94 L.24,.94 M.53,.2 C.49,.2,.45,.21,.42,.23 C.39,.25,.38,.27,.38,.3 L.38,.45 L.68,.45 L.68,.3 C.68,.27,.67,.25,.64,.23 C.61,.21,.58,.2,.53,.2 M.58,.82 L.58,.66 C.63,.65,.65,.63,.65,.6 C.65,.58,.64,.57,.61,.56 C.58,.55,.56,.54,.52,.54 C.48,.54,.46,.55,.43,.56 C.4,.57,.39,.59,.39,.6 C.39,.63,.41,.64,.46,.66 L.46,.82 L.57,.82", type: 0 }, "": { d: "M0,0 L1,.5 L0,1", type: 0, rightPadding: 2 }, "": { d: "M-1,-.5 L1,.5 L-1,1.5", type: 1, leftPadding: 1, rightPadding: 1 }, "": { d: "M1,0 L0,.5 L1,1", type: 0, leftPadding: 2 }, "": { d: "M2,-.5 L0,.5 L2,1.5", type: 1, leftPadding: 1, rightPadding: 1 }, "": { d: "M0,0 L0,1 C0.552,1,1,0.776,1,.5 C1,0.224,0.552,0,0,0", type: 0, rightPadding: 1 }, "": { d: "M.2,1 C.422,1,.8,.826,.78,.5 C.8,.174,0.422,0,.2,0", type: 1, rightPadding: 1 }, "": { d: "M1,0 L1,1 C0.448,1,0,0.776,0,.5 C0,0.224,0.448,0,1,0", type: 0, leftPadding: 1 }, "": { d: "M.8,1 C0.578,1,0.2,.826,.22,.5 C0.2,0.174,0.578,0,0.8,0", type: 1, leftPadding: 1 }, "": { d: "M-.5,-.5 L1.5,1.5 L-.5,1.5", type: 0 }, "": { d: "M-.5,-.5 L1.5,1.5", type: 1, leftPadding: 1, rightPadding: 1 }, "": { d: "M1.5,-.5 L-.5,1.5 L1.5,1.5", type: 0 }, "": { d: "M1.5,-.5 L-.5,1.5 L-.5,-.5", type: 0 }, "": { d: "M1.5,-.5 L-.5,1.5", type: 1, leftPadding: 1, rightPadding: 1 }, "": { d: "M-.5,-.5 L1.5,1.5 L1.5,-.5", type: 0 } };
qs[""] = qs[""];
qs[""] = qs[""];
function Yf(e, t, s, r, n, o, a, l) {
  let c = Kf[t];
  if (c) return jf(e, c, s, r, n, o), !0;
  let h = Vf[t];
  if (h) return Gf(e, h, s, r, n, o), !0;
  let d = qf[t];
  if (d) return Xf(e, d, s, r, n, o, l), !0;
  let u = qs[t];
  return u ? (Zf(e, u, s, r, n, o, a, l), !0) : !1;
}
function jf(e, t, s, r, n, o) {
  for (let a = 0; a < t.length; a++) {
    let l = t[a], c = n / 8, h = o / 8;
    e.fillRect(s + l.x * c, r + l.y * h, l.w * c, l.h * h);
  }
}
var rl = /* @__PURE__ */ new Map();
function Gf(e, t, s, r, n, o) {
  let a = rl.get(t);
  a || (a = /* @__PURE__ */ new Map(), rl.set(t, a));
  let l = e.fillStyle;
  if (typeof l != "string") throw new Error(`Unexpected fillStyle type "${l}"`);
  let c = a.get(l);
  if (!c) {
    let h = t[0].length, d = t.length, u = e.canvas.ownerDocument.createElement("canvas");
    u.width = h, u.height = d;
    let f = Ve(u.getContext("2d")), _ = new ImageData(h, d), g, y, D, R;
    if (l.startsWith("#")) g = parseInt(l.slice(1, 3), 16), y = parseInt(l.slice(3, 5), 16), D = parseInt(l.slice(5, 7), 16), R = l.length > 7 && parseInt(l.slice(7, 9), 16) || 1;
    else if (l.startsWith("rgba")) [g, y, D, R] = l.substring(5, l.length - 1).split(",").map((H) => parseFloat(H));
    else throw new Error(`Unexpected fillStyle color format "${l}" when drawing pattern glyph`);
    for (let H = 0; H < d; H++) for (let M = 0; M < h; M++) _.data[(H * h + M) * 4] = g, _.data[(H * h + M) * 4 + 1] = y, _.data[(H * h + M) * 4 + 2] = D, _.data[(H * h + M) * 4 + 3] = t[H][M] * (R * 255);
    f.putImageData(_, 0, 0), c = Ve(e.createPattern(u, null)), a.set(l, c);
  }
  e.fillStyle = c, e.fillRect(s, r, n, o);
}
function Xf(e, t, s, r, n, o, a) {
  e.strokeStyle = e.fillStyle;
  for (let [l, c] of Object.entries(t)) {
    e.beginPath(), e.lineWidth = a * Number.parseInt(l);
    let h;
    if (typeof c == "function") {
      let d = 0.15 / o * n;
      h = c(0.15, d);
    } else h = c;
    for (let d of h.split(" ")) {
      let u = d[0], f = Yh[u];
      if (!f) {
        console.error(`Could not find drawing instructions for "${u}"`);
        continue;
      }
      let _ = d.substring(1).split(",");
      !_[0] || !_[1] || f(e, jh(_, n, o, s, r, !0, a));
    }
    e.stroke(), e.closePath();
  }
}
function Zf(e, t, s, r, n, o, a, l) {
  let c = new Path2D();
  c.rect(s, r, n, o), e.clip(c), e.beginPath();
  let h = a / 12;
  e.lineWidth = l * h;
  for (let d of t.d.split(" ")) {
    let u = d[0], f = Yh[u];
    if (!f) {
      console.error(`Could not find drawing instructions for "${u}"`);
      continue;
    }
    let _ = d.substring(1).split(",");
    !_[0] || !_[1] || f(e, jh(_, n, o, s, r, !1, l, (t.leftPadding ?? 0) * (h / 2), (t.rightPadding ?? 0) * (h / 2)));
  }
  t.type === 1 ? (e.strokeStyle = e.fillStyle, e.stroke()) : e.fill(), e.closePath();
}
function nl(e, t, s = 0) {
  return Math.max(Math.min(e, t), s);
}
var Yh = { C: (e, t) => e.bezierCurveTo(t[0], t[1], t[2], t[3], t[4], t[5]), L: (e, t) => e.lineTo(t[0], t[1]), M: (e, t) => e.moveTo(t[0], t[1]) };
function jh(e, t, s, r, n, o, a, l = 0, c = 0) {
  let h = e.map((d) => parseFloat(d) || parseInt(d));
  if (h.length < 2) throw new Error("Too few arguments for instruction");
  for (let d = 0; d < h.length; d += 2) h[d] *= t - l * a - c * a, o && h[d] !== 0 && (h[d] = nl(Math.round(h[d] + 0.5) - 0.5, t, 0)), h[d] += r + l * a;
  for (let d = 1; d < h.length; d += 2) h[d] *= s, o && h[d] !== 0 && (h[d] = nl(Math.round(h[d] + 0.5) - 0.5, s, 0)), h[d] += n;
  return h;
}
var ol = class {
  constructor() {
    this._data = {};
  }
  set(e, t, s) {
    this._data[e] || (this._data[e] = {}), this._data[e][t] = s;
  }
  get(e, t) {
    return this._data[e] ? this._data[e][t] : void 0;
  }
  clear() {
    this._data = {};
  }
}, al = class {
  constructor() {
    this._data = new ol();
  }
  set(e, t, s, r, n) {
    this._data.get(e, t) || this._data.set(e, t, new ol()), this._data.get(e, t).set(s, r, n);
  }
  get(e, t, s, r) {
    var n;
    return (n = this._data.get(e, t)) == null ? void 0 : n.get(s, r);
  }
  clear() {
    this._data.clear();
  }
}, Gh = class {
  constructor() {
    this._tasks = [], this._i = 0;
  }
  enqueue(e) {
    this._tasks.push(e), this._start();
  }
  flush() {
    for (; this._i < this._tasks.length; ) this._tasks[this._i]() || this._i++;
    this.clear();
  }
  clear() {
    this._idleCallback && (this._cancelCallback(this._idleCallback), this._idleCallback = void 0), this._i = 0, this._tasks.length = 0;
  }
  _start() {
    this._idleCallback || (this._idleCallback = this._requestCallback(this._process.bind(this)));
  }
  _process(e) {
    this._idleCallback = void 0;
    let t = 0, s = 0, r = e.timeRemaining(), n = 0;
    for (; this._i < this._tasks.length; ) {
      if (t = performance.now(), this._tasks[this._i]() || this._i++, t = Math.max(1, performance.now() - t), s = Math.max(t, s), n = e.timeRemaining(), s * 1.5 > n) {
        r - t < -20 && console.warn(`task queue exceeded allotted deadline by ${Math.abs(Math.round(r - t))}ms`), this._start();
        return;
      }
      r = n;
    }
    this.clear();
  }
}, Jf = class extends Gh {
  _requestCallback(e) {
    return setTimeout(() => e(this._createDeadline(16)));
  }
  _cancelCallback(e) {
    clearTimeout(e);
  }
  _createDeadline(e) {
    let t = performance.now() + e;
    return { timeRemaining: () => Math.max(0, t - performance.now()) };
  }
}, Qf = class extends Gh {
  _requestCallback(e) {
    return requestIdleCallback(e);
  }
  _cancelCallback(e) {
    cancelIdleCallback(e);
  }
}, ep = !Oo && "requestIdleCallback" in window ? Qf : Jf, us = class Xh {
  constructor() {
    this.fg = 0, this.bg = 0, this.extended = new Zh();
  }
  static toColorRGB(t) {
    return [t >>> 16 & 255, t >>> 8 & 255, t & 255];
  }
  static fromColorRGB(t) {
    return (t[0] & 255) << 16 | (t[1] & 255) << 8 | t[2] & 255;
  }
  clone() {
    let t = new Xh();
    return t.fg = this.fg, t.bg = this.bg, t.extended = this.extended.clone(), t;
  }
  isInverse() {
    return this.fg & 67108864;
  }
  isBold() {
    return this.fg & 134217728;
  }
  isUnderline() {
    return this.hasExtendedAttrs() && this.extended.underlineStyle !== 0 ? 1 : this.fg & 268435456;
  }
  isBlink() {
    return this.fg & 536870912;
  }
  isInvisible() {
    return this.fg & 1073741824;
  }
  isItalic() {
    return this.bg & 67108864;
  }
  isDim() {
    return this.bg & 134217728;
  }
  isStrikethrough() {
    return this.fg & 2147483648;
  }
  isProtected() {
    return this.bg & 536870912;
  }
  isOverline() {
    return this.bg & 1073741824;
  }
  getFgColorMode() {
    return this.fg & 50331648;
  }
  getBgColorMode() {
    return this.bg & 50331648;
  }
  isFgRGB() {
    return (this.fg & 50331648) === 50331648;
  }
  isBgRGB() {
    return (this.bg & 50331648) === 50331648;
  }
  isFgPalette() {
    return (this.fg & 50331648) === 16777216 || (this.fg & 50331648) === 33554432;
  }
  isBgPalette() {
    return (this.bg & 50331648) === 16777216 || (this.bg & 50331648) === 33554432;
  }
  isFgDefault() {
    return (this.fg & 50331648) === 0;
  }
  isBgDefault() {
    return (this.bg & 50331648) === 0;
  }
  isAttributeDefault() {
    return this.fg === 0 && this.bg === 0;
  }
  getFgColor() {
    switch (this.fg & 50331648) {
      case 16777216:
      case 33554432:
        return this.fg & 255;
      case 50331648:
        return this.fg & 16777215;
      default:
        return -1;
    }
  }
  getBgColor() {
    switch (this.bg & 50331648) {
      case 16777216:
      case 33554432:
        return this.bg & 255;
      case 50331648:
        return this.bg & 16777215;
      default:
        return -1;
    }
  }
  hasExtendedAttrs() {
    return this.bg & 268435456;
  }
  updateExtended() {
    this.extended.isEmpty() ? this.bg &= -268435457 : this.bg |= 268435456;
  }
  getUnderlineColor() {
    if (this.bg & 268435456 && ~this.extended.underlineColor) switch (this.extended.underlineColor & 50331648) {
      case 16777216:
      case 33554432:
        return this.extended.underlineColor & 255;
      case 50331648:
        return this.extended.underlineColor & 16777215;
      default:
        return this.getFgColor();
    }
    return this.getFgColor();
  }
  getUnderlineColorMode() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? this.extended.underlineColor & 50331648 : this.getFgColorMode();
  }
  isUnderlineColorRGB() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 50331648 : this.isFgRGB();
  }
  isUnderlineColorPalette() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 16777216 || (this.extended.underlineColor & 50331648) === 33554432 : this.isFgPalette();
  }
  isUnderlineColorDefault() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 0 : this.isFgDefault();
  }
  getUnderlineStyle() {
    return this.fg & 268435456 ? this.bg & 268435456 ? this.extended.underlineStyle : 1 : 0;
  }
  getUnderlineVariantOffset() {
    return this.extended.underlineVariantOffset;
  }
}, Zh = class Jh {
  constructor(t = 0, s = 0) {
    this._ext = 0, this._urlId = 0, this._ext = t, this._urlId = s;
  }
  get ext() {
    return this._urlId ? this._ext & -469762049 | this.underlineStyle << 26 : this._ext;
  }
  set ext(t) {
    this._ext = t;
  }
  get underlineStyle() {
    return this._urlId ? 5 : (this._ext & 469762048) >> 26;
  }
  set underlineStyle(t) {
    this._ext &= -469762049, this._ext |= t << 26 & 469762048;
  }
  get underlineColor() {
    return this._ext & 67108863;
  }
  set underlineColor(t) {
    this._ext &= -67108864, this._ext |= t & 67108863;
  }
  get urlId() {
    return this._urlId;
  }
  set urlId(t) {
    this._urlId = t;
  }
  get underlineVariantOffset() {
    let t = (this._ext & 3758096384) >> 29;
    return t < 0 ? t ^ 4294967288 : t;
  }
  set underlineVariantOffset(t) {
    this._ext &= 536870911, this._ext |= t << 29 & 3758096384;
  }
  clone() {
    return new Jh(this._ext, this._urlId);
  }
  isEmpty() {
    return this.underlineStyle === 0 && this._urlId === 0;
  }
}, tp = globalThis.performance && typeof globalThis.performance.now == "function", ip = class Qh {
  static create(t) {
    return new Qh(t);
  }
  constructor(t) {
    this._now = tp && t === !1 ? Date.now : globalThis.performance.now.bind(globalThis.performance), this._startTime = this._now(), this._stopTime = -1;
  }
  stop() {
    this._stopTime = this._now();
  }
  reset() {
    this._startTime = this._now(), this._stopTime = -1;
  }
  elapsed() {
    return this._stopTime !== -1 ? this._stopTime - this._startTime : this._now() - this._startTime;
  }
}, Gt;
((e) => {
  e.None = () => zt.None;
  function t(v, p) {
    return u(v, () => {
    }, 0, void 0, !0, void 0, p);
  }
  e.defer = t;
  function s(v) {
    return (p, w = null, m) => {
      let b = !1, L;
      return L = v((x) => {
        if (!b) return L ? L.dispose() : b = !0, p.call(w, x);
      }, null, m), b && L.dispose(), L;
    };
  }
  e.once = s;
  function r(v, p, w) {
    return h((m, b = null, L) => v((x) => m.call(b, p(x)), null, L), w);
  }
  e.map = r;
  function n(v, p, w) {
    return h((m, b = null, L) => v((x) => {
      p(x), m.call(b, x);
    }, null, L), w);
  }
  e.forEach = n;
  function o(v, p, w) {
    return h((m, b = null, L) => v((x) => p(x) && m.call(b, x), null, L), w);
  }
  e.filter = o;
  function a(v) {
    return v;
  }
  e.signal = a;
  function l(...v) {
    return (p, w = null, m) => {
      let b = $h(...v.map((L) => L((x) => p.call(w, x))));
      return d(b, m);
    };
  }
  e.any = l;
  function c(v, p, w, m) {
    let b = w;
    return r(v, (L) => (b = p(b, L), b), m);
  }
  e.reduce = c;
  function h(v, p) {
    let w, m = { onWillAddFirstListener() {
      w = v(b.fire, b);
    }, onDidRemoveLastListener() {
      w == null || w.dispose();
    } }, b = new Be(m);
    return p == null || p.add(b), b.event;
  }
  function d(v, p) {
    return p instanceof Array ? p.push(v) : p && p.add(v), v;
  }
  function u(v, p, w = 100, m = !1, b = !1, L, x) {
    let A, I, se, he = 0, re, ce = { leakWarningThreshold: L, onWillAddFirstListener() {
      A = v((ge) => {
        he++, I = p(I, ge), m && !se && (pe.fire(I), I = void 0), re = () => {
          let be = I;
          I = void 0, se = void 0, (!m || he > 1) && pe.fire(be), he = 0;
        }, typeof w == "number" ? (clearTimeout(se), se = setTimeout(re, w)) : se === void 0 && (se = 0, queueMicrotask(re));
      });
    }, onWillRemoveListener() {
      b && he > 0 && (re == null || re());
    }, onDidRemoveLastListener() {
      re = void 0, A.dispose();
    } }, pe = new Be(ce);
    return x == null || x.add(pe), pe.event;
  }
  e.debounce = u;
  function f(v, p = 0, w) {
    return e.debounce(v, (m, b) => m ? (m.push(b), m) : [b], p, void 0, !0, void 0, w);
  }
  e.accumulate = f;
  function _(v, p = (m, b) => m === b, w) {
    let m = !0, b;
    return o(v, (L) => {
      let x = m || !p(L, b);
      return m = !1, b = L, x;
    }, w);
  }
  e.latch = _;
  function g(v, p, w) {
    return [e.filter(v, p, w), e.filter(v, (m) => !p(m), w)];
  }
  e.split = g;
  function y(v, p = !1, w = [], m) {
    let b = w.slice(), L = v((I) => {
      b ? b.push(I) : A.fire(I);
    });
    m && m.add(L);
    let x = () => {
      b == null || b.forEach((I) => A.fire(I)), b = null;
    }, A = new Be({ onWillAddFirstListener() {
      L || (L = v((I) => A.fire(I)), m && m.add(L));
    }, onDidAddFirstListener() {
      b && (p ? setTimeout(x) : x());
    }, onDidRemoveLastListener() {
      L && L.dispose(), L = null;
    } });
    return m && m.add(A), A.event;
  }
  e.buffer = y;
  function D(v, p) {
    return (w, m, b) => {
      let L = p(new H());
      return v(function(x) {
        let A = L.evaluate(x);
        A !== R && w.call(m, A);
      }, void 0, b);
    };
  }
  e.chain = D;
  let R = Symbol("HaltChainable");
  class H {
    constructor() {
      this.steps = [];
    }
    map(p) {
      return this.steps.push(p), this;
    }
    forEach(p) {
      return this.steps.push((w) => (p(w), w)), this;
    }
    filter(p) {
      return this.steps.push((w) => p(w) ? w : R), this;
    }
    reduce(p, w) {
      let m = w;
      return this.steps.push((b) => (m = p(m, b), m)), this;
    }
    latch(p = (w, m) => w === m) {
      let w = !0, m;
      return this.steps.push((b) => {
        let L = w || !p(b, m);
        return w = !1, m = b, L ? b : R;
      }), this;
    }
    evaluate(p) {
      for (let w of this.steps) if (p = w(p), p === R) break;
      return p;
    }
  }
  function M(v, p, w = (m) => m) {
    let m = (...A) => x.fire(w(...A)), b = () => v.on(p, m), L = () => v.removeListener(p, m), x = new Be({ onWillAddFirstListener: b, onDidRemoveLastListener: L });
    return x.event;
  }
  e.fromNodeEventEmitter = M;
  function k(v, p, w = (m) => m) {
    let m = (...A) => x.fire(w(...A)), b = () => v.addEventListener(p, m), L = () => v.removeEventListener(p, m), x = new Be({ onWillAddFirstListener: b, onDidRemoveLastListener: L });
    return x.event;
  }
  e.fromDOMEventEmitter = k;
  function B(v) {
    return new Promise((p) => s(v)(p));
  }
  e.toPromise = B;
  function N(v) {
    let p = new Be();
    return v.then((w) => {
      p.fire(w);
    }, () => {
      p.fire(void 0);
    }).finally(() => {
      p.dispose();
    }), p.event;
  }
  e.fromPromise = N;
  function U(v, p) {
    return v((w) => p.fire(w));
  }
  e.forward = U;
  function ie(v, p, w) {
    return p(w), v((m) => p(m));
  }
  e.runAndSubscribe = ie;
  class Z {
    constructor(p, w) {
      this._observable = p, this._counter = 0, this._hasChanged = !1;
      let m = { onWillAddFirstListener: () => {
        p.addObserver(this);
      }, onDidRemoveLastListener: () => {
        p.removeObserver(this);
      } };
      this.emitter = new Be(m), w && w.add(this.emitter);
    }
    beginUpdate(p) {
      this._counter++;
    }
    handlePossibleChange(p) {
    }
    handleChange(p, w) {
      this._hasChanged = !0;
    }
    endUpdate(p) {
      this._counter--, this._counter === 0 && (this._observable.reportChanges(), this._hasChanged && (this._hasChanged = !1, this.emitter.fire(this._observable.get())));
    }
  }
  function _e(v, p) {
    return new Z(v, p).emitter.event;
  }
  e.fromObservable = _e;
  function Y(v) {
    return (p, w, m) => {
      let b = 0, L = !1, x = { beginUpdate() {
        b++;
      }, endUpdate() {
        b--, b === 0 && (v.reportChanges(), L && (L = !1, p.call(w)));
      }, handlePossibleChange() {
      }, handleChange() {
        L = !0;
      } };
      v.addObserver(x), v.reportChanges();
      let A = { dispose() {
        v.removeObserver(x);
      } };
      return m instanceof ps ? m.add(A) : Array.isArray(m) && m.push(A), A;
    };
  }
  e.fromObservableLight = Y;
})(Gt || (Gt = {}));
var po = class go {
  constructor(t) {
    this.listenerCount = 0, this.invocationCount = 0, this.elapsedOverall = 0, this.durations = [], this.name = `${t}_${go._idPool++}`, go.all.add(this);
  }
  start(t) {
    this._stopWatch = new ip(), this.listenerCount = t;
  }
  stop() {
    if (this._stopWatch) {
      let t = this._stopWatch.elapsed();
      this.durations.push(t), this.elapsedOverall += t, this.invocationCount += 1, this._stopWatch = void 0;
    }
  }
};
po.all = /* @__PURE__ */ new Set(), po._idPool = 0;
var sp = po, rp = -1, ec = class tc {
  constructor(t, s, r = (tc._idPool++).toString(16).padStart(3, "0")) {
    this._errorHandler = t, this.threshold = s, this.name = r, this._warnCountdown = 0;
  }
  dispose() {
    var t;
    (t = this._stacks) == null || t.clear();
  }
  check(t, s) {
    let r = this.threshold;
    if (r <= 0 || s < r) return;
    this._stacks || (this._stacks = /* @__PURE__ */ new Map());
    let n = this._stacks.get(t.value) || 0;
    if (this._stacks.set(t.value, n + 1), this._warnCountdown -= 1, this._warnCountdown <= 0) {
      this._warnCountdown = r * 0.5;
      let [o, a] = this.getMostFrequentStack(), l = `[${this.name}] potential listener LEAK detected, having ${s} listeners already. MOST frequent listener (${a}):`;
      console.warn(l), console.warn(o);
      let c = new ap(l, o);
      this._errorHandler(c);
    }
    return () => {
      let o = this._stacks.get(t.value) || 0;
      this._stacks.set(t.value, o - 1);
    };
  }
  getMostFrequentStack() {
    if (!this._stacks) return;
    let t, s = 0;
    for (let [r, n] of this._stacks) (!t || s < n) && (t = [r, n], s = n);
    return t;
  }
};
ec._idPool = 1;
var np = ec, op = class ic {
  constructor(t) {
    this.value = t;
  }
  static create() {
    let t = new Error();
    return new ic(t.stack ?? "");
  }
  print() {
    console.warn(this.value.split(`
`).slice(2).join(`
`));
  }
}, ap = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerLeakError", this.stack = t;
  }
}, lp = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerRefusalError", this.stack = t;
  }
}, hp = 0, on = class {
  constructor(e) {
    this.value = e, this.id = hp++;
  }
}, cp = 2, Be = class {
  constructor(e) {
    var t, s, r, n;
    this._size = 0, this._options = e, this._leakageMon = (t = this._options) != null && t.leakWarningThreshold ? new np((e == null ? void 0 : e.onListenerError) ?? rn, ((s = this._options) == null ? void 0 : s.leakWarningThreshold) ?? rp) : void 0, this._perfMon = (r = this._options) != null && r._profName ? new sp(this._options._profName) : void 0, this._deliveryQueue = (n = this._options) == null ? void 0 : n.deliveryQueue;
  }
  dispose() {
    var e, t, s, r;
    this._disposed || (this._disposed = !0, ((e = this._deliveryQueue) == null ? void 0 : e.current) === this && this._deliveryQueue.reset(), this._listeners && (this._listeners = void 0, this._size = 0), (s = (t = this._options) == null ? void 0 : t.onDidRemoveLastListener) == null || s.call(t), (r = this._leakageMon) == null || r.dispose());
  }
  get event() {
    return this._event ?? (this._event = (e, t, s) => {
      var r, n, o, a, l;
      if (this._leakageMon && this._size > this._leakageMon.threshold ** 2) {
        let u = `[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far (${this._size} vs ${this._leakageMon.threshold})`;
        console.warn(u);
        let f = this._leakageMon.getMostFrequentStack() ?? ["UNKNOWN stack", -1], _ = new lp(`${u}. HINT: Stack shows most frequent listener (${f[1]}-times)`, f[0]);
        return (((r = this._options) == null ? void 0 : r.onListenerError) || rn)(_), zt.None;
      }
      if (this._disposed) return zt.None;
      t && (e = e.bind(t));
      let c = new on(e), h;
      this._leakageMon && this._size >= Math.ceil(this._leakageMon.threshold * 0.2) && (c.stack = op.create(), h = this._leakageMon.check(c.stack, this._size + 1)), this._listeners ? this._listeners instanceof on ? (this._deliveryQueue ?? (this._deliveryQueue = new dp()), this._listeners = [this._listeners, c]) : this._listeners.push(c) : ((o = (n = this._options) == null ? void 0 : n.onWillAddFirstListener) == null || o.call(n, this), this._listeners = c, (l = (a = this._options) == null ? void 0 : a.onDidAddFirstListener) == null || l.call(a, this)), this._size++;
      let d = _t(() => {
        h == null || h(), this._removeListener(c);
      });
      return s instanceof ps ? s.add(d) : Array.isArray(s) && s.push(d), d;
    }), this._event;
  }
  _removeListener(e) {
    var t, s, r, n;
    if ((s = (t = this._options) == null ? void 0 : t.onWillRemoveListener) == null || s.call(t, this), !this._listeners) return;
    if (this._size === 1) {
      this._listeners = void 0, (n = (r = this._options) == null ? void 0 : r.onDidRemoveLastListener) == null || n.call(r, this), this._size = 0;
      return;
    }
    let o = this._listeners, a = o.indexOf(e);
    if (a === -1) throw console.log("disposed?", this._disposed), console.log("size?", this._size), console.log("arr?", JSON.stringify(this._listeners)), new Error("Attempted to dispose unknown listener");
    this._size--, o[a] = void 0;
    let l = this._deliveryQueue.current === this;
    if (this._size * cp <= o.length) {
      let c = 0;
      for (let h = 0; h < o.length; h++) o[h] ? o[c++] = o[h] : l && (this._deliveryQueue.end--, c < this._deliveryQueue.i && this._deliveryQueue.i--);
      o.length = c;
    }
  }
  _deliver(e, t) {
    var s;
    if (!e) return;
    let r = ((s = this._options) == null ? void 0 : s.onListenerError) || rn;
    if (!r) {
      e.value(t);
      return;
    }
    try {
      e.value(t);
    } catch (n) {
      r(n);
    }
  }
  _deliverQueue(e) {
    let t = e.current._listeners;
    for (; e.i < e.end; ) this._deliver(t[e.i++], e.value);
    e.reset();
  }
  fire(e) {
    var t, s, r, n;
    if ((t = this._deliveryQueue) != null && t.current && (this._deliverQueue(this._deliveryQueue), (s = this._perfMon) == null || s.stop()), (r = this._perfMon) == null || r.start(this._size), this._listeners) if (this._listeners instanceof on) this._deliver(this._listeners, e);
    else {
      let o = this._deliveryQueue;
      o.enqueue(this, e, this._listeners.length), this._deliverQueue(o);
    }
    (n = this._perfMon) == null || n.stop();
  }
  hasListeners() {
    return this._size > 0;
  }
}, dp = class {
  constructor() {
    this.i = -1, this.end = 0;
  }
  enqueue(e, t, s) {
    this.i = 0, this.end = s, this.current = e, this.value = t;
  }
  reset() {
    this.i = this.end, this.current = void 0, this.value = void 0;
  }
}, ll = { texturePage: 0, texturePosition: { x: 0, y: 0 }, texturePositionClipSpace: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, size: { x: 0, y: 0 }, sizeClipSpace: { x: 0, y: 0 } }, Rs = 2, Ts, Mi = class hs {
  constructor(t, s, r) {
    this._document = t, this._config = s, this._unicodeService = r, this._didWarmUp = !1, this._cacheMap = new al(), this._cacheMapCombined = new al(), this._pages = [], this._activePages = [], this._workBoundingBox = { top: 0, left: 0, bottom: 0, right: 0 }, this._workAttributeData = new us(), this._textureSize = 512, this._onAddTextureAtlasCanvas = new Be(), this.onAddTextureAtlasCanvas = this._onAddTextureAtlasCanvas.event, this._onRemoveTextureAtlasCanvas = new Be(), this.onRemoveTextureAtlasCanvas = this._onRemoveTextureAtlasCanvas.event, this._requestClearModel = !1, this._createNewPage(), this._tmpCanvas = sc(t, this._config.deviceCellWidth * 4 + Rs * 2, this._config.deviceCellHeight + Rs * 2), this._tmpCtx = Ve(this._tmpCanvas.getContext("2d", { alpha: this._config.allowTransparency, willReadFrequently: !0 }));
  }
  get pages() {
    return this._pages;
  }
  dispose() {
    this._tmpCanvas.remove();
    for (let t of this.pages) t.canvas.remove();
    this._onAddTextureAtlasCanvas.dispose();
  }
  warmUp() {
    this._didWarmUp || (this._doWarmUp(), this._didWarmUp = !0);
  }
  _doWarmUp() {
    let t = new ep();
    for (let s = 33; s < 126; s++) t.enqueue(() => {
      if (!this._cacheMap.get(s, 0, 0, 0)) {
        let r = this._drawToCache(s, 0, 0, 0, !1, void 0);
        this._cacheMap.set(s, 0, 0, 0, r);
      }
    });
  }
  beginFrame() {
    return this._requestClearModel;
  }
  clearTexture() {
    if (!(this._pages[0].currentRow.x === 0 && this._pages[0].currentRow.y === 0)) {
      for (let t of this._pages) t.clear();
      this._cacheMap.clear(), this._cacheMapCombined.clear(), this._didWarmUp = !1;
    }
  }
  _createNewPage() {
    if (hs.maxAtlasPages && this._pages.length >= Math.max(4, hs.maxAtlasPages)) {
      let s = this._pages.filter((h) => h.canvas.width * 2 <= (hs.maxTextureSize || 4096)).sort((h, d) => d.canvas.width !== h.canvas.width ? d.canvas.width - h.canvas.width : d.percentageUsed - h.percentageUsed), r = -1, n = 0;
      for (let h = 0; h < s.length; h++) if (s[h].canvas.width !== n) r = h, n = s[h].canvas.width;
      else if (h - r === 3) break;
      let o = s.slice(r, r + 4), a = o.map((h) => h.glyphs[0].texturePage).sort((h, d) => h > d ? 1 : -1), l = this.pages.length - o.length, c = this._mergePages(o, l);
      c.version++;
      for (let h = a.length - 1; h >= 0; h--) this._deletePage(a[h]);
      this.pages.push(c), this._requestClearModel = !0, this._onAddTextureAtlasCanvas.fire(c.canvas);
    }
    let t = new an(this._document, this._textureSize);
    return this._pages.push(t), this._activePages.push(t), this._onAddTextureAtlasCanvas.fire(t.canvas), t;
  }
  _mergePages(t, s) {
    let r = t[0].canvas.width * 2, n = new an(this._document, r, t);
    for (let [o, a] of t.entries()) {
      let l = o * a.canvas.width % r, c = Math.floor(o / 2) * a.canvas.height;
      n.ctx.drawImage(a.canvas, l, c);
      for (let d of a.glyphs) d.texturePage = s, d.sizeClipSpace.x = d.size.x / r, d.sizeClipSpace.y = d.size.y / r, d.texturePosition.x += l, d.texturePosition.y += c, d.texturePositionClipSpace.x = d.texturePosition.x / r, d.texturePositionClipSpace.y = d.texturePosition.y / r;
      this._onRemoveTextureAtlasCanvas.fire(a.canvas);
      let h = this._activePages.indexOf(a);
      h !== -1 && this._activePages.splice(h, 1);
    }
    return n;
  }
  _deletePage(t) {
    this._pages.splice(t, 1);
    for (let s = t; s < this._pages.length; s++) {
      let r = this._pages[s];
      for (let n of r.glyphs) n.texturePage--;
      r.version++;
    }
  }
  getRasterizedGlyphCombinedChar(t, s, r, n, o, a) {
    return this._getFromCacheMap(this._cacheMapCombined, t, s, r, n, o, a);
  }
  getRasterizedGlyph(t, s, r, n, o, a) {
    return this._getFromCacheMap(this._cacheMap, t, s, r, n, o, a);
  }
  _getFromCacheMap(t, s, r, n, o, a, l) {
    return Ts = t.get(s, r, n, o), Ts || (Ts = this._drawToCache(s, r, n, o, a, l), t.set(s, r, n, o, Ts)), Ts;
  }
  _getColorFromAnsiIndex(t) {
    if (t >= this._config.colors.ansi.length) throw new Error("No color found for idx " + t);
    return this._config.colors.ansi[t];
  }
  _getBackgroundColor(t, s, r, n) {
    if (this._config.allowTransparency) return Dt;
    let o;
    switch (t) {
      case 16777216:
      case 33554432:
        o = this._getColorFromAnsiIndex(s);
        break;
      case 50331648:
        let a = us.toColorRGB(s);
        o = ut.toColor(a[0], a[1], a[2]);
        break;
      case 0:
      default:
        r ? o = ds.opaque(this._config.colors.foreground) : o = this._config.colors.background;
        break;
    }
    return this._config.allowTransparency || (o = ds.opaque(o)), o;
  }
  _getForegroundColor(t, s, r, n, o, a, l, c, h, d) {
    let u = this._getMinimumContrastColor(t, s, r, n, o, a, l, h, c, d);
    if (u) return u;
    let f;
    switch (o) {
      case 16777216:
      case 33554432:
        this._config.drawBoldTextInBrightColors && h && a < 8 && (a += 8), f = this._getColorFromAnsiIndex(a);
        break;
      case 50331648:
        let _ = us.toColorRGB(a);
        f = ut.toColor(_[0], _[1], _[2]);
        break;
      case 0:
      default:
        l ? f = this._config.colors.background : f = this._config.colors.foreground;
    }
    return this._config.allowTransparency && (f = ds.opaque(f)), c && (f = ds.multiplyOpacity(f, Uf)), f;
  }
  _resolveBackgroundRgba(t, s, r) {
    switch (t) {
      case 16777216:
      case 33554432:
        return this._getColorFromAnsiIndex(s).rgba;
      case 50331648:
        return s << 8;
      case 0:
      default:
        return r ? this._config.colors.foreground.rgba : this._config.colors.background.rgba;
    }
  }
  _resolveForegroundRgba(t, s, r, n) {
    switch (t) {
      case 16777216:
      case 33554432:
        return this._config.drawBoldTextInBrightColors && n && s < 8 && (s += 8), this._getColorFromAnsiIndex(s).rgba;
      case 50331648:
        return s << 8;
      case 0:
      default:
        return r ? this._config.colors.background.rgba : this._config.colors.foreground.rgba;
    }
  }
  _getMinimumContrastColor(t, s, r, n, o, a, l, c, h, d) {
    if (this._config.minimumContrastRatio === 1 || d) return;
    let u = this._getContrastCache(h), f = u.getColor(t, n);
    if (f !== void 0) return f || void 0;
    let _ = this._resolveBackgroundRgba(s, r, l), g = this._resolveForegroundRgba(o, a, l, c), y = Pi.ensureContrastRatio(_, g, this._config.minimumContrastRatio / (h ? 2 : 1));
    if (!y) {
      u.setColor(t, n, null);
      return;
    }
    let D = ut.toColor(y >> 24 & 255, y >> 16 & 255, y >> 8 & 255);
    return u.setColor(t, n, D), D;
  }
  _getContrastCache(t) {
    return t ? this._config.colors.halfContrastCache : this._config.colors.contrastCache;
  }
  _drawToCache(t, s, r, n, o, a) {
    let l = typeof t == "number" ? String.fromCharCode(t) : t;
    a && this._tmpCanvas.parentElement !== a && (this._tmpCanvas.style.display = "none", a.append(this._tmpCanvas));
    let c = Math.min(this._config.deviceCellWidth * Math.max(l.length, 2) + Rs * 2, this._config.deviceMaxTextureSize);
    this._tmpCanvas.width < c && (this._tmpCanvas.width = c);
    let h = Math.min(this._config.deviceCellHeight + Rs * 4, this._textureSize);
    if (this._tmpCanvas.height < h && (this._tmpCanvas.height = h), this._tmpCtx.save(), this._workAttributeData.fg = r, this._workAttributeData.bg = s, this._workAttributeData.extended.ext = n, !!this._workAttributeData.isInvisible()) return ll;
    let d = !!this._workAttributeData.isBold(), u = !!this._workAttributeData.isInverse(), f = !!this._workAttributeData.isDim(), _ = !!this._workAttributeData.isItalic(), g = !!this._workAttributeData.isUnderline(), y = !!this._workAttributeData.isStrikethrough(), D = !!this._workAttributeData.isOverline(), R = this._workAttributeData.getFgColor(), H = this._workAttributeData.getFgColorMode(), M = this._workAttributeData.getBgColor(), k = this._workAttributeData.getBgColorMode();
    if (u) {
      let I = R;
      R = M, M = I;
      let se = H;
      H = k, k = se;
    }
    let B = this._getBackgroundColor(k, M, u, f);
    this._tmpCtx.globalCompositeOperation = "copy", this._tmpCtx.fillStyle = B.css, this._tmpCtx.fillRect(0, 0, this._tmpCanvas.width, this._tmpCanvas.height), this._tmpCtx.globalCompositeOperation = "source-over";
    let N = d ? this._config.fontWeightBold : this._config.fontWeight, U = _ ? "italic" : "";
    this._tmpCtx.font = `${U} ${N} ${this._config.fontSize * this._config.devicePixelRatio}px ${this._config.fontFamily}`, this._tmpCtx.textBaseline = qh;
    let ie = l.length === 1 && Io(l.charCodeAt(0)), Z = l.length === 1 && Nf(l.charCodeAt(0)), _e = this._getForegroundColor(s, k, M, r, H, R, u, f, d, Vh(l.charCodeAt(0)));
    this._tmpCtx.fillStyle = _e.css;
    let Y = Z ? 0 : Rs * 2, v = !1;
    this._config.customGlyphs !== !1 && (v = Yf(this._tmpCtx, l, Y, Y, this._config.deviceCellWidth, this._config.deviceCellHeight, this._config.fontSize, this._config.devicePixelRatio));
    let p = !ie, w;
    if (typeof t == "number" ? w = this._unicodeService.wcwidth(t) : w = this._unicodeService.getStringCellWidth(t), g) {
      this._tmpCtx.save();
      let I = Math.max(1, Math.floor(this._config.fontSize * this._config.devicePixelRatio / 15)), se = I % 2 === 1 ? 0.5 : 0;
      if (this._tmpCtx.lineWidth = I, this._workAttributeData.isUnderlineColorDefault()) this._tmpCtx.strokeStyle = this._tmpCtx.fillStyle;
      else if (this._workAttributeData.isUnderlineColorRGB()) p = !1, this._tmpCtx.strokeStyle = `rgb(${us.toColorRGB(this._workAttributeData.getUnderlineColor()).join(",")})`;
      else {
        p = !1;
        let be = this._workAttributeData.getUnderlineColor();
        this._config.drawBoldTextInBrightColors && this._workAttributeData.isBold() && be < 8 && (be += 8), this._tmpCtx.strokeStyle = this._getColorFromAnsiIndex(be).css;
      }
      this._tmpCtx.beginPath();
      let he = Y, re = Math.ceil(Y + this._config.deviceCharHeight) - se - (o ? I * 2 : 0), ce = re + I, pe = re + I * 2, ge = this._workAttributeData.getUnderlineVariantOffset();
      for (let be = 0; be < w; be++) {
        this._tmpCtx.save();
        let fe = he + be * this._config.deviceCellWidth, ye = he + (be + 1) * this._config.deviceCellWidth, ee = fe + this._config.deviceCellWidth / 2;
        switch (this._workAttributeData.extended.underlineStyle) {
          case 2:
            this._tmpCtx.moveTo(fe, re), this._tmpCtx.lineTo(ye, re), this._tmpCtx.moveTo(fe, pe), this._tmpCtx.lineTo(ye, pe);
            break;
          case 3:
            let ve = I <= 1 ? pe : Math.ceil(Y + this._config.deviceCharHeight - I / 2) - se, le = I <= 1 ? re : Math.ceil(Y + this._config.deviceCharHeight + I / 2) - se, j = new Path2D();
            j.rect(fe, re, this._config.deviceCellWidth, pe - re), this._tmpCtx.clip(j), this._tmpCtx.moveTo(fe - this._config.deviceCellWidth / 2, ce), this._tmpCtx.bezierCurveTo(fe - this._config.deviceCellWidth / 2, le, fe, le, fe, ce), this._tmpCtx.bezierCurveTo(fe, ve, ee, ve, ee, ce), this._tmpCtx.bezierCurveTo(ee, le, ye, le, ye, ce), this._tmpCtx.bezierCurveTo(ye, ve, ye + this._config.deviceCellWidth / 2, ve, ye + this._config.deviceCellWidth / 2, ce);
            break;
          case 4:
            let G = ge === 0 ? 0 : ge >= I ? I * 2 - ge : I - ge;
            ge >= I || G === 0 ? (this._tmpCtx.setLineDash([Math.round(I), Math.round(I)]), this._tmpCtx.moveTo(fe + G, re), this._tmpCtx.lineTo(ye, re)) : (this._tmpCtx.setLineDash([Math.round(I), Math.round(I)]), this._tmpCtx.moveTo(fe, re), this._tmpCtx.lineTo(fe + G, re), this._tmpCtx.moveTo(fe + G + I, re), this._tmpCtx.lineTo(ye, re)), ge = $f(ye - fe, I, ge);
            break;
          case 5:
            let Ce = 0.6, Oe = 0.3, St = ye - fe, T = Math.floor(Ce * St), q = Math.floor(Oe * St), te = St - T - q;
            this._tmpCtx.setLineDash([T, q, te]), this._tmpCtx.moveTo(fe, re), this._tmpCtx.lineTo(ye, re);
            break;
          case 1:
          default:
            this._tmpCtx.moveTo(fe, re), this._tmpCtx.lineTo(ye, re);
            break;
        }
        this._tmpCtx.stroke(), this._tmpCtx.restore();
      }
      if (this._tmpCtx.restore(), !v && this._config.fontSize >= 12 && !this._config.allowTransparency && l !== " ") {
        this._tmpCtx.save(), this._tmpCtx.textBaseline = "alphabetic";
        let be = this._tmpCtx.measureText(l);
        if (this._tmpCtx.restore(), "actualBoundingBoxDescent" in be && be.actualBoundingBoxDescent > 0) {
          this._tmpCtx.save();
          let fe = new Path2D();
          fe.rect(he, re - Math.ceil(I / 2), this._config.deviceCellWidth * w, pe - re + Math.ceil(I / 2)), this._tmpCtx.clip(fe), this._tmpCtx.lineWidth = this._config.devicePixelRatio * 3, this._tmpCtx.strokeStyle = B.css, this._tmpCtx.strokeText(l, Y, Y + this._config.deviceCharHeight), this._tmpCtx.restore();
        }
      }
    }
    if (D) {
      let I = Math.max(1, Math.floor(this._config.fontSize * this._config.devicePixelRatio / 15)), se = I % 2 === 1 ? 0.5 : 0;
      this._tmpCtx.lineWidth = I, this._tmpCtx.strokeStyle = this._tmpCtx.fillStyle, this._tmpCtx.beginPath(), this._tmpCtx.moveTo(Y, Y + se), this._tmpCtx.lineTo(Y + this._config.deviceCharWidth * w, Y + se), this._tmpCtx.stroke();
    }
    if (v || this._tmpCtx.fillText(l, Y, Y + this._config.deviceCharHeight), l === "_" && !this._config.allowTransparency) {
      let I = ln(this._tmpCtx.getImageData(Y, Y, this._config.deviceCellWidth, this._config.deviceCellHeight), B, _e, p);
      if (I) for (let se = 1; se <= 5 && (this._tmpCtx.save(), this._tmpCtx.fillStyle = B.css, this._tmpCtx.fillRect(0, 0, this._tmpCanvas.width, this._tmpCanvas.height), this._tmpCtx.restore(), this._tmpCtx.fillText(l, Y, Y + this._config.deviceCharHeight - se), I = ln(this._tmpCtx.getImageData(Y, Y, this._config.deviceCellWidth, this._config.deviceCellHeight), B, _e, p), !!I); se++) ;
    }
    if (y) {
      let I = Math.max(1, Math.floor(this._config.fontSize * this._config.devicePixelRatio / 10)), se = this._tmpCtx.lineWidth % 2 === 1 ? 0.5 : 0;
      this._tmpCtx.lineWidth = I, this._tmpCtx.strokeStyle = this._tmpCtx.fillStyle, this._tmpCtx.beginPath(), this._tmpCtx.moveTo(Y, Y + Math.floor(this._config.deviceCharHeight / 2) - se), this._tmpCtx.lineTo(Y + this._config.deviceCharWidth * w, Y + Math.floor(this._config.deviceCharHeight / 2) - se), this._tmpCtx.stroke();
    }
    this._tmpCtx.restore();
    let m = this._tmpCtx.getImageData(0, 0, this._tmpCanvas.width, this._tmpCanvas.height), b;
    if (this._config.allowTransparency ? b = up(m) : b = ln(m, B, _e, p), b) return ll;
    let L = this._findGlyphBoundingBox(m, this._workBoundingBox, c, Z, v, Y), x, A;
    for (; ; ) {
      if (this._activePages.length === 0) {
        let I = this._createNewPage();
        x = I, A = I.currentRow, A.height = L.size.y;
        break;
      }
      x = this._activePages[this._activePages.length - 1], A = x.currentRow;
      for (let I of this._activePages) L.size.y <= I.currentRow.height && (x = I, A = I.currentRow);
      for (let I = this._activePages.length - 1; I >= 0; I--) for (let se of this._activePages[I].fixedRows) se.height <= A.height && L.size.y <= se.height && (x = this._activePages[I], A = se);
      if (L.size.x > this._textureSize) {
        this._overflowSizePage || (this._overflowSizePage = new an(this._document, this._config.deviceMaxTextureSize), this.pages.push(this._overflowSizePage), this._requestClearModel = !0, this._onAddTextureAtlasCanvas.fire(this._overflowSizePage.canvas)), x = this._overflowSizePage, A = this._overflowSizePage.currentRow, A.x + L.size.x >= x.canvas.width && (A.x = 0, A.y += A.height, A.height = 0);
        break;
      }
      if (A.y + L.size.y >= x.canvas.height || A.height > L.size.y + 2) {
        let I = !1;
        if (x.currentRow.y + x.currentRow.height + L.size.y >= x.canvas.height) {
          let se;
          for (let he of this._activePages) if (he.currentRow.y + he.currentRow.height + L.size.y < he.canvas.height) {
            se = he;
            break;
          }
          if (se) x = se;
          else if (hs.maxAtlasPages && this._pages.length >= hs.maxAtlasPages && A.y + L.size.y <= x.canvas.height && A.height >= L.size.y && A.x + L.size.x <= x.canvas.width) I = !0;
          else {
            let he = this._createNewPage();
            x = he, A = he.currentRow, A.height = L.size.y, I = !0;
          }
        }
        I || (x.currentRow.height > 0 && x.fixedRows.push(x.currentRow), A = { x: 0, y: x.currentRow.y + x.currentRow.height, height: L.size.y }, x.fixedRows.push(A), x.currentRow = { x: 0, y: A.y + A.height, height: 0 });
      }
      if (A.x + L.size.x <= x.canvas.width) break;
      A === x.currentRow ? (A.x = 0, A.y += A.height, A.height = 0) : x.fixedRows.splice(x.fixedRows.indexOf(A), 1);
    }
    return L.texturePage = this._pages.indexOf(x), L.texturePosition.x = A.x, L.texturePosition.y = A.y, L.texturePositionClipSpace.x = A.x / x.canvas.width, L.texturePositionClipSpace.y = A.y / x.canvas.height, L.sizeClipSpace.x /= x.canvas.width, L.sizeClipSpace.y /= x.canvas.height, A.height = Math.max(A.height, L.size.y), A.x += L.size.x, x.ctx.putImageData(m, L.texturePosition.x - this._workBoundingBox.left, L.texturePosition.y - this._workBoundingBox.top, this._workBoundingBox.left, this._workBoundingBox.top, L.size.x, L.size.y), x.addGlyph(L), x.version++, L;
  }
  _findGlyphBoundingBox(t, s, r, n, o, a) {
    s.top = 0;
    let l = n ? this._config.deviceCellHeight : this._tmpCanvas.height, c = n ? this._config.deviceCellWidth : r, h = !1;
    for (let d = 0; d < l; d++) {
      for (let u = 0; u < c; u++) {
        let f = d * this._tmpCanvas.width * 4 + u * 4 + 3;
        if (t.data[f] !== 0) {
          s.top = d, h = !0;
          break;
        }
      }
      if (h) break;
    }
    s.left = 0, h = !1;
    for (let d = 0; d < a + c; d++) {
      for (let u = 0; u < l; u++) {
        let f = u * this._tmpCanvas.width * 4 + d * 4 + 3;
        if (t.data[f] !== 0) {
          s.left = d, h = !0;
          break;
        }
      }
      if (h) break;
    }
    s.right = c, h = !1;
    for (let d = a + c - 1; d >= a; d--) {
      for (let u = 0; u < l; u++) {
        let f = u * this._tmpCanvas.width * 4 + d * 4 + 3;
        if (t.data[f] !== 0) {
          s.right = d, h = !0;
          break;
        }
      }
      if (h) break;
    }
    s.bottom = l, h = !1;
    for (let d = l - 1; d >= 0; d--) {
      for (let u = 0; u < c; u++) {
        let f = d * this._tmpCanvas.width * 4 + u * 4 + 3;
        if (t.data[f] !== 0) {
          s.bottom = d, h = !0;
          break;
        }
      }
      if (h) break;
    }
    return { texturePage: 0, texturePosition: { x: 0, y: 0 }, texturePositionClipSpace: { x: 0, y: 0 }, size: { x: s.right - s.left + 1, y: s.bottom - s.top + 1 }, sizeClipSpace: { x: s.right - s.left + 1, y: s.bottom - s.top + 1 }, offset: { x: -s.left + a + (n || o ? Math.floor((this._config.deviceCellWidth - this._config.deviceCharWidth) / 2) : 0), y: -s.top + a + (n || o ? this._config.lineHeight === 1 ? 0 : Math.round((this._config.deviceCellHeight - this._config.deviceCharHeight) / 2) : 0) } };
  }
}, an = class {
  constructor(e, t, s) {
    if (this._usedPixels = 0, this._glyphs = [], this.version = 0, this.currentRow = { x: 0, y: 0, height: 0 }, this.fixedRows = [], s) for (let r of s) this._glyphs.push(...r.glyphs), this._usedPixels += r._usedPixels;
    this.canvas = sc(e, t, t), this.ctx = Ve(this.canvas.getContext("2d", { alpha: !0 }));
  }
  get percentageUsed() {
    return this._usedPixels / (this.canvas.width * this.canvas.height);
  }
  get glyphs() {
    return this._glyphs;
  }
  addGlyph(e) {
    this._glyphs.push(e), this._usedPixels += e.size.x * e.size.y;
  }
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height), this.currentRow.x = 0, this.currentRow.y = 0, this.currentRow.height = 0, this.fixedRows.length = 0, this.version++;
  }
};
function ln(e, t, s, r) {
  let n = t.rgba >>> 24, o = t.rgba >>> 16 & 255, a = t.rgba >>> 8 & 255, l = s.rgba >>> 24, c = s.rgba >>> 16 & 255, h = s.rgba >>> 8 & 255, d = Math.floor((Math.abs(n - l) + Math.abs(o - c) + Math.abs(a - h)) / 12), u = !0;
  for (let f = 0; f < e.data.length; f += 4) e.data[f] === n && e.data[f + 1] === o && e.data[f + 2] === a || r && Math.abs(e.data[f] - n) + Math.abs(e.data[f + 1] - o) + Math.abs(e.data[f + 2] - a) < d ? e.data[f + 3] = 0 : u = !1;
  return u;
}
function up(e) {
  for (let t = 0; t < e.data.length; t += 4) if (e.data[t + 3] > 0) return !1;
  return !0;
}
function sc(e, t, s) {
  let r = e.createElement("canvas");
  return r.width = t, r.height = s, r;
}
function _p(e, t, s, r, n, o, a, l) {
  let c = { foreground: o.foreground, background: o.background, cursor: Dt, cursorAccent: Dt, selectionForeground: Dt, selectionBackgroundTransparent: Dt, selectionBackgroundOpaque: Dt, selectionInactiveBackgroundTransparent: Dt, selectionInactiveBackgroundOpaque: Dt, overviewRulerBorder: Dt, scrollbarSliderBackground: Dt, scrollbarSliderHoverBackground: Dt, scrollbarSliderActiveBackground: Dt, ansi: o.ansi.slice(), contrastCache: o.contrastCache, halfContrastCache: o.halfContrastCache };
  return { customGlyphs: n.customGlyphs, devicePixelRatio: a, deviceMaxTextureSize: l, letterSpacing: n.letterSpacing, lineHeight: n.lineHeight, deviceCellWidth: e, deviceCellHeight: t, deviceCharWidth: s, deviceCharHeight: r, fontFamily: n.fontFamily, fontSize: n.fontSize, fontWeight: n.fontWeight, fontWeightBold: n.fontWeightBold, allowTransparency: n.allowTransparency, drawBoldTextInBrightColors: n.drawBoldTextInBrightColors, minimumContrastRatio: n.minimumContrastRatio, colors: c };
}
function hl(e, t) {
  for (let s = 0; s < e.colors.ansi.length; s++) if (e.colors.ansi[s].rgba !== t.colors.ansi[s].rgba) return !1;
  return e.devicePixelRatio === t.devicePixelRatio && e.customGlyphs === t.customGlyphs && e.lineHeight === t.lineHeight && e.letterSpacing === t.letterSpacing && e.fontFamily === t.fontFamily && e.fontSize === t.fontSize && e.fontWeight === t.fontWeight && e.fontWeightBold === t.fontWeightBold && e.allowTransparency === t.allowTransparency && e.deviceCharWidth === t.deviceCharWidth && e.deviceCharHeight === t.deviceCharHeight && e.drawBoldTextInBrightColors === t.drawBoldTextInBrightColors && e.minimumContrastRatio === t.minimumContrastRatio && e.colors.foreground.rgba === t.colors.foreground.rgba && e.colors.background.rgba === t.colors.background.rgba;
}
function fp(e) {
  return (e & 50331648) === 16777216 || (e & 50331648) === 33554432;
}
var At = [];
function rc(e, t, s, r, n, o, a, l, c) {
  let h = _p(r, n, o, a, t, s, l, c);
  for (let f = 0; f < At.length; f++) {
    let _ = At[f], g = _.ownedBy.indexOf(e);
    if (g >= 0) {
      if (hl(_.config, h)) return _.atlas;
      _.ownedBy.length === 1 ? (_.atlas.dispose(), At.splice(f, 1)) : _.ownedBy.splice(g, 1);
      break;
    }
  }
  for (let f = 0; f < At.length; f++) {
    let _ = At[f];
    if (hl(_.config, h)) return _.ownedBy.push(e), _.atlas;
  }
  let d = e._core, u = { atlas: new Mi(document, h, d.unicodeService), config: h, ownedBy: [e] };
  return At.push(u), u.atlas;
}
function cl(e) {
  for (let t = 0; t < At.length; t++) {
    let s = At[t].ownedBy.indexOf(e);
    if (s !== -1) {
      At[t].ownedBy.length === 1 ? (At[t].atlas.dispose(), At.splice(t, 1)) : At[t].ownedBy.splice(s, 1);
      break;
    }
  }
}
var cr = 600, pp = class {
  constructor(e, t) {
    this._renderCallback = e, this._coreBrowserService = t, this.isCursorVisible = !0, this._coreBrowserService.isFocused && this._restartInterval();
  }
  get isPaused() {
    return !(this._blinkStartTimeout || this._blinkInterval);
  }
  dispose() {
    this._blinkInterval && (this._coreBrowserService.window.clearInterval(this._blinkInterval), this._blinkInterval = void 0), this._blinkStartTimeout && (this._coreBrowserService.window.clearTimeout(this._blinkStartTimeout), this._blinkStartTimeout = void 0), this._animationFrame && (this._coreBrowserService.window.cancelAnimationFrame(this._animationFrame), this._animationFrame = void 0);
  }
  restartBlinkAnimation() {
    this.isPaused || (this._animationTimeRestarted = Date.now(), this.isCursorVisible = !0, this._animationFrame || (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
      this._renderCallback(), this._animationFrame = void 0;
    })));
  }
  _restartInterval(e = cr) {
    this._blinkInterval && (this._coreBrowserService.window.clearInterval(this._blinkInterval), this._blinkInterval = void 0), this._blinkStartTimeout = this._coreBrowserService.window.setTimeout(() => {
      if (this._animationTimeRestarted) {
        let t = cr - (Date.now() - this._animationTimeRestarted);
        if (this._animationTimeRestarted = void 0, t > 0) {
          this._restartInterval(t);
          return;
        }
      }
      this.isCursorVisible = !1, this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
        this._renderCallback(), this._animationFrame = void 0;
      }), this._blinkInterval = this._coreBrowserService.window.setInterval(() => {
        if (this._animationTimeRestarted) {
          let t = cr - (Date.now() - this._animationTimeRestarted);
          this._animationTimeRestarted = void 0, this._restartInterval(t);
          return;
        }
        this.isCursorVisible = !this.isCursorVisible, this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
          this._renderCallback(), this._animationFrame = void 0;
        });
      }, cr);
    }, e);
  }
  pause() {
    this.isCursorVisible = !0, this._blinkInterval && (this._coreBrowserService.window.clearInterval(this._blinkInterval), this._blinkInterval = void 0), this._blinkStartTimeout && (this._coreBrowserService.window.clearTimeout(this._blinkStartTimeout), this._blinkStartTimeout = void 0), this._animationFrame && (this._coreBrowserService.window.cancelAnimationFrame(this._animationFrame), this._animationFrame = void 0);
  }
  resume() {
    this.pause(), this._animationTimeRestarted = void 0, this._restartInterval(), this.restartBlinkAnimation();
  }
};
function dl(e, t, s) {
  let r = new t.ResizeObserver((n) => {
    let o = n.find((c) => c.target === e);
    if (!o) return;
    if (!("devicePixelContentBoxSize" in o)) {
      r == null || r.disconnect(), r = void 0;
      return;
    }
    let a = o.devicePixelContentBoxSize[0].inlineSize, l = o.devicePixelContentBoxSize[0].blockSize;
    a > 0 && l > 0 && s(a, l);
  });
  try {
    r.observe(e, { box: ["device-pixel-content-box"] });
  } catch {
    r.disconnect(), r = void 0;
  }
  return _t(() => r == null ? void 0 : r.disconnect());
}
function gp(e) {
  return e > 65535 ? (e -= 65536, String.fromCharCode((e >> 10) + 55296) + String.fromCharCode(e % 1024 + 56320)) : String.fromCharCode(e);
}
var ul = class nc extends us {
  constructor() {
    super(...arguments), this.content = 0, this.fg = 0, this.bg = 0, this.extended = new Zh(), this.combinedData = "";
  }
  static fromCharData(t) {
    let s = new nc();
    return s.setFromCharData(t), s;
  }
  isCombined() {
    return this.content & 2097152;
  }
  getWidth() {
    return this.content >> 22;
  }
  getChars() {
    return this.content & 2097152 ? this.combinedData : this.content & 2097151 ? gp(this.content & 2097151) : "";
  }
  getCode() {
    return this.isCombined() ? this.combinedData.charCodeAt(this.combinedData.length - 1) : this.content & 2097151;
  }
  setFromCharData(t) {
    this.fg = t[0], this.bg = 0;
    let s = !1;
    if (t[1].length > 2) s = !0;
    else if (t[1].length === 2) {
      let r = t[1].charCodeAt(0);
      if (55296 <= r && r <= 56319) {
        let n = t[1].charCodeAt(1);
        56320 <= n && n <= 57343 ? this.content = (r - 55296) * 1024 + n - 56320 + 65536 | t[2] << 22 : s = !0;
      } else s = !0;
    } else this.content = t[1].charCodeAt(0) | t[2] << 22;
    s && (this.combinedData = t[1], this.content = 2097152 | t[2] << 22);
  }
  getAsCharData() {
    return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
  }
}, oc = new Float32Array([2, 0, 0, 0, 0, -2, 0, 0, 0, 0, 1, 0, -1, 1, 0, 1]);
function ac(e, t, s) {
  let r = Ve(e.createProgram());
  if (e.attachShader(r, Ve(_l(e, e.VERTEX_SHADER, t))), e.attachShader(r, Ve(_l(e, e.FRAGMENT_SHADER, s))), e.linkProgram(r), e.getProgramParameter(r, e.LINK_STATUS)) return r;
  console.error(e.getProgramInfoLog(r)), e.deleteProgram(r);
}
function _l(e, t, s) {
  let r = Ve(e.createShader(t));
  if (e.shaderSource(r, s), e.compileShader(r), e.getShaderParameter(r, e.COMPILE_STATUS)) return r;
  console.error(e.getShaderInfoLog(r)), e.deleteShader(r);
}
function vp(e, t) {
  let s = Math.min(e.length * 2, t), r = new Float32Array(s);
  for (let n = 0; n < e.length; n++) r[n] = e[n];
  return r;
}
var mp = class {
  constructor(e) {
    this.texture = e, this.version = -1;
  }
}, wp = `#version 300 es
layout (location = 0) in vec2 a_unitquad;
layout (location = 1) in vec2 a_cellpos;
layout (location = 2) in vec2 a_offset;
layout (location = 3) in vec2 a_size;
layout (location = 4) in float a_texpage;
layout (location = 5) in vec2 a_texcoord;
layout (location = 6) in vec2 a_texsize;

uniform mat4 u_projection;
uniform vec2 u_resolution;

out vec2 v_texcoord;
flat out int v_texpage;

void main() {
  vec2 zeroToOne = (a_offset / u_resolution) + a_cellpos + (a_unitquad * a_size);
  gl_Position = u_projection * vec4(zeroToOne, 0.0, 1.0);
  v_texpage = int(a_texpage);
  v_texcoord = a_texcoord + a_unitquad * a_texsize;
}`;
function Sp(e) {
  let t = "";
  for (let s = 1; s < e; s++) t += ` else if (v_texpage == ${s}) { outColor = texture(u_texture[${s}], v_texcoord); }`;
  return `#version 300 es
precision lowp float;

in vec2 v_texcoord;
flat in int v_texpage;

uniform sampler2D u_texture[${e}];

out vec4 outColor;

void main() {
  if (v_texpage == 0) {
    outColor = texture(u_texture[0], v_texcoord);
  } ${t}
}`;
}
var Ei = 11, as = Ei * Float32Array.BYTES_PER_ELEMENT, bp = 2, Fe = 0, Te, hn = 0, Bs = 0, yp = class extends zt {
  constructor(e, t, s, r) {
    super(), this._terminal = e, this._gl = t, this._dimensions = s, this._optionsService = r, this._activeBuffer = 0, this._vertices = { count: 0, attributes: new Float32Array(0), attributesBuffers: [new Float32Array(0), new Float32Array(0)] };
    let n = this._gl;
    Mi.maxAtlasPages === void 0 && (Mi.maxAtlasPages = Math.min(32, Ve(n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS))), Mi.maxTextureSize = Ve(n.getParameter(n.MAX_TEXTURE_SIZE))), this._program = Ve(ac(n, wp, Sp(Mi.maxAtlasPages))), this._register(_t(() => n.deleteProgram(this._program))), this._projectionLocation = Ve(n.getUniformLocation(this._program, "u_projection")), this._resolutionLocation = Ve(n.getUniformLocation(this._program, "u_resolution")), this._textureLocation = Ve(n.getUniformLocation(this._program, "u_texture")), this._vertexArrayObject = n.createVertexArray(), n.bindVertexArray(this._vertexArrayObject);
    let o = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), a = n.createBuffer();
    this._register(_t(() => n.deleteBuffer(a))), n.bindBuffer(n.ARRAY_BUFFER, a), n.bufferData(n.ARRAY_BUFFER, o, n.STATIC_DRAW), n.enableVertexAttribArray(0), n.vertexAttribPointer(0, 2, this._gl.FLOAT, !1, 0, 0);
    let l = new Uint8Array([0, 1, 2, 3]), c = n.createBuffer();
    this._register(_t(() => n.deleteBuffer(c))), n.bindBuffer(n.ELEMENT_ARRAY_BUFFER, c), n.bufferData(n.ELEMENT_ARRAY_BUFFER, l, n.STATIC_DRAW), this._attributesBuffer = Ve(n.createBuffer()), this._register(_t(() => n.deleteBuffer(this._attributesBuffer))), n.bindBuffer(n.ARRAY_BUFFER, this._attributesBuffer), n.enableVertexAttribArray(2), n.vertexAttribPointer(2, 2, n.FLOAT, !1, as, 0), n.vertexAttribDivisor(2, 1), n.enableVertexAttribArray(3), n.vertexAttribPointer(3, 2, n.FLOAT, !1, as, 2 * Float32Array.BYTES_PER_ELEMENT), n.vertexAttribDivisor(3, 1), n.enableVertexAttribArray(4), n.vertexAttribPointer(4, 1, n.FLOAT, !1, as, 4 * Float32Array.BYTES_PER_ELEMENT), n.vertexAttribDivisor(4, 1), n.enableVertexAttribArray(5), n.vertexAttribPointer(5, 2, n.FLOAT, !1, as, 5 * Float32Array.BYTES_PER_ELEMENT), n.vertexAttribDivisor(5, 1), n.enableVertexAttribArray(6), n.vertexAttribPointer(6, 2, n.FLOAT, !1, as, 7 * Float32Array.BYTES_PER_ELEMENT), n.vertexAttribDivisor(6, 1), n.enableVertexAttribArray(1), n.vertexAttribPointer(1, 2, n.FLOAT, !1, as, 9 * Float32Array.BYTES_PER_ELEMENT), n.vertexAttribDivisor(1, 1), n.useProgram(this._program);
    let h = new Int32Array(Mi.maxAtlasPages);
    for (let d = 0; d < Mi.maxAtlasPages; d++) h[d] = d;
    n.uniform1iv(this._textureLocation, h), n.uniformMatrix4fv(this._projectionLocation, !1, oc), this._atlasTextures = [];
    for (let d = 0; d < Mi.maxAtlasPages; d++) {
      let u = new mp(Ve(n.createTexture()));
      this._register(_t(() => n.deleteTexture(u.texture))), n.activeTexture(n.TEXTURE0 + d), n.bindTexture(n.TEXTURE_2D, u.texture), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE), n.texImage2D(n.TEXTURE_2D, 0, n.RGBA, 1, 1, 0, n.RGBA, n.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])), this._atlasTextures[d] = u;
    }
    n.enable(n.BLEND), n.blendFunc(n.SRC_ALPHA, n.ONE_MINUS_SRC_ALPHA), this.handleResize();
  }
  beginFrame() {
    return this._atlas ? this._atlas.beginFrame() : !0;
  }
  updateCell(e, t, s, r, n, o, a, l, c) {
    this._updateCell(this._vertices.attributes, e, t, s, r, n, o, a, l, c);
  }
  _updateCell(e, t, s, r, n, o, a, l, c, h) {
    if (Fe = (s * this._terminal.cols + t) * Ei, r === 0 || r === void 0) {
      e.fill(0, Fe, Fe + Ei - 1 - bp);
      return;
    }
    this._atlas && (l && l.length > 1 ? Te = this._atlas.getRasterizedGlyphCombinedChar(l, n, o, a, !1, this._terminal.element) : Te = this._atlas.getRasterizedGlyph(r, n, o, a, !1, this._terminal.element), hn = Math.floor((this._dimensions.device.cell.width - this._dimensions.device.char.width) / 2), n !== h && Te.offset.x > hn ? (Bs = Te.offset.x - hn, e[Fe] = -(Te.offset.x - Bs) + this._dimensions.device.char.left, e[Fe + 1] = -Te.offset.y + this._dimensions.device.char.top, e[Fe + 2] = (Te.size.x - Bs) / this._dimensions.device.canvas.width, e[Fe + 3] = Te.size.y / this._dimensions.device.canvas.height, e[Fe + 4] = Te.texturePage, e[Fe + 5] = Te.texturePositionClipSpace.x + Bs / this._atlas.pages[Te.texturePage].canvas.width, e[Fe + 6] = Te.texturePositionClipSpace.y, e[Fe + 7] = Te.sizeClipSpace.x - Bs / this._atlas.pages[Te.texturePage].canvas.width, e[Fe + 8] = Te.sizeClipSpace.y) : (e[Fe] = -Te.offset.x + this._dimensions.device.char.left, e[Fe + 1] = -Te.offset.y + this._dimensions.device.char.top, e[Fe + 2] = Te.size.x / this._dimensions.device.canvas.width, e[Fe + 3] = Te.size.y / this._dimensions.device.canvas.height, e[Fe + 4] = Te.texturePage, e[Fe + 5] = Te.texturePositionClipSpace.x, e[Fe + 6] = Te.texturePositionClipSpace.y, e[Fe + 7] = Te.sizeClipSpace.x, e[Fe + 8] = Te.sizeClipSpace.y), this._optionsService.rawOptions.rescaleOverlappingGlyphs && zf(r, c, Te.size.x, this._dimensions.device.cell.width) && (e[Fe + 2] = (this._dimensions.device.cell.width - 1) / this._dimensions.device.canvas.width));
  }
  clear() {
    let e = this._terminal, t = e.cols * e.rows * Ei;
    this._vertices.count !== t ? this._vertices.attributes = new Float32Array(t) : this._vertices.attributes.fill(0);
    let s = 0;
    for (; s < this._vertices.attributesBuffers.length; s++) this._vertices.count !== t ? this._vertices.attributesBuffers[s] = new Float32Array(t) : this._vertices.attributesBuffers[s].fill(0);
    this._vertices.count = t, s = 0;
    for (let r = 0; r < e.rows; r++) for (let n = 0; n < e.cols; n++) this._vertices.attributes[s + 9] = n / e.cols, this._vertices.attributes[s + 10] = r / e.rows, s += Ei;
  }
  handleResize() {
    let e = this._gl;
    e.useProgram(this._program), e.viewport(0, 0, e.canvas.width, e.canvas.height), e.uniform2f(this._resolutionLocation, e.canvas.width, e.canvas.height), this.clear();
  }
  render(e) {
    if (!this._atlas) return;
    let t = this._gl;
    t.useProgram(this._program), t.bindVertexArray(this._vertexArrayObject), this._activeBuffer = (this._activeBuffer + 1) % 2;
    let s = this._vertices.attributesBuffers[this._activeBuffer], r = 0;
    for (let n = 0; n < e.lineLengths.length; n++) {
      let o = n * this._terminal.cols * Ei, a = this._vertices.attributes.subarray(o, o + e.lineLengths[n] * Ei);
      s.set(a, r), r += a.length;
    }
    t.bindBuffer(t.ARRAY_BUFFER, this._attributesBuffer), t.bufferData(t.ARRAY_BUFFER, s.subarray(0, r), t.STREAM_DRAW);
    for (let n = 0; n < this._atlas.pages.length; n++) this._atlas.pages[n].version !== this._atlasTextures[n].version && this._bindAtlasPageTexture(t, this._atlas, n);
    t.drawElementsInstanced(t.TRIANGLE_STRIP, 4, t.UNSIGNED_BYTE, 0, r / Ei);
  }
  setAtlas(e) {
    this._atlas = e;
    for (let t of this._atlasTextures) t.version = -1;
  }
  _bindAtlasPageTexture(e, t, s) {
    e.activeTexture(e.TEXTURE0 + s), e.bindTexture(e.TEXTURE_2D, this._atlasTextures[s].texture), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, t.pages[s].canvas), e.generateMipmap(e.TEXTURE_2D), this._atlasTextures[s].version = t.pages[s].version;
  }
  setDimensions(e) {
    this._dimensions = e;
  }
}, Cp = class {
  constructor() {
    this.clear();
  }
  clear() {
    this.hasSelection = !1, this.columnSelectMode = !1, this.viewportStartRow = 0, this.viewportEndRow = 0, this.viewportCappedStartRow = 0, this.viewportCappedEndRow = 0, this.startCol = 0, this.endCol = 0, this.selectionStart = void 0, this.selectionEnd = void 0;
  }
  update(e, t, s, r = !1) {
    if (this.selectionStart = t, this.selectionEnd = s, !t || !s || t[0] === s[0] && t[1] === s[1]) {
      this.clear();
      return;
    }
    let n = e.buffers.active.ydisp, o = t[1] - n, a = s[1] - n, l = Math.max(o, 0), c = Math.min(a, e.rows - 1);
    if (l >= e.rows || c < 0) {
      this.clear();
      return;
    }
    this.hasSelection = !0, this.columnSelectMode = r, this.viewportStartRow = o, this.viewportEndRow = a, this.viewportCappedStartRow = l, this.viewportCappedEndRow = c, this.startCol = t[0], this.endCol = s[0];
  }
  isCellSelected(e, t, s) {
    return this.hasSelection ? (s -= e.buffer.active.viewportY, this.columnSelectMode ? this.startCol <= this.endCol ? t >= this.startCol && s >= this.viewportCappedStartRow && t < this.endCol && s <= this.viewportCappedEndRow : t < this.startCol && s >= this.viewportCappedStartRow && t >= this.endCol && s <= this.viewportCappedEndRow : s > this.viewportStartRow && s < this.viewportEndRow || this.viewportStartRow === this.viewportEndRow && s === this.viewportStartRow && t >= this.startCol && t < this.endCol || this.viewportStartRow < this.viewportEndRow && s === this.viewportEndRow && t < this.endCol || this.viewportStartRow < this.viewportEndRow && s === this.viewportStartRow && t >= this.startCol) : !1;
  }
};
function xp() {
  return new Cp();
}
var Er = 4, vr = 1, mr = 2, cn = 3, kp = 2147483648, Lp = class {
  constructor() {
    this.cells = new Uint32Array(0), this.lineLengths = new Uint32Array(0), this.selection = xp();
  }
  resize(e, t) {
    let s = e * t * Er;
    s !== this.cells.length && (this.cells = new Uint32Array(s), this.lineLengths = new Uint32Array(t));
  }
  clear() {
    this.cells.fill(0, 0), this.lineLengths.fill(0, 0);
  }
}, Mp = `#version 300 es
layout (location = 0) in vec2 a_position;
layout (location = 1) in vec2 a_size;
layout (location = 2) in vec4 a_color;
layout (location = 3) in vec2 a_unitquad;

uniform mat4 u_projection;

out vec4 v_color;

void main() {
  vec2 zeroToOne = a_position + (a_unitquad * a_size);
  gl_Position = u_projection * vec4(zeroToOne, 0.0, 1.0);
  v_color = a_color;
}`, Ep = `#version 300 es
precision lowp float;

in vec4 v_color;

out vec4 outColor;

void main() {
  outColor = v_color;
}`, hi = 8, dn = hi * Float32Array.BYTES_PER_ELEMENT, Dp = 20 * hi, fl = class {
  constructor() {
    this.attributes = new Float32Array(Dp), this.count = 0;
  }
}, li = 0, pl = 0, gl = 0, vl = 0, ml = 0, wl = 0, Sl = 0, Rp = class extends zt {
  constructor(e, t, s, r) {
    super(), this._terminal = e, this._gl = t, this._dimensions = s, this._themeService = r, this._vertices = new fl(), this._verticesCursor = new fl();
    let n = this._gl;
    this._program = Ve(ac(n, Mp, Ep)), this._register(_t(() => n.deleteProgram(this._program))), this._projectionLocation = Ve(n.getUniformLocation(this._program, "u_projection")), this._vertexArrayObject = n.createVertexArray(), n.bindVertexArray(this._vertexArrayObject);
    let o = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), a = n.createBuffer();
    this._register(_t(() => n.deleteBuffer(a))), n.bindBuffer(n.ARRAY_BUFFER, a), n.bufferData(n.ARRAY_BUFFER, o, n.STATIC_DRAW), n.enableVertexAttribArray(3), n.vertexAttribPointer(3, 2, this._gl.FLOAT, !1, 0, 0);
    let l = new Uint8Array([0, 1, 2, 3]), c = n.createBuffer();
    this._register(_t(() => n.deleteBuffer(c))), n.bindBuffer(n.ELEMENT_ARRAY_BUFFER, c), n.bufferData(n.ELEMENT_ARRAY_BUFFER, l, n.STATIC_DRAW), this._attributesBuffer = Ve(n.createBuffer()), this._register(_t(() => n.deleteBuffer(this._attributesBuffer))), n.bindBuffer(n.ARRAY_BUFFER, this._attributesBuffer), n.enableVertexAttribArray(0), n.vertexAttribPointer(0, 2, n.FLOAT, !1, dn, 0), n.vertexAttribDivisor(0, 1), n.enableVertexAttribArray(1), n.vertexAttribPointer(1, 2, n.FLOAT, !1, dn, 2 * Float32Array.BYTES_PER_ELEMENT), n.vertexAttribDivisor(1, 1), n.enableVertexAttribArray(2), n.vertexAttribPointer(2, 4, n.FLOAT, !1, dn, 4 * Float32Array.BYTES_PER_ELEMENT), n.vertexAttribDivisor(2, 1), this._updateCachedColors(r.colors), this._register(this._themeService.onChangeColors((h) => {
      this._updateCachedColors(h), this._updateViewportRectangle();
    }));
  }
  renderBackgrounds() {
    this._renderVertices(this._vertices);
  }
  renderCursor() {
    this._renderVertices(this._verticesCursor);
  }
  _renderVertices(e) {
    let t = this._gl;
    t.useProgram(this._program), t.bindVertexArray(this._vertexArrayObject), t.uniformMatrix4fv(this._projectionLocation, !1, oc), t.bindBuffer(t.ARRAY_BUFFER, this._attributesBuffer), t.bufferData(t.ARRAY_BUFFER, e.attributes, t.DYNAMIC_DRAW), t.drawElementsInstanced(this._gl.TRIANGLE_STRIP, 4, t.UNSIGNED_BYTE, 0, e.count);
  }
  handleResize() {
    this._updateViewportRectangle();
  }
  setDimensions(e) {
    this._dimensions = e;
  }
  _updateCachedColors(e) {
    this._bgFloat = this._colorToFloat32Array(e.background), this._cursorFloat = this._colorToFloat32Array(e.cursor);
  }
  _updateViewportRectangle() {
    this._addRectangleFloat(this._vertices.attributes, 0, 0, 0, this._terminal.cols * this._dimensions.device.cell.width, this._terminal.rows * this._dimensions.device.cell.height, this._bgFloat);
  }
  updateBackgrounds(e) {
    let t = this._terminal, s = this._vertices, r = 1, n, o, a, l, c, h, d, u, f, _, g;
    for (n = 0; n < t.rows; n++) {
      for (a = -1, l = 0, c = 0, h = !1, o = 0; o < t.cols; o++) d = (n * t.cols + o) * Er, u = e.cells[d + vr], f = e.cells[d + mr], _ = !!(f & 67108864), (u !== l || f !== c && (h || _)) && ((l !== 0 || h && c !== 0) && (g = r++ * hi, this._updateRectangle(s, g, c, l, a, o, n)), a = o, l = u, c = f, h = _);
      (l !== 0 || h && c !== 0) && (g = r++ * hi, this._updateRectangle(s, g, c, l, a, t.cols, n));
    }
    s.count = r;
  }
  updateCursor(e) {
    let t = this._verticesCursor, s = e.cursor;
    if (!s || s.style === "block") {
      t.count = 0;
      return;
    }
    let r, n = 0;
    (s.style === "bar" || s.style === "outline") && (r = n++ * hi, this._addRectangleFloat(t.attributes, r, s.x * this._dimensions.device.cell.width, s.y * this._dimensions.device.cell.height, s.style === "bar" ? s.dpr * s.cursorWidth : s.dpr, this._dimensions.device.cell.height, this._cursorFloat)), (s.style === "underline" || s.style === "outline") && (r = n++ * hi, this._addRectangleFloat(t.attributes, r, s.x * this._dimensions.device.cell.width, (s.y + 1) * this._dimensions.device.cell.height - s.dpr, s.width * this._dimensions.device.cell.width, s.dpr, this._cursorFloat)), s.style === "outline" && (r = n++ * hi, this._addRectangleFloat(t.attributes, r, s.x * this._dimensions.device.cell.width, s.y * this._dimensions.device.cell.height, s.width * this._dimensions.device.cell.width, s.dpr, this._cursorFloat), r = n++ * hi, this._addRectangleFloat(t.attributes, r, (s.x + s.width) * this._dimensions.device.cell.width - s.dpr, s.y * this._dimensions.device.cell.height, s.dpr, this._dimensions.device.cell.height, this._cursorFloat)), t.count = n;
  }
  _updateRectangle(e, t, s, r, n, o, a) {
    if (s & 67108864) switch (s & 50331648) {
      case 16777216:
      case 33554432:
        li = this._themeService.colors.ansi[s & 255].rgba;
        break;
      case 50331648:
        li = (s & 16777215) << 8;
        break;
      case 0:
      default:
        li = this._themeService.colors.foreground.rgba;
    }
    else switch (r & 50331648) {
      case 16777216:
      case 33554432:
        li = this._themeService.colors.ansi[r & 255].rgba;
        break;
      case 50331648:
        li = (r & 16777215) << 8;
        break;
      case 0:
      default:
        li = this._themeService.colors.background.rgba;
    }
    e.attributes.length < t + 4 && (e.attributes = vp(e.attributes, this._terminal.rows * this._terminal.cols * hi)), pl = n * this._dimensions.device.cell.width, gl = a * this._dimensions.device.cell.height, vl = (li >> 24 & 255) / 255, ml = (li >> 16 & 255) / 255, wl = (li >> 8 & 255) / 255, Sl = 1, this._addRectangle(e.attributes, t, pl, gl, (o - n) * this._dimensions.device.cell.width, this._dimensions.device.cell.height, vl, ml, wl, Sl);
  }
  _addRectangle(e, t, s, r, n, o, a, l, c, h) {
    e[t] = s / this._dimensions.device.canvas.width, e[t + 1] = r / this._dimensions.device.canvas.height, e[t + 2] = n / this._dimensions.device.canvas.width, e[t + 3] = o / this._dimensions.device.canvas.height, e[t + 4] = a, e[t + 5] = l, e[t + 6] = c, e[t + 7] = h;
  }
  _addRectangleFloat(e, t, s, r, n, o, a) {
    e[t] = s / this._dimensions.device.canvas.width, e[t + 1] = r / this._dimensions.device.canvas.height, e[t + 2] = n / this._dimensions.device.canvas.width, e[t + 3] = o / this._dimensions.device.canvas.height, e[t + 4] = a[0], e[t + 5] = a[1], e[t + 6] = a[2], e[t + 7] = a[3];
  }
  _colorToFloat32Array(e) {
    return new Float32Array([(e.rgba >> 24 & 255) / 255, (e.rgba >> 16 & 255) / 255, (e.rgba >> 8 & 255) / 255, (e.rgba & 255) / 255]);
  }
}, Tp = class extends zt {
  constructor(e, t, s, r, n, o, a, l) {
    super(), this._container = t, this._alpha = n, this._coreBrowserService = o, this._optionsService = a, this._themeService = l, this._deviceCharWidth = 0, this._deviceCharHeight = 0, this._deviceCellWidth = 0, this._deviceCellHeight = 0, this._deviceCharLeft = 0, this._deviceCharTop = 0, this._canvas = this._coreBrowserService.mainDocument.createElement("canvas"), this._canvas.classList.add(`xterm-${s}-layer`), this._canvas.style.zIndex = r.toString(), this._initCanvas(), this._container.appendChild(this._canvas), this._register(this._themeService.onChangeColors((c) => {
      this._refreshCharAtlas(e, c), this.reset(e);
    })), this._register(_t(() => {
      this._canvas.remove();
    }));
  }
  _initCanvas() {
    this._ctx = Ve(this._canvas.getContext("2d", { alpha: this._alpha })), this._alpha || this._clearAll();
  }
  handleBlur(e) {
  }
  handleFocus(e) {
  }
  handleCursorMove(e) {
  }
  handleGridChanged(e, t, s) {
  }
  handleSelectionChanged(e, t, s, r = !1) {
  }
  _setTransparency(e, t) {
    if (t === this._alpha) return;
    let s = this._canvas;
    this._alpha = t, this._canvas = this._canvas.cloneNode(), this._initCanvas(), this._container.replaceChild(this._canvas, s), this._refreshCharAtlas(e, this._themeService.colors), this.handleGridChanged(e, 0, e.rows - 1);
  }
  _refreshCharAtlas(e, t) {
    this._deviceCharWidth <= 0 && this._deviceCharHeight <= 0 || (this._charAtlas = rc(e, this._optionsService.rawOptions, t, this._deviceCellWidth, this._deviceCellHeight, this._deviceCharWidth, this._deviceCharHeight, this._coreBrowserService.dpr, 2048), this._charAtlas.warmUp());
  }
  resize(e, t) {
    this._deviceCellWidth = t.device.cell.width, this._deviceCellHeight = t.device.cell.height, this._deviceCharWidth = t.device.char.width, this._deviceCharHeight = t.device.char.height, this._deviceCharLeft = t.device.char.left, this._deviceCharTop = t.device.char.top, this._canvas.width = t.device.canvas.width, this._canvas.height = t.device.canvas.height, this._canvas.style.width = `${t.css.canvas.width}px`, this._canvas.style.height = `${t.css.canvas.height}px`, this._alpha || this._clearAll(), this._refreshCharAtlas(e, this._themeService.colors);
  }
  _fillBottomLineAtCells(e, t, s = 1) {
    this._ctx.fillRect(e * this._deviceCellWidth, (t + 1) * this._deviceCellHeight - this._coreBrowserService.dpr - 1, s * this._deviceCellWidth, this._coreBrowserService.dpr);
  }
  _clearAll() {
    this._alpha ? this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height) : (this._ctx.fillStyle = this._themeService.colors.background.css, this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height));
  }
  _clearCells(e, t, s, r) {
    this._alpha ? this._ctx.clearRect(e * this._deviceCellWidth, t * this._deviceCellHeight, s * this._deviceCellWidth, r * this._deviceCellHeight) : (this._ctx.fillStyle = this._themeService.colors.background.css, this._ctx.fillRect(e * this._deviceCellWidth, t * this._deviceCellHeight, s * this._deviceCellWidth, r * this._deviceCellHeight));
  }
  _fillCharTrueColor(e, t, s, r) {
    this._ctx.font = this._getFont(e, !1, !1), this._ctx.textBaseline = qh, this._clipCell(s, r, t.getWidth()), this._ctx.fillText(t.getChars(), s * this._deviceCellWidth + this._deviceCharLeft, r * this._deviceCellHeight + this._deviceCharTop + this._deviceCharHeight);
  }
  _clipCell(e, t, s) {
    this._ctx.beginPath(), this._ctx.rect(e * this._deviceCellWidth, t * this._deviceCellHeight, s * this._deviceCellWidth, this._deviceCellHeight), this._ctx.clip();
  }
  _getFont(e, t, s) {
    let r = t ? e.options.fontWeightBold : e.options.fontWeight;
    return `${s ? "italic" : ""} ${r} ${e.options.fontSize * this._coreBrowserService.dpr}px ${e.options.fontFamily}`;
  }
}, Bp = class extends Tp {
  constructor(e, t, s, r, n, o, a) {
    super(s, e, "link", t, !0, n, o, a), this._register(r.onShowLinkUnderline((l) => this._handleShowLinkUnderline(l))), this._register(r.onHideLinkUnderline((l) => this._handleHideLinkUnderline(l)));
  }
  resize(e, t) {
    super.resize(e, t), this._state = void 0;
  }
  reset(e) {
    this._clearCurrentLink();
  }
  _clearCurrentLink() {
    if (this._state) {
      this._clearCells(this._state.x1, this._state.y1, this._state.cols - this._state.x1, 1);
      let e = this._state.y2 - this._state.y1 - 1;
      e > 0 && this._clearCells(0, this._state.y1 + 1, this._state.cols, e), this._clearCells(0, this._state.y2, this._state.x2, 1), this._state = void 0;
    }
  }
  _handleShowLinkUnderline(e) {
    if (e.fg === 257 ? this._ctx.fillStyle = this._themeService.colors.background.css : e.fg !== void 0 && fp(e.fg) ? this._ctx.fillStyle = this._themeService.colors.ansi[e.fg].css : this._ctx.fillStyle = this._themeService.colors.foreground.css, e.y1 === e.y2) this._fillBottomLineAtCells(e.x1, e.y1, e.x2 - e.x1);
    else {
      this._fillBottomLineAtCells(e.x1, e.y1, e.cols - e.x1);
      for (let t = e.y1 + 1; t < e.y2; t++) this._fillBottomLineAtCells(0, t, e.cols);
      this._fillBottomLineAtCells(0, e.y2, e.x2);
    }
    this._state = e;
  }
  _handleHideLinkUnderline(e) {
    this._clearCurrentLink();
  }
}, Hi = typeof window == "object" ? window : globalThis, vo = class {
  constructor() {
    this.mapWindowIdToZoomLevel = /* @__PURE__ */ new Map(), this._onDidChangeZoomLevel = new Be(), this.onDidChangeZoomLevel = this._onDidChangeZoomLevel.event, this.mapWindowIdToZoomFactor = /* @__PURE__ */ new Map(), this._onDidChangeFullscreen = new Be(), this.onDidChangeFullscreen = this._onDidChangeFullscreen.event, this.mapWindowIdToFullScreen = /* @__PURE__ */ new Map();
  }
  getZoomLevel(e) {
    return this.mapWindowIdToZoomLevel.get(this.getWindowId(e)) ?? 0;
  }
  setZoomLevel(e, t) {
    if (this.getZoomLevel(t) === e) return;
    let s = this.getWindowId(t);
    this.mapWindowIdToZoomLevel.set(s, e), this._onDidChangeZoomLevel.fire(s);
  }
  getZoomFactor(e) {
    return this.mapWindowIdToZoomFactor.get(this.getWindowId(e)) ?? 1;
  }
  setZoomFactor(e, t) {
    this.mapWindowIdToZoomFactor.set(this.getWindowId(t), e);
  }
  setFullscreen(e, t) {
    if (this.isFullscreen(t) === e) return;
    let s = this.getWindowId(t);
    this.mapWindowIdToFullScreen.set(s, e), this._onDidChangeFullscreen.fire(s);
  }
  isFullscreen(e) {
    return !!this.mapWindowIdToFullScreen.get(this.getWindowId(e));
  }
  getWindowId(e) {
    return e.vscodeWindowId;
  }
};
vo.INSTANCE = new vo();
var lc = vo;
function Pp(e, t, s) {
  typeof t == "string" && (t = e.matchMedia(t)), t.addEventListener("change", s);
}
lc.INSTANCE.onDidChangeZoomLevel;
lc.INSTANCE.onDidChangeFullscreen;
var ws = typeof navigator == "object" ? navigator.userAgent : "";
ws.indexOf("Firefox") >= 0;
ws.indexOf("AppleWebKit") >= 0;
var Ap = ws.indexOf("Chrome") >= 0;
!Ap && ws.indexOf("Safari") >= 0;
ws.indexOf("Electron/") >= 0;
ws.indexOf("Android") >= 0;
var un = !1;
if (typeof Hi.matchMedia == "function") {
  let e = Hi.matchMedia("(display-mode: standalone) or (display-mode: window-controls-overlay)"), t = Hi.matchMedia("(display-mode: fullscreen)");
  un = e.matches, Pp(Hi, e, ({ matches: s }) => {
    un && t.matches || (un = s);
  });
}
var _s = "en", _n = !1, hc = !1, dr, wr = _s, bl = _s, Np, Kt, Vi = globalThis, gt, yl;
typeof Vi.vscode < "u" && typeof Vi.vscode.process < "u" ? gt = Vi.vscode.process : typeof process < "u" && typeof ((yl = process == null ? void 0 : process.versions) == null ? void 0 : yl.node) == "string" && (gt = process);
var Cl, Op = typeof ((Cl = gt == null ? void 0 : gt.versions) == null ? void 0 : Cl.electron) == "string", Ip = Op && (gt == null ? void 0 : gt.type) === "renderer", xl;
if (typeof gt == "object") {
  gt.platform, gt.platform, _n = gt.platform === "linux", _n && gt.env.SNAP && gt.env.SNAP_REVISION, gt.env.CI || gt.env.BUILD_ARTIFACTSTAGINGDIRECTORY, dr = _s, wr = _s;
  let e = gt.env.VSCODE_NLS_CONFIG;
  if (e) try {
    let t = JSON.parse(e);
    dr = t.userLocale, bl = t.osLocale, wr = t.resolvedLanguage || _s, Np = (xl = t.languagePack) == null ? void 0 : xl.translationsConfigFile;
  } catch {
  }
  hc = !0;
} else typeof navigator == "object" && !Ip ? (Kt = navigator.userAgent, Kt.indexOf("Windows") >= 0, Kt.indexOf("Macintosh") >= 0, (Kt.indexOf("Macintosh") >= 0 || Kt.indexOf("iPad") >= 0 || Kt.indexOf("iPhone") >= 0) && navigator.maxTouchPoints && navigator.maxTouchPoints > 0, _n = Kt.indexOf("Linux") >= 0, (Kt == null ? void 0 : Kt.indexOf("Mobi")) >= 0, wr = globalThis._VSCODE_NLS_LANGUAGE || _s, dr = navigator.language.toLowerCase(), bl = dr) : console.error("Unable to resolve platform.");
var kl = hc, Qt = Kt, ki = wr, Ll;
((e) => {
  function t() {
    return ki;
  }
  e.value = t;
  function s() {
    return ki.length === 2 ? ki === "en" : ki.length >= 3 ? ki[0] === "e" && ki[1] === "n" && ki[2] === "-" : !1;
  }
  e.isDefaultVariant = s;
  function r() {
    return ki === "en";
  }
  e.isDefault = r;
})(Ll || (Ll = {}));
var Fp = typeof Vi.postMessage == "function" && !Vi.importScripts;
(() => {
  if (Fp) {
    let e = [];
    Vi.addEventListener("message", (s) => {
      if (s.data && s.data.vscodeScheduleAsyncWork) for (let r = 0, n = e.length; r < n; r++) {
        let o = e[r];
        if (o.id === s.data.vscodeScheduleAsyncWork) {
          e.splice(r, 1), o.callback();
          return;
        }
      }
    });
    let t = 0;
    return (s) => {
      let r = ++t;
      e.push({ id: r, callback: s }), Vi.postMessage({ vscodeScheduleAsyncWork: r }, "*");
    };
  }
  return (e) => setTimeout(e);
})();
var zp = !!(Qt && Qt.indexOf("Chrome") >= 0);
Qt && Qt.indexOf("Firefox") >= 0;
!zp && Qt && Qt.indexOf("Safari") >= 0;
Qt && Qt.indexOf("Edg/") >= 0;
Qt && Qt.indexOf("Android") >= 0;
var ls = typeof navigator == "object" ? navigator : {};
kl || document.queryCommandSupported && document.queryCommandSupported("copy") || ls && ls.clipboard && ls.clipboard.writeText, kl || ls && ls.clipboard && ls.clipboard.readText;
var Fo = class {
  constructor() {
    this._keyCodeToStr = [], this._strToKeyCode = /* @__PURE__ */ Object.create(null);
  }
  define(e, t) {
    this._keyCodeToStr[e] = t, this._strToKeyCode[t.toLowerCase()] = e;
  }
  keyCodeToStr(e) {
    return this._keyCodeToStr[e];
  }
  strToKeyCode(e) {
    return this._strToKeyCode[e.toLowerCase()] || 0;
  }
}, fn = new Fo(), Ml = new Fo(), El = new Fo();
new Array(230);
var Dl;
((e) => {
  function t(l) {
    return fn.keyCodeToStr(l);
  }
  e.toString = t;
  function s(l) {
    return fn.strToKeyCode(l);
  }
  e.fromString = s;
  function r(l) {
    return Ml.keyCodeToStr(l);
  }
  e.toUserSettingsUS = r;
  function n(l) {
    return El.keyCodeToStr(l);
  }
  e.toUserSettingsGeneral = n;
  function o(l) {
    return Ml.strToKeyCode(l) || El.strToKeyCode(l);
  }
  e.fromUserSettings = o;
  function a(l) {
    if (l >= 98 && l <= 113) return null;
    switch (l) {
      case 16:
        return "Up";
      case 18:
        return "Down";
      case 15:
        return "Left";
      case 17:
        return "Right";
    }
    return fn.keyCodeToStr(l);
  }
  e.toElectronAccelerator = a;
})(Dl || (Dl = {}));
var cc = Object.freeze(function(e, t) {
  let s = setTimeout(e.bind(t), 0);
  return { dispose() {
    clearTimeout(s);
  } };
}), Rl;
((e) => {
  function t(s) {
    return s === e.None || s === e.Cancelled || s instanceof Wp ? !0 : !s || typeof s != "object" ? !1 : typeof s.isCancellationRequested == "boolean" && typeof s.onCancellationRequested == "function";
  }
  e.isCancellationToken = t, e.None = Object.freeze({ isCancellationRequested: !1, onCancellationRequested: Gt.None }), e.Cancelled = Object.freeze({ isCancellationRequested: !0, onCancellationRequested: cc });
})(Rl || (Rl = {}));
var Wp = class {
  constructor() {
    this._isCancelled = !1, this._emitter = null;
  }
  cancel() {
    this._isCancelled || (this._isCancelled = !0, this._emitter && (this._emitter.fire(void 0), this.dispose()));
  }
  get isCancellationRequested() {
    return this._isCancelled;
  }
  get onCancellationRequested() {
    return this._isCancelled ? cc : (this._emitter || (this._emitter = new Be()), this._emitter.event);
  }
  dispose() {
    this._emitter && (this._emitter.dispose(), this._emitter = null);
  }
}, Tl;
((e) => {
  async function t(r) {
    let n, o = await Promise.all(r.map((a) => a.then((l) => l, (l) => {
      n || (n = l);
    })));
    if (typeof n < "u") throw n;
    return o;
  }
  e.settled = t;
  function s(r) {
    return new Promise(async (n, o) => {
      try {
        await r(n, o);
      } catch (a) {
        o(a);
      }
    });
  }
  e.withAsyncBody = s;
})(Tl || (Tl = {}));
var Bl = class Rt {
  static fromArray(t) {
    return new Rt((s) => {
      s.emitMany(t);
    });
  }
  static fromPromise(t) {
    return new Rt(async (s) => {
      s.emitMany(await t);
    });
  }
  static fromPromises(t) {
    return new Rt(async (s) => {
      await Promise.all(t.map(async (r) => s.emitOne(await r)));
    });
  }
  static merge(t) {
    return new Rt(async (s) => {
      await Promise.all(t.map(async (r) => {
        for await (let n of r) s.emitOne(n);
      }));
    });
  }
  constructor(t, s) {
    this._state = 0, this._results = [], this._error = null, this._onReturn = s, this._onStateChanged = new Be(), queueMicrotask(async () => {
      let r = { emitOne: (n) => this.emitOne(n), emitMany: (n) => this.emitMany(n), reject: (n) => this.reject(n) };
      try {
        await Promise.resolve(t(r)), this.resolve();
      } catch (n) {
        this.reject(n);
      } finally {
        r.emitOne = void 0, r.emitMany = void 0, r.reject = void 0;
      }
    });
  }
  [Symbol.asyncIterator]() {
    let t = 0;
    return { next: async () => {
      do {
        if (this._state === 2) throw this._error;
        if (t < this._results.length) return { done: !1, value: this._results[t++] };
        if (this._state === 1) return { done: !0, value: void 0 };
        await Gt.toPromise(this._onStateChanged.event);
      } while (!0);
    }, return: async () => {
      var s;
      return (s = this._onReturn) == null || s.call(this), { done: !0, value: void 0 };
    } };
  }
  static map(t, s) {
    return new Rt(async (r) => {
      for await (let n of t) r.emitOne(s(n));
    });
  }
  map(t) {
    return Rt.map(this, t);
  }
  static filter(t, s) {
    return new Rt(async (r) => {
      for await (let n of t) s(n) && r.emitOne(n);
    });
  }
  filter(t) {
    return Rt.filter(this, t);
  }
  static coalesce(t) {
    return Rt.filter(t, (s) => !!s);
  }
  coalesce() {
    return Rt.coalesce(this);
  }
  static async toPromise(t) {
    let s = [];
    for await (let r of t) s.push(r);
    return s;
  }
  toPromise() {
    return Rt.toPromise(this);
  }
  emitOne(t) {
    this._state === 0 && (this._results.push(t), this._onStateChanged.fire());
  }
  emitMany(t) {
    this._state === 0 && (this._results = this._results.concat(t), this._onStateChanged.fire());
  }
  resolve() {
    this._state === 0 && (this._state = 1, this._onStateChanged.fire());
  }
  reject(t) {
    this._state === 0 && (this._state = 2, this._error = t, this._onStateChanged.fire());
  }
};
Bl.EMPTY = Bl.fromArray([]);
var { getWindow: $p } = function() {
  let e = /* @__PURE__ */ new Map(), t = { window: Hi, disposables: new ps() };
  e.set(Hi.vscodeWindowId, t);
  let s = new Be(), r = new Be(), n = new Be();
  function o(a, l) {
    return (typeof a == "number" ? e.get(a) : void 0) ?? (l ? t : void 0);
  }
  return { onDidRegisterWindow: s.event, onWillUnregisterWindow: n.event, onDidUnregisterWindow: r.event, registerWindow(a) {
    if (e.has(a.vscodeWindowId)) return zt.None;
    let l = new ps(), c = { window: a, disposables: l.add(new ps()) };
    return e.set(a.vscodeWindowId, c), l.add(_t(() => {
      e.delete(a.vscodeWindowId), r.fire(a);
    })), l.add(mo(a, Up.BEFORE_UNLOAD, () => {
      n.fire(a);
    })), s.fire(c), l;
  }, getWindows() {
    return e.values();
  }, getWindowsCount() {
    return e.size;
  }, getWindowId(a) {
    return a.vscodeWindowId;
  }, hasWindow(a) {
    return e.has(a);
  }, getWindowById: o, getWindow(a) {
    var l;
    let c = a;
    if ((l = c == null ? void 0 : c.ownerDocument) != null && l.defaultView) return c.ownerDocument.defaultView.window;
    let h = a;
    return h != null && h.view ? h.view.window : Hi;
  }, getDocument(a) {
    return $p(a).document;
  } };
}(), Hp = class {
  constructor(e, t, s, r) {
    this._node = e, this._type = t, this._handler = s, this._options = r || !1, this._node.addEventListener(this._type, this._handler, this._options);
  }
  dispose() {
    this._handler && (this._node.removeEventListener(this._type, this._handler, this._options), this._node = null, this._handler = null);
  }
};
function mo(e, t, s, r) {
  return new Hp(e, t, s, r);
}
var Up = { BEFORE_UNLOAD: "beforeunload" }, Kp = class extends zt {
  constructor(e, t, s, r, n, o, a, l, c) {
    super(), this._terminal = e, this._characterJoinerService = t, this._charSizeService = s, this._coreBrowserService = r, this._coreService = n, this._decorationService = o, this._optionsService = a, this._themeService = l, this._cursorBlinkStateManager = new Ds(), this._charAtlasDisposable = this._register(new Ds()), this._observerDisposable = this._register(new Ds()), this._model = new Lp(), this._workCell = new ul(), this._workCell2 = new ul(), this._rectangleRenderer = this._register(new Ds()), this._glyphRenderer = this._register(new Ds()), this._onChangeTextureAtlas = this._register(new Be()), this.onChangeTextureAtlas = this._onChangeTextureAtlas.event, this._onAddTextureAtlasCanvas = this._register(new Be()), this.onAddTextureAtlasCanvas = this._onAddTextureAtlasCanvas.event, this._onRemoveTextureAtlasCanvas = this._register(new Be()), this.onRemoveTextureAtlasCanvas = this._onRemoveTextureAtlasCanvas.event, this._onRequestRedraw = this._register(new Be()), this.onRequestRedraw = this._onRequestRedraw.event, this._onContextLoss = this._register(new Be()), this.onContextLoss = this._onContextLoss.event, this._canvas = this._coreBrowserService.mainDocument.createElement("canvas");
    let h = { antialias: !1, depth: !1, preserveDrawingBuffer: c };
    if (this._gl = this._canvas.getContext("webgl2", h), !this._gl) throw new Error("WebGL2 not supported " + this._gl);
    this._register(this._themeService.onChangeColors(() => this._handleColorChange())), this._cellColorResolver = new Hf(this._terminal, this._optionsService, this._model.selection, this._decorationService, this._coreBrowserService, this._themeService), this._core = this._terminal._core, this._renderLayers = [new Bp(this._core.screenElement, 2, this._terminal, this._core.linkifier, this._coreBrowserService, a, this._themeService)], this.dimensions = Wf(), this._devicePixelRatio = this._coreBrowserService.dpr, this._updateDimensions(), this._updateCursorBlink(), this._register(a.onOptionChange(() => this._handleOptionsChanged())), this._deviceMaxTextureSize = this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE), this._register(mo(this._canvas, "webglcontextlost", (d) => {
      console.log("webglcontextlost event received"), d.preventDefault(), this._contextRestorationTimeout = setTimeout(() => {
        this._contextRestorationTimeout = void 0, console.warn("webgl context not restored; firing onContextLoss"), this._onContextLoss.fire(d);
      }, 3e3);
    })), this._register(mo(this._canvas, "webglcontextrestored", (d) => {
      console.warn("webglcontextrestored event received"), clearTimeout(this._contextRestorationTimeout), this._contextRestorationTimeout = void 0, cl(this._terminal), this._initializeWebGLState(), this._requestRedrawViewport();
    })), this._observerDisposable.value = dl(this._canvas, this._coreBrowserService.window, (d, u) => this._setCanvasDevicePixelDimensions(d, u)), this._register(this._coreBrowserService.onWindowChange((d) => {
      this._observerDisposable.value = dl(this._canvas, d, (u, f) => this._setCanvasDevicePixelDimensions(u, f));
    })), this._core.screenElement.appendChild(this._canvas), [this._rectangleRenderer.value, this._glyphRenderer.value] = this._initializeWebGLState(), this._isAttached = this._core.screenElement.isConnected, this._register(_t(() => {
      var d;
      for (let u of this._renderLayers) u.dispose();
      (d = this._canvas.parentElement) == null || d.removeChild(this._canvas), cl(this._terminal);
    }));
  }
  get textureAtlas() {
    var e;
    return (e = this._charAtlas) == null ? void 0 : e.pages[0].canvas;
  }
  _handleColorChange() {
    this._refreshCharAtlas(), this._clearModel(!0);
  }
  handleDevicePixelRatioChange() {
    this._devicePixelRatio !== this._coreBrowserService.dpr && (this._devicePixelRatio = this._coreBrowserService.dpr, this.handleResize(this._terminal.cols, this._terminal.rows));
  }
  handleResize(e, t) {
    var s, r, n, o;
    this._updateDimensions(), this._model.resize(this._terminal.cols, this._terminal.rows);
    for (let a of this._renderLayers) a.resize(this._terminal, this.dimensions);
    this._canvas.width = this.dimensions.device.canvas.width, this._canvas.height = this.dimensions.device.canvas.height, this._canvas.style.width = `${this.dimensions.css.canvas.width}px`, this._canvas.style.height = `${this.dimensions.css.canvas.height}px`, this._core.screenElement.style.width = `${this.dimensions.css.canvas.width}px`, this._core.screenElement.style.height = `${this.dimensions.css.canvas.height}px`, (s = this._rectangleRenderer.value) == null || s.setDimensions(this.dimensions), (r = this._rectangleRenderer.value) == null || r.handleResize(), (n = this._glyphRenderer.value) == null || n.setDimensions(this.dimensions), (o = this._glyphRenderer.value) == null || o.handleResize(), this._refreshCharAtlas(), this._clearModel(!1);
  }
  handleCharSizeChanged() {
    this.handleResize(this._terminal.cols, this._terminal.rows);
  }
  handleBlur() {
    var e;
    for (let t of this._renderLayers) t.handleBlur(this._terminal);
    (e = this._cursorBlinkStateManager.value) == null || e.pause(), this._requestRedrawViewport();
  }
  handleFocus() {
    var e;
    for (let t of this._renderLayers) t.handleFocus(this._terminal);
    (e = this._cursorBlinkStateManager.value) == null || e.resume(), this._requestRedrawViewport();
  }
  handleSelectionChanged(e, t, s) {
    for (let r of this._renderLayers) r.handleSelectionChanged(this._terminal, e, t, s);
    this._model.selection.update(this._core, e, t, s), this._requestRedrawViewport();
  }
  handleCursorMove() {
    var e;
    for (let t of this._renderLayers) t.handleCursorMove(this._terminal);
    (e = this._cursorBlinkStateManager.value) == null || e.restartBlinkAnimation();
  }
  _handleOptionsChanged() {
    this._updateDimensions(), this._refreshCharAtlas(), this._updateCursorBlink();
  }
  _initializeWebGLState() {
    return this._rectangleRenderer.value = new Rp(this._terminal, this._gl, this.dimensions, this._themeService), this._glyphRenderer.value = new yp(this._terminal, this._gl, this.dimensions, this._optionsService), this.handleCharSizeChanged(), [this._rectangleRenderer.value, this._glyphRenderer.value];
  }
  _refreshCharAtlas() {
    var e;
    if (this.dimensions.device.char.width <= 0 && this.dimensions.device.char.height <= 0) {
      this._isAttached = !1;
      return;
    }
    let t = rc(this._terminal, this._optionsService.rawOptions, this._themeService.colors, this.dimensions.device.cell.width, this.dimensions.device.cell.height, this.dimensions.device.char.width, this.dimensions.device.char.height, this._coreBrowserService.dpr, this._deviceMaxTextureSize);
    this._charAtlas !== t && (this._onChangeTextureAtlas.fire(t.pages[0].canvas), this._charAtlasDisposable.value = $h(Gt.forward(t.onAddTextureAtlasCanvas, this._onAddTextureAtlasCanvas), Gt.forward(t.onRemoveTextureAtlasCanvas, this._onRemoveTextureAtlasCanvas))), this._charAtlas = t, this._charAtlas.warmUp(), (e = this._glyphRenderer.value) == null || e.setAtlas(this._charAtlas);
  }
  _clearModel(e) {
    var t;
    this._model.clear(), e && ((t = this._glyphRenderer.value) == null || t.clear());
  }
  clearTextureAtlas() {
    var e;
    (e = this._charAtlas) == null || e.clearTexture(), this._clearModel(!0), this._requestRedrawViewport();
  }
  clear() {
    var e;
    this._clearModel(!0);
    for (let t of this._renderLayers) t.reset(this._terminal);
    (e = this._cursorBlinkStateManager.value) == null || e.restartBlinkAnimation(), this._updateCursorBlink();
  }
  renderRows(e, t) {
    var s;
    if (!this._isAttached) if ((s = this._core.screenElement) != null && s.isConnected && this._charSizeService.width && this._charSizeService.height) this._updateDimensions(), this._refreshCharAtlas(), this._isAttached = !0;
    else return;
    for (let r of this._renderLayers) r.handleGridChanged(this._terminal, e, t);
    !this._glyphRenderer.value || !this._rectangleRenderer.value || (this._glyphRenderer.value.beginFrame() ? (this._clearModel(!0), this._updateModel(0, this._terminal.rows - 1)) : this._updateModel(e, t), this._rectangleRenderer.value.renderBackgrounds(), this._glyphRenderer.value.render(this._model), (!this._cursorBlinkStateManager.value || this._cursorBlinkStateManager.value.isCursorVisible) && this._rectangleRenderer.value.renderCursor());
  }
  _updateCursorBlink() {
    this._coreService.decPrivateModes.cursorBlink ?? this._terminal.options.cursorBlink ? this._cursorBlinkStateManager.value = new pp(() => {
      this._requestRedrawCursor();
    }, this._coreBrowserService) : this._cursorBlinkStateManager.clear(), this._requestRedrawCursor();
  }
  _updateModel(e, t) {
    let s = this._core, r = this._workCell, n, o, a, l, c, h, d = 0, u = !0, f, _, g, y, D, R, H, M, k;
    e = Pl(e, s.rows - 1, 0), t = Pl(t, s.rows - 1, 0);
    let B = this._coreService.decPrivateModes.cursorStyle ?? s.options.cursorStyle ?? "block", N = this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY, U = N - s.buffer.ydisp, ie = Math.min(this._terminal.buffer.active.cursorX, s.cols - 1), Z = -1, _e = this._coreService.isCursorInitialized && !this._coreService.isCursorHidden && (!this._cursorBlinkStateManager.value || this._cursorBlinkStateManager.value.isCursorVisible);
    this._model.cursor = void 0;
    let Y = !1;
    for (o = e; o <= t; o++) for (a = o + s.buffer.ydisp, l = s.buffer.lines.get(a), this._model.lineLengths[o] = 0, g = N === a, d = 0, c = this._characterJoinerService.getJoinedCharacters(a), M = 0; M < s.cols; M++) {
      if (n = this._cellColorResolver.result.bg, l.loadCell(M, r), M === 0 && (n = this._cellColorResolver.result.bg), h = !1, u = M >= d, f = M, c.length > 0 && M === c[0][0] && u) {
        _ = c.shift();
        let v = this._model.selection.isCellSelected(this._terminal, _[0], a);
        for (H = _[0] + 1; H < _[1]; H++) u && (u = v === this._model.selection.isCellSelected(this._terminal, H, a));
        u && (u = !g || ie < _[0] || ie >= _[1]), u ? (h = !0, r = new Vp(r, l.translateToString(!0, _[0], _[1]), _[1] - _[0]), f = _[1] - 1) : d = _[1];
      }
      if (y = r.getChars(), D = r.getCode(), H = (o * s.cols + M) * Er, this._cellColorResolver.resolve(r, M, a, this.dimensions.device.cell.width), _e && a === N && (M === ie && (this._model.cursor = { x: ie, y: U, width: r.getWidth(), style: this._coreBrowserService.isFocused ? B : s.options.cursorInactiveStyle, cursorWidth: s.options.cursorWidth, dpr: this._devicePixelRatio }, Z = ie + r.getWidth() - 1), M >= ie && M <= Z && (this._coreBrowserService.isFocused && B === "block" || this._coreBrowserService.isFocused === !1 && s.options.cursorInactiveStyle === "block") && (this._cellColorResolver.result.fg = 50331648 | this._themeService.colors.cursorAccent.rgba >> 8 & 16777215, this._cellColorResolver.result.bg = 50331648 | this._themeService.colors.cursor.rgba >> 8 & 16777215)), D !== 0 && (this._model.lineLengths[o] = M + 1), !(this._model.cells[H] === D && this._model.cells[H + vr] === this._cellColorResolver.result.bg && this._model.cells[H + mr] === this._cellColorResolver.result.fg && this._model.cells[H + cn] === this._cellColorResolver.result.ext) && (Y = !0, y.length > 1 && (D |= kp), this._model.cells[H] = D, this._model.cells[H + vr] = this._cellColorResolver.result.bg, this._model.cells[H + mr] = this._cellColorResolver.result.fg, this._model.cells[H + cn] = this._cellColorResolver.result.ext, R = r.getWidth(), this._glyphRenderer.value.updateCell(M, o, D, this._cellColorResolver.result.bg, this._cellColorResolver.result.fg, this._cellColorResolver.result.ext, y, R, n), h)) {
        for (r = this._workCell, M++; M <= f; M++) k = (o * s.cols + M) * Er, this._glyphRenderer.value.updateCell(M, o, 0, 0, 0, 0, Af, 0, 0), this._model.cells[k] = 0, this._model.cells[k + vr] = this._cellColorResolver.result.bg, this._model.cells[k + mr] = this._cellColorResolver.result.fg, this._model.cells[k + cn] = this._cellColorResolver.result.ext;
        M--;
      }
    }
    Y && this._rectangleRenderer.value.updateBackgrounds(this._model), this._rectangleRenderer.value.updateCursor(this._model);
  }
  _updateDimensions() {
    !this._charSizeService.width || !this._charSizeService.height || (this.dimensions.device.char.width = Math.floor(this._charSizeService.width * this._devicePixelRatio), this.dimensions.device.char.height = Math.ceil(this._charSizeService.height * this._devicePixelRatio), this.dimensions.device.cell.height = Math.floor(this.dimensions.device.char.height * this._optionsService.rawOptions.lineHeight), this.dimensions.device.char.top = this._optionsService.rawOptions.lineHeight === 1 ? 0 : Math.round((this.dimensions.device.cell.height - this.dimensions.device.char.height) / 2), this.dimensions.device.cell.width = this.dimensions.device.char.width + Math.round(this._optionsService.rawOptions.letterSpacing), this.dimensions.device.char.left = Math.floor(this._optionsService.rawOptions.letterSpacing / 2), this.dimensions.device.canvas.height = this._terminal.rows * this.dimensions.device.cell.height, this.dimensions.device.canvas.width = this._terminal.cols * this.dimensions.device.cell.width, this.dimensions.css.canvas.height = Math.round(this.dimensions.device.canvas.height / this._devicePixelRatio), this.dimensions.css.canvas.width = Math.round(this.dimensions.device.canvas.width / this._devicePixelRatio), this.dimensions.css.cell.height = this.dimensions.device.cell.height / this._devicePixelRatio, this.dimensions.css.cell.width = this.dimensions.device.cell.width / this._devicePixelRatio);
  }
  _setCanvasDevicePixelDimensions(e, t) {
    this._canvas.width === e && this._canvas.height === t || (this._canvas.width = e, this._canvas.height = t, this._requestRedrawViewport());
  }
  _requestRedrawViewport() {
    this._onRequestRedraw.fire({ start: 0, end: this._terminal.rows - 1 });
  }
  _requestRedrawCursor() {
    let e = this._terminal.buffer.active.cursorY;
    this._onRequestRedraw.fire({ start: e, end: e });
  }
}, Vp = class extends us {
  constructor(e, t, s) {
    super(), this.content = 0, this.combinedData = "", this.fg = e.fg, this.bg = e.bg, this.combinedData = t, this._width = s;
  }
  isCombined() {
    return 2097152;
  }
  getWidth() {
    return this._width;
  }
  getChars() {
    return this.combinedData;
  }
  getCode() {
    return 2097151;
  }
  setFromCharData(e) {
    throw new Error("not implemented");
  }
  getAsCharData() {
    return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
  }
};
function Pl(e, t, s = 0) {
  return Math.max(Math.min(e, t), s);
}
var Al = "di$target", Nl = "di$dependencies", pn = /* @__PURE__ */ new Map();
function ti(e) {
  if (pn.has(e)) return pn.get(e);
  let t = function(s, r, n) {
    if (arguments.length !== 3) throw new Error("@IServiceName-decorator can only be used to decorate a parameter");
    qp(t, s, n);
  };
  return t._id = e, pn.set(e, t), t;
}
function qp(e, t, s) {
  t[Al] === t ? t[Nl].push({ id: e, index: s }) : (t[Nl] = [{ id: e, index: s }], t[Al] = t);
}
ti("BufferService");
ti("CoreMouseService");
ti("CoreService");
ti("CharsetService");
ti("InstantiationService");
ti("LogService");
var Yp = ti("OptionsService");
ti("OscLinkService");
ti("UnicodeService");
ti("DecorationService");
var jp = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, off: 5 }, Gp = "xterm.js: ", Ol = class extends zt {
  constructor(e) {
    super(), this._optionsService = e, this._logLevel = 5, this._updateLogLevel(), this._register(this._optionsService.onSpecificOptionChange("logLevel", () => this._updateLogLevel()));
  }
  get logLevel() {
    return this._logLevel;
  }
  _updateLogLevel() {
    this._logLevel = jp[this._optionsService.rawOptions.logLevel];
  }
  _evalLazyOptionalParams(e) {
    for (let t = 0; t < e.length; t++) typeof e[t] == "function" && (e[t] = e[t]());
  }
  _log(e, t, s) {
    this._evalLazyOptionalParams(s), e.call(console, (this._optionsService.options.logger ? "" : Gp) + t, ...s);
  }
  trace(e, ...t) {
    var s;
    this._logLevel <= 0 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.trace.bind(this._optionsService.options.logger)) ?? console.log, e, t);
  }
  debug(e, ...t) {
    var s;
    this._logLevel <= 1 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.debug.bind(this._optionsService.options.logger)) ?? console.log, e, t);
  }
  info(e, ...t) {
    var s;
    this._logLevel <= 2 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.info.bind(this._optionsService.options.logger)) ?? console.info, e, t);
  }
  warn(e, ...t) {
    var s;
    this._logLevel <= 3 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.warn.bind(this._optionsService.options.logger)) ?? console.warn, e, t);
  }
  error(e, ...t) {
    var s;
    this._logLevel <= 4 && this._log(((s = this._optionsService.options.logger) == null ? void 0 : s.error.bind(this._optionsService.options.logger)) ?? console.error, e, t);
  }
};
Ol = Cf([xf(0, Yp)], Ol);
var Xp = class extends zt {
  constructor(e) {
    if (Kh && Pf() < 16) {
      let t = { antialias: !1, depth: !1, preserveDrawingBuffer: !0 };
      if (!document.createElement("canvas").getContext("webgl2", t)) throw new Error("Webgl2 is only supported on Safari 16 and above");
    }
    super(), this._preserveDrawingBuffer = e, this._onChangeTextureAtlas = this._register(new Be()), this.onChangeTextureAtlas = this._onChangeTextureAtlas.event, this._onAddTextureAtlasCanvas = this._register(new Be()), this.onAddTextureAtlasCanvas = this._onAddTextureAtlasCanvas.event, this._onRemoveTextureAtlasCanvas = this._register(new Be()), this.onRemoveTextureAtlasCanvas = this._onRemoveTextureAtlasCanvas.event, this._onContextLoss = this._register(new Be()), this.onContextLoss = this._onContextLoss.event;
  }
  activate(e) {
    let t = e._core;
    if (!e.element) {
      this._register(t.onWillOpen(() => this.activate(e)));
      return;
    }
    this._terminal = e;
    let s = t.coreService, r = t.optionsService, n = t, o = n._renderService, a = n._characterJoinerService, l = n._charSizeService, c = n._coreBrowserService, h = n._decorationService;
    n._logService;
    let d = n._themeService;
    this._renderer = this._register(new Kp(e, a, l, c, s, h, r, d, this._preserveDrawingBuffer)), this._register(Gt.forward(this._renderer.onContextLoss, this._onContextLoss)), this._register(Gt.forward(this._renderer.onChangeTextureAtlas, this._onChangeTextureAtlas)), this._register(Gt.forward(this._renderer.onAddTextureAtlasCanvas, this._onAddTextureAtlasCanvas)), this._register(Gt.forward(this._renderer.onRemoveTextureAtlasCanvas, this._onRemoveTextureAtlasCanvas)), o.setRenderer(this._renderer), this._register(_t(() => {
      if (this._terminal._core._store._isDisposed) return;
      let u = this._terminal._core._renderService;
      u.setRenderer(this._terminal._core._createRenderer()), u.handleResize(e.cols, e.rows);
    }));
  }
  get textureAtlas() {
    var e;
    return (e = this._renderer) == null ? void 0 : e.textureAtlas;
  }
  clearTextureAtlas() {
    var e;
    (e = this._renderer) == null || e.clearTextureAtlas();
  }
};
/**
 * Copyright (c) 2014-2024 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 * @license MIT
 *
 * Originally forked from (with the author's permission):
 *   Fabrice Bellard's javascript vt100 for jslinux:
 *   http://bellard.org/jslinux/
 *   Copyright (c) 2011 Fabrice Bellard
 */
var Zp = class {
  constructor(e, t, s, r = {}) {
    this._terminal = e, this._regex = t, this._handler = s, this._options = r;
  }
  provideLinks(e, t) {
    let s = Qp.computeLink(e, this._regex, this._terminal, this._handler);
    t(this._addCallbacks(s));
  }
  _addCallbacks(e) {
    return e.map((t) => (t.leave = this._options.leave, t.hover = (s, r) => {
      if (this._options.hover) {
        let { range: n } = t;
        this._options.hover(s, r, n);
      }
    }, t));
  }
};
function Jp(e) {
  try {
    let t = new URL(e), s = t.password && t.username ? `${t.protocol}//${t.username}:${t.password}@${t.host}` : t.username ? `${t.protocol}//${t.username}@${t.host}` : `${t.protocol}//${t.host}`;
    return e.toLocaleLowerCase().startsWith(s.toLocaleLowerCase());
  } catch {
    return !1;
  }
}
var Qp = class Sr {
  static computeLink(t, s, r, n) {
    let o = new RegExp(s.source, (s.flags || "") + "g"), [a, l] = Sr._getWindowedLineStrings(t - 1, r), c = a.join(""), h, d = [];
    for (; h = o.exec(c); ) {
      let u = h[0];
      if (!Jp(u)) continue;
      let [f, _] = Sr._mapStrIdx(r, l, 0, h.index), [g, y] = Sr._mapStrIdx(r, f, _, u.length);
      if (f === -1 || _ === -1 || g === -1 || y === -1) continue;
      let D = { start: { x: _ + 1, y: f + 1 }, end: { x: y, y: g + 1 } };
      d.push({ range: D, text: u, activate: n });
    }
    return d;
  }
  static _getWindowedLineStrings(t, s) {
    let r, n = t, o = t, a = 0, l = "", c = [];
    if (r = s.buffer.active.getLine(t)) {
      let h = r.translateToString(!0);
      if (r.isWrapped && h[0] !== " ") {
        for (a = 0; (r = s.buffer.active.getLine(--n)) && a < 2048 && (l = r.translateToString(!0), a += l.length, c.push(l), !(!r.isWrapped || l.indexOf(" ") !== -1)); ) ;
        c.reverse();
      }
      for (c.push(h), a = 0; (r = s.buffer.active.getLine(++o)) && r.isWrapped && a < 2048 && (l = r.translateToString(!0), a += l.length, c.push(l), l.indexOf(" ") === -1); ) ;
    }
    return [c, n];
  }
  static _mapStrIdx(t, s, r, n) {
    let o = t.buffer.active, a = o.getNullCell(), l = r;
    for (; n; ) {
      let c = o.getLine(s);
      if (!c) return [-1, -1];
      for (let h = l; h < c.length; ++h) {
        c.getCell(h, a);
        let d = a.getChars();
        if (a.getWidth() && (n -= d.length || 1, h === c.length - 1 && d === "")) {
          let u = o.getLine(s + 1);
          u && u.isWrapped && (u.getCell(0, a), a.getWidth() === 2 && (n += 1));
        }
        if (n < 0) return [s, h];
      }
      s++, l = 0;
    }
    return [s, l];
  }
}, eg = /(https?|HTTPS?):[/]{2}[^\s"'!*(){}|\\\^<>`]*[^\s"':,.!?{}|\\\^~\[\]`()<>]/;
function tg(e, t) {
  let s = window.open();
  if (s) {
    try {
      s.opener = null;
    } catch {
    }
    s.location.href = t;
  } else console.warn("Opening link blocked as opener could not be cleared");
}
var ig = class {
  constructor(e = tg, t = {}) {
    this._handler = e, this._options = t;
  }
  activate(e) {
    this._terminal = e;
    let t = this._options, s = t.urlRegex || eg;
    this._linkProvider = this._terminal.registerLinkProvider(new Zp(this._terminal, s, this._handler, t));
  }
  dispose() {
    var e;
    (e = this._linkProvider) == null || e.dispose();
  }
};
/**
 * Copyright (c) 2014-2024 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 * @license MIT
 *
 * Originally forked from (with the author's permission):
 *   Fabrice Bellard's javascript vt100 for jslinux:
 *   http://bellard.org/jslinux/
 *   Copyright (c) 2011 Fabrice Bellard
 */
var sg = class {
  constructor() {
    this.listeners = [], this.unexpectedErrorHandler = function(e) {
      setTimeout(() => {
        throw e.stack ? Il.isErrorNoTelemetry(e) ? new Il(e.message + `

` + e.stack) : new Error(e.message + `

` + e.stack) : e;
      }, 0);
    };
  }
  addListener(e) {
    return this.listeners.push(e), () => {
      this._removeListener(e);
    };
  }
  emit(e) {
    this.listeners.forEach((t) => {
      t(e);
    });
  }
  _removeListener(e) {
    this.listeners.splice(this.listeners.indexOf(e), 1);
  }
  setUnexpectedErrorHandler(e) {
    this.unexpectedErrorHandler = e;
  }
  getUnexpectedErrorHandler() {
    return this.unexpectedErrorHandler;
  }
  onUnexpectedError(e) {
    this.unexpectedErrorHandler(e), this.emit(e);
  }
  onUnexpectedExternalError(e) {
    this.unexpectedErrorHandler(e);
  }
}, rg = new sg();
function gn(e) {
  ng(e) || rg.onUnexpectedError(e);
}
var wo = "Canceled";
function ng(e) {
  return e instanceof og ? !0 : e instanceof Error && e.name === wo && e.message === wo;
}
var og = class extends Error {
  constructor() {
    super(wo), this.name = this.message;
  }
}, Il = class So extends Error {
  constructor(t) {
    super(t), this.name = "CodeExpectedError";
  }
  static fromError(t) {
    if (t instanceof So) return t;
    let s = new So();
    return s.message = t.message, s.stack = t.stack, s;
  }
  static isErrorNoTelemetry(t) {
    return t.name === "CodeExpectedError";
  }
}, Fl;
((e) => {
  function t(o) {
    return o < 0;
  }
  e.isLessThan = t;
  function s(o) {
    return o <= 0;
  }
  e.isLessThanOrEqual = s;
  function r(o) {
    return o > 0;
  }
  e.isGreaterThan = r;
  function n(o) {
    return o === 0;
  }
  e.isNeitherLessOrGreaterThan = n, e.greaterThan = 1, e.lessThan = -1, e.neitherLessOrGreaterThan = 0;
})(Fl || (Fl = {}));
function ag(e, t) {
  let s = this, r = !1, n;
  return function() {
    return r || (r = !0, n = e.apply(s, arguments)), n;
  };
}
var bo;
((e) => {
  function t(k) {
    return k && typeof k == "object" && typeof k[Symbol.iterator] == "function";
  }
  e.is = t;
  let s = Object.freeze([]);
  function r() {
    return s;
  }
  e.empty = r;
  function* n(k) {
    yield k;
  }
  e.single = n;
  function o(k) {
    return t(k) ? k : n(k);
  }
  e.wrap = o;
  function a(k) {
    return k || s;
  }
  e.from = a;
  function* l(k) {
    for (let B = k.length - 1; B >= 0; B--) yield k[B];
  }
  e.reverse = l;
  function c(k) {
    return !k || k[Symbol.iterator]().next().done === !0;
  }
  e.isEmpty = c;
  function h(k) {
    return k[Symbol.iterator]().next().value;
  }
  e.first = h;
  function d(k, B) {
    let N = 0;
    for (let U of k) if (B(U, N++)) return !0;
    return !1;
  }
  e.some = d;
  function u(k, B) {
    for (let N of k) if (B(N)) return N;
  }
  e.find = u;
  function* f(k, B) {
    for (let N of k) B(N) && (yield N);
  }
  e.filter = f;
  function* _(k, B) {
    let N = 0;
    for (let U of k) yield B(U, N++);
  }
  e.map = _;
  function* g(k, B) {
    let N = 0;
    for (let U of k) yield* B(U, N++);
  }
  e.flatMap = g;
  function* y(...k) {
    for (let B of k) yield* B;
  }
  e.concat = y;
  function D(k, B, N) {
    let U = N;
    for (let ie of k) U = B(U, ie);
    return U;
  }
  e.reduce = D;
  function* R(k, B, N = k.length) {
    for (B < 0 && (B += k.length), N < 0 ? N += k.length : N > k.length && (N = k.length); B < N; B++) yield k[B];
  }
  e.slice = R;
  function H(k, B = Number.POSITIVE_INFINITY) {
    let N = [];
    if (B === 0) return [N, k];
    let U = k[Symbol.iterator]();
    for (let ie = 0; ie < B; ie++) {
      let Z = U.next();
      if (Z.done) return [N, e.empty()];
      N.push(Z.value);
    }
    return [N, { [Symbol.iterator]() {
      return U;
    } }];
  }
  e.consume = H;
  async function M(k) {
    let B = [];
    for await (let N of k) B.push(N);
    return Promise.resolve(B);
  }
  e.asyncToArray = M;
})(bo || (bo = {}));
function $s(e) {
  if (bo.is(e)) {
    let t = [];
    for (let s of e) if (s) try {
      s.dispose();
    } catch (r) {
      t.push(r);
    }
    if (t.length === 1) throw t[0];
    if (t.length > 1) throw new AggregateError(t, "Encountered errors while disposing of store");
    return Array.isArray(e) ? [] : e;
  } else if (e) return e.dispose(), e;
}
function dc(...e) {
  return Ss(() => $s(e));
}
function Ss(e) {
  return { dispose: ag(() => {
    e();
  }) };
}
var uc = class _c {
  constructor() {
    this._toDispose = /* @__PURE__ */ new Set(), this._isDisposed = !1;
  }
  dispose() {
    this._isDisposed || (this._isDisposed = !0, this.clear());
  }
  get isDisposed() {
    return this._isDisposed;
  }
  clear() {
    if (this._toDispose.size !== 0) try {
      $s(this._toDispose);
    } finally {
      this._toDispose.clear();
    }
  }
  add(t) {
    if (!t) return t;
    if (t === this) throw new Error("Cannot register a disposable on itself!");
    return this._isDisposed ? _c.DISABLE_DISPOSED_WARNING || console.warn(new Error("Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!").stack) : this._toDispose.add(t), t;
  }
  delete(t) {
    if (t) {
      if (t === this) throw new Error("Cannot dispose a disposable on itself!");
      this._toDispose.delete(t), t.dispose();
    }
  }
  deleteAndLeak(t) {
    t && this._toDispose.has(t) && this._toDispose.delete(t);
  }
};
uc.DISABLE_DISPOSED_WARNING = !1;
var zo = uc, Ai = class {
  constructor() {
    this._store = new zo(), this._store;
  }
  dispose() {
    this._store.dispose();
  }
  _register(e) {
    if (e === this) throw new Error("Cannot register a disposable on itself!");
    return this._store.add(e);
  }
};
Ai.None = Object.freeze({ dispose() {
} });
var Dr = class {
  constructor() {
    this._isDisposed = !1;
  }
  get value() {
    return this._isDisposed ? void 0 : this._value;
  }
  set value(e) {
    var t;
    this._isDisposed || e === this._value || ((t = this._value) == null || t.dispose(), this._value = e);
  }
  clear() {
    this.value = void 0;
  }
  dispose() {
    var e;
    this._isDisposed = !0, (e = this._value) == null || e.dispose(), this._value = void 0;
  }
  clearAndLeak() {
    let e = this._value;
    return this._value = void 0, e;
  }
}, lg = globalThis.performance && typeof globalThis.performance.now == "function", hg = class fc {
  static create(t) {
    return new fc(t);
  }
  constructor(t) {
    this._now = lg && t === !1 ? Date.now : globalThis.performance.now.bind(globalThis.performance), this._startTime = this._now(), this._stopTime = -1;
  }
  stop() {
    this._stopTime = this._now();
  }
  reset() {
    this._startTime = this._now(), this._stopTime = -1;
  }
  elapsed() {
    return this._stopTime !== -1 ? this._stopTime - this._startTime : this._now() - this._startTime;
  }
}, Rr;
((e) => {
  e.None = () => Ai.None;
  function t(v, p) {
    return u(v, () => {
    }, 0, void 0, !0, void 0, p);
  }
  e.defer = t;
  function s(v) {
    return (p, w = null, m) => {
      let b = !1, L;
      return L = v((x) => {
        if (!b) return L ? L.dispose() : b = !0, p.call(w, x);
      }, null, m), b && L.dispose(), L;
    };
  }
  e.once = s;
  function r(v, p, w) {
    return h((m, b = null, L) => v((x) => m.call(b, p(x)), null, L), w);
  }
  e.map = r;
  function n(v, p, w) {
    return h((m, b = null, L) => v((x) => {
      p(x), m.call(b, x);
    }, null, L), w);
  }
  e.forEach = n;
  function o(v, p, w) {
    return h((m, b = null, L) => v((x) => p(x) && m.call(b, x), null, L), w);
  }
  e.filter = o;
  function a(v) {
    return v;
  }
  e.signal = a;
  function l(...v) {
    return (p, w = null, m) => {
      let b = dc(...v.map((L) => L((x) => p.call(w, x))));
      return d(b, m);
    };
  }
  e.any = l;
  function c(v, p, w, m) {
    let b = w;
    return r(v, (L) => (b = p(b, L), b), m);
  }
  e.reduce = c;
  function h(v, p) {
    let w, m = { onWillAddFirstListener() {
      w = v(b.fire, b);
    }, onDidRemoveLastListener() {
      w == null || w.dispose();
    } }, b = new qt(m);
    return p == null || p.add(b), b.event;
  }
  function d(v, p) {
    return p instanceof Array ? p.push(v) : p && p.add(v), v;
  }
  function u(v, p, w = 100, m = !1, b = !1, L, x) {
    let A, I, se, he = 0, re, ce = { leakWarningThreshold: L, onWillAddFirstListener() {
      A = v((ge) => {
        he++, I = p(I, ge), m && !se && (pe.fire(I), I = void 0), re = () => {
          let be = I;
          I = void 0, se = void 0, (!m || he > 1) && pe.fire(be), he = 0;
        }, typeof w == "number" ? (clearTimeout(se), se = setTimeout(re, w)) : se === void 0 && (se = 0, queueMicrotask(re));
      });
    }, onWillRemoveListener() {
      b && he > 0 && (re == null || re());
    }, onDidRemoveLastListener() {
      re = void 0, A.dispose();
    } }, pe = new qt(ce);
    return x == null || x.add(pe), pe.event;
  }
  e.debounce = u;
  function f(v, p = 0, w) {
    return e.debounce(v, (m, b) => m ? (m.push(b), m) : [b], p, void 0, !0, void 0, w);
  }
  e.accumulate = f;
  function _(v, p = (m, b) => m === b, w) {
    let m = !0, b;
    return o(v, (L) => {
      let x = m || !p(L, b);
      return m = !1, b = L, x;
    }, w);
  }
  e.latch = _;
  function g(v, p, w) {
    return [e.filter(v, p, w), e.filter(v, (m) => !p(m), w)];
  }
  e.split = g;
  function y(v, p = !1, w = [], m) {
    let b = w.slice(), L = v((I) => {
      b ? b.push(I) : A.fire(I);
    });
    m && m.add(L);
    let x = () => {
      b == null || b.forEach((I) => A.fire(I)), b = null;
    }, A = new qt({ onWillAddFirstListener() {
      L || (L = v((I) => A.fire(I)), m && m.add(L));
    }, onDidAddFirstListener() {
      b && (p ? setTimeout(x) : x());
    }, onDidRemoveLastListener() {
      L && L.dispose(), L = null;
    } });
    return m && m.add(A), A.event;
  }
  e.buffer = y;
  function D(v, p) {
    return (w, m, b) => {
      let L = p(new H());
      return v(function(x) {
        let A = L.evaluate(x);
        A !== R && w.call(m, A);
      }, void 0, b);
    };
  }
  e.chain = D;
  let R = Symbol("HaltChainable");
  class H {
    constructor() {
      this.steps = [];
    }
    map(p) {
      return this.steps.push(p), this;
    }
    forEach(p) {
      return this.steps.push((w) => (p(w), w)), this;
    }
    filter(p) {
      return this.steps.push((w) => p(w) ? w : R), this;
    }
    reduce(p, w) {
      let m = w;
      return this.steps.push((b) => (m = p(m, b), m)), this;
    }
    latch(p = (w, m) => w === m) {
      let w = !0, m;
      return this.steps.push((b) => {
        let L = w || !p(b, m);
        return w = !1, m = b, L ? b : R;
      }), this;
    }
    evaluate(p) {
      for (let w of this.steps) if (p = w(p), p === R) break;
      return p;
    }
  }
  function M(v, p, w = (m) => m) {
    let m = (...A) => x.fire(w(...A)), b = () => v.on(p, m), L = () => v.removeListener(p, m), x = new qt({ onWillAddFirstListener: b, onDidRemoveLastListener: L });
    return x.event;
  }
  e.fromNodeEventEmitter = M;
  function k(v, p, w = (m) => m) {
    let m = (...A) => x.fire(w(...A)), b = () => v.addEventListener(p, m), L = () => v.removeEventListener(p, m), x = new qt({ onWillAddFirstListener: b, onDidRemoveLastListener: L });
    return x.event;
  }
  e.fromDOMEventEmitter = k;
  function B(v) {
    return new Promise((p) => s(v)(p));
  }
  e.toPromise = B;
  function N(v) {
    let p = new qt();
    return v.then((w) => {
      p.fire(w);
    }, () => {
      p.fire(void 0);
    }).finally(() => {
      p.dispose();
    }), p.event;
  }
  e.fromPromise = N;
  function U(v, p) {
    return v((w) => p.fire(w));
  }
  e.forward = U;
  function ie(v, p, w) {
    return p(w), v((m) => p(m));
  }
  e.runAndSubscribe = ie;
  class Z {
    constructor(p, w) {
      this._observable = p, this._counter = 0, this._hasChanged = !1;
      let m = { onWillAddFirstListener: () => {
        p.addObserver(this);
      }, onDidRemoveLastListener: () => {
        p.removeObserver(this);
      } };
      this.emitter = new qt(m), w && w.add(this.emitter);
    }
    beginUpdate(p) {
      this._counter++;
    }
    handlePossibleChange(p) {
    }
    handleChange(p, w) {
      this._hasChanged = !0;
    }
    endUpdate(p) {
      this._counter--, this._counter === 0 && (this._observable.reportChanges(), this._hasChanged && (this._hasChanged = !1, this.emitter.fire(this._observable.get())));
    }
  }
  function _e(v, p) {
    return new Z(v, p).emitter.event;
  }
  e.fromObservable = _e;
  function Y(v) {
    return (p, w, m) => {
      let b = 0, L = !1, x = { beginUpdate() {
        b++;
      }, endUpdate() {
        b--, b === 0 && (v.reportChanges(), L && (L = !1, p.call(w)));
      }, handlePossibleChange() {
      }, handleChange() {
        L = !0;
      } };
      v.addObserver(x), v.reportChanges();
      let A = { dispose() {
        v.removeObserver(x);
      } };
      return m instanceof zo ? m.add(A) : Array.isArray(m) && m.push(A), A;
    };
  }
  e.fromObservableLight = Y;
})(Rr || (Rr = {}));
var yo = class Co {
  constructor(t) {
    this.listenerCount = 0, this.invocationCount = 0, this.elapsedOverall = 0, this.durations = [], this.name = `${t}_${Co._idPool++}`, Co.all.add(this);
  }
  start(t) {
    this._stopWatch = new hg(), this.listenerCount = t;
  }
  stop() {
    if (this._stopWatch) {
      let t = this._stopWatch.elapsed();
      this.durations.push(t), this.elapsedOverall += t, this.invocationCount += 1, this._stopWatch = void 0;
    }
  }
};
yo.all = /* @__PURE__ */ new Set(), yo._idPool = 0;
var cg = yo, dg = -1, pc = class gc {
  constructor(t, s, r = (gc._idPool++).toString(16).padStart(3, "0")) {
    this._errorHandler = t, this.threshold = s, this.name = r, this._warnCountdown = 0;
  }
  dispose() {
    var t;
    (t = this._stacks) == null || t.clear();
  }
  check(t, s) {
    let r = this.threshold;
    if (r <= 0 || s < r) return;
    this._stacks || (this._stacks = /* @__PURE__ */ new Map());
    let n = this._stacks.get(t.value) || 0;
    if (this._stacks.set(t.value, n + 1), this._warnCountdown -= 1, this._warnCountdown <= 0) {
      this._warnCountdown = r * 0.5;
      let [o, a] = this.getMostFrequentStack(), l = `[${this.name}] potential listener LEAK detected, having ${s} listeners already. MOST frequent listener (${a}):`;
      console.warn(l), console.warn(o);
      let c = new fg(l, o);
      this._errorHandler(c);
    }
    return () => {
      let o = this._stacks.get(t.value) || 0;
      this._stacks.set(t.value, o - 1);
    };
  }
  getMostFrequentStack() {
    if (!this._stacks) return;
    let t, s = 0;
    for (let [r, n] of this._stacks) (!t || s < n) && (t = [r, n], s = n);
    return t;
  }
};
pc._idPool = 1;
var ug = pc, _g = class vc {
  constructor(t) {
    this.value = t;
  }
  static create() {
    let t = new Error();
    return new vc(t.stack ?? "");
  }
  print() {
    console.warn(this.value.split(`
`).slice(2).join(`
`));
  }
}, fg = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerLeakError", this.stack = t;
  }
}, pg = class extends Error {
  constructor(e, t) {
    super(e), this.name = "ListenerRefusalError", this.stack = t;
  }
}, gg = 0, vn = class {
  constructor(e) {
    this.value = e, this.id = gg++;
  }
}, vg = 2, qt = class {
  constructor(e) {
    var t, s, r, n;
    this._size = 0, this._options = e, this._leakageMon = (t = this._options) != null && t.leakWarningThreshold ? new ug((e == null ? void 0 : e.onListenerError) ?? gn, ((s = this._options) == null ? void 0 : s.leakWarningThreshold) ?? dg) : void 0, this._perfMon = (r = this._options) != null && r._profName ? new cg(this._options._profName) : void 0, this._deliveryQueue = (n = this._options) == null ? void 0 : n.deliveryQueue;
  }
  dispose() {
    var e, t, s, r;
    this._disposed || (this._disposed = !0, ((e = this._deliveryQueue) == null ? void 0 : e.current) === this && this._deliveryQueue.reset(), this._listeners && (this._listeners = void 0, this._size = 0), (s = (t = this._options) == null ? void 0 : t.onDidRemoveLastListener) == null || s.call(t), (r = this._leakageMon) == null || r.dispose());
  }
  get event() {
    return this._event ?? (this._event = (e, t, s) => {
      var r, n, o, a, l;
      if (this._leakageMon && this._size > this._leakageMon.threshold ** 2) {
        let u = `[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far (${this._size} vs ${this._leakageMon.threshold})`;
        console.warn(u);
        let f = this._leakageMon.getMostFrequentStack() ?? ["UNKNOWN stack", -1], _ = new pg(`${u}. HINT: Stack shows most frequent listener (${f[1]}-times)`, f[0]);
        return (((r = this._options) == null ? void 0 : r.onListenerError) || gn)(_), Ai.None;
      }
      if (this._disposed) return Ai.None;
      t && (e = e.bind(t));
      let c = new vn(e), h;
      this._leakageMon && this._size >= Math.ceil(this._leakageMon.threshold * 0.2) && (c.stack = _g.create(), h = this._leakageMon.check(c.stack, this._size + 1)), this._listeners ? this._listeners instanceof vn ? (this._deliveryQueue ?? (this._deliveryQueue = new mg()), this._listeners = [this._listeners, c]) : this._listeners.push(c) : ((o = (n = this._options) == null ? void 0 : n.onWillAddFirstListener) == null || o.call(n, this), this._listeners = c, (l = (a = this._options) == null ? void 0 : a.onDidAddFirstListener) == null || l.call(a, this)), this._size++;
      let d = Ss(() => {
        h == null || h(), this._removeListener(c);
      });
      return s instanceof zo ? s.add(d) : Array.isArray(s) && s.push(d), d;
    }), this._event;
  }
  _removeListener(e) {
    var t, s, r, n;
    if ((s = (t = this._options) == null ? void 0 : t.onWillRemoveListener) == null || s.call(t, this), !this._listeners) return;
    if (this._size === 1) {
      this._listeners = void 0, (n = (r = this._options) == null ? void 0 : r.onDidRemoveLastListener) == null || n.call(r, this), this._size = 0;
      return;
    }
    let o = this._listeners, a = o.indexOf(e);
    if (a === -1) throw console.log("disposed?", this._disposed), console.log("size?", this._size), console.log("arr?", JSON.stringify(this._listeners)), new Error("Attempted to dispose unknown listener");
    this._size--, o[a] = void 0;
    let l = this._deliveryQueue.current === this;
    if (this._size * vg <= o.length) {
      let c = 0;
      for (let h = 0; h < o.length; h++) o[h] ? o[c++] = o[h] : l && (this._deliveryQueue.end--, c < this._deliveryQueue.i && this._deliveryQueue.i--);
      o.length = c;
    }
  }
  _deliver(e, t) {
    var s;
    if (!e) return;
    let r = ((s = this._options) == null ? void 0 : s.onListenerError) || gn;
    if (!r) {
      e.value(t);
      return;
    }
    try {
      e.value(t);
    } catch (n) {
      r(n);
    }
  }
  _deliverQueue(e) {
    let t = e.current._listeners;
    for (; e.i < e.end; ) this._deliver(t[e.i++], e.value);
    e.reset();
  }
  fire(e) {
    var t, s, r, n;
    if ((t = this._deliveryQueue) != null && t.current && (this._deliverQueue(this._deliveryQueue), (s = this._perfMon) == null || s.stop()), (r = this._perfMon) == null || r.start(this._size), this._listeners) if (this._listeners instanceof vn) this._deliver(this._listeners, e);
    else {
      let o = this._deliveryQueue;
      o.enqueue(this, e, this._listeners.length), this._deliverQueue(o);
    }
    (n = this._perfMon) == null || n.stop();
  }
  hasListeners() {
    return this._size > 0;
  }
}, mg = class {
  constructor() {
    this.i = -1, this.end = 0;
  }
  enqueue(e, t, s) {
    this.i = 0, this.end = s, this.current = e, this.value = t;
  }
  reset() {
    this.i = this.end, this.current = void 0, this.value = void 0;
  }
}, mc = Object.freeze(function(e, t) {
  let s = setTimeout(e.bind(t), 0);
  return { dispose() {
    clearTimeout(s);
  } };
}), zl;
((e) => {
  function t(s) {
    return s === e.None || s === e.Cancelled || s instanceof wg ? !0 : !s || typeof s != "object" ? !1 : typeof s.isCancellationRequested == "boolean" && typeof s.onCancellationRequested == "function";
  }
  e.isCancellationToken = t, e.None = Object.freeze({ isCancellationRequested: !1, onCancellationRequested: Rr.None }), e.Cancelled = Object.freeze({ isCancellationRequested: !0, onCancellationRequested: mc });
})(zl || (zl = {}));
var wg = class {
  constructor() {
    this._isCancelled = !1, this._emitter = null;
  }
  cancel() {
    this._isCancelled || (this._isCancelled = !0, this._emitter && (this._emitter.fire(void 0), this.dispose()));
  }
  get isCancellationRequested() {
    return this._isCancelled;
  }
  get onCancellationRequested() {
    return this._isCancelled ? mc : (this._emitter || (this._emitter = new qt()), this._emitter.event);
  }
  dispose() {
    this._emitter && (this._emitter.dispose(), this._emitter = null);
  }
}, fs = "en", mn = !1, ur, br = fs, Wl = fs, Sg, Vt, qi = globalThis, vt, $l;
typeof qi.vscode < "u" && typeof qi.vscode.process < "u" ? vt = qi.vscode.process : typeof process < "u" && typeof (($l = process == null ? void 0 : process.versions) == null ? void 0 : $l.node) == "string" && (vt = process);
var Hl, bg = typeof ((Hl = vt == null ? void 0 : vt.versions) == null ? void 0 : Hl.electron) == "string", yg = bg && (vt == null ? void 0 : vt.type) === "renderer", Ul;
if (typeof vt == "object") {
  vt.platform, vt.platform, mn = vt.platform === "linux", mn && vt.env.SNAP && vt.env.SNAP_REVISION, vt.env.CI || vt.env.BUILD_ARTIFACTSTAGINGDIRECTORY, ur = fs, br = fs;
  let e = vt.env.VSCODE_NLS_CONFIG;
  if (e) try {
    let t = JSON.parse(e);
    ur = t.userLocale, Wl = t.osLocale, br = t.resolvedLanguage || fs, Sg = (Ul = t.languagePack) == null ? void 0 : Ul.translationsConfigFile;
  } catch {
  }
} else typeof navigator == "object" && !yg ? (Vt = navigator.userAgent, Vt.indexOf("Windows") >= 0, Vt.indexOf("Macintosh") >= 0, (Vt.indexOf("Macintosh") >= 0 || Vt.indexOf("iPad") >= 0 || Vt.indexOf("iPhone") >= 0) && navigator.maxTouchPoints && navigator.maxTouchPoints > 0, mn = Vt.indexOf("Linux") >= 0, (Vt == null ? void 0 : Vt.indexOf("Mobi")) >= 0, br = globalThis._VSCODE_NLS_LANGUAGE || fs, ur = navigator.language.toLowerCase(), Wl = ur) : console.error("Unable to resolve platform.");
var ei = Vt, Li = br, Kl;
((e) => {
  function t() {
    return Li;
  }
  e.value = t;
  function s() {
    return Li.length === 2 ? Li === "en" : Li.length >= 3 ? Li[0] === "e" && Li[1] === "n" && Li[2] === "-" : !1;
  }
  e.isDefaultVariant = s;
  function r() {
    return Li === "en";
  }
  e.isDefault = r;
})(Kl || (Kl = {}));
var Cg = typeof qi.postMessage == "function" && !qi.importScripts;
(() => {
  if (Cg) {
    let e = [];
    qi.addEventListener("message", (s) => {
      if (s.data && s.data.vscodeScheduleAsyncWork) for (let r = 0, n = e.length; r < n; r++) {
        let o = e[r];
        if (o.id === s.data.vscodeScheduleAsyncWork) {
          e.splice(r, 1), o.callback();
          return;
        }
      }
    });
    let t = 0;
    return (s) => {
      let r = ++t;
      e.push({ id: r, callback: s }), qi.postMessage({ vscodeScheduleAsyncWork: r }, "*");
    };
  }
  return (e) => setTimeout(e);
})();
var xg = !!(ei && ei.indexOf("Chrome") >= 0);
ei && ei.indexOf("Firefox") >= 0;
!xg && ei && ei.indexOf("Safari") >= 0;
ei && ei.indexOf("Edg/") >= 0;
ei && ei.indexOf("Android") >= 0;
function wc(e, t = 0, s) {
  let r = setTimeout(() => {
    e();
  }, t);
  return Ss(() => {
    clearTimeout(r);
  });
}
var Vl;
((e) => {
  async function t(r) {
    let n, o = await Promise.all(r.map((a) => a.then((l) => l, (l) => {
      n || (n = l);
    })));
    if (typeof n < "u") throw n;
    return o;
  }
  e.settled = t;
  function s(r) {
    return new Promise(async (n, o) => {
      try {
        await r(n, o);
      } catch (a) {
        o(a);
      }
    });
  }
  e.withAsyncBody = s;
})(Vl || (Vl = {}));
var ql = class Tt {
  static fromArray(t) {
    return new Tt((s) => {
      s.emitMany(t);
    });
  }
  static fromPromise(t) {
    return new Tt(async (s) => {
      s.emitMany(await t);
    });
  }
  static fromPromises(t) {
    return new Tt(async (s) => {
      await Promise.all(t.map(async (r) => s.emitOne(await r)));
    });
  }
  static merge(t) {
    return new Tt(async (s) => {
      await Promise.all(t.map(async (r) => {
        for await (let n of r) s.emitOne(n);
      }));
    });
  }
  constructor(t, s) {
    this._state = 0, this._results = [], this._error = null, this._onReturn = s, this._onStateChanged = new qt(), queueMicrotask(async () => {
      let r = { emitOne: (n) => this.emitOne(n), emitMany: (n) => this.emitMany(n), reject: (n) => this.reject(n) };
      try {
        await Promise.resolve(t(r)), this.resolve();
      } catch (n) {
        this.reject(n);
      } finally {
        r.emitOne = void 0, r.emitMany = void 0, r.reject = void 0;
      }
    });
  }
  [Symbol.asyncIterator]() {
    let t = 0;
    return { next: async () => {
      do {
        if (this._state === 2) throw this._error;
        if (t < this._results.length) return { done: !1, value: this._results[t++] };
        if (this._state === 1) return { done: !0, value: void 0 };
        await Rr.toPromise(this._onStateChanged.event);
      } while (!0);
    }, return: async () => {
      var s;
      return (s = this._onReturn) == null || s.call(this), { done: !0, value: void 0 };
    } };
  }
  static map(t, s) {
    return new Tt(async (r) => {
      for await (let n of t) r.emitOne(s(n));
    });
  }
  map(t) {
    return Tt.map(this, t);
  }
  static filter(t, s) {
    return new Tt(async (r) => {
      for await (let n of t) s(n) && r.emitOne(n);
    });
  }
  filter(t) {
    return Tt.filter(this, t);
  }
  static coalesce(t) {
    return Tt.filter(t, (s) => !!s);
  }
  coalesce() {
    return Tt.coalesce(this);
  }
  static async toPromise(t) {
    let s = [];
    for await (let r of t) s.push(r);
    return s;
  }
  toPromise() {
    return Tt.toPromise(this);
  }
  emitOne(t) {
    this._state === 0 && (this._results.push(t), this._onStateChanged.fire());
  }
  emitMany(t) {
    this._state === 0 && (this._results = this._results.concat(t), this._onStateChanged.fire());
  }
  resolve() {
    this._state === 0 && (this._state = 1, this._onStateChanged.fire());
  }
  reject(t) {
    this._state === 0 && (this._state = 2, this._error = t, this._onStateChanged.fire());
  }
};
ql.EMPTY = ql.fromArray([]);
var kg = class extends Ai {
  constructor(e) {
    super(), this._terminal = e, this._linesCacheTimeout = this._register(new Dr()), this._linesCacheDisposables = this._register(new Dr()), this._register(Ss(() => this._destroyLinesCache()));
  }
  initLinesCache() {
    this._linesCache || (this._linesCache = new Array(this._terminal.buffer.active.length), this._linesCacheDisposables.value = dc(this._terminal.onLineFeed(() => this._destroyLinesCache()), this._terminal.onCursorMove(() => this._destroyLinesCache()), this._terminal.onResize(() => this._destroyLinesCache()))), this._linesCacheTimeout.value = wc(() => this._destroyLinesCache(), 15e3);
  }
  _destroyLinesCache() {
    this._linesCache = void 0, this._linesCacheDisposables.clear(), this._linesCacheTimeout.clear();
  }
  getLineFromCache(e) {
    var t;
    return (t = this._linesCache) == null ? void 0 : t[e];
  }
  setLineInCache(e, t) {
    this._linesCache && (this._linesCache[e] = t);
  }
  translateBufferLineToStringWithWrap(e, t) {
    var s;
    let r = [], n = [0], o = this._terminal.buffer.active.getLine(e);
    for (; o; ) {
      let a = this._terminal.buffer.active.getLine(e + 1), l = a ? a.isWrapped : !1, c = o.translateToString(!l && t);
      if (l && a) {
        let h = o.getCell(o.length - 1);
        h && h.getCode() === 0 && h.getWidth() === 1 && ((s = a.getCell(0)) == null ? void 0 : s.getWidth()) === 2 && (c = c.slice(0, -1));
      }
      if (r.push(c), l) n.push(n[n.length - 1] + c.length);
      else break;
      e++, o = a;
    }
    return [r.join(""), n];
  }
}, Lg = class {
  get cachedSearchTerm() {
    return this._cachedSearchTerm;
  }
  set cachedSearchTerm(e) {
    this._cachedSearchTerm = e;
  }
  get lastSearchOptions() {
    return this._lastSearchOptions;
  }
  set lastSearchOptions(e) {
    this._lastSearchOptions = e;
  }
  isValidSearchTerm(e) {
    return !!(e && e.length > 0);
  }
  didOptionsChange(e) {
    return this._lastSearchOptions ? e ? this._lastSearchOptions.caseSensitive !== e.caseSensitive || this._lastSearchOptions.regex !== e.regex || this._lastSearchOptions.wholeWord !== e.wholeWord : !1 : !0;
  }
  shouldUpdateHighlighting(e, t) {
    return t != null && t.decorations ? this._cachedSearchTerm === void 0 || e !== this._cachedSearchTerm || this.didOptionsChange(t) : !1;
  }
  clearCachedTerm() {
    this._cachedSearchTerm = void 0;
  }
  reset() {
    this._cachedSearchTerm = void 0, this._lastSearchOptions = void 0;
  }
}, Mg = class {
  constructor(e, t) {
    this._terminal = e, this._lineCache = t;
  }
  find(e, t, s, r) {
    if (!e || e.length === 0) {
      this._terminal.clearSelection();
      return;
    }
    if (s > this._terminal.cols) throw new Error(`Invalid col: ${s} to search in terminal of ${this._terminal.cols} cols`);
    this._lineCache.initLinesCache();
    let n = { startRow: t, startCol: s }, o = this._findInLine(e, n, r);
    if (!o) for (let a = t + 1; a < this._terminal.buffer.active.baseY + this._terminal.rows && (n.startRow = a, n.startCol = 0, o = this._findInLine(e, n, r), !o); a++) ;
    return o;
  }
  findNextWithSelection(e, t, s) {
    if (!e || e.length === 0) {
      this._terminal.clearSelection();
      return;
    }
    let r = this._terminal.getSelectionPosition();
    this._terminal.clearSelection();
    let n = 0, o = 0;
    r && (s === e ? (n = r.end.x, o = r.end.y) : (n = r.start.x, o = r.start.y)), this._lineCache.initLinesCache();
    let a = { startRow: o, startCol: n }, l = this._findInLine(e, a, t);
    if (!l) for (let c = o + 1; c < this._terminal.buffer.active.baseY + this._terminal.rows && (a.startRow = c, a.startCol = 0, l = this._findInLine(e, a, t), !l); c++) ;
    if (!l && o !== 0) for (let c = 0; c < o && (a.startRow = c, a.startCol = 0, l = this._findInLine(e, a, t), !l); c++) ;
    return !l && r && (a.startRow = r.start.y, a.startCol = 0, l = this._findInLine(e, a, t)), l;
  }
  findPreviousWithSelection(e, t, s) {
    if (!e || e.length === 0) {
      this._terminal.clearSelection();
      return;
    }
    let r = this._terminal.getSelectionPosition();
    this._terminal.clearSelection();
    let n = this._terminal.buffer.active.baseY + this._terminal.rows - 1, o = this._terminal.cols, a = !0;
    this._lineCache.initLinesCache();
    let l = { startRow: n, startCol: o }, c;
    if (r && (l.startRow = n = r.start.y, l.startCol = o = r.start.x, s !== e && (c = this._findInLine(e, l, t, !1), c || (l.startRow = n = r.end.y, l.startCol = o = r.end.x))), c || (c = this._findInLine(e, l, t, a)), !c) {
      l.startCol = Math.max(l.startCol, this._terminal.cols);
      for (let h = n - 1; h >= 0 && (l.startRow = h, c = this._findInLine(e, l, t, a), !c); h--) ;
    }
    if (!c && n !== this._terminal.buffer.active.baseY + this._terminal.rows - 1) for (let h = this._terminal.buffer.active.baseY + this._terminal.rows - 1; h >= n && (l.startRow = h, c = this._findInLine(e, l, t, a), !c); h--) ;
    return c;
  }
  _isWholeWord(e, t, s) {
    return (e === 0 || " ~!@#$%^&*()+`-=[]{}|\\;:\"',./<>?".includes(t[e - 1])) && (e + s.length === t.length || " ~!@#$%^&*()+`-=[]{}|\\;:\"',./<>?".includes(t[e + s.length]));
  }
  _findInLine(e, t, s = {}, r = !1) {
    var n;
    let o = t.startRow, a = t.startCol;
    if ((n = this._terminal.buffer.active.getLine(o)) != null && n.isWrapped) {
      if (r) {
        t.startCol += this._terminal.cols;
        return;
      }
      return t.startRow--, t.startCol += this._terminal.cols, this._findInLine(e, t, s);
    }
    let l = this._lineCache.getLineFromCache(o);
    l || (l = this._lineCache.translateBufferLineToStringWithWrap(o, !0), this._lineCache.setLineInCache(o, l));
    let [c, h] = l, d = this._bufferColsToStringOffset(o, a), u = e, f = c;
    s.regex || (u = s.caseSensitive ? e : e.toLowerCase(), f = s.caseSensitive ? c : c.toLowerCase());
    let _ = -1;
    if (s.regex) {
      let g = RegExp(u, s.caseSensitive ? "g" : "gi"), y;
      if (r) for (; y = g.exec(f.slice(0, d)); ) _ = g.lastIndex - y[0].length, e = y[0], g.lastIndex -= e.length - 1;
      else y = g.exec(f.slice(d)), y && y[0].length > 0 && (_ = d + (g.lastIndex - y[0].length), e = y[0]);
    } else r ? d - u.length >= 0 && (_ = f.lastIndexOf(u, d - u.length)) : _ = f.indexOf(u, d);
    if (_ >= 0) {
      if (s.wholeWord && !this._isWholeWord(_, f, e)) return;
      let g = 0;
      for (; g < h.length - 1 && _ >= h[g + 1]; ) g++;
      let y = g;
      for (; y < h.length - 1 && _ + e.length >= h[y + 1]; ) y++;
      let D = _ - h[g], R = _ + e.length - h[y], H = this._stringLengthToBufferSize(o + g, D), M = this._stringLengthToBufferSize(o + y, R) - H + this._terminal.cols * (y - g);
      return { term: e, col: H, row: o + g, size: M };
    }
  }
  _stringLengthToBufferSize(e, t) {
    let s = this._terminal.buffer.active.getLine(e);
    if (!s) return 0;
    for (let r = 0; r < t; r++) {
      let n = s.getCell(r);
      if (!n) break;
      let o = n.getChars();
      o.length > 1 && (t -= o.length - 1);
      let a = s.getCell(r + 1);
      a && a.getWidth() === 0 && t++;
    }
    return t;
  }
  _bufferColsToStringOffset(e, t) {
    let s = e, r = 0, n = this._terminal.buffer.active.getLine(s);
    for (; t > 0 && n; ) {
      for (let o = 0; o < t && o < this._terminal.cols; o++) {
        let a = n.getCell(o);
        if (!a) break;
        a.getWidth() && (r += a.getCode() === 0 ? 1 : a.getChars().length);
      }
      if (s++, n = this._terminal.buffer.active.getLine(s), n && !n.isWrapped) break;
      t -= this._terminal.cols;
    }
    return r;
  }
}, Eg = class extends Ai {
  constructor(e) {
    super(), this._terminal = e, this._highlightDecorations = [], this._highlightedLines = /* @__PURE__ */ new Set(), this._register(Ss(() => this.clearHighlightDecorations()));
  }
  createHighlightDecorations(e, t) {
    this.clearHighlightDecorations();
    for (let s of e) {
      let r = this._createResultDecorations(s, t, !1);
      if (r) for (let n of r) this._storeDecoration(n, s);
    }
  }
  createActiveDecoration(e, t) {
    let s = this._createResultDecorations(e, t, !0);
    if (s) return { decorations: s, match: e, dispose() {
      $s(s);
    } };
  }
  clearHighlightDecorations() {
    $s(this._highlightDecorations), this._highlightDecorations = [], this._highlightedLines.clear();
  }
  _storeDecoration(e, t) {
    this._highlightedLines.add(e.marker.line), this._highlightDecorations.push({ decoration: e, match: t, dispose() {
      e.dispose();
    } });
  }
  _applyStyles(e, t, s) {
    e.classList.contains("xterm-find-result-decoration") || (e.classList.add("xterm-find-result-decoration"), t && (e.style.outline = `1px solid ${t}`)), s && e.classList.add("xterm-find-active-result-decoration");
  }
  _createResultDecorations(e, t, s) {
    let r = [], n = e.col, o = e.size, a = -this._terminal.buffer.active.baseY - this._terminal.buffer.active.cursorY + e.row;
    for (; o > 0; ) {
      let c = Math.min(this._terminal.cols - n, o);
      r.push([a, n, c]), n = 0, o -= c, a++;
    }
    let l = [];
    for (let c of r) {
      let h = this._terminal.registerMarker(c[0]), d = this._terminal.registerDecoration({ marker: h, x: c[1], width: c[2], backgroundColor: s ? t.activeMatchBackground : t.matchBackground, overviewRulerOptions: this._highlightedLines.has(h.line) ? void 0 : { color: s ? t.activeMatchColorOverviewRuler : t.matchOverviewRuler, position: "center" } });
      if (d) {
        let u = [];
        u.push(h), u.push(d.onRender((f) => this._applyStyles(f, s ? t.activeMatchBorder : t.matchBorder, !1))), u.push(d.onDispose(() => $s(u))), l.push(d);
      }
    }
    return l.length === 0 ? void 0 : l;
  }
}, Dg = class extends Ai {
  constructor() {
    super(...arguments), this._searchResults = [], this._onDidChangeResults = this._register(new qt());
  }
  get onDidChangeResults() {
    return this._onDidChangeResults.event;
  }
  get searchResults() {
    return this._searchResults;
  }
  get selectedDecoration() {
    return this._selectedDecoration;
  }
  set selectedDecoration(e) {
    this._selectedDecoration = e;
  }
  updateResults(e, t) {
    this._searchResults = e.slice(0, t);
  }
  clearResults() {
    this._searchResults = [];
  }
  clearSelectedDecoration() {
    this._selectedDecoration && (this._selectedDecoration.dispose(), this._selectedDecoration = void 0);
  }
  findResultIndex(e) {
    for (let t = 0; t < this._searchResults.length; t++) {
      let s = this._searchResults[t];
      if (s.row === e.row && s.col === e.col && s.size === e.size) return t;
    }
    return -1;
  }
  fireResultsChanged(e) {
    if (!e) return;
    let t = -1;
    this._selectedDecoration && (t = this.findResultIndex(this._selectedDecoration.match)), this._onDidChangeResults.fire({ resultIndex: t, resultCount: this._searchResults.length });
  }
  reset() {
    this.clearSelectedDecoration(), this.clearResults();
  }
}, Rg = class extends Ai {
  constructor(e) {
    super(), this._highlightTimeout = this._register(new Dr()), this._lineCache = this._register(new Dr()), this._state = new Lg(), this._resultTracker = this._register(new Dg()), this._highlightLimit = (e == null ? void 0 : e.highlightLimit) ?? 1e3;
  }
  get onDidChangeResults() {
    return this._resultTracker.onDidChangeResults;
  }
  activate(e) {
    this._terminal = e, this._lineCache.value = new kg(e), this._engine = new Mg(e, this._lineCache.value), this._decorationManager = new Eg(e), this._register(this._terminal.onWriteParsed(() => this._updateMatches())), this._register(this._terminal.onResize(() => this._updateMatches())), this._register(Ss(() => this.clearDecorations()));
  }
  _updateMatches() {
    var e;
    this._highlightTimeout.clear(), this._state.cachedSearchTerm && (e = this._state.lastSearchOptions) != null && e.decorations && (this._highlightTimeout.value = wc(() => {
      let t = this._state.cachedSearchTerm;
      this._state.clearCachedTerm(), this.findPrevious(t, { ...this._state.lastSearchOptions, incremental: !0 }, { noScroll: !0 });
    }, 200));
  }
  clearDecorations(e) {
    var t;
    this._resultTracker.clearSelectedDecoration(), (t = this._decorationManager) == null || t.clearHighlightDecorations(), this._resultTracker.clearResults(), e || this._state.clearCachedTerm();
  }
  clearActiveDecoration() {
    this._resultTracker.clearSelectedDecoration();
  }
  findNext(e, t, s) {
    if (!this._terminal || !this._engine) throw new Error("Cannot use addon until it has been loaded");
    this._state.lastSearchOptions = t, this._state.shouldUpdateHighlighting(e, t) && this._highlightAllMatches(e, t);
    let r = this._findNextAndSelect(e, t, s);
    return this._fireResults(t), this._state.cachedSearchTerm = e, r;
  }
  _highlightAllMatches(e, t) {
    if (!this._terminal || !this._engine || !this._decorationManager) throw new Error("Cannot use addon until it has been loaded");
    if (!this._state.isValidSearchTerm(e)) {
      this.clearDecorations();
      return;
    }
    this.clearDecorations(!0);
    let s = [], r, n = this._engine.find(e, 0, 0, t);
    for (; n && ((r == null ? void 0 : r.row) !== n.row || (r == null ? void 0 : r.col) !== n.col) && !(s.length >= this._highlightLimit); ) r = n, s.push(r), n = this._engine.find(e, r.col + r.term.length >= this._terminal.cols ? r.row + 1 : r.row, r.col + r.term.length >= this._terminal.cols ? 0 : r.col + 1, t);
    this._resultTracker.updateResults(s, this._highlightLimit), t.decorations && this._decorationManager.createHighlightDecorations(s, t.decorations);
  }
  _findNextAndSelect(e, t, s) {
    if (!this._terminal || !this._engine) return !1;
    if (!this._state.isValidSearchTerm(e)) return this._terminal.clearSelection(), this.clearDecorations(), !1;
    let r = this._engine.findNextWithSelection(e, t, this._state.cachedSearchTerm);
    return this._selectResult(r, t == null ? void 0 : t.decorations, s == null ? void 0 : s.noScroll);
  }
  findPrevious(e, t, s) {
    if (!this._terminal || !this._engine) throw new Error("Cannot use addon until it has been loaded");
    this._state.lastSearchOptions = t, this._state.shouldUpdateHighlighting(e, t) && this._highlightAllMatches(e, t);
    let r = this._findPreviousAndSelect(e, t, s);
    return this._fireResults(t), this._state.cachedSearchTerm = e, r;
  }
  _fireResults(e) {
    this._resultTracker.fireResultsChanged(!!(e != null && e.decorations));
  }
  _findPreviousAndSelect(e, t, s) {
    if (!this._terminal || !this._engine) return !1;
    if (!this._state.isValidSearchTerm(e)) return this._terminal.clearSelection(), this.clearDecorations(), !1;
    let r = this._engine.findPreviousWithSelection(e, t, this._state.cachedSearchTerm);
    return this._selectResult(r, t == null ? void 0 : t.decorations, s == null ? void 0 : s.noScroll);
  }
  _selectResult(e, t, s) {
    if (!this._terminal || !this._decorationManager) return !1;
    if (this._resultTracker.clearSelectedDecoration(), !e) return this._terminal.clearSelection(), !1;
    if (this._terminal.select(e.col, e.row, e.size), t) {
      let r = this._decorationManager.createActiveDecoration(e, t);
      r && (this._resultTracker.selectedDecoration = r);
    }
    if (!s && (e.row >= this._terminal.buffer.active.viewportY + this._terminal.rows || e.row < this._terminal.buffer.active.viewportY)) {
      let r = e.row - this._terminal.buffer.active.viewportY;
      r -= Math.floor(this._terminal.rows / 2), this._terminal.scrollLines(r);
    }
    return !0;
  }
};
function Tg({ images: e, onRemove: t }) {
  var s;
  const [r, n] = Q(null), o = ((s = e.find((a) => a.id === r)) == null ? void 0 : s.url) ?? null;
  return /* @__PURE__ */ W(Ot, { children: [
    /* @__PURE__ */ S("div", { className: "image-layer", children: e.map((a) => /* @__PURE__ */ W(
      "div",
      {
        className: "pasted-image",
        style: {
          top: `${a.topPx}px`,
          left: `${a.leftPx}px`,
          maxWidth: `${a.maxWidthPx}px`,
          display: a.visible ? "block" : "none"
        },
        children: [
          /* @__PURE__ */ S("img", { src: a.url, alt: "pasted", onClick: () => n(a.id) }),
          /* @__PURE__ */ S(
            "button",
            {
              className: "pasted-image-close",
              title: "Remove image",
              onClick: () => t(a.id),
              children: "×"
            }
          )
        ]
      },
      a.id
    )) }),
    o && /* @__PURE__ */ S("div", { className: "image-modal", onClick: () => n(null), children: /* @__PURE__ */ S("img", { src: o, alt: "pasted (enlarged)" }) })
  ] });
}
const Yl = "Consolas, ui-monospace, monospace", jl = 24, Bg = /[\s&()[\]{}^=;!'+,`~@#$%]/, wn = {
  matchBackground: "rgba(255, 221, 87, 0.28)",
  matchBorder: "rgba(255, 221, 87, 0.5)",
  matchOverviewRuler: "#ffdd57",
  activeMatchBackground: "rgba(255, 162, 0, 0.55)",
  activeMatchBorder: "#ffa200",
  activeMatchColorOverviewRuler: "#ffa200"
};
function Pg(e) {
  var t;
  const { ptyApi: s, theme: r, fontFamily: n = Yl, fontSize: o = 14, active: a = !1 } = e, l = Re(null), c = Re(null), h = Re(null), d = Re(e);
  d.current = e;
  const [u, f] = Q([]), [_, g] = Q(0), [y, D] = Q(
    null
  ), [, R] = yc((F) => F + 1, 0), H = Re(null), M = Re(null), [k, B] = Q(!1), [N, U] = Q(""), [ie, Z] = Q({ index: -1, count: 0 }), _e = Re(N);
  _e.current = N;
  const Y = Re(null), [v, p] = Q(!1), [w, m] = Q(""), [b, L] = Q(0), x = Re(!0), A = Re(!0), I = Re(null), se = () => {
    var F, $;
    (F = c.current) == null || F.scrollToTop(), ($ = c.current) == null || $.focus();
  }, he = () => {
    var F, $;
    (F = c.current) == null || F.scrollToBottom(), ($ = c.current) == null || $.focus();
  }, re = () => {
    const F = c.current, $ = I.current;
    !F || !$ || $.line < 0 || (F.scrollToLine($.line), F.focus());
  };
  me(() => {
    var F;
    const $ = l.current;
    if (!$) return;
    const V = new wf({
      theme: d.current.theme,
      fontFamily: d.current.fontFamily ?? Yl,
      fontSize: d.current.fontSize ?? 14,
      cursorBlink: !0,
      allowProposedApi: !0,
      scrollback: 5e3,
      drawBoldTextInBrightColors: !0
    });
    c.current = V;
    const we = new yf();
    h.current = we, V.loadAddon(we), V.loadAddon(
      new ig((P, ne) => {
        const xe = d.current.openLink;
        xe ? xe(ne) : window.open(ne, "_blank", "noopener");
      })
    ), V.open($);
    try {
      const P = new Xp();
      P.onContextLoss(() => P.dispose()), V.loadAddon(P);
    } catch {
    }
    const Ie = new Rg();
    V.loadAddon(Ie), H.current = Ie;
    const ii = Ie.onDidChangeResults(
      (P) => Z({ index: P.resultIndex, count: P.resultCount })
    );
    try {
      we.fit();
    } catch {
    }
    let Me = 0;
    const It = () => {
      Me || (Me = requestAnimationFrame(() => {
        Me = 0, c.current && R();
      }));
    }, _i = () => {
      const P = $.querySelector(".xterm-screen");
      if (P && V.rows > 0) {
        const ne = P.clientHeight / V.rows;
        ne > 0 && g(ne);
      }
    }, fi = (P) => {
      const ne = V.buffer.active, xe = ne.baseY + ne.cursorY, Xe = V.registerMarker(0), Ze = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      f((ft) => {
        const bi = [...ft, { id: Ze, url: P, marker: Xe, line: xe }];
        if (bi.length <= jl) return bi;
        const $o = bi.length - jl;
        return bi.slice(0, $o).forEach((Sc) => {
          var Ho;
          return (Ho = Sc.marker) == null ? void 0 : Ho.dispose();
        }), bi.slice($o);
      }), It();
    }, Xi = () => {
      var P;
      x.current = !1, (P = I.current) == null || P.dispose(), I.current = V.registerMarker(0) ?? null, It();
    }, Zs = s.onData((P) => V.write(P)), Zi = V.onData((P) => {
      P === "\r" && Xi();
      const ne = P.charCodeAt(0);
      ne >= 32 && ne !== 127 && (A.current = !1), s.write(P);
    }), Ji = V.onBinary((P) => s.write(P)), pi = (F = s.onExit) == null ? void 0 : F.call(s, (P) => {
      V.write(`\r
\x1B[2m[process exited with code ${P}]\x1B[0m\r
`);
    });
    s.resize(V.cols, V.rows);
    const Ni = V.onTitleChange((P) => {
      var ne, xe;
      return (xe = (ne = d.current).onTitle) == null ? void 0 : xe.call(ne, P);
    }), gi = V.onBell(() => {
      var P, ne;
      return (ne = (P = d.current).onBell) == null ? void 0 : ne.call(P);
    }), Qi = V.onScroll(() => It()), Ir = V.onRender(() => It()), Oi = V.parser.registerOscHandler(133, (P) => {
      var ne, xe;
      const Xe = P.split(";");
      if (Xe[0] === "A")
        x.current = !0, A.current = !0;
      else if (Xe[0] === "D") {
        const Ze = parseInt(Xe[1] ?? "0", 10) || 0, ft = parseInt(Xe[2] ?? "0", 10) || 0;
        (xe = (ne = d.current).onCommandFinished) == null || xe.call(ne, Ze, ft);
      }
      return !0;
    }), bs = () => {
      const P = V.getSelection();
      P && !P.includes(`
`) && U(P), p(!1), B(!0);
    }, vi = () => {
      B(!1), m(""), L(0), p(!0);
    };
    let Js = 0;
    const ys = () => {
      var P;
      const ne = performance.now();
      if (ne - Js < 300) return;
      Js = ne;
      const xe = d.current.readClipboardText;
      (xe ? xe().catch(() => null) : ((P = navigator.clipboard) == null ? void 0 : P.readText().catch(() => null)) ?? Promise.resolve(null)).then((Xe) => {
        if (Xe) {
          V.paste(Xe);
          return;
        }
        if (x.current) {
          const Ze = d.current.getClipboardImage;
          Ze && Ze().then((ft) => {
            ft && fi(ft);
          }).catch(() => {
          });
        } else {
          const Ze = d.current.saveClipboardImageToFile;
          Ze && Ze().then((ft) => {
            ft && s.write(ft + " ");
          }).catch(() => {
          });
        }
      });
    }, si = (P) => {
      var ne;
      const xe = d.current.copyText;
      xe ? xe(P) : (ne = navigator.clipboard) == null || ne.writeText(P).catch(() => {
      });
    }, es = V.onSelectionChange(() => {
      const P = V.getSelection();
      P && si(P);
    });
    V.attachCustomKeyEventHandler((P) => {
      var ne, xe, Xe, Ze, ft, bi;
      return P.type !== "keydown" ? !0 : P.key === "/" && !P.ctrlKey && !P.metaKey && !P.altKey && x.current && A.current ? (P.preventDefault(), vi(), !1) : (P.ctrlKey || P.metaKey) && !P.altKey ? P.shiftKey && (P.key === "p" || P.key === "P") ? (vi(), !1) : P.shiftKey && P.key === "Home" ? (P.preventDefault(), se(), !1) : P.shiftKey && (P.key === "End" || P.key === "ArrowDown") ? (P.preventDefault(), he(), !1) : P.shiftKey && P.key === "ArrowUp" ? (P.preventDefault(), re(), !1) : !P.shiftKey && (P.key === "c" || P.key === "C") && V.hasSelection() ? (P.preventDefault(), si(V.getSelection()), V.clearSelection(), !1) : !P.shiftKey && (P.key === "f" || P.key === "F") ? (bs(), !1) : P.key === "=" || P.key === "+" ? (P.preventDefault(), (xe = (ne = d.current).onZoom) == null || xe.call(ne, 1), !1) : P.key === "-" ? (P.preventDefault(), (Ze = (Xe = d.current).onZoom) == null || Ze.call(Xe, -1), !1) : P.key === "0" ? (P.preventDefault(), (bi = (ft = d.current).onResetZoom) == null || bi.call(ft), !1) : P.key === "v" || P.key === "V" ? (P.preventDefault(), ys(), !1) : !0 : !0;
    });
    const Qs = (P) => {
      P.preventDefault(), P.stopPropagation();
      const ne = V.getSelection();
      ne ? (si(ne), V.clearSelection()) : ys(), V.focus();
    };
    $.addEventListener("contextmenu", Qs, { capture: !0 });
    const mi = (P) => {
      P.button === 2 && (!(P.target instanceof Node) || !$.contains(P.target) || (P.stopPropagation(), P.preventDefault()));
    };
    window.addEventListener("mousedown", mi, { capture: !0 }), window.addEventListener("mouseup", mi, { capture: !0 }), window.addEventListener("auxclick", mi, { capture: !0 });
    const er = (P) => {
      P.preventDefault(), P.stopPropagation(), ys();
    };
    $.addEventListener("paste", er, { capture: !0 });
    let ts = 0, wi = null;
    const tr = (P, ne) => {
      window.clearTimeout(ts), (!wi || wi.mode !== P || wi.shiftable !== ne) && (wi = { mode: P, shiftable: ne }, D(wi)), ts = window.setTimeout(is, 180);
    }, is = () => {
      window.clearTimeout(ts), wi = null, D(null);
    }, E = (P, ne) => P && ne && !!d.current.resolveDropDir && x.current, C = (P) => {
      const ne = d.current.getFilePath;
      return !P || !ne ? [] : Array.from(P.files).map((xe) => {
        try {
          return ne(xe);
        } catch {
          return null;
        }
      }).filter((xe) => !!xe);
    }, z = (P) => Bg.test(P) ? `"${P}"` : P, J = (P) => {
      P.preventDefault(), P.stopPropagation(), P.dataTransfer && (P.dataTransfer.dropEffect = "copy");
      const ne = !!P.dataTransfer && Array.from(P.dataTransfer.types).includes("Files");
      tr(E(P.shiftKey, ne) ? "cd" : "path", E(!0, ne));
    }, Se = (P) => {
      var ne;
      P.preventDefault(), P.stopPropagation(), is();
      const xe = C(P.dataTransfer), Xe = d.current.resolveDropDir;
      if (xe.length && Xe && E(P.shiftKey, !0)) {
        Xe(xe).then((ft) => {
          ft && (V.paste(`cd ${z(ft)}`), Xi(), s.write("\r"), V.focus());
        }).catch(() => {
        });
        return;
      }
      const Ze = xe.length ? xe.map(z).join(" ") + " " : ((ne = P.dataTransfer) == null ? void 0 : ne.getData("text/plain")) ?? "";
      Ze && (V.paste(Ze), V.focus());
    };
    $.addEventListener("dragover", J, { capture: !0 }), $.addEventListener("drop", Se, { capture: !0 }), $.addEventListener("dragleave", is, { capture: !0 });
    let Ee = 0;
    const Ge = 100, Si = (P) => {
      var ne, xe, Xe, Ze;
      if (P.ctrlKey || P.metaKey) {
        for (P.preventDefault(), P.stopPropagation(), Ee += P.deltaMode === 1 ? P.deltaY * Ge : P.deltaY; Ee <= -Ge; )
          (xe = (ne = d.current).onZoom) == null || xe.call(ne, 1), Ee += Ge;
        for (; Ee >= Ge; )
          (Ze = (Xe = d.current).onZoom) == null || Ze.call(Xe, -1), Ee -= Ge;
      }
    };
    $.addEventListener("wheel", Si, { passive: !1, capture: !0 });
    let ss = 0;
    const Wo = new ResizeObserver(() => {
      cancelAnimationFrame(ss), ss = requestAnimationFrame(() => {
        if (c.current && !($.clientWidth === 0 || $.clientHeight === 0)) {
          try {
            we.fit();
          } catch {
          }
          s.resize(V.cols, V.rows), _i(), It();
        }
      });
    });
    return Wo.observe($), _i(), V.focus(), () => {
      cancelAnimationFrame(Me), cancelAnimationFrame(ss), $.removeEventListener("contextmenu", Qs, {
        capture: !0
      }), window.removeEventListener("mousedown", mi, {
        capture: !0
      }), window.removeEventListener("mouseup", mi, {
        capture: !0
      }), window.removeEventListener("auxclick", mi, {
        capture: !0
      }), $.removeEventListener("paste", er, {
        capture: !0
      }), window.clearTimeout(ts), $.removeEventListener("dragover", J, {
        capture: !0
      }), $.removeEventListener("drop", Se, { capture: !0 }), $.removeEventListener("dragleave", is, {
        capture: !0
      }), $.removeEventListener("wheel", Si, { capture: !0 }), Wo.disconnect(), Zs(), pi == null || pi(), Zi.dispose(), Ji.dispose(), Ni.dispose(), gi.dispose(), Qi.dispose(), Ir.dispose(), es.dispose(), Oi.dispose(), ii.dispose(), V.dispose(), c.current = null, h.current = null, H.current = null;
    };
  }, []), me(() => {
    var F;
    const $ = c.current;
    if (!$) return;
    $.options.theme = r, $.options.fontFamily = n, $.options.fontSize = o;
    const V = l.current;
    if (V && V.clientWidth > 0 && V.clientHeight > 0) {
      try {
        (F = h.current) == null || F.fit();
      } catch {
      }
      d.current.ptyApi.resize($.cols, $.rows);
      const we = V.querySelector(".xterm-screen");
      we && $.rows > 0 && g(we.clientHeight / $.rows);
    }
  }, [r, n, o]), me(() => {
    if (!a) return;
    const F = requestAnimationFrame(() => {
      var $;
      const V = c.current, we = l.current;
      if (!(!V || !we || we.clientWidth === 0 || we.clientHeight === 0)) {
        try {
          ($ = h.current) == null || $.fit();
        } catch {
        }
        d.current.ptyApi.resize(V.cols, V.rows), V.focus();
      }
    });
    return () => cancelAnimationFrame(F);
  }, [a]);
  const ce = Re(!0);
  me(() => {
    if (ce.current) {
      ce.current = !1;
      return;
    }
    !x.current || !A.current || d.current.ptyApi.write("\r");
  }, [e.promptRefreshToken]);
  const pe = (F, $) => {
    const V = H.current;
    if (V) {
      if (!F) {
        V.clearDecorations(), Z({ index: -1, count: 0 });
        return;
      }
      $ === "prev" ? V.findPrevious(F, { decorations: wn }) : V.findNext(F, {
        decorations: wn,
        incremental: $ === "incremental"
      });
    }
  }, ge = () => {
    var F, $;
    (F = H.current) == null || F.clearDecorations(), B(!1), Z({ index: -1, count: 0 }), ($ = c.current) == null || $.focus();
  };
  me(() => {
    var F;
    if (!k) return;
    const $ = M.current;
    $ == null || $.focus(), $ == null || $.select();
    const V = _e.current;
    V && ((F = H.current) == null || F.findNext(V, { decorations: wn, incremental: !0 }));
  }, [k]);
  const be = [
    {
      name: "clear",
      description: "Clear the terminal buffer and scrollback",
      run: () => {
        var F;
        return (F = c.current) == null ? void 0 : F.clear();
      }
    },
    {
      name: "commands",
      description: "Show every available Conduit command",
      run: () => {
        m(""), L(0);
      }
    },
    ...e.commands ?? []
  ], fe = w ? be.filter((F) => F.name.toLowerCase().includes(w.toLowerCase())) : be, ye = Math.min(b, Math.max(0, fe.length - 1)), ee = () => {
    var F;
    p(!1), m(""), L(0), (F = c.current) == null || F.focus();
  }, ve = (F) => {
    var $, V;
    if (F) {
      if (F.run(), F.name === "commands") {
        ($ = Y.current) == null || $.focus();
        return;
      }
      p(!1), m(""), L(0), F.name !== "clear" && x.current && s.write(`# /${F.name}\r`), (V = c.current) == null || V.focus();
    }
  };
  me(() => {
    var F;
    v && ((F = Y.current) == null || F.focus());
  }, [v]);
  const le = c.current, j = ((t = l.current) == null ? void 0 : t.clientWidth) ?? 800, G = le && _ > 0 ? u.map((F) => {
    const $ = le.buffer.active, V = F.marker ? F.marker.line : F.line, we = F.marker && F.marker.line < 0 ? -1 : V, Ie = we - $.viewportY, ii = we >= 0 && Ie > -60 && Ie < le.rows + 2;
    return {
      id: F.id,
      url: F.url,
      topPx: Ie * _ + 2,
      leftPx: 12,
      maxWidthPx: Math.max(140, j - 64),
      visible: ii
    };
  }) : [], Ce = (F) => f(($) => {
    var V, we;
    return (we = (V = $.find((Ie) => Ie.id === F)) == null ? void 0 : V.marker) == null || we.dispose(), $.filter((Ie) => Ie.id !== F);
  }), Oe = le == null ? void 0 : le.buffer.active, St = !!Oe && Oe.viewportY < Oe.baseY, T = !Oe || Oe.viewportY <= 0, q = I.current, te = q && q.line >= 0 ? q.line : -1, ke = !!le && !!Oe && te >= 0 && (te < Oe.viewportY || te >= Oe.viewportY + le.rows);
  return /* @__PURE__ */ W("div", { className: `terminal-host${y ? " drop-active" : ""}`, children: [
    /* @__PURE__ */ S("div", { className: "terminal-mount", ref: l }),
    /* @__PURE__ */ S(Tg, { images: G, onRemove: Ce }),
    y && // pointer-events: none (in CSS) — the overlay must never become the drag
    // target, or the drop would land on it instead of the terminal.
    /* @__PURE__ */ W("div", { className: "term-drop", children: [
      /* @__PURE__ */ S("span", { className: "term-drop-label", children: y.mode === "cd" ? "Drop to go there" : "Drop to insert path" }),
      y.mode === "path" && y.shiftable && /* @__PURE__ */ S("span", { className: "term-drop-sub", children: "hold Shift to cd there instead" })
    ] }),
    (St || ke) && /* @__PURE__ */ W("div", { className: "term-nav", children: [
      !T && /* @__PURE__ */ S(
        "button",
        {
          className: "term-nav-btn",
          title: "Jump to top (Ctrl+Shift+Home)",
          onClick: se,
          children: "⤒"
        }
      ),
      ke && /* @__PURE__ */ S(
        "button",
        {
          className: "term-nav-btn term-nav-btn-prompt",
          title: "Jump to last prompt (Ctrl+Shift+↑)",
          onClick: re,
          children: "❯"
        }
      ),
      St && /* @__PURE__ */ S(
        "button",
        {
          className: "term-nav-btn",
          title: "Jump to bottom (Ctrl+Shift+End)",
          onClick: he,
          children: "⤓"
        }
      )
    ] }),
    k && /* @__PURE__ */ W("div", { className: "term-search", children: [
      /* @__PURE__ */ S(
        "input",
        {
          ref: M,
          className: "term-search-input",
          placeholder: "Find",
          spellCheck: !1,
          value: N,
          onChange: (F) => {
            U(F.target.value), pe(F.target.value, "incremental");
          },
          onKeyDown: (F) => {
            F.key === "Enter" ? (F.preventDefault(), pe(N, F.shiftKey ? "prev" : "next")) : F.key === "Escape" && (F.preventDefault(), ge());
          }
        }
      ),
      /* @__PURE__ */ S("span", { className: "term-search-count", children: N ? ie.count > 0 ? `${ie.index + 1}/${ie.count}` : "No results" : "" }),
      /* @__PURE__ */ S(
        "button",
        {
          className: "term-search-btn",
          title: "Previous match (Shift+Enter)",
          onClick: () => pe(N, "prev"),
          children: "↑"
        }
      ),
      /* @__PURE__ */ S(
        "button",
        {
          className: "term-search-btn",
          title: "Next match (Enter)",
          onClick: () => pe(N, "next"),
          children: "↓"
        }
      ),
      /* @__PURE__ */ S("button", { className: "term-search-btn", title: "Close (Esc)", onClick: ge, children: "✕" })
    ] }),
    v && /* @__PURE__ */ W("div", { className: "term-cmd", children: [
      /* @__PURE__ */ W("div", { className: "term-cmd-field", children: [
        /* @__PURE__ */ S("span", { className: "term-cmd-prefix", children: "/" }),
        /* @__PURE__ */ S(
          "input",
          {
            ref: Y,
            className: "term-cmd-input",
            placeholder: "command",
            spellCheck: !1,
            value: w,
            onChange: (F) => {
              m(F.target.value.replace(/^\/+/, "")), L(0);
            },
            onKeyDown: (F) => {
              F.key === "Enter" ? (F.preventDefault(), ve(fe[ye])) : F.key === "Escape" || F.key === "Backspace" && w === "" ? (F.preventDefault(), ee()) : F.key === "ArrowDown" ? (F.preventDefault(), L(Math.min(ye + 1, fe.length - 1))) : F.key === "ArrowUp" && (F.preventDefault(), L(Math.max(ye - 1, 0)));
            }
          }
        )
      ] }),
      /* @__PURE__ */ S("ul", { className: "term-cmd-list", children: fe.length === 0 ? /* @__PURE__ */ S("li", { className: "term-cmd-empty", children: "No matching command" }) : fe.map((F, $) => /* @__PURE__ */ W(
        "li",
        {
          className: `term-cmd-item${$ === ye ? " active" : ""}`,
          onMouseEnter: () => L($),
          onMouseDown: (V) => {
            V.preventDefault(), ve(F);
          },
          children: [
            /* @__PURE__ */ W("span", { className: "term-cmd-name", children: [
              "/",
              F.name
            ] }),
            /* @__PURE__ */ S("span", { className: "term-cmd-desc", children: F.description })
          ]
        },
        F.name
      )) })
    ] })
  ] });
}
const Ag = 90, Ng = 0.8;
function Og({
  id: e,
  cwd: t,
  theme: s,
  fontSize: r,
  height: n,
  shell: o,
  terminalApi: a,
  onShellCwd: l,
  onHeightChange: c,
  onClose: h,
  copyText: d,
  openLink: u,
  getPathForFile: f
}) {
  const [_, g] = Q(!1), [y, D] = Q(null), R = Re(!1), H = Re(t);
  H.current = t;
  const M = Re(o);
  M.current = o;
  const k = Lt(
    () => ({
      onData: (U) => a.onData(e, U),
      write: (U) => a.write(e, U),
      resize: (U, ie) => {
        if (R.current) {
          a.resize(e, U, ie);
          return;
        }
        R.current = !0, a.start(e, H.current, U, ie, M.current);
      },
      onExit: (U) => a.onExit(e, U),
      kill: () => a.kill(e)
    }),
    [a, e]
  );
  me(() => a.onCwd(e, l), [a, e, l]), me(() => a.onExit(e, (U) => D(U)), [a, e]), me(() => {
    R.current && a.setCwd(e, t);
  }, [a, e, t]);
  const B = ae(
    (U) => {
      U.preventDefault(), g(!0);
      const ie = U.clientY, Z = n, _e = (v) => {
        const p = Z + (ie - v.clientY);
        c(
          Math.round(Math.min(window.innerHeight * Ng, Math.max(Ag, p)))
        );
      }, Y = () => {
        g(!1), window.removeEventListener("mousemove", _e), window.removeEventListener("mouseup", Y), document.body.style.cursor = "";
      };
      document.body.style.cursor = "row-resize", window.addEventListener("mousemove", _e), window.addEventListener("mouseup", Y);
    },
    [n, c]
  ), N = Lt(() => fd(s), [s]);
  return /* @__PURE__ */ W("div", { className: "dock", "data-dock-id": e, style: { height: n }, children: [
    /* @__PURE__ */ S(
      "div",
      {
        className: `divider divider--v${_ ? " divider--dragging" : ""}`,
        onMouseDown: B,
        role: "separator",
        "aria-orientation": "horizontal"
      }
    ),
    /* @__PURE__ */ W("div", { className: "dock__bar", children: [
      /* @__PURE__ */ W("span", { className: "dock__label", children: [
        /* @__PURE__ */ S(Yt, { name: "terminal" }),
        /* @__PURE__ */ S("span", { children: Pt(t) || t })
      ] }),
      /* @__PURE__ */ S("span", { className: "dock__spacer" }),
      y !== null && /* @__PURE__ */ W("span", { className: "dock__exit", children: [
        "shell exited (",
        y,
        ")"
      ] }),
      /* @__PURE__ */ S("button", { type: "button", className: "dock__close", title: "Hide terminal (Ctrl+`)", onClick: h, children: "✕" })
    ] }),
    /* @__PURE__ */ S("div", { className: "dock__term", children: /* @__PURE__ */ S(
      Pg,
      {
        ptyApi: k,
        theme: N,
        fontFamily: s.font.family,
        fontSize: r,
        active: !0,
        copyText: d,
        openLink: u,
        getFilePath: (U) => f(U) || null,
        readClipboardText: () => navigator.clipboard.readText().catch(() => null)
      }
    ) })
  ] });
}
function Ig(e) {
  const t = [`Folder: ${e.cwd}`];
  if (e.selection.length > 0) {
    t.push(`Selected (${e.selection.length}):`);
    for (const s of e.selection.slice(0, 60)) {
      const r = s.kind === "dir" ? "" : `, ${Xt(s.size)}`;
      t.push(
        `  - ${s.name} (${Gl(s)}${r}, modified ${new Date(s.modified).toISOString().slice(0, 10)})`
      );
    }
    e.selection.length > 60 && t.push(`  …and ${e.selection.length - 60} more`);
  } else {
    const s = e.visible.filter((o) => o.kind === "dir" || o.kind === "junction").length, r = e.visible.length - s;
    t.push(`Nothing selected. The folder shows ${s} folders and ${r} files.`);
    const n = e.visible.slice(0, 30).map((o) => o.name);
    n.length && t.push(`Names: ${n.join(", ")}${e.visible.length > 30 ? ", …" : ""}`);
  }
  return t.join(`
`);
}
const Fg = [
  "What is this folder for?",
  "Which of these look like duplicates?",
  "Suggest better names for the selected files",
  "What can I safely delete here?"
];
function zg({
  assistant: e,
  context: t,
  onClose: s
}) {
  const [r, n] = Q(""), [o, a] = Q(""), [l, c] = Q("idle"), [h, d] = Q(""), [u, f] = Q(!1), _ = Re(null), g = Re(null);
  me(() => () => {
    var R;
    return (R = _.current) == null ? void 0 : R.call(_);
  }, []), me(() => {
    const R = g.current;
    R && (R.scrollTop = R.scrollHeight);
  }, [o]);
  const y = (R) => {
    const H = R.trim();
    !H || l === "asking" || (a(""), d(""), c("asking"), _.current = e.ask(H, t, {
      onDelta: (M) => a((k) => k + M),
      onDone: () => c("done"),
      onError: (M) => {
        d(M), c("error");
      }
    }));
  }, D = l === "asking";
  return /* @__PURE__ */ W(
    Hs,
    {
      title: `Ask ${e.name}`,
      wide: !0,
      onClose: s,
      footer: /* @__PURE__ */ W(Ot, { children: [
        /* @__PURE__ */ S(
          "button",
          {
            type: "button",
            className: "btn",
            onClick: () => f((R) => !R),
            title: "Exactly what gets sent — paths and metadata only, never file contents",
            children: u ? "Hide context" : "Show context"
          }
        ),
        /* @__PURE__ */ S("span", { style: { flex: 1 } }),
        /* @__PURE__ */ S("button", { type: "button", className: "btn", onClick: s, children: "Close" }),
        /* @__PURE__ */ S(
          "button",
          {
            type: "button",
            className: "btn btn--primary",
            disabled: D || !r.trim(),
            onClick: () => y(r),
            children: D ? "Asking…" : "Ask"
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ S(
          "input",
          {
            className: "modal__input",
            autoFocus: !0,
            spellCheck: !1,
            placeholder: `Ask ${e.name} about ${t.selection.length || "this"} ${t.selection.length === 1 ? "item" : t.selection.length ? "items" : "folder"}…`,
            value: r,
            onChange: (R) => n(R.target.value),
            onKeyDown: (R) => {
              R.stopPropagation(), R.key === "Enter" && (R.preventDefault(), y(r));
            }
          }
        ),
        l === "idle" && /* @__PURE__ */ S("div", { className: "askv__chips", children: Fg.map((R) => /* @__PURE__ */ S(
          "button",
          {
            type: "button",
            className: "askv__chip",
            onClick: () => {
              n(R), y(R);
            },
            children: R
          },
          R
        )) }),
        u && /* @__PURE__ */ S("pre", { className: "askv__context", children: Ig(t) }),
        (o || D || h) && /* @__PURE__ */ S("div", { className: "askv__reply", ref: g, children: h ? /* @__PURE__ */ S("span", { className: "askv__error", children: h }) : /* @__PURE__ */ W(Ot, { children: [
          o,
          D && /* @__PURE__ */ S("span", { className: "askv__caret", children: "▋" })
        ] }) })
      ]
    }
  );
}
function Ug({
  fsApi: e,
  terminalApi: t,
  assistant: s,
  theme: r,
  settings: n,
  onSettingsChange: o,
  initialPath: a,
  onOpenSettings: l,
  onActivePathChange: c,
  commands: h
}) {
  const [d, u] = Q(() => Wg(n, a)), [f, _] = Q({}), [g, y] = Q({}), [D, R] = Q(/* @__PURE__ */ new Set()), [H, M] = Q(null), [k, B] = Q(null), [N, U] = Q(null), [ie, Z] = Q(null), [_e, Y] = Q(null), [v, p] = Q(/* @__PURE__ */ new Set()), [w, m] = Q(!1), [b, L] = Q(null), [x, A] = Q(null), [I, se] = Q(null), [he, re] = Q([]), [ce, pe] = Q([]), { ask: ge, confirm: be, choose: fe, node: ye } = Nc(), [ee, ve] = Q({}), le = ae((E) => {
    var C;
    (C = document.querySelector(`[data-pane-filter="${E}"]`)) == null || C.focus();
  }, []), j = Lt(
    () => d.tabs.find((E) => E.id === d.activeTabId) ?? d.tabs[0],
    [d]
  ), G = Lt(
    () => Ui(j.root, j.activePaneId) ?? Sn(j.root),
    [j]
  ), Ce = f[G.id] ?? { paths: [], cursor: null }, Oe = g[G.id] ?? { entries: [] }, St = Ti(j.root).length, T = Lt(
    () => Oe.entries.filter((E) => Ce.paths.includes(E.path)),
    [Oe.entries, Ce.paths]
  );
  me(() => c == null ? void 0 : c(G.path), [G.path, c]), me(() => {
    e.drives().then(re), e.knownFolders().then(pe);
  }, [e]), me(() => e.onOpProgress((E) => A(E.done ? null : E)), [e]), me(() => {
    e.undoLabel().then(se);
  }, [e, g]), me(() => {
    const E = setTimeout(() => o({ session: d }), 500);
    return () => clearTimeout(E);
  }, [d, o]);
  const q = ae((E, C = !1) => {
    L({ text: E, error: C }), setTimeout(() => L((z) => (z == null ? void 0 : z.text) === E ? null : z), 4200);
  }, []), te = ae(
    (E, C) => {
      var z, J;
      if (E.ok)
        C && q(C);
      else {
        const Se = (J = (z = E.failures) == null ? void 0 : z[0]) == null ? void 0 : J.error;
        q(Se ? `${E.error ?? "Failed"} — ${Se}` : E.error ?? "Failed", !0);
      }
      return se(E.undoLabel ?? null), E.ok;
    },
    [q]
  ), ke = ae(
    (E, C) => {
      u((z) => ({ ...z, tabs: z.tabs.map((J) => J.id === E ? C(J) : J) }));
    },
    []
  ), F = ae(
    (E, C) => {
      u((z) => ({
        ...z,
        tabs: z.tabs.map((J) => ({ ...J, root: bn(J.root, E, C) }))
      }));
    },
    []
  ), $ = ae(
    (E, C) => {
      F(E, (z) => Rc(z, C)), _((z) => ({ ...z, [E]: { paths: [], cursor: null } }));
    },
    [F]
  ), V = ae(
    (E) => {
      const C = ko(E ?? G.path), z = { id: Tr("t"), root: C, activePaneId: C.id };
      u((J) => ({ tabs: [...J.tabs, z], activeTabId: z.id }));
    },
    [G.path]
  ), we = ae((E) => {
    u((C) => {
      if (C.tabs.length === 1) return C;
      const z = C.tabs.findIndex((Ee) => Ee.id === E), J = C.tabs.filter((Ee) => Ee.id !== E), Se = C.activeTabId === E ? J[Math.min(z, J.length - 1)].id : C.activeTabId;
      return { tabs: J, activeTabId: Se };
    });
  }, []), Ie = ae(
    (E) => {
      ke(j.id, (C) => {
        const { tree: z, created: J } = Dc(C.root, C.activePaneId, E, G.path);
        return { ...C, root: z, activePaneId: J ? J.id : C.activePaneId };
      });
    },
    [ke, j.id, G.path]
  ), ii = ae(() => {
    if (St === 1) {
      we(j.id);
      return;
    }
    ke(j.id, (E) => {
      const C = yn(E.root, E.activePaneId);
      return C ? { ...E, root: C, activePaneId: Sn(C).id } : E;
    });
  }, [St, we, j.id, ke]), Me = ae(
    (E) => {
      j.activePaneId !== E && ke(j.id, (C) => ({ ...C, activePaneId: E }));
    },
    [j.activePaneId, j.id, ke]
  ), It = ae(
    (E, C, z) => {
      y((J) => {
        const Se = J[E];
        return Se && Se.listing === C && Se.entries === z ? J : { ...J, [E]: { listing: C, entries: z } };
      });
    },
    []
  ), _i = ae((E, C, z) => {
    _((J) => ({ ...J, [E]: { paths: C, cursor: z } }));
  }, []), fi = ae(
    async (E, C, z) => {
      const J = await e.conflicts(E, C);
      return J.length === 0 ? "keepBoth" : await fe({
        title: `${J.length} item${J.length === 1 ? "" : "s"} already there`,
        message: `${Pt(C)} already contains these. What should ${z} do?`,
        items: J,
        choices: [
          { id: "keepBoth", label: "Keep both", primary: !0, hint: 'Adds " (2)" to the incoming copy. Nothing is lost.' },
          { id: "skip", label: "Skip", hint: "Leaves the existing files alone and transfers only the rest." },
          { id: "overwrite", label: "Overwrite", danger: !0, hint: "Replaces the existing files. This cannot be undone." }
        ]
      }) ?? null;
    },
    [e, fe]
  ), Xi = ae(
    async (E) => {
      const C = await e.open(E.path);
      C.ok || q(C.error ?? `Could not open ${E.name}`, !0);
    },
    [e, q]
  ), Zs = ae(
    async (E, C, z) => {
      const J = await fi(E, C, z ? "the copy" : "the move");
      if (!J) return;
      const Se = z ? await e.copy(E, C, J) : await e.move(E, C, J);
      te(Se, `${z ? "Copied" : "Moved"} ${E.length} to ${Pt(C)}`);
    },
    [e, te, fi]
  ), Zi = ae(() => {
    Ce.paths.length !== 0 && (e.clipboardCopyPaths(Ce.paths), R(/* @__PURE__ */ new Set()), q(`Copied ${Ce.paths.length} item(s)`));
  }, [e, Ce.paths, q]), Ji = ae(() => {
    Ce.paths.length !== 0 && (e.clipboardCutPaths(Ce.paths), R(new Set(Ce.paths)), q(`Cut ${Ce.paths.length} item(s)`));
  }, [e, Ce.paths, q]), pi = ae(async () => {
    const E = await e.clipboardReadPaths();
    if (E.paths.length === 0) {
      q("Clipboard is empty", !0);
      return;
    }
    const C = await fi(E.paths, G.path, "the paste");
    if (!C) return;
    const z = E.cut ? await e.move(E.paths, G.path, C) : await e.copy(E.paths, G.path, C);
    E.cut && R(/* @__PURE__ */ new Set()), te(z, `${E.cut ? "Moved" : "Copied"} ${E.paths.length} item(s) here`);
  }, [e, G.path, te, q, fi]), Ni = ae(
    async (E) => {
      const C = Ce.paths;
      if (C.length === 0) return;
      const z = n.deleteToTrash && !E;
      if ((n.confirmDelete || !z) && !await be({
        title: z ? "Move to Recycle Bin" : "Delete permanently",
        message: z ? `Move ${C.length} item${C.length === 1 ? "" : "s"} to the Recycle Bin?` : `Permanently delete ${C.length} item${C.length === 1 ? "" : "s"}? This cannot be undone.`,
        items: C.map((Ee) => Pt(Ee)),
        confirmLabel: z ? "Move to Bin" : "Delete forever",
        danger: !z
      }))
        return;
      const J = await e.remove(C, z);
      _i(G.id, [], null), te(J, z ? `${C.length} item(s) in the Recycle Bin` : void 0);
    },
    [Ce.paths, n.deleteToTrash, n.confirmDelete, be, e, _i, G.id, te]
  ), gi = ae(async () => {
    var z;
    const E = await ge({
      title: "New folder",
      label: `In ${G.path}`,
      initial: "New folder",
      confirmLabel: "Create"
    });
    if (!E) return;
    const C = await e.mkdir(G.path, E);
    te(C) && ((z = C.affected) != null && z[0]) && (_i(G.id, C.affected, C.affected[0]), M(C.affected[0]));
  }, [ge, G.path, G.id, e, te, _i]), Qi = ae(async () => {
    const E = await ge({
      title: "New file",
      label: `In ${G.path}`,
      initial: "untitled.txt",
      confirmLabel: "Create",
      selectStem: !0
    });
    E && te(await e.newFile(G.path, E));
  }, [ge, G.path, e, te]), Ir = ae(
    async (E, C) => {
      M(null), te(await e.rename(E, C));
    },
    [e, te]
  ), Oi = ae(async () => {
    const E = await e.undo();
    E.ok ? q("Undone") : q(E.error ?? "Nothing to undo", !0), se(E.undoLabel ?? null);
  }, [e, q]), bs = ae(
    async (E) => {
      const C = Tc(j.root, G.id);
      if (!C) {
        q("Split the tab first (Ctrl+\\) to transfer between panes", !0);
        return;
      }
      if (Ce.paths.length === 0) return;
      const z = Ui(j.root, C);
      if (!z) return;
      const J = await fi(
        Ce.paths,
        z.path,
        E ? "the copy" : "the move"
      );
      if (!J) return;
      const Se = E ? await e.copy(Ce.paths, z.path, J) : await e.move(Ce.paths, z.path, J);
      te(
        Se,
        `${E ? "Copied" : "Moved"} ${Ce.paths.length} to ${Pt(z.path)}`
      );
    },
    [j.root, G.id, Ce.paths, e, te, q, fi]
  ), vi = ae(() => {
    const E = G.path;
    if (n.pinned.some((C) => C.path.toLowerCase() === E.toLowerCase())) {
      q("Already pinned");
      return;
    }
    o({ pinned: [...n.pinned, { name: Pt(E) || E, path: E }] });
  }, [G.path, n.pinned, o, q]), Js = ae(
    (E) => {
      o({ pinned: n.pinned.filter((C) => C.path !== E) });
    },
    [n.pinned, o]
  ), ys = ae(
    (E) => $(G.id, E),
    [$, G.id]
  ), si = ae(() => {
    o({ terminalVisible: !n.terminalVisible });
  }, [o, n.terminalVisible]), es = ae((E) => {
    p((C) => {
      const z = new Set(C);
      return z.has(E) ? z.delete(E) : z.add(E), z;
    });
  }, []), Qs = Lt(() => {
    const E = [
      { label: "New tab", hint: "Ctrl+T", run: () => V() },
      { label: "Close tab", hint: "Ctrl+W", run: () => we(j.id) },
      { label: "Split pane right", hint: "Ctrl+\\", run: () => Ie("h") },
      { label: "Split pane down", hint: "Ctrl+Shift+\\", run: () => Ie("v") },
      { label: "Close pane", run: ii },
      { label: "New folder", hint: "Ctrl+N", run: () => void gi() },
      { label: "New file", run: () => void Qi() },
      { label: "Search in this folder", hint: "Ctrl+Shift+F", run: () => es(G.id) },
      {
        label: `Switch to ${G.viewMode === "grid" ? "details" : "grid"} view`,
        run: () => F(G.id, (C) => ({
          ...C,
          viewMode: C.viewMode === "grid" ? "details" : "grid"
        }))
      },
      { label: "Batch rename selection", hint: "Shift+F2", run: () => Y(T) },
      { label: "Copy paths to clipboard", run: () => e.copyText(Ce.paths.join(`\r
`)) },
      ...t ? [
        {
          label: `${n.terminalVisible ? "Hide" : "Show"} the docked terminal`,
          hint: "Ctrl+`",
          run: si
        }
      ] : [],
      ...s ? [
        {
          label: `Ask ${s.name} about the selection`,
          hint: "Ctrl+Shift+A",
          run: () => m(!0)
        }
      ] : [],
      { label: "Open in Windows Terminal", run: () => void e.openTerminalAt(G.path) },
      { label: "Reveal in File Explorer", run: () => void e.revealInExplorer(G.path) },
      { label: "Pin this folder", run: vi },
      { label: `${n.showHidden ? "Hide" : "Show"} hidden items`, hint: "Ctrl+H", run: () => o({ showHidden: !n.showHidden }) },
      { label: `${n.previewVisible ? "Hide" : "Show"} preview pane`, run: () => o({ previewVisible: !n.previewVisible }) },
      { label: `${n.sidebarVisible ? "Hide" : "Show"} sidebar`, run: () => o({ sidebarVisible: !n.sidebarVisible }) },
      { label: `${n.showFolderSizes ? "Stop showing" : "Show"} real folder sizes`, run: () => o({ showFolderSizes: !n.showFolderSizes }) },
      { label: "Undo last file operation", hint: "Ctrl+Z", run: () => void Oi() }
    ];
    return l && E.push({ label: "Settings", hint: "Ctrl+,", run: l }), [
      ...E.map((C, z) => ({ id: `cmd${z}`, ...C })),
      ...h ?? []
    ];
  }, [
    j.id,
    G.id,
    G.path,
    T,
    Ce.paths,
    n.showHidden,
    n.previewVisible,
    n.sidebarVisible,
    n.showFolderSizes,
    n.terminalVisible,
    t,
    si,
    s,
    G.viewMode,
    F,
    V,
    we,
    Ie,
    ii,
    gi,
    Qi,
    vi,
    Oi,
    o,
    l,
    e,
    h
  ]), mi = Lt(() => {
    const E = /* @__PURE__ */ new Set(), C = [], z = (J, Se, Ee) => {
      const Ge = Se.toLowerCase();
      E.has(Ge) || (E.add(Ge), C.push({ id: Ge, label: Se, hint: Ee, run: () => $(G.id, Se) }));
    };
    for (const J of n.pinned) z(J.name, J.path, "pinned");
    for (const J of ce) z(J.name, J.path, "quick access");
    for (const J of he) z(J.label, J.path, "drive");
    for (const J of Ti(j.root))
      for (const Se of [...J.history].reverse()) z(Pt(Se), Se, "recent");
    for (const J of Oe.entries)
      J.kind === "dir" && z(J.name, J.path, "here");
    return C;
  }, [n.pinned, ce, he, j.root, Oe.entries, $, G.id]), er = ae(
    async (E) => {
      if (E.trim().length < 2) return [];
      const C = await e.resolvePath(E, G.path);
      return C ? [
        {
          id: `typed:${C}`,
          label: C,
          hint: "go",
          run: () => $(G.id, C)
        }
      ] : [];
    },
    [e, G.path, G.id, $]
  );
  me(() => {
    const E = (C) => {
      const z = C.target, J = z instanceof HTMLInputElement || z instanceof HTMLTextAreaElement || z instanceof HTMLSelectElement;
      if (N || _e || ie || w) return;
      const Se = C.ctrlKey || C.metaKey;
      if (Se && C.code === "Backslash")
        return C.preventDefault(), Ie(C.shiftKey ? "v" : "h");
      if (Se && C.code === "Backquote" && t)
        return C.preventDefault(), si();
      if (Se && !C.shiftKey && /^Digit[1-9]$/.test(C.code)) {
        const Ge = Ti(j.root)[Number(C.code.slice(5)) - 1];
        if (Ge)
          return C.preventDefault(), Me(Ge.id);
      }
      if (Se && !C.shiftKey) {
        switch (C.key.toLowerCase()) {
          case "t":
            return C.preventDefault(), V();
          case "w":
            return C.preventDefault(), we(j.id);
          case "p":
            return C.preventDefault(), U("paths");
          case "f":
            return C.preventDefault(), le(G.id);
          case "r":
            return C.preventDefault(), ve((Ee) => ({ ...Ee, [G.id]: (Ee[G.id] ?? 0) + 1 }));
          case "0":
            return C.preventDefault(), o({ fontSizeOffset: 0 });
          case "=":
          case "+":
            return C.preventDefault(), o({ fontSizeOffset: Math.min(8, n.fontSizeOffset + 1) });
          case "-":
            return C.preventDefault(), o({ fontSizeOffset: Math.max(-3, n.fontSizeOffset - 1) });
          case ",":
            return C.preventDefault(), l == null ? void 0 : l();
        }
        if (!J)
          switch (C.key.toLowerCase()) {
            case "n":
              return C.preventDefault(), void gi();
            case "h":
              return C.preventDefault(), o({ showHidden: !n.showHidden });
            case "z":
              return C.preventDefault(), void Oi();
            case "c":
              return C.preventDefault(), Zi();
            case "x":
              return C.preventDefault(), Ji();
            case "v":
              return C.preventDefault(), void pi();
          }
      }
      if (Se && C.shiftKey)
        switch (C.key.toLowerCase()) {
          case "p":
            return C.preventDefault(), U("actions");
          case "f":
            return C.preventDefault(), es(G.id);
          case "a":
            if (!s) break;
            return C.preventDefault(), m(!0);
        }
      if (Se && C.key === "Tab") {
        C.preventDefault();
        const Ee = d.tabs.findIndex((Si) => Si.id === j.id), Ge = d.tabs[(Ee + (C.shiftKey ? -1 : 1) + d.tabs.length) % d.tabs.length];
        return u((Si) => ({ ...Si, activeTabId: Ge.id }));
      }
      if (!J) {
        if (C.altKey && C.key === "ArrowLeft")
          return C.preventDefault(), F(G.id, Vo);
        if (C.altKey && C.key === "ArrowRight")
          return C.preventDefault(), F(G.id, qo);
        switch (C.key) {
          case "Backspace": {
            C.preventDefault(), e.parentOf(G.path).then((Ee) => Ee && $(G.id, Ee));
            return;
          }
          case "Delete":
            return C.preventDefault(), void Ni(C.shiftKey);
          case "F2":
            if (C.preventDefault(), C.shiftKey) {
              T.length > 0 && Y(T);
              return;
            }
            Ce.cursor && M(Ce.cursor);
            return;
          case "F5":
            return C.preventDefault(), void bs(!0);
          case "F6":
            return C.preventDefault(), void bs(!1);
          case " ":
            Ce.cursor && (C.preventDefault(), Z(Ce.cursor));
            return;
          case "Escape":
            R(/* @__PURE__ */ new Set());
            return;
        }
      }
    };
    return window.addEventListener("keydown", E), () => window.removeEventListener("keydown", E);
  }, [
    N,
    _e,
    ie,
    w,
    j.id,
    G.id,
    G.path,
    d.tabs,
    n.showHidden,
    n.fontSizeOffset,
    T,
    Ce.cursor,
    j.root,
    V,
    we,
    gi,
    Oi,
    Ie,
    Zi,
    Ji,
    pi,
    Ni,
    bs,
    es,
    F,
    $,
    Me,
    le,
    o,
    l,
    e,
    t,
    si,
    s
  ]);
  const ts = ae(
    (E, C, z) => {
      var ss;
      E.preventDefault(), E.stopPropagation(), Me(z);
      const J = C ? ((ss = f[z]) == null ? void 0 : ss.paths) ?? [C.path] : [], Se = J.length > 1, Ee = Ui(j.root, z), Ge = (Ee == null ? void 0 : Ee.path) ?? G.path, Si = C ? [
        { label: "Open", accel: "Enter", onClick: () => C.kind === "dir" ? $(z, C.path) : void Xi(C) },
        { label: "Open in new tab", onClick: () => V(C.kind === "dir" ? C.path : Ge) },
        { separator: !0, label: "" },
        { label: "Cut", accel: "Ctrl+X", onClick: Ji },
        { label: "Copy", accel: "Ctrl+C", onClick: Zi },
        { label: "Paste", accel: "Ctrl+V", onClick: () => void pi() },
        { separator: !0, label: "" },
        { label: Se ? `Batch rename ${J.length}` : "Rename", accel: Se ? "Shift+F2" : "F2", onClick: () => Se ? Y(T) : M(C.path) },
        ...s ? [{ label: `Ask ${s.name} about this`, accel: "Ctrl+Shift+A", onClick: () => m(!0) }] : [],
        { label: "Copy path", onClick: () => e.copyText(J.join(`\r
`)) },
        { label: "Reveal in File Explorer", onClick: () => void e.revealInExplorer(C.path) },
        { separator: !0, label: "" },
        { label: n.deleteToTrash ? "Move to Recycle Bin" : "Delete", accel: "Del", danger: !0, onClick: () => void Ni(!1) },
        { label: "Delete permanently", accel: "Shift+Del", danger: !0, onClick: () => void Ni(!0) }
      ] : [
        { label: "New folder", accel: "Ctrl+N", onClick: () => void gi() },
        { label: "New file", onClick: () => void Qi() },
        { separator: !0, label: "" },
        { label: "Paste", accel: "Ctrl+V", onClick: () => void pi() },
        { separator: !0, label: "" },
        { label: "Split pane right", accel: "Ctrl+\\", onClick: () => Ie("h") },
        { label: "Split pane down", onClick: () => Ie("v") },
        { separator: !0, label: "" },
        { label: "Open in Windows Terminal", onClick: () => void e.openTerminalAt(Ge) },
        { label: "Reveal in File Explorer", onClick: () => void e.revealInExplorer(Ge) },
        { label: "Pin this folder", onClick: vi }
      ];
      B({ x: E.clientX, y: E.clientY, items: Si });
    },
    [Me, f, j.root, G.path, $, Xi, V, Ji, Zi, pi, T, e, n.deleteToTrash, Ni, gi, Qi, Ie, vi, s]
  ), wi = (E) => /* @__PURE__ */ S(
    rd,
    {
      leaf: E,
      active: E.id === j.activePaneId,
      multi: St > 1,
      settings: n,
      fsApi: e,
      selection: f[E.id] ?? { paths: [], cursor: null },
      cutPaths: D,
      renaming: H,
      searchOpen: v.has(E.id),
      onActivate: () => Me(E.id),
      onNavigate: (C) => $(E.id, C),
      onBack: () => F(E.id, Vo),
      onForward: () => F(E.id, qo),
      onUp: () => void e.parentOf(E.path).then((C) => C && $(E.id, C)),
      onSort: (C) => F(E.id, (z) => ({
        ...z,
        sortKey: C,
        // Clicking the active column flips direction; a new column starts ascending.
        sortDir: z.sortKey === C && z.sortDir === "asc" ? "desc" : "asc"
      })),
      onToggleView: () => F(E.id, (C) => ({ ...C, viewMode: C.viewMode === "grid" ? "details" : "grid" })),
      onFilterChange: (C) => F(E.id, (z) => ({ ...z, filter: C })),
      onSelectionChange: (C, z) => _i(E.id, C, z),
      onListing: It,
      onOpenFile: (C) => void Xi(C),
      onContextMenu: (C, z) => ts(C, z, E.id),
      onDropPaths: (C, z, J) => void Zs(C, z, J),
      onRenameCommit: (C, z) => void Ir(C, z),
      onRenameCancel: () => M(null),
      onCloseSearch: () => es(E.id),
      refreshKey: ee[E.id] ?? 0,
      onRefresh: () => ve((C) => ({ ...C, [E.id]: (C[E.id] ?? 0) + 1 }))
    },
    E.id
  ), tr = Oe.entries.reduce((E, C) => E + C.size, 0), is = T.reduce((E, C) => E + C.size, 0);
  return /* @__PURE__ */ W("div", { className: "body", children: [
    n.sidebarVisible && /* @__PURE__ */ S(
      ld,
      {
        pinned: n.pinned,
        known: ce,
        drives: he,
        currentPath: G.path,
        onNavigate: (E) => $(G.id, E),
        onPin: vi,
        onUnpin: Js,
        onDropPaths: (E, C, z) => void Zs(E, C, z)
      }
    ),
    /* @__PURE__ */ W("div", { className: "main", children: [
      /* @__PURE__ */ S(
        cd,
        {
          tabs: d.tabs,
          activeTabId: j.id,
          onSelect: (E) => u((C) => ({ ...C, activeTabId: E })),
          onClose: we,
          onNew: () => V()
        }
      ),
      /* @__PURE__ */ W("div", { style: { display: "flex", flex: 1, minHeight: 0 }, children: [
        /* @__PURE__ */ S("div", { style: { display: "flex", flex: 1, minWidth: 0, minHeight: 0 }, children: /* @__PURE__ */ S(
          xn,
          {
            node: j.root,
            renderLeaf: wi,
            onRatioChange: (E, C) => ke(j.id, (z) => ({ ...z, root: Cn(z.root, E, C) }))
          }
        ) }),
        n.previewVisible && /* @__PURE__ */ S(
          od,
          {
            fsApi: e,
            path: Ce.cursor,
            multiCount: Ce.paths.length
          }
        )
      ] }),
      t && n.terminalVisible && /* @__PURE__ */ S(
        Og,
        {
          id: j.id,
          cwd: G.path,
          theme: r,
          fontSize: Math.max(9, r.font.size + n.fontSizeOffset),
          height: n.terminalHeight,
          shell: n.shell,
          terminalApi: t,
          onShellCwd: ys,
          onHeightChange: (E) => o({ terminalHeight: E }),
          onClose: si,
          copyText: e.copyText,
          openLink: (E) => window.open(E, "_blank"),
          getPathForFile: e.getPathForFile
        },
        j.id
      ),
      /* @__PURE__ */ W("div", { className: "statusbar", children: [
        /* @__PURE__ */ W("span", { children: [
          Oe.entries.length,
          " item",
          Oe.entries.length === 1 ? "" : "s"
        ] }),
        T.length > 0 && /* @__PURE__ */ W("span", { className: "statusbar__accent", children: [
          T.length,
          " selected · ",
          Xt(is)
        ] }),
        T.length === 0 && tr > 0 && /* @__PURE__ */ S("span", { children: Xt(tr) }),
        /* @__PURE__ */ S("span", { className: "statusbar__spacer" }),
        b && /* @__PURE__ */ S("span", { className: b.error ? "statusbar__error" : "statusbar__toast", children: b.text }),
        x && /* @__PURE__ */ W("span", { children: [
          x.kind,
          " ",
          x.fraction >= 0 ? `${Math.round(x.fraction * 100)}%` : ""
        ] }),
        I && /* @__PURE__ */ W("button", { type: "button", onClick: () => void Oi(), title: "Ctrl+Z", children: [
          "Undo: ",
          I
        ] }),
        x && x.fraction >= 0 && /* @__PURE__ */ S("div", { className: "progressline", style: { width: `${x.fraction * 100}%` } })
      ] })
    ] }),
    k && /* @__PURE__ */ S(Ac, { x: k.x, y: k.y, items: k.items, onClose: () => B(null) }),
    N === "paths" && /* @__PURE__ */ S(
      jo,
      {
        placeholder: "Go to folder — type a name or paste a path",
        items: mi,
        resolveExtra: er,
        onClose: () => U(null)
      }
    ),
    N === "actions" && /* @__PURE__ */ S(
      jo,
      {
        placeholder: "Run a command",
        items: Qs,
        onClose: () => U(null)
      }
    ),
    ie && /* @__PURE__ */ S(ad, { fsApi: e, path: ie, onClose: () => Z(null) }),
    w && s && /* @__PURE__ */ S(
      zg,
      {
        assistant: s,
        context: {
          cwd: G.path,
          selection: T,
          visible: Oe.entries
        },
        onClose: () => m(!1)
      }
    ),
    _e && _e.length > 0 && /* @__PURE__ */ S(
      Fc,
      {
        entries: _e,
        onClose: () => Y(null),
        onApply: (E) => {
          Y(null), e.renameMany(E).then((C) => te(C, `Renamed ${E.length} item(s)`));
        }
      }
    ),
    ye
  ] });
}
function Wg(e, t) {
  const s = e.session;
  if (s && Array.isArray(s.tabs) && s.tabs.length > 0 && s.tabs.every((a) => (a == null ? void 0 : a.root) && typeof a.id == "string") && s.tabs.some((a) => a.id === s.activeTabId)) return s;
  const n = ko(t), o = { id: Tr("t"), root: n, activePaneId: n.id };
  return { tabs: [o], activeTabId: o.id };
}
export {
  Ug as Explorer
};
