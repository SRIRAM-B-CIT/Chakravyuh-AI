#!/usr/bin/env node
/**
 * Chakravyuh AI - Demo E-Commerce Target Application (Port 5000)
 * 
 * Used for live "Before & After" cyber attack & SOAR micro-isolation demonstrations.
 * Zero external dependencies (uses native Node.js HTTP).
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

// Metrics for live latency display
let requestCount = 0;
let lastReset = Date.now();
let serverStartTime = Date.now();

// Server definition
const server = http.createServer((req, res) => {
  const reqStart = Date.now();
  requestCount++;

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

  // 1. Health & Ping Endpoint (Used by latency gauge)
  if (pathname === '/api/health' || pathname === '/health') {
    const uptimeSec = Math.floor((Date.now() - serverStartTime) / 1000);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: "HEALTHY",
      service: "Chakravyuh E-Commerce Storefront",
      port: PORT,
      uptimeSeconds: uptimeSec,
      totalRequests: requestCount,
      timestamp: Date.now()
    }));
    return;
  }

  // 2. Products API
  if (pathname === '/api/products') {
    // Under attack, simulate realistic database / cryptographic query work
    let x = 0;
    for (let i = 0; i < 50000; i++) {
      x += Math.sin(i);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ products: PRODUCTS, queryResult: x }));
    return;
  }

  // 3. Checkout Transaction API (Simulates transactional processing)
  if (pathname === '/api/checkout') {
    // Transactional workload
    let hash = 0;
    for (let i = 0; i < 200000; i++) {
      hash = (hash + Math.sqrt(i)) % 1000000;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: "ORDER_PLACED_SUCCESS",
      orderId: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      processedAt: new Date().toISOString(),
      latencyMs: Date.now() - reqStart
    }));
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
      background: rgba(14, 22, 40, 0.85);
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
      padding: 0.35rem 0.8rem;
      border-radius: 9999px;
      border: 1px solid rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
      font-weight: 700;
      transition: all 0.3s ease;
    }
    .latency-pill.degraded {
      border-color: rgba(239, 68, 68, 0.6);
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      animation: pulse 1s infinite;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
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
      padding: 1rem 1.5rem;
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
      flex-col: column;
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
      padding: 0.5rem 1rem;
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
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      border: 1px solid #38bdf8;
      color: #f8fafc;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
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
          <span id="latencyText">PING: 14ms · NOMINAL</span>
        </div>
        <div style="color:var(--text-muted);">REQ: <span id="reqCounter" style="color:var(--text-main); font-weight:700;">0</span></div>
      </div>
    </div>
  </header>

  <section class="hero">
    <h1>Autonomous <span>Cyber Resilience</span> Benchmark</h1>
    <p>Target E-Commerce Web Service used for live DoS Flood & Micro-Isolation verification.</p>
  </section>

  <section class="banner-defense">
    <div class="defense-card">
      <div class="info">
        <div style="font-size: 1.5rem;">⚡</div>
        <div>
          <h3 style="font-size: 0.85rem; font-weight: 800; color: #f8fafc;">Chakravyuh AI Real-Time Protection Status</h3>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
            Target Endpoint: <code style="color:#38bdf8;">http://localhost:5000</code> | SOC Command Dashboard: <code style="color:#38bdf8;">http://localhost:3000</code>
          </p>
        </div>
      </div>
      <button class="btn" onclick="testCheckout(this)">⚡ Place Test Order</button>
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
          <button class="btn" onclick="orderProduct('\${p.name}')">Buy Now</button>
        </div>
      \`;
      grid.appendChild(card);
    });

    function showToast(msg, isError = false) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.style.borderColor = isError ? '#ef4444' : '#38bdf8';
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3000);
    }

    async function orderProduct(name) {
      const start = Date.now();
      try {
        const res = await fetch('/api/checkout', { method: 'POST' });
        const data = await res.json();
        const latency = Date.now() - start;
        showToast(\`✓ Order Placed for \${name}! (\${latency}ms response)\`);
      } catch (err) {
        showToast(\`⚠️ Order Failed! Site under heavy load.\`, true);
      }
    }

    async function testCheckout(btn) {
      btn.innerText = "Processing...";
      const start = Date.now();
      try {
        const res = await fetch('/api/checkout');
        const data = await res.json();
        const latency = Date.now() - start;
        btn.innerText = "⚡ Place Test Order";
        showToast(\`✓ Checkout processed in \${latency}ms (Order: \${data.orderId})\`);
      } catch (e) {
        btn.innerText = "⚡ Place Test Order";
        showToast(\`⚠️ Checkout timed out! Server is experiencing DoS.\`, true);
      }
    }

    // Live Heartbeat & Latency Monitor
    setInterval(async () => {
      const start = Date.now();
      const gauge = document.getElementById('latencyGauge');
      const text = document.getElementById('latencyText');
      const reqCount = document.getElementById('reqCounter');

      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        const latency = Date.now() - start;
        
        reqCount.innerText = data.totalRequests || 0;

        if (latency > 300) {
          gauge.className = 'latency-pill degraded';
          text.innerText = \`LATENCY: \${latency}ms · SEVERE DOS LOAD\`;
        } else {
          gauge.className = 'latency-pill';
          text.innerText = \`PING: \${latency}ms · NOMINAL HEALTH\`;
        }
      } catch (err) {
        gauge.className = 'latency-pill degraded';
        text.innerText = 'PING: TIMEOUT · SERVER UNRESPONSIVE';
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
