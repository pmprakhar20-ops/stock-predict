// Professional Trading Platform JavaScript
let candlestickChart = null;
let currentStock = 'RELIANCE';
let updateInterval = null;
let stockData = {};
let orderType = 'limit';
let allStocks = [];
let currentChartType = 'candlestick';

// Comprehensive list of NSE listed stocks (whitelist for validation)
const NSE_LISTED_STOCKS = new Set([
  // NIFTY 50
  'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','HINDUNILVR','SBIN','BHARTIARTL',
  'KOTAKBANK','LT','ITC','AXISBANK','MARUTI','BAJFINANCE','WIPRO','HCLTECH',
  'TATAMOTORS','SUNPHARMA','M&M','ASIANPAINT','TITAN','NESTLEIND','ULTRACEMCO',
  'TECHM','GRASIM','POWERGRID','NTPC','ONGC','COALINDIA','BPCL','IOC',
  'TATASTEEL','HINDALCO','JSWSTEEL','ADANIENT','ADANIPORTS',
  // NIFTY NEXT 50 & MidCap
  'GAIL','DABUR','BRITANNIA','HEROMOTOCO','DRREDDY','CIPLA','DIVISLAB',
  'APOLLOHOSP','EICHERMOT','UPL','PIDILITIND','SIEMENS','HAVELLS','VOLTAS',
  'MUTHOOTFIN','CHOLAFIN','PAGEIND','TORNTPHARM','ALKEM','LUPIN','AUROPHARMA',
  'BIOCON','CADILAHC','GLAXO','PFIZER','ABBOTINDIA','IPCALAB',
  // Banking & Finance
  'FEDERALBNK','INDUSINDBK','BANDHANBNK','IDFCFIRSTB','RBLBANK','PNB','CANBK',
  'UNIONBANK','BANKBARODA','BAJAJFINSV','HDFC','LICHSGFIN','RECLTD','PFC',
  'MANAPPURAM','IIFL','M&MFIN','SHRIRAMFIN',
  // IT
  'MPHASIS','PERSISTENT','LTTS','MINDTREE','COFORGE','HEXAWARE','OFSS',
  // Auto
  'BAJAJ-AUTO','TVSMOTORS','MOTHERSUMI','BOSCHLTD','EXIDEIND','AMARARAJA',
  'TVSMOTOR','MRF','APOLLOTYRE',
  // FMCG / Consumer
  'EMAMILTD','MARICO','COLPAL','GODREJCP','GODREJIND','VBL','RADICO','MCDOWELL-N',
  'JUBLFOOD','WESTLIFE','DEVYANI','SAPPHIRE',
  // Energy & Infra
  'ADANIGREEN','ADANITRANS','ADANIPOWER','TATAPOWER','TORNTPOWER','CESC',
  'NHPC','SJVN','IRFC','RVNL','IRCON','NBCC',
  // Metals & Mining
  'VEDL','SAIL','NMDC','NATIONALUM','JINDALSTEL','WELCORP',
  // Cement
  'AMBUJACEM','ACC','SHREECEM','DALMIACMT','JKCEMENT','RAMCOCEM',
  // Real Estate
  'DLF','GODREJPROP','OBEROIRLTY','BRIGADE','PRESTIGE','SOBHA',
  // Telecom & Media
  'IDEA','TATACOMM','HFCL','OPTIEMUS',
  // Pharma
  'SUNPHARMA','DRREDDY','CIPLA','DIVISLAB','ALKEM','LUPIN','AUROPHARMA',
  'TORNTPHARM','IPCALAB','NATCO','LALPATHLAB','METROPOLIS','THYROCARE',
  // Hospitality
  'INDHOTEL','LEMONTREE','EIH','CHALET',
  // Aviation
  'INDIGO','SPICEJET',
  // Retail
  'DMART','TRENT','VMART','SHOPERSTOP',
  // Others popular
  'ZOMATO','NYKAA','PAYTM','POLICYBZR','DELHIVERY','NUVOCO','TATACHEM',
  'PIIND','COROMANDEL','RALLIS','DEEPAKNTR','AAVAS','HOMEFIRST',
  'KALYANKJIL','SENCO','JUBLPHARMA','GRANULES','SOLARA',
  'BEL','HAL','BHEL','BDL','GRSE','COCHINSHIP','MAZAGON',
  'DIXON','AMBER','PGEL','KAYNES','SYRMA','AVALON',
  'HSCL','JYOTHYLAB','TASTYBITE','VAIBHAVGBL',
  // Indices ETFs commonly searched
  'NIFTYBEES','BANKBEES','JUNIORBEES','CPSEETF',
  // BSE listed also on NSE
  'WIPRO','INFY','TCS','RELIANCE','HDFC','HDFCBANK'
]);

// List of popular Indian stocks for dashboard
const popularStocks = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'SBIN', 'BHARTIARTL',
  'KOTAKBANK', 'LT', 'ITC', 'AXISBANK', 'MARUTI', 'BAJFINANCE', 'WIPRO', 'HCLTECH',
  'TATAMOTORS', 'SUNPHARMA', 'M&M', 'ASIANPAINT', 'TITAN', 'NESTLEIND', 'ULTRACEMCO',
  'TECHM', 'GRASIM', 'POWERGRID', 'NTPC', 'ONGC', 'COALINDIA', 'BPCL', 'IOC',
  'GAIL', 'DABUR', 'BRITANNIA', 'HEROMOTOCO', 'DRREDDY', 'CIPLA', 'DIVISLAB',
  'APOLLOHOSP', 'EICHERMOT', 'MCDOWELL-N', 'UPL', 'ADANIPORTS', 'JSWSTEEL'
];

// Check if stock is NSE listed — tries yfinance first, then whitelist
async function isNSEListed(symbol) {
  // First check local whitelist
  if (NSE_LISTED_STOCKS.has(symbol)) return true;
  // Also allow if backend confirms data exists (yfinance validation)
  try {
    const res = await fetch(`${window.location.origin}/api/stock/${symbol}`);
    if (res.ok) {
      const data = await res.json();
      // Valid if we got real price data (not an error)
      return data && data.currentPrice && !data.error;
    }
  } catch(e) {}
  return false;
}

