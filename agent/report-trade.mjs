import { readFileSync, writeFileSync, existsSync } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORTFOLIO_FILE = join(__dirname, "portfolio.json");

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function run() {
  if (!existsSync(PORTFOLIO_FILE)) {
    console.log("No portfolio.json found. Run agent.mjs first to initialize.");
    process.exit(1);
  }

  const portfolio = JSON.parse(readFileSync(PORTFOLIO_FILE, "utf-8"));
  const txUsed = portfolio.transactions.length;
  const txRemaining = portfolio.max_transactions - txUsed;

  console.log("\n--- Current Portfolio ---");
  console.log(`  BTC: ${portfolio.btc_balance}`);
  console.log(`  USD: $${portfolio.usd_balance}`);
  console.log(`  Goal: ${portfolio.goal_btc} BTC`);
  console.log(`  Transactions: ${txUsed}/${portfolio.max_transactions} (${txRemaining} remaining)`);
  console.log("------------------------\n");

  if (txRemaining <= 0) {
    console.log("No transactions remaining. Goal reached or limit hit.");
    rl.close();
    return;
  }

  const action = (await ask("Action (buy/sell): ")).trim().toLowerCase();
  if (action !== "buy" && action !== "sell") {
    console.log("Invalid action. Must be 'buy' or 'sell'.");
    rl.close();
    return;
  }

  const btcAmount = parseFloat(await ask("BTC amount: "));
  if (isNaN(btcAmount) || btcAmount <= 0) {
    console.log("Invalid BTC amount.");
    rl.close();
    return;
  }

  const pricePerBtc = parseFloat(await ask("Price per BTC (USD): "));
  if (isNaN(pricePerBtc) || pricePerBtc <= 0) {
    console.log("Invalid price.");
    rl.close();
    return;
  }

  const usdValue = btcAmount * pricePerBtc;

  if (action === "buy") {
    if (usdValue > portfolio.usd_balance) {
      console.log(`Insufficient USD. Need $${usdValue.toFixed(2)}, have $${portfolio.usd_balance.toFixed(2)}.`);
      rl.close();
      return;
    }
    portfolio.btc_balance += btcAmount;
    portfolio.usd_balance -= usdValue;
  } else {
    if (btcAmount > portfolio.btc_balance) {
      console.log(`Insufficient BTC. Need ${btcAmount}, have ${portfolio.btc_balance}.`);
      rl.close();
      return;
    }
    portfolio.btc_balance -= btcAmount;
    portfolio.usd_balance += usdValue;
  }

  portfolio.transactions.push({
    action,
    btc_amount: btcAmount,
    price_per_btc: pricePerBtc,
    usd_value: usdValue,
    timestamp: new Date().toISOString(),
  });

  writeFileSync(PORTFOLIO_FILE, JSON.stringify(portfolio, null, 2));

  const newTxUsed = portfolio.transactions.length;
  const newTxRemaining = portfolio.max_transactions - newTxUsed;
  const btcNeeded = portfolio.goal_btc - portfolio.btc_balance;

  console.log("\n--- Updated Portfolio ---");
  console.log(`  BTC: ${portfolio.btc_balance.toFixed(8)}`);
  console.log(`  USD: $${portfolio.usd_balance.toFixed(2)}`);
  console.log(`  Goal: ${portfolio.goal_btc} BTC (need ${btcNeeded.toFixed(8)} more)`);
  console.log(`  Transactions: ${newTxUsed}/${portfolio.max_transactions} (${newTxRemaining} remaining)`);

  if (portfolio.btc_balance >= portfolio.goal_btc) {
    console.log("\n  *** GOAL REACHED! ***");
  }
  console.log("------------------------\n");

  rl.close();
}

run();
