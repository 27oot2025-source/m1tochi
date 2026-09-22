/* ============================================================
   ВЕКТОР-9 // SYSTEM CORE v9.87
   ============================================================ */
'use strict';

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const wait = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

/* ============================================================
   ЗВУК (WebAudio)
   ============================================================ */
let audioCtx = null;
let soundOn = localStorage.getItem('v9-sound') !== 'off';

function ac() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* нет звука — переживём */ }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function beep(freq = 880, dur = 0.06, type = 'square', vol = 0.035, when = 0) {
  if (!soundOn) return;
  const ctx = ac(); if (!ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  click:  () => beep(1250, 0.045, 'square', 0.03),
  tab:    () => { beep(700, 0.04, 'square', 0.03); beep(1400, 0.06, 'square', 0.025, 0.05); },
  type:   () => beep(rand(1800, 2400), 0.012, 'square', 0.012),
  ok:     () => { beep(660, 0.07, 'square', 0.03); beep(990, 0.09, 'square', 0.03, 0.07); },
  err:    () => beep(140, 0.22, 'sawtooth', 0.045),
  alarm:  () => { beep(880, 0.1, 'sawtooth', 0.04); beep(880, 0.1, 'sawtooth', 0.04, 0.15); },
  modem:  () => { beep(1200, 0.15, 'sine', 0.03); beep(2250, 0.2, 'sine', 0.03, 0.18); beep(1600, 0.09, 'square', 0.02, 0.42); beep(2100, 0.3, 'sawtooth', 0.016, 0.55); },
};
$('#sound-state').textContent = soundOn ? 'ВКЛ' : 'ВЫКЛ';
$('#sound-toggle').addEventListener('click', () => {
  soundOn = !soundOn;
  localStorage.setItem('v9-sound', soundOn ? 'on' : 'off');
  $('#sound-state').textContent = soundOn ? 'ВКЛ' : 'ВЫКЛ';
  if (soundOn) sfx.ok();
});
document.addEventListener('pointerdown', () => ac(), { once: true });

/* ============================================================
   BOOT SEQUENCE
   ============================================================ */
const bootLines = [
  'VECTOR-9 BIOS v9.08.7 ................  СТАРТ',
  'ПРОВЕРКА ПАМЯТИ ...................... 16384K OK',
  'ИНИЦИАЛИЗАЦИЯ КИБЕРПРОСТРАНСТВА ...... OK',
  'ДРАЙВЕР НЕЙРОИНТЕРФЕЙСА .............. OK',
  'ПОИСК BLACK ICE ...................... НЕ НАЙДЕН. ПОКА ЧТО.',
  'ПОДКЛЮЧЕНИЕ К ДАТАНЕТ ................ 9600 БОД ... OK',
  'СИНХРОНИЗАЦИЯ ХРОНОМЕТРА ............. 2087 ГОД ... OK',
  '',
  'ДОБРО ПОЖАЛОВАТЬ, ГОСТЬ.',
  '',
  '> ЗАПУСК ИНТЕРФЕЙСА _',
];
let bootDone = false;

async function runBoot() {
  const boot = $('#boot'), log = $('#boot-log');
  boot.classList.remove('done');
  boot.style.display = 'flex';
  log.textContent = '';
  bootDone = false;
  let skip = false;
  const onSkip = () => { skip = true; };
  boot.addEventListener('pointerdown', onSkip, { once: true });

  for (const line of bootLines) {
    if (skip) break;
    for (const ch of line) {
      if (skip) break;
      log.textContent += ch;
      if (ch !== ' ' && Math.random() < 0.4) sfx.type();
      await wait(rand(6, 16));
    }
    if (skip) break;
    log.textContent += '\n';
    await wait(rand(60, 160));
  }
  log.textContent = bootLines.join('\n');
  await wait(skip ? 250 : 500);
  sfx.ok();
  boot.classList.add('done');
  bootDone = true;
  setTimeout(() => { boot.style.display = 'none'; }, 700);
}
runBoot();

/* ============================================================
   РОУТЕР (вкладки)
   ============================================================ */
const ROUTES = ['home', 'products', 'datanet', 'terminal', 'corp', 'contact'];
let currentRoute = null;

function router() {
  const name = (location.hash.replace(/^#\/?/, '') || 'home').toLowerCase();
  const route = ROUTES.includes(name) ? name : 'home';

  if (route === currentRoute) return;
  const first = currentRoute === null;
  currentRoute = route;

  if (!first) {
    const flash = $('#channel-flash');
    flash.classList.remove('on');
    void flash.offsetWidth;
    flash.classList.add('on');
    sfx.tab();
  }

  $$('.route').forEach(s => s.classList.toggle('active', s.id === 'route-' + route));
  $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  window.scrollTo({ top: 0, behavior: 'instant' });

  const titles = {
    home: 'ВЕКТОР-9 // ГЛАВНАЯ', products: 'ВЕКТОР-9 // ПРОДУКЦИЯ',
    datanet: 'ВЕКТОР-9 // ДАТАНЕТ', terminal: 'ВЕКТОР-9 // ТЕРМИНАЛ',
    corp: 'ВЕКТОР-9 // КОРП', contact: 'ВЕКТОР-9 // СВЯЗЬ',
  };
  document.title = titles[route] + ' — 2087';

  if (route === 'terminal') setTimeout(() => $('#term-input').focus(), 120);
}
window.addEventListener('hashchange', router);
router();

/* ============================================================
   CRT TOGGLE
   ============================================================ */
$('#crt-toggle').addEventListener('click', () => {
  document.body.classList.toggle('crt-off');
  const off = document.body.classList.contains('crt-off');
  $('#crt-state').textContent = off ? 'ВЫКЛ' : 'ВКЛ';
  sfx.click();
});

/* ============================================================
   ЧАСЫ — 2087 ГОД
   ============================================================ */
function tickClock() {
  const n = new Date();
  const p = x => String(x).padStart(2, '0');
  $('#clock-date').textContent = `${p(n.getDate())}.${p(n.getMonth() + 1)}.2087`;
  $('#clock-time').textContent = `${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
  $('#tt-date') && ($('#tt-date').textContent = `${p(n.getDate())}.${p(n.getMonth() + 1)}.2087`);
}
setInterval(tickClock, 1000); tickClock();

/* ============================================================
   ЖИВЫЕ СЧЁТЧИКИ
   ============================================================ */
let nodes = 4096, clients = 984317, ice = 0;
const t0 = Date.now();
setInterval(() => {
  nodes = Math.max(1024, nodes + rand(-17, 21));
  clients = Math.max(1000, clients + rand(-40, 55));
  if (Math.random() < 0.08) { ice += rand(1, 3); sfx.alarm(); }
  if (ice > 13) ice = 0;
  $('#stat-nodes').textContent = nodes.toLocaleString('ru-RU');
  $('#stat-clients').textContent = clients.toLocaleString('ru-RU');
  $('#stat-ice').textContent = ice;
  const s = Math.floor((Date.now() - t0) / 1000);
  const p = x => String(x).padStart(2, '0');
  $('#stat-uptime').textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
}, 1000);

/* ============================================================
   БЕГУЩАЯ СТРОКА
   ============================================================ */
const tickerLines = [
  '◄ КУРС КРЕДИТА: 1 КР. = 1 КР. СТАБИЛЬНОСТЬ — НАШЕ ВСЁ ►',
  '◄ ВНИМАНИЕ: В СЕКТОРЕ 7 ЗАМЕЧЕН БЕЗОПАСНЫЙ ГРАФФИТИ-РОБОТ. НЕ ПОДХОДИТЬ. ОН ОБИЖАЕТСЯ ►',
  '◄ ВЕКТОР-9: НАПОМИНАЕМ ПРО ВЫГОДНЫЙ АПГРЕЙД ПАМЯТИ ДО 32 Мб ►',
  '◄ ПОГОДА НА 2087: КИСЛОТНЫЙ ДОЖДЬ DE LUXE, НЕОН, +21° ►',
  '◄ ДРОН-КУРЬЕР №404 ВСЁ ЕЩЁ НЕ НАЙДЕН. ЕСЛИ ВЫДЕЛИТЕ ЕГО — ОН ПЛАТИТ ►',
  '◄ НАПОМИНАНИЕ: ВАША УЛЫБКА УЖЕ ОЦИФРОВАНА. СПАСИБО ЗА СОТРУДНИЧЕСТВО ►',
];
$('#ticker-track').innerHTML = (tickerLines.concat(tickerLines)).map(t => `<span>${t}</span>`).join('');

/* ============================================================
   СТАТУС-БАР
   ============================================================ */
const sbMsgs = ['ICE: НОРМА', 'ПАМЯТЬ: 640K OK', 'АНТЕННА: 87°', 'НАКОПИТЕЛЬ: ЖУЖЖИТ', 'КОТ: НА ПОСТУ', 'СИГНАЛ: 99.9%', 'ТЕРМО: 36.6 ИРОНИИ'];
let sbIdx = 0;
setInterval(() => { sbIdx = (sbIdx + 1) % sbMsgs.length; $('#sb-random').textContent = sbMsgs[sbIdx]; }, 4000);

/* ============================================================
   ТОСТ
   ============================================================ */
let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ============================================================
   КОРЗИНА
   ============================================================ */
const cart = [];

function renderCart() {
  const list = $('#cart-list');
  list.innerHTML = '';
  let total = 0;
  cart.forEach((it, i) => {
    total += it.price;
    const li = document.createElement('li');
    li.innerHTML = `<span>${it.name}</span><span>${it.price.toLocaleString('ru-RU')} кр. <button class="rm" data-i="${i}" title="Удалить">[X]</button></span>`;
    list.appendChild(li);
  });
  $('#cart-total').textContent = total.toLocaleString('ru-RU');
  $('#cart-count').textContent = cart.length;
}

$$('.btn-buy').forEach(b => b.addEventListener('click', () => {
  cart.push({ name: b.dataset.name, price: +b.dataset.price });
  renderCart();
  sfx.ok();
  const btn = $('#cart-open');
  btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse');
  toast('▸ ЗАПИСАНО В ПАМЯТЬ: ' + b.dataset.name);
}));

$('#cart-list').addEventListener('click', e => {
  if (e.target.classList.contains('rm')) {
    cart.splice(+e.target.dataset.i, 1);
    renderCart(); sfx.err();
  }
});
$('#cart-open').addEventListener('click', () => { $('#cart-drawer').classList.add('open'); sfx.click(); });
$('#cart-close').addEventListener('click', () => { $('#cart-drawer').classList.remove('open'); sfx.click(); });

$('#cart-checkout').addEventListener('click', async () => {
  const log = $('#cart-log');
  if (!cart.length) {
    log.textContent = 'ОШИБКА: КАССЕТА ПУСТА. ДОБАВЬТЕ ЧТО-НИБУДЬ ЖЕЛАЕМОЕ.';
    sfx.err(); return;
  }
  const total = cart.reduce((s, i) => s + i.price, 0);
  const lines = [
    'ИНИЦИАЛИЗАЦИЯ ЗАКАЗА ...',
    'ATDT 095-555-08-77 ...',
    'CONNECT 9600/ARQ',
    'ПЕРЕДАЧА ' + cart.length + ' ПОЗИЦИЙ НА ' + total.toLocaleString('ru-RU') + ' КР. ... OK',
    'ОТВЕТ СЕРВЕРА: "ПРИНЯТО. КУРЬЕР-ДРОН ВЫЛЕТЕЛ."',
    'ДРОН ПРИБУДЕТ ЧЕРЕЗ 40 МИНУТ. НЕ ВЫХОДИТЕ ИЗ КИБЕРПРОСТРАНСТВА.',
  ];
  log.textContent = '';
  sfx.modem();
  for (const l of lines) {
    log.textContent += l + '\n';
    beep(rand(400, 900), 0.05, 'square', 0.02);
    await wait(420);
  }
  cart.length = 0; renderCart();
  sfx.ok();
  toast('▸ ЗАКАЗ ПЕРЕДАН. ДРОН УЖЕ В ПУТИ.');
});

/* ============================================================
   ТЕРМИНАЛ
   ============================================================ */
const termOut = $('#term-output');
const termInput = $('#term-input');
const history = [];
let hIdx = -1;

function tprint(text, cls = '') {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.textContent = text;
  termOut.appendChild(d);
  $('#terminal').scrollTop = $('#terminal').scrollHeight;
  return d;
}
async function ttype(text, cls = '', cps = 1) {
  const d = tprint('', cls);
  for (const ch of text) {
    d.textContent += ch;
    if (Math.random() < 0.5) sfx.type();
    $('#terminal').scrollTop = $('#terminal').scrollHeight;
    await wait(cps * rand(2, 6));
  }
}
$('#terminal').addEventListener('click', () => termInput.focus());

const THEMES = ['magenta', 'cyan', 'green', 'amber'];
function setTheme(name) {
  if (!THEMES.includes(name)) return false;
  document.body.classList.remove(...THEMES.map(t => 'theme-' + t));
  document.body.classList.add('theme-' + name);
  return true;
}

const CMDS = {
  help() {
    tprint('ДОСТУПНЫЕ КОМАНДЫ:', 'term-ok');
    [
      ['help',                 'этот список'],
      ['catalog',              'каталог продукции (текст)'],
      ['news',                 'свежие заголовки Датанета'],
      ['about',                'короткая справка о ВЕКТОР-9'],
      ['goto <вкладка>',       'перейти: home/products/datanet/terminal/corp/contact'],
      ['hack [цель]',          'взломать цель. не стоит. стоит.'],
      ['color <фосфор>',       'тема: magenta/cyan/green/amber'],
      ['sound <on|off>',       'звук интерфейса'],
      ['date',                 'текущая дата и время (2087)'],
      ['ls / cat <файл>',      'файловая система'],
      ['whoami',               'кто ты, раннер?'],
      ['42',                   'ответ'],
      ['clear',                'очистить экран'],
      ['reboot',               'перезагрузка BIOS'],
      ['exit',                 'выход. если получится.'],
    ].forEach(([c, d]) => tprint('  ' + c.padEnd(20, '.') + ' ' + d, 'term-dim'));
  },
  catalog() {
    tprint('=== КАТАЛОГ // СЕРИЯ 2087 ===', 'term-acc');
    [
      ['V9-001', 'VK-9 «НОЧНОЙ БЕГЕМОТ»', '12 400 кр.'],
      ['V9-002', '«КОРТЕКС LINK v3»',      ' 7 800 кр.'],
      ['V9-003', '«ТИТАН ПАУК»',           '15 900 кр.'],
      ['V9-004', '«ЛЕДОКОЛ-2» [ОПАСЕН]',   ' 4 200 кр.'],
      ['V9-005', 'Оптика «СОВА»',          ' 3 600 кр.'],
      ['V9-006', '«АУРА-2000»',            ' 2 400 кр.'],
    ].forEach(([id, n, p]) => tprint(`  ${id}  ${n.padEnd(26, '.')} ${p}`, 'term-dim'));
    tprint('Купить: goto products', 'term-acc2');
  },
  news() {
    tprint('=== ДАТАНЕТ // ТОП-3 ===', 'term-acc');
    tprint(' 1. КОРПЫ ОБЪЯВИЛИ ЦЕНЫ НА ВОЗДУХ. ВОЗДУХ ПРОТИВ.');
    tprint(' 2. ВЕКТОР-9 ПОКАЗАЛ VK-X. ПРЕССЕ ПОКАЗАЛИ ТУМБЛЕР.');
    tprint(' 3. ДРОНЫ ПОЧТЫ СОБРАЛИСЬ В КРУГ. ЦЕЛЬ НЕИЗВЕСТНА.');
    tprint('Полная лента: goto datanet', 'term-acc2');
  },
  about() {
    tprint('ВЕКТОР-9 SYSTEMS. ОСНОВАНА В 1987. ШТАБ: БАШНЯ В-9, ЭТАЖ −8.', 'term-ok');
    tprint('ДЕК: 14 МЛН. КОТОВ: 1. СОЖАЛЕНИЙ: 0.', 'term-ok');
  },
  date() {
    tprint('СЕЙЧАС: ' + $('#clock-date').textContent + ' ' + $('#clock-time').textContent + ' МСК', 'term-ok');
  },
  whoami() { tprint('ГОСТЬ. РАННЕР. ВОЗМОЖНО — ЛЕГЕНДА. ЗАКОНОМ НЕ ОПРЕДЕЛЕНО.', 'term-warn'); },
  clear() { termOut.innerHTML = ''; },
  ls() {
    tprint('readme.txt   catalog.dat   secret.exe   kot.txt   ice_do_not_touch/', 'term-dim');
  },
  echo(args) { tprint(args.join(' ')); },
  sound(args) {
    const v = (args[0] || '').toLowerCase();
    if (v === 'on' || v === 'off') {
      soundOn = v === 'on';
      localStorage.setItem('v9-sound', soundOn ? 'on' : 'off');
      $('#sound-state').textContent = soundOn ? 'ВКЛ' : 'ВЫКЛ';
      tprint('ЗВУК: ' + (soundOn ? 'ВКЛ' : 'ВЫКЛ'), 'term-ok'); sfx.ok();
    } else tprint('ИСПОЛЬЗОВАНИЕ: sound on|off', 'term-err');
  },
  color(args) {
    const v = (args[0] || '').toLowerCase();
    if (!v) { tprint('ТЕМЫ: ' + THEMES.join(' / '), 'term-ok'); return; }
    if (setTheme(v)) { tprint('ФОСФОР: ' + v.toUpperCase() + '. ПРИЯТНОГО СВЕЧЕНИЯ.', 'term-ok'); sfx.ok(); }
    else { tprint('НЕТ ТАКОГО ФОСФОРА. ЕСТЬ: ' + THEMES.join(', '), 'term-err'); sfx.err(); }
  },
  matrix() { setTheme('green'); tprint('СЛЕДИ ЗА БЕЛЫМ КРОЛИКОМ. XОТЯ У НАС КОТ.', 'term-ok'); },
  sudo() { tprint('ХА. НЕТ. ДАЖЕ КОТ НЕ ИМЕЕТ root-ДОСТУПА.', 'term-err'); sfx.err(); },
  '42'() { tprint('ОТВЕТ НА ГЛАВНЫЙ ВОПРОС. ВОПРОС ХРАНИТСЯ ЗА 14 СТЕНАМИ ICE.', 'term-ok'); },
  reboot() { tprint('ПЕРЕЗАГРУЗКА ...', 'term-warn'); setTimeout(runBoot, 700); },
  exit() {
    tprint('ВЫХОД НЕВОЗМОЖЕН. ТЫ С НАМИ НАВСЕГДА.', 'term-err');
    setTimeout(() => tprint('...ШУТКА. НОТ ЦЕЛИКОМ. СТРАХОВКА УЖЕ СПИСАНА.', 'term-dim'), 900);
  },
  goto(args) {
    const v = (args[0] || '').toLowerCase();
    if (ROUTES.includes(v)) { tprint('ПЕРЕХОД >> ' + v.toUpperCase(), 'term-ok'); location.hash = '/' + v; }
    else { tprint('МАРШРУТ НЕ НАЙДЕН. ДОСТУПНО: ' + ROUTES.join(', '), 'term-err'); sfx.err(); }
  },
  cat(args) {
    const f = (args[0] || '').toLowerCase();
    const files = {
      'readme.txt': 'ДОБРО ПОЖАЛОВАТЬ НА ВЕКТОР-9. НЕ СЪЕЗЖАЙ С ВЕКТОРА.',
      'catalog.dat': 'ДВОИЧНАЯ КАССЕТА. ПЕЧАТАТЬ — БЕСПОЛЕЗНО. СМ. catalog.',
      'kot.txt': 'КОТ ВК-87. СТАТУС: НА ПОСТУ. НАСТРОЕНИЕ: КОТ.',
      'secret.exe': 'ДОСТУП ЗАПРЕЩЁН. ИНЦИДЕНТ ЗАЛОГИРОВАН. ДРОН ВЫЕХАЛ. ШУТКА. МОЖЕТ БЫТЬ.',
      'ice_do_not_touch': 'ТЫ ПРАВДА ДУМАЛ, ЧТО СЮДА МОЖНО?',
    };
    if (files[f]) { tprint(files[f], f.includes('secret') || f.includes('ice') ? 'term-err' : 'term-ok'); if (f.includes('secret') || f.includes('ice')) sfx.alarm(); }
    else tprint('cat: ' + f + ': ФАЙЛ НЕ НАЙДЕН. ПОПРОБУЙ ls', 'term-err');
  },
  async hack(args) {
    const target = (args.join(' ') || 'АНКАРА-ЧИП').toUpperCase();
    sfx.alarm();
    await ttype('>> ИНИЦИАЛИЗАЦИЯ ПОСЛЕДОВАТЕЛЬНОСТИ ВЗЛОМА :: ЦЕЛЬ: ' + target, 'term-warn');
    await wait(400);
    const lines = [
      ['СКАНИРОВАНИЕ ПОРТОВ 1..1024 ........ ОТКРЫТО: 4', 'term-dim', 380],
      ['ОБНАРУЖЕН ICE: BLACKWALL mk.IV ..... УГРОЗА: ПЛОХАЯ', 'term-err', 500],
      ['ЗАПУСК ЛЕДОКОЛА-2 .................. ЗАРЯД 87%', 'term-acc', 420],
      ['АТАКА [██░░░░░░░░] 20%', 'term-acc2', 260],
      ['АТАКА [█████░░░░░] 52%', 'term-acc2', 260],
      ['АТАКА [████████░░] 81%', 'term-acc2', 260],
      ['АТАКА [██████████] 100% .. ЛЁД ПРОБИТ', 'term-ok', 300],
      ['ОБХОД ТРАССИРОВКИ ................... OK', 'term-dim', 380],
      ['ДОСТУП К ЯДРУ ' + target + ' ..... ПОЛУЧЕН', 'term-ok', 420],
    ];
    for (const [l, c, w] of lines) { tprint(l, c); await wait(w); }
    await ttype('>> ACCESS GRANTED. ДАННЫЕ СКОПИРОВАНЫ НА КАССЕТУ №7.', 'term-ok', 2);
    await wait(600);
    tprint('!! ВНИМАНИЕ: ОТВЕТНЫЙ СЛЕД. РАЗРЫВ ЧЕРЕЗ 3 .. 2 .. 1 ..', 'term-err'); sfx.alarm();
    await wait(900);
    tprint('>> СОЕДИНЕНИЕ РАЗОРВАНО. СЛЕД ПОТЕРЯН В СЕКТОРЕ 7. ВЫ ЧИСТЫ.', 'term-dim');
    toast('▸ КАССЕТА №7 ДОБАВЛЕНА В ТВОЮ ЛЕГЕНДУ');
  },
};
CMDS['?'] = CMDS.help;
CMDS.справка = CMDS.help;
CMDS.каталог = CMDS.catalog;

termInput.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp')   { e.preventDefault(); if (history.length) { hIdx = Math.max(0, hIdx === -1 ? history.length - 1 : hIdx - 1); termInput.value = history[hIdx]; } }
  if (e.key === 'ArrowDown') { e.preventDefault(); if (history.length) { hIdx = hIdx + 1; if (hIdx >= history.length) { hIdx = -1; termInput.value = ''; } else termInput.value = history[hIdx]; } }
});

$('#term-form').addEventListener('submit', e => {
  e.preventDefault();
  const raw = termInput.value.trim();
  if (!raw) return;
  tprint('guest@vector-9:~$ ' + raw, 'term-acc');
  history.push(raw); hIdx = -1;
  termInput.value = '';
  sfx.click();

  const [cmd, ...args] = raw.split(/\s+/);
  const fn = CMDS[cmd.toLowerCase()];
  if (fn) fn(args);
  else {
    tprint(`КОМАНДА НЕ ОПОЗНАНА: "${cmd}". ВВЕДИ help — И ТЫ УВИДИШЬ ДВЕРЬ.`, 'term-err');
    sfx.err();
  }
});

// приветствие терминала
tprint('VECTOR-9 SHELL v9.87 — ГОСТЕВОЙ СЕАНС ОТКРЫТ', 'term-ok');
tprint('ВВЕДИ help — СПИСОК ДВЕРЕЙ. ВВЕДИ hack — СПИСОК ГРЕХОВ.', 'term-dim');
tprint('');

/* ============================================================
   ФОРМА СВЯЗИ
   ============================================================ */
$('#contact-form').addEventListener('submit', async e => {
  e.preventDefault();
  const log = $('#contact-log');
  const f = new FormData(e.target);
  sfx.modem();
  log.textContent = '';
  const lines = [
    'ATDT ' + String(f.get('channel')).replace(/[^\d]/g, '').slice(0, 10).padEnd(10, '0') + ' ...',
    'CONNECT 9600/ARQ',
    'РУКОПОЖАТИЕ С БАШНЕЙ В-9 ........ ПРИНЯТО',
    'ПАКЕТ ОТ "' + String(f.get('handle')).toUpperCase() + '" [██████████] 100% ПЕРЕДАН',
    'ОТВЕТ СЕРВЕРА: "СПАСИБО. ОТВЕТИМ В ТЕЧЕНИЕ 24 ЧАСОВ.',
    '  ИЛИ РАНЬШЕ. ИЛИ УЖЕ."',
  ];
  for (const l of lines) { log.textContent += l + '\n'; beep(rand(500, 1100), 0.05, 'square', 0.02); await wait(400); }
  sfx.ok();
  toast('▸ ПАКЕТ ДОСТАВЛЕН В БАШНЮ В-9');
  e.target.reset();
});

/* ============================================================
   ГЛИТЧИ / ПАСХАЛКИ
   ============================================================ */
function bigGlitch() {
  document.body.classList.add('big-glitch');
  sfx.alarm();
  setTimeout(() => document.body.classList.remove('big-glitch'), 520);
}
setInterval(() => { if (Math.random() < 0.5) bigGlitch(); }, 38000);

const KONAMI = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
let kIdx = 0;
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === KONAMI[kIdx]) {
    kIdx++;
    if (kIdx === KONAMI.length) {
      kIdx = 0;
      bigGlitch();
      const next = THEMES[(THEMES.indexOf(THEMES.find(t => document.body.classList.contains('theme-' + t)) ?? 0) + 1) % THEMES.length];
      setTheme(next);
      toast('▸ KONAMI ПРИНЯТ. GOD MODE: ФОСФОР ' + next.toUpperCase());
      sfx.ok(); sfx.modem();
    }
  } else kIdx = k === 'arrowup' ? 1 : 0;
});
