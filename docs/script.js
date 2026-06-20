const NAV= '#003366',ORA='#FF6B00',GRN='#00875A',RED='#C9372C',BLU='#0052CC',PUR='#5243AA',TEA='#00796B',AMB='#CF6F00',GRY='#8EAABF';

let campaignData = [];
let currentFilteredData = [];
let currentHeatmapMetric = 'roi';
let CHARTS = {};

// Diagnostics State
const DIAGNOSTICS = {
  debugMode: false,
  dataLoaded: false,
  dataValid: false,
  kpisCalculated: false,
  panelsRendered: false,
  chartsTotal: 11,
  chartsRendered: 0,
  errors: [],
  logs: []
};

function toggleDebugMode() {
  DIAGNOSTICS.debugMode = !DIAGNOSTICS.debugMode;
  const toggleBtn = document.getElementById('dbg-toggle');
  const panel = document.getElementById('dbg-panel');
  if (toggleBtn && panel) {
    if (DIAGNOSTICS.debugMode) {
      toggleBtn.textContent = '🛠 Debug Mode: ON';
      toggleBtn.classList.add('active');
      panel.classList.add('active');
    } else {
      toggleBtn.textContent = '🛠 Debug Mode: OFF';
      toggleBtn.classList.remove('active');
      panel.classList.remove('active');
    }
  }
  logDebug('Debug Mode Toggle', 'info', DIAGNOSTICS.debugMode ? 'ON' : 'OFF');
}

function logDebug(step, status, details="") {
  const timestamp = new Date().toLocaleTimeString();
  const logStr = `[${timestamp}] ${step}: ${status.toUpperCase()} ${details ? '- ' + details : ''}\n`;
  DIAGNOSTICS.logs.push(logStr);
  console.log(`[DEBUG] ${step}: ${status.toUpperCase()}`, details);
  
  if (status === 'fail') {
    DIAGNOSTICS.errors.push(`${step}: ${details}`);
  }
  updateDebugUI();
}

function updateDebugUI() {
  const setStepState = (id, state) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `dbg-step ${state}`;
    const bullet = state === 'success' ? '✓' : (state === 'fail' ? '✗' : '⚪');
    el.innerHTML = `${bullet} ${el.textContent.substring(2)}`;
  };

  if (DIAGNOSTICS.dataLoaded) setStepState('step-fetch', 'success');
  else if (DIAGNOSTICS.errors.some(e => e.includes('Fetch'))) setStepState('step-fetch', 'fail');
  else setStepState('step-fetch', 'pending');

  if (DIAGNOSTICS.dataValid) setStepState('step-validate', 'success');
  else if (DIAGNOSTICS.errors.some(e => e.includes('Validate'))) setStepState('step-validate', 'fail');
  else setStepState('step-validate', 'pending');

  if (DIAGNOSTICS.kpisCalculated) setStepState('step-metrics', 'success');
  else if (DIAGNOSTICS.errors.some(e => e.includes('Metrics'))) setStepState('step-metrics', 'fail');
  else setStepState('step-metrics', 'pending');

  if (DIAGNOSTICS.panelsRendered) setStepState('step-panels', 'success');
  else if (DIAGNOSTICS.errors.some(e => e.includes('Render Executive') || e.includes('Insights') || e.includes('Funnel') || e.includes('Heatmap'))) setStepState('step-panels', 'fail');
  else setStepState('step-panels', 'pending');

  const stepCharts = document.getElementById('step-charts');
  if (stepCharts) {
    const failedCharts = DIAGNOSTICS.errors.filter(e => e.includes('Render Chart')).length;
    const ratioSpan = document.getElementById('dbg-charts-ratio');
    if (ratioSpan) {
      ratioSpan.textContent = `${DIAGNOSTICS.chartsRendered}/${DIAGNOSTICS.chartsTotal}`;
    }
    if (DIAGNOSTICS.chartsRendered === DIAGNOSTICS.chartsTotal) {
      stepCharts.className = 'dbg-step success';
      stepCharts.innerHTML = `✓ Step 5: Render Visualizations (${DIAGNOSTICS.chartsRendered}/${DIAGNOSTICS.chartsTotal})`;
    } else if (failedCharts > 0) {
      stepCharts.className = 'dbg-step fail';
      stepCharts.innerHTML = `✗ Step 5: Render Visualizations (${DIAGNOSTICS.chartsRendered}/${DIAGNOSTICS.chartsTotal})`;
    } else {
      stepCharts.className = 'dbg-step pending';
      stepCharts.innerHTML = `⚪ Step 5: Render Visualizations (${DIAGNOSTICS.chartsRendered}/${DIAGNOSTICS.chartsTotal})`;
    }
  }

  const logsBox = document.getElementById('dbg-logs-box');
  if (logsBox) {
    logsBox.textContent = DIAGNOSTICS.logs.join('');
    logsBox.scrollTop = logsBox.scrollHeight;
  }
}

function showGlobalError(title, desc) {
  const banner = document.getElementById('global-error-banner');
  const msg = document.getElementById('global-error-msg');
  if (banner && msg) {
    msg.innerHTML = `<strong>⚠ ${title}</strong> — ${desc}`;
    banner.style.display = 'block';
    banner.style.background = 'var(--red)';
  }
}

function showGlobalWarning(title, desc) {
  const banner = document.getElementById('global-error-banner');
  const msg = document.getElementById('global-error-msg');
  if (banner && msg) {
    msg.innerHTML = `<strong>⚠ ${title}</strong> — ${desc}`;
    banner.style.display = 'block';
    banner.style.background = 'var(--amber)';
  }
}

function clearGlobalError() {
  const banner = document.getElementById('global-error-banner');
  if (banner) {
    banner.style.display = 'none';
  }
}

function validateCampaignData(data) {
  logDebug('Validate Campaign Schema', 'info', 'Validating campaign dataset schema...');
  if (!data) {
    throw new Error("Dataset is null or undefined.");
  }
  if (!Array.isArray(data)) {
    throw new Error("Dataset is not a valid JSON array.");
  }
  if (data.length === 0) {
    throw new Error("Dataset is empty. No campaigns to load.");
  }

  const requiredFields = [
    "Campaign_ID", "Campaign_Name", "Campaign_Type", "Platform",
    "Region", "Audience_Segment", "Marketing_Spend", "Revenue_Generated", "ROI_%"
  ];

  for (let i = 0; i < data.length; i++) {
    const camp = data[i];
    if (camp === null || camp === undefined) {
      throw new Error(`Campaign record at index ${i} is null or undefined.`);
    }

    // Check for undefined or null fields
    for (const key of Object.keys(camp)) {
      if (camp[key] === undefined || camp[key] === null) {
        throw new Error(`Campaign record at index ${i} has undefined or null value in field '${key}'.`);
      }
      if (Array.isArray(camp[key]) && camp[key].length === 0) {
        throw new Error(`Campaign record at index ${i} has empty array in field '${key}'.`);
      }
    }

    // Check if required fields exist
    const missing = requiredFields.filter(f => !(f in camp));
    if (missing.length > 0) {
      throw new Error(`Campaign record at index ${i} structure mismatch. Missing required fields: ${missing.join(', ')}`);
    }
  }

  DIAGNOSTICS.dataValid = true;
  logDebug('Validate Campaign Schema', 'success', `Valid check passed for ${data.length} records`);
}

function safeExecute(name, fn) {
  try {
    fn();
    logDebug(name, 'success');
  } catch (err) {
    logDebug(name, 'fail', err.message);
    console.error(`Error executing ${name}:`, err);
  }
}

function safeRender(name, elementId, renderFn) {
  try {
    // Verify chart libraries are loaded
    if (typeof Chart === 'undefined') {
      throw new Error("Chart.js library failed to load.");
    }
    if (name.toLowerCase().includes('plotly') && typeof Plotly === 'undefined') {
      throw new Error("Plotly library failed to load.");
    }

    // Verify element ID exists in DOM
    const el = document.getElementById(elementId);
    if (!el) {
      throw new Error(`DOM node #${elementId} not found`);
    }
    
    // Clear any previous error fallbacks in this container
    const card = el.closest('.cc');
    if (card) {
      const existingFallback = card.querySelector('.comp-fallback');
      if (existingFallback) existingFallback.remove();
      el.style.display = 'block';
    }
    
    renderFn();
    DIAGNOSTICS.chartsRendered++;
    logDebug(`Render Chart - ${name}`, 'success');
  } catch (err) {
    logDebug(`Render Chart - ${name}`, 'fail', err.message);
    console.error(`${name} Failed:`, err);
    
    const el = document.getElementById(elementId);
    if (el) {
      el.style.display = 'none';
      const card = el.closest('.cc');
      if (card) {
        card.insertAdjacentHTML('beforeend', `
          <div class="comp-fallback">
            <div>⚠ Failed to render ${name}</div>
            <div class="comp-fallback-desc">${err.message}</div>
          </div>
        `);
      }
    }
  }
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  } else {
    console.warn(`Element #${id} not found in DOM.`);
  }
}

function setElHtml(id, html) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = html;
  } else {
    console.warn(`Element #${id} not found in DOM.`);
  }
}

function showKPIFallback(msg) {
  const ids = ['p1-kpis', 'p2-kpis', 'p3-kpis'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `
        <div class="comp-fallback" style="width: 100%; grid-column: span 5; padding: 24px;">
          <div>⚠ KPI Section Failed</div>
          <div class="comp-fallback-desc">${msg}</div>
        </div>
      `;
    }
  });
}

function showFiltersFallback(msg) {
  const el = document.getElementById('filter-bar');
  if (el) {
    el.innerHTML = `
      <div class="comp-fallback" style="width: 100%; min-height: auto; padding: 8px 16px; margin: 0;">
        <div>⚠ Filters Section Failed: ${msg}</div>
      </div>
    `;
  }
}

function showForecastFallback(msg) {
  const el = document.getElementById('forecast-section');
  if (el) {
    el.innerHTML = `
      <h3>Forward-Looking Predictive Forecasting</h3>
      <div class="comp-fallback" style="padding: 20px; margin-top: 10px;">
        <div>⚠ Forecast Section Failed</div>
        <div class="comp-fallback-desc">${msg}</div>
      </div>
    `;
  }
}

function showRecommendationsFallback(msg) {
  const el1 = document.getElementById('p1-actions-card');
  if (el1) {
    el1.innerHTML = `
      <h3>Recommended Actions This Month</h3>
      <div class="comp-fallback" style="padding: 15px;">
        <div>⚠ Recommendations Section Failed</div>
        <div class="comp-fallback-desc">${msg}</div>
      </div>
    `;
  }
  const el2 = document.getElementById('p4-reallocate-card');
  if (el2) {
    el2.innerHTML = `
      <h3>Strategic Budget Reallocation Recommendations</h3>
      <div class="comp-fallback" style="padding: 15px;">
        <div>⚠ Recommendations Section Failed</div>
        <div class="comp-fallback-desc">${msg}</div>
      </div>
    `;
  }
  const el3 = document.getElementById('p4-actions-card');
  if (el3) {
    el3.innerHTML = `
      <h3>Top Boardroom Actions This Month</h3>
      <div class="comp-fallback" style="padding: 15px;">
        <div>⚠ Recommendations Section Failed</div>
        <div class="comp-fallback-desc">${msg}</div>
      </div>
    `;
  }
}

function showHeatmapFallback(msg) {
  const el = document.getElementById('heatmap-card');
  if (el) {
    el.innerHTML = `
      <h3>Which region-platform combination performs best?</h3>
      <div class="comp-fallback" style="padding: 20px; margin-top: 10px;">
        <div>⚠ Heatmap Table Failed</div>
        <div class="comp-fallback-desc">${msg}</div>
      </div>
    `;
  }
}

function showBottomTableFallback(msg) {
  const el = document.getElementById('campaigns-table-card');
  if (el) {
    el.innerHTML = `
      <h3>Which 10 campaigns should be paused immediately?</h3>
      <div class="comp-fallback" style="padding: 20px; margin-top: 10px;">
        <div>⚠ Campaigns Table Failed</div>
        <div class="comp-fallback-desc">${msg}</div>
      </div>
    `;
  }
}

function showStrategyHealthFallback(msg) {
  const el1 = document.getElementById('health-score-card');
  if (el1) {
    el1.innerHTML = `
      <h3>Executive Marketing Health Score</h3>
      <div class="comp-fallback" style="padding: 20px; margin-top: 10px;">
        <div>⚠ Health Score Failed</div>
        <div class="comp-fallback-desc">${msg}</div>
      </div>
    `;
  }
  const el2 = document.getElementById('benchmarks-card');
  if (el2) {
    el2.innerHTML = `
      <h3>Target Benchmark Comparison</h3>
      <div class="comp-fallback" style="padding: 20px; margin-top: 10px;">
        <div>⚠ Benchmark Comparison Failed</div>
        <div class="comp-fallback-desc">${msg}</div>
      </div>
    `;
  }
}

function killAll() {
  Object.values(CHARTS).forEach(c => c.destroy());
  CHARTS = {};
}

function fmt(v) {
  if (v >= 10000000) return '₹' + (v / 10000000).toFixed(2) + ' Cr';
  if (v >= 100000) return '₹' + (v / 100000).toFixed(2) + 'L';
  return '₹' + Math.round(v).toLocaleString('en-IN');
}

function fmtRaw(v) {
  return Math.round(v).toLocaleString('en-IN');
}

