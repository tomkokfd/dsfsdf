

window.formatMoney = function(value) {
  if (value === null || value === undefined) return '';
  var str = String(value).trim();
  return str.replace(/\d+/g, function(num) {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  });
};

function _fmApply() {
  var els = document.querySelectorAll('[data-format-money]:not([data-fm-done])');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    el.setAttribute('data-fm-done', '1');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = formatMoney(el.value);
    } else {
      el.textContent = formatMoney(el.textContent);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _fmApply);
} else {
  _fmApply();
}
window.addEventListener('load', _fmApply);