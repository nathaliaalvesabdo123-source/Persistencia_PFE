if (typeof L === 'undefined') {
  document.body.innerHTML = `
    <div style="padding:40px;font-family:sans-serif;background:#111;color:#fff;height:100vh">
      <h1>❌ Erro: Leaflet não carregou</h1>
      <p>Verifique sua conexão ou se o CDN está bloqueado.</p>
    </div>
  `;
  throw new Error('Leaflet ausente');
}

let map;
let userMarker = null;
let accuracyCircle = null;

function initMap() {
  map = L.map('map', {
    zoomControl: false,
  }).setView([-23.5505, -46.6333], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);
}

function criarIconeUsuario() {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div class="pulse"></div>
      <div class="dot"></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const coordsEl    = document.getElementById('coords');
const lastSavedEl = document.getElementById('last-saved');

const STORAGE_KEY = 'ultimaLocalizacao';

function mostrarUltimaSalva() {
  const salva = localStorage.getItem(STORAGE_KEY);

  if (salva) {
    const { lat, lng } = JSON.parse(salva);
    lastSavedEl.textContent =
      `Sua última localização salva foi: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    return { lat, lng };
  }

  lastSavedEl.textContent = '⚠️ Nenhuma localização salva ainda.';
  return null;
}

function atualizarMarcador(lat, lng, accuracy = null) {
  if (!map) return;

  if (userMarker) map.removeLayer(userMarker);
  if (accuracyCircle) map.removeLayer(accuracyCircle);

  if (accuracy) {
    accuracyCircle = L.circle([lat, lng], {
      radius: accuracy,
      color: '#00aaff',
      fillColor: '#00aaff',
      fillOpacity: 0.15,
      weight: 1,
    }).addTo(map);
  }

  userMarker = L.marker([lat, lng], {
    icon: criarIconeUsuario(),
  }).addTo(map);

  userMarker.bindPopup('📍 Você está aqui!');
}

function capturarLocalizacao(centralizar = true) {
  if (!navigator.geolocation) {
    coordsEl.textContent = '❌ Geolocalização não suportada.';
    return;
  }

  coordsEl.textContent = '⏳ Obtendo sinal do GPS...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;

      coordsEl.textContent = `Lat: ${lat.toFixed(5)} | Long: ${lng.toFixed(5)}`;

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng }));

      mostrarUltimaSalva();

      if (map) {
        atualizarMarcador(lat, lng, accuracy);
        if (centralizar) {
          map.setView([lat, lng], 17, { animate: true });
        }
      }
    },
    (err) => {
      coordsEl.textContent = '❌ Erro: ' + err.message;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

window.addEventListener('DOMContentLoaded', () => {
  initMap();

  const salva = mostrarUltimaSalva();
  if (salva) {
    atualizarMarcador(salva.lat, salva.lng);
    map.setView([salva.lat, salva.lng], 16);
  }

  capturarLocalizacao(true);
});

const btnAtualizar   = document.getElementById('btn-atualizar');
const btnCentralizar = document.getElementById('btn-centralizar');

if (btnAtualizar) {
  btnAtualizar.addEventListener('click', () => capturarLocalizacao(false));
}

if (btnCentralizar) {
  btnCentralizar.addEventListener('click', () => capturarLocalizacao(true));
}

const papel   = document.getElementById('papel');
const lixeira = document.getElementById('lixeira');

if (papel && lixeira) {
  papel.addEventListener('dragstart', (e) => {
    papel.classList.add('dragging');
    e.dataTransfer.setData('text/plain', 'papel');
    e.dataTransfer.effectAllowed = 'move';
  });

  papel.addEventListener('dragend', () => {
    papel.classList.remove('dragging');
  });

  lixeira.addEventListener('dragover', (e) => {
    e.preventDefault();
    lixeira.classList.add('hover');
  });

  lixeira.addEventListener('dragleave', () => {
    lixeira.classList.remove('hover');
  });

  lixeira.addEventListener('drop', (e) => {
    e.preventDefault();
    lixeira.classList.remove('hover');

    localStorage.removeItem(STORAGE_KEY);

    lastSavedEl.textContent = '🗑️ Localização apagada do armazenamento!';
    coordsEl.textContent    = 'Dados limpos. Clique em 🔄 para atualizar.';

    if (userMarker)     { map.removeLayer(userMarker);     userMarker = null; }
    if (accuracyCircle) { map.removeLayer(accuracyCircle); accuracyCircle = null; }

    lixeira.style.transform = 'scale(1.5) rotate(-15deg)';
    setTimeout(() => { lixeira.style.transform = ''; }, 300);
  });
}