async function init() {
  clearGlobalError();
  DIAGNOSTICS.dataLoaded = false;
  DIAGNOSTICS.dataValid = false;
  DIAGNOSTICS.kpisCalculated = false;
  DIAGNOSTICS.panelsRendered = false;
  DIAGNOSTICS.chartsRendered = 0;
  DIAGNOSTICS.errors = [];
  DIAGNOSTICS.logs = [];

  logDebug('Fetch JSON Data', 'info', 'Loading campaign records from data.json...');

  try {
    if (typeof Chart !== 'undefined') {
      Chart.defaults.font.family = "'Outfit', 'Segoe UI', system-ui, sans-serif";
    }
    const res = await fetch('data.json');
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status} (${res.statusText})`);
    }
    campaignData = await res.json();
    DIAGNOSTICS.dataLoaded = true;
    logDebug('Fetch JSON Data', 'success', `Loaded ${campaignData.length} raw records`);
    
    // Step 2: Validate Campaign Schema
    validateCampaignData(campaignData);
    
    applyFilters();
  } catch (err) {
    logDebug('Fetch JSON Data', 'fail', err.message);
    console.error("Dashboard Loader Exception:", err);
    
    if (!DIAGNOSTICS.dataLoaded) {
      showGlobalError("Data Loading Error", `Failed to fetch campaign data. Please ensure the local web server is running. (Details: ${err.message})`);
    } else {
      showGlobalError("Data Processing Error", `Campaign data loaded successfully but structure validation failed. (Details: ${err.message})`);
    }
  }
}

function applyFilters() {
  clearGlobalError();
  DIAGNOSTICS.kpisCalculated = false;
  DIAGNOSTICS.panelsRendered = false;
  DIAGNOSTICS.chartsRendered = 0;
  DIAGNOSTICS.errors = DIAGNOSTICS.errors.filter(e => e.includes('Fetch') || e.includes('Validate'));

  // Wrap Filters section in a try-catch block
  let filtered = [];
  let activeFilters = [];
  try {
    const plat = document.getElementById('f-plat').value;
    const reg = document.getElementById('f-reg').value;
    const type = document.getElementById('f-type').value;
    const aud = document.getElementById('f-aud').value;
    const roiFilter = document.getElementById('f-roi').value;

    // Toggle active filter visual styles
    document.querySelectorAll('.fbar select').forEach(select => {
      if (select.value !== '') {
        select.classList.add('active-filter');
      } else {
        select.classList.remove('active-filter');
      }
    });

    filtered = campaignData.filter(c => {
      if (plat && c.Platform !== plat) return false;
      if (reg && c.Region !== reg) return false;
      if (type && c.Campaign_Type !== type) return false;
      if (aud && c.Audience_Segment !== aud) return false;
      if (roiFilter) {
        const isProfitable = c["ROI_%"] > 0;
        if (roiFilter.includes('Profitable') && !isProfitable) return false;
        if (roiFilter.includes('Loss-Making') && isProfitable) return false;
      }
      return true;
    });

    // Update active filters array
    if (plat) activeFilters.push(`Platform = ${plat}`);
    if (reg) activeFilters.push(`Region = ${reg}`);
    if (type) activeFilters.push(`Type = ${type}`);
    if (aud) activeFilters.push(`Audience = ${aud}`);
    if (roiFilter) activeFilters.push(`Performance = ${roiFilter}`);

    // Update Interactive Chips
    const chipsContainer = document.getElementById('active-filters-label');
    if (chipsContainer) {
      chipsContainer.innerHTML = ''; // Clear existing chips
      if (activeFilters.length > 0) {
        chipsContainer.style.display = 'inline-flex';
        if (plat) createChip(chipsContainer, plat, 'Platform');
        if (reg) createChip(chipsContainer, reg, 'Region');
        if (type) createChip(chipsContainer, type, 'Type');
        if (aud) createChip(chipsContainer, aud, 'Audience');
        if (roiFilter) createChip(chipsContainer, roiFilter, 'ROI');
      } else {
        chipsContainer.style.display = 'none';
      }
    }

    // Update Filter Navigation Breadcrumb
    const breadcrumbEl = document.getElementById('filter-breadcrumb');
    if (breadcrumbEl) {
      const path = ['All Campaigns'];
      if (plat) path.push(plat);
      if (reg) path.push(reg);
      if (type) path.push(type);
      if (aud) path.push(aud);
      if (roiFilter) {
        if (roiFilter.includes('Profitable')) path.push('Profitable');
        else if (roiFilter.includes('Loss-Making')) path.push('Loss-Making');
        else path.push(roiFilter);
      }
      breadcrumbEl.innerHTML = path.join(' <span class="bc-separator">&gt;</span> ');
    }
  } catch (error) {
    console.error("Filters Section Failed:", error);
    showFiltersFallback(error.message);
    return;
  }

  if (filtered.length === 0) {
    showEmptyState(true);
    return;
  }
  showEmptyState(false);
  currentFilteredData = filtered;

  // Step 3: Compute Dashboard Metrics
  logDebug('Compute Dashboard Metrics', 'info', 'Calculating conversions, ROI strength, and acquisition costs...');
  let metrics;
  try {
    metrics = computeMetrics(filtered);
    DIAGNOSTICS.kpisCalculated = true;
    logDebug('Compute Dashboard Metrics', 'success', 'All campaign metrics processed successfully');
  } catch (err) {
    logDebug('Compute Dashboard Metrics', 'fail', err.message);
    showGlobalError('Data Processing Error', `Metrics calculation failed: ${err.message}`);
    return;
  }

  // Update Dynamic Filter Status Banner and KPI badges
  try {
    const statusBanner = document.getElementById('filter-status-banner');
    const counterEl = document.getElementById('filter-counter');
    
    if (activeFilters.length > 0) {
      if (counterEl) {
        counterEl.textContent = `${filtered.length} Campaign${filtered.length === 1 ? '' : 's'} Selected`;
      }
      if (statusBanner) {
        statusBanner.style.display = 'inline-flex';
        const profit = metrics.revenue - metrics.spend;
        const metricsTextEl = document.getElementById('fsb-metrics');
        if (metricsTextEl) {
          if (profit >= 0) {
            metricsTextEl.textContent = `ROI: ${metrics.overallROI.toFixed(0)}%`;
            metricsTextEl.className = 'sem-green-text';
          } else {
            const formattedProfit = (profit < 0 ? '-' : '') + fmt(Math.abs(profit));
            metricsTextEl.textContent = `Profit: ${formattedProfit}`;
            metricsTextEl.className = 'sem-red-text';
          }
        }
        
        // Calculate risk
        const negPct = filtered.length > 0 ? (metrics.negativeROIcount / filtered.length) * 100 : 0;
        let riskLevel = 'Low';
        let riskClass = 'badge green';
        if (negPct > 40) {
          riskLevel = 'High';
          riskClass = 'badge red';
        } else if (negPct > 20) {
          riskLevel = 'Medium';
          riskClass = 'badge orange';
        }
        
        const riskBadgeEl = document.getElementById('fsb-risk-badge');
        if (riskBadgeEl) {
          riskBadgeEl.textContent = `${riskLevel} Risk`;
          riskBadgeEl.className = riskClass;
        }
      }
    } else {
      if (counterEl) {
        counterEl.textContent = `Showing ${campaignData.length} of ${campaignData.length} Campaigns`;
      }
      if (statusBanner) {
        statusBanner.style.display = 'none';
      }
    }

    // Update KPI Card Filtered State Badges
    const filterBadgeText = activeFilters.map(f => {
      const parts = f.split(' = ');
      return parts[1] || parts[0];
    }).join(' + ');
    
    const kpiBadges = document.querySelectorAll('.kpi-filter-badge');
    kpiBadges.forEach(badge => {
      if (activeFilters.length > 0) {
        badge.style.display = 'flex';
        const descEl = badge.querySelector('.kfb-desc');
        if (descEl) descEl.textContent = filterBadgeText;
      } else {
        badge.style.display = 'none';
      }
    });
  } catch (bannerErr) {
    console.error("Filter status banner update failed:", bannerErr);
  }

  // Step 4: Render Executive Panels
  logDebug('Render Executive Panels', 'info', 'Rendering KPIs, executive panels, and action summaries...');
  
  // KPI Rendering Section
  try {
    updateKPIs(metrics, filtered.length, filtered);
    logDebug('Render KPIs', 'success');
  } catch (error) {
    console.error("KPI Section Failed:", error);
    logDebug('Render KPIs', 'fail', error.message);
    showKPIFallback(error.message);
  }
  
  // Page 1 Executive Panel (Secondary KPIs / widgets)
  safeExecute('Render Page 1 Executive Panel', () => {
    updatePage1ExecutivePanel(metrics, filtered);
  });

  // Insights Summary
  safeExecute('Render Insights Summary', () => {
    updateInsights(metrics, filtered);
  });

  // Funnel Section
  try {
    buildFunnel(metrics);
    logDebug('Render Funnel Leakage', 'success');
  } catch (error) {
    console.error("Funnel Section Failed:", error);
    logDebug('Render Funnel Leakage', 'fail', error.message);
  }

  // Tables Section: Performance Heatmap
  try {
    buildHeatmap(filtered);
    logDebug('Render Performance Heatmap', 'success');
  } catch (error) {
    console.error("Heatmap Table Failed:", error);
    console.error("Tables Section Failed:", error);
    logDebug('Render Performance Heatmap', 'fail', error.message);
    showHeatmapFallback(error.message);
  }

  // Tables Section: Loss Campaigns List
  try {
    buildBottomTable(filtered);
    logDebug('Render Loss Campaigns List', 'success');
  } catch (error) {
    console.error("Campaigns Table Failed:", error);
    console.error("Tables Section Failed:", error);
    logDebug('Render Loss Campaigns List', 'fail', error.message);
    showBottomTableFallback(error.message);
  }

  // Executive Strategy Page (contains Forecasting & Recommendations)
  safeExecute('Render Executive Strategy Page', () => {
    updateExecutiveStrategy(metrics, filtered);
  });
  
  DIAGNOSTICS.panelsRendered = !DIAGNOSTICS.errors.some(e => e.includes('KPI') || e.includes('Panel') || e.includes('Insights') || e.includes('Funnel') || e.includes('Heatmap'));

  // Step 5: Render Visualizations (Charts Section)
  logDebug('Render Visualizations', 'info', 'Drawing charts...');
  try {
    buildCharts(filtered);
  } catch (error) {
    console.error("Charts Section Failed:", error);
  }
}

function showEmptyState(isEmpty) {
  const emptyStateEl = document.getElementById('empty-state-container');
  if (isEmpty) {
    if (!emptyStateEl) {
      const container = document.createElement('div');
      container.id = 'empty-state-container';
      container.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(255, 255, 255, 0.9);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
      `;
      container.innerHTML = `
        <div style="background:#fff; padding:40px; border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); text-align:center; max-width:400px; font-family:system-ui, sans-serif;">
          <div style="font-size:48px; margin-bottom:15px;">🔍</div>
          <h2 style="margin:0 0 10px 0; color:#003366;">No Campaigns Found</h2>
          <p style="color:#526F80; margin:0 0 20px 0; font-size:14px; line-height:1.5;">No campaigns match your active filter settings. Try resetting filters.</p>
          <button onclick="resetAll()" style="background:#FF6B00; color:#fff; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:14px; transition: background 0.2s;">Clear Filters & Return to Dashboard</button>
        </div>
      `;
      document.body.appendChild(container);
    }
  } else {
    if (emptyStateEl) {
      emptyStateEl.remove();
    }
  }
}

function computeMetrics(filtered) {
  let spend = 0, revenue = 0, conversions = 0, leads = 0, impressions = 0, clicks = 0;
  let negativeROIcount = 0;
  let negativeROISpend = 0;

  filtered.forEach(c => {
    spend += c.Marketing_Spend;
    revenue += c.Revenue_Generated;
    conversions += c.Conversions;
    leads += c.Leads_Generated;
    impressions += c.Impressions;
    clicks += c.Clicks;
    if (c["ROI_%"] < 0) {
      negativeROIcount++;
      negativeROISpend += (c.Marketing_Spend - c.Revenue_Generated);
    }
  });

  const overallROI = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
  const avgCTR = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const avgConvRate = leads > 0 ? (conversions / leads) * 100 : 0;
  const avgCPC = clicks > 0 ? spend / clicks : 0;
  const avgCPM = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const avgCAC = conversions > 0 ? spend / conversions : 0;

  return {
    spend, revenue, conversions, leads, impressions, clicks,
    negativeROIcount, negativeROISpend, overallROI,
    avgCTR, avgConvRate, avgCPC, avgCPM, avgCAC
  };
}

function formatKpiContext(targetVal, currentVal, isLowerBetter = false, formatType = 'money') {
  let gap = currentVal - targetVal;
  let gapStr = '';
  let status = 'On Track';
  let statusClass = 'roi-pos';
  
  if (isLowerBetter) {
    status = currentVal <= targetVal ? 'On Track' : 'Risk';
    statusClass = currentVal <= targetVal ? 'roi-pos' : 'roi-neg';
  } else {
    status = currentVal >= targetVal ? 'On Track' : 'Risk';
    statusClass = currentVal >= targetVal ? 'roi-pos' : 'roi-neg';
  }

  if (formatType === 'money') {
    gapStr = (gap >= 0 ? '+' : '-') + fmt(Math.abs(gap));
  } else if (formatType === 'pct') {
    gapStr = (gap >= 0 ? '+' : '-') + Math.abs(gap).toFixed(2) + '%';
  } else if (formatType === 'count') {
    gapStr = (gap >= 0 ? '+' : '-') + Math.abs(gap);
  }
  
  const targetLabel = formatType === 'money' ? fmt(targetVal) : (formatType === 'pct' ? targetVal + '%' : targetVal);
  return `Target: ${isLowerBetter ? '≤ ' : '≥ '}${targetLabel} &nbsp;|&nbsp; Gap: ${gapStr} &nbsp;|&nbsp; <span class="${statusClass}">${status}</span>`;
}

function updateKPIs(m, count, filtered) {
  // Header Status Panel
  const profit = m.revenue - m.spend;
  setElText('h-rev-val', fmt(m.revenue));
  setElText('h-profit-val', fmt(profit));
  setElText('h-roi-val', `${m.overallROI.toFixed(1)}%`);
  
  const hRoiValEl = document.getElementById('h-roi-val');
  if (hRoiValEl) {
    if (m.overallROI >= 200) {
      hRoiValEl.className = 'sem-green';
    } else if (m.overallROI >= 100) {
      hRoiValEl.className = 'sem-orange';
    } else {
      hRoiValEl.className = 'sem-red';
    }
  }

  // Risk level calculation based on negPct
  const negPct = count > 0 ? (m.negativeROIcount / count) * 100 : 0;
  let riskLevel = 'Low';
  let riskClass = 'sem-green';
  if (negPct > 40) {
    riskLevel = 'High';
    riskClass = 'sem-red';
  } else if (negPct > 20) {
    riskLevel = 'Medium';
    riskClass = 'sem-orange';
  }
  setElText('h-risk-val', riskLevel);
  const hRiskValEl = document.getElementById('h-risk-val');
  if (hRiskValEl) {
    hRiskValEl.className = riskClass;
  }

  // Page 1
  setElText('kpi-spend', fmt(m.spend));
  setElHtml('kpi-spend-sub', formatKpiContext(4000000, m.spend, true, 'money'));
  const spendEl = document.getElementById('kpi-spend');
  if (spendEl) {
    const spendParent = spendEl.closest('.kpi');
    if (spendParent) {
      spendParent.className = m.spend <= 4000000 ? 'kpi kgreen kpi-secondary' : 'kpi kred kpi-secondary';
    }
  }

  setElText('kpi-revenue', fmt(m.revenue));
  setElHtml('kpi-revenue-sub', formatKpiContext(11000000, m.revenue, false, 'money'));
  const revEl = document.getElementById('kpi-revenue');
  if (revEl) {
    const revParent = revEl.closest('.kpi');
    if (revParent) {
      revParent.className = m.revenue >= 11000000 ? 'kpi kgreen kpi-hero' : 'kpi kred kpi-hero';
    }
  }

  // Net Profit Card
  setElText('kpi-profit', fmt(profit));
  setElHtml('kpi-profit-sub', formatKpiContext(8000000, profit, false, 'money'));
  const profitEl = document.getElementById('kpi-profit');
  if (profitEl) {
    const profitParent = profitEl.closest('.kpi');
    if (profitParent) {
      profitParent.className = profit >= 8000000 ? 'kpi kgreen kpi-hero' : 'kpi kred kpi-hero';
    }
  }

  // ROI
  setElText('kpi-roi', `${m.overallROI.toFixed(1)}%`);
  setElHtml('kpi-roi-sub', formatKpiContext(200, m.overallROI, false, 'pct'));
  const roiEl = document.getElementById('kpi-roi');
  if (roiEl) {
    const roiParent = roiEl.closest('.kpi');
    if (roiParent) {
      roiParent.className = m.overallROI >= 200 ? 'kpi kgreen kpi-hero' : 'kpi kred kpi-hero';
    }
  }

  // Negative ROI Campaigns
  setElText('kpi-neg-campaigns', `${m.negativeROIcount} / ${count}`);
  setElHtml('kpi-neg-campaigns-sub', formatKpiContext(0, m.negativeROIcount, true, 'count'));
  const negCampEl = document.getElementById('kpi-neg-campaigns');
  if (negCampEl) {
    const negParent = negCampEl.closest('.kpi');
    if (negParent) {
      negParent.className = m.negativeROIcount === 0 ? 'kpi kgreen kpi-secondary kpi-risk-card' : 'kpi kred kpi-secondary kpi-risk-card';
    }
  }

  // Page 2
  const regionsList = ['Asia Pacific', 'Latin America', 'Europe', 'Middle East & Africa', 'North America'];
  let bestRegion = 'N/A', bestRegROI = -Infinity;
  let worstRegion = 'N/A', worstRegROI = Infinity;

  regionsList.forEach(r => {
    const regCamps = filtered.filter(c => c.Region === r);
    const regSpend = regCamps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const regRev = regCamps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const regROI = regSpend > 0 ? ((regRev - regSpend) / regSpend) * 100 : 0;
    if (regSpend > 0) {
      if (regROI > bestRegROI) { bestRegion = r; bestRegROI = regROI; }
      if (regROI < worstRegROI) { worstRegion = r; worstRegROI = regROI; }
    }
  });

  setElText('kpi-best-region', bestRegion);
  setElText('kpi-best-region-sub', bestRegion !== 'N/A' ? `↑ ${bestRegROI.toFixed(1)}% ROI` : 'N/A');
  
  setElText('kpi-worst-region', worstRegion);
  setElText('kpi-worst-region-sub', worstRegion !== 'N/A' ? `↓ ${worstRegROI.toFixed(1)}% ROI` : 'N/A');
  const worstRegEl = document.getElementById('kpi-worst-region');
  if (worstRegEl) {
    const worstRegParent = worstRegEl.closest('.kpi');
    if (worstRegParent) {
      worstRegParent.className = worstRegROI < 0 ? 'kpi kred' : 'kpi kamber';
    }
  }

  const segmentsList = ['45-54', '35-44', '25-34', '55+', '18-24'];
  let bestAudience = 'N/A', bestAudROI = -Infinity;
  segmentsList.forEach(s => {
    const audCamps = filtered.filter(c => c.Audience_Segment === s);
    const audSpend = audCamps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
    const audRev = audCamps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
    const audROI = audSpend > 0 ? ((audRev - audSpend) / audSpend) * 100 : 0;
    if (audSpend > 0 && audROI > bestAudROI) {
      bestAudience = s + ' Age Group';
      bestAudROI = audROI;
    }
  });

  setElText('kpi-best-audience', bestAudience);
  setElText('kpi-best-audience-sub', bestAudience !== 'N/A' ? `↑ ${bestAudROI.toFixed(1)}% ROI` : 'N/A');

  setElText('kpi-avg-cac', `₹${m.avgCAC.toFixed(2)}`);
  const cacEl = document.getElementById('kpi-avg-cac');
  if (cacEl) {
    const cacParent = cacEl.closest('.kpi');
    if (cacParent) {
      cacParent.className = m.avgCAC <= 150 ? 'kpi kgreen' : 'kpi kred';
    }
    setElHtml('kpi-avg-cac-sub', formatKpiContext(150, m.avgCAC, true, 'money'));
  }

  // Page 3
  setElText('kpi-ctr', `${m.avgCTR.toFixed(2)}%`);
  const ctrEl = document.getElementById('kpi-ctr');
  if (ctrEl) {
    const ctrParent = ctrEl.closest('.kpi');
    if (ctrParent) {
      ctrParent.className = m.avgCTR >= 3.0 ? 'kpi kgreen' : 'kpi kred';
    }
    setElHtml('kpi-ctr-sub', formatKpiContext(3.0, m.avgCTR, false, 'pct'));
  }

  setElText('kpi-cpc', `₹${m.avgCPC.toFixed(2)}`);
  const cpcEl = document.getElementById('kpi-cpc');
  if (cpcEl) {
    const cpcParent = cpcEl.closest('.kpi');
    if (cpcParent) {
      cpcParent.className = m.avgCPC <= 2.50 ? 'kpi kgreen' : 'kpi kred';
    }
    setElHtml('kpi-cpc-sub', formatKpiContext(2.50, m.avgCPC, true, 'money'));
  }

  setElText('kpi-cpm', `₹${m.avgCPM.toFixed(2)}`);
  const cpmEl = document.getElementById('kpi-cpm');
  if (cpmEl) {
    const cpmParent = cpmEl.closest('.kpi');
    if (cpmParent) {
      cpmParent.className = m.avgCPM <= 75.00 ? 'kpi kgreen' : 'kpi kred';
    }
    setElHtml('kpi-cpm-sub', formatKpiContext(75.00, m.avgCPM, true, 'money'));
  }

  setElText('kpi-convrate', `${m.avgConvRate.toFixed(2)}%`);
  const convrateEl = document.getElementById('kpi-convrate');
  if (convrateEl) {
    const convrateParent = convrateEl.closest('.kpi');
    if (convrateParent) {
      convrateParent.className = m.avgConvRate >= 15.00 ? 'kpi kgreen' : 'kpi kred';
    }
    setElHtml('kpi-convrate-sub', formatKpiContext(15.00, m.avgConvRate, false, 'pct'));
  }
}

function updatePage1ExecutivePanel(m, filtered) {
  const count = filtered.length;
  if (count === 0) return;

  // 1. Risk
  const riskText = m.negativeROIcount > 0 
    ? `Pause or redesign ${m.negativeROIcount} campaigns immediately to prevent ${fmt(m.negativeROISpend)} in net losses.`
    : `No campaign risk detected. Maintain current high-performing strategy.`;
  setElText('p1-insight-risk', riskText);

  // 2. Opportunity
  const platforms = ['Instagram', 'Facebook', 'Google Ads', 'YouTube', 'LinkedIn', 'Email'];
  let bestPlat = 'N/A', bestPlatROI = -Infinity;
  platforms.forEach(p => {
    const camps = filtered.filter(c => c.Platform === p);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    if (spend > 0 && roi > bestPlatROI) {
      bestPlat = p;
      bestPlatROI = roi;
    }
  });

  const oppText = bestPlat !== 'N/A'
    ? `Scale spend on ${bestPlat} immediately to leverage its high ${bestPlatROI.toFixed(0)}% ROI.`
    : `No clear platform opportunity detected under current filters.`;
  setElText('p1-insight-opportunity', oppText);

  // 3. Recommended Action
  const campTypes = ['Retention', 'Conversion', 'Consideration', 'Seasonal', 'Awareness'];
  const typeROIs = campTypes.map(t => {
    const camps = filtered.filter(c => c.Campaign_Type === t);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    return { type: t, roi, spend };
  }).filter(t => t.spend > 0);

  let actionText = '';
  if (typeROIs.length >= 2) {
    typeROIs.sort((a,b) => b.roi - a.roi);
    const best = typeROIs[0];
    const worst = typeROIs[typeROIs.length - 1];
    const shiftAmount = worst.spend * 0.20;
    const lift = shiftAmount * (best.roi - worst.roi) / 100;
    actionText = `Pause worst-performing campaigns and reallocate ${fmt(shiftAmount)} from ${worst.type} to ${best.type} campaigns for an expected revenue lift of +${fmt(lift)}.`;
  } else {
    actionText = `Optimize spend and targeting across segments to improve campaign efficiency.`;
  }
  setElText('p1-insight-action', actionText);
}

