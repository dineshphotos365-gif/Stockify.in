// ===============================
// GLOBAL STATE
// ===============================
let chart, candlestickSeries;
let currentSymbol = "RELIANCE";
let currentTimeframe = "1d";

const stockPrices = {
  RELIANCE: 2945,
  TCS: 4120,
  HDFCBANK: 1675
};

let realtimeTimer = null;
let lockedCandleTime = null;
let currentCandle = null;

// ===============================
// TRADING STATE
// ===============================
let balance = 100000;

let portfolio = {
  RELIANCE: { qty: 0, avgPrice: 0 },
  TCS: { qty: 0, avgPrice: 0 },
  HDFCBANK: { qty: 0, avgPrice: 0 }
};

function getLivePrice() {
  return currentCandle ? currentCandle.close : stockPrices[currentSymbol];
}

// ===============================
// AUTO SIGNAL (UNCHANGED)
// ===============================
const tradeThreshold = 10;

function checkBuySell(candle) {
  if (!candle) return;

  if (candle.close >= candle.open + tradeThreshold) {
    console.log(`✅ BUY SIGNAL: ${currentSymbol} @ ₹${candle.close.toFixed(2)}`);
  } else if (candle.close <= candle.open - tradeThreshold) {
    console.log(`❌ SELL SIGNAL: ${currentSymbol} @ ₹${candle.close.toFixed(2)}`);
  }
}

// ===============================
// CHART INIT
// ===============================
window.addEventListener("load", initChart);

function initChart() {
  chart = LightweightCharts.createChart(
    document.getElementById("tradingview_candle"),
    {
      height: 360,
      layout: { background: { color: "transparent" }, textColor: "#b8b8d9" },
      timeScale: { timeVisible: true }
    }
  );

  candlestickSeries = chart.addCandlestickSeries({
    upColor: "#00ff88",
    downColor: "#ff4766",
    wickUpColor: "#00ff88",
    wickDownColor: "#ff4766",
    borderVisible: false
  });

  candlestickSeries.setData(generateHistory());
  startRealtime();
}

function generateHistory() {
  let data = [];
  let price = stockPrices[currentSymbol];
  let now = Math.floor(Date.now() / 1000);

  for (let i = 60; i > 0; i--) {
    let open = price;
    let close = open + (Math.random() - 0.5) * 20;
    let high = Math.max(open, close) + Math.random() * 10;
    let low = Math.min(open, close) - Math.random() * 10;

    data.push({
      time: now - i * getTfSeconds(),
      open,
      high,
      low,
      close
    });

    price = close;
  }
  return data;
}

function getTfSeconds() {
  return {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "1d": 86400
  }[currentTimeframe];
}

function getCandleStart(sec) {
  const tf = getTfSeconds();
  return Math.floor(sec / tf) * tf;
}

// ===============================
// REALTIME PRICE ENGINE
// ===============================
function startRealtime() {
  if (realtimeTimer) clearInterval(realtimeTimer);

  lockedCandleTime = getCandleStart(Math.floor(Date.now() / 1000));
  let base = stockPrices[currentSymbol];

  currentCandle = {
    time: lockedCandleTime,
    open: base,
    high: base,
    low: base,
    close: base
  };

  candlestickSeries.update(currentCandle);

  realtimeTimer = setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    const candleTime = getCandleStart(now);

    if (candleTime !== lockedCandleTime) {
      lockedCandleTime = candleTime;
      const open = currentCandle.close;
      currentCandle = {
        time: candleTime,
        open,
        high: open,
        low: open,
        close: open
      };
    } else {
      const move = (Math.random() - 0.5) * 4;
      const price = +(currentCandle.close + move).toFixed(2);

      currentCandle.close = price;
      currentCandle.high = Math.max(currentCandle.high, price);
      currentCandle.low = Math.min(currentCandle.low, price);
    }

    candlestickSeries.update(currentCandle);

    // 🔴 LIVE PRICE → INPUT
    document.getElementById("tradePrice").value =
      currentCandle.close.toFixed(2);

    // auto signal
    checkBuySell(currentCandle);
  }, 1000);
}

// ===============================
// BUY / SELL (UNCHANGED FUNCTIONS)
// ===============================
function buyStock(qty) {
  marketBuy(qty);
}

function sellStock(qty) {
  marketSell(qty);
}

// ===============================
// REAL MARKET ORDERS
// ===============================
function marketBuy(qty) {
  const price = currentCandle.close;
  const cost = price * qty;

  if (cost > balance) {
    alert("❌ Insufficient Balance");
    return;
  }

  let stock = portfolio[currentSymbol];
  stock.avgPrice =
    (stock.avgPrice * stock.qty + cost) / (stock.qty + qty);

  stock.qty += qty;
  balance -= cost;

  updateUI();
  alert(`✅ BUY ${qty} ${currentSymbol} @ ₹${price.toFixed(2)}`);
}

function marketSell(qty) {
  const price = currentCandle.close;
  let stock = portfolio[currentSymbol];

  if (qty > stock.qty) {
    alert("❌ Not enough shares");
    return;
  }

  stock.qty -= qty;
  balance += price * qty;

  if (stock.qty === 0) stock.avgPrice = 0;

  updateUI();
  alert(`❌ SELL ${qty} ${currentSymbol} @ ₹${price.toFixed(2)}`);
}

// ===============================
// UI UPDATE
// ===============================
function updateUI() {
  document.querySelector(".balance-amount").innerText =
    `₹${balance.toFixed(2)}`;
}

// ===============================
// BUTTON EVENTS
// ===============================
window.onload = () => {
  document.querySelector(".buy-button").onclick = () => {
    const qty = +document.querySelector(".form-row input").value;
    buyStock(qty);
  };

  document.querySelector(".sell-button").onclick = () => {
    const qty = +document.querySelector(".form-row input").value;
    sellStock(qty);
  };
};