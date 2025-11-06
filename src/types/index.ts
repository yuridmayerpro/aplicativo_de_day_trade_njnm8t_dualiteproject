export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface CandleData {
  timestamp: number;
  open: number;
  close: number;
  low: number;
  high: number;
  volume: number;
}

export interface IndicatorData {
  adx: number;
  slope: number;
  gog: number;
}

export interface FullCandleData extends CandleData, IndicatorData {
  isSwingHigh: boolean;
  isSwingLow: boolean;
}

export interface IndicatorParams {
  adxPeriod: number;
  adxThreshold: number;
  slopeWindow: number;
  slopeSmooth: number;
  gogSpan: number;
  swingLeft: number;
  swingRight: number;
  fiboRetrLow: number;
  fiboRetrHigh: number;
}

export interface Signal {
  timestamp: number;
  type: 'BUY' | 'SELL';
  price: number;
  reason: string;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
}
