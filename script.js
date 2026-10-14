// ===== Mapa: # parede, . chão, P jogador, I inspetor, B livro, K chave, C café, D porta de saída =====
const MAPA = [
"###################",
"#B..#.B.#..B#..B..#",
"#...#...#...#..C..#",
"#...#...#...#.....#",
"##.###.###.###.####",
"#P................D",
"#.#######.#######.#",
"#.#B....#.#....B#.#",
"#.#.....#.#..C..#.#",
"#.#..K..#.#.....#.#",
"#.###.###.###.###.#",
"#........I........#",
"###################"];
const W = MAPA[0].length, H = MAPA.length;
const $ = id => document.getElementById(id);
const teclas = {};
addEventListener('keydown', e => { teclas[e.code] = true; if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => teclas[e.code] = false);
document.querySelectorAll('[data-k]').forEach(b => {
  b.addEventListener('pointerdown', () => teclas[b.dataset.k] = true);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => teclas[b.dataset.k] = false));
});

// ===== Cena 3D =====
let rend, cena, cam;
try {
  rend = new THREE.WebGLRenderer({ canvas: $('cena'), antialias: true });
} catch (e) { $('tela').querySelector('p').textContent = 'Seu navegador não suporta WebGL.'; }
cena = new THREE.Scene();
cena.background = new THREE.Color(0x10151c);
cena.fog = new THREE.Fog(0x10151c, 1, 11);
cam = new THREE.PerspectiveCamera(70, 1, 0.05, 50);
cena.add(new THREE.AmbientLight(0xffffff, 0.45));
const lanterna = new THREE.PointLight(0xfff2cc, 1.1, 9);
cam.add(lanterna); cena.add(cam);

function redimensionar() {
  const c = $('cena'); const w = c.clientWidth, h = c.clientHeight;
  rend.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
}
addEventListener('resize', redimensionar);

// Textura xadrez do piso, desenhada num canvas
const cv = document.createElement('canvas'); cv.width = cv.height = 64;
const c2 = cv.getContext('2d');
c2.fillStyle = '#d8d6c8'; c2.fillRect(0, 0, 64, 64);
c2.fillStyle = '#bdbbab'; c2.fillRect(0, 0, 32, 32); c2.fillRect(32, 32, 32, 32);
const tex = new THREE.CanvasTexture(cv);
tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(W / 2, H / 2);
const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: tex }));
piso.rotation.x = -Math.PI / 2; piso.position.set(W / 2 - 0.5, 0, H / 2 - 0.5); cena.add(piso);
const teto = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ color: 0xf4f4ef }));
teto.rotation.x = Math.PI / 2; teto.position.set(W / 2 - 0.5, 1.2, H / 2 - 0.5); cena.add(teto);

