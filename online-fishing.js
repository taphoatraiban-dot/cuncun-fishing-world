// Player-only online fishing. Never store or log the admin token.
(() => {
  const input = document.getElementById('playerSessionToken');
  const status = document.getElementById('onlineFishingStatus');
  const cast = document.getElementById('onlineCast');
  const reel = document.getElementById('onlineReel');
  if (!input || !status || !cast || !reel) return;
  const useMain = document.getElementById('useOnlineControls');
  const mainCast = document.getElementById('cast');
  const mainReel = document.getElementById('catch');
  const origin = 'https://fishing.cuncun.icu';
  if (location.origin !== origin) {
    status.textContent = 'Chế độ câu trực tuyến chỉ hoạt động tại fishing.cuncun.icu.';
    cast.disabled = reel.disabled = true;
    return;
  }
  const sessionKey = 'cuncun-fishing-player-session-v1';
  const modeKey = 'cuncun-fishing-online-mode-v1';
  const forget = document.getElementById('forgetPlayerSession');
  const validToken = value => /^[A-Za-z0-9_-]{43}$/.test(value);
  try {
    const saved = localStorage.getItem(sessionKey) || '';
    if (validToken(saved)) {
      input.value = saved;
      status.textContent = 'Đã khôi phục mã phiên. Vé phải còn hạn để câu qua VPS.';
      if (useMain) useMain.checked = localStorage.getItem(modeKey) !== 'off';
    }
  } catch {}
  function clearSaved() {
    try { localStorage.removeItem(sessionKey); localStorage.removeItem(modeKey); } catch {}
  }
  if (forget) forget.addEventListener('click', () => {
    clearSaved();
    input.value = '';
    if (useMain) useMain.checked = false;
    status.textContent = 'Đã đăng xuất trên thiết bị. Mã trên VPS chưa bị thu hồi.';
  });
  function rememberEnteredToken() {
    const token = input.value.trim();
    try {
      if (validToken(token)) localStorage.setItem(sessionKey, token);
      else localStorage.removeItem(sessionKey);
    } catch {}
  }
  input.addEventListener('input', rememberEnteredToken);
  input.addEventListener('change', rememberEnteredToken);
  input.addEventListener('blur', rememberEnteredToken);
  let busy = false;
  async function action(kind) {
    if (busy) return;
    const token = input.value.trim();
    rememberEnteredToken();
    if (!validToken(token)) {
      status.textContent = 'Cần mã phiên người chơi hợp lệ (không phải mã quản trị).';
      return;
    }
    busy = true;
    cast.disabled = reel.disabled = true;
    status.textContent = kind === 'cast' ? 'Đang thả câu lên VPS…' : 'Đang kéo cá từ VPS…';
    try {
      const response = await fetch('/api/player/' + kind, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({})
      });
      const result = await response.json();
      if (!response.ok) {
        const errors = {
          unauthorized: 'Phiên chơi không hợp lệ hoặc đã hết hạn.',
          ticket_required: 'Vé đã hết hạn hoặc chưa được cấp.',
          already_cast: 'Đã thả câu; hãy kéo cá.',
          cast_first: 'Cần thả câu trước.',
          fish_not_ready: 'Cá chưa cắn câu, chờ ít nhất 3 giây.'
        };
        if (response.status === 401) {
          clearSaved();
          input.value = '';
          if (useMain) useMain.checked = false;
        }
        status.textContent = errors[result.error] || 'VPS từ chối thao tác (' + response.status + ').';
        return;
      }
      try { localStorage.setItem(sessionKey, token); } catch {}
      status.textContent = kind === 'cast'
        ? '🎣 Đã thả câu trên VPS. Chờ ít nhất 3 giây rồi kéo cá.'
        : '🐟 Câu được ' + String(result.fish || 'cá') + ' · +' + Number(result.points || 0) + ' điểm VPS!';
      if (kind === 'reel') {
        const inlineResult = document.getElementById('onlineCatchResult');
        if (inlineResult) {
          inlineResult.textContent = '🐟 ' + String(result.fish || 'Cá') + ' · +' + Number(result.points || 0) + ' điểm VPS!';
          inlineResult.classList.remove('active');
          void inlineResult.offsetWidth;
          inlineResult.classList.add('active');
        }
        const pop = document.getElementById('serverCatchPop');
        const popText = document.getElementById('serverCatchPopText');
        if (pop && popText) {
          popText.textContent = String(result.fish || 'Cá') + ' · +' + Number(result.points || 0) + ' điểm VPS';
          pop.classList.remove('active');
          void pop.offsetWidth;
          pop.classList.add('active');
        }
        window.dispatchEvent(new CustomEvent('cuncun:server-catch', { detail: { fish: String(result.fish || 'Cá'), points: Number(result.points || 0) } }));
      }
    } catch {
      status.textContent = 'Không kết nối được VPS. Hãy thử lại.';
    } finally {
      busy = false;
      cast.disabled = reel.disabled = false;
    }
  }
  // Capture main-button clicks only when the user explicitly selects online mode.
  // This prevents the local demo handler from awarding fake points on an online cast.
  if (useMain && mainCast && mainReel) {
    for (const [button, kind] of [[mainCast, 'cast'], [mainReel, 'reel']]) {
      button.addEventListener('click', event => {
        if (!useMain.checked) return;
        event.stopImmediatePropagation();
        event.preventDefault();
        action(kind);
      }, true);
    }
    useMain.addEventListener('change', () => {
      try { localStorage.setItem(modeKey, useMain.checked ? 'on' : 'off'); } catch {}
      status.textContent = useMain.checked
        ? 'Đã chọn câu qua VPS. Hai nút chính sẽ dùng mã phiên; điểm demo không tăng.'
        : 'Đã chọn chế độ demo. Hai nút chính sẽ tính điểm trên trình duyệt.';
    });
  }
  cast.addEventListener('click', () => action('cast'));
  reel.addEventListener('click', () => action('reel'));
})();