// Show "Not Listed" popup
function showNotListedPopup(symbol) {
  // Remove existing popup if any
  const existing = document.getElementById('notListedPopup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'notListedPopup';
  popup.innerHTML = `
    <div style="
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.75); z-index: 99999;
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        background: #1a1a1a; border: 1px solid #ff4757; border-radius: 12px;
        padding: 36px 44px; text-align: center; max-width: 380px; width: 90%;
        box-shadow: 0 8px 40px rgba(255,71,87,0.25);
      ">
        <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
        <h3 style="color: #ff4757; font-size: 20px; margin: 0 0 10px 0;">Stock Not Listed</h3>
        <p style="color: #aaa; font-size: 14px; margin: 0 0 8px 0;">
          <strong style="color:#fff;">${symbol}</strong> is not listed on NSE or could not be found.
        </p>
        <p style="color: #666; font-size: 13px; margin: 0 0 24px 0;">
          Please search for a valid NSE-listed stock symbol (e.g. RELIANCE, TCS, HDFCBANK).
        </p>
        <button onclick="document.getElementById('notListedPopup').remove()" style="
          background: #ff4757; color: #fff; border: none; padding: 10px 28px;
          border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;
        ">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  // Auto-close after 5 seconds
  setTimeout(() => { if (document.getElementById('notListedPopup')) document.getElementById('notListedPopup').remove(); }, 5000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Test basic functionality
    console.log('DOM Loaded - Testing basic functionality');
    
    // Test AI Status element
    const aiStatus = document.getElementById('aiStatus');
    if (aiStatus) {
        console.log('AI Status element found:', aiStatus);
        aiStatus.textContent = 'TEST - Ready';
        aiStatus.style.borderColor = '#00ff88';
    } else {
        console.log('AI Status element NOT found');
    }
    
    // Test chart button
    const chartBtn = document.getElementById('chartDetails');
    if (chartBtn) {
        console.log('Chart Details element found:', chartBtn);
    } else {
        console.log('Chart Details element NOT found');
    }
    
    // Test search button
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        console.log('Search button found:', searchBtn);
    } else {
        console.log('Search button NOT found');
    }
    
    initializeCandlestickChart();
    updateDateTime();
    loadInitialData();
    startRealTimeUpdates();
    setupEventListeners();
    loadAllStocks();
});

// Setup event listeners
function setupEventListeners() {
    // Time interval change
    document.getElementById('timeInterval').addEventListener('change', function() {
        updateChartData();
    });
    
    // Stock search
    document.getElementById('stockSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStock();
        }
    });
    
    // Dashboard search
    document.getElementById('dashboardSearch')?.addEventListener('input', function(e) {
        filterDashboardStocks(e.target.value);
    });
    
    // Order type tabs
    document.querySelectorAll('.order-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            orderType = this.textContent.toLowerCase().replace(' ', '-');
        });
    });
    
    // Order tabs
    document.querySelectorAll('.tab-nav .tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const parent = this.closest('.tab-nav');
            parent.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Search stock function
async function searchStock() {
    const searchInput = document.getElementById('stockSearch');
    const symbol = searchInput.value.trim().toUpperCase();
    
    if (!symbol) {
        showNotification('Please enter a stock symbol', 'error');
        return;
    }
    
    try {
        searchInput.disabled = true;
        showNotification(`Searching ${symbol}...`, 'info');

        // Validate: try to fetch real stock data from backend
        const response = await fetch(`${window.location.origin}/api/stock/${symbol}`);
        
        if (response.ok) {
            const stockInfo = await response.json();
            
            if (stockInfo.error) {
                // Backend returned error — not listed
                showNotListedPopup(symbol);
                return;
            }

            // CRITICAL FIX: Save stock data
            stockData[symbol] = stockInfo;
            
            updateStockInfo(stockInfo);
            
            // Update chart with real data immediately
            updateChartWithRealData(stockInfo);
            
            currentStock = symbol;
        
            // Run real AI analysis
            await runAIAnalysis(symbol);
            
            console.log(`✅ Searched ${symbol} - Price: ₹${stockInfo.currentPrice}`);
            showNotification(`Loaded ${symbol} with real market data`, 'success');
        } else {
            // 404 or other error — stock not found/not listed
            showNotListedPopup(symbol);
        }
    } catch (error) {
        console.error('Error searching stock:', error);
        showNotListedPopup(symbol);
    } finally {
        searchInput.disabled = false;
        searchInput.value = '';
    }
}

// Load all stocks for dashboard
async function loadAllStocks() {
    allStocks = [];
    
    for (const symbol of popularStocks) {
        try {
            const mockData = generateMockStockData(symbol);
            allStocks.push(mockData);
        } catch (error) {
            console.error(`Error loading ${symbol}:`, error);
        }
    }
    
    // Load indices data
    await loadIndicesData();
    
    // Load top gainers and losers
    await loadGainersLosers();
    
    // Update dashboard if it's open
    if (document.getElementById('dashboardModal').style.display === 'flex') {
        updateDashboard();
    }
}

// Load top gainers and losers
async function loadGainersLosers() {
    // Generate mock data for top gainers and losers
    const gainers = [];
    const losers = [];
    
    // Load real market gainers and losers
    try {
        const response = await fetch(`${window.location.origin}/api/stock/RELIANCE`);
        if (response.ok) {
            const realData = await response.json();
            
            // Use real data for first stock
            gainers.push({
                symbol: 'RELIANCE',
                price: realData.currentPrice,
                change: realData.changePercent || 0
            });
            
            // Generate realistic data for others based on market trends
            const baseStocks = ['TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR'];
            for (let i = 0; i < baseStocks.length; i++) {
                const basePrice = realData.currentPrice * (0.8 + Math.random() * 0.4); // Realistic price range
                const gainPercent = Math.random() * 8 + 2; // 2-10% gain
                const currentPrice = basePrice * (1 + gainPercent / 100);
                
                gainers.push({
                    symbol: baseStocks[i],
                    price: currentPrice,
                    change: gainPercent
                });
            }
        } else {
            throw new Error('Failed to fetch real data');
        }
    } catch (error) {
        console.error('Error loading real market data:', error);
        // Fallback to realistic mock data
        for (let i = 0; i < 5; i++) {
            const basePrice = 2000 + Math.random() * 1000; // More realistic prices
            const gainPercent = Math.random() * 8 + 2; // 2-10% gain
            const currentPrice = basePrice * (1 + gainPercent / 100);
            
            gainers.push({
                symbol: popularStocks[i],
                price: currentPrice,
                change: gainPercent
            });
        }
    }
    
    // Create mock losers
    for (let i = 5; i < 10; i++) {
        const basePrice = Math.random() * 2000 + 500;
        const lossPercent = Math.random() * 8 + 2; // 2-10% loss
        const currentPrice = basePrice * (1 - lossPercent / 100);
        
        losers.push({
            symbol: popularStocks[i],
            price: currentPrice,
            change: -lossPercent
        });
    }
    
    // Update DOM
    updateGainersLosers(gainers, losers);
}

// Update gainers and losers display
function updateGainersLosers(gainers, losers) {
    const gainersContainer = document.getElementById('topGainers');
    const losersContainer = document.getElementById('topLosers');
    
    // Clear existing content
    gainersContainer.innerHTML = '';
    losersContainer.innerHTML = '';
    
    // Add gainers
    gainers.forEach(gainer => {
        const moverItem = document.createElement('div');
        moverItem.className = 'mover-item';
        moverItem.onclick = () => loadStock(gainer.symbol);
        
        moverItem.innerHTML = `
            <span class="mover-symbol">${gainer.symbol}</span>
            <span class="mover-price">₹${gainer.price.toFixed(2)}</span>
            <span class="mover-change gainer">+${gainer.change.toFixed(2)}%</span>
        `;
        
        gainersContainer.appendChild(moverItem);
    });
    
    // Add losers
    losers.forEach(loser => {
        const moverItem = document.createElement('div');
        moverItem.className = 'mover-item';
        moverItem.onclick = () => loadStock(loser.symbol);
        
        moverItem.innerHTML = `
            <span class="mover-symbol">${loser.symbol}</span>
            <span class="mover-price">₹${loser.price.toFixed(2)}</span>
            <span class="mover-change loser">${loser.change.toFixed(2)}%</span>
        `;
        
        losersContainer.appendChild(moverItem);
    });
}

// Load indices data
async function loadIndicesData() {
    const indices = {
        // Indian Indices
        'NIFTY 50': { base: 19500, volatility: 300 },
        'NIFTY BANK': { base: 45000, volatility: 800 },
        'SENSEX': { base: 72000, volatility: 500 },
        'NIFTY IT': { base: 28000, volatility: 600 },
        'NIFTY PHARMA': { base: 12000, volatility: 400 },
        
        // Global Indices
        'DOW JONES': { base: 38000, volatility: 400 },
        'S&P 500': { base: 4800, volatility: 80 },
        'NASDAQ': { base: 15000, volatility: 300 },
        'FTSE': { base: 7500, volatility: 100 },
        'NIKKEI': { base: 38000, volatility: 600 }
    };
    
    // Update all indices with realistic data
    for (const [index, data] of Object.entries(indices)) {
        const change = (Math.random() - 0.5) * data.volatility;
        const currentValue = data.base + change;
        const changePercent = (change / data.base) * 100;
        
        // Map index names to element IDs
        const elementIdMap = {
            'NIFTY 50': { value: 'nifty50', change: 'nifty50Change' },
            'NIFTY BANK': { value: 'niftyBank', change: 'niftyBankChange' },
            'SENSEX': { value: 'sensex', change: 'sensexChange' },
            'NIFTY IT': { value: 'niftyIT', change: 'niftyITChange' },
            'NIFTY PHARMA': { value: 'niftyPharma', change: 'niftyPharmaChange' },
            'DOW JONES': { value: 'dowJones', change: 'dowJonesChange' },
            'S&P 500': { value: 'sp500', change: 'sp500Change' },
            'NASDAQ': { value: 'nasdaq', change: 'nasdaqChange' },
            'FTSE': { value: 'ftse', change: 'ftseChange' },
            'NIKKEI': { value: 'nikkei', change: 'nikkeiChange' }
        };
        
        const elementIds = elementIdMap[index];
        
        if (elementIds) {
            const valueElement = document.getElementById(elementIds.value);
            const changeElement = document.getElementById(elementIds.change);
            
            if (valueElement) {
                valueElement.textContent = currentValue.toFixed(2);
            }
            
            if (changeElement) {
                changeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
                changeElement.className = `index-change ${changePercent >= 0 ? 'positive' : 'negative'}`;
            }
        }
    }
}

// Load index data
function loadIndex(indexName) {
    showNotification(`Loading ${indexName} data...`, 'info');
    // Could expand this to show index details in main chart area
    console.log('Index clicked:', indexName);
}

// Show dashboard modal
function showDashboard() {
    const modal = document.getElementById('dashboardModal');
    modal.style.display = 'flex';
    updateDashboard();
}

// Close dashboard modal
function closeDashboardModal() {
    const modal = document.getElementById('dashboardModal');
    modal.style.display = 'none';
}

// Update dashboard with stock grid
function updateDashboard() {
    const stockGrid = document.getElementById('stockGrid');
    
    if (!stockGrid) return;
    
    stockGrid.innerHTML = allStocks.map(stock => {
        const change = stock.currentPrice - stock.previousClose;
        const changePercent = (change / stock.previousClose) * 100;
        const isPositive = change >= 0;
        
        return `
            <div class="stock-box" onclick="loadStockFromDashboard('${stock.symbol}')">
                <div class="stock-box-header">
                    <span class="stock-box-symbol">${stock.symbol}</span>
                    <span class="${isPositive ? 'positive' : 'negative'}">${isPositive ? '↑' : '↓'}</span>
                </div>
                <div class="stock-box-price">₹${stock.currentPrice.toFixed(2)}</div>
                <div class="stock-box-change">
                    <span class="stock-box-change-amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : ''}₹${Math.abs(change).toFixed(2)}
                    </span>
                    <span class="stock-box-change-percent ${isPositive ? 'positive' : 'negative'}">
                        (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)
                    </span>
                </div>
                <div class="stock-box-details">
                    <div class="stock-box-detail">
                        <span class="label">Volume</span>
                        <span class="value">${formatVolume(stock.volume)}</span>
                    </div>
                    <div class="stock-box-detail">
                        <span class="label">Day Range</span>
                        <span class="value">₹${stock.low.toFixed(2)}-₹${stock.high.toFixed(2)}</span>
                    </div>
                    <div class="stock-box-detail">
                        <span class="label">Market Cap</span>
                        <span class="value">${generateMarketCap()}</span>
                    </div>
                    <div class="stock-box-detail">
                        <span class="label">P/E Ratio</span>
                        <span class="value">${generatePERatio()}</span>
                    </div>
                </div>
                <div class="stock-box-actions">
                    <button class="stock-box-btn buy" onclick="event.stopPropagation(); quickBuy('${stock.symbol}')">
                        Buy
                    </button>
                    <button class="stock-box-btn sell" onclick="event.stopPropagation(); quickSell('${stock.symbol}')">
                        Sell
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Filter dashboard stocks
function filterDashboardStocks(searchTerm) {
    const stockBoxes = document.querySelectorAll('.stock-box');
    const term = searchTerm.toLowerCase();
    
    stockBoxes.forEach(box => {
        const symbol = box.querySelector('.stock-box-symbol').textContent.toLowerCase();
        if (symbol.includes(term)) {
            box.style.display = 'block';
        } else {
            box.style.display = 'none';
        }
    });
}

// Load stock from dashboard
function loadStockFromDashboard(symbol) {
    loadStock(symbol);
    closeDashboardModal();
}

// Quick buy from dashboard
function quickBuy(symbol) {
    showNotification(`Quick buy order for ${symbol} would be placed`, 'info');
}

// Quick sell from dashboard
function quickSell(symbol) {
    showNotification(`Quick sell order for ${symbol} would be placed`, 'info');
}

// Generate market cap
function generateMarketCap() {
    const caps = ['₹1.2T', '₹850B', '₹2.1T', '₹450B', '₹3.5T'];
    return caps[Math.floor(Math.random() * caps.length)];
}

// Generate P/E ratio
function generatePERatio() {
    return (Math.random() * 40 + 10).toFixed(1);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff4757' : '#00d4ff'};
        color: ${type === 'success' ? '#000' : '#fff'};
        padding: 12px 20px;
        border-radius: 4px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize Candlestick Chart
function initializeCandlestickChart() {
    const ctx = document.getElementById('candlestickChart').getContext('2d');
    
    // Generate sample candlestick data
    const candlestickData = generateCandlestickData();
    
    // Destroy existing chart if it exists
    if (candlestickChart) {
        candlestickChart.destroy();
    }
    
    // Determine chart type
    let chartType = currentChartType;
    if (currentChartType === 'area') {
        chartType = 'line';
    } else if (currentChartType === 'hollowcandlestick') {
        chartType = 'candlestick';
    }
    
    // Create chart with proper configuration
    const chartData = getChartData(candlestickData);
    const chartOptions = getChartOptions();
    
    candlestickChart = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: chartOptions
    });
    
    console.log('Chart initialized with type:', chartType, 'Data points:', candlestickData.length);
}

// ============================================================
// CORE CHART FUNCTIONS — Uses real yfinance data from stockData
// ============================================================

// Update chart with real yfinance data (called right after loadStock/searchStock)
function updateChartWithRealData(stockInfo) {
    if (!stockInfo || !stockInfo.prices || !stockInfo.dates) {
        console.warn('No price/date data in stockInfo');
        return;
    }

    const allPrices = stockInfo.prices.map(p => parseFloat(p));
    const allDates  = stockInfo.dates;
    const latestPrice = parseFloat(stockInfo.currentPrice);

    // Force last point to match current price exactly
    if (allPrices.length > 0) {
        allPrices[allPrices.length - 1] = latestPrice;
    }

    // Determine color: green if up, red if down
    const firstPrice = allPrices[0];
    const lineColor = latestPrice >= firstPrice ? '#00ff88' : '#ff4757';
    const fillColor = latestPrice >= firstPrice
        ? 'rgba(0,255,136,0.08)'
        : 'rgba(255,71,87,0.08)';

    const chartData = {
        labels: allDates,
        datasets: [{
            label: `${stockInfo.symbol} (₹${latestPrice.toFixed(2)})`,
            data: allPrices,
            borderColor: lineColor,
            backgroundColor: fillColor,
            borderWidth: 2,
            fill: true,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: lineColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 1
        }]
    };

    // Initialize chart if needed
    if (!candlestickChart) {
        initializeCandlestickChart();
    }

    if (window.candlestickChart) {
        window.candlestickChart.config.type = 'line';
        window.candlestickChart.data = chartData;
        window.candlestickChart.options.scales.x = {
            type: 'category',
            grid: { display: false, borderColor: '#2a2a2a' },
            ticks: {
                color: '#888',
                maxTicksLimit: 8,
                maxRotation: 0,
                callback: function(val) {
                    const label = this.getLabelForValue(val);
                    if (!label) return '';
                    try {
                        const d = new Date(label);
                        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    } catch(e) { return label.slice(0,10); }
                }
            }
        };
        window.candlestickChart.options.plugins.tooltip.callbacks = {
            title: function(items) {
                const label = items[0]?.label || '';
                try {
                    const d = new Date(label);
                    return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
                } catch(e) { return label; }
            },
            label: function(context) {
                return `Price: ₹${parseFloat(context.parsed.y).toFixed(2)}`;
            }
        };
        window.candlestickChart.update('none');
        console.log(`📊 REAL CHART: ${allPrices.length} data points, Latest: ₹${latestPrice.toFixed(2)}`);
    }
}

// Update chart data — uses stored real data or re-fetches
function updateChartData() {
    if (!currentStock) return;

    // If we have real data stored, use it directly
    if (stockData[currentStock] && stockData[currentStock].prices) {
        updateChartWithRealData(stockData[currentStock]);
        return;
    }

    // Otherwise fetch fresh from yfinance
    fetch(`${window.location.origin}/api/stock/${currentStock}`)
        .then(response => response.json())
        .then(stockInfo => {
            if (stockInfo && stockInfo.prices && stockInfo.dates && !stockInfo.error) {
                stockData[currentStock] = stockInfo;
                updateChartWithRealData(stockInfo);
            } else {
                console.warn('No real data available for chart');
            }
        })
        .catch(error => {
            console.error('Error fetching chart data:', error);
        });
}

// Get chart data based on type
function getChartData(candlestickData) {
    const datasets = [];
    
    switch(currentChartType) {
        case 'candlestick':
            datasets.push({
                label: currentStock,
                data: candlestickData,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 1,
                barThickness: 4,
                wickColor: '#888',
                wickLineWidth: 1
            });
            break;
            
        case 'line':
            const lineData = candlestickData.map(d => ({
                x: d.x,
                y: d.c
            }));
            datasets.push({
                label: currentStock,
                data: lineData,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 6
            });
            break;
            
        case 'bar':
            const barData = candlestickData.map(d => ({
                x: d.x,
                y: d.c
            }));
            datasets.push({
                label: currentStock,
                data: barData,
                backgroundColor: '#00d4ff',
                borderColor: '#00d4ff',
                borderWidth: 1,
                barThickness: 12
            });
            break;
            
        case 'area':
            const areaData = candlestickData.map(d => ({
                x: d.x,
                y: d.c
            }));
            datasets.push({
                label: currentStock,
                data: areaData,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.3)',
                borderWidth: 2,
                tension: 0.1,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6
            });
            break;
            
        case 'ohlc':
            datasets.push({
                label: currentStock,
                data: candlestickData,
                borderColor: '#00d4ff',
                backgroundColor: 'transparent',
                borderWidth: 2,
                barThickness: 2
            });
            break;
            
        case 'hollowcandlestick':
            datasets.push({
                label: currentStock,
                data: candlestickData,
                borderColor: candlestickData.map(d => 
                    d.c >= d.o ? '#00ff88' : '#ff4757'
                ),
                backgroundColor: 'transparent',
                borderWidth: 2,
                barThickness: 4,
                wickColor: candlestickData.map(d => 
                    d.c >= d.o ? '#00ff88' : '#ff4757'
                ),
                wickLineWidth: 1
            });
            break;
    }
    
    return { 
        datasets: datasets 
    };
}