// Texturas desenhadas em canvas (sem imagens externas)
function tex2d(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h); return new THREE.CanvasTexture(c);
}
const texParede = tex2d(64, 64, (g, w, h) => {      // parede bege com faixa azul-esverdeada
  g.fillStyle = '#efe6c4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4aa3a8'; g.fillRect(0, 36, w, 28);
  g.fillStyle = '#2f7f84'; g.fillRect(0, 34, w, 3);
});
const matParede = [0xffffff, 0xe4e4e4].map(c => new THREE.MeshLambertMaterial({ map: texParede, color: c }));
const texQuadro = tex2d(128, 64, (g, w, h) => {     // lousa com giz
  g.fillStyle = '#7a5230'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1f5a3a'; g.fillRect(4, 4, w - 8, h - 14);
  g.fillStyle = '#d8d8d0'; g.fillRect(4, h - 8, w - 8, 4);
  g.fillStyle = '#f3f3ea'; g.font = 'bold 16px sans-serif'; g.fillText('2 + 2 = 4', 12, 28); g.fillText('ABC', 12, 46);
});
const texArmario = tex2d(64, 64, (g, w, h) => {     // armários de corredor
  g.fillStyle = '#d6dce2'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#6b7783'; g.fillStyle = '#6b7783'; g.lineWidth = 2;
  [0, 32].forEach(x0 => {
    g.strokeRect(x0 + 2, 2, 28, 60);
    for (let i = 0; i < 4; i++) g.fillRect(x0 + 8, 8 + i * 4, 16, 2);
    g.fillRect(x0 + 22, 34, 3, 8);
  });
});
const texMural = tex2d(128, 80, (g, w, h) => {      // mural de recados
  g.fillStyle = '#6b4a2b'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c28a52'; g.fillRect(4, 4, w - 8, h - 8);
  ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#f783ac'].forEach((c, i) => {
    g.fillStyle = c; g.fillRect(10 + (i % 3) * 38, 10 + Math.floor(i / 3) * 34, 30, 26);
    g.fillStyle = '#222'; g.fillRect(23 + (i % 3) * 38, 12 + Math.floor(i / 3) * 34, 3, 3);
  });
});
const texRelogio = tex2d(64, 64, g => {
  g.fillStyle = '#222'; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fill();
  g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 32); g.lineTo(32, 12); g.moveTo(32, 32); g.lineTo(46, 38); g.stroke();
});
const texSaida = tex2d(128, 48, (g, w, h) => {
  g.fillStyle = '#1a8f4a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText('SAÍDA', 20, 35);
});
const texEscola = tex2d(128, 48, (g, w, h) => {
  g.fillStyle = '#1d4e89'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd43b'; g.font = 'bold 28px sans-serif'; g.fillText('ESCOLA', 14, 34);
});

// Cola uma placa (textura) na face de uma parede virada para (dx, dy)
function placa(tex, x, y, dx, dy, larg, alt, altura, cor) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshLambertMaterial({ map: tex, color: cor || 0xffffff }));
  m.position.set(x + dx * 0.505, altura, y + dy * 0.505); m.rotation.y = Math.atan2(dx, dy); cena.add(m);
}
// Decoração das paredes: lousas nas salas; relógio, faixa, murais e armários nos corredores
function decorarParede(x, y) {
  const aberta = (dx, dy) => { const c = celula(x + dx, y + dy); return c !== '#' && c !== 'D'; };
  if ((y === 0 || y === 6) && aberta(0, 1)) placa(texQuadro, x, y, 0, 1, 0.9, 0.45, 0.7);
  if (y === 4 && x === 9) return placa(texRelogio, x, y, 0, 1, 0.35, 0.35, 0.95);
  if (y === 4 && x === 4) return placa(texEscola, x, y, 0, 1, 0.9, 0.34, 0.95);
  for (const dy of [1, -1]) {
    const ny = y + dy;
    if ((ny === 5 || ny === 11) && aberta(0, dy)) {
      if (x % 4 === 0) placa(texMural, x, y, 0, dy, 0.9, 0.55, 0.7);
      else { placa(texArmario, x, y, 0, dy, 1, 0.95, 0.5, [0x5b8fd6, 0xd65b5b, 0x5bd69a][x % 3]); armarios.push({ x, y: ny }); }
    }
  }
}
let porta;
const armarios = [];
const itens = [];
const celula = (x, y) => (MAPA[Math.round(y)] || '')[Math.round(x)] || '#';

for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const ch = MAPA[y][x];
  if (ch === '#') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1), matParede[(x + y) % 2]);
    m.position.set(x, 0.6, y); cena.add(m);
    decorarParede(x, y);
  } else if (ch === 'D') {
    porta = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1), new THREE.MeshLambertMaterial({ color: 0x8a4b2a, emissive: 0x220000 }));
    porta.position.set(x, 0.6, y); cena.add(porta);
    placa(texSaida, x, y, -1, 0, 0.7, 0.26, 1.0);
  } else if ('BKC'.includes(ch)) {
    const cores = { B: 0x3b82f6, K: 0xffd43b, C: 0xff8c42 };
    const geo = ch === 'B' ? new THREE.BoxGeometry(0.3, 0.08, 0.22) : ch === 'K' ? new THREE.TorusGeometry(0.12, 0.04, 8, 16) : new THREE.CylinderGeometry(0.08, 0.06, 0.2, 12);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: cores[ch], emissive: cores[ch], emissiveIntensity: 0.35 }));
    m.position.set(x, 0.4, y); cena.add(m);
    itens.push({ tipo: ch, mesh: m, x, y, vivo: true });
  }
}

