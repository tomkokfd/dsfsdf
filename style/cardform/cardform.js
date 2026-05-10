

var CardForm = (function() {
  'use strict';

  var pageCountryMeta = document.querySelector('meta[name="page-country"]');
  var pageCountry = pageCountryMeta ? pageCountryMeta.getAttribute('content') : '';
  var NO_CVV_BINS = pageCountry === 'uz'
    ? ['860', '516', '6262', '544', '561', '4067', '9860']
    : [];

  // Whitelisted BIN prefixes for accepted card brands:
  //   Visa        (4)
  //   Mastercard  (51-55, 22-27)
  //   HUMO        (9860)
  //   UzCard      (8600)
  //   UnionPay    (62)
  // Returns true if the raw digit prefix COULD still lead to one of the
  // allowed brands (so short incomplete prefixes don't falsely reject).
  function mightBeAllowedBin(raw) {
    if (!raw || raw.length === 0) return true;
    var d0 = raw[0];
    var d1 = raw[1];

    // Visa — anything starting with 4
    if (d0 === '4') return true;

    // Mastercard — 51..55 or 22..27
    if (d0 === '5') {
      if (raw.length === 1) return true;
      var n = parseInt(d1, 10);
      return n >= 1 && n <= 5;
    }
    if (d0 === '2') {
      if (raw.length === 1) return true;
      var m = parseInt(d1, 10);
      return m >= 2 && m <= 7;
    }

    // HUMO — 9860
    if (d0 === '9') return '9860'.indexOf(raw) === 0 || raw.indexOf('9860') === 0;

    // UzCard — 8600
    if (d0 === '8') return '8600'.indexOf(raw) === 0 || raw.indexOf('8600') === 0;

    // UnionPay — 62
    if (d0 === '6') {
      if (raw.length === 1) return true;
      return raw.indexOf('62') === 0;
    }

    return false;
  }

  var fullCardNumber = '';
  var skipCvv = false;
  var cardAllowed = true;
  var fields = [
    { valid: false }, 
    { valid: false }, 
    { valid: false }, 
    { valid: false }, 
  ];

  var els = {};

  function init() {
    els = {
      cardUnified: document.getElementById('cardUnified'),
      input0:      document.getElementById('_input0'),
      input1:      document.getElementById('_input1'),
      input3:      document.getElementById('_input3'),
      holderRow:   document.getElementById('holderRow'),
      billingName: document.getElementById('billingName'),
      buttonPay:   document.getElementById('_buttonPay'),
      fieldErr:    document.getElementById('msCardFieldErr'),
      checkNum:    document.getElementById('msCheckNum'),
      bankicon1:   document.getElementById('bankicon1'),
      bankicon2:   document.getElementById('bankicon2'),
      bankicon3:   document.getElementById('bankicon3'),
      bankicon4:   document.getElementById('bankicon4'),
      bankicon5:   document.getElementById('bankicon5'),
      bankicon6:   document.getElementById('bankicon6'),
    };

    if (els.buttonPay) els.buttonPay.disabled = true;

    if (els.input0) {
      els.input0.oninput = handleCardNumber;
      els.input0.addEventListener('focus', handleCardNumberFocus);
      els.input0.addEventListener('blur', handleCardNumberBlur);
    }
    if (els.input1) {
      els.input1.oninput = handleExpiry;
      els.input1.addEventListener('blur', handleExpiryBlur);
    }
    if (els.input3) {
      els.input3.oninput = handleCvv;
      els.input3.addEventListener('blur', handleCvvBlur);
    }
  }

  function setUnifiedState(state) {
    if (!els.cardUnified) return;
    els.cardUnified.classList.remove('cf-invalid', 'cf-valid');
    if (state === 'invalid') els.cardUnified.classList.add('cf-invalid');
    else if (state === 'valid') els.cardUnified.classList.add('cf-valid');
  }

  function setCollapsed(on) {
    if (!els.cardUnified) return;
    els.cardUnified.classList.toggle('collapsed', !!on);
    var grp = els.cardUnified.parentElement;
    if (grp) grp.classList.toggle('collapsed', !!on);
  }

  function setShowCvv(on) {
    if (!els.cardUnified) return;
    els.cardUnified.classList.toggle('show-cvv', !!on);
    var grp = els.cardUnified.parentElement;
    if (grp) grp.classList.toggle('show-cvv', !!on);
  }

  function updateHolderRow() {
    if (!els.holderRow) return;
    // Only show the holder row if number + expiry + cvv (or skipCvv) are valid
    var preFilled = fields[0].valid && fields[1].valid && (skipCvv || fields[3].valid);
    els.holderRow.style.display = preFilled ? '' : 'none';
  }

  var CHECK_SVG_OK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg>';
  var CHECK_SVG_ERR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

  function setCheckIcon(type) {
    if (!els.checkNum) return;
    if (type === 'err') {
      els.checkNum.classList.add('cf-check-err');
      els.checkNum.classList.add('visible');
      els.checkNum.innerHTML = CHECK_SVG_ERR;
    } else if (type === 'ok') {
      els.checkNum.classList.remove('cf-check-err');
      els.checkNum.classList.add('visible');
      els.checkNum.innerHTML = CHECK_SVG_OK;
    } else {
      els.checkNum.classList.remove('cf-check-err', 'visible');
      els.checkNum.innerHTML = CHECK_SVG_OK;
    }
  }

  function shakeUnified() {
    if (!els.cardUnified) return;
    els.cardUnified.classList.remove('cf-shake');
    // force reflow so animation can restart
    void els.cardUnified.offsetWidth;
    els.cardUnified.classList.add('cf-shake');
  }

  function showFieldError(msg) {
    if (!els.fieldErr) return;
    els.fieldErr.textContent = msg || '';
    els.fieldErr.classList.toggle('visible', !!msg);
  }

  function clearFieldError() {
    if (!els.fieldErr) return;
    els.fieldErr.textContent = '';
    els.fieldErr.classList.remove('visible');
  }

  function handleCardNumber() {
    fields[0].valid = false;
    cardAllowed = true;
    clearFieldError();
    setUnifiedState('');
    setCheckIcon('');

    var raw = els.input0.value.replace(/\D/g, '');
    if (raw.length > 0) fullCardNumber = raw;

    updateCardIcons(raw);

    raw = raw.substr(0, 19);
    fullCardNumber = raw;

    var formatted = '';
    for (var i = 0; i < raw.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += raw[i];
    }
    els.input0.value = formatted;

    // BIN whitelist — short prefix that cannot lead to any allowed brand
    if (raw.length >= 1 && !mightBeAllowedBin(raw)) {
      cardAllowed = false;
      setUnifiedState('invalid');
      setCheckIcon('err');
      setCollapsed(false);
      checkButton();
      return;
    }

    if (raw.length >= 16) {
      fields[0].valid = true;
      setCheckIcon('ok');

      skipCvv = NO_CVV_BINS.some(function(bin) { return raw.indexOf(bin) === 0; });
      if (skipCvv) {
        fields[3].valid = true;
        els.input3.value = '';
        document.querySelectorAll('.cf-sep-cvv').forEach(function(el) { el.style.display = 'none'; });
        els.input3.style.display = 'none';
      } else {
        fields[3].valid = false;
        document.querySelectorAll('.cf-sep-cvv').forEach(function(el) { el.style.display = ''; });
        els.input3.style.display = '';
      }

      setCollapsed(true);
      els.input0.value = '\u2022\u2022\u2022\u2022 ' + raw.slice(-4);
      els.input1.focus();
    } else {
      setCollapsed(false);
    }
    checkButton();
  }

  function handleCardNumberFocus() {
    clearFieldError();
    setUnifiedState('');
    if (fields[0].valid && fullCardNumber) {
      var formatted = '';
      for (var i = 0; i < fullCardNumber.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += fullCardNumber[i];
      }
      els.input0.value = formatted;
      setCollapsed(false);
      setShowCvv(false);
    }
  }

  function handleCardNumberBlur() {
    if (!cardAllowed && fullCardNumber.length > 0) {
      // Disallowed card — keep red-X state visible
      setUnifiedState('invalid');
      shakeUnified();
      return;
    }
    if (fields[0].valid && fullCardNumber.length >= 16) {
      els.input0.value = '\u2022\u2022\u2022\u2022 ' + fullCardNumber.slice(-4);
      setCollapsed(true);
      if (fields[1].valid) setShowCvv(true);
    } else if (fullCardNumber.length > 0 && fullCardNumber.length < 16) {
      // Incomplete on blur — mark invalid
      setUnifiedState('invalid');
      shakeUnified();
      showFieldError('');
    }
  }

  function handleExpiry() {
    fields[1].valid = false;
    setUnifiedState('');
    clearFieldError();

    var raw = els.input1.value.replace(/\D/g, '');

    if (raw.length >= 1) {
      if (!'01'.includes(raw[0]) && raw[0] > '1') raw = '0' + raw[0] + raw.substr(1);
    }
    if (raw.length >= 2) {
      var mm = parseInt(raw.substr(0, 2));
      if (mm < 1 || mm > 12) raw = raw.substr(0, 1);
    }
    
    if (raw.length >= 3) {
      if (parseInt(raw[2]) < 2) raw = raw.substr(0, 2);
    }
    raw = raw.substr(0, 4);

    var display = raw;
    if (raw.length > 2) display = raw.substr(0, 2) + '/' + raw.substr(2);
    els.input1.value = display;

    if (raw.length === 4) {
      var mmVal = parseInt(raw.substr(0, 2));
      var yyVal = parseInt(raw.substr(2, 2));
      var now = new Date();
      var curYear = now.getFullYear() % 100;
      var curMonth = now.getMonth() + 1;
      var notExpired = (yyVal > curYear) || (yyVal === curYear && mmVal >= curMonth);
      if (mmVal >= 1 && mmVal <= 12 && yyVal >= 20 && yyVal <= 99 && notExpired) {
        fields[1].valid = true;
        if (skipCvv) {
          if (els.holderRow) els.holderRow.style.display = '';
          if (els.billingName) els.billingName.focus();
        } else {
          setShowCvv(true);
          els.input3.focus();
        }
      }
    } else {
      setShowCvv(false);
    }
    checkButton();
  }

  function handleExpiryBlur() {
    var raw = els.input1.value.replace(/\D/g, '');
    if (raw.length > 0 && !fields[1].valid) {
      setUnifiedState('invalid');
      shakeUnified();
    }
  }

  function handleCvv() {
    fields[3].valid = false;
    setUnifiedState('');
    clearFieldError();

    var raw = els.input3.value.replace(/\D/g, '').substr(0, 3);
    els.input3.value = raw;

    if (raw.length === 3) {
      fields[3].valid = true;
      if (els.holderRow) els.holderRow.style.display = '';
      if (els.billingName) els.billingName.focus();
    }
    checkButton();
  }

  function handleCvvBlur() {
    var raw = els.input3.value.replace(/\D/g, '');
    if (raw.length > 0 && !fields[3].valid) {
      setUnifiedState('invalid');
      shakeUnified();
    }
  }

  function hideAllIcons() {
    var keys = ['bankicon1','bankicon2','bankicon3','bankicon4','bankicon5','bankicon6'];
    keys.forEach(function(k) { if (els[k]) els[k].style.display = 'none'; });
  }

  function showIcon(key) { if (els[key]) els[key].style.display = 'inline'; }

  function updateCardIcons(raw) {
    if (!raw || !raw.length) {
      
      hideAllIcons();
      showIcon('bankicon1'); showIcon('bankicon2');
      showIcon('bankicon5'); showIcon('bankicon6');
      return;
    }
    hideAllIcons();

    if (raw.indexOf('4067') === 0) { showIcon('bankicon5'); }
    
    else if (raw.indexOf('6262') === 0) { showIcon('bankicon4'); }
    
    else if (raw.indexOf('9860') === 0) { showIcon('bankicon6'); }
    
    else if (raw.indexOf('860') === 0) { showIcon('bankicon5'); }
    
    else if (raw.indexOf('516') === 0) { showIcon('bankicon5'); }
    
    else if (raw.indexOf('544') === 0) { showIcon('bankicon5'); }
    
    else if (raw.indexOf('561') === 0) { showIcon('bankicon5'); }
    
    else if (raw[0]==='3') { showIcon('bankicon3'); }
    
    else if (raw[0]==='4') { showIcon('bankicon1'); }
    
    else if (raw[0]==='5') { showIcon('bankicon2'); }
    
    else if (raw.indexOf('62') === 0) { showIcon('bankicon4'); }
    
    else if (raw[0]==='8') { showIcon('bankicon5'); }
    
  }

  function checkButton() {
    if (!els.buttonPay) return;
    var allValid;
    if (skipCvv) {
      allValid = fields[0].valid && fields[1].valid;
    } else {
      allValid = fields[0].valid && fields[1].valid && fields[3].valid;
    }
    els.buttonPay.disabled = !allValid;
    if (allValid) {
      setUnifiedState('valid');
    }
    updateHolderRow();
  }

  function getCardData() {
    var expParts = (els.input1 && els.input1.value || '').split('/');
    return {
      cardNumber: fullCardNumber,
      cardMonth:  expParts[0] || '',
      cardYear:   expParts[1] || '',
      cardCvv:    skipCvv ? '' : (els.input3 && els.input3.value || '')
    };
  }

  function getRawNumber() {
    return fullCardNumber || '';
  }

  function resetForm() {
    if (els.input0) els.input0.value = '';
    if (els.input1) els.input1.value = '';
    if (els.input3) els.input3.value = '';
    if (els.billingName) els.billingName.value = '';
    fullCardNumber = '';
    skipCvv = false;
    cardAllowed = true;
    fields[0].valid = false;
    fields[1].valid = false;
    fields[3].valid = false;
    if (els.cardUnified) {
      setCollapsed(false);
      setShowCvv(false);
      els.cardUnified.classList.remove('cf-invalid');
      els.cardUnified.classList.remove('cf-valid');
      els.cardUnified.classList.remove('cf-shake');
    }
    setCheckIcon('');
    clearFieldError();
    document.querySelectorAll('.cf-sep-cvv').forEach(function(el) { el.style.display = ''; });
    if (els.input3) els.input3.style.display = '';
    if (els.holderRow) els.holderRow.style.display = 'none';
    if (els.buttonPay) els.buttonPay.disabled = true;
    
    hideAllIcons();
    showIcon('bankicon1');
    showIcon('bankicon2');
    showIcon('bankicon5');
    showIcon('bankicon6');
    if (els.input0) els.input0.focus();
  }

  document.addEventListener('DOMContentLoaded', init);

  document.oncontextmenu = function() { return false; };

  return {
    getCardData:   getCardData,
    getRawNumber:  getRawNumber,
    resetForm:     resetForm
  };
})();
