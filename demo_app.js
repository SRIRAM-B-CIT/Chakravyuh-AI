#!/usr/bin/env node
/**
 * Chakravyuh AI - Demo E-Commerce Target Application (Port 5000)
 * 
 * Used for live "Before & After" cyber attack & SOAR micro-isolation demonstrations.
 * Features dynamic load-reactive latency modeling to visually demonstrate service degradation
 * during volumetric DoS attacks, and instant recovery once Chakravyuh AI neutralizes the attacker.
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const STATE_FILE = path.join(__dirname, 'state.json');
const HERO_IMAGE_FILE = path.join(__dirname, 'assets', 'marketplace-hero.png');

// In-memory product catalog
const PRODUCTS = [
  {
    id: 1,
    name: "Auralite Studio Pro Headphones",
    category: "Audio",
    price: "$249.00",
    rating: "4.9 ★",
    stock: "In stock · Free delivery tomorrow",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85",
    desc: "Wireless over-ear headphones with adaptive noise cancellation and 40-hour battery life."
  },
  {
    id: 2,
    name: "Vela Active GPS Smartwatch",
    category: "Wearables",
    price: "$189.00",
    rating: "4.7 ★",
    stock: "In stock · Prime delivery",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85",
    desc: "A lightweight everyday smartwatch with health tracking, GPS and a bright AMOLED display."
  },
  {
    id: 3,
    name: "Northline Commuter Backpack",
    category: "Travel",
    price: "$79.95",
    rating: "4.8 ★",
    stock: "Only 9 left in stock",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=85",
    desc: "Weather-resistant 22L backpack with a padded laptop sleeve and organised daily-carry storage."
  },
  {
    id: 4,
    name: "Stride One Everyday Trainers",
    category: "Footwear",
    price: "$94.00",
    rating: "4.6 ★",
    stock: "In stock · Free returns",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85",
    desc: "Breathable performance trainers with responsive cushioning for commutes and daily workouts."
  },
  {
    id: 5,
    name: "Arc Mini 5G Smartphone",
    category: "Mobiles",
    price: "$599.00",
    rating: "4.7 ★",
    stock: "In stock · Ships today",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=85",
    desc: "Compact 5G phone with a vivid OLED display, dual camera system and all-day battery."
  },
  {
    id: 6,
    name: "Sonora Room Smart Speaker",
    category: "Smart Home",
    price: "$129.00",
    rating: "4.8 ★",
    stock: "In stock · Free delivery",
    image: "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=700&q=85",
    desc: "Room-filling wireless speaker with multi-room audio, voice control and privacy controls."
  }
];

// Rolling request tracker for real-time RPS & attack velocity
let requestCount = 0;
const requestTimestamps = [];
const serverStartTime = Date.now();

function recordRequestAndGetRps() {
  const now = Date.now();
  requestCount++;
  requestTimestamps.push(now);

  // Keep sliding window of last 2.5 seconds
  const cutoff = now - 2500;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < cutoff) {
    requestTimestamps.shift();
  }

  return requestTimestamps.length / 2.5; // Current requests per second
}

// Check Chakravyuh AI Defense & Isolation state from state.json
function getDefenseState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      const ageSeconds = (Date.now() / 1000) - (data.last_updated || 0);
      const isSnifferLive = ageSeconds < 5.0;
      const isIsolated = Boolean(data.isolated);
      const benignLabels = new Set([
        "Benign",
        "Legitimate Flash Crowd / High Concurrency"
      ]);
      const isThreat = data.label && !benignLabels.has(data.label);

      return {
        active: isSnifferLive,
        isolated: isIsolated,
        threat: isThreat ? data.label : "None",
        risk: data.risk_score || 0.05,
        src_ip: data.src_ip || "127.0.0.1"
      };
    }
  } catch (e) {
    // Fallback if file read fails during atomic write
  }
  return { active: false, isolated: false, threat: "None", risk: 0.05, src_ip: "127.0.0.1" };
}

// Server definition
const server = http.createServer((req, res) => {
  const reqStart = Date.now();
  const currentRps = recordRequestAndGetRps();
  const defense = getDefenseState();

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/assets/marketplace-hero.png') {
    fs.readFile(HERO_IMAGE_FILE, (error, image) => {
      if (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Asset not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600'
      });
      res.end(image);
    });
    return;
  }

  // Attack threshold: RPS >= 25 req/s represents volumetric flood
  const isAttackVolume = currentRps >= 25;
  // If defense is active and threat is isolated, attack is mitigated!
  const isMitigated = defense.active && defense.isolated;
  const isServerOverwhelmed = isAttackVolume && !isMitigated;

  // Active micro-isolation enforcement: If attacker is isolated by SOAR, immediately destroy flood sockets
  if (isMitigated && pathname === '/api/checkout') {
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('Chakravyuh-Bench') || userAgent.includes('Adversarial') || currentRps >= 30) {
      req.socket.destroy();
      return;
    }
  }

  const simulatedQueueDelay = isServerOverwhelmed
    ? Math.min(5000, Math.floor(800 + (currentRps - 25) * 15))
    : 0;

  // 1. Health & Ping Endpoint (Used by latency gauge)
  if (pathname === '/api/health' || pathname === '/health') {
    const uptimeSec = Math.floor((Date.now() - serverStartTime) / 1000);

    const respond = () => {
      const respLatency = Date.now() - reqStart;
      res.writeHead(isServerOverwhelmed ? 504 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: isServerOverwhelmed ? "DEGRADED_DOS_ATTACK" : (isMitigated ? "PROTECTED_BY_SOAR" : "HEALTHY"),
        service: "Chakravyuh E-Commerce Storefront",
        port: PORT,
        uptimeSeconds: uptimeSec,
        totalRequests: requestCount,
        currentRps: Math.round(currentRps),
        isUnderAttack: isServerOverwhelmed,
        isDefenseActive: defense.active,
        isIsolated: defense.isolated,
        threatLabel: defense.threat,
        serverLatencyMs: respLatency,
        timestamp: Date.now()
      }));
    };

    if (simulatedQueueDelay > 0) {
      setTimeout(respond, simulatedQueueDelay);
    } else {
      respond();
    }
    return;
  }

  // 2. Products API
  if (pathname === '/api/products') {
    const respond = () => {
      if (isServerOverwhelmed) {
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "GATEWAY_TIMEOUT", message: "Target service overwhelmed by volumetric DoS traffic." }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          products: PRODUCTS,
          currentRps: Math.round(currentRps),
          isUnderAttack: isServerOverwhelmed,
          isMitigated: isMitigated
        }));
      }
    };

    if (simulatedQueueDelay > 0) {
      setTimeout(respond, simulatedQueueDelay);
    } else {
      respond();
    }
    return;
  }

  // 3. Checkout Transaction API (Simulates transactional processing)
  if (pathname === '/api/checkout') {
    const respond = () => {
      if (isServerOverwhelmed) {
        // High load without defense causes immediate 504 Gateway Timeout / 503 Outage
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: "GATEWAY_TIMEOUT",
          message: "Transaction timed out due to volumetric server congestion (DoS). Target server queue exhausted.",
          latencyMs: Date.now() - reqStart,
          currentRps: Math.round(currentRps)
        }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: "ORDER_PLACED_SUCCESS",
          orderId: "ORD-" + Math.floor(100000 + Math.random() * 900000),
          processedAt: new Date().toISOString(),
          latencyMs: Date.now() - reqStart,
          currentRps: Math.round(currentRps),
          protectedBy: isMitigated ? "Chakravyuh AI Autonomous SOAR" : "Standard"
        }));
      }
    };

    if (simulatedQueueDelay > 0) {
      setTimeout(respond, simulatedQueueDelay);
    } else {
      respond();
    }
    return;
  }

  // 4. Main HTML Storefront Page
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getStorefrontHtml());
    return;
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

// HTML Generation
function getStorefrontHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChakraMart | Protected E-Commerce Storefront</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070c18;
      --card-bg: #0e1628;
      --card-border: #1e2c4a;
      --accent-blue: #38bdf8;
      --accent-emerald: #10b981;
      --accent-crimson: #ef4444;
      --accent-amber: #f59e0b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: var(--bg);
      color: var(--text-main);
      font-family: 'Inter', system-ui, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      background-image: 
        radial-gradient(circle at 15% 10%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 85% 90%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(12px);
      background: rgba(14, 22, 40, 0.9);
      border-bottom: 1px solid var(--card-border);
      padding: 0.75rem 1.5rem;
    }
    .header-inner {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 900;
      font-size: 1.1rem;
      letter-spacing: 0.05em;
    }
    .logo span { color: var(--accent-blue); }
    .status-panel {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
    }
    .latency-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 1rem;
      border-radius: 9999px;
      border: 1px solid rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
      font-weight: 700;
      transition: all 0.3s ease;
    }
    .latency-pill.degraded {
      border-color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.3) !important;
      color: #fca5a5 !important;
      box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
      animation: alertPulse 0.8s infinite;
    }
    .latency-pill.protected {
      border-color: #38bdf8 !important;
      background: rgba(56, 189, 248, 0.2) !important;
      color: #7dd3fc !important;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
    }
    .pulse-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: currentColor;
    }
    @keyframes alertPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }
    
    /* 504 Critical Crash Overlay */
    .dos-outage-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(5, 8, 18, 0.94);
      backdrop-filter: blur(16px);
      z-index: 999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    .outage-box {
      background: #0e1628;
      border: 2px solid #ef4444;
      box-shadow: 0 0 50px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.2);
      border-radius: 16px;
      max-width: 650px;
      width: 100%;
      padding: 2.5rem;
      text-align: center;
      font-family: 'Inter', sans-serif;
    }
    .outage-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      animation: alertPulse 1s infinite;
    }
    .outage-title {
      font-size: 1.6rem;
      font-weight: 900;
      color: #ef4444;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 0.75rem;
    }
    .outage-desc {
      color: #cbd5e1;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .outage-stats {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 8px;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #fca5a5;
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .alert-banner {
      display: none;
      max-width: 1400px;
      margin: 1rem auto 0;
      padding: 0 1.5rem;
    }
    .alert-box {
      background: rgba(239, 68, 68, 0.18);
      border: 1.5px solid rgba(239, 68, 68, 0.7);
      border-radius: 10px;
      padding: 1rem 1.4rem;
      color: #fca5a5;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 0 25px rgba(239, 68, 68, 0.2);
    }
    .soar-protected-banner {
      display: none;
      max-width: 1400px;
      margin: 1rem auto 0;
      padding: 0 1.5rem;
    }
    .soar-protected-box {
      background: rgba(56, 189, 248, 0.15);
      border: 1.5px solid rgba(56, 189, 248, 0.6);
      border-radius: 10px;
      padding: 0.9rem 1.3rem;
      color: #7dd3fc;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.9rem;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
    }
    .hero {
      max-width: 1400px;
      margin: 2rem auto 1.5rem;
      padding: 0 1.5rem;
      text-align: center;
    }
    .hero h1 {
      font-size: 2.2rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }
    .hero h1 span {
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      color: var(--text-muted);
      font-size: 0.95rem;
      max-width: 600px;
      margin: 0 auto;
    }
    .banner-defense {
      max-width: 1400px;
      margin: 1rem auto 2rem;
      padding: 0 1.5rem;
    }
    .defense-card {
      background: linear-gradient(135deg, rgba(14, 22, 40, 0.9), rgba(20, 32, 58, 0.9));
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 12px;
      padding: 1.2rem 1.5rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .defense-card .info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .grid {
      max-width: 1400px;
      margin: 0 auto 3rem;
      padding: 0 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .product-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    .product-card:hover {
      border-color: var(--accent-blue);
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -10px rgba(0,0,0,0.5);
    }
    .card-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }
    .category {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--accent-blue);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .product-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0.25rem 0 0.5rem;
    }
    .desc {
      color: var(--text-muted);
      font-size: 0.8rem;
      line-height: 1.4;
      margin-bottom: 1rem;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--card-border);
      padding-top: 1rem;
      margin-top: auto;
    }
    .price {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #38bdf8;
    }
    .btn {
      background: linear-gradient(135deg, #2563eb, #38bdf8);
      color: #ffffff;
      border: none;
      padding: 0.55rem 1.1rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.75rem;
      cursor: pointer;
      font-family: 'JetBrains Mono', monospace;
      transition: all 0.15s ease;
    }
    .btn:hover {
      opacity: 0.9;
      transform: scale(1.02);
    }
    .btn:active {
      transform: scale(0.98);
    }
    .btn-danger {
      background: linear-gradient(135deg, #dc2626, #f87171) !important;
    }
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      border: 1px solid #38bdf8;
      color: #f8fafc;
      padding: 14px 22px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      display: none;
      z-index: 100;
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Mature retail storefront */
    body {
      background: #eaeded;
      color: #0f1111;
      font-family: Arial, Helvetica, sans-serif;
      background-image: none;
    }
    .retail-header {
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 0;
      color: #fff;
      background: #101827;
      border: 0;
      box-shadow: 0 1px 4px rgba(0,0,0,.28);
    }
    .retail-main {
      min-height: 68px;
      padding: 9px 18px;
      display: grid;
      grid-template-columns: auto minmax(280px, 1fr) minmax(390px, auto) auto;
      align-items: center;
      gap: 16px;
    }
    .retail-logo {
      color: #fff;
      text-decoration: none;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -1.2px;
      white-space: nowrap;
    }
    .retail-logo span { color: #f6b73c; }
    .retail-logo small {
      display: block;
      margin-top: -2px;
      color: #aab7c7;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .search-bar {
      height: 43px;
      display: grid;
      grid-template-columns: auto 1fr 48px;
      overflow: hidden;
      border-radius: 6px;
      background: #fff;
      box-shadow: 0 0 0 2px transparent;
    }
    .search-bar:focus-within { box-shadow: 0 0 0 3px #f6b73c; }
    .search-bar select {
      padding: 0 12px;
      border: 0;
      border-right: 1px solid #d5d9d9;
      color: #475569;
      background: #f3f4f6;
      font-size: 12px;
    }
    .search-bar input {
      min-width: 0;
      border: 0;
      padding: 0 14px;
      color: #111827;
      font-size: 14px;
      outline: 0;
    }
    .search-bar button {
      border: 0;
      background: #f6b73c;
      color: #111827;
      font-size: 18px;
      cursor: pointer;
    }
    .ops-console {
      display: grid;
      grid-template-columns: repeat(2, minmax(104px, 1fr));
      gap: 5px;
      font-family: 'JetBrains Mono', monospace;
    }
    .ops-metric {
      min-height: 40px;
      padding: 6px 9px;
      border: 1px solid #334155;
      border-radius: 5px;
      background: #172235;
    }
    .ops-label {
      display: block;
      color: #94a3b8;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .ops-value {
      display: block;
      margin-top: 2px;
      color: #f8fafc;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ops-value.good { color: #5ee6ad; }
    .ops-value.warn { color: #ffd166; }
    .ops-value.bad { color: #ff8b8b; }
    .ops-metric.degraded-state { border-color: #ef4444; background: #321b25; }
    .ops-metric.protected-state { border-color: #0ea5e9; background: #102b3b; }
    .account-links {
      display: flex;
      align-items: center;
      gap: 15px;
      font-size: 11px;
      white-space: nowrap;
    }
    .account-links strong { display: block; font-size: 13px; }
    .cart { font-size: 22px; }
    .category-nav {
      min-height: 36px;
      padding: 0 18px;
      display: flex;
      align-items: center;
      gap: 20px;
      overflow-x: auto;
      color: #f8fafc;
      background: #223047;
      font-size: 12px;
      white-space: nowrap;
    }
    .category-nav a { color: inherit; text-decoration: none; }
    .category-nav a:hover { text-decoration: underline; }
    .category-nav .nav-promo { margin-left: auto; color: #ffd166; font-weight: 700; }
    .retail-hero {
      position: relative;
      min-height: 420px;
      max-width: 1500px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      overflow: hidden;
      color: #fff;
      background: #061120 url('/assets/marketplace-hero.png') center/cover no-repeat;
    }
    .retail-hero::after {
      content: '';
      position: absolute;
      inset: auto 0 0;
      height: 130px;
      background: linear-gradient(transparent, #eaeded);
      pointer-events: none;
    }
    .hero-copy {
      position: relative;
      z-index: 2;
      width: min(520px, 42%);
      padding: 48px;
    }
    .hero-eyebrow {
      color: #f6b73c;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .hero-copy h1 {
      margin: 9px 0 12px;
      font-size: clamp(34px, 4vw, 58px);
      line-height: .98;
      letter-spacing: -.04em;
    }
    .hero-copy p {
      max-width: 420px;
      color: #d7e0ea;
      font-size: 16px;
      line-height: 1.5;
    }
    .hero-cta {
      display: inline-block;
      margin-top: 22px;
      padding: 12px 20px;
      border-radius: 5px;
      color: #101827;
      background: #f6b73c;
      font-size: 13px;
      font-weight: 800;
      text-decoration: none;
    }
    .notice-wrap {
      position: relative;
      z-index: 5;
      max-width: 1460px;
      margin: -62px auto 0;
      padding: 0 18px;
    }
    .retail-service-bar {
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border: 1px solid #d5d9d9;
      background: #fff;
      box-shadow: 0 3px 12px rgba(15,23,42,.12);
      font-size: 13px;
    }
    .service-copy strong { color: #111827; }
    .service-copy span { color: #64748b; }
    .benchmark-actions { display: flex; gap: 8px; }
    .retail-button {
      min-height: 34px;
      padding: 0 14px;
      border: 1px solid #d5a129;
      border-radius: 5px;
      background: #ffd873;
      color: #111827;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .retail-button.secondary { border-color: #cbd5e1; background: #f8fafc; }
    .section-heading {
      max-width: 1460px;
      margin: 30px auto 14px;
      padding: 0 18px;
      display: flex;
      align-items: end;
      justify-content: space-between;
    }
    .section-heading h2 { font-size: 24px; }
    .section-heading a { color: #007185; font-size: 13px; text-decoration: none; }
    .grid {
      max-width: 1460px;
      margin: 0 auto 48px;
      padding: 0 18px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }
    .product-card {
      min-width: 0;
      padding: 0 0 18px;
      border: 1px solid #d5d9d9;
      border-radius: 2px;
      color: #0f1111;
      background: #fff;
      box-shadow: none;
    }
    .product-card:hover {
      border-color: #aab7c4;
      transform: none;
      box-shadow: 0 4px 15px rgba(15,23,42,.12);
    }
    .product-image-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 1.35;
      margin-bottom: 15px;
      overflow: hidden;
      background: #f7f8f8;
    }
    .product-image {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      transition: transform .25s ease;
    }
    .product-card:hover .product-image { transform: scale(1.025); }
    .product-content { padding: 0 16px; }
    .category { color: #64748b; font-family: Arial, sans-serif; font-size: 10px; }
    .product-title { min-height: 42px; margin: 6px 0; font-size: 16px; line-height: 1.3; }
    .rating { color: #e89b00; font-size: 13px; }
    .desc { min-height: 48px; color: #565959; font-size: 12px; line-height: 1.45; }
    .price { color: #0f1111; font-family: Arial, sans-serif; font-size: 22px; }
    .stock { display: block; margin-top: 3px; color: #007600; font-size: 11px; }
    .card-footer {
      margin: 14px 16px 0;
      padding-top: 13px;
      border-color: #e7e9ec;
      align-items: end;
    }
    .add-cart {
      padding: 8px 12px;
      border: 1px solid #fcd200;
      border-radius: 999px;
      background: #ffd814;
      color: #0f1111;
      font-size: 12px;
      cursor: pointer;
    }
    .alert-banner, .soar-protected-banner {
      position: fixed;
      top: 112px;
      right: 18px;
      z-index: 100;
      max-width: 500px;
      margin: 0;
      padding: 0;
    }
    .alert-box, .soar-protected-box {
      border-radius: 6px;
      padding: 12px 15px;
      color: #fff;
      background: #991b1b;
      box-shadow: 0 8px 24px rgba(15,23,42,.3);
      font-family: Arial, sans-serif;
      font-size: 12px;
    }
    .soar-protected-box { border-color: #0f766e; background: #075985; color: #fff; }
    .dos-outage-modal { background: rgba(15,23,42,.72); }
    .outage-box {
      max-width: 560px;
      padding: 32px;
      border: 0;
      border-top: 5px solid #b91c1c;
      border-radius: 4px;
      color: #111827;
      background: #fff;
      box-shadow: 0 24px 70px rgba(0,0,0,.35);
    }
    .outage-icon { font-size: 0; }
    .outage-icon::after { content: 'SERVICE UNAVAILABLE'; color: #b91c1c; font-size: 12px; letter-spacing: .14em; font-weight: 800; }
    .outage-title { color: #991b1b; font-family: Arial, sans-serif; font-size: 26px; }
    .outage-desc { color: #475569; }
    .outage-stats { color: #7f1d1d; background: #fff7f7; border-color: #fecaca; }
    .toast { color: #fff; background: #172235; border-color: #64748b; font-family: Arial, sans-serif; }
    @media (max-width: 1180px) {
      .retail-main { grid-template-columns: auto 1fr auto; }
      .account-links { display: none; }
      .ops-console { grid-column: 1 / -1; grid-template-columns: repeat(4, 1fr); }
      .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 780px) {
      .retail-main { grid-template-columns: 1fr; }
      .search-bar { grid-row: 2; }
      .ops-console { grid-template-columns: repeat(2, 1fr); }
      .category-nav { padding: 0 12px; gap: 14px; }
      .retail-hero { min-height: 390px; background-position: 58% center; }
      .hero-copy { width: 72%; padding: 28px 22px 90px; }
      .hero-copy h1 { font-size: 36px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .retail-service-bar { align-items: flex-start; flex-direction: column; }
    }
    @media (max-width: 500px) {
      .hero-copy { width: 92%; }
      .grid { grid-template-columns: 1fr; }
      .ops-console { grid-template-columns: 1fr 1fr; }
      .benchmark-actions { width: 100%; }
      .retail-button { flex: 1; }
    }
  </style>
</head>
<body>
  <!-- Fullscreen 504 DoS Crash Freeze Overlay -->
  <div id="dosOutageModal" class="dos-outage-modal">
    <div class="outage-box">
      <div class="outage-icon">💥</div>
      <div class="outage-title">Checkout temporarily unavailable</div>
      <div style="font-size: 1.05rem; font-weight: 800; color: #991b1b; margin-bottom: 0.75rem;">
        We're having trouble processing requests
      </div>
      <p class="outage-desc">
        Unusually high traffic is delaying checkout requests. ChakraMart is monitoring the service and will restore normal access automatically when the traffic source is contained.
      </p>
      <div class="outage-stats">
        <div>• SERVICE STATUS: 504 GATEWAY TIMEOUT</div>
        <div id="outageRps">• LIVE TRAFFIC: 450 req/s</div>
        <div>• DEFENSE STATUS: <span style="color:#991b1b; font-weight:800;">AWAITING MITIGATION</span></div>
        <div>• NEXT STEP: Chakravyuh AI will isolate the verified source when detection is confirmed</div>
      </div>
      <p style="font-size:0.75rem; color:#64748b;">
        This page checks service health automatically. No manual refresh is required.
      </p>
    </div>
  </div>

  <header class="retail-header">
    <div class="retail-main">
      <a class="retail-logo" href="/">chakra<span>mart</span><small>Everything, delivered</small></a>
      <form class="search-bar" onsubmit="event.preventDefault(); showToast('Search is ready for the live demo');">
        <select aria-label="Search category"><option>All</option><option>Electronics</option><option>Fashion</option><option>Home</option></select>
        <input type="search" aria-label="Search products" placeholder="Search ChakraMart" />
        <button type="submit" aria-label="Search">⌕</button>
      </form>
      <aside class="ops-console" aria-label="Live storefront and defense telemetry">
        <div class="ops-metric"><span class="ops-label">Traffic received</span><span id="reqCounter" class="ops-value">0 requests</span></div>
        <div class="ops-metric"><span class="ops-label">Receiving now</span><span id="rpsCounter" class="ops-value">0 req/s</span></div>
        <div class="ops-metric"><span class="ops-label">Defense</span><span id="defenseStatus" class="ops-value good">Monitoring</span></div>
        <div class="ops-metric"><span class="ops-label">Service message</span><span id="trafficMessage" class="ops-value good">No errors</span></div>
        <div id="latencyGauge" class="ops-metric" style="grid-column:1/-1; min-height:28px;"><span class="ops-label">Health</span><span id="latencyText" class="ops-value good">4ms · Nominal</span></div>
      </aside>
      <div class="account-links"><span>Hello, sign in<strong>Account & Lists</strong></span><span>Returns<strong>& Orders</strong></span><span class="cart">🛒</span></div>
    </div>
    <nav class="category-nav" aria-label="Store categories">
      <a href="#deals"><strong>☰ All</strong></a><a href="#deals">Today's Deals</a><a href="#deals">Mobiles</a><a href="#deals">Electronics</a><a href="#deals">Fashion</a><a href="#deals">Home & Kitchen</a><a href="#deals">Audio</a><a href="#deals">New Releases</a><a href="#deals" class="nav-promo">Secure shopping, uninterrupted</a>
    </nav>
  </header>

  <div id="alertBanner" class="alert-banner">
    <div class="alert-box">
      <span style="font-size: 1.5rem;">🚨</span>
      <div>
        <strong>Checkout disruption detected:</strong>
        Traffic volume is causing elevated response times. Defense verification is in progress.
      </div>
    </div>
  </div>

  <div id="soarBanner" class="soar-protected-banner">
    <div class="soar-protected-box">
      <span style="font-size: 1.5rem;">🛡️</span>
      <div>
        <strong>Service protected:</strong>
        The verified traffic source has been isolated and checkout is responding normally.
      </div>
    </div>
  </div>

  <section class="retail-hero">
    <div class="hero-copy">
      <div class="hero-eyebrow">The new essentials edit</div>
      <h1>Designed for every day.</h1>
      <p>Discover considered technology, travel and lifestyle picks with fast delivery and easy returns.</p>
      <a class="hero-cta" href="#deals">Shop featured deals</a>
    </div>
  </section>

  <div class="notice-wrap">
    <div class="retail-service-bar">
      <div class="service-copy"><strong>ChakraMart service monitor</strong><br><span>Live checkout target on port 5000 · protected by Chakravyuh AI</span></div>
      <div class="benchmark-actions"><button class="retail-button secondary" onclick="testCheckout(this)">Place test order</button><button class="retail-button" onclick="triggerBrowserAttackBurst(this)">Run traffic test</button></div>
    </div>
  </div>

  <div class="section-heading" id="deals"><div><h2>Today's featured deals</h2><span style="color:#64748b;font-size:13px;">Popular picks across electronics, travel and home</span></div><a href="#deals">See all deals</a></div>
  <main class="grid" id="productGrid"></main>

  <div id="toast" class="toast"></div>

  <script>
    const products = ${JSON.stringify(PRODUCTS)};
    const grid = document.getElementById('productGrid');
    
    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = \`
        <div>
          <div class="product-image-wrap"><img class="product-image" src="\${p.image}" alt="\${p.name}" loading="lazy" /></div>
          <div class="product-content"><div class="category">\${p.category}</div><h2 class="product-title">\${p.name}</h2><div class="rating">\${p.rating}</div><p class="desc">\${p.desc}</p></div>
        </div>
        <div class="card-footer">
          <div>
            <div class="price">\${p.price}</div>
            <small class="stock">\${p.stock}</small>
          </div>
          <button class="add-cart" onclick="orderProduct('\${p.name}', this)">Add to cart</button>
        </div>
      \`;
      grid.appendChild(card);
    });

    function showToast(msg, isError = false) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.style.borderColor = isError ? '#ef4444' : '#38bdf8';
      t.style.background = isError ? '#450a0a' : '#0f172a';
      t.style.color = isError ? '#fca5a5' : '#f8fafc';
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 4500);
    }

    async function orderProduct(name, btn) {
      const originalText = btn.innerText;
      btn.innerText = "Processing...";
      btn.disabled = true;
      const start = Date.now();
      try {
        const res = await fetch('/api/checkout', { method: 'POST' });
        const latency = Date.now() - start;
        if (!res.ok) {
          showToast(\`⚠️ Error \${res.status}: Transaction Failed! Server congested under DoS load.\`, true);
        } else {
          const data = await res.json();
          showToast(\`✓ Order Placed for \${name}! (\${latency}ms response)\`);
        }
      } catch (err) {
        showToast(\`⚠️ Error 504 Gateway Timeout! Connection timed out during DoS surge.\`, true);
      } finally {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    }

    async function testCheckout(btn) {
      const originalText = btn.innerText;
      btn.innerText = "Processing Transaction...";
      btn.disabled = true;
      const start = Date.now();
      try {
        const res = await fetch('/api/checkout');
        const latency = Date.now() - start;
        if (!res.ok) {
          showToast(\`⚠️ Error \${res.status}: Checkout Timed Out (\${latency}ms) under DoS load.\`, true);
        } else {
          const data = await res.json();
          showToast(\`✓ Checkout processed in \${latency}ms (Order: \${data.orderId})\`);
        }
      } catch (e) {
        showToast(\`⚠️ Error 504 Gateway Timeout! Server is experiencing severe DoS load.\`, true);
      } finally {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    }

    // In-browser rapid attack burst simulator (sends 400 requests in 3 seconds)
    function triggerBrowserAttackBurst(btn) {
      const originalText = btn.innerText;
      btn.innerText = "Attacking...";
      btn.disabled = true;
      showToast("💥 Launching simulated volumetric traffic burst (400 requests)...", true);
      
      let count = 0;
      const burstInterval = setInterval(() => {
        for (let i = 0; i < 20; i++) {
          fetch('/api/checkout').catch(() => {});
          count++;
        }
        if (count >= 400) {
          clearInterval(burstInterval);
          btn.innerText = originalText;
          btn.disabled = false;
        }
      }, 100);
    }

    // Live Heartbeat & Latency Monitor (Runs every 1000ms)
    setInterval(async () => {
      const start = Date.now();
      const gauge = document.getElementById('latencyGauge');
      const text = document.getElementById('latencyText');
      const reqCount = document.getElementById('reqCounter');
      const rpsCounter = document.getElementById('rpsCounter');
      const defenseStatus = document.getElementById('defenseStatus');
      const trafficMessage = document.getElementById('trafficMessage');
      const banner = document.getElementById('alertBanner');
      const soarBanner = document.getElementById('soarBanner');
      const outageModal = document.getElementById('dosOutageModal');
      const outageRps = document.getElementById('outageRps');

      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        const latency = Date.now() - start;
        
        reqCount.innerText = \`\${data.totalRequests || 0} requests\`;
        const rps = data.currentRps || 0;
        rpsCounter.innerText = \`\${rps} req/s\`;

        if (data.isUnderAttack) {
          // Scenario A: Defense is OFF / Attack unmitigated -> Freezes UI with 504 Modal
          gauge.className = 'ops-metric degraded-state';
          text.className = 'ops-value bad';
          text.innerText = \`504 timeout · \${latency}ms\`;
          rpsCounter.className = 'ops-value bad';
          defenseStatus.className = 'ops-value warn';
          defenseStatus.innerText = data.isDefenseActive ? 'Verifying threat' : 'Defense offline';
          trafficMessage.className = 'ops-value bad';
          trafficMessage.innerText = 'Checkout congestion';
          banner.style.display = 'block';
          soarBanner.style.display = 'none';
          outageModal.style.display = 'flex';
          outageRps.innerText = \`• LIVE TRAFFIC: \${rps} req/s (SERVICE CONGESTED)\`;
        } else if (data.status === "PROTECTED_BY_SOAR" || data.isIsolated) {
          // Scenario B: Defense is ON -> Attacker Isolated by SOAR
          gauge.className = 'ops-metric protected-state';
          text.className = 'ops-value good';
          text.innerText = \`\${latency}ms · Protected\`;
          rpsCounter.className = 'ops-value warn';
          defenseStatus.className = 'ops-value good';
          defenseStatus.innerText = 'SOAR protected';
          trafficMessage.className = 'ops-value good';
          trafficMessage.innerText = \`Blocked \${data.threatLabel || 'threat'}\`;
          banner.style.display = 'none';
          soarBanner.style.display = 'block';
          outageModal.style.display = 'none';
        } else {
          // Nominal Safe
          gauge.className = 'ops-metric';
          text.className = 'ops-value good';
          text.innerText = \`\${latency}ms · Nominal\`;
          rpsCounter.className = rps > 15 ? 'ops-value warn' : 'ops-value good';
          defenseStatus.className = data.isDefenseActive ? 'ops-value good' : 'ops-value warn';
          defenseStatus.innerText = data.isDefenseActive ? 'Monitoring' : 'Defense offline';
          trafficMessage.className = 'ops-value good';
          trafficMessage.innerText = 'No errors';
          banner.style.display = 'none';
          soarBanner.style.display = 'none';
          outageModal.style.display = 'none';
        }
      } catch (err) {
        gauge.className = 'ops-metric degraded-state';
        text.className = 'ops-value bad';
        text.innerText = 'Health check timeout';
        rpsCounter.className = 'ops-value bad';
        rpsCounter.innerText = 'Unavailable';
        defenseStatus.className = 'ops-value bad';
        defenseStatus.innerText = 'Unknown';
        trafficMessage.className = 'ops-value bad';
        trafficMessage.innerText = 'Service unreachable';
        banner.style.display = 'block';
        soarBanner.style.display = 'none';
        outageModal.style.display = 'flex';
        outageRps.innerText = '• STATUS: SERVER CRASHED (504 GATEWAY TIMEOUT)';
      }
    }, 1000);
  </script>
</body>
</html>`;
}

// Start Server
server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🛒 Chakravyuh Demo E-Commerce App Active on http://${HOST}:${PORT}`);
  console.log(`Target Mock Service for DoS & Micro-Isolation Demonstrations`);
  console.log(`=======================================================`);
});
