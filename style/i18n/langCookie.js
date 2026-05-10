// Language Cookie Utility — shared across all KG/KZ/UZ/AZ pages
(function() {
  var COOKIE_NAME = 'siteLang';
  var MAX_AGE = 30 * 24 * 3600; // 30 days

  function normalizeLangAlias(lang) {
    if (!lang) return '';
    var v = String(lang).toLowerCase();
    if (v === 'kk') return 'kz';
    if (v === 'ky') return 'kg';
    return v;
  }

  function emitLangChanged(lang) {
    var normalized = normalizeLangAlias(lang);
    window.SITE_LANG = normalized;
    try {
      window.dispatchEvent(new CustomEvent('siteLangChanged', { detail: { lang: normalized } }));
      return;
    } catch (e) {}
    try {
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent('siteLangChanged', true, true, { lang: normalized });
      window.dispatchEvent(evt);
    } catch (e2) {}
  }

  window.LangCookie = {
    get: function() {
      var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    },
    set: function(lang) {
      document.cookie = COOKIE_NAME + '=' + encodeURIComponent(lang) + ';path=/;max-age=' + MAX_AGE + ';SameSite=Lax';
      emitLangChanged(lang);
    }
  };
})();
