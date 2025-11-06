import React, { useState, useEffect, useCallback } from 'react';
import TickerBanner from './components/TickerBanner';
import CandlestickChart from './components/CandlestickChart';
import TechnicalMetrics from './components/TechnicalMetrics';
import ParametersPanel from './components/ParametersPanel';
import SignalsPanel from './components/SignalsPanel';
import AssetSelector from './components/AssetSelector';
import TimezoneSelector from './components/TimezoneSelector';
import { Asset, CandleData, IndicatorParams, Signal, IndicatorData, FullCandleData } from './types';
import { fetchChartData, fetchTickerData } from './utils/api';
import { generateSignalsAndIndicators } from './utils/technicalIndicators';
import { LoaderCircle } from 'lucide-react';

const CRYPTO_ASSETS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'BNB-USD', 'DOGE-USD', 'TRX-USD', 'USDC-USD', 'USDT-USD', 'TRUMP-USD'];

function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC-USD');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [fullData, setFullData] = useState<FullCandleData[]>([]);
  
  const [params, setParams] = useState<IndicatorParams>({
    adxPeriod: 14,
    adxThreshold: 20,
    slopeWindow: 14,
    slopeSmooth: 5,
    gogSpan: 5,
    swingLeft: 3,
    swingRight: 3,
    fiboRetrLow: 0.382,
    fiboRetrHigh: 0.618,
  });

  const [indicators, setIndicators] = useState<IndicatorData>({ adx: 0, slope: 0, gog: 0 });
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timezone, setTimezone] = useState<string>('America/Sao_Paulo');
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number } | null>(null);

  const loadChartData = useCallback(async (symbol: string) => {
    setIsLoading(true);
    const data = await fetchChartData(symbol);
    if (data.length > 0) {
      setCandleData(data);
      setLastUpdated(new Date());
      // Set initial visible range based on default zoom (50% to 100%)
      const initialStartIndex = Math.floor(data.length * 0.50);
      setVisibleRange({ start: initialStartIndex, end: data.length });
    }
    setIsLoading(false);
  }, []);

  const updateTickerData = useCallback(async () => {
    const data = await fetchTickerData(CRYPTO_ASSETS);
    if (data.length > 0) {
      setAssets(data);
    }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await Promise.all([
        updateTickerData(),
        loadChartData(selectedAsset)
      ]);
      setIsLoading(false);
    };
    initialLoad();
  }, []);

  useEffect(() => {
    const tickerInterval = setInterval(updateTickerData, 60 * 1000);
    const chartInterval = setInterval(() => loadChartData(selectedAsset), 60 * 1000);

    return () => {
      clearInterval(tickerInterval);
      clearInterval(chartInterval);
    };
  }, [selectedAsset, loadChartData, updateTickerData]);

  useEffect(() => {
    if (candleData.length > 0) {
      const { fullData: newFullData, signals: newSignals } = generateSignalsAndIndicators(candleData, params);
      
      setFullData(newFullData);

      if (newFullData.length > 0) {
        const lastIndicator = newFullData[newFullData.length - 1];
        setIndicators({
          adx: lastIndicator.adx,
          slope: lastIndicator.slope,
          gog: lastIndicator.gog
        });
      }
      
      setSignals(newSignals.sort((a, b) => b.timestamp - a.timestamp));
    }
  }, [candleData, params]);

  const handleAssetSelect = (symbol: string) => {
    if (symbol !== selectedAsset) {
      setSelectedAsset(symbol);
      setSignals([]);
      setFullData([]);
      setVisibleRange(null);
      loadChartData(symbol);
    }
  };

  const handleDataZoom = useCallback((event: any) => {
    if (candleData.length === 0) return;
    
    // ECharts can send a batch of events, we take the first one.
    const zoomEvent = Array.isArray(event.batch) ? event.batch[0] : event;
    
    if (zoomEvent && typeof zoomEvent.startValue !== 'undefined') {
        // This is a data-based zoom, gives indices
        setVisibleRange({ start: zoomEvent.startValue, end: zoomEvent.endValue });
    } else if (zoomEvent && typeof zoomEvent.start !== 'undefined') {
        // This is a percentage-based zoom
        const startIndex = Math.floor(candleData.length * (zoomEvent.start / 100));
        const endIndex = Math.ceil(candleData.length * (zoomEvent.end / 100));
        setVisibleRange({ start: startIndex, end: endIndex });
    }
  }, [candleData]);

  const visibleData = visibleRange ? fullData.slice(visibleRange.start, visibleRange.end + 1) : [];
  const adxHistory = visibleData.map(d => d.adx);
  const gogHistory = visibleData.map(d => d.gog);
  const slopeHistory = visibleData.map(d => d.slope);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-50">
          <LoaderCircle className="w-16 h-16 text-blue-500 animate-spin" />
          <p className="mt-4 text-lg font-semibold">Carregando dados...</p>
        </div>
      )}
      <TickerBanner assets={assets} />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Análise de Criptoativos
          </h1>
          <div className="flex items-center flex-wrap gap-4">
            {lastUpdated && (
              <div className="text-xs text-slate-400">
                Atualizado: {lastUpdated.toLocaleTimeString('pt-BR', { timeZone: timezone })}
              </div>
            )}
            <TimezoneSelector selectedTimezone={timezone} onTimezoneChange={setTimezone} />
            <div className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 font-semibold text-sm">AO VIVO</span>
            </div>
          </div>
        </header>

        <AssetSelector 
          assets={CRYPTO_ASSETS}
          selectedAsset={selectedAsset}
          onSelectAsset={handleAssetSelect}
          assetData={assets}
        />

        <ParametersPanel params={params} onParamsChange={setParams} />

        <CandlestickChart 
          data={candleData}
          signals={signals}
          selectedAsset={selectedAsset}
          timezone={timezone}
          onDataZoom={handleDataZoom}
        />

        <TechnicalMetrics 
          indicators={indicators}
          adxHistory={adxHistory}
          gogHistory={gogHistory}
          slopeHistory={slopeHistory}
        />

        <SignalsPanel signals={signals} timezone={timezone} />
      </main>
    </div>
  );
}

export default App;
