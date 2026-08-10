
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

  // tabs
  let map, mapReady = false;
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab').forEach(b => b.classList.remove('active'));
      $$('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.tab;
      const panel = document.getElementById('tab-' + id);
      panel.classList.add('active');
      if (id === 'map') {
        ensureMap();
        setTimeout(() => map && map.invalidateSize(), 80);
      }
    });
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

  // hotels
  const hotelsEl = $('#hotels');
  hotelsEl.innerHTML = D.hotels.map(h => `
    <article class="card">
      <div class="meta">${esc(h.date)}</div>
      <h3>${esc(h.name)}</h3>
      <div class="notes"><b>Адрес:</b> ${esc(h.address)}</div>
      <div class="notes" style="margin-top:6px"><b>Парковка / заметки:</b> ${esc(h.notes)}</div>
      <div class="row">
        <a class="btn" href="${mapsSearch(h.address)}" target="_blank" rel="noopener">Открыть адрес</a>
      </div>
    </article>`).join('');

  // routes
  const routesEl = $('#routes');
  routesEl.innerHTML = D.routes.map(r => {
    const via = r.waypoints && r.waypoints.length
      ? `<div class="notes" style="margin-top:6px"><b>Через:</b><br>${r.waypoints.map(esc).join('<br>')}</div>`
      : `<div class="notes" style="margin-top:6px;color:#64748b">Без фиксированных точек — быстрый маршрут Google.</div>`;
    const note = r.note ? `<div class="warn" style="margin-top:8px">${esc(r.note)}</div>` : '';
    return `<article class="card">
      <div class="meta">${esc(r.date)} · ${esc(r.type || 'маршрут')}</div>
      <h3>${esc(r.name)}</h3>
      <div class="notes"><b>Старт:</b> ${esc(r.origin)}<br><b>Финиш:</b> ${esc(r.destination)}</div>
      ${via}${note}
      <a class="btn" href="${esc(r.link)}" target="_blank" rel="noopener">Навигация в Google Maps</a>
    </article>`;
  }).join('');

  // pois
  const poisEl = $('#pois');
  const sorted = [...D.pois].sort((a,b) => String(a.date).localeCompare(String(b.date),'ru'));
  poisEl.innerHTML = sorted.map(p => `
    <article class="card">
      <div class="meta">${esc(p.date)} · ${esc(p.category)} ${badge(p.priority)}</div>
      <h3>${esc(p.name)}</h3>
      <div class="notes">${esc(p.notes)}</div>
      <a class="btn secondary" href="${mapsSearch(p.name)}" target="_blank" rel="noopener">Открыть точку</a>
    </article>`).join('');

  // info
  const infoEl = $('#info');
  infoEl.innerHTML = `
    <div class="warn"><b>Важно</b><ul style="margin:6px 0 0 18px;padding:0">${D.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>
    ${D.tips.map(t=>`<div class="tip">${esc(t)}</div>`).join('')}
    <article class="card">
      <h3>Офлайн</h3>
      <div class="notes">Жильё, маршруты и точки доступны без сети. Подложка карты — из кэша после просмотра онлайн. Навигация turn-by-turn в Google Maps требует сеть или офлайн-карты Google.</div>
      <button class="btn" id="prefetchBtn" type="button">Кэшировать карту маршрута</button>
      <div class="meta" id="prefetchStatus" style="margin-top:8px"></div>
    </article>`;

  function ensureMap(){
    if (mapReady) return;
    mapReady = true;
    map = L.map('map', {zoomControl:true}).setView([47.0, 10.5], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      attribution: '&copy; OSM &copy; CARTO'
    }).addTo(map);
    const hotelIcon = L.divIcon({className:'', html:'<div style="width:14px;height:14px;border-radius:50%;background:#16a34a;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize:[14,14], iconAnchor:[7,7]});
    const poiIcon = L.divIcon({className:'', html:'<div style="width:12px;height:12px;border-radius:50%;background:#7c3aed;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize:[12,12], iconAnchor:[6,6]});
    const bounds = [];
    D.hotels.forEach(p => {
      L.marker([p.lat,p.lon], {icon:hotelIcon}).addTo(map)
        .bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.date)}<br>${esc(p.address)}<br><small>${esc(p.notes)}</small>`);
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
      const link = r.link ? `<br><a href="${r.link}">Google Maps</a>` : '';
      line.bindPopup(`<b>${esc(r.name)}</b>${link}`);
      r.coords.forEach(c => bounds.push(c));
    });
    if (bounds.length) map.fitBounds(bounds, {padding:[36,36]});
    setTimeout(() => map.invalidateSize(), 200);
  }

  // prefetch tiles along route at zoom 7-8
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
        D.hotels.forEach(h => pts.push([h.lat,h.lon]));
        D.routes.forEach(r => (r.coords||[]).forEach(c => pts.push(c)));
        const cache = await caches.open('europe2026-v2');
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
        st.textContent = `Готово: сохранено ~${n} плиток. Можно пробовать офлайн.`;
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
  // start on map
  ensureMap();
})();