// Get chart options based on type
function getChartOptions() {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#00d4ff',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: getTooltipCallbacks()
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                    displayFormats: {
                        minute: 'HH:mm'
                    }
                },
                grid: {
                    display: false,
                    borderColor: '#2a2a2a'
                },
                ticks: {
                    color: '#888',
                    maxTicksLimit: 8
                }
            },
            y: {
                position: 'right',
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    borderColor: '#2a2a2a'
                },
                ticks: {
                    color: '#888',
                    callback: function(value) {
                        return '₹' + value.toFixed(2);
                    }
                }
            }
        }
    };
    
    return baseOptions;
}

// Get tooltip callbacks based on chart type
function getTooltipCallbacks() {
    switch(currentChartType) {
        case 'candlestick':
        case 'ohlc':
            return {
                label: function(context) {
                    const data = context.raw;
                    return [
                        `Open: ₹${data.o.toFixed(2)}`,
                        `High: ₹${data.h.toFixed(2)}`,
                        `Low: ₹${data.l.toFixed(2)}`,
                        `Close: ₹${data.c.toFixed(2)}`
                    ];
                }
            };
            
        case 'hollowcandlestick':
            return {
                label: function(context) {
                    const data = context.raw;
                    return [
                        `O: ₹${data.o.toFixed(2)} H: ₹${data.h.toFixed(2)} L: ₹${data.l.toFixed(2)} C: ₹${data.c.toFixed(2)}`
                    ];
                }
            };
            
        default:
            return {
                label: function(context) {
                    return `Price: ₹${context.parsed.y.toFixed(2)}`;
                }
            };
    }
}

