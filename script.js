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

// 🔥 NEW: ALL POSITIONS (BUY + SELL)
let positions = [];

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

    data.push({
      time: now - i * getTfSeconds(),
      open,
      high: Math.max(open, close),
      low: Math.min(open, close),
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
// REALTIME ENGINE
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

    document.getElementById("tradePrice").value =
      currentCandle.close.toFixed(2);

    updateUI(); // 🔥 LIVE PNL UPDATE
  }, 1000);
}

// ===============================
// BUY / SELL (REAL LOGIC)
// ===============================
function marketBuy(qty) {
  const price = currentCandle.close;
  const cost = price * qty;

  if (cost > balance) {
    alert("❌ Insufficient Balance");
    return;
  }

  positions.push({
    type: "BUY",
    price: price,
    qty: qty
  });

  balance -= cost;
  updateUI();

  alert(`✅ BUY ${qty} @ ₹${price}`);
}

function marketSell(qty) {
  const price = currentCandle.close;

  positions.push({
    type: "SELL",
    price: price,
    qty: qty
  });

  updateUI();

  alert(`❌ SELL ${qty} @ ₹${price}`);
}

// ===============================
// 🔥 PNL CALCULATION (MAIN MAGIC)
// ===============================
function calculatePnL() {
  let pnl = 0;
  const currentPrice = currentCandle.close;

  positions.forEach(pos => {
    if (pos.type === "BUY") {
      pnl += (currentPrice - pos.price) * pos.qty;
    } else {
      pnl += (pos.price - currentPrice) * pos.qty;
    }
  });

  return pnl;
}

// ===============================
// UI UPDATE
// ===============================
function updateUI() {
  const pnl = calculatePnL();
  const total = balance + pnl;

  document.getElementById("balance").innerText =
    "₹" + total.toFixed(2);
}

// ===============================
// BUTTON EVENTS
// ===============================
window.onload = () => {
  document.getElementById("buyBtn").onclick = () => {
    const qty = +document.getElementById("qty").value;
    marketBuy(qty);
  };

  document.getElementById("sellBtn").onclick = () => {
    const qty = +document.getElementById("qty").value;
    marketSell(qty);
  };
};