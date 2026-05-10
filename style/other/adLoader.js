(function() {
  'use strict';

  function getAdIdFromUrl() {
    var pathMatch = window.location.pathname.match(/\/(AD\d{7})/);
    if (pathMatch) {
      console.log('Ad ID found in pathname:', pathMatch[1]);
      return pathMatch[1];
    }
    var params = new URLSearchParams(window.location.search);
    var adId = params.get('adId');
    if (adId) {
      console.log('Ad ID found in params:', adId);
      return adId;
    }
    console.warn('Ad ID not found in URL');
    return null;
  }

  function formatMoney(amount) {
    return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function applyAdData(adId, ad) {
    document.title = ad.title + ' - ' + ad.price + ' ' + ad.currency;

    var titleEls = document.querySelectorAll('[data-i18n="productName"], [data-i18n="productName2"]');
    titleEls.forEach(function(el) {
      el.textContent = ad.title;
    });

    var priceElements = document.querySelectorAll('[data-format-money]');
    priceElements.forEach(function(element) {
      var formattedPrice = formatMoney(ad.price);
      element.textContent = formattedPrice + ' ' + ad.currency;
    });

    var addressElements = document.querySelectorAll('[data-i18n="address"], [data-i18n="address2"]');
    addressElements.forEach(function(el) {
      var parent = el.closest('div');
      if (parent) {
        var textEl = parent.querySelector('p');
        if (textEl) {
          textEl.textContent = ad.address;
        }
      }
    });

    var fioElements = document.querySelectorAll('[data-i18n="fullName"]');
    fioElements.forEach(function(el) {
      var parent = el.closest('div');
      if (parent) {
        var textEl = parent.querySelector('p');
        if (textEl) {
          textEl.textContent = ad.fio || ad.title;
        }
      }
    });

    window.__currentAdData = {
      itemId: adId,
      price: ad.price,
      curr: ad.currency,
      title: ad.title,
      fio: ad.fio,
      address: ad.address
    };

    window.adId = adId;
    window.itemId = adId;
  }

  function loadAndDisplayAd() {
    var adId = getAdIdFromUrl();
    if (!adId) {
      console.log('No ad ID found in URL');
      return;
    }

    var maxRetries = 3;
    var retryDelay = 1000;
    var attempt = 0;

    function tryFetch() {
      attempt++;

      fetch('/api/ad/' + adId, { headers: { 'ngrok-skip-browser-warning': 'true' } })
        .then(function(resp) {
          if (!resp.ok) throw new Error('Failed: ' + resp.status);
          return resp.json();
        })
        .then(function(data) {
          if (!data.ok || !data.ad) throw new Error('Invalid ad data');
          applyAdData(adId, data.ad);
        })
        .catch(function() {
          if (attempt < maxRetries) {
            setTimeout(tryFetch, retryDelay);
          }
        });
    }

    tryFetch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndDisplayAd);
  } else {
    loadAndDisplayAd();
  }

  window.AdLoader = {
    getAdIdFromUrl: getAdIdFromUrl,
    loadAndDisplayAd: loadAndDisplayAd
  };
})();
