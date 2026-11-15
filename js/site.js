// Site runtime: scroll reveals, scroll direction, scroll/click interactions, parallax,
// dropdowns, tabs and slideshows. These are the replica's Next.js client components,
// run once on load with tiny stand-ins for the React and Next hooks they import.
(function () {
  const hooks = {
    usePathname: () => location.pathname,
    useEffect: (effect) => effect(),
  };
  const runtime = {
    i: () => hooks, // module imports (react, next/navigation)
    r: () => hooks,
    s: (exports) =>
      exports
        .filter((x) => typeof x === "function")
        .forEach((component) => component()),
  };
  ((t) => {
    "use strict";
    var e = t.i(18566),
      o = t.i(71645);
    t.s([
      "default",
      0,
      function () {
        let t = (0, e.usePathname)();
        return (
          (0, o.useEffect)(() => {
            if (!document.querySelector("[data-scrolldir]")) return;
            let t = document.documentElement,
              e = window.scrollY,
              o = e,
              r = null,
              i = () => {
                let i = window.scrollY;
                if (i < 0 || i > t.scrollHeight - window.innerHeight) return;
                let l = i < e ? "up" : "down";
                if (((e = i), l !== r)) {
                  (r = l), (o = i);
                  return;
                }
                if (!(4 > Math.abs(i - o)) && t.dataset.scrollDir !== l)
                  for (let e of ((t.dataset.scrollDir = l),
                  document.querySelectorAll(
                    `[data-scrolldir-once][data-scrolldir-on="${l}"]`,
                  )))
                    e.setAttribute("data-scrolldir-held", "");
              };
            return (
              window.addEventListener("scroll", i, { passive: !0 }),
              () => {
                window.removeEventListener("scroll", i),
                  delete t.dataset.scrollDir;
              }
            );
          }, [t]),
          (0, o.useEffect)(() => {
            let t = Array.from(
              document.querySelectorAll('[data-motion="reveal"]'),
            );
            if (0 === t.length) return;
            let e = () => {
              for (let e of t) {
                let t = (function (t) {
                  let e = t.getBoundingClientRect();
                  if (0 === e.width && 0 === e.height) return null;
                  let [, o = 0] = getComputedStyle(t)
                    .translate.split(" ")
                    .map((t) => parseFloat(t) || 0);
                  return { top: e.top - o, bottom: e.bottom - o };
                })(e);
                t &&
                  (t.top < window.innerHeight &&
                  t.bottom > 0 &&
                  "in" !== e.dataset.inview
                    ? (e.dataset.inview = "in")
                    : t.top >= window.innerHeight &&
                      "in" === e.dataset.inview &&
                      !e.hasAttribute("data-motion-once") &&
                      (e.dataset.inview = "out"));
              }
            };
            return (
              e(),
              window.addEventListener("scroll", e, { passive: !0 }),
              window.addEventListener("resize", e),
              () => {
                window.removeEventListener("scroll", e),
                  window.removeEventListener("resize", e);
              }
            );
          }, [t]),
          (0, o.useEffect)(
            () =>
              (function () {
                let t = [],
                  e = (e, o, r) => {
                    e.addEventListener(o, r, { passive: !0 }),
                      t.push(() => e.removeEventListener(o, r));
                  },
                  o = (t) =>
                    Array.from(document.querySelectorAll(`[data-ixe~="${t}"]`)),
                  r = (t, e, o, r) => {
                    let i = (t.getAttribute(e) ?? "")
                      .split(" ")
                      .filter((t) => t && t !== o);
                    r && i.push(o),
                      i.length
                        ? t.setAttribute(e, i.join(" "))
                        : t.removeAttribute(e);
                  },
                  i = (t) => t.replace(/\.[^.]*$/, ""),
                  l = Array.from(
                    document.querySelectorAll("[data-ixview]"),
                  ).flatMap((t) =>
                    (t.dataset.ixview ?? "")
                      .split(" ")
                      .filter(Boolean)
                      .map((e) => {
                        let [o, r = "0%", i = "", l = ""] = e.split("@");
                        return {
                          el: t,
                          marker: o,
                          offset: r,
                          out: i,
                          switches: "s" === l,
                          state: "",
                        };
                      }),
                  ),
                  n = new WeakMap();
                e(document, "click", (t) => {
                  for (
                    let e = t.target instanceof Element ? t.target : null;
                    e;
                    e = e.parentElement
                  ) {
                    let t = e.getAttribute("data-ixclick");
                    if (!t) continue;
                    let r = n.get(e) ?? new Map();
                    for (let l of (n.set(e, r), t.split(" ").filter(Boolean))) {
                      let [t, e] = l.split("/"),
                        n = ((r.get(l) ?? 0) % 2) + 1;
                      r.set(l, n);
                      let a = 1 === n ? t : e;
                      if (a) for (let t of o(a)) t.dataset.ixs = i(a);
                    }
                  }
                });
                let a = Array.from(
                    document.querySelectorAll("[data-ixdir]"),
                  ).flatMap((t) =>
                    (t.dataset.ixdir ?? "")
                      .split(" ")
                      .filter(Boolean)
                      .map((e) => {
                        let [o, r, i = "0%"] = e.split("@");
                        return {
                          el: t,
                          down: "down" === o,
                          event: r,
                          offset: i,
                          top: -1,
                          anchor: 0,
                          downward: !0,
                          inBounds: !1,
                        };
                      }),
                  ),
                  s = () => {
                    let t =
                      document.documentElement.scrollHeight -
                      window.innerHeight;
                    if (t <= 0) return;
                    let e = Number(
                      (Math.min(Math.max(window.scrollY, 0), t) / t).toFixed(2),
                    );
                    for (let o of a) {
                      if (o.top === e) continue;
                      let r =
                          (o.offset.endsWith("px")
                            ? parseFloat(o.offset)
                            : (window.innerHeight *
                                (parseFloat(o.offset) || 0)) /
                              100) / t,
                        i = o.top < 0,
                        l = i ? o.downward : e > o.top,
                        n = !i && o.downward !== l;
                      n && (o.anchor = e);
                      let a = o.down ? e >= o.anchor + r : e <= o.anchor - r;
                      !i &&
                        a &&
                        (n || a !== o.inBounds) &&
                        o.down === l &&
                        (o.el.dataset.ixs = o.event),
                        Object.assign(o, { top: e, downward: l, inBounds: a });
                    }
                  },
                  d = window.matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? []
                    : Array.from(
                        document.querySelectorAll("[data-ixcont]"),
                      ).flatMap((t) => {
                        try {
                          return JSON.parse(t.dataset.ixcont ?? "[]").flatMap(
                            (e) =>
                              e.l.map((r) => ({
                                el: t,
                                param: {
                                  ...r,
                                  q: e.q,
                                  pos: 0,
                                  goal: 0,
                                  tr: r.tr.map((t) => ({ ...t, els: o(t.m) })),
                                },
                              })),
                          );
                        } catch {
                          return [];
                        }
                      }),
                  c = { x: -1, y: -1, pageX: -1, pageY: -1 },
                  u = (t, e) => {
                    let o = document.documentElement;
                    if ("page" === e.k)
                      return o.scrollHeight > o.clientHeight
                        ? window.scrollY / (o.scrollHeight - o.clientHeight)
                        : 0;
                    if ("px" === e.k) return e.d ? window.scrollY / e.d : 0;
                    if ("vp" === e.k)
                      return "x" === e.a
                        ? window.scrollX / o.scrollWidth
                        : window.scrollY / o.scrollHeight;
                    if ("st" === e.k && e.st) {
                      let r = t.getBoundingClientRect(),
                        i = o.clientHeight,
                        l = r.top + r.height * e.st[0] - i * e.st[1],
                        n = r.top + r.height * e.st[2] - i * e.st[3];
                      return l === n ? +(l <= 0) : l / (l - n);
                    }
                    if ("view" === e.k) {
                      let r = t.getBoundingClientRect(),
                        i = o.clientHeight,
                        l = r.top + Math.min(r.height * (e.o ?? 0), i),
                        n = Math.min(
                          i + (r.top + r.height * (e.l ?? 1) - l),
                          o.scrollHeight,
                        );
                      return n > 0 ? Math.min(Math.max(0, i - l), n) / n : 0;
                    }
                    let r = "y" !== e.a;
                    if (c.x < 0) return e.rest ?? 0.5;
                    if ("viewport" === e.b)
                      return r
                        ? Math.min(c.x, window.innerWidth) / window.innerWidth
                        : Math.min(c.y, window.innerHeight) /
                            window.innerHeight;
                    if ("page" === e.b)
                      return r
                        ? Math.min(c.pageX, o.scrollWidth) / o.scrollWidth
                        : Math.min(c.pageY, o.scrollHeight) / o.scrollHeight;
                    let i = t.getBoundingClientRect();
                    return c.x < i.left ||
                      c.x > i.right ||
                      c.y < i.top ||
                      c.y > i.bottom
                      ? (e.rest ?? 0.5)
                      : r
                        ? (c.x - i.left) / i.width
                        : (c.y - i.top) / i.height;
                  },
                  f = (t, e) => {
                    let o = t.v,
                      r = 0;
                    for (; r < o.length - 1 && o[r + 1][0] <= e; ) r++;
                    let i = o[r],
                      l = o[Math.min(r + 1, o.length - 1)],
                      n =
                        e <= i[0] || l[0] === i[0]
                          ? 0
                          : Math.min(1, (e - i[0]) / (l[0] - i[0])),
                      a = i
                        .slice(1)
                        .map(
                          (t, r) =>
                            t + ((l[r + 1] ?? t) - t) * (e <= o[0][0] ? 0 : n),
                        ),
                      s = (t) => Math.round(1e3 * t) / 1e3;
                    return "rgba" === t.u
                      ? `rgba(${a.slice(0, 3).map(Math.round).join(", ")}, ${s(a[3] ?? 1)})`
                      : `${s(a[0])}${t.u}`;
                  },
                  m = 0,
                  p = () => {
                    m = 0;
                    let t = !1;
                    for (let { el: e, param: o } of d) {
                      if (o.q && !window.matchMedia(o.q).matches) continue;
                      let r = Math.min(Math.max(u(e, o), 0), 1),
                        i = o.r ? 1 - r : r,
                        l = Math.max(1 - o.s, 0.01),
                        n = Math.round((o.pos + (i - o.pos) * l) * 1e5) / 1e5;
                      for (let e of ((o.pos = 1e-4 > Math.abs(i - n) ? i : n),
                      o.pos !== i && (t = !0),
                      o.tr)) {
                        let t = f(e, 100 * o.pos);
                        for (let o of e.els) o.style.setProperty(e.p, t);
                      }
                    }
                    t && (m = requestAnimationFrame(p));
                  },
                  h = () => {
                    (() => {
                      let t = document.documentElement.clientWidth,
                        e = document.documentElement.clientHeight;
                      for (let n of l) {
                        let l = n.el.getBoundingClientRect(),
                          a = n.offset.endsWith("px")
                            ? parseFloat(n.offset)
                            : (e * (parseFloat(n.offset) || 0)) / 100,
                          s = !(
                            l.left > t ||
                            l.right < 0 ||
                            l.top > e - a ||
                            l.bottom < a
                          );
                        if (s && "in" !== n.state)
                          for (let t of ((n.state = "in"), o(n.marker)))
                            n.switches
                              ? (t.dataset.ixs = i(n.marker))
                              : (r(t, "data-ixout", i(n.marker), !1),
                                r(t, "data-ixin", i(n.marker), !0));
                        else if (!s && "in" === n.state && n.out)
                          if (((n.state = "out"), n.switches))
                            for (let t of o(n.out)) t.dataset.ixs = i(n.out);
                          else
                            for (let t of o(n.marker))
                              r(t, "data-ixin", i(n.marker), !1),
                                r(t, "data-ixout", i(n.marker), !0);
                        else s || "" !== n.state || (n.state = "out");
                      }
                    })(),
                      s(),
                      d.length && !m && (m = requestAnimationFrame(p));
                  };
                e(window, "scroll", h),
                  e(window, "resize", h),
                  d.some(({ param: t }) => "mouse" === t.k) &&
                    e(document, "mousemove", (t) => {
                      Object.assign(c, {
                        x: t.clientX,
                        y: t.clientY,
                        pageX: t.pageX,
                        pageY: t.pageY,
                      }),
                        h();
                    });
                let w = (t, e) => {
                    for (let r of (t.getAttribute("data-ixon") ?? "")
                      .split(" ")
                      .filter(Boolean)) {
                      let [t, l] = r.split("@");
                      if (t === e && l)
                        for (let t of o(l)) t.dataset.ixs = i(l);
                    }
                  },
                  g = (e, o) => {
                    e.addEventListener("click", o),
                      t.push(() => e.removeEventListener("click", o));
                  };
                for (let t of Array.from(
                  document.querySelectorAll("[data-ixdrop]"),
                )) {
                  let o = t.querySelector(":scope > [data-ixdrop-toggle]"),
                    r = t.querySelector(":scope > [data-ixdrop-list]");
                  if (!o || !r) continue;
                  let [i, l = "0"] = (t.dataset.ixdrop ?? "").split("@"),
                    n = !1,
                    a = 0,
                    s = (e) => {
                      window.clearTimeout(a),
                        n !== e &&
                          ((n = e),
                          o.classList.toggle("w--open", e),
                          r.classList.toggle("w--open", e),
                          o.setAttribute("aria-expanded", String(e)),
                          w(t, e ? "dropdown-open" : "dropdown-close"));
                    };
                  g(o, (t) => {
                    t.preventDefault(), s(!n);
                  }),
                    g(document, (e) => {
                      n &&
                        e.target instanceof Node &&
                        !t.contains(e.target) &&
                        s(!1);
                    }),
                    "hover" === i &&
                      (e(t, "mouseenter", () => s(!0)),
                      e(t, "mouseleave", () => {
                        window.clearTimeout(a),
                          (a = window.setTimeout(() => s(!1), Number(l) || 0));
                      }));
                }
                for (let t of Array.from(
                  document.querySelectorAll("[data-ixtabs]"),
                )) {
                  let e = (e) => e.closest("[data-ixtabs]") === t,
                    o = Array.from(t.querySelectorAll("[data-ixtab]")).filter(
                      e,
                    ),
                    r = Array.from(t.querySelectorAll("[data-ixpane]")).filter(
                      e,
                    ),
                    i = (t) => {
                      for (let [e, i, l] of [
                        [o, "ixtab", "w--current"],
                        [r, "ixpane", "w--tab-active"],
                      ])
                        for (let o of e) {
                          let e = o.dataset[i] === t;
                          "ixtab" === i &&
                            o.setAttribute("aria-selected", String(e)),
                            o.classList.contains(l) !== e &&
                              (o.classList.toggle(l, e),
                              w(o, e ? "tab-active" : "tab-inactive"));
                        }
                    };
                  for (let t of o)
                    g(t, (e) => {
                      e.preventDefault(), i(t.dataset.ixtab ?? "");
                    });
                }
                for (let t of a) Object.assign(t, { top: -1 });
                return (
                  h(),
                  s(),
                  () => {
                    for (let e of t) e();
                    m && cancelAnimationFrame(m);
                  }
                );
              })(),
            [t],
          ),
          null
        );
      },
    ]);
  })(runtime);
})();