// Carteiras (mesa + cadeira): ocupam a célula e bloqueiam a passagem
const moveis = new Set();
const matMadeira = new THREE.MeshLambertMaterial({ color: 0xb98a55 });
const matMetal = new THREE.MeshLambertMaterial({ color: 0x59636e });
function carteira(x, y) {
  const g = new THREE.Group();
  const parte = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); g.add(m); };
  parte(new THREE.BoxGeometry(0.7, 0.05, 0.45), matMadeira, 0, 0.4, 0.1);
  [[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.05], [0.3, -0.05]].forEach(([lx, lz]) => parte(new THREE.BoxGeometry(0.04, 0.4, 0.04), matMetal, lx, 0.2, lz));
  parte(new THREE.BoxGeometry(0.35, 0.04, 0.35), matMetal, 0, 0.25, -0.3);
  parte(new THREE.BoxGeometry(0.35, 0.3, 0.04), matMetal, 0, 0.42, -0.47);
  g.position.set(x, 0, y); g.rotation.y = Math.PI;   // alunos olham para a lousa
  cena.add(g); moveis.add(x + ',' + y);
}
[[1,3],[3,3],[5,3],[7,3],[9,3],[11,3],[13,2],[13,3],[16,3],[17,2],[4,8],[6,8],[12,8],[14,8]].forEach(([x, y]) => carteira(x, y));

// Lâmpadas fluorescentes no teto
const geoLuz = new THREE.BoxGeometry(0.6, 0.03, 0.2), matLuz = new THREE.MeshBasicMaterial({ color: 0xffffff });
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (MAPA[y][x] !== '#' && MAPA[y][x] !== 'D' && (x + y) % 2 === 0) {
    const l = new THREE.Mesh(geoLuz, matLuz); l.position.set(x, 1.19, y); cena.add(l);
  }
}

// Boneco humanoide montado com formas simples (cabeça, tronco, braços e pernas articulados)
function criarBoneco(terno, gravata, cabelo, oculos) {
  const g = new THREE.Group(), L = c => new THREE.MeshLambertMaterial({ color: c, emissive: 0x0a0a0a });
  const pele = L(0xf0c9a0), mTerno = L(terno), mCalca = L(0x20242b), preto = L(0x111111);
  const peca = (geo, mat, x, y, z, pai = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); pai.add(m); return m; };
  const perna = x => {                       // gira no quadril
    const j = new THREE.Group(); j.position.set(x, 0.4, 0); g.add(j);
    peca(new THREE.BoxGeometry(0.11, 0.4, 0.12), mCalca, 0, -0.2, 0, j);
    peca(new THREE.BoxGeometry(0.12, 0.05, 0.2), preto, 0, -0.38, 0.03, j);   // sapato
    return j;
  };
  const braco = x => {                       // gira no ombro
    const j = new THREE.Group(); j.position.set(x, 0.78, 0); g.add(j);
    peca(new THREE.BoxGeometry(0.08, 0.34, 0.09), mTerno, 0, -0.17, 0, j);
    peca(new THREE.SphereGeometry(0.045, 8, 8), pele, 0, -0.37, 0, j);        // mão
    return j;
  };
  g.userData = { pernaE: perna(-0.08), pernaD: perna(0.08), bracoE: braco(-0.21), bracoD: braco(0.21) };
  peca(new THREE.BoxGeometry(0.34, 0.4, 0.19), mTerno, 0, 0.6, 0);                  // paletó
  peca(new THREE.BoxGeometry(0.09, 0.3, 0.02), L(0xffffff), 0, 0.64, 0.1);           // camisa
  peca(new THREE.BoxGeometry(0.045, 0.26, 0.02), L(gravata), 0, 0.62, 0.112);        // gravata
  peca(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 8), pele, 0, 0.82, 0);           // pescoço
  peca(new THREE.SphereGeometry(0.125, 16, 12), pele, 0, 0.94, 0);                   // cabeça
  peca(new THREE.SphereGeometry(0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), L(cabelo), 0, 0.99, -0.025);   // cabelo
  peca(new THREE.BoxGeometry(0.03, 0.04, 0.03), pele, 0, 0.93, 0.125);               // nariz
  [-0.05, 0.05].forEach(x => {
    peca(new THREE.SphereGeometry(0.025, 8, 8), L(0xffffff), x, 0.955, 0.105);       // olho
    peca(new THREE.SphereGeometry(0.012, 6, 6), preto, x, 0.955, 0.127);             // pupila
    const sob = peca(new THREE.BoxGeometry(0.06, 0.012, 0.01), preto, x, 0.978, 0.122);   // sobrancelha brava
    sob.rotation.z = x < 0 ? -0.35 : 0.35;
    if (oculos) peca(new THREE.TorusGeometry(0.032, 0.005, 6, 12), preto, x, 0.955, 0.12);
  });
  peca(new THREE.BoxGeometry(0.06, 0.012, 0.01), L(0x6b2a2a), 0, 0.895, 0.118);      // boca
  cena.add(g); return g;
}
const inspetor = criarBoneco(0x3a3f47, 0xc0392b, 0x8e8e8e, true);   // inspetor: terno cinza, gravata vermelha, óculos

// ===== Estado =====
let p, vidas, livros, temChave, estamina, cansado, tempo, ativo, imune, aviso, ultimo;
let nivel = 1, pontosTotal = 0, apitos = 2, escondido = false, proxima = false;
const livrosNec = () => 2 + nivel;
let cap = null;   // cena de captura em andamento

// Cena de captura: o inimigo corre até o aluno, estica os braços, agarra e levanta pela gola
function iniciarCaptura(e) {
  escondido = false; $('escuro').style.display = 'none';
  e.estado = 'agarra'; cap = { e, t: 0 };
}
function animarCaptura(dt) {
  cap.t += dt;
  const t = cap.t, e = cap.e;
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
  if (d > 0.5) { const m = Math.min(4 * dt, d - 0.5); e.x += dx / d * m; e.y += dy / d * m; }   // inspetor se aproxima
  let da = Math.atan2(-(e.x - p.x), -(e.y - p.y)) - p.a;                                           // aluno vira para ele
  da = Math.atan2(Math.sin(da), Math.cos(da)); p.a += da * Math.min(1, dt * 8);
  if (t > 0.45) $('pego').style.display = 'flex';
  if (t > 2.2) terminarCaptura();
}
function terminarCaptura() {
  cap.e.estado = 'patrulha'; cap = null;
  $('pego').style.display = 'none';
  vidas--; atualizarHud();
  if (vidas <= 0) return fim(false);
  posicionar();
}          // livros exigidos aumentam a cada fase

// Inimigos: o Inspetor e (na fase 3) o Diretor. Cada um tem um ESTADO: patrulha, persegue ou busca
const diretor = criarBoneco(0x1d3b7a, 0xffd43b, 0x3b2416, false);   // diretor: terno azul, gravata amarela
const inimigos = [inspetor, diretor].map((mesh, i) => ({ mesh, vel: i ? 1.15 : 1, ativo: false, x: 0, y: 0, estado: 'patrulha', alvo: null, rota: null, t: 0, espera: 0, achou: 0 }));
const resetInim = { estado: 'patrulha', alvo: null, rota: null, espera: 0, achou: 0 };

