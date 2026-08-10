
(function(){
  const D = window.EUROPE2026;
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];

  function setOnline(){
    const el = $('#online');
    if (!el) return;
    if (navigator.onLine) { el.textContent = 'Онлайн · можно кэшировать карту'; el.className = 'online on'; }
    else { el.textContent = 'Офлайн · списки и кэш карты'; el.className = 'online off'; }
  }
  window.addEventListener('online', setOnline);
  window.addEventListener('offline', setOnline);
  setOnline();

  let map, mapReady = false;
  function showTab(id) {
    $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    $$('.panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('tab-' + id);
    if (panel) panel.classList.add('active');
    if (id === 'map') {
      ensureMap();
      setTimeout(() => map && map.invalidateSize(), 80);
    }
    if (id === 'stops') renderStops();
    if (id === 'phrases') renderPhrases();
  }
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  function esc(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function badge(p){
    if (!p) return '';
    if (p === 'Обязательно') return '<span class="badge must">Обязательно</span>';
    if (p === 'Рекомендуется') return '<span class="badge rec">Рекомендуется</span>';
    if (p === 'Опционально') return '<span class="badge opt">Опционально</span>';
    return `<span class="badge">${esc(p)}</span>`;
  }
  function mapsSearch(address){
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
  }
  function distLabel(r){
    if (!r.distance_km) return '';
    const h = Math.floor((r.duration_min||0)/60), m = (r.duration_min||0)%60;
    const t = h ? `${h} ч ${m} мин` : `${m} мин`;
    let html = `<div class="dist">🚗 руль ≈ ${r.distance_km} км · ${t}</div>`;
    if (r.distance_note) html += `<div class="notes" style="margin-top:6px;color:#9a3412">${esc(r.distance_note)}</div>`;
    if (r.stops_note) html += `<div class="notes" style="margin-top:4px">${esc(r.stops_note)}</div>`;
    return html;
  }

  $('#hotels').innerHTML = D.hotels.map(h => `
    <article class="card">
      <div class="meta">${esc(h.date||'')}</div>
      <h3>${esc(h.name)}</h3>
      <div class="notes"><b>Адрес:</b> ${esc(h.address)}</div>
      <div class="notes" style="margin-top:6px"><b>Парковка / заметки:</b> ${esc(h.notes)}</div>
      ${h.phone ? `<div class="notes" style="margin-top:8px"><a class="phone" href="tel:${esc(h.phone)}">${esc(h.phone)}</a></div>` : ''}
      <div class="row">
        <a class="btn" href="${h.maps || mapsSearch(h.address)}" target="_blank" rel="noopener">Открыть адрес</a>
        ${h.phone ? `<a class="btn secondary" href="tel:${esc(h.phone)}">Позвонить</a>` : ''}
      </div>
    </article>`).join('');

  $('#routes').innerHTML = D.routes.map(r => {
    const via = r.waypoints && r.waypoints.length
      ? `<div class="notes" style="margin-top:6px"><b>Через:</b><br>${r.waypoints.map(esc).join('<br>')}</div>`
      : `<div class="notes" style="margin-top:6px;color:#64748b">Без фиксированных точек — быстрый маршрут.</div>`;
    const note = r.note ? `<div class="warn" style="margin-top:8px">${esc(r.note)}</div>` : '';
    return `<article class="card">
      <div class="meta">${esc(r.date)} · ${esc(r.route_priority === 'fastest' ? '⚡ самый быстрый' : (r.type || 'маршрут'))}</div>
      <h3>${esc(r.name)}</h3>
      ${distLabel(r)}
      <div class="notes" style="margin-top:6px"><b>Старт:</b> ${esc(r.origin)}<br><b>Финиш:</b> ${esc(r.destination)}</div>
      ${via}${note}
      <a class="btn" href="${esc(r.link)}" target="_blank" rel="noopener">Навигация в Google Maps</a>
    </article>`;
  }).join('');

  const sorted = [...D.pois].sort((a,b) => String(a.date).localeCompare(String(b.date),'ru'));
  $('#pois').innerHTML = sorted.map(p => `
    <article class="card">
      <div class="meta">${esc(p.date)} · ${esc(p.category)} ${badge(p.priority)}</div>
      <h3>${esc(p.name)}</h3>
      <div class="notes">${esc(p.notes)}</div>
      <a class="btn secondary" href="${mapsSearch(p.name)}" target="_blank" rel="noopener">Открыть точку</a>
    </article>`).join('');


  function renderStops() {
    const stopsEl = document.getElementById('stops');
    if (!stopsEl) return;
    const rs = Array.isArray(D.rest_stops) ? D.rest_stops : [];
    if (!rs.length) {
      stopsEl.innerHTML = '<div class="warn">Список остановок не загрузился. Обновите страницу с интернетом (потяните вниз / закройте вкладку и откройте снова).</div>';
      return;
    }
    stopsEl.innerHTML =
      `<div class="tip"><b>${rs.length} остановок</b> по маршруту: заправки и перекусы. На карте — оранжевые квадраты.</div>` +
      rs.map(s => `
      <article class="card">
        <div class="meta">${esc(s.day)} · ${esc(s.kind)}</div>
        <h3>${esc(s.name)}</h3>
        <div class="notes">${esc(s.address)}</div>
        <div class="notes" style="margin-top:6px">${esc(s.notes)}</div>
        <a class="btn" href="${esc(s.maps)}" target="_blank" rel="noopener">Открыть на карте</a>
      </article>`).join('');
  }
  renderStops();

  function renderPhrases() {
    const el = document.getElementById('phrases');
    if (!el) return;
    const groups = Array.isArray(D.phrases) ? D.phrases : [];
    if (!groups.length) {
      el.innerHTML = '<div class="warn">Фразы не загрузились. Обновите страницу с интернетом.</div>';
      return;
    }
    el.innerHTML = '<div class="tip">Короткий разговорник EN → RU. Тап по фразе — скопировать английский.</div>' + groups.map(g => `
      <div class="svc-group">
        <div class="cat-title">${esc(g.cat)}</div>
        <article class="card" style="padding-top:4px;padding-bottom:4px">
          ${(g.items||[]).map(it => `
            <div class="phrase" data-copy="${esc(it.en)}">
              <div class="phrase-en">${esc(it.en)}</div>
              <div class="phrase-ru">${esc(it.ru)}</div>
            </div>`).join('')}
        </article>
      </div>`).join('');
    el.querySelectorAll('.phrase').forEach(node => {
      node.addEventListener('click', async () => {
        const text = node.getAttribute('data-copy') || '';
        try {
          await navigator.clipboard.writeText(text);
          node.style.background = '#dcfce7';
          setTimeout(() => { node.style.background = ''; }, 500);
        } catch (_) {}
      });
    });
  }
  renderPhrases();

  const S = D.services;
  function linkBtn(url, label='Открыть'){
    if (!url) return '';
    return `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${label}</a>`;
  }
  $('#services').innerHTML = `
    <div class="svc-group"><h2>Контакты</h2>
      ${S.contacts.map(c => `<article class="card">
        <h3>${esc(c.title)}</h3>
        <div class="phone" style="margin:6px 0"><a href="${esc(c.href)}">${esc(c.detail)}</a></div>
        <div class="notes">${esc(c.note)}</div>
        <a class="btn secondary" href="${esc(c.href)}">Позвонить</a>
      </article>`).join('')}
    </div>
    <div class="svc-group"><h2>Виньетки и дороги</h2>
      ${S.vignettes.map(v => `<article class="card">
        <div class="meta">${esc(v.country)}</div>
        <h3>${esc(v.what)}</h3>
        <div class="notes">${esc(v.note)}</div>
        ${linkBtn(v.where, 'Купить / сайт')}
      </article>`).join('')}
    </div>
    <div class="svc-group"><h2>Перевалы открыты?</h2>
      ${S.passes.map(p => `<article class="card">
        <h3>${esc(p.title)}</h3>
        <div class="notes">${esc(p.note)}</div>
        ${linkBtn(p.url)}
      </article>`).join('')}
    </div>
    <div class="svc-group"><h2>Погода — Швейцария / Альпы</h2>
      ${S.weather.map(w => `<article class="card">
        <h3>${esc(w.title)}</h3>
        <div class="notes">${esc(w.note)}</div>
        ${linkBtn(w.url)}
      </article>`).join('')}
    </div>
    <div class="svc-group"><h2>Граница BY ↔ PL</h2>
      ${S.border.map(b => `<article class="card">
        <h3>${esc(b.title)}</h3>
        <div class="notes">${esc(b.note)}</div>
        ${linkBtn(b.url)}
      </article>`).join('')}
    </div>
    <div class="svc-group"><h2>Ещё полезное</h2>
      ${S.other.map(o => `<article class="card">
        <h3>${esc(o.title)}</h3>
        <div class="notes">${esc(o.note)}</div>
        ${linkBtn(o.url)}
      </article>`).join('')}
    </div>`;

  $('#info').innerHTML = `
    <div class="warn"><b>Важно</b><ul style="margin:6px 0 0 18px;padding:0">${D.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>
    ${D.tips.map(t=>`<div class="tip">${esc(t)}</div>`).join('')}
    <article class="card">
      <h3>Офлайн</h3>
      <div class="notes">Жильё, маршруты, точки и служба-контакты доступны без сети. Подложка карты — из кэша после просмотра онлайн.</div>
      <button class="btn" id="prefetchBtn" type="button">Кэшировать карту маршрута</button>
      <div class="meta" id="prefetchStatus" style="margin-top:8px"></div>
    </article>`;

  function ensureMap(){
    if (mapReady) return;
    mapReady = true;
    map = L.map('map', {zoomControl:true}).setView([50.5, 15], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18, attribution: '&copy; OSM &copy; CARTO'
    }).addTo(map);
    const hotelIcon = L.divIcon({className:'', html:'<div style="width:14px;height:14px;border-radius:50%;background:#16a34a;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize:[14,14], iconAnchor:[7,7]});
    const poiIcon = L.divIcon({className:'', html:'<div style="width:12px;height:12px;border-radius:50%;background:#7c3aed;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize:[12,12], iconAnchor:[6,6]});
    const markIcon = L.divIcon({className:'', html:'<div style="width:12px;height:12px;border-radius:50%;background:#0ea5e9;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize:[12,12], iconAnchor:[6,6]});
    const bounds = [];
    D.hotels.forEach(p => {
      if (p.lat == null) return;
      L.marker([p.lat,p.lon], {icon:hotelIcon}).addTo(map)
        .bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.date||'')}<br>${esc(p.address)}<br><small>${esc(p.notes)}</small>`);
      bounds.push([p.lat,p.lon]);
    });
    (D.landmarks||[]).forEach(p => {
      L.marker([p.lat,p.lon], {icon:markIcon}).addTo(map)
        .bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.category)} · ${esc(p.date)}<br><small>${esc(p.notes)}</small>`);
      bounds.push([p.lat,p.lon]);
    });
        (D.rest_stops||[]).forEach(p => {
      if (p.lat == null) return;
      const ic = L.divIcon({className:'', html:'<div style="width:11px;height:11px;background:#f59e0b;border:2px solid #fff;border-radius:2px;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize:[11,11], iconAnchor:[5,5]});
      L.marker([p.lat,p.lon], {icon:ic}).addTo(map)
        .bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.kind)} · ${esc(p.day)}<br><small>${esc(p.notes)}</small>`);
      bounds.push([p.lat,p.lon]);
    });

    D.pois.forEach(p => {
      L.marker([p.lat,p.lon], {icon:poiIcon}).addTo(map)
        .bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.date)} · ${esc(p.category)} · ${esc(p.priority)}<br><small>${esc(p.notes)}</small>`);
      bounds.push([p.lat,p.lon]);
    });
    D.routes.forEach(r => {
      if (!r.coords || r.coords.length < 2) return;
      const line = L.polyline(r.coords, {color:'#ea580c', weight:4, opacity:.85}).addTo(map);
      const dist = r.distance_km ? `<br>≈ ${r.distance_km} км` : '';
      const link = r.link ? `<br><a href="${r.link}">Google Maps</a>` : '';
      line.bindPopup(`<b>${esc(r.name)}</b>${dist}${link}`);
      r.coords.forEach(c => bounds.push(c));
    });
    if (bounds.length) map.fitBounds(bounds, {padding:[36,36]});
    setTimeout(() => map.invalidateSize(), 200);
  }

  document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'prefetchBtn') {
      const st = $('#prefetchStatus');
      if (!navigator.onLine) { st.textContent = 'Нужен интернет для кэширования.'; return; }
      ensureMap();
      st.textContent = 'Кэширую плитки…';
      const btn = e.target; btn.disabled = true;
      try {
        const zooms = [5,6,7];
        let n = 0;
        const pts = [];
        D.hotels.forEach(h => { if (h.lat!=null) pts.push([h.lat,h.lon]); });
        (D.landmarks||[]).forEach(h => pts.push([h.lat,h.lon]));
        (D.rest_stops||[]).forEach(h => { if (h.lat!=null) pts.push([h.lat,h.lon]); });
        D.routes.forEach(r => (r.coords||[]).forEach(c => pts.push(c)));
        const cache = await caches.open('europe2026-v9');
        for (const z of zooms) {
          for (const [lat,lon] of pts) {
            const tile = latLonToTile(lat, lon, z);
            for (let dx=-1; dx<=1; dx++) for (let dy=-1; dy<=1; dy++) {
              const x = tile.x + dx, y = tile.y + dy;
              const url = `https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;
              try {
                const res = await fetch(url, {mode:'cors'});
                if (res.ok) { await cache.put(url, res.clone()); n++; }
              } catch(_){}
            }
          }
        }
        st.textContent = `Готово: сохранено ~${n} плиток.`;
      } catch (err) {
        st.textContent = 'Ошибка кэша: ' + err.message;
      }
      btn.disabled = false;
    }
  });

  function latLonToTile(lat, lon, zoom) {
    const latRad = lat * Math.PI / 180;
    const n = 2 ** zoom;
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return {x,y};
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
  ensureMap();
})();