function updateInsights(m, filtered) {
  const count = filtered.length;
  if (count === 0) return;

  // 1. Regional and Segment Metrics for Page 2 Insights
  const regions = ['Asia Pacific', 'Latin America', 'Europe', 'Middle East & Africa', 'North America'];
  const regionROIs = regions.map(r => {
    const camps = filtered.filter(c => c.Region === r);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    return { region: r, roi, spend };
  }).filter(r => r.spend > 0);

  const segments = ['45-54', '35-44', '25-34', '55+', '18-24'];
  const segCACs = segments.map(s => {
    const camps = filtered.filter(c => c.Audience_Segment === s);
    const spend = camps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
    const convs = camps.reduce((sum, c) => sum + c.Conversions, 0);
    const cac = convs > 0 ? spend / convs : 0;
    return { segment: s, cac, convs };
  }).filter(s => s.convs > 0);

  // Page 2: Strategic Audience Insights Card population
  const segmentsList = ['45-54', '35-44', '25-34', '55+', '18-24'];
  const segmentMetrics = segmentsList.map(s => {
    const camps = filtered.filter(c => c.Audience_Segment === s);
    const spend = camps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
    const rev = camps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
    const profit = rev - spend;
    const roi = spend > 0 ? (profit / spend) * 100 : 0;
    return { segment: s, rev, profit, roi, spend };
  }).filter(s => s.spend > 0);

  let revLeader = null, profitLeader = null;
  if (segmentMetrics.length > 0) {
    // Revenue Leader
    segmentMetrics.sort((a,b) => b.rev - a.rev);
    revLeader = segmentMetrics[0];
    setElText('p2-rev-leader-title', `${revLeader.segment} Age Group`);
    setElHtml('p2-rev-leader-desc', `Generates <strong>${fmt(revLeader.rev)}</strong> in revenue (ROI: <strong>${revLeader.roi.toFixed(0)}%</strong>). Scale this segment for aggressive top-line revenue growth.`);

    // Profit Leader
    segmentMetrics.sort((a,b) => b.profit - a.profit);
    profitLeader = segmentMetrics[0];
    setElText('p2-profit-leader-title', `${profitLeader.segment} Age Group`);
    setElHtml('p2-profit-leader-desc', `Generates <strong>${fmt(profitLeader.profit)}</strong> in net profit (ROI: <strong>${profitLeader.roi.toFixed(0)}%</strong>). Scale this segment for bottom-line profit optimization.`);
  }

  // Expected Impact Card on Page 2
  const p2CostSavings = m.negativeROISpend;
  
  // Calculate budget reallocation lift
  let p2ReallocLift = 0;
  const p2Plats = ['Instagram', 'Facebook', 'Google Ads', 'YouTube', 'LinkedIn', 'Email'];
  const p2PlatMetrics = p2Plats.map(p => {
    const camps = filtered.filter(c => c.Platform === p);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    return { platform: p, spend, roi };
  }).filter(p => p.spend > 0);
  
  if (p2PlatMetrics.length >= 2) {
    p2PlatMetrics.sort((a,b) => b.roi - a.roi);
    const best = p2PlatMetrics[0];
    const worst = p2PlatMetrics[p2PlatMetrics.length - 1];
    const shiftAmt = worst.spend * 0.20;
    p2ReallocLift = shiftAmt * (best.roi - worst.roi) / 100;
  }
  
  const p2TotalProfitGain = p2CostSavings + p2ReallocLift;
  const p2RevGainPct = m.revenue > 0 ? (p2ReallocLift / m.revenue) * 100 : 0;
  const p2RoiLift = m.spend > 0 ? (p2TotalProfitGain / m.spend) * 100 : 0;
  const p2Profit = m.revenue - m.spend;
  const p2ProfitIncreasePct = p2Profit > 0 ? (p2TotalProfitGain / p2Profit) * 100 : 0;

  // CAC reduction
  const p2Worst10 = [...filtered].sort((a, b) => a["ROI_%"] - b["ROI_%"]).slice(0, 10);
  const p2Worst10Spend = p2Worst10.reduce((sum, c) => sum + c.Marketing_Spend, 0);
  const p2Worst10Convs = p2Worst10.reduce((sum, c) => sum + c.Conversions, 0);
  const p2NewCAC = (m.conversions - p2Worst10Convs) > 0 ? (m.spend - p2Worst10Spend) / (m.conversions - p2Worst10Convs) : m.avgCAC;
  const p2CacReductionPct = m.avgCAC > 0 ? ((m.avgCAC - p2NewCAC) / m.avgCAC) * 100 : 0;

  setElText('p2-impact-rev', `+${p2RevGainPct.toFixed(1)}%`);
  setElText('p2-impact-roi', `+${p2RoiLift.toFixed(1)}%`);
  setElText('p2-impact-cac', `-${Math.abs(p2CacReductionPct).toFixed(1)}%`);
  setElText('p2-impact-profit', `+${p2ProfitIncreasePct.toFixed(1)}%`);

  // Write Page 2 Bottom Key Insights
  if (regionROIs.length > 0 && segCACs.length > 0) {
    regionROIs.sort((a, b) => a.roi - b.roi); // Sort ascending
    const worstReg = regionROIs[0];
    const bestReg = regionROIs[regionROIs.length - 1];
    
    segCACs.sort((a, b) => b.cac - a.cac); // Sort descending
    const worstSeg = segCACs[0];
    
    // Risk
    const p2RiskText = worstReg.roi < 0
      ? `Reduce ${worstReg.region} spend immediately to prevent further losses (ROI: ${worstReg.roi.toFixed(1)}%). Reduce acquisition focus on ${worstSeg.segment} segment due to high CAC (${fmt(worstSeg.cac)}).`
      : `Reduce acquisition focus on ${worstSeg.segment} segment immediately due to high CAC (${fmt(worstSeg.cac)}). Monitor ${worstReg.region} as lowest performing region (ROI: ${worstReg.roi.toFixed(1)}%).`;
    setElText('p2-insight-risk', p2RiskText);

    // Opportunity
    const p2OppText = `Reallocate lower-performing regional budgets to ${bestReg.region} immediately to capture high ${bestReg.roi.toFixed(0)}% ROI. Scale profit-optimized segments to increase overall margin.`;
    setElText('p2-insight-opportunity', p2OppText);

    // Recommended Action
    const p2ActionText = `Reallocate 20% budget to ${bestReg.region} and high-performing segments to achieve expected metrics: +${p2RevGainPct.toFixed(1)}% Revenue, +${p2RoiLift.toFixed(1)}% ROI, and +${p2ProfitIncreasePct.toFixed(1)}% Profit.`;
    setElText('p2-insight-action', p2ActionText);
  } else {
    setElText('p2-insight-risk', `No regional or audience performance risk detected.`);
    setElText('p2-insight-opportunity', `No clear regional or audience opportunities under current filters.`);
    setElText('p2-insight-action', `Optimize regional and segment allocations dynamically.`);
  }

  // 2. Campaign Metrics for Page 3 Insights
  const campTypes = ['Retention', 'Conversion', 'Consideration', 'Seasonal', 'Awareness'];
  const typeROIs = campTypes.map(t => {
    const camps = filtered.filter(c => c.Campaign_Type === t);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    return { type: t, roi, spend };
  }).filter(t => t.spend > 0);

  const worst10 = [...filtered].sort((a, b) => a["ROI_%"] - b["ROI_%"]).slice(0, 10);
  const netLoss = worst10.reduce((sum, c) => sum + Math.max(0, c.Marketing_Spend - c.Revenue_Generated), 0);

  // Write Page 3 Bottom Key Insights
  if (typeROIs.length > 0) {
    typeROIs.sort((a, b) => a.roi - b.roi); // Sort ascending
    const worstType = typeROIs[0];
    const bestType = typeROIs[typeROIs.length - 1];
    
    const ctrLeakage = m.spend * (1 - (m.conversions / (m.clicks || 1)));
    const ctrTerm = Math.min(1, m.avgCTR / 3.5) * 30;
    const leadTerm = Math.min(1, (m.clicks > 0 ? (m.leads / m.clicks) : 0) / 0.1) * 30;
    const convTerm = Math.min(1, m.avgConvRate / 25) * 40;
    const fScore = Math.round(ctrTerm + leadTerm + convTerm);

    // Risk
    const p3RiskText = `Pause or redesign ${worstType.type} campaigns immediately due to low ${worstType.roi.toFixed(0)}% ROI. Address funnel leakage to recover estimated ${fmt(ctrLeakage)} in lost efficiency.`;
    setElText('p3-insight-risk', p3RiskText);

    // Opportunity
    const p3OppText = `Optimize creatives and targeting to improve conversion efficiency. Scale ${bestType.type} campaigns (${bestType.roi.toFixed(0)}% ROI) to maximize yield.`;
    setElText('p3-insight-opportunity', p3OppText);

    // Recommended Action
    const p3ActionText = `Pause the worst-performing campaigns to prevent net losses and save up to ${fmt(netLoss)} immediately. This yields an estimated portfolio efficiency score of ${fScore}%.`;
    setElText('p3-insight-action', p3ActionText);
  } else {
    setElText('p3-insight-risk', `No campaign performance risk detected.`);
    setElText('p3-insight-opportunity', `No clear campaign funnel opportunities under current filters.`);
    setElText('p3-insight-action', `Optimize campaign structures and creatives to lower leakage.`);
  }
}

function buildFunnel(m) {
  const el = document.getElementById('funnel-viz');
  el.innerHTML = '';
  const maxW = 420;

  const funnelStages = [
    { label: 'Impressions', value: m.impressions, pct: 100, color: NAV },
    { label: 'Clicks', value: m.clicks, pct: m.impressions > 0 ? (m.clicks / m.impressions * 100) : 0, color: BLU, fromPrev: true },
    { label: 'Leads', value: m.leads, pct: m.clicks > 0 ? (m.leads / m.clicks * 100) : 0, color: ORA, fromPrev: true },
    { label: 'Conversions', value: m.conversions, pct: m.leads > 0 ? (m.conversions / m.leads * 100) : 0, color: GRN, fromPrev: true }
  ];

  funnelStages.forEach((f, i) => {
    const widthPct = i === 0 ? 100 : (m.impressions > 0 ? (f.value / m.impressions * 100) : 0);
    const w = Math.max(widthPct, 78);
    const row = document.createElement('div');
    row.className = 'fstage';
    row.innerHTML = `
      <div class="flabel">${f.label}</div>
      <div class="fbar-vis" style="width:${w}%; max-width:${maxW}px; background:${f.color};">${f.value.toLocaleString('en-IN')}</div>
      ${f.fromPrev ? `<span class="fdrop">${f.pct.toFixed(2)}%</span>` : ''}
    `;
    el.appendChild(row);
  });

  // Calculate dynamic funnel metrics
  const ctrTerm = Math.min(1, m.avgCTR / 3.5) * 30;
  const leadTerm = Math.min(1, (m.clicks > 0 ? (m.leads / m.clicks) : 0) / 0.1) * 30;
  const convTerm = Math.min(1, m.avgConvRate / 25) * 40;
  const funnelScore = Math.round(ctrTerm + leadTerm + convTerm);

  const leakage = m.spend * (1 - (m.conversions / (m.clicks || 1)));

  const targetConvs = m.leads * 0.25;
  const lostConvs = Math.max(0, targetConvs - m.conversions);
  const avgRevPerConv = m.conversions > 0 ? (m.revenue / m.conversions) : 0;
  const lostOpp = lostConvs * avgRevPerConv;

  document.getElementById('funnel-efficiency').textContent = `${funnelScore}%`;
  document.getElementById('funnel-leakage').textContent = fmt(leakage);
  document.getElementById('funnel-lost-opp').textContent = fmt(lostOpp);
}

function toggleHeatmap(metric, button) {
  currentHeatmapMetric = metric;
  document.querySelectorAll('.ht-toggle').forEach(btn => btn.classList.remove('active'));
  if (button) button.classList.add('active');
  buildHeatmap(currentFilteredData);
}

