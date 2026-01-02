// ===== MINI DATABASE (localStorage) =====
let balance = localStorage.getItem("balance")
  ? Number(localStorage.getItem("balance"))
  : 98450;

let trades = localStorage.getItem("trades")
  ? JSON.parse(localStorage.getItem("trades"))
  : [];

// ===== ELEMENTS =====
const balanceEl = document.querySelector(".balance-amount");
const qtyInput = document.querySelectorAll(".form-input")[1];
const priceInput = document.querySelectorAll(".form-input")[2];
const stockSelect = document.getElementById("tradeStock");
const buyBtn = document.querySelector(".buy-button");
const sellBtn = document.querySelector(".sell-button");
const historyBox = document.querySelector(".trade-history");

// ===== UPDATE BALANCE =====
function updateBalance() {
  balanceEl.innerText = "₹" + balance.toLocaleString();
  localStorage.setItem("balance", balance);
}

// ===== UPDATE HISTORY =====
function renderTrades() {
  historyBox.innerHTML = "";
  trades.forEach(trade => {
    const div = document.createElement("div");
    div.className = "trade-item";
    div.innerHTML = `
      <div>
        <div class="stock-symbol">${trade.stock}</div>
        <span class="${trade.type === "BUY" ? "trade-buy" : "trade-sell"}">
          ${trade.type} ${trade.qty} @ ₹${trade.price}
        </span>
      </div>
      <div>₹${trade.total.toLocaleString()}</div>
    `;
    historyBox.prepend(div);
  });
}

// ===== BUY =====
buyBtn.addEventListener("click", () => {
  const qty = Number(qtyInput.value);
  const price = Number(priceInput.value);
  const stock = stockSelect.value;
  const total = qty * price;

  if (total > balance) {
    alert("❌ Balance kam hai");
    return;
  }

  balance -= total;

  trades.push({
    type: "BUY",
    stock,
    qty,
    price,
    total
  });

  localStorage.setItem("trades", JSON.stringify(trades));
  updateBalance();
  renderTrades();
});

// ===== SELL =====
sellBtn.addEventListener("click", () => {
  const qty = Number(qtyInput.value);
  const price = Number(priceInput.value);
  const stock = stockSelect.value;
  const total = qty * price;

  balance += total;

  trades.push({
    type: "SELL",
    stock,
    qty,
    price,
    total
  });

  localStorage.setItem("trades", JSON.stringify(trades));
  updateBalance();
  renderTrades();
});

// ===== INIT =====
updateBalance();
renderTrades();