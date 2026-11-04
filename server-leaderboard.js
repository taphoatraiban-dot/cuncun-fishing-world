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
      const statsResponse = await fetch('https://fishing.cuncun.icu/api/stats', { cache: 'no-store' });
      if (!statsResponse.ok) throw new Error('Stats HTTP ' + statsResponse.status);
      const stats = await statsResponse.json();
      const ticketsResponse = await fetch('https://fishing.cuncun.icu/api/tickets/active', { cache: 'no-store' });
      if (!ticketsResponse.ok) throw new Error('Tickets HTTP ' + ticketsResponse.status);
      const tickets = await ticketsResponse.json();
      const active = Array.isArray(tickets.players) ? tickets.players.length : 0;
      status.textContent = '🌐 VPS: ' + Number(stats.players || 0) + ' người chơi · ' + Number(stats.catches || 0) + ' cá · ' + Number(stats.points || 0) + ' điểm · 🎟️ ' + active + '/200 vé đang hoạt động';
    } catch {
      status.textContent = 'Chưa đọc được bảng xếp hạng VPS (kiểm tra CORS/kết nối).';
    }
  }
  refresh();
  window.addEventListener('cuncun:server-catch', refresh);
  setInterval(refresh, 15000);
})();