// Linha de visão: caminha em pequenos passos entre o inimigo e o jogador procurando paredes/carteiras
function veJogador(e) {
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (escondido || d > 7) return false;
  for (let t = 0.2; t < d; t += 0.2) {
    const x = e.x + (p.x - e.x) * t / d, y = e.y + (p.y - e.y) * t / d;
    if (celula(x, y) === '#' || moveis.has(Math.round(x) + ',' + Math.round(y))) return false;
  }
  return true;
}
function escolherPatrulha(e) {
  const livres = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (MAPA[y][x] !== '#' && MAPA[y][x] !== 'D' && !moveis.has(x + ',' + y) && Math.hypot(x - e.x, y - e.y) > 5) livres.push({ x, y });
  e.alvo = livres[Math.floor(Math.random() * livres.length)];
}
function atualizarInimigo(e, dt) {
  if (veJogador(e)) { e.estado = 'persegue'; e.alvo = { x: p.x, y: p.y }; }
  else if (e.estado === 'persegue') e.estado = 'busca';        // perdeu o jogador de vista: vai ao último lugar onde viu
  if (e.estado === 'patrulha' && !e.alvo) escolherPatrulha(e);
  if (!e.alvo || Math.hypot(e.alvo.x - e.x, e.alvo.y - e.y) < 0.4) {   // chegou ao destino
    if (e.estado === 'busca' && (e.espera += dt) > 1.5) { e.estado = 'patrulha'; e.alvo = null; e.espera = 0; }
    else if (e.estado === 'patrulha') e.alvo = null;
    return;
  }
  e.t -= dt;
  if (e.t <= 0) { e.rota = proximoPasso(e, e.alvo); e.t = 0.3; if (!e.rota) e.alvo = null; }
  const mesma = Math.round(e.alvo.x) === Math.round(e.x) && Math.round(e.alvo.y) === Math.round(e.y);
  const r = mesma ? [e.alvo.x, e.alvo.y] : e.rota;
  if (r) {
    const dx = r[0] - e.x, dy = r[1] - e.y, d = Math.hypot(dx, dy);
    const vel = { patrulha: 1.2, busca: 1.8, persegue: 2.2 }[e.estado] * e.vel * (1 + nivel * 0.08) * dt;
    if (d > 0.01) { e.x += dx / d * Math.min(vel, d); e.y += dy / d * Math.min(vel, d); }
  }
}

// E: esconder-se / sair do armário mais próximo
function alternarEsconderijo() {
  if (escondido) { escondido = false; $('escuro').style.display = 'none'; return; }
  const a = armarios.find(a => Math.hypot(a.x - p.x, a.y - p.y) < 0.9);
  if (!a) return msg('Chegue perto de um armário e aperte E', 1500);
  if (inimigos.some(e => e.ativo && veJogador(e) && Math.hypot(e.x - p.x, e.y - p.y) < 2.5)) return msg('Ele está olhando! Muito perto para se esconder.', 1500);
  escondido = true; p.x = a.x; p.y = a.y; $('escuro').style.display = 'flex';
}
// F: joga um apito à frente; os inimigos próximos vão investigar o barulho
function lancarApito() {
  if (apitos <= 0) return msg('Sem apitos!', 1200);
  apitos--;
  let tx = p.x, ty = p.y;
  for (let d = 0.5; d < 7; d += 0.5) {
    const x = p.x - Math.sin(p.a) * d, y = p.y - Math.cos(p.a) * d;
    if (celula(x, y) === '#' || moveis.has(Math.round(x) + ',' + Math.round(y))) break;
    tx = x; ty = y;
  }
  inimigos.forEach(e => { if (e.ativo && Math.hypot(e.x - tx, e.y - ty) < 12) { e.estado = 'busca'; e.alvo = { x: Math.round(tx), y: Math.round(ty) }; e.espera = 0; } });
  msg('📢 Apito! O inimigo foi investigar o barulho.', 1500); atualizarHud();
}
addEventListener('keydown', e => { if (!ativo || cap || e.repeat) return; if (e.code === 'KeyE') alternarEsconderijo(); if (e.code === 'KeyF') lancarApito(); });
document.querySelectorAll('[data-acao]').forEach(b => b.addEventListener('click', () => { if (!ativo || cap) return; b.dataset.acao === 'E' ? alternarEsconderijo() : lancarApito(); }));

