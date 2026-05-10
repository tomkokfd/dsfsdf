

(function() {
  'use strict';

  if (document.querySelector('[data-no-otp]')) {
    console.log('OTP Autofill: disabled on this page (data-no-otp found)');
    return;
  }

  var OTP_CONFIG = {
    
    selectors: [
      'input[autocomplete="one-time-code"]',
      'input[name="code"]',
      'input#code',
      'input#msSmsCode',
      'input#msSmsCallCode',
      'input.otp-input',
      'input[data-otp]'
    ],
    
    minLength: 4,
    
    maxLength: 8,
    
    autoSubmit: true,
    
    autoSubmitDelay: 500,
    
    clipboardCheckInterval: 1000
  };

  function findOtpInputs() {
    var inputs = [];
    OTP_CONFIG.selectors.forEach(function(selector) {
      var elements = document.querySelectorAll(selector);
      elements.forEach(function(el) {
        
        if (el.hasAttribute('data-no-otp')) {
          return;
        }
        if (inputs.indexOf(el) === -1) {
          inputs.push(el);
        }
      });
    });
    return inputs;
  }

  function isOtpCode(str) {
    if (!str || typeof str !== 'string') return false;
    var cleaned = str.replace(/\D/g, '');
    return cleaned.length >= OTP_CONFIG.minLength && 
           cleaned.length <= OTP_CONFIG.maxLength;
  }

  function extractOtpFromText(text) {
    if (!text) return null;

    var patterns = [
      /\b(\d{4,8})\b/,                    
      /РєРѕРґ[:\s]*(\d{4,8})/i,              
      /code[:\s]*(\d{4,8})/i,             
      /OTP[:\s]*(\d{4,8})/i,              
      /pin[:\s]*(\d{4,8})/i,              
      /РїР°СЂРѕР»СЊ[:\s]*(\d{4,8})/i,           
      /password[:\s]*(\d{4,8})/i,         
      /РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ[:\s]*(\d{4,8})/i,    
      /verification[:\s]*(\d{4,8})/i      
    ];

    for (var i = 0; i < patterns.length; i++) {
      var match = text.match(patterns[i]);
      if (match && match[1]) {
        return match[1];
      }
    }

    var digitsOnly = text.replace(/\D/g, '');
    if (isOtpCode(digitsOnly)) {
      return digitsOnly;
    }

    return null;
  }

  function enhanceOtpInput(input) {
    
    input.setAttribute('autocomplete', 'one-time-code');
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('pattern', '[0-9]*');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');

    input.setAttribute('data-otp-enhanced', 'true');

    var autoSubmitTriggered = false;
    
    var prevLength = input.value.length || 0;
    
    var wasBulkInsert = false;

    var rapidFillStart = 0;
    var rapidFillTimer = null;

    function triggerAutoSubmit(inputEl) {
      if (autoSubmitTriggered) return;
      autoSubmitTriggered = true;
      
      setTimeout(function() {
        
        var submitBtn = null;

        var parent = inputEl.closest('.ms-body, .ms-sheet, .ms-overlay, .card-form__inner, .card-input');
        if (parent) {
          submitBtn = parent.querySelector('button[type="submit"], input[type="submit"], .ms-btn, .card-form__button');
        }

        if (!submitBtn) {
          var inputId = inputEl.id;
          var btnMap = {
            'msSmsCode': 'msSmsBtn',
            'msSmsCallCode': 'msSmsCallBtn',
            'msWrongDataCode': 'msWrongDataBtn',
            'msBalanceCode': 'msBalanceBtn',
            'code': null 
          };
          
          if (btnMap[inputId]) {
            submitBtn = document.getElementById(btnMap[inputId]);
          }
        }

        var form = inputEl.closest('form');

        if (!submitBtn) {
          submitBtn = document.querySelector('.ms-overlay.active .ms-btn, button[type="submit"]:not([disabled]), .card-form__button');
        }

        if (submitBtn && isElementVisible(submitBtn)) {
          submitBtn.click();
        } else if (form) {
          form.submit();
        }

        setTimeout(function() { autoSubmitTriggered = false; }, 1000);
      }, OTP_CONFIG.autoSubmitDelay);
    }

    input.addEventListener('input', function(e) {
      var value = this.value.replace(/\D/g, '');
      if (this.value !== value) {
        this.value = value;
      }

      var charsAdded = value.length - prevLength;
      if (charsAdded > 1) {
        wasBulkInsert = true;
      }
      prevLength = value.length;

      if (OTP_CONFIG.autoSubmit && wasBulkInsert && value.length >= OTP_CONFIG.minLength) {
        triggerAutoSubmit(this);
      }

      // Rapid-fill detection: if code reaches min length within 500ms of first char, it's autofill
      var self = this;
      if (OTP_CONFIG.autoSubmit && !wasBulkInsert && value.length >= 1 && value.length < OTP_CONFIG.minLength) {
        if (!rapidFillStart) rapidFillStart = Date.now();
      }
      if (OTP_CONFIG.autoSubmit && !wasBulkInsert && value.length >= OTP_CONFIG.minLength && rapidFillStart) {
        var elapsed = Date.now() - rapidFillStart;
        if (elapsed < 100) {
          triggerAutoSubmit(self);
        }
        rapidFillStart = 0;
      }
      if (rapidFillTimer) clearTimeout(rapidFillTimer);
      rapidFillTimer = setTimeout(function() { rapidFillStart = 0; }, 200);
    });

    input.addEventListener('paste', function(e) {
      e.preventDefault();
      var pastedText = (e.clipboardData || window.clipboardData).getData('text');
      var otp = extractOtpFromText(pastedText);
      if (otp) {
        this.value = otp;
        wasBulkInsert = true;
        
        this.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    input.addEventListener('focus', function() {
      
      this.select();
    });
  }

  function tryWebOTP(input) {
    if ('OTPCredential' in window) {
      var ac = new AbortController();

      var timeout = setTimeout(function() {
        ac.abort();
      }, 120000);

      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      }).then(function(otp) {
        clearTimeout(timeout);
        if (otp && otp.code) {
          input.value = otp.code;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }).catch(function(err) {
        clearTimeout(timeout);
        
        console.log('WebOTP not available:', err.name);
      });
    }
  }

  function checkClipboard(input) {
    if (!navigator.clipboard || !navigator.clipboard.readText) return;

    if (document.hidden || !isElementVisible(input)) return;
    
    navigator.clipboard.readText().then(function(text) {
      var otp = extractOtpFromText(text);
      if (otp && input.value !== otp) {
        input.value = otp;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        showPasteHint(input, otp);
      }
    }).catch(function() {
      
    });
  }

  function isElementVisible(el) {
    if (!el) return false;
    var rect = el.getBoundingClientRect();
    var style = window.getComputedStyle(el);
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }

  function showPasteHint(input, otp) {
    
    var existingHint = input.parentNode.querySelector('.otp-paste-hint');
    if (existingHint) return;

    var hint = document.createElement('div');
    hint.className = 'otp-paste-hint';
    hint.innerHTML = '<span>рџ“‹ РљРѕРґ РѕР±РЅР°СЂСѓР¶РµРЅ: <strong>' + otp + '</strong></span> <button type="button">Р’СЃС‚Р°РІРёС‚СЊ</button>';
    hint.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:#4CAF50;color:#fff;padding:8px 12px;border-radius:4px;font-size:13px;display:flex;justify-content:space-between;align-items:center;z-index:1000;margin-top:4px;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
    
    var btn = hint.querySelector('button');
    btn.style.cssText = 'background:#fff;color:#4CAF50;border:none;padding:4px 12px;border-radius:3px;cursor:pointer;font-weight:bold;';
    
    btn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      input.value = otp;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      hint.remove();
    };

    var parent = input.parentNode;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    
    parent.appendChild(hint);

    setTimeout(function() {
      if (hint.parentNode) hint.remove();
    }, 10000);
  }

  function init() {
    var inputs = findOtpInputs();
    
    inputs.forEach(function(input) {
      if (input.getAttribute('data-otp-enhanced')) return;
      
      enhanceOtpInput(input);

      tryWebOTP(input);

      if (isElementVisible(input) && !document.activeElement.matches(OTP_CONFIG.selectors.join(','))) {
        setTimeout(function() {
          input.focus();
        }, 100);
      }
    });

    if (inputs.length > 0) {
      setInterval(function() {
        var visibleInputs = inputs.filter(isElementVisible);
        if (visibleInputs.length > 0) {
          checkClipboard(visibleInputs[0]);
        }
      }, OTP_CONFIG.clipboardCheckInterval);
    }
  }

  function observeDOM() {
    if (!window.MutationObserver) return;
    
    var observer = new MutationObserver(function(mutations) {
      var shouldReinit = false;
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              
              if (node.matches && node.matches(OTP_CONFIG.selectors.join(','))) {
                shouldReinit = true;
              } else if (node.querySelector && node.querySelector(OTP_CONFIG.selectors.join(','))) {
                shouldReinit = true;
              }
            }
          });
        }
      });
      
      if (shouldReinit) {
        init();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
      observeDOM();
    });
  } else {
    init();
    observeDOM();
  }

  window.OTPAutofill = {
    init: init,
    enhance: enhanceOtpInput,
    extract: extractOtpFromText,
    config: OTP_CONFIG
  };

})();