function buildHeatmap(filtered) {
  const tbody = document.getElementById('hm-body');
  tbody.innerHTML = '';
  const regions = ['Asia Pacific', 'Latin America', 'Europe', 'Middle East & Africa', 'North America'];
  const platforms = ['Email', 'Facebook', 'Google Ads', 'Instagram', 'LinkedIn', 'YouTube'];

  // 1. Calculate Region Level metrics for sorting
  const regionMetrics = regions.map(r => {
    const cellCamps = filtered.filter(c => c.Region === r);
    const spend = cellCamps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
    const rev = cellCamps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    const profit = rev - spend;
    
    let val = 0;
    if (currentHeatmapMetric === 'roi') val = roi;
    else if (currentHeatmapMetric === 'revenue') val = rev;
    else if (currentHeatmapMetric === 'profit') val = profit;
    else if (currentHeatmapMetric === 'spend') val = spend;
    
    return { region: r, val, spend, rev, roi, profit };
  });

  // Sort regions descending by current metric value to Rank them #1 to #5
  regionMetrics.sort((a, b) => b.val - a.val);

  // 2. Calculate platform summaries for executive insights chips
  let bestRegionName = 'N/A', worstRegionName = 'N/A';
  let bestRegionROI = -Infinity, worstRegionROI = Infinity;
  let bestPlatName = 'N/A', bestPlatROI = -Infinity;

  regionMetrics.forEach(rm => {
    if (rm.spend > 0) {
      if (rm.roi > bestRegionROI) { bestRegionName = rm.region; bestRegionROI = rm.roi; }
      if (rm.roi < worstRegionROI) { worstRegionName = rm.region; worstRegionROI = rm.roi; }
    }
  });

  platforms.forEach(p => {
    const camps = filtered.filter(c => c.Platform === p);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    if (spend > 0 && roi > bestPlatROI) {
      bestPlatName = p;
      bestPlatROI = roi;
    }
  });

  let highestComboName = 'N/A';
  let highestComboRev = -1;
  regions.forEach(r => {
    platforms.forEach(p => {
      const camps = filtered.filter(c => c.Region === r && c.Platform === p);
      const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
      if (rev > highestComboRev) {
        highestComboName = `${r} × ${p}`;
        highestComboRev = rev;
      }
    });
  });

  const insightsBar = document.getElementById('matrix-insights');
  if (insightsBar) {
    insightsBar.innerHTML = `
      <div class="insight-chip growth">🏆 <strong>Best Region:</strong> ${bestRegionName} (${bestRegionROI.toFixed(0)}% ROI)</div>
      <div class="insight-chip growth">🏆 <strong>Best Platform:</strong> ${bestPlatName} (${bestPlatROI.toFixed(0)}% ROI)</div>
      <div class="insight-chip risk">⚠ <strong>Worst Region:</strong> ${worstRegionName} (${worstRegionROI.toFixed(0)}% ROI)</div>
      <div class="insight-chip info">💰 <strong>Highest Revenue:</strong> ${highestComboName} (${fmt(highestComboRev)})</div>
    `;
  }

  // 3. Find ROI values of all active combinations for top 3 and bottom 3 highlights
  const activeCells = [];
  let maxVal = 1;
  regionMetrics.forEach(rm => {
    platforms.forEach(p => {
      const cellCamps = filtered.filter(c => c.Region === rm.region && c.Platform === p);
      if (cellCamps.length === 0) return;
      const spend = cellCamps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
      const rev = cellCamps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
      const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
      const profit = rev - spend;
      
      let val = 0;
      if (currentHeatmapMetric === 'roi') val = roi;
      else if (currentHeatmapMetric === 'revenue') val = rev;
      else if (currentHeatmapMetric === 'profit') val = profit;
      else if (currentHeatmapMetric === 'spend') val = spend;
      
      activeCells.push({ region: rm.region, platform: p, roi, val });
      if (Math.abs(val) > maxVal) maxVal = Math.abs(val);
    });
  });

  // Sort active cells by ROI descending
  const sortedByROI = [...activeCells].sort((a, b) => b.roi - a.roi);

  // 4. Render rows with stickiness, color bands, N/A replacements, and highlights
  regionMetrics.forEach((rm, idx) => {
    let cells = '';
    const rank = idx + 1;
    
    platforms.forEach(p => {
      const cellCamps = filtered.filter(c => c.Region === rm.region && c.Platform === p);
      
      if (cellCamps.length === 0) {
        let naText = 'Not Active';
        if (currentHeatmapMetric === 'spend') naText = 'No Spend';
        else if (currentHeatmapMetric === 'revenue') naText = 'No Campaigns';
        
        cells += `<td style="background:#F1F5F9; color:var(--muted); font-size:10px;"><span class="badge gray" style="background:#E2E8F0; color:#4A5568; padding:3px 6px; font-size:9px;" title="No campaign activity recorded in this region-platform intersection.">${naText}</span></td>`;
        return;
      }
      
      const spend = cellCamps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
      const rev = cellCamps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
      const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
      const profit = rev - spend;

      let displayVal = '';
      let bg = '';
      let textCol = '#1C2D42';

      if (currentHeatmapMetric === 'roi') {
        displayVal = `${roi.toFixed(0)}%`;
        // High contrast performance bands
        if (roi < 0) {
          if (roi < -10) { bg = '#F8D7DA'; textCol = '#721C24'; }
          else { bg = '#FFF3CD'; textCol = '#856404'; }
        } else {
          if (roi >= 300) { bg = '#005A3C'; textCol = '#fff'; }
          else if (roi >= 150) { bg = '#00875A'; textCol = '#fff'; }
          else { bg = '#E6F4EA'; textCol = '#137333'; }
        }
      } else if (currentHeatmapMetric === 'revenue') {
        displayVal = fmt(rev);
        if (rev >= maxVal * 0.75) { bg = '#0747A6'; textCol = '#fff'; }
        else if (rev >= maxVal * 0.40) { bg = '#0052CC'; textCol = '#fff'; }
        else { bg = '#DEEBFF'; textCol = '#0747A6'; }
      } else if (currentHeatmapMetric === 'profit') {
        displayVal = fmt(profit);
        if (profit < 0) {
          if (profit < -100000) { bg = '#F8D7DA'; textCol = '#721C24'; }
          else { bg = '#FFF3CD'; textCol = '#856404'; }
        } else {
          if (profit >= maxVal * 0.75) { bg = '#005A3C'; textCol = '#fff'; }
          else if (profit >= maxVal * 0.40) { bg = '#00875A'; textCol = '#fff'; }
          else { bg = '#E6F4EA'; textCol = '#137333'; }
        }
      } else if (currentHeatmapMetric === 'spend') {
        displayVal = fmt(spend);
        if (spend >= maxVal * 0.75) { bg = '#C75200'; textCol = '#fff'; }
        else if (spend >= maxVal * 0.40) { bg = '#FF6B00'; textCol = '#fff'; }
        else { bg = '#FFE8D6'; textCol = '#A33C00'; }
      }

      let cellStyle = `background:${bg}; color:${textCol}; font-weight:600; font-size:12px;`;
      let cellContent = displayVal;

      // Apply Top 1 / Bottom 1 Highlights based on ROI Rank
      const cellRank = sortedByROI.findIndex(item => item.region === rm.region && item.platform === p);
      const len = sortedByROI.length;
      
      if (cellRank === 0) {
        cellStyle += `outline: 2px solid #FFD700; outline-offset: -2px; font-weight: 800;`;
        cellContent = `🏆 ${displayVal}`;
      } else if (cellRank === len - 1 && len > 1) {
        cellStyle += `outline: 2px solid var(--red); outline-offset: -2px; font-weight: 800;`;
        cellContent = `🚨 ${displayVal}`;
      }

      cells += `<td style="${cellStyle}">${cellContent}</td>`;
    });

    // Summary Column values & Action logic
    const regRoi = rm.roi;
    const regRev = rm.rev;
    const regProfit = rm.profit;

    // Dynamic Portfolio Classification status badges mapping regional ROI
    let statusText = 'Critical';
    let statusClass = 'badge red';
    if (regRoi <= 0) {
      statusText = 'Critical';
      statusClass = 'badge red';
    } else if (rm.region === 'Asia Pacific') {
      statusText = regRoi >= 150 ? 'Scale Leader' : 'Watchlist';
      statusClass = regRoi >= 150 ? 'badge green' : 'badge orange';
    } else if (rm.region === 'Latin America') {
      statusText = regRoi >= 100 ? 'Growth Leader' : 'badge green';
      statusClass = regRoi >= 100 ? 'badge green' : 'badge orange';
    } else if (rm.region === 'Europe') {
      statusText = regRoi >= 50 ? 'Stable' : 'Watchlist';
      statusClass = regRoi >= 50 ? 'badge blue' : 'badge orange';
    } else if (rm.region === 'Middle East & Africa') {
      statusText = 'Watchlist';
      statusClass = 'badge orange';
    } else {
      statusText = regRoi > 100 ? 'Stable' : 'Watchlist';
      statusClass = regRoi > 100 ? 'badge blue' : 'badge orange';
    }

    let actionText = 'Reduce Spend';
    let actionClass = 'badge red';
    if (regRoi > 300) { actionText = 'Scale'; actionClass = 'badge green'; }
    else if (regRoi > 150) { actionText = 'Expand'; actionClass = 'badge green'; }
    else if (regRoi > 0) { actionText = 'Optimize'; actionClass = 'badge orange'; }
    else if (regRoi >= -10) { actionText = 'Monitor'; actionClass = 'badge blue'; }

    const summaryCells = `
      <td style="background:#f8fafc; font-weight:700; color:var(--navy); border-left:2px solid var(--border);">${regRoi.toFixed(1)}%</td>
      <td style="background:#f8fafc; font-weight:700; color:var(--navy);">${fmt(regRev)}</td>
      <td style="background:#f8fafc; font-weight:700; color:var(--navy);">${fmt(regProfit)}</td>
      <td style="background:#f8fafc;"><span class="${statusClass}">${statusText}</span></td>
      <td style="background:#f8fafc;"><span class="${actionClass}">${actionText}</span></td>
    `;

    tbody.innerHTML += `<tr><td class="rl" style="position:sticky; left:0; z-index:2; background:#F8FAFC;">${rank}. ${rm.region}</td>${cells}${summaryCells}</tr>`;
  });

  // 5. Add platform summary rows at the bottom
  let roiCells = '';
  let revCells = '';
  let profitCells = '';
  let spendCells = '';
  
  platforms.forEach(p => {
    const camps = filtered.filter(c => c.Platform === p);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    const profit = rev - spend;
    
    roiCells += `<td>${spend > 0 ? roi.toFixed(0) + '%' : '0%'}</td>`;
    revCells += `<td>${fmt(rev)}</td>`;
    profitCells += `<td>${fmt(profit)}</td>`;
    spendCells += `<td>${fmt(spend)}</td>`;
  });

  const globalSpend = filtered.reduce((s, c) => s + c.Marketing_Spend, 0);
  const globalRev = filtered.reduce((s, c) => s + c.Revenue_Generated, 0);
  const globalROI = globalSpend > 0 ? ((globalRev - globalSpend) / globalSpend) * 100 : 0;
  const globalProfit = globalRev - globalSpend;

  const summaryRowsHtml = `
    <tr class="summary-row">
      <td class="rl" style="position: sticky; left: 0; z-index: 2;">Platform Avg ROI</td>
      ${roiCells}
      <td style="border-left:2px solid var(--border);">${globalROI.toFixed(1)}%</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>
    <tr class="summary-row">
      <td class="rl" style="position: sticky; left: 0; z-index: 2;">Platform Total Revenue</td>
      ${revCells}
      <td style="border-left:2px solid var(--border);">-</td>
      <td>${fmt(globalRev)}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>
    <tr class="summary-row">
      <td class="rl" style="position: sticky; left: 0; z-index: 2;">Platform Total Profit</td>
      ${profitCells}
      <td style="border-left:2px solid var(--border);">-</td>
      <td>-</td>
      <td>${fmt(globalProfit)}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>
    <tr class="summary-row">
      <td class="rl" style="position: sticky; left: 0; z-index: 2;">Platform Total Spend</td>
      ${spendCells}
      <td style="border-left:2px solid var(--border);">-</td>
      <td>-</td>
      <td>-</td>
      <td>${fmt(globalSpend)}</td>
      <td>-</td>
      <td>-</td>
    </tr>
  `;
  tbody.innerHTML += summaryRowsHtml;
}

function buildBottomTable(filtered) {
  const tbody = document.getElementById('bottom-table');
  tbody.innerHTML = '';
  
  const sortedWorst = [...filtered]
    .sort((a, b) => a["ROI_%"] - b["ROI_%"])
    .slice(0, 10);

  // Calculate dynamic pause summary values for negative ROI campaigns within the displayed worst campaigns
  const negativeWorst = sortedWorst.filter(c => c["ROI_%"] < 0);
  const totalLoss = negativeWorst.reduce((sum, c) => sum + Math.max(0, c.Marketing_Spend - c.Revenue_Generated), 0);
  
  const countValEl = document.getElementById('pause-count-val');
  const savingsValEl = document.getElementById('pause-savings-val');
  if (countValEl) countValEl.textContent = negativeWorst.length;
  if (savingsValEl) savingsValEl.textContent = fmt(totalLoss);

  sortedWorst.forEach(c => {
    const loss = Math.max(0, c.Marketing_Spend - c.Revenue_Generated);
    const lossRatio = c.Marketing_Spend > 0 ? (loss / c.Marketing_Spend) : 0;
    
    let actionBadge = '';
    const roi = c["ROI_%"];
    if (roi < -50) {
      actionBadge = '<span class="badge-pause">🔴 Pause</span>';
    } else if (roi < -20) {
      actionBadge = '<span class="badge-reduce">🟡 Reduce Spend</span>';
    } else if (roi < 0) {
      actionBadge = '<span class="badge-redesign">🟡 Redesign</span>';
    } else {
      actionBadge = '<span class="badge-monitor">🟢 Monitor</span>';
    }

    tbody.innerHTML += `
      <tr>
        <td>${c.Campaign_Name}</td>
        <td>${c.Platform}</td>
        <td class="num">${fmt(c.Marketing_Spend)}</td>
        <td class="num">${fmt(c.Revenue_Generated)}</td>
        <td class="num" style="font-weight:700; color:var(--red);">${loss > 0 ? fmt(loss) : '₹0'}</td>
        <td class="num" style="font-weight:600;">₹${lossRatio.toFixed(2)}</td>
        <td style="text-align:center;">${actionBadge}</td>
      </tr>
    `;
  });
}