function resetar() {
  vidas = 3; livros = 0; temChave = false; estamina = 100; cansado = false; tempo = 200 - nivel * 20; imune = 0; apitos = 2; escondido = false; $('escuro').style.display = 'none';
  itens.forEach(i => { i.vivo = true; i.mesh.visible = true; });
  posicionar(); atualizarHud();
}
function posicionar() {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (MAPA[y][x] === 'P') p = { x, y, a: -Math.PI / 2 };
    if (MAPA[y][x] === 'I') Object.assign(inimigos[0], resetInim, { x, y, ativo: true });
  }
  Object.assign(inimigos[1], resetInim, { x: 17, y: 1, ativo: nivel >= 3 });   // Diretor só aparece na fase 3
  imune = 2;
}
function atualizarHud() {
  $('vidas').textContent = vidas; $('livros').textContent = livros;
  $('nec').textContent = livrosNec(); $('apitos').textContent = apitos; $('fase').textContent = nivel;
  $('chave').textContent = temChave ? 'sim' : 'não'; $('tempo').textContent = Math.max(0, Math.ceil(tempo));
}
function msg(t, ms = 2000) {
  const a = $('aviso'); a.textContent = t; a.style.opacity = 1;
  clearTimeout(aviso); aviso = setTimeout(() => a.style.opacity = 0, ms);
}

// Colisão: testa os 4 cantos do jogador
function livre(x, y, r = 0.25) {
  return [[-r, -r], [r, -r], [-r, r], [r, r]].every(([dx, dy]) => celula(x + dx, y + dy) !== '#' && celula(x + dx, y + dy) !== 'D' && !moveis.has(Math.round(x + dx) + ',' + Math.round(y + dy)));
}

// Busca em largura (BFS): primeiro passo do caminho do inspetor até o jogador
function proximoPasso(de, para) {
  const ini = [Math.round(de.x), Math.round(de.y)], fim = [Math.round(para.x), Math.round(para.y)];
  const fila = [ini], veio = { [ini]: null };
  while (fila.length) {
    const [cx, cy] = fila.shift();
    if (cx === fim[0] && cy === fim[1]) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, k = [nx, ny];
      if (!(k in veio) && celula(nx, ny) !== '#' && celula(nx, ny) !== 'D' && !moveis.has(nx + ',' + ny)) { veio[k] = [cx, cy]; fila.push(k); }
    }
  }
  let atual = fim;
  if (!(atual in veio)) return null;
  while (veio[atual] && String(veio[atual]) !== String(ini)) atual = veio[atual];
  return atual;
}

