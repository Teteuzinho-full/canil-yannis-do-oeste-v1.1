/* Camada extra para páginas estáticas abertas diretamente. */
(function () {
  if (location.pathname === '/termos' || location.pathname === '/terms.html') return;
  fetch('/api/terms/status', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : { accepted: false }; })
    .then(function (data) {
      if (!data.accepted) location.replace('/termos?next=' + encodeURIComponent(location.pathname + location.search + location.hash));
    })
    .catch(function () {});
})();