// Set chart type
function setChartType(type) {
    currentChartType = type;
    
    // Update button states
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-type="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Recreate chart with new type
    if (candlestickChart) {
        candlestickChart.destroy();
    }
    initializeCandlestickChart();
    updateChartData();
}

// Generate sample candlestick data
function generateCandlestickData() {
    const data = [];
    const now = new Date();
    
    // CRITICAL FIX: Use current stock price instead of hardcoded old price
    let basePrice = stockData[currentStock]?.currentPrice || 462.75;
    
    for (let i = 100; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000); // 1 minute intervals
        
        const volatility = 0.5;
        const trend = Math.random() > 0.5 ? 1 : -1;
        
        const open = basePrice + (Math.random() - 0.5) * volatility;
        const close = open + trend * Math.random() * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        
        data.push({
            x: time,
            o: open,
            h: high,
            l: low,
            c: close
        });
        
        basePrice = close;
    }
    
    // Ensure last candlestick close matches current price
    if (stockData[currentStock]) {
        const lastIdx = data.length - 1;
        const currentPrice = stockData[currentStock].currentPrice;
        data[lastIdx].c = currentPrice;
        data[lastIdx].h = Math.max(data[lastIdx].h, currentPrice);
        data[lastIdx].l = Math.min(data[lastIdx].l, currentPrice);
    }
    
    return data;
}

// Load initial data
async function loadInitialData() {
    await loadStock('RELIANCE');
    updateWatchlist();
    updateScreener();
}

// Generate mock stock data (fallback only)
function generateMockStockData(symbol) {
    const basePrice = Math.random() * 3000 + 500; // Indian stock price range 500-3500
    const change = (Math.random() - 0.5) * 200; // Change range -100 to +100
    const currentPrice = basePrice + change;
    
    return {
        symbol: symbol,
        currentPrice: currentPrice,
        previousClose: basePrice,
        open: basePrice + (Math.random() - 0.5) * 50,
        high: currentPrice + Math.random() * 100,
        low: currentPrice - Math.random() * 100,
        volume: Math.floor(Math.random() * 5000000) + 100000,
        marketCap: generateMarketCapForSymbol(symbol),
        peRatio: (Math.random() * 40 + 10).toFixed(1),
        avgVolume: `${(Math.random() * 50 + 10).toFixed(1)}M`,
        dayRange: `₹${(currentPrice - 50).toFixed(2)} - ₹${(currentPrice + 50).toFixed(2)}`,
        week52Range: `₹${(currentPrice - 500).toFixed(2)} - ₹${(currentPrice + 500).toFixed(2)}`,
        exchange: 'NSE',
        sector: getSectorForSymbol(symbol)
    };
}

// Load stock data with real yfinance integration
async function loadStock(symbol) {
    currentStock = symbol;
    
    try {
        // Try to fetch real stock data from backend
        const response = await fetch(`${window.location.origin}/api/stock/${symbol}`);
        
        if (response.ok) {
            const stockInfo = await response.json();

            if (stockInfo.error) {
                showNotListedPopup(symbol);
                return;
            }
            
            // CRITICAL FIX: Save stock data so charts can access current price
            stockData[symbol] = stockInfo;
            
            updateStockInfo(stockInfo);
            
            // Update chart immediately with real yfinance data
            updateChartWithRealData(stockInfo);
            
            currentStock = symbol;
            
            // Run real AI analysis
            await runAIAnalysis(symbol);
            
            console.log(`✅ Loaded ${symbol} - Price: ₹${stockInfo.currentPrice}`);
            showNotification(`Loaded ${symbol} with real market data`, 'success');
        } else {
            showNotListedPopup(symbol);
        }
    } catch (error) {
        console.error('Error loading stock data:', error);
        showNotification('Failed to connect to server. Make sure Flask is running.', 'error');
    }
}

// Update stock information
function updateStockInfo(stockInfo) {
    console.log('Updating stock info:', stockInfo);
    
    // Update stock title
    document.getElementById('stockSymbol').textContent = stockInfo.symbol;
    document.getElementById('stockName').textContent = getStockFullName(stockInfo.symbol);
    document.getElementById('stockSector').textContent = stockInfo.sector || 'N/A';
    
    // Update current price display
    document.getElementById('currentPrice').textContent = `₹${stockInfo.currentPrice.toFixed(2)}`;
    
    const priceChange = stockInfo.currentPrice - stockInfo.previousClose;
    const priceChangePercent = stockInfo.changePercent || (priceChange / stockInfo.previousClose) * 100;
    
    const changeElement = document.getElementById('priceChange');
    changeElement.textContent = `${priceChange >= 0 ? '+' : ''}₹${Math.abs(priceChange).toFixed(2)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`;
    changeElement.className = `price-change ${priceChange >= 0 ? 'positive' : 'negative'}`;
    
    // Force refresh of price display
    document.getElementById('currentPrice').style.color = '#00ff88';
    setTimeout(() => {
        document.getElementById('currentPrice').style.color = '';
    }, 1000);
    
    // Update key stats - First row
    document.getElementById('openPrice').textContent = `₹${stockInfo.open.toFixed(2)}`;
    document.getElementById('dayRange').textContent = stockInfo.dayRange || `₹${stockInfo.low.toFixed(2)} - ₹${stockInfo.high.toFixed(2)}`;
    document.getElementById('volume').textContent = formatVolume(stockInfo.volume);
    document.getElementById('avgVolume').textContent = stockInfo.avgVolume || formatVolume(stockInfo.volume * 1.2);
    
    // Update key stats - Second row
    document.getElementById('highPrice').textContent = `₹${stockInfo.high.toFixed(2)}`;
    document.getElementById('week52Range').textContent = stockInfo.week52Range || `₹${(stockInfo.currentPrice * 0.8).toFixed(2)} - ₹${(stockInfo.currentPrice * 1.3).toFixed(2)}`;
    document.getElementById('marketCap').textContent = stockInfo.marketCap || generateMarketCapForSymbol(stockInfo.symbol);
    document.getElementById('peRatio').textContent = stockInfo.peRatio || (Math.random() * 40 + 10).toFixed(1);
    
    // Update key stats - Third row
    document.getElementById('lowPrice').textContent = `₹${stockInfo.low.toFixed(2)}`;
    document.getElementById('prevClose').textContent = `₹${stockInfo.previousClose.toFixed(2)}`;
    document.getElementById('exchange').textContent = stockInfo.exchange || 'NSE';
    document.getElementById('beta').textContent = stockInfo.beta || (Math.random() * 2 + 0.5).toFixed(2);
    
    // Update chart details
    updateChartDetails(stockInfo);
}

// Run AI Analysis
async function runAIAnalysis(symbol) {
    try {
        console.log('Starting AI analysis for:', symbol);
        
        const aiStatus = document.getElementById('aiStatus');
        if (aiStatus) {
            aiStatus.textContent = 'Running pattern analysis...';
            aiStatus.style.borderColor = '#ffa500';
        }
        
        const response = await fetch(`${window.location.origin}/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ symbol: symbol })
        });
        
        console.log('AI Response status:', response.status);
        
        if (response.ok) {
            const aiData = await response.json();
            console.log('AI Data received:', aiData);
            
            if (aiData.error) {
                throw new Error(aiData.error);
            }
            
            updateAIDisplay(aiData);
            
            // Show historical charts for the analyzed stock
            showHistoricalCharts(symbol);
            
            if (aiStatus) {
                aiStatus.textContent = 'Analysis complete';
                aiStatus.style.borderColor = '#00ff88';
            }
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('AI Analysis Error:', error);
        
        const aiStatus = document.getElementById('aiStatus');
        if (aiStatus) {
            aiStatus.textContent = 'Analysis unavailable';
            aiStatus.style.borderColor = '#ff4757';
        }
    }
}

// Show Historical Charts for Current Stock
function showHistoricalChartsForCurrentStock() {
    if (!currentStock) {
        showNotification('Please search for a stock first', 'error');
        return;
    }
    
    console.log('Manual trigger for:', currentStock);
    alert(`Triggering charts for: ${currentStock}`);
    showHistoricalCharts(currentStock);
}

// Show Historical Charts for AI Analysis
async function showHistoricalCharts(symbol) {
    try {
        console.log('Loading historical charts for:', symbol);
        
        // Test overlay creation
        alert(`About to create charts overlay for: ${symbol}`);
        
        // Add .NS suffix for Indian stocks
        const tickerSymbol = symbol.endsWith('.NS') ? symbol : symbol + '.NS';
        
        // Fetch historical data for multiple timeframes
        const [monthData, weekData, dayData] = await Promise.all([
            fetchHistoricalData(tickerSymbol, '1mo'),
            fetchHistoricalData(tickerSymbol, '1wk'),
            fetchHistoricalData(tickerSymbol, '1d')
        ]);
        
        // Create modal or section for historical charts
        showChartsModal(symbol, monthData, weekData, dayData);
        
    } catch (error) {
        console.error('Error loading historical charts:', error);
        showNotification('Failed to load historical charts', 'error');
    }
}

// Fetch Historical Data
async function fetchHistoricalData(symbol, period) {
    const response = await fetch(`${window.location.origin}/api/stock/${symbol}`);
    if (response.ok) {
        const data = await response.json();
        return {
            dates: data.dates,
            prices: data.prices,
            volumes: data.volumes,
            period: period
        };
    }
    return null;
}

// Show Charts Modal - Fullscreen Desktop Experience
function showChartsModal(symbol, monthData, weekData, dayData) {
    // Create fullscreen overlay instead of modal
    let overlay = document.getElementById('chartsFullscreenOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'chartsFullscreenOverlay';
        overlay.className = 'charts-fullscreen-overlay';
        overlay.innerHTML = `
            <div class="charts-fullscreen-content">
                <div class="charts-header">
                    <h3>Pattern Analysis - ${symbol}</h3>
                    <div class="header-controls">
                        <button class="close-btn" onclick="closeFullscreenCharts()">&times;</button>
                    </div>
                </div>
                <div class="charts-fullscreen-container">
                    <div class="chart-section">
                        <h4>1 Month Pattern</h4>
                        <canvas id="monthChart"></canvas>
                        <div class="pattern-info">
                            <p><strong>Patterns Found:</strong> <span id="monthPatterns">-</span></p>
                            <p><strong>Similarity:</strong> <span id="monthSimilarity">-</span>%</p>
                        </div>
                    </div>
                    <div class="chart-section">
                        <h4>1 Week Pattern</h4>
                        <canvas id="weekChart"></canvas>
                        <div class="pattern-info">
                            <p><strong>Patterns Found:</strong> <span id="weekPatterns">-</span></p>
                            <p><strong>Similarity:</strong> <span id="weekSimilarity">-</span>%</p>
                        </div>
                    </div>
                    <div class="chart-section">
                        <h4>1 Day Pattern</h4>
                        <canvas id="dayChart"></canvas>
                        <div class="pattern-info">
                            <p><strong>Patterns Found:</strong> <span id="dayPatterns">-</span></p>
                            <p><strong>Similarity:</strong> <span id="daySimilarity">-</span>%</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add fullscreen styles
        const style = document.createElement('style');
        style.textContent = `
            .charts-fullscreen-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%) !important;
                display: none !important;
                z-index: 99999 !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .charts-fullscreen-content {
                width: calc(100% - 40px) !important;
                height: calc(100% - 40px) !important;
                display: flex !important;
                flex-direction: column !important;
                padding: 20px !important;
                box-sizing: border-box !important;
                position: relative !important;
                top: 0 !important;
                left: 0 !important;
            }
            .charts-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 20px !important;
                padding-bottom: 15px !important;
                border-bottom: 1px solid #333 !important;
                flex-shrink: 0 !important;
            }
            .charts-header h3 {
                margin: 0 !important;
                color: #00d4ff !important;
                font-size: 24px !important;
                font-weight: 600 !important;
            }
            .charts-fullscreen-container {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 20px !important;
                flex: 1 !important;
                min-height: 0 !important;
                overflow-y: auto !important;
                position: relative !important;
            }
            .chart-section {
                background: #1a1a1a !important;
                border: 1px solid #2a2a2a !important;
                border-radius: 8px !important;
                padding: 20px !important;
                display: flex !important;
                flex-direction: column !important;
                min-height: 400px !important;
                position: relative !important;
            }
            .chart-section h4 {
                margin: 0 0 15px 0 !important;
                color: #00d4ff !important;
                text-align: center !important;
                font-size: 16px !important;
                flex-shrink: 0 !important;
            }
            .chart-section canvas {
                flex: 1 !important;
                min-height: 300px !important;
                width: 100% !important;
                position: relative !important;
                display: block !important;
            }
            .pattern-info {
                margin-top: 15px !important;
                padding: 15px !important;
                background: #252525 !important;
                border-radius: 6px !important;
                border: 1px solid #333 !important;
                flex-shrink: 0 !important;
            }
            .pattern-info p {
                margin: 8px 0 !important;
                font-size: 14px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
            }
            .pattern-info strong {
                color: #00ff88 !important;
                font-weight: 600 !important;
            }
            .close-btn {
                background: #ff4757 !important;
                border: none !important;
                color: white !important;
                padding: 8px 16px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 16px !important;
                font-weight: 600 !important;
                flex-shrink: 0 !important;
            }
            .close-btn:hover {
                background: #ff6b6b !important;
            }
            @media (max-width: 1200px) {
                .charts-fullscreen-container {
                    grid-template-columns: 1fr !important;
                    gap: 15px !important;
                }
            }
            @media (max-width: 768px) {
                .charts-fullscreen-container {
                    grid-template-columns: 1fr !important;
                    gap: 10px !important;
                }
                .chart-section {
                    padding: 15px !important;
                }
                .charts-fullscreen-content {
                    padding: 15px !important;
                }
                .charts-header h3 {
                    font-size: 20px !important;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
    }
    
    // Update content
    overlay.querySelector('.charts-header h3').textContent = `Pattern Analysis - ${symbol}`;
    
    // Show fullscreen overlay
    overlay.style.display = 'block';
    
    // Create charts after overlay is visible
    setTimeout(() => {
        createHistoricalChart('monthChart', monthData, '1 Month');
        createHistoricalChart('weekChart', weekData, '1 Week');
        createHistoricalChart('dayChart', dayData, '1 Day');
        
        // Update pattern information
        updatePatternInfo(monthData, weekData, dayData);
    }, 100);
}

// Create Historical Chart
function createHistoricalChart(canvasId, data, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates.slice(-50), // Last 50 data points
            datasets: [{
                label: `${label} Price`,
                data: data.prices.slice(-50),
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#00d4ff',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#888',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#888',
                        callback: function(value) {
                            return '₹' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Update Pattern Information
function updatePatternInfo(monthData, weekData, dayData) {
    // Simulate pattern counts based on data length
    document.getElementById('monthPatterns').textContent = monthData ? monthData.prices.length : '-';
    document.getElementById('weekPatterns').textContent = weekData ? weekData.prices.length : '-';
    document.getElementById('dayPatterns').textContent = dayData ? dayData.prices.length : '-';
    
    // Simulate similarity scores
    document.getElementById('monthSimilarity').textContent = monthData ? (Math.random() * 30 + 60).toFixed(1) : '-';
    document.getElementById('weekSimilarity').textContent = weekData ? (Math.random() * 25 + 65).toFixed(1) : '-';
    document.getElementById('daySimilarity').textContent = dayData ? (Math.random() * 20 + 70).toFixed(1) : '-';
}

// Close Fullscreen Charts
function closeFullscreenCharts() {
    const overlay = document.getElementById('chartsFullscreenOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Remove old closeChartsModal function to avoid conflicts

// Generate Mock AI Data
function generateMockAIData(symbol) {
    const baseReturn = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const confidence = Math.random() * 30 + 60; // 60-90%
    const patternStrength = Math.random() * 40 + 40; // 40-80%
    
    return {
        symbol: symbol,
        confidence: confidence,
        targetReturn: (baseReturn * 100).toFixed(2),
        accuracy: Math.min(95, confidence + 5),
        analysis: {
            best: (Math.abs(baseReturn) + Math.random() * 0.02).toFixed(4),
            worst: (Math.abs(baseReturn) - Math.random() * 0.02).toFixed(4)
        },
        recommendation: baseReturn > 0 ? 'BUY' : 'SELL',
        patternStrength: patternStrength
    };
}

// Update AI Display
function updateAIDisplay(aiData) {
    // Handle both real AI data and mock data
    if (aiData.direction) {
        // Real algorithm data format
        document.getElementById('patternStrength').textContent = `${(aiData.confidence * 0.8).toFixed(0)}%`;
        document.getElementById('confidence').textContent = `${aiData.confidence.toFixed(0)}%`;
        document.getElementById('targetReturn').textContent = `${aiData.targetReturn}%`;
        
        document.getElementById('bestCase').textContent = `${aiData.analysis.best}%`;
        document.getElementById('worstCase').textContent = `${aiData.analysis.worst}%`;
        
        const recElement = document.getElementById('recommendation');
        recElement.textContent = aiData.direction;
        recElement.className = `analysis-value ${aiData.direction === 'BULLISH' ? 'positive' : 'negative'}`;
    } else {
        // Mock data format
        document.getElementById('patternStrength').textContent = `${aiData.patternStrength.toFixed(0)}%`;
        document.getElementById('confidence').textContent = `${aiData.confidence.toFixed(0)}%`;
        document.getElementById('targetReturn').textContent = `${aiData.targetReturn}%`;
        
        document.getElementById('bestCase').textContent = `${aiData.analysis.best}%`;
        document.getElementById('worstCase').textContent = `${aiData.analysis.worst}%`;
        
        const recElement = document.getElementById('recommendation');
        recElement.textContent = aiData.recommendation;
        recElement.className = `analysis-value ${aiData.recommendation === 'BUY' ? 'positive' : 'negative'}`;
    }
}
function getStockFullName(symbol) {
    const names = {
        'RELIANCE': 'Reliance Industries Ltd.',
        'TCS': 'Tata Consultancy Services Ltd.',
        'HDFCBANK': 'HDFC Bank Ltd.',
        'INFY': 'Infosys Ltd.',
        'ICICIBANK': 'ICICI Bank Ltd.',
        'HINDUNILVR': 'Hindustan Unilever Ltd.',
        'SBIN': 'State Bank of India',
        'BHARTIARTL': 'Bharti Airtel Ltd.',
        'KOTAKBANK': 'Kotak Mahindra Bank Ltd.',
        'LT': 'Larsen & Toubro Ltd.',
        'ITC': 'ITC Ltd.',
        'AXISBANK': 'Axis Bank Ltd.',
        'MARUTI': 'Maruti Suzuki India Ltd.',
        'BAJFINANCE': 'Bajaj Finance Ltd.',
        'WIPRO': 'Wipro Ltd.',
        'HCLTECH': 'HCL Technologies Ltd.',
        'TATAMOTORS': 'Tata Motors Ltd.',
        'SUNPHARMA': 'Sun Pharmaceutical Industries Ltd.',
        'M&M': 'Mahindra & Mahindra Ltd.',
        'ASIANPAINT': 'Asian Paints Ltd.',
        'TITAN': 'Titan Company Ltd.',
        'NESTLEIND': 'Nestle India Ltd.',
        'ULTRACEMCO': 'UltraTech Cement Ltd.'
    };
    
    return names[symbol] || `${symbol} Ltd.`;
}

// Update chart details
function updateChartDetails(stockInfo) {
    const details = document.getElementById('chartDetails');
    const volumeSMA = document.getElementById('volumeSMA');
    
    details.textContent = `O₹${stockInfo.open.toFixed(3)} H₹${stockInfo.high.toFixed(3)} L₹${stockInfo.low.toFixed(3)} C₹${stockInfo.currentPrice.toFixed(3)} ₹${(stockInfo.currentPrice - stockInfo.open).toFixed(3)} (${((stockInfo.currentPrice - stockInfo.open) / stockInfo.open * 100).toFixed(2)}%)`;
    
    volumeSMA.textContent = `Volume SMA 9: ${formatVolume(stockInfo.volume * 0.9)}`;
}

// (updateChartData defined above — uses real yfinance data)

// Update watchlist
function updateWatchlist() {
    const watchlistItems = document.querySelectorAll('.watchlist-item');
    watchlistItems.forEach(item => {
        const symbol = item.querySelector('.symbol').textContent;
        const mockData = generateMockStockData(symbol);
        
        item.querySelector('.price').textContent = `₹${mockData.currentPrice.toFixed(2)}`;
        
        const change = mockData.currentPrice - mockData.previousClose;
        const changePercent = (change / mockData.previousClose) * 100;
        
        const changeElement = item.querySelector('.change');
        const changePercentElement = item.querySelector('.change-percent');
        
        changeElement.textContent = `${change >= 0 ? '+' : ''}${Math.abs(change).toFixed(2)}`;
        changeElement.className = `change ${change >= 0 ? 'positive' : 'negative'}`;
        
        changePercentElement.textContent = `(${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
        changePercentElement.className = `change-percent ${changePercent >= 0 ? 'positive' : 'negative'}`;
    });
}

// Update screener
function updateScreener() {
    const screenerItems = document.querySelectorAll('.screener-item');
    screenerItems.forEach(item => {
        const symbol = item.querySelector('.symbol').textContent;
        const mockData = generateMockStockData(symbol);
        
        item.querySelector('.price').textContent = `₹${mockData.currentPrice.toFixed(2)}`;
        
        const change = mockData.currentPrice - mockData.previousClose;
        const changePercent = (change / mockData.previousClose) * 100;
        
        const changeElement = item.querySelector('.change');
        const changePercentElement = item.querySelector('.change-percent');
        
        changeElement.textContent = `${change >= 0 ? '+' : ''}${Math.abs(change).toFixed(2)}`;
        changeElement.className = `change ${change >= 0 ? 'positive' : 'negative'}`;
        
        changePercentElement.textContent = `(${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
        changePercentElement.className = `change-percent ${changePercent >= 0 ? 'positive' : 'negative'}`;
    });
}

// Generate mock stock data
function generateMockStockData(symbol) {
    const basePrice = Math.random() * 3000 + 500; // Indian stock price range 500-3500
    const change = (Math.random() - 0.5) * 200; // Change range -100 to +100
    const currentPrice = basePrice + change;
    
    return {
        symbol: symbol,
        currentPrice: currentPrice,
        previousClose: basePrice,
        open: basePrice + (Math.random() - 0.5) * 50,
        high: currentPrice + Math.random() * 100,
        low: currentPrice - Math.random() * 100,
        volume: Math.floor(Math.random() * 5000000) + 100000,
        marketCap: generateMarketCapForSymbol(symbol),
        peRatio: (Math.random() * 40 + 10).toFixed(1),
        avgVolume: `${(Math.random() * 50 + 10).toFixed(1)}M`,
        dayRange: `₹${(currentPrice - 50).toFixed(2)} - ₹${(currentPrice + 50).toFixed(2)}`,
        week52Range: `₹${(currentPrice - 500).toFixed(2)} - ₹${(currentPrice + 500).toFixed(2)}`,
        exchange: 'NSE',
        sector: getSectorForSymbol(symbol)
    };
}

// Generate market cap based on symbol
function generateMarketCapForSymbol(symbol) {
    const largeCaps = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR'];
    const midCaps = ['TATAMOTORS', 'MARUTI', 'BAJFINANCE', 'WIPRO', 'HCLTECH'];
    
    if (largeCaps.includes(symbol)) {
        return `₹${(Math.random() * 10 + 5).toFixed(1)}T`;
    } else if (midCaps.includes(symbol)) {
        return `₹${(Math.random() * 500 + 100).toFixed(0)}B`;
    } else {
        return `₹${(Math.random() * 50 + 10).toFixed(1)}B`;
    }
}

// Get sector based on symbol
function getSectorForSymbol(symbol) {
    const sectors = {
        'RELIANCE': 'Energy',
        'TCS': 'Technology',
        'HDFCBANK': 'Banking',
        'INFY': 'Technology',
        'ICICIBANK': 'Banking',
        'HINDUNILVR': 'FMCG',
        'SBIN': 'Banking',
        'BHARTIARTL': 'Telecom',
        'KOTAKBANK': 'Banking',
        'LT': 'Infrastructure',
        'ITC': 'FMCG',
        'AXISBANK': 'Banking',
        'MARUTI': 'Automotive',
        'BAJFINANCE': 'Financial',
        'WIPRO': 'Technology',
        'HCLTECH': 'Technology',
        'TATAMOTORS': 'Automotive',
        'SUNPHARMA': 'Pharma',
        'M&M': 'Automotive',
        'ASIANPAINT': 'Paints',
        'TITAN': 'Consumer Goods',
        'NESTLEIND': 'FMCG',
        'ULTRACEMCO': 'Cement'
    };
    
    return sectors[symbol] || 'Diversified';
}

// Format volume
function formatVolume(volume) {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toString();
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    };
    
    const formatted = now.toLocaleDateString('en-US', options);
    document.getElementById('datetime').textContent = formatted.replace(',', ' -');
}

// Start real-time updates
function startRealTimeUpdates() {
    // Update time every second
    setInterval(updateDateTime, 1000);
    
    // Update stock data every 30 seconds during market hours
    setInterval(() => {
        updateCurrentStockData();
        updateIndicesData();
        updateGainersLosersData();
    }, 30000); // 30 seconds for real-time updates
    
    // Check if market is open
    setInterval(checkMarketHours, 60000); // Check every minute
}

// Check if market is open (9:15 AM - 3:30 PM IST)
function checkMarketHours() {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // IST is UTC+5:30
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const day = istTime.getDay();
    
    // Market is open Monday-Friday, 9:15 AM to 3:30 PM IST
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = (hours > 9 || (hours === 9 && minutes >= 15)) && hours < 15 || (hours === 15 && minutes <= 30);
    
    const isMarketOpen = isWeekday && isMarketHours;
    
    // Update market status
    const marketStatus = document.getElementById('marketStatus');
    if (marketStatus) {
        marketStatus.textContent = isMarketOpen ? '🟢 Market Open' : '🔴 Market Closed';
        marketStatus.className = isMarketOpen ? 'market-open' : 'market-closed';
    }
    
    return isMarketOpen;
}

// Update current stock data in real-time
async function updateCurrentStockData() {
    if (!currentStock || !checkMarketHours()) {
        return; // Don't update if market is closed
    }
    
    try {
        const response = await fetch(`${window.location.origin}/api/stock/${currentStock}`);
        
        if (response.ok) {
            const stockInfo = await response.json();
            
            if (stockInfo.error) return;
            
            // CRITICAL FIX: Update stockData for charts
            stockData[currentStock] = stockInfo;
            
            updateStockInfo(stockInfo);
            updateChartWithRealData(stockInfo);
            
            console.log(`🔄 Auto-updated ${currentStock} - Price: ₹${stockInfo.currentPrice}`);
            
            // Run AI analysis every 5 minutes
            const now = Date.now();
            if (!lastAIAnalysis || now - lastAIAnalysis > 300000) { // 5 minutes
                await runAIAnalysis(currentStock);
                lastAIAnalysis = now;
            }
        }
    } catch (error) {
        console.error('Error updating stock data:', error);
    }
}

// Initialize
let lastAIAnalysis = 0;

// Update gainers and losers data
function updateGainersLosersData() {
    loadGainersLosers();
}

// Update account information
function updateAccountInfo() {
    // Simulate P/L changes
    const plDay = document.getElementById('plDay');
    const currentPL = parseFloat(plDay.textContent.replace(/[₹,]/g, ''));
    const newPL = currentPL + (Math.random() - 0.5) * 50;
    
    plDay.textContent = `${newPL >= 0 ? '+' : ''}₹${Math.abs(newPL).toFixed(2)}`;
    plDay.className = `value ${newPL >= 0 ? 'positive' : 'negative'}`;
    
    const unrealizedPL = document.getElementById('unrealizedPL');
    const currentUnrealized = parseFloat(unrealizedPL.textContent.replace(/[₹,]/g, ''));
    const newUnrealized = currentUnrealized + (Math.random() - 0.5) * 30;
    
    unrealizedPL.textContent = `${newUnrealized >= 0 ? '+' : ''}₹${Math.abs(newUnrealized).toFixed(2)}`;
    unrealizedPL.className = `value ${newUnrealized >= 0 ? 'positive' : 'negative'}`;
}

// UI Functions
function toggleIndicators() {
    alert('Technical indicators panel would open here');
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update screener content based on tab
    updateScreener();
}

function switchOrderTab(tabName) {
    const tabs = document.querySelectorAll('.tab-nav .tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function setOrderType(type) {
    orderType = type;
}

function placeOrder(action) {
    const quantity = document.getElementById('orderQuantity').value;
    const price = document.getElementById('orderPrice').value;
    const symbol = currentStock;
    
    // Add order to orders table
    const ordersTable = document.querySelector('.orders-table');
    const newRow = document.createElement('div');
    newRow.className = 'orders-row';
    newRow.innerHTML = `
        <span class="action ${action}">${action.toUpperCase()}</span>
        <span>${symbol}</span>
        <span>₹${parseFloat(price).toFixed(2)}</span>
        <span>${quantity}</span>
    `;
    
    ordersTable.appendChild(newRow);
    
    // Show confirmation
    alert(`${action.toUpperCase()} order placed: ${quantity} shares of ${symbol} at ₹${price}`);
}

function showAddSymbolModal() {
    document.getElementById('addSymbolModal').style.display = 'flex';
}

function closeAddSymbolModal() {
    document.getElementById('addSymbolModal').style.display = 'none';
}

function addSymbol() {
    const symbol = document.getElementById('newSymbol').value.toUpperCase();
    if (symbol) {
        // Add to watchlist
        const watchlistTable = document.querySelector('.watchlist-table');
        const newItem = document.createElement('div');
        newItem.className = 'watchlist-item';
        newItem.onclick = () => loadStock(symbol);
        
        const mockData = generateMockStockData(symbol);
        const change = mockData.currentPrice - mockData.previousClose;
        const changePercent = (change / mockData.previousClose) * 100;
        
        newItem.innerHTML = `
            <span class="symbol">${symbol}</span>
            <span class="price">₹${mockData.currentPrice.toFixed(2)}</span>
            <span class="change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${Math.abs(change).toFixed(2)}</span>
            <span class="change-percent ${changePercent >= 0 ? 'positive' : 'negative'}">(${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)</span>
        `;
        
        watchlistTable.appendChild(newItem);
        closeAddSymbolModal();
        document.getElementById('newSymbol').value = '';
    }
}

// Modal close on outside click
window.onclick = function(event) {
    const addSymbolModal = document.getElementById('addSymbolModal');
    const dashboardModal = document.getElementById('dashboardModal');
    
    if (event.target == addSymbolModal) {
        closeAddSymbolModal();
    }
    
    if (event.target == dashboardModal) {
        closeDashboardModal();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddSymbolModal();
        closeDashboardModal();
    }
    
    // Number keys for quick stock selection
    if (e.key >= '1' && e.key <= '5') {
        const stocks = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];
        const index = parseInt(e.key) - 1;
        if (stocks[index]) {
            loadStock(stocks[index]);
        }
    }
});

// Cleanup
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