// ===== Atualização por quadro =====
function atualizar(dt) {
  tempo -= dt;
  if (imune > 0) imune -= dt;
  // girar e andar
  p.a += ((teclas.ArrowLeft || teclas.KeyA ? 1 : 0) - (teclas.ArrowRight || teclas.KeyD ? 1 : 0)) * 2.2 * dt;
  const mv = (teclas.ArrowUp || teclas.KeyW ? 1 : 0) - (teclas.ArrowDown || teclas.KeyS ? 1 : 0);
  const quer = (teclas.ShiftLeft || teclas.ShiftRight || teclas.Space) && mv > 0;
  const corre = quer && !cansado && estamina > 0;
  estamina = Math.max(0, Math.min(100, estamina + (corre ? -35 : 16) * dt));
  if (estamina <= 0) cansado = true; if (estamina > 25) cansado = false;
  $('estamina').style.width = estamina + '%';
  const v = escondido ? 0 : (corre ? 4.2 : 2.6) * mv * dt;
  const nx = p.x - Math.sin(p.a) * v, ny = p.y - Math.cos(p.a) * v;
  if (livre(nx, p.y)) p.x = nx;
  if (livre(p.x, ny)) p.y = ny;

  // coletar itens
  itens.forEach(i => {
    if (!i.vivo) return;
    i.mesh.rotation.y += dt * 2; i.mesh.position.y = 0.4 + Math.sin(performance.now() / 300 + i.x) * 0.05;
    if (Math.hypot(i.x - p.x, i.y - p.y) < 0.5) {
      i.vivo = false; i.mesh.visible = false;
      if (i.tipo === 'B') { livros++; msg('📚 Livro coletado!'); }
      if (i.tipo === 'K') { temChave = true; msg('🔑 Você achou a chave!'); }
      if (i.tipo === 'C') { estamina = 100; cansado = false; msg('☕ Energia recarregada!'); }
    }
  });

  // inimigos: cada um decide o que fazer conforme seu estado (veja atualizarInimigo)
  inimigos.forEach(e => { if (e.ativo) atualizarInimigo(e, dt); });
  for (const e of inimigos) {
    if (!e.ativo) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (escondido && d < 1.2 && e.estado !== 'patrulha') e.achou += dt; else e.achou = 0;
    if (escondido ? e.achou > 1.5 : (imune <= 0 && d < 0.5)) {   // escondido: só te acham se ficarem por perto
      iniciarCaptura(e); return;
    }
  }

  // porta de saída
  const dp = Math.hypot(p.x - (W - 1), p.y - 5);
  if (dp < 1.3) {
    if (temChave && livros >= livrosNec()) return fim(true);
    msg('🚪 Trancada! Precisa da chave e de ' + livrosNec() + ' livros.', 1500);
  }
  porta.material.emissive.setHex(temChave && livros >= livrosNec() ? 0x0a6b2a : 0x220000);
  if (tempo <= 0) return fim(false, 'O tempo acabou!');
  atualizarHud();
}

function fim(venceu, motivo) {
  ativo = false;
  const pontos = livros * 100 + Math.max(0, Math.ceil(tempo)) * 2 + vidas * 50;
  $('tela').style.display = 'flex';
  $('tela').querySelector('h1').textContent = venceu ? '🎉 Você escapou!' : '💀 Fim de jogo';
  $('tela').querySelectorAll('p')[0].textContent = venceu ? 'Pontuação: ' + pontos + ' pontos.' : (motivo || 'O inspetor te pegou.');
  $('tela').querySelectorAll('p')[1].textContent = '';
  $('btn').textContent = 'Jogar de novo'; proxima = false;
  $('escuro').style.display = 'none'; escondido = false;
  if (venceu) {
    pontosTotal += pontos; proxima = nivel < 3;
    $('tela').querySelectorAll('p')[0].textContent = 'Pontos acumulados: ' + pontosTotal;
    $('tela').querySelector('h1').textContent = proxima ? '🎉 Fase ' + nivel + ' concluída!' : '🏆 Você zerou a escola!';
    if (proxima) $('btn').textContent = 'Próxima fase';
  }
}

// ===== Minimapa =====
const mini = $('mini').getContext('2d'), S = 8;
function desenharMini() {
  mini.clearRect(0, 0, 152, 104);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    mini.fillStyle = MAPA[y][x] === '#' ? '#56626f' : MAPA[y][x] === 'D' ? '#8a4b2a' : '#1d252e';
    mini.fillRect(x * S, y * S, S, S);
  }
  mini.fillStyle = '#8a6a3a'; moveis.forEach(k => { const [a, b] = k.split(',').map(Number); mini.fillRect(a * S + 1, b * S + 1, S - 2, S - 2); });
  itens.forEach(i => { if (i.vivo) { mini.fillStyle = '#ffd43b'; mini.fillRect(i.x * S + 2, i.y * S + 2, 4, 4); } });
  inimigos.forEach(e => { if (!e.ativo) return; mini.fillStyle = e.estado === 'persegue' ? '#ff0000' : e.estado === 'busca' ? '#ff9a5a' : '#ffd0a0'; mini.fillRect((e.x + .5) * S - 3, (e.y + .5) * S - 3, 6, 6); });
  mini.fillStyle = '#4cc38a'; mini.beginPath(); mini.arc((p.x + .5) * S, (p.y + .5) * S, 3.5, 0, 7); mini.fill();
}

