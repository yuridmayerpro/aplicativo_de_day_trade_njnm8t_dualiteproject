import axios from 'axios';
import { Asset, CandleData } from '../types';

// Usando Binance para dados de gráfico e CoinGecko para dados de ticker.
const BINANCE_API_BASE_URL = 'https://api.binance.com/api/v3';
const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';

// --- Dados do Gráfico (da Binance) ---

const parseBinanceChartData = (data: any[]): CandleData[] => {
  if (!Array.isArray(data) || data.length === 0) {
    console.error("Formato de dados do gráfico inesperado ou vazio da Binance:", data);
    return [];
  }
  return data.map((kline: any[]) => ({
    timestamp: kline[0],
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
    volume: parseFloat(kline[5]),
  })).filter(candle =>
    !isNaN(candle.open) &&
    !isNaN(candle.close) &&
    !isNaN(candle.high) &&
    !isNaN(candle.low)
  );
};

export const fetchChartData = async (symbol: string): Promise<CandleData[]> => {
  // Converte o símbolo de 'BTC-USD' para 'BTCUSDT'
  const binanceSymbol = symbol.replace('-USD', 'USDT');
  try {
    // Busca os últimos 1000 candles de 5 minutos
    const targetUrl = `${BINANCE_API_BASE_URL}/klines?symbol=${binanceSymbol}&interval=5m&limit=1000`;
    const response = await axios.get(targetUrl);
    return parseBinanceChartData(response.data);
  } catch (error) {
    console.error(`Erro ao buscar dados do gráfico para ${binanceSymbol} da Binance:`, error);
    return [];
  }
};


// --- Dados do Ticker (da CoinGecko) ---
// Esta lógica permanece inalterada, pois fornece os dados do banner superior.

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
    console.error('Erro ao buscar dados do ticker da CoinGecko:', error);
    return symbols.map(symbol => ({
        symbol,
        name: YAHOO_TO_CG_MAP[symbol]?.name || symbol,
        price: 0,
        change: 0,
        changePercent: 0,
    }));
  }
};
