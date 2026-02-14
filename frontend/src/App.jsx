import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import ExecutionPanel from './ExecutionPanel'; // Import the new Web3 component

// Use environment variable if available, otherwise fallback to your backend URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const WarningBox = ({ customStyle }) => (
  <div style={{
    color: '#a3a3a3',
    fontWeight: 'bold',
    fontSize: '12px',
    textAlign: 'center',
    border: '1px solid #333',
    backgroundColor: '#0a0a0a',
    padding: '12px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    ...customStyle
  }}>
    <span style={{ color: '#ef4444' }}>⚠️ Not Financial Advice</span> <br/> 
    <span style={{fontSize: '10px', fontWeight: 'normal'}}>
      Project for educational purposes only
    </span>
  </div>
);

function App() {
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- NEW ZOOM STATE VARIABLES ---
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');
  const [left, setLeft] = useState('dataMin');
  const [right, setRight] = useState('dataMax');

  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/cryptos`);
        const data = await response.json(); 
        
        const cryptoList = data.cryptos || [];
        setCryptos(cryptoList);

        if (cryptoList.length > 0) {
          setSelectedCrypto(cryptoList[0]);
          loadChartData(cryptoList[0].symbol);
        }
      } catch (error) {
        console.error('Error fetching cryptos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptos();
  }, []);

  const loadChartData = async (symbol) => {
    try {
      const response = await fetch(`${API_URL}/history/${symbol}`);
      const data = await response.json();
      if (data.data) {
        setChartData(data.data);
        // Reset zoom when loading new coin
        setLeft('dataMin');
        setRight('dataMax');
      }
    } catch (error) {
      console.error('Chart load failed:', error);
    }
  };

  const refreshCrypto = async (symbol) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/analyze/${symbol}`);
      const data = await response.json();
      
      setSelectedCrypto(data);
      await loadChartData(symbol);
      setCryptos(prev => prev.map(c => c.symbol === symbol ? data : c));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- ZOOM LOGIC ---
  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    let [l, r] = [refAreaLeft, refAreaRight];
    if (l > r) [l, r] = [r, l];

    setLeft(l);
    setRight(r);
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const zoomOut = () => {
    setLeft('dataMin');
    setRight('dataMax');
  };

  // Filter logic for the search bar
  const filteredCryptos = cryptos.filter(crypto => 
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const signalStyle = (signal) => {
    const s = signal?.toUpperCase() || "";
    if (s.includes('BUY') || s.includes('GOOD')) {
      return { color: '#10b981', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }; 
    }
    if (s.includes('SELL') || s.includes('BAD') || s.includes('DE-PEG')) {
      return { color: '#ef4444', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }; 
    }
    return { color: '#a3a3a3', borderColor: '#555', backgroundColor: '#111' }; 
  };

  const getSignalIcon = (signal) => {
    const s = signal?.toUpperCase() || "";
    if (s.includes('BUY')) return '▲';
    if (s.includes('SELL')) return '▼';
    return '■'; 
  };

  // Helper function to safely parse domain names from URLs
  const getDomainName = (urlStr) => {
    try {
      return new URL(urlStr).hostname.replace('www.', '');
    } catch (e) {
      return urlStr;
    }
  };

  // Hardcoded map for demo execution panel
  const getTokenAddress = (symbol) => {
    const addresses = {
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    };
    return addresses[symbol] || '0x0000000000000000000000000000000000000000';
  };

  if (loading && !cryptos.length) {
    return (
      <div style={{ 
        height: '100vh', 
        background: '#0a0a0a', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#fff' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #333',
          borderTop: '3px solid #fff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '30px'
        }}></div>
        <h2 style={{fontWeight: '400', marginBottom: '30px', letterSpacing: '1px'}}>Initializing Engine...</h2>
        <WarningBox customStyle={{ marginBottom: '30px', maxWidth: '300px' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      background: '#0a0a0a', 
      color: '#e5e5e5',
      minHeight: '100vh',
      padding: '20px',
      position: 'relative'
    }}>

      {/* OVERLAY */}
      {loading && cryptos.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #333', borderTop: '3px solid #fff',
            borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px'
          }}></div>
          <div style={{ fontSize: '1.2rem', fontWeight: '600', letterSpacing: '1px' }}>PROCESSING...</div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '40px', borderBottom: '1px solid #222', paddingBottom: '20px' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            margin: '0 0 10px 0',
            fontWeight: '700',
            letterSpacing: '-0.5px',
            color: '#fff'
          }}>
            SYSTEM: LIQUIDITY ENGINE
          </h1>
          <div style={{ color: '#888', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Autonomous Quant Analysis • Status: Online  - Runs a market analysis and predictively tells you if you should buy a coin or not
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
          
          {/* LEFT PANEL - CONTROLS & METRICS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* SEARCH TILE */}
            <div style={{ background: '#111', padding: '25px', borderRadius: '4px', border: '1px solid #222' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '14px', letterSpacing: '1px' }}>ASSET SELECTOR</h3>
              <input
                type="text"
                placeholder="Search symbol (e.g. BTC)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '12px 15px', background: '#000', color: '#fff',
                  border: '1px solid #444', borderRadius: '4px', fontSize: '14px', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box', marginBottom: '15px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#888'}
                onBlur={(e) => e.target.style.borderColor = '#444'}
                disabled={loading}
              />
              <select
                value={selectedCrypto?.symbol || ''}
                onChange={(e) => {
                  const crypto = cryptos.find(c => c.symbol === e.target.value);
                  if (crypto) {
                    setSelectedCrypto(crypto);
                    loadChartData(crypto.symbol);
                  }
                }}
                style={{
                  width: '100%', padding: '12px 15px', background: '#000', color: '#fff',
                  border: '1px solid #444', borderRadius: '4px', fontSize: '14px', outline: 'none',
                  cursor: 'pointer'
                }}
                disabled={loading}
              >
                <option value="">Select asset...</option>
                {filteredCryptos.map(crypto => (
                  <option key={crypto.symbol} value={crypto.symbol}>
                    {crypto.symbol} ({crypto.signal})
                  </option>
                ))}
              </select>
            </div>

            {selectedCrypto && (
              <div style={{ background: '#111', padding: '25px', borderRadius: '4px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888', letterSpacing: '1px' }}>SELECTED ASSET</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{selectedCrypto.symbol}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#888', letterSpacing: '1px' }}>CURRENT PRICE</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>${selectedCrypto.current_price}</div>
                  </div>
                </div>

                {/* SIGNAL CARD */}
                <div style={{
                  ...signalStyle(selectedCrypto.signal),
                  padding: '20px', borderRadius: '4px', borderWidth: '1px', borderStyle: 'solid',
                  marginBottom: '20px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '1px' }}>
                    {getSignalIcon(selectedCrypto.signal)} {selectedCrypto.signal}
                  </div>
                </div>

                {/* METRICS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ background: '#000', padding: '15px', border: '1px solid #222', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>MODEL SCORE</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{selectedCrypto.final_score}</div>
                  </div>
                  <div style={{ background: '#000', padding: '15px', border: '1px solid #222', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>Z-SCORE (STD DEV)</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{selectedCrypto.value_coefficient?.toFixed(2)}</div>
                  </div>
                  
                  {selectedCrypto.components?.volatility_pct !== undefined && (
                    <div style={{ background: '#000', padding: '15px', border: '1px solid #222', borderRadius: '4px' }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>VOLATILITY (1Y)</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                        {selectedCrypto.components.volatility_pct}%
                      </div>
                    </div>
                  )}
                  {selectedCrypto.components?.stability_score !== undefined && (
                    <div style={{ background: '#000', padding: '15px', border: '1px solid #222', borderRadius: '4px' }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>STABILITY INDEX</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                        {selectedCrypto.components.stability_score}
                      </div>
                    </div>
                  )}
                </div>

                {/* BUTTONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => refreshCrypto(selectedCrypto.symbol)}
                    disabled={loading}
                    style={{
                      width: '100%', padding: '14px', background: '#fff', color: '#000',
                      border: '1px solid #fff', borderRadius: '4px', fontSize: '14px', fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '1px', transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => !loading && (e.target.style.background = '#ddd')}
                    onMouseOut={(e) => !loading && (e.target.style.background = '#fff')}
                  >
                    {loading ? 'ANALYZING...' : 'FORCE RE-ANALYZE'}
                  </button>

                  <a
                    href={`https://exchange.coinbase.com/trade/${selectedCrypto.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block', padding: '14px', background: '#000', color: '#fff',
                      textAlign: 'center', textDecoration: 'none', border: '1px solid #444', borderRadius: '4px',
                      fontSize: '14px', fontWeight: '600', letterSpacing: '1px', transition: 'border-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.borderColor = '#fff'}
                    onMouseOut={(e) => e.target.style.borderColor = '#444'}
                  >
                    VIEW ON EXCHANGE ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - CHART & EXECUTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* CHART */}
            <div 
              style={{
                background: '#faf1f1', padding: '25px', borderRadius: '4px',
                border: '1px solid #222', height: 'fit-content', userSelect: 'none'
              }}
              onDoubleClick={zoomOut}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', color: '#000000' }}>
                  PRICE ACTION (LAST {chartData.length} DAYS) - Drag to Zoom, Double Click to Reset
                </h3>
              </div>
              
              {chartData.length > 0 ? (
                <div style={{ width: '100%', height: '450px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={chartData} 
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e) => refAreaLeft && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        domain={[left, right]}
                        allowDataOverflow
                        stroke="#000000" 
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                        minTickGap={30}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        stroke="#000000" 
                        tickFormatter={(v) => `$${v}`} 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', borderColor: '#444', borderRadius: '4px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#000000" 
                        strokeWidth={2}
                        dot={false}
                        animationDuration={300}
                        activeDot={{ r: 6, fill: '#fff', stroke: '#000', strokeWidth: 2 }}
                      />
                      
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#3b82f6" />
                      ) : null}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                  NO DATA AVAILABLE
                </div>
              )}
            </div>

            {/* WEB3 EXECUTION PANEL */}
            {selectedCrypto && (
              <ExecutionPanel 
                tokenSymbol={selectedCrypto.symbol} 
                tokenAddress={getTokenAddress(selectedCrypto.symbol)} 
              />
            )}

          </div>
        </div>  

        {/* --- NEW: SENTIMENT & DISCLAIMER ROW --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', marginTop: '20px' }}>
          
          {/* Left: Sentiment Analysis Box */}
          <div style={{
            background: '#111', padding: '25px', borderRadius: '4px', border: '1px solid #222',
            display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', color: '#fff', textTransform: 'uppercase' }}>
                AI Sentiment Analysis
              </h3>
              
              {selectedCrypto && (
                <span style={{
                  color: selectedCrypto?.components?.ai_sentiment === 'good' ? '#10b981' : 
                         selectedCrypto?.components?.ai_sentiment === 'bad' ? '#ef4444' : '#a3a3a3',
                  fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', padding: '4px 10px',
                  background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid #333'
                }}>
                  {selectedCrypto?.components?.ai_sentiment || 'OK'}
                </span>
              )}
            </div>
            
            <div style={{ color: '#888', fontSize: '14px' }}>
              {!selectedCrypto ? (
                'AWAITING ASSET SELECTION...'
              ) : (
                <>
                  <div style={{ color: '#d4d4d8', marginBottom: '20px', lineHeight: '1.5', fontStyle: 'italic', fontSize: '13px' }}>
                    "{selectedCrypto.components?.ai_analysis || 'Awaiting live AI analysis...'}"
                  </div>

                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Sources:</div>
                  {selectedCrypto.components?.ai_links && selectedCrypto.components.ai_links.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedCrypto.components.ai_links.map((link, idx) => (
                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '13px' }}>
                          ↳ {getDomainName(link)} ↗
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#555' }}>No sources provided by AI.</div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Disclaimer Warning Box */}
          <WarningBox customStyle={{ 
            maxWidth: '100%', margin: '0', height: '100%', display: 'flex', flexDirection: 'column', 
            justifyContent: 'center', boxSizing: 'border-box'
          }} />

        </div>

        {/* BOTTOM GRID - SEARCHABLE MARKET OVERVIEW */}
        {!loading && cryptos.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', letterSpacing: '1px', color: '#fff', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
              MARKET OVERVIEW {searchTerm && `(Filtered)`}
            </h3>
            
            {filteredCryptos.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#111', border: '1px solid #222', borderRadius: '4px' }}>
                No assets found matching "{searchTerm}"
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
                {filteredCryptos.map(crypto => {
                   const style = signalStyle(crypto.signal);
                   const isSelected = selectedCrypto?.symbol === crypto.symbol;
                   return (
                    <div
                      key={crypto.symbol}
                      onClick={() => {
                        setSelectedCrypto(crypto);
                        loadChartData(crypto.symbol);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        padding: '20px', background: isSelected ? '#1a1a1a' : '#111', borderRadius: '4px', cursor: 'pointer',
                        border: `1px solid ${isSelected ? '#fff' : '#222'}`, borderLeft: `4px solid ${style.borderColor}`,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        if(!isSelected) e.currentTarget.style.borderColor = '#444';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        if(!isSelected) e.currentTarget.style.borderColor = '#d2cece';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                          {crypto.symbol}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          ${crypto.current_price}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: style.color, marginBottom: '8px', letterSpacing: '0.5px' }}>
                        {crypto.signal}
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        SCORE: {crypto.final_score} | Z-SCORE: {crypto.value_coefficient?.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;