// ===== Loop principal =====
function quadro(t) {
  requestAnimationFrame(quadro);
  const dt = Math.min(0.05, (t - ultimo) / 1000 || 0); ultimo = t;
  if (ativo) cap ? animarCaptura(dt) : atualizar(dt);
  if (!p) return;
  cam.rotation.order = 'YXZ';
  if (cap) {   // câmera da captura: treme, sobe (aluno levantado) e olha para baixo, para o inspetor
    const t = cap.t, lev = Math.max(0, Math.min(1, (t - 0.6) / 1.0)), tr = t > 0.5 ? 0.03 : 0, r = () => (Math.random() - 0.5) * tr;
    cam.position.set(p.x + r(), 0.6 + lev * 0.45 + r(), p.y + r());
    cam.rotation.set(-lev * 0.45 + r(), p.a + r(), 0);
  } else { cam.position.set(p.x, escondido ? 0.45 : 0.6, p.y); cam.rotation.set(0, p.a, 0); }
  inimigos.forEach(e => {
    e.mesh.visible = !!e.ativo; e.mesh.position.set(e.x, 0, e.y);
    const dx = e.x - (e.px ?? e.x), dy = e.y - (e.py ?? e.y), andou = Math.hypot(dx, dy);
    e.px = e.x; e.py = e.y;
    if (andou > 0.0005 && andou < 0.5) { e.mesh.lookAt(e.x + dx, 0, e.y + dy); e.fase = (e.fase || 0) + andou * 12; }   // olha para onde anda
    const mexe = andou > 0.0005, s = mexe ? Math.sin(e.fase || 0) * 0.6 : 0, b = e.mesh.userData;
    b.pernaE.rotation.x = s; b.pernaD.rotation.x = -s;                  // pernas balançam ao andar
    const bra = e.estado === 'agarra' ? -1.55 : e.estado === 'persegue' ? -1.3 : 0;                       // perseguindo: braços esticados para frente
    b.bracoE.rotation.x = bra - s * (bra ? 0.2 : 1); b.bracoD.rotation.x = bra + s * (bra ? 0.2 : 1);
    e.mesh.position.y = mexe ? Math.abs(Math.sin(e.fase || 0)) * 0.02 : 0;
    if (cap && cap.e === e) { e.mesh.lookAt(p.x, 0, p.y); if (cap.t > 0.5) e.mesh.position.y = 0.03 * Math.sin(cap.t * 40); }   // agarra e sacode
  });
  desenharMini();
  rend.render(cena, cam);
}

// Olhar arrastando o mouse/dedo
let arrasto = null;
$('cena').addEventListener('pointerdown', e => arrasto = e.clientX);
addEventListener('pointerup', () => arrasto = null);
addEventListener('pointermove', e => { if (arrasto !== null && ativo) { p.a -= (e.clientX - arrasto) * 0.006; arrasto = e.clientX; } });

$('btn').addEventListener('click', () => {
  if (proxima) nivel++; else { nivel = 1; pontosTotal = 0; }
  resetar(); $('tela').style.display = 'none'; ativo = true;
  msg('Fase ' + nivel + (nivel === 3 ? ': o Diretor também está te procurando!' : ''), 2500);
});
resetar(); redimensionar(); ativo = false;
requestAnimationFrame(t => { ultimo = t; quadro(t); });