(() => {
  const $ = s => document.querySelector(s), S = window.STORE;
  const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = n => Number(n).toLocaleString("ar-EG") + " " + S.currency;
  const ls = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} } };
  const ICONS = {
    watch: '<rect x="20" y="18" width="24" height="28" rx="8"/><path d="M24 18l2-10h12l2 10M24 46l2 10h12l2-10M32 28v6l4 3"/>',
    head: '<path d="M12 38v-6a20 20 0 0140 0v6"/><rect x="8" y="36" width="10" height="16" rx="4"/><rect x="46" y="36" width="10" height="16" rx="4"/>',
    bag: '<path d="M12 24h40l-3 30H15z"/><path d="M22 24v-4a10 10 0 0120 0v4"/>',
    glasses: '<circle cx="18" cy="36" r="10"/><circle cx="46" cy="36" r="10"/><path d="M28 34q4-4 8 0M8 34l4-12M56 34l-4-12"/>',
    vase: '<path d="M26 8h12M28 8v8c-12 6-14 20-10 30 2 5 6 8 14 8s12-3 14-8c4-10 2-24-10-30V8"/>',
    lamp: '<path d="M20 30l6-18h12l6 18z"/><path d="M32 30v20M22 54h20"/>',
    perfume: '<rect x="16" y="26" width="32" height="30" rx="8"/><rect x="26" y="14" width="12" height="12" rx="2"/><path d="M24 8h16v6H24z"/>',
    skin: '<rect x="22" y="22" width="20" height="32" rx="6"/><path d="M26 22v-8h12v8M28 14V8h8v6"/>',
    box: '<path d="M10 24h44v10H10zM14 34h36v20H14zM32 24v30M32 24c-8-12-18-2-8 0M32 24c8-12 18-2 8 0"/>'
  };
  const svg = (n, c = "") => `<svg viewBox="0 0 64 64" class="${c}">${(ICONS[n] || ICONS.box).replace(/<(path|rect|circle)/g, '<$1 pathLength="1"')}</svg>`;
  let all = [], cat = "الكل", q = "", sort = "def";
  const fav = new Set(ls.get("fav", [])); let cart = ls.get("cart", {});
  const byId = id => all.find(p => String(p.id) === String(id));
  const bd = p => p.badge || (p.old ? `خصم ${Math.round((1 - p.price / p.old) * 100).toLocaleString("ar-EG")}٪` : "");
  const art = p => `<div class="art" style="--h:${+p.hue || 250}">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : `<span class="ic">${svg(p.icon)}</span>`}${bd(p) ? `<span class="badge">${esc(bd(p))}</span>` : ""}</div>`;
  const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800) };
  const save = () => { ls.set("cart", cart); ls.set("fav", [...fav]) };

  function list() {
    let r = all.filter(p => (cat === "الكل" || p.cat === cat) && (!q || (p.name + p.desc + p.cat).includes(q)));
    if (sort === "fav") r = r.filter(p => fav.has(String(p.id)));
    if (sort === "lo") r.sort((a, b) => a.price - b.price);
    if (sort === "hi") r.sort((a, b) => b.price - a.price);
    if (sort === "rate") r.sort((a, b) => b.rating - a.rating);
    return r;
  }
  function renderGrid() {
    const r = list();
    $("#grid").innerHTML = r.length ? r.map((p, i) => `<article class="card" style="--i:${i}" data-id="${esc(p.id)}">${art(p).replace(/<\/div>$/, `<button class="fav ${fav.has(String(p.id)) ? "on" : ""}" data-act="fav" aria-label="مفضلة">${fav.has(String(p.id)) ? "♥" : "♡"}</button></div>`)}
      <div class="info"><span class="meta">${esc(p.cat)} · ★ ${p.rating ?? "-"}</span><h3>${esc(p.name)}</h3>
      <div class="price"><b>${fmt(p.price)}</b>${p.old ? `<s>${fmt(p.old)}</s>` : ""}</div>
      <button class="add" data-act="add">أضف إلى السلة</button></div></article>`).join("") : `<p class="empty">لا توجد منتجات مطابقة. جرّب كلمة أخرى أو اختر "الكل".</p>`;
  }
  function renderChips() {
    $("#chips").innerHTML = ["الكل", ...new Set(all.map(p => p.cat))].map(c => `<button class="chip" aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
  }
  function renderCart() {
    const ids = Object.keys(cart).filter(id => byId(id)); let total = 0, n = 0;
    $("#items").innerHTML = ids.length ? ids.map(id => { const p = byId(id), c = cart[id]; total += p.price * c; n += c;
      return `<div class="row" data-id="${esc(id)}">${art({ ...p, badge: "", old: 0 })}<div><b>${esc(p.name)}</b><div class="meta">${fmt(p.price)}</div><div class="qty"><button data-act="dec" aria-label="إنقاص">−</button><span>${c}</span><button data-act="inc" aria-label="زيادة">+</button></div></div><button data-act="rm" aria-label="حذف">✕</button></div>`; }).join("") : `<p class="empty">سلتك فارغة. أضف منتجاً لتبدأ.</p>`;
    $("#total").textContent = fmt(total); $("#count").textContent = n; $("#checkout").disabled = !n;
  }
  const setQty = (id, d) => { if (d > 0) { const b = $("#openCart"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); } cart[id] = (cart[id] || 0) + d; if (cart[id] <= 0) delete cart[id]; save(); renderCart(); };
  const openCart = o => document.body.classList.toggle("open", o);

  function openModal(id) {
    const p = byId(id), m = $("#modal");
    m.innerHTML = `<button class="x" data-act="close" aria-label="إغلاق">✕</button><div class="md">${art(p)}<div class="mb"><span class="meta">${esc(p.cat)} · ★ ${p.rating ?? "-"}</span><h2>${esc(p.name)}</h2><p>${esc(p.desc)}</p><div class="price"><b>${fmt(p.price)}</b>${p.old ? `<s>${fmt(p.old)}</s>` : ""}</div><button class="btn wide" data-act="add" data-id="${esc(p.id)}">أضف إلى السلة</button></div></div>`;
    m.showModal();
  }
  function checkout() {
    const ids = Object.keys(cart).filter(id => byId(id)); if (!ids.length) return;
    let t = 0; const lines = ids.map(id => { const p = byId(id), c = cart[id]; t += p.price * c; return `• ${p.name} × ${c} = ${fmt(p.price * c)}` });
    window.open(`https://wa.me/${S.whatsapp}?text=${encodeURIComponent(`مرحباً، أرغب بطلب:\n${lines.join("\n")}\nالإجمالي: ${fmt(t)}`)}`, "_blank", "noopener");
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("[data-act]"), card = e.target.closest("[data-id]");
    const id = a?.dataset.id || card?.dataset.id, act = a?.dataset.act;
    if (e.target.closest("[data-cat]")) { cat = e.target.closest("[data-cat]").dataset.cat; renderChips(); renderGrid(); return; }
    if (act === "add") { setQty(id, 1); toast("أُضيف إلى السلة"); return; }
    if (act === "fav") { fav.has(id) ? fav.delete(id) : fav.add(id); save(); renderGrid(); document.querySelector(`.card[data-id="${id}"] .fav`)?.classList.add("pop"); return; }
    if (act === "inc") return setQty(id, 1);
    if (act === "dec") return setQty(id, -1);
    if (act === "rm") return setQty(id, -cart[id]);
    if (act === "close" || e.target === $("#modal")) return $("#modal").close();
    if (card && card.classList.contains("card")) openModal(id);
  });
  $("#grid").addEventListener("pointermove", e => {
    const c = e.target.closest(".card"); if (!c) return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
    c.style.transform = `rotateY(${(x - .5) * -8}deg) rotateX(${(y - .5) * 8}deg) translateY(-4px)`;
  });
  $("#grid").addEventListener("pointerout", e => { const c = e.target.closest(".card"); if (c) c.style.transform = ""; });
  $("#q").addEventListener("input", e => { q = e.target.value.trim(); renderGrid(); });
  $("#sort").addEventListener("change", e => { sort = e.target.value; renderGrid(); });
  $("#openCart").onclick = () => openCart(true);
  $("#closeCart").onclick = $("#veil").onclick = () => openCart(false);
  $("#checkout").onclick = checkout;
  document.addEventListener("keydown", e => e.key === "Escape" && openCart(false));

  function hero() {
    const top = [...all].sort((a, b) => b.rating - a.rating).slice(0, 4); if (!top.length) return;
    const pos = ["top:-32px;left:50%;margin-left:-32px", "bottom:14%;right:-6px", "bottom:14%;left:-6px"];
    $("#stage").innerHTML = `<div class="ring">${top.slice(1).map((p, i) => `<div class="sat" style="${pos[i]}">${svg(p.icon)}</div>`).join("")}</div><div class="core">${svg(top[0].icon)}</div>`;
  }
  (async () => {
    $("#brand").textContent = S.name; $("#tagline").textContent = S.tagline; $("#foot").textContent = S.name; $("#wa").href = $("#fwa").href = "https://wa.me/" + S.whatsapp;
    document.title = `${S.name} لعرض منتجاتي`;
    all = (await Store.getProducts()).map(p => ({ ...p, id: String(p.id) }));
    renderChips(); renderGrid(); renderCart(); hero();
  })();
})();
