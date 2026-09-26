// Before first paint: the saved theme and language, so the page never flashes the wrong one.
// External file, because the Content-Security-Policy allows no inline script.
try {
  var t = localStorage.getItem('ubite.theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  var l = localStorage.getItem('ubite.lang') || ((navigator.language || 'ro').toLowerCase().indexOf('en') === 0 ? 'en' : 'ro');
  document.documentElement.setAttribute('lang', l === 'en' ? 'en' : 'ro');
} catch (e) {}