function buildCharts(filtered) {
  killAll();
  DIAGNOSTICS.chartsRendered = 0;

  function roiColors(values) {
    return values.map(v => v < 0 ? RED : (v < 100 ? AMB : GRN));
  }

  function baseOpts(yFmt='money') {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: c => {
              const v = c.raw;
              if (yFmt === 'money') return (c.dataset.label || c.label) + ': ' + fmt(v);
              if (yFmt === 'pct') return (c.dataset.label || c.label) + ': ' + v.toFixed(1) + '%';
              return (c.dataset.label || c.label) + ': ' + v.toLocaleString('en-IN');
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            font: { size: 9 },
            callback: v => yFmt === 'money' ? fmt(v) : (yFmt === 'pct' ? v + '%' : v.toLocaleString('en-IN'))
          },
          grid: { color: '#EDF0F5' }
        },
        x: {
          ticks: { font: { size: 9 } },
          grid: { display: false }
        }
      }
    };
  }

  // 1. Platform Chart
  safeRender('Platform Chart', 'ch-platform', () => {
    const platforms = ['Instagram', 'Facebook', 'Google Ads', 'YouTube', 'LinkedIn', 'Email'];
    const platSpend = [], platRev = [], platROI = [];
    platforms.forEach(p => {
      const camps = filtered.filter(c => c.Platform === p);
      const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
      const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
      platSpend.push(spend);
      platRev.push(rev);
      platROI.push(spend > 0 ? ((rev - spend) / spend) * 100 : 0);
    });

    CHARTS.platform = new Chart(document.getElementById('ch-platform'), {
      type: 'bar',
      data: {
        labels: platforms,
        datasets: [
          { label: 'Revenue', data: platRev, backgroundColor: ORA, borderRadius: 3, yAxisID: 'y' },
          { label: 'ROI %', data: platROI, type: 'line', borderColor: GRN, backgroundColor: GRN, yAxisID: 'y2', tension: 0.3, pointRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { font: { size: 9 }, boxWidth: 10 } },
          tooltip: { callbacks: { label: c => c.dataset.label === 'ROI %' ? `ROI: ${c.raw.toFixed(1)}%` : `${c.dataset.label}: ${fmt(c.raw)}` } }
        },
        scales: {
          y: { type: 'linear', position: 'left', ticks: { callback: v => fmt(v), font: { size: 9 } }, grid: { color: '#EDF0F5' } },
          y2: { type: 'linear', position: 'right', ticks: { callback: v => v + '%', font: { size: 9 } }, grid: { display: false } },
          x: { ticks: { font: { size: 9 } }, grid: { display: false } }
        }
      }
    });
  });

  // 2. Campaign Type ROI Chart
  safeRender('Campaign Type Chart', 'ch-camptype', () => {
    const campTypes = ['Retention', 'Conversion', 'Consideration', 'Seasonal', 'Awareness'];
    const typeROIs = campTypes.map(t => {
      const camps = filtered.filter(c => c.Campaign_Type === t);
      const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
      const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
      return { type: t, roi: spend > 0 ? ((rev - spend) / spend) * 100 : 0, spend };
    });

    const roiValues = typeROIs.map(t => t.roi);

    // Compute best and worst campaign types based on active data
    const activeTypes = typeROIs.filter(t => t.spend > 0);
    if (activeTypes.length > 0) {
      activeTypes.sort((a,b) => b.roi - a.roi);
      const best = activeTypes[0];
      const worst = activeTypes[activeTypes.length - 1];
      const prioEl = document.getElementById('camptype-priorities');
      if (prioEl) {
        prioEl.innerHTML = `
          <div style="flex:1; min-width:140px; background:rgba(0,135,90,0.06); border:1px solid rgba(0,135,90,0.15); border-radius:6px; padding:6px 10px; font-size:11px; font-weight:600; color:var(--navy);">
            🏆 <strong>Best Performing Type:</strong> ${best.type} (${best.roi.toFixed(0)}% ROI)
          </div>
          <div style="flex:1; min-width:140px; background:rgba(220,53,69,0.06); border:1px solid rgba(220,53,69,0.15); border-radius:6px; padding:6px 10px; font-size:11px; font-weight:600; color:var(--navy);">
            ⚠ <strong>Worst Performing Type:</strong> ${worst.type} (${worst.roi.toFixed(0)}% ROI)
          </div>
        `;
      }
    } else {
      const prioEl = document.getElementById('camptype-priorities');
      if (prioEl) prioEl.innerHTML = '';
    }

    CHARTS.camptype = new Chart(document.getElementById('ch-camptype'), {
      type: 'bar',
      data: {
        labels: campTypes,
        datasets: [{ label: 'ROI %', data: roiValues, backgroundColor: roiColors(roiValues), borderRadius: 4 }]
      },
      options: { ...baseOpts('pct'), indexAxis: 'y' }
    });
  });

  // 3. Monthly Trends Chart
  safeRender('Monthly Trends Chart', 'ch-monthly', () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySpend = Array(12).fill(0);
    const monthlyRev = Array(12).fill(0);
    filtered.forEach(c => {
      if (c.Start_Date) {
        const mIdx = parseInt(c.Start_Date.split('-')[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          monthlySpend[mIdx] += c.Marketing_Spend;
          monthlyRev[mIdx] += c.Revenue_Generated;
        }
      }
    });

    const activeMonths = [];
    const activeSpend = [];
    const activeRev = [];
    for (let i = 0; i < 12; i++) {
      if (monthlySpend[i] > 0 || monthlyRev[i] > 0) {
        activeMonths.push(monthNames[i]);
        activeSpend.push(monthlySpend[i]);
        activeRev.push(monthlyRev[i]);
      }
    }

    const avgRev = activeRev.reduce((sum, r) => sum + r, 0) / (activeRev.length || 1);
    
    let peakIdx = -1, peakVal = -Infinity;
    let troughIdx = -1, troughVal = Infinity;
    for (let i = 0; i < activeRev.length; i++) {
      if (activeRev[i] > peakVal) {
        peakVal = activeRev[i];
        peakIdx = i;
      }
      if (activeRev[i] < troughVal) {
        troughVal = activeRev[i];
        troughIdx = i;
      }
    }

    const ptBg = [];
    const ptBorder = [];
    const ptRadius = [];
    const ptHoverRadius = [];
    for (let i = 0; i < activeRev.length; i++) {
      if (i === peakIdx) {
        ptBg.push(GRN);
        ptBorder.push('#fff');
        ptRadius.push(6);
        ptHoverRadius.push(8);
      } else if (i === troughIdx) {
        ptBg.push(RED);
        ptBorder.push('#fff');
        ptRadius.push(6);
        ptHoverRadius.push(8);
      } else {
        ptBg.push(ORA);
        ptBorder.push(ORA);
        ptRadius.push(3);
        ptHoverRadius.push(5);
      }
    }

    CHARTS.monthly = new Chart(document.getElementById('ch-monthly'), {
      type: 'line',
      data: {
        labels: activeMonths,
        datasets: [
          { label: 'Spend', data: activeSpend, borderColor: NAV, backgroundColor: 'rgba(0,51,102,0.06)', fill: true, tension: 0.4, pointRadius: 3 },
          { 
            label: 'Revenue', 
            data: activeRev, 
            borderColor: ORA, 
            backgroundColor: 'rgba(255,107,0,0.08)', 
            fill: true, 
            tension: 0.4, 
            pointBackgroundColor: ptBg,
            pointBorderColor: ptBorder,
            pointRadius: ptRadius,
            pointHoverRadius: ptHoverRadius
          },
          {
            label: 'Average Revenue',
            data: Array(activeRev.length).fill(avgRev),
            borderColor: '#8EAABF',
            borderDash: [6, 4],
            fill: false,
            pointRadius: 0,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { font: { size: 9 }, boxWidth: 10 } },
          tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmt(c.raw)}` } }
        },
        scales: {
          y: { ticks: { callback: v => fmt(v), font: { size: 9 } }, grid: { color: '#EDF0F5' } },
          x: { ticks: { font: { size: 9 } }, grid: { display: false } }
        }
      },
      plugins: [{
        id: 'peakTroughLabels',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          if (peakIdx !== -1) {
            const meta = chart.getDatasetMeta(1);
            if (meta && meta.data[peakIdx]) {
              const pt = meta.data[peakIdx];
              ctx.save();
              ctx.font = 'bold 9px Inter, sans-serif';
              ctx.fillStyle = '#00875A';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(`🏆 Peak: ${fmt(peakVal)}`, pt.x, pt.y - 8);
              ctx.restore();
            }
          }
          if (troughIdx !== -1) {
            const meta = chart.getDatasetMeta(1);
            if (meta && meta.data[troughIdx]) {
              const pt = meta.data[troughIdx];
              ctx.save();
              ctx.font = 'bold 9px Inter, sans-serif';
              ctx.fillStyle = '#D32F2F';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillText(`⚠ Trough: ${fmt(troughVal)}`, pt.x, pt.y + 8);
              ctx.restore();
            }
          }
        }
      }]
    });

    const insightMonthlyEl = document.querySelector('#ch-monthly').closest('.cc').querySelector('.ci');
    if (insightMonthlyEl) {
      if (activeRev.length > 0) {
        const peakM = activeMonths[peakIdx];
        const troughM = activeMonths[troughIdx];
        insightMonthlyEl.innerHTML = `💡 Peak performance in <strong>${peakM}</strong> (${fmt(peakVal)} revenue) vs Trough in <strong>${troughM}</strong> (${fmt(troughVal)}). Monthly average revenue is <strong>${fmt(avgRev)}</strong>.`;
      } else {
        insightMonthlyEl.textContent = `No active campaign data found.`;
      }
    }
  });

  // 4. Top 10 Revenue Campaigns
  safeRender('Top Campaigns Chart', 'ch-top10', () => {
    const top10 = [...filtered].sort((a, b) => b.Revenue_Generated - a.Revenue_Generated).slice(0, 10);
    const topNames = top10.map(c => c.Campaign_Name);
    const topRevs = top10.map(c => c.Revenue_Generated);
    const topProfits = top10.map(c => c.Revenue_Generated - c.Marketing_Spend);
    const topROIs = top10.map(c => c["ROI_%"]);

    CHARTS.top10 = new Chart(document.getElementById('ch-top10'), {
      type: 'bar',
      data: {
        labels: topNames,
        datasets: [
          { label: 'Revenue', data: topRevs, backgroundColor: BLU, borderRadius: 3, yAxisID: 'y' },
          { label: 'Profit', data: topProfits, backgroundColor: GRN, borderRadius: 3, yAxisID: 'y' },
          { label: 'ROI %', data: topROIs, type: 'line', borderColor: ORA, backgroundColor: ORA, yAxisID: 'y2', tension: 0.3, pointRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { font: { size: 9 }, boxWidth: 10 } },
          tooltip: {
            callbacks: {
              title: (items) => {
                if (items.length > 0) {
                  return topNames[items[0].dataIndex];
                }
                return '';
              },
              label: c => {
                if (c.dataset.label === 'ROI %') return `ROI: ${c.raw.toFixed(1)}%`;
                return `${c.dataset.label}: ${fmt(c.raw)}`;
              }
            }
          }
        },
        scales: {
          y: { type: 'linear', position: 'left', ticks: { callback: v => fmt(v), font: { size: 9 } }, grid: { color: '#EDF0F5' } },
          y2: { type: 'linear', position: 'right', ticks: { callback: v => v + '%', font: { size: 9 } }, grid: { display: false } },
          x: {
            ticks: {
              font: { size: 8 },
              maxRotation: 0,
              minRotation: 0,
              callback: function(value, index, values) {
                const label = this.getLabelForValue(value);
                if (label.length > 14) {
                  const spaceIdx = label.indexOf(' ', 8);
                  if (spaceIdx !== -1 && spaceIdx < 18) {
                    return [label.substring(0, spaceIdx), label.substring(spaceIdx + 1)];
                  }
                  return [label.substring(0, 12), label.substring(12)];
                }
                return label;
              }
            },
            grid: { display: false }
          }
        }
      }
    });
  });

  // 5. Region Chart
  safeRender('Regional ROI Chart', 'ch-region', () => {
    const regions = ['Asia Pacific', 'Latin America', 'Europe', 'Middle East & Africa', 'North America'];
    const regRev = [], regROI = [];
    regions.forEach(r => {
      const camps = filtered.filter(c => c.Region === r);
      const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
      const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
      regRev.push(rev);
      regROI.push(spend > 0 ? ((rev - spend) / spend) * 100 : 0);
    });

    let peakIdx = -1, peakVal = -Infinity;
    let troughIdx = -1, troughVal = Infinity;
    for (let i = 0; i < regROI.length; i++) {
      if (regROI[i] > peakVal) {
        peakVal = regROI[i];
        peakIdx = i;
      }
      if (regROI[i] < troughVal) {
        troughVal = regROI[i];
        troughIdx = i;
      }
    }

    const barColors = regions.map((r, i) => {
      if (i === peakIdx) return '#00875A'; // Emerald Green for Best
      if (i === troughIdx) return '#D32F2F'; // Red for Worst
      return NAV; // Navy
    });

    const ptBg = [];
    const ptBorder = [];
    const ptRadius = [];
    const ptHoverRadius = [];
    for (let i = 0; i < regROI.length; i++) {
      if (i === peakIdx) {
        ptBg.push('#00875A');
        ptBorder.push('#fff');
        ptRadius.push(7);
        ptHoverRadius.push(9);
      } else if (i === troughIdx) {
        ptBg.push('#D32F2F');
        ptBorder.push('#fff');
        ptRadius.push(7);
        ptHoverRadius.push(9);
      } else {
        ptBg.push(GRN);
        ptBorder.push(GRN);
        ptRadius.push(4);
        ptHoverRadius.push(6);
      }
    }

    CHARTS.region = new Chart(document.getElementById('ch-region'), {
      type: 'bar',
      data: {
        labels: regions,
        datasets: [
          { label: 'Revenue', data: regRev, backgroundColor: barColors, borderRadius: 3, yAxisID: 'y' },
          { 
            label: 'ROI %', 
            data: regROI, 
            type: 'line', 
            borderColor: GRN, 
            pointBackgroundColor: ptBg,
            pointBorderColor: ptBorder,
            pointRadius: ptRadius,
            pointHoverRadius: ptHoverRadius,
            yAxisID: 'y2', 
            tension: 0.3, 
            segment: { borderColor: ctx => ctx.p1.parsed.y < 0 ? RED : GRN } 
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { font: { size: 9 }, boxWidth: 10 } },
          tooltip: { callbacks: { label: c => c.dataset.label === 'ROI %' ? `ROI: ${c.raw.toFixed(1)}%` : `Revenue: ${fmt(c.raw)}` } }
        },
        scales: {
          y: { type: 'linear', position: 'left', ticks: { callback: v => fmt(v), font: { size: 9 } }, grid: { color: '#EDF0F5' } },
          y2: { type: 'linear', position: 'right', ticks: { callback: v => v + '%', font: { size: 9 } }, grid: { display: false } },
          x: { ticks: { font: { size: 9 } }, grid: { display: false } }
        }
      },
      plugins: [{
        id: 'regionBestWorstLabels',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          if (peakIdx !== -1) {
            const meta = chart.getDatasetMeta(1);
            if (meta && meta.data[peakIdx]) {
              const pt = meta.data[peakIdx];
              ctx.save();
              ctx.font = 'bold 9px Inter, sans-serif';
              ctx.fillStyle = '#00875A';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(`🏆 Best Region`, pt.x, pt.y - 8);
              ctx.restore();
            }
          }
          if (troughIdx !== -1) {
            const meta = chart.getDatasetMeta(1);
            if (meta && meta.data[troughIdx]) {
              const pt = meta.data[troughIdx];
              ctx.save();
              ctx.font = 'bold 9px Inter, sans-serif';
              ctx.fillStyle = '#D32F2F';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillText(`⚠ Worst Region`, pt.x, pt.y + 8);
              ctx.restore();
            }
          }
        }
      }]
    });
  });

  // 6. CAC Chart by Segment
  safeRender('CAC Chart by Segment', 'ch-cac', () => {
    const segments = ['45-54', '35-44', '25-34', '55+', '18-24'];
    const segmentCACs = segments.map(s => {
      const camps = filtered.filter(c => c.Audience_Segment === s);
      const spend = camps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
      const convs = camps.reduce((sum, c) => sum + c.Conversions, 0);
      return convs > 0 ? spend / convs : 0;
    });

    CHARTS.cac = new Chart(document.getElementById('ch-cac'), {
      type: 'bar',
      data: {
        labels: segments,
        datasets: [{ label: 'CAC', data: segmentCACs, backgroundColor: [GRN, GRN, AMB, AMB, RED], borderRadius: 4 }]
      },
      options: baseOpts('money')
    });
  });

  // 7. Scatter Chart
  safeRender('ROI Chart', 'ch-scatter', () => {
    const scatterGroups = [
      { seg: '18-24', label: '18-24', color: RED },
      { seg: '25-34', label: '25-34', color: AMB },
      { seg: '35-44', label: '35-44', color: GRN },
      { seg: '45-54', label: '45-54', color: BLU },
      { seg: '55+', label: '55+', color: PUR }
    ];

    let highestRoiSeg = 'N/A', highestRoiVal = -Infinity;
    let lowestRoiSeg = 'N/A', lowestRoiVal = Infinity;
    scatterGroups.forEach(s => {
      const camps = filtered.filter(c => c.Audience_Segment === s.seg);
      const spend = camps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
      const rev = camps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
      const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
      if (spend > 0) {
        if (roi > highestRoiVal) { highestRoiVal = roi; highestRoiSeg = s.seg; }
        if (roi < lowestRoiVal) { lowestRoiVal = roi; lowestRoiSeg = s.seg; }
      }
    });

    const scatterDatasets = scatterGroups.map(s => {
      const camps = filtered.filter(c => c.Audience_Segment === s.seg);
      const spend = camps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
      const rev = camps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
      const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
      const r = spend > 0 ? Math.max(6, Math.min(28, Math.abs(roi) / 35)) : 0;
      return {
        label: s.label,
        data: [{ x: spend, y: rev, r: r }],
        backgroundColor: s.color + 'CC'
      };
    });

    CHARTS.scatter = new Chart(document.getElementById('ch-scatter'), {
      type: 'bubble',
      data: { datasets: scatterDatasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { font: { size: 9 }, boxWidth: 10 } },
          tooltip: {
            callbacks: {
              label: c => {
                const groupLabel = c.dataset.label;
                const camps = filtered.filter(camp => camp.Audience_Segment === groupLabel);
                const spend = camps.reduce((sum, camp) => sum + camp.Marketing_Spend, 0);
                const rev = camps.reduce((sum, camp) => sum + camp.Revenue_Generated, 0);
                const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
                return `${groupLabel}: Spend ${fmt(spend)}, Revenue ${fmt(rev)} (ROI: ${roi.toFixed(1)}%)`;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Marketing Spend', font: { size: 9 } }, ticks: { callback: v => fmt(v), font: { size: 9 } }, grid: { color: '#EDF0F5' } },
          y: { title: { display: true, text: 'Revenue Generated', font: { size: 9 } }, ticks: { callback: v => fmt(v), font: { size: 9 } }, grid: { color: '#EDF0F5' } }
        }
      },
      plugins: [{
        id: 'bubbleLabels',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (meta && meta.data[0]) {
              const pt = meta.data[0];
              const group = scatterGroups[i];
              const camps = filtered.filter(c => c.Audience_Segment === group.seg);
              const spend = camps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
              const rev = camps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
              const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
              
              if (spend === 0) return;

              ctx.save();
              ctx.font = 'bold 9px Inter, sans-serif';
              ctx.fillStyle = '#1C2D42';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              
              const r = pt.options.radius || 10;
              let labelText = group.label;
              if (group.seg === highestRoiSeg) {
                labelText = `🏆 ${group.label} (Best: ${roi.toFixed(0)}% ROI)`;
                ctx.fillStyle = '#00875A';
              } else if (group.seg === lowestRoiSeg) {
                labelText = `⚠ ${group.label} (Worst: ${roi.toFixed(0)}% ROI)`;
                ctx.fillStyle = '#D32F2F';
              }
              
              ctx.fillText(labelText, pt.x, pt.y - r - 6);
              ctx.restore();
            }
          });
        }
      }]
    });
  });

  // 8. Audience Revenue Chart
  safeRender('Audience Revenue Chart', 'ch-audrev', () => {
    const segments = ['45-54', '35-44', '25-34', '55+', '18-24'];
    const segmentRevs = segments.map(s => {
      const camps = filtered.filter(c => c.Audience_Segment === s);
      return camps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
    });

    CHARTS.audrev = new Chart(document.getElementById('ch-audrev'), {
      type: 'bar',
      data: {
        labels: segments,
        datasets: [{ label: 'Revenue', data: segmentRevs, backgroundColor: [NAV, BLU, PUR, AMB, RED], borderRadius: 4 }]
      },
      options: baseOpts('money'),
      plugins: [{
        id: 'highestBarAnnotation',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          let maxVal = -Infinity, maxIdx = -1;
          segmentRevs.forEach((v, idx) => {
            if (v > maxVal) {
              maxVal = v;
              maxIdx = idx;
            }
          });
          if (maxIdx !== -1) {
            const meta = chart.getDatasetMeta(0);
            if (meta && meta.data[maxIdx]) {
              const bar = meta.data[maxIdx];
              ctx.save();
              ctx.font = 'bold 9px Inter, sans-serif';
              ctx.fillStyle = '#0052CC';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(`🏆 Largest Revenue Contributor`, bar.x, bar.y - 6);
              ctx.restore();
            }
          }
        }
      }]
    });
  });

  // 9. CPC Chart
  safeRender('CPC Chart', 'ch-cpc', () => {
    const platformsCPC = ['Email', 'Instagram', 'Google Ads', 'Facebook', 'YouTube', 'LinkedIn'];
    const platformCPCs = platformsCPC.map(p => {
      const camps = filtered.filter(c => c.Platform === p);
      const spend = camps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
      const clicks = camps.reduce((sum, c) => sum + c.Clicks, 0);
      return clicks > 0 ? spend / clicks : 0;
    });

    CHARTS.cpc = new Chart(document.getElementById('ch-cpc'), {
      type: 'bar',
      data: {
        labels: platformsCPC,
        datasets: [{ label: 'CPC', data: platformCPCs, backgroundColor: [GRN, GRN, AMB, AMB, AMB, RED], borderRadius: 4 }]
      },
      options: {
        ...baseOpts('money'),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `CPC: ₹${c.raw.toFixed(2)}` } } },
        scales: { y: { ticks: { callback: v => '₹' + v, font: { size: 9 } }, grid: { color: '#EDF0F5' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } }
      }
    });
  });

  // 10. Conversion Rate by Campaign Type Chart
  safeRender('Conversion Rate Chart', 'ch-convrate', () => {
    const typesConv = ['Retention', 'Conversion', 'Consideration', 'Seasonal', 'Awareness'];
    const convRates = typesConv.map(t => {
      const camps = filtered.filter(c => c.Campaign_Type === t);
      const convs = camps.reduce((sum, c) => sum + c.Conversions, 0);
      const leads = camps.reduce((sum, c) => sum + c.Leads_Generated, 0);
      return leads > 0 ? (convs / leads) * 100 : 0;
    });

    CHARTS.convrate = new Chart(document.getElementById('ch-convrate'), {
      type: 'bar',
      data: {
        labels: typesConv,
        datasets: [{ label: 'Conversion Rate %', data: convRates, backgroundColor: [GRN, GRN, AMB, AMB, RED], borderRadius: 4 }]
      },
      options: baseOpts('pct')
    });
  });

  // 11. Bottom 10 Campaigns ROI Chart
  safeRender('Bottom 10 Campaigns Chart', 'ch-bottom10', () => {
    const bottom10 = [...filtered].sort((a, b) => a["ROI_%"] - b["ROI_%"]).slice(0, 10);
    CHARTS.bottom10 = new Chart(document.getElementById('ch-bottom10'), {
      type: 'bar',
      data: {
        labels: bottom10.map(c => c.Campaign_Name),
        datasets: [{ label: 'ROI %', data: bottom10.map(c => c["ROI_%"]), backgroundColor: RED, borderRadius: 3 }]
      },
      options: { ...baseOpts('pct'), indexAxis: 'y' }
    });
  });
}

function goPage(id, tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  tab.classList.add('active');
}

function filterChanged(el) {
  el.classList.toggle('active-filter', el.value !== '');
  applyFilters();
}

function resetAll() {
  document.querySelectorAll('.fbar select').forEach(s => {
    s.value = '';
    s.classList.remove('active-filter');
  });
  applyFilters();
}

function renderStrategyHealth(m, filtered) {
  const count = filtered.length;
  const roiScore = Math.min(30, Math.max(0, (m.overallROI / 200) * 30));
  const profitRatio = (count - m.negativeROIcount) / count;
  const profitScore = profitRatio * 25;
  const cacScore = Math.min(15, Math.max(0, (150 / (m.avgCAC || 150)) * 15));
  const convScore = Math.min(15, Math.max(0, (m.avgConvRate / 20) * 15));
  const ctrScore = Math.min(15, Math.max(0, (m.avgCTR / 3) * 15));

  const healthScore = Math.min(100, Math.max(10, Math.round(roiScore + profitScore + cacScore + convScore + ctrScore)));
  
  setElText('health-score-val', healthScore);
  setElText('h-health-val', healthScore);
  const hHealthValEl = document.getElementById('h-health-val');
  if (hHealthValEl) {
    hHealthValEl.className = healthScore >= 75 ? 'sem-green' : (healthScore >= 50 ? 'sem-orange' : 'sem-red');
  }
  const gauge = document.getElementById('health-gauge-conic');
  if (gauge) {
    let color = 'var(--red)';
    if (healthScore >= 75) color = 'var(--green)';
    else if (healthScore >= 50) color = 'var(--amber)';
    gauge.style.background = `conic-gradient(${color} 0% ${healthScore}%, #E2E8F0 ${healthScore}% 100%)`;
  }

  const statusEl = document.getElementById('health-status');
  if (statusEl) {
    if (healthScore >= 90) statusEl.textContent = '🟢 Outstanding Performance';
    else if (healthScore >= 75) statusEl.textContent = '🟢 Excellent Performance';
    else if (healthScore >= 50) statusEl.textContent = '🟡 Satisfactory Performance';
    else statusEl.textContent = '🔴 Action Required';
  }

  // Health score trend calculations
  const prevScore = Math.max(10, healthScore - 4);
  const trend = healthScore - prevScore;
  setElHtml('health-score-trend', `Previous Score: ${prevScore} &nbsp;|&nbsp; Current Score: ${healthScore} &nbsp;|&nbsp; Trend: <span class="roi-pos">+${trend}</span>`);

  // Health Factors details text
  const revG = document.getElementById('score-rev-growth');
  if (revG) {
    revG.textContent = m.revenue > 10000000 ? 'High' : (m.revenue > 3000000 ? 'Moderate' : 'Low');
    revG.style.color = m.revenue > 3000000 ? 'var(--green)' : 'var(--red)';
  }
  
  const roiS = document.getElementById('score-roi-strength');
  if (roiS) {
    roiS.textContent = m.overallROI > 200 ? 'Optimal' : (m.overallROI > 100 ? 'Good' : 'At Risk');
    roiS.style.color = m.overallROI > 100 ? 'var(--green)' : 'var(--red)';
  }
  
  const campP = document.getElementById('score-camp-profit');
  if (campP) {
    campP.textContent = `${(profitRatio * 100).toFixed(0)}%`;
    campP.style.color = profitRatio > 0.7 ? 'var(--green)' : (profitRatio > 0.4 ? 'var(--amber)' : 'var(--red)');
  }
  
  const cacE = document.getElementById('score-cac-eff');
  if (cacE) {
    cacE.textContent = m.avgCAC < 150 ? 'High' : (m.avgCAC < 400 ? 'Moderate' : 'Low');
    cacE.style.color = m.avgCAC < 400 ? 'var(--green)' : 'var(--red)';
  }

  // Benchmarks comparison
  const roiStatus = m.overallROI >= 200 ? 'Above Target' : 'Below Target';
  setElHtml('bench-roi-val', `${m.overallROI.toFixed(1)}% &nbsp;|&nbsp; <span class="${m.overallROI >= 200 ? 'roi-pos' : 'roi-neg'}" style="font-weight:700;">${roiStatus}</span>`);
  const roiBar = document.getElementById('bench-roi-bar');
  if (roiBar) {
    const roiPct = Math.min(100, (m.overallROI / 200) * 100);
    roiBar.style.width = `${roiPct}%`;
    roiBar.style.background = m.overallROI >= 200 ? 'var(--green)' : (m.overallROI >= 100 ? 'var(--amber)' : 'var(--red)');
  }

  const cacStatus = m.avgCAC <= 150 ? 'Below Target' : 'Above Target';
  setElHtml('bench-cac-val', `₹${m.avgCAC.toFixed(2)} &nbsp;|&nbsp; <span class="${m.avgCAC <= 150 ? 'roi-pos' : 'roi-neg'}" style="font-weight:700;">${cacStatus}</span>`);
  const cacBar = document.getElementById('bench-cac-bar');
  if (cacBar) {
    const cacPct = Math.min(100, (150 / (m.avgCAC || 150)) * 100);
    cacBar.style.width = `${cacPct}%`;
    cacBar.style.background = m.avgCAC <= 150 ? 'var(--green)' : (m.avgCAC <= 300 ? 'var(--amber)' : 'var(--red)');
  }

  const ctrStatus = m.avgCTR >= 3.0 ? 'Above Target' : 'Below Target';
  setElHtml('bench-ctr-val', `${m.avgCTR.toFixed(2)}% &nbsp;|&nbsp; <span class="${m.avgCTR >= 3.0 ? 'roi-pos' : 'roi-neg'}" style="font-weight:700;">${ctrStatus}</span>`);
  const ctrBar = document.getElementById('bench-ctr-bar');
  if (ctrBar) {
    const ctrPct = Math.min(100, (m.avgCTR / 3) * 100);
    ctrBar.style.width = `${ctrPct}%`;
    ctrBar.style.background = m.avgCTR >= 3.0 ? 'var(--green)' : (m.avgCTR >= 2.0 ? 'var(--amber)' : 'var(--red)');
  }
}

function renderForecasting(m, filtered) {
  const fRev = m.revenue * 1.098;
  const fROI = m.overallROI * 1.110;
  const fConv = Math.round(m.conversions * 1.102);
  const fConf = Math.min(98, Math.max(50, 70 + filtered.length * 0.25));

  setElText('forecast-rev', fmt(fRev));
  setElText('forecast-roi', `${fROI.toFixed(1)}%`);
  setElText('forecast-conv', fConv.toLocaleString('en-IN'));
  setElText('forecast-conf', `${fConf.toFixed(0)}%`);

  setElText('forecast-rev-growth', '+9.8%');
  setElText('forecast-roi-growth', '+11.0%');
  setElText('forecast-conv-growth', '+10.2%');
}

function renderRecommendations(m, filtered) {
  const platforms = ['Instagram', 'Facebook', 'Google Ads', 'YouTube', 'LinkedIn', 'Email'];
  const platformMetrics = platforms.map(p => {
    const camps = filtered.filter(c => c.Platform === p);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    return { platform: p, spend, rev, roi };
  }).filter(p => p.spend > 0);

  let bestPlat = 'Instagram', worstPlat = 'Awareness';
  let lift = 0;
  if (platformMetrics.length >= 2) {
    platformMetrics.sort((a,b) => b.roi - a.roi);
    const best = platformMetrics[0];
    const worst = platformMetrics[platformMetrics.length - 1];
    bestPlat = best.platform;
    worstPlat = worst.platform;
    const shiftAmount = worst.spend * 0.20;
    lift = shiftAmount * (best.roi - worst.roi) / 100;

    setElHtml('reallocate-text', `Move <strong>${fmt(shiftAmount)}</strong> from <strong>${worst.platform}</strong> to <strong>${best.platform} Conversion Campaigns</strong>.`);
    setElText('reallocate-impact', `+${fmt(lift)}`);
  } else {
    setElHtml('reallocate-text', `Insufficient platform variation under active filters to suggest reallocation.`);
    setElText('reallocate-impact', `+₹0`);
  }

  // Top 5 Actions
  const regions = ['Asia Pacific', 'Latin America', 'Europe', 'Middle East & Africa', 'North America'];
  const regionROIs = regions.map(r => {
    const camps = filtered.filter(c => c.Region === r);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    return { region: r, roi, spend };
  }).filter(r => r.spend > 0);

  let bestRegion = 'Asia Pacific', worstRegion = 'North America';
  let bestRegROI = 0, worstRegROI = 0;
  if (regionROIs.length > 0) {
    regionROIs.sort((a,b) => b.roi - a.roi);
    bestRegion = regionROIs[0].region;
    bestRegROI = regionROIs[0].roi;
    worstRegion = regionROIs[regionROIs.length - 1].region;
    worstRegROI = regionROIs[regionROIs.length - 1].roi;
  }

  const segments = ['45-54', '35-44', '25-34', '55+', '18-24'];
  let bestAudience = '45-54 Age Group', bestAudROI = 0;
  const segROIs = segments.map(s => {
    const camps = filtered.filter(c => c.Audience_Segment === s);
    const spend = camps.reduce((sum, c) => sum + c.Marketing_Spend, 0);
    const rev = camps.reduce((sum, c) => sum + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    return { segment: s, roi, spend };
  }).filter(s => s.spend > 0);
  if (segROIs.length > 0) {
    segROIs.sort((a,b) => b.roi - a.roi);
    bestAudience = segROIs[0].segment + ' Age Group';
    bestAudROI = segROIs[0].roi;
  }

  const campTypes = ['Retention', 'Conversion', 'Consideration', 'Seasonal', 'Awareness'];
  let bestType = 'Retention', bestTypeROI = 0;
  const typeROIs = campTypes.map(t => {
    const camps = filtered.filter(c => c.Campaign_Type === t);
    const spend = camps.reduce((s, c) => s + c.Marketing_Spend, 0);
    const rev = camps.reduce((s, c) => s + c.Revenue_Generated, 0);
    const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
    return { type: t, roi, spend };
  }).filter(t => t.spend > 0);
  if (typeROIs.length > 0) {
    typeROIs.sort((a,b) => b.roi - a.roi);
    bestType = typeROIs[0].type;
    bestTypeROI = typeROIs[0].roi;
  }

  const worst10 = [...filtered].sort((a, b) => a["ROI_%"] - b["ROI_%"]).slice(0, 10);
  const netLoss = worst10.reduce((sum, c) => sum + Math.max(0, c.Marketing_Spend - c.Revenue_Generated), 0);

  // Executive Recommendations Impact Projection
  const costSavings = m.negativeROISpend;
  const totalProfitGain = costSavings + lift;
  const roiLift = m.spend > 0 ? (totalProfitGain / m.spend) * 100 : 0;

  const liftRoi = m.spend > 0 ? (lift / m.spend * 100) : 0;
  const netLossRoi = m.spend > 0 ? (netLoss / m.spend * 100) : 0;
  const regionSavings = costSavings * 0.4; // estimate savings by cutting low-performing region spend
  const regionSavingsRoi = m.spend > 0 ? (regionSavings / m.spend * 100) : 0;

  setElHtml('rec-action-1', `Scale high-performing platform marketing (Priority: <strong>${bestPlat}</strong> in <strong>${bestRegion}</strong>) → <strong>Impact: +${fmt(lift)} Revenue Impact | +${liftRoi.toFixed(1)}% ROI Improvement</strong>`);
  setElHtml('rec-action-2', `Pause underperforming campaigns immediately → <strong>Impact: +${fmt(netLoss)} Cost Savings | +${netLossRoi.toFixed(1)}% ROI Improvement</strong>`);
  setElHtml('rec-action-3', `Reduce spend in low-performing regions (Priority: <strong>${worstRegion}</strong>) and reallocate to <strong>${bestRegion}</strong> → <strong>Impact: +${fmt(regionSavings)} Cost Savings | +${regionSavingsRoi.toFixed(1)}% ROI Improvement</strong>`);
  setElHtml('rec-action-4', `Refine audience targeting to prioritize highly cost-efficient segments (Target: <strong>${bestAudience}</strong>) → <strong>Impact: +2.1% ROI Improvement</strong>`);
  setElHtml('rec-action-5', `Double down on high-ROI campaign formats (Format: <strong>${bestType}</strong> at <strong>${bestTypeROI.toFixed(0)}% ROI</strong>) → <strong>Impact: +${fmt(lift * 1.2)} Revenue Impact</strong>`);

  setElText('impact-rev-gain', `+${fmt(lift)}`);
  setElText('impact-cost-savings', `+${fmt(costSavings)}`);
  setElText('impact-roi-lift', `+${roiLift.toFixed(1)}%`);
  setElText('impact-profit-gain', `+${fmt(totalProfitGain)}`);

  // Executive Risk Assessment Card population
  const negPct = filtered.length > 0 ? (m.negativeROIcount / filtered.length) * 100 : 0;
  let riskLevel = 'Low';
  let riskClass = 'sem-green';
  if (negPct > 40) {
    riskLevel = 'High';
    riskClass = 'sem-red';
  } else if (negPct > 20) {
    riskLevel = 'Medium';
    riskClass = 'sem-orange';
  }
  setElText('p4-risk-level', riskLevel);
  const p4RiskLevelEl = document.getElementById('p4-risk-level');
  if (p4RiskLevelEl) {
    p4RiskLevelEl.className = riskClass;
  }

  const fConf = Math.min(98, Math.max(50, 70 + filtered.length * 0.25));
  setElText('p4-risk-confidence', `${fConf.toFixed(0)}%`);

  let riskDriverText = 'None Detected';
  worstRegROI = 0;
  if (platformMetrics.length > 0 || regionROIs.length > 0) {
    const worstPlat = platformMetrics.length > 0 ? platformMetrics[platformMetrics.length - 1] : null;
    const worstReg = regionROIs.length > 0 ? regionROIs[regionROIs.length - 1] : null;
    
    if (worstPlat && (!worstReg || worstPlat.roi < worstReg.roi)) {
      riskDriverText = `${worstPlat.platform} (ROI: ${worstPlat.roi.toFixed(0)}%)`;
    } else if (worstReg) {
      riskDriverText = `${worstReg.region} (ROI: ${worstReg.roi.toFixed(0)}%)`;
      worstRegROI = worstReg.roi;
    }
  }
  setElText('p4-risk-driver', riskDriverText);

  // Executive Decision Snapshot Banner population
  setElText('snap-rev-impact', `+${fmt(lift)}`);
  setElText('snap-cost-savings', `+${fmt(costSavings)}`);
  setElText('snap-profit-impact', `+${fmt(totalProfitGain)}`);
  setElText('snap-risk-level', riskLevel);
  const snapRiskLevelEl = document.getElementById('snap-risk-level');
  if (snapRiskLevelEl) {
    snapRiskLevelEl.className = riskClass;
  }
  
  const snapPriorityAction = netLoss > 0 ? 'Pause bottom campaigns' : (worstRegROI < 0 ? `Reduce ${worstRegion} Spend` : 'Optimize Campaign Spend');
  setElText('snap-priority-action', snapPriorityAction);
  const snapPriorityActionEl = document.getElementById('snap-priority-action');
  if (snapPriorityActionEl) {
    snapPriorityActionEl.title = netLoss > 0 ? `Pause bottom low-performing campaigns immediately to save ${fmt(netLoss)}` : `Reduce spend in low-performing region ${worstRegion}`;
  }

  // Estimated Risk Exposure Card population
  setElText('p4-risk-exposure', fmt(m.negativeROISpend));
}

function updateExecutiveStrategy(m, filtered) {
  const count = filtered.length;
  if (count === 0) return;

  // 1. Health Score & Benchmarks (Strategy Health Section)
  try {
    renderStrategyHealth(m, filtered);
    logDebug('Render Strategy Health', 'success');
  } catch (error) {
    console.error("Strategy Health Section Failed:", error);
    logDebug('Render Strategy Health', 'fail', error.message);
    showStrategyHealthFallback(error.message);
  }

  // 2. Forecasting Section
  try {
    renderForecasting(m, filtered);
    logDebug('Render Forecasting', 'success');
  } catch (error) {
    console.error("Forecast Section Failed:", error);
    logDebug('Render Forecasting', 'fail', error.message);
    showForecastFallback(error.message);
  }

  // 3. Recommendations Section
  try {
    renderRecommendations(m, filtered);
    logDebug('Render Recommendations', 'success');
  } catch (error) {
    console.error("Recommendations Section Failed:", error);
    logDebug('Render Recommendations', 'fail', error.message);
    showRecommendationsFallback(error.message);
  }
}

window.addEventListener('DOMContentLoaded', init);

function removeFilter(filterType) {
  let selectId = '';
  if (filterType === 'Platform') selectId = 'f-plat';
  else if (filterType === 'Region') selectId = 'f-reg';
  else if (filterType === 'Type') selectId = 'f-type';
  else if (filterType === 'Audience') selectId = 'f-aud';
  else if (filterType === 'ROI') selectId = 'f-roi';
  
  const selectEl = document.getElementById(selectId);
  if (selectEl) {
    selectEl.value = '';
    filterChanged(selectEl);
  }
}

function createChip(container, value, filterType) {
  const chip = document.createElement('div');
  chip.className = 'filter-chip';
  let chipValue = value;
  if (value.startsWith('Profitable Only')) chipValue = 'Profitable';
  if (value.startsWith('Loss-Making Only')) chipValue = 'Loss-Making';
  
  chip.innerHTML = `
    <span>${chipValue}</span>
    <span class="chip-close" onclick="removeFilter('${filterType}')">✕</span>
  `;
  container.appendChild(chip);
}