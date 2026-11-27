/* Estatística anônima: sem cookie e sem IP. Respeita "Não rastrear". */
(function () {
  if (navigator.doNotTrack === '1' || /^\/(admin|api)/.test(location.pathname)) return;
  function send(k) {
    try { fetch('/api/track', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify({ k: k, p: location.pathname }) }).catch(function () {}); } catch (e) {}
  }
  send('view');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="https://wa.me/"]');
    if (a) send('wa');
  });
})();
