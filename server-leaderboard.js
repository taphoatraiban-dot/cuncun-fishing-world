// Read-only leaderboard. Never put FISHING_ADMIN_TOKEN in browser code.
(() => {
  const endpoint = 'https://fishing.cuncun.icu/api/leaderboard';
  const status = document.getElementById('server-board-status');
  const list = document.getElementById('server-board');
  if (!status || !list) return;
  async function refresh() {
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const payload = await response.json();
      if (!Array.isArray(payload.players)) throw new Error('Invalid response');
      list.replaceChildren();
      for (const player of payload.players.slice(0, 30)) {
        const item = document.createElement('li');
        item.textContent = String(player.name) + ' — ' + Number(player.points || 0) + ' điểm (' + Number(player.catches || 0) + ' cá)';
        list.appendChild(item);
      }
      status.textContent = payload.players.length ? 'Đã đồng bộ bảng xếp hạng từ VPS.' : 'Đã kết nối VPS · Chưa có người chơi thật.';
    } catch {
      status.textContent = 'Chưa đọc được bảng xếp hạng VPS (kiểm tra CORS/kết nối).';
    }
  }
  refresh();
  setInterval(refresh, 15000);
})();
