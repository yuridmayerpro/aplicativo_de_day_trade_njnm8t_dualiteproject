import axios from 'axios';
import { Asset, CandleData } from '../types';

// Switched to a more reliable CORS proxy to resolve network errors.
const CORS_PROXY = 'https://corsproxy.io/?';
const YAHOO_API_BASE_URL = 'https://query1.finance.yahoo.com';
const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';

// --- Chart Data (from Yahoo Finance) ---

const parseChartData = (data: any): CandleData[] => {
  if (!data || !data.chart || !data.chart.result || !data.chart.result[0]) {
    console.error("Unexpected chart data format or empty response:", data);
    return [];
  }
  const result = data.chart.result[0];
  if (!result.timestamp || !result.indicators || !result.indicators.quote || !result.indicators.quote[0]) {
    console.error("Incomplete chart data:", data);
    return [];
  }

  const timestamps = result.timestamp;
  const { open, high, low, close, volume } = result.indicators.quote[0];

  const parseNumber = (value: number | null | undefined): number => {
    if (value === null || value === undefined) {
      return NaN;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : NaN;
  };

  return timestamps.map((ts: number, i: number) => ({
    timestamp: ts * 1000,
    open: parseNumber(open[i]),
    close: parseNumber(close[i]),
    high: parseNumber(high[i]),
    low: parseNumber(low[i]),
    volume: Number.isFinite(volume[i]) ? Number(volume[i]) : 0,
  })).filter(candle =>
    Number.isFinite(candle.open) &&
    Number.isFinite(candle.close) &&
    Number.isFinite(candle.high) &&
    Number.isFinite(candle.low)
  );
};

export const fetchChartData = async (symbol: string): Promise<CandleData[]> => {
  try {
    const targetUrl = `${YAHOO_API_BASE_URL}/v8/finance/chart/${symbol}?range=1d&interval=5m`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
    const response = await axios.get(proxyUrl);
    return parseChartData(response.data);
  } catch (error) {
    console.error(`Error fetching chart data for ${symbol}:`, error);
    return [];
  }
};


// --- Ticker Data (from CoinGecko) ---

const YAHOO_TO_CG_MAP: { [key: string]: { id: string, name: string } } = {
  'BTC-USD': { id: 'bitcoin', name: 'Bitcoin' },
  'ETH-USD': { id: 'ethereum', name: 'Ethereum' },
  'SOL-USD': { id: 'solana', name: 'Solana' },
  'XRP-USD': { id: 'ripple', name: 'XRP' },
  'BNB-USD': { id: 'binancecoin', name: 'BNB' },
  'DOGE-USD': { id: 'dogecoin', name: 'Dogecoin' },
  'TRX-USD': { id: 'tron', name: 'TRON' },
  'USDC-USD': { id: 'usd-coin', name: 'USD Coin' },
  'USDT-USD': { id: 'tether', name: 'Tether' },
  'TRUMP-USD': { id: 'maga', name: 'MAGA' },
};

export const fetchTickerData = async (symbols: string[]): Promise<Asset[]> => {
  if (symbols.length === 0) return [];
  
  const coingeckoIds = symbols.map(s => YAHOO_TO_CG_MAP[s]?.id).filter(Boolean).join(',');
  if (!coingeckoIds) return [];

  try {
    const url = `${COINGECKO_API_BASE_URL}/simple/price?ids=${coingeckoIds}&vs_currencies=usd&include_24hr_change=true`;
    const response = await axios.get(url);
    const data = response.data;

    const assets: Asset[] = symbols.map(symbol => {
      const mapping = YAHOO_TO_CG_MAP[symbol];
      if (!mapping) return null;

      const tickerData = data[mapping.id];
      if (!tickerData) {
        return {
          symbol,
          name: mapping.name,
          price: 0,
          change: 0,
          changePercent: 0,
        };
      }

      const price = tickerData.usd || 0;
      const changePercent = tickerData.usd_24h_change || 0;
      const change = price * (changePercent / 100);

      return {
        symbol,
        name: mapping.name,
        price,
        change,
        changePercent,
      };
    }).filter((asset): asset is Asset => asset !== null);

    return assets;

  } catch (error) {
    console.error('Error fetching ticker data from CoinGecko:', error);
    return symbols.map(symbol => ({
        symbol,
        name: YAHOO_TO_CG_MAP[symbol]?.name || symbol,
        price: 0,
        change: 0,
        changePercent: 0,
    }));
  }
};
