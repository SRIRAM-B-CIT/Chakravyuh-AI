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

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// In-memory product catalog
const PRODUCTS = [
  {
    id: 1,
    name: "Chakravyuh Edge Sensor X1",
    category: "Hardware Appliance",
    price: "$1,499.00",
    rating: "4.9 ★",
    stock: "In Stock (24 units)",
    image: "🛡️",
    desc: "Low-latency hardware telemetry probe with AF_PACKET native wire capture."
  },
  {
    id: 2,
    name: "Quantum Neural Accelerator",
    category: "AI Coprocessor",
    price: "$2,850.00",
    rating: "5.0 ★",
    stock: "In Stock (12 units)",
    image: "🧠",
    desc: "Dedicated tensor acceleration card for ST-GNN spatial graph inference."
  },
  {
    id: 3,
    name: "Zero-Trust HSM Security Token",
    category: "Authentication",
    price: "$320.00",
    rating: "4.8 ★",
    stock: "In Stock (150 units)",
    image: "🔑",
    desc: "FIPS 140-3 Level 4 hardware security module with anti-tamper enclave."
  },
  {
    id: 4,
    name: "Autonomous SOAR Containment Node",
    category: "Security Software",
    price: "$4,200.00/yr",
    rating: "5.0 ★",
    stock: "Enterprise License",
    image: "⚡",
    desc: "Self-healing Netfilter & conntrack micro-isolation automation engine."
  },
  {
    id: 5,
    name: "Encrypted Fiber Mesh Gateway",
    category: "Infrastructure",
    price: "$3,650.00",
    rating: "4.9 ★",
    stock: "In Stock (8 units)",
    image: "🌐",
    desc: "100 Gbps line-rate IPsec / WireGuard mesh routing interface."
  },
  {
    id: 6,
    name: "Forensic Memory Snapshot Appliance",
    category: "Incident Response",
    price: "$1,890.00",
    rating: "4.7 ★",
    stock: "In Stock (35 units)",
    image: "💾",
    desc: "Continuous physical RAM snapshot ring-buffer for post-incident triage."
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

// Server definition
const server = http.createServer((req, res) => {
  const reqStart = Date.now();
  const currentRps = recordRequestAndGetRps();

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

  // Attack threshold: RPS >= 30 req/s represents volumetric attack surge
  const isUnderAttack = currentRps >= 30;
  const simulatedQueueDelay = isUnderAttack 
    ? Math.min(4800, Math.floor(600 + (currentRps - 30) * 15))
    : 0;

  // 1. Health & Ping Endpoint (Used by latency gauge)
  if (pathname === '/api/health' || pathname === '/health') {
    const uptimeSec = Math.floor((Date.now() - serverStartTime) / 1000);

    const respond = () => {
      const respLatency = Date.now() - reqStart;
      res.writeHead(isUnderAttack ? 503 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: isUnderAttack ? "DEGRADED_DOS_ATTACK" : "HEALTHY",
        service: "Chakravyuh E-Commerce Storefront",
        port: PORT,
        uptimeSeconds: uptimeSec,
        totalRequests: requestCount,
        currentRps: Math.round(currentRps),
        isUnderAttack: isUnderAttack,
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        products: PRODUCTS,
        currentRps: Math.round(currentRps),
        isUnderAttack: isUnderAttack 
      }));
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
      if (isUnderAttack && Math.random() < 0.7) {
        // High load causes transaction failures / timeouts
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: "GATEWAY_TIMEOUT",
          message: "Transaction timed out due to volumetric server congestion (DoS).",
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
          currentRps: Math.round(currentRps)
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
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <div class="logo">
        🛡️ <div>CHAKRA<span>MART</span> <small style="font-size:0.6rem; color:var(--text-muted); font-weight:600; display:block;">TARGET APP · PORT 5000</small></div>
      </div>
      <div class="status-panel">
        <div id="latencyGauge" class="latency-pill">
          <div class="pulse-dot"></div>
          <span id="latencyText">PING: 4ms · NOMINAL HEALTH (0 req/s)</span>
        </div>
        <div style="color:var(--text-muted);">TOTAL REQ: <span id="reqCounter" style="color:var(--text-main); font-weight:700;">0</span></div>
      </div>
    </div>
  </header>

  <div id="alertBanner" class="alert-banner">
    <div class="alert-box">
      <span style="font-size: 1.5rem;">🚨</span>
      <div>
        <strong style="color:#ef4444;">CRITICAL SERVICE DEGRADATION (ACTIVE DoS SURGE):</strong> 
        Volumetric traffic overload detected! High response latency & transaction timeouts active until Chakravyuh AI micro-isolates the threat source.
      </div>
    </div>
  </div>

  <section class="hero">
    <h1>Autonomous <span>Cyber Resilience</span> Benchmark</h1>
    <p>Target E-Commerce Web Service used for live DoS Flood & Micro-Isolation verification.</p>
  </section>

  <section class="banner-defense">
    <div class="defense-card">
      <div class="info">
        <div style="font-size: 1.5rem;">⚡</div>
        <div>
          <h3 style="font-size: 0.85rem; font-weight: 800; color: #f8fafc;">Live Defense Benchmark Controls</h3>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
            Target Endpoint: <code style="color:#38bdf8;">http://localhost:5000</code> | SOC Command Dashboard: <code style="color:#38bdf8;">http://localhost:3000</code>
          </p>
        </div>
      </div>
      <div style="display:flex; gap:0.6rem;">
        <button class="btn" onclick="testCheckout(this)">⚡ Place Test Order</button>
        <button class="btn btn-danger" onclick="triggerBrowserAttackBurst(this)">💥 Test Attack Burst</button>
      </div>
    </div>
  </section>

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
          <div class="card-icon">\${p.image}</div>
          <div class="category">\${p.category}</div>
          <h2 class="product-title">\${p.name}</h2>
          <p class="desc">\${p.desc}</p>
        </div>
        <div class="card-footer">
          <div>
            <div class="price">\${p.price}</div>
            <small style="color:var(--text-muted); font-size:0.65rem;">\${p.stock}</small>
          </div>
          <button class="btn" onclick="orderProduct('\${p.name}', this)">Buy Now</button>
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
        showToast(\`⚠️ Order Failed! Connection timed out during DoS surge.\`, true);
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
        showToast(\`⚠️ Checkout timed out! Server is experiencing severe DoS load.\`, true);
      } finally {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    }

    // In-browser rapid attack burst simulator (sends 400 requests in 3 seconds)
    function triggerBrowserAttackBurst(btn) {
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
          btn.innerText = "💥 Test Attack Burst";
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
      const banner = document.getElementById('alertBanner');

      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        const latency = Date.now() - start;
        
        reqCount.innerText = data.totalRequests || 0;
        const rps = data.currentRps || 0;

        if (data.isUnderAttack || latency > 200 || !res.ok) {
          gauge.className = 'latency-pill degraded';
          text.innerText = \`LATENCY: \${latency}ms · SEVERE DOS ATTACK (\${rps} req/s)\`;
          banner.style.display = 'block';
        } else {
          gauge.className = 'latency-pill';
          text.innerText = \`PING: \${latency}ms · NOMINAL HEALTH (\${rps} req/s)\`;
          banner.style.display = 'none';
        }
      } catch (err) {
        gauge.className = 'latency-pill degraded';
        text.innerText = 'PING: TIMEOUT (5000ms+) · SERVER UNRESPONSIVE';
        banner.style.display = 'block';
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
