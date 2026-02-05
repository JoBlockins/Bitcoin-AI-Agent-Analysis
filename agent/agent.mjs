import puppeteer from "puppeteer";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORTFOLIO_FILE = join(__dirname, "portfolio.json");
const LOG_FILE = join(__dirname, "agent.log");
const TRACKER_URL = "https://www.jjdockins.com/bitcoin-analysis/";

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + "\n");
}

function notify(title, message) {
  try {
    execSync(
      `osascript -e 'display notification "${message.replace(/"/g, '\\"')}" with title "${title.replace(/"/g, '\\"')}"'`
    );
  } catch {
    log("Failed to send macOS notification");
  }
}

function loadPortfolio() {
  if (!existsSync(PORTFOLIO_FILE)) {
    const initial = {
      btc_balance: 0.25,
      usd_balance: 0,
      goal_btc: 0.5,
      max_transactions: 21,
      transactions: [],
      created_at: new Date().toISOString(),
    };
    writeFileSync(PORTFOLIO_FILE, JSON.stringify(initial, null, 2));
    log("Created initial portfolio.json");
    return initial;
  }
  return JSON.parse(readFileSync(PORTFOLIO_FILE, "utf-8"));
}

async function scrapeMarketData() {
  log("Launching browser...");
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  try {
    await page.goto(TRACKER_URL, { waitUntil: "networkidle2", timeout: 60_000 });
    // Wait for price to appear
    await page.waitForSelector(".market-summary .value.price", { timeout: 60_000 });
    // Wait for the structured JSON blob to appear
    await page.waitForSelector("#agent-data", { timeout: 30_000 });

    const data = await page.evaluate(() => {
      const el = document.getElementById("agent-data");
      if (!el) return null;
      return JSON.parse(el.textContent);
    });

    if (!data) throw new Error("agent-data element was empty or missing");

    log("Scraped market data successfully");
    return data;
  } finally {
    await browser.close();
  }
}

async function getClaudeAnalysis(marketData, portfolio) {
  const client = new Anthropic();

  const txUsed = portfolio.transactions.length;
  const txRemaining = portfolio.max_transactions - txUsed;
  const btcNeeded = portfolio.goal_btc - portfolio.btc_balance;

  const systemPrompt = `You are a Bitcoin trading advisor. You analyze market data and manage a portfolio with a specific goal.

PORTFOLIO STATE:
- Current BTC: ${portfolio.btc_balance} BTC
- Current USD: $${portfolio.usd_balance}
- Goal: ${portfolio.goal_btc} BTC
- BTC needed: ${btcNeeded.toFixed(8)} BTC
- Transactions used: ${txUsed}/${portfolio.max_transactions} (${txRemaining} remaining)

MARKET DATA STRUCTURE:
The data includes an "action" field with a pre-computed verdict:
- action.verdict: "WAIT" | "FAVORABLE" | "CAUTION"
- action.reason: explanation of why
- action.conditions: array of individual condition checks

Use this verdict as a strong signal:
- FAVORABLE = conditions lean positive, good time to accumulate BTC
- CAUTION = warning signs present, consider selling or holding
- WAIT = no clear edge, usually best to hold

RULES:
- You must reach ${portfolio.goal_btc} BTC within ${portfolio.max_transactions} total transactions
- Each buy or sell counts as 1 transaction
- Be strategic — you have limited transactions
- The action.verdict is your primary signal; the indicators provide context
- If USD balance is 0 and you want to buy, you must sell some BTC first to get USD
- Factor in urgency: fewer remaining transactions = more aggressive if behind target

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "suggested_amount": "amount in BTC (for BUY/SELL) or null for HOLD",
  "market_summary": "1-2 sentence market overview"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Here is today's Bitcoin market data scraped from the tracker:\n\n${JSON.stringify(marketData, null, 2)}`,
      },
    ],
  });

  const text = response.content[0].text;
  try {
    return JSON.parse(text);
  } catch {
    log(`Failed to parse Claude response as JSON: ${text}`);
    return { action: "HOLD", confidence: 0, reasoning: "Failed to parse response", raw: text };
  }
}

async function run() {
  log("=== Bitcoin Trading Agent Starting ===");

  try {
    const portfolio = loadPortfolio();
    const marketData = await scrapeMarketData();
    const analysis = await getClaudeAnalysis(marketData, portfolio);

    log(`Analysis: ${JSON.stringify(analysis)}`);

    const actionLine = `${analysis.action} (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`;
    const notifyMsg = `${actionLine}\n${analysis.reasoning}`;

    notify("BTC Agent", notifyMsg);
    log(`Notification sent: ${actionLine}`);
    log("=== Agent Complete ===\n");
  } catch (err) {
    const errMsg = `Agent error: ${err.message}`;
    log(errMsg);
    notify("BTC Agent Error", err.message.substring(0, 100));
    process.exit(1);
  }
}

run();
