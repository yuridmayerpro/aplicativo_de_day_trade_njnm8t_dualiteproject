import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CandleData, Signal } from '../types';

interface CandlestickChartProps {
  data: CandleData[];
  signals: Signal[];
  selectedAsset: string;
  timezone: string;
  onDataZoom: (event: any) => void;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, signals, selectedAsset, timezone, onDataZoom }) => {
  const option = useMemo(() => {
    const timestamps = data.map(d => new Date(d.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: timezone }));
    const candleData = data.map(d => [d.open, d.close, d.low, d.high]);
    const volumes = data.map(d => d.volume);

    const buySignals = signals.filter(s => s.type === 'BUY').map(s => {
      const index = data.findIndex(d => d.timestamp === s.timestamp);
      return index >= 0 ? { coord: [index, s.price], value: 'COMPRA' } : null;
    }).filter(Boolean);

    const sellSignals = signals.filter(s => s.type === 'SELL').map(s => {
      const index = data.findIndex(d => d.timestamp === s.timestamp);
      return index >= 0 ? { coord: [index, s.price], value: 'VENDA' } : null;
    }).filter(Boolean);

    return {
      backgroundColor: 'transparent',
      animation: true,
      grid: [
        { left: '6%', right: '2%', top: '8%', height: '58%' },
        { left: '6%', right: '2%', top: '72%', height: '18%' }
      ],
      xAxis: [
        {
          type: 'category', data: timestamps, scale: true, boundaryGap: true,
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94a3b8', fontSize: 10 },
          splitLine: { show: false }, min: 'dataMin', max: 'dataMax'
        },
        {
          type: 'category', gridIndex: 1, data: timestamps, scale: true, boundaryGap: true,
          axisLine: { onZero: false, lineStyle: { color: '#475569' } },
          axisLabel: { show: false }, splitLine: { show: false }, axisTick: { show: false },
        }
      ],
      yAxis: [
        {
          scale: true, splitArea: { show: false },
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (value: number) => `$${value.toFixed(2)}` },
          splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
        },
        {
          scale: true, gridIndex: 1, splitNumber: 2,
          axisLabel: { show: false }, axisLine: { show: false },
          axisTick: { show: false }, splitLine: { show: false }
        }
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 50, end: 100 },
        {
          show: true, xAxisIndex: [0, 1], type: 'slider', bottom: '2%',
          start: 50, end: 100, borderColor: '#475569',
          fillerColor: 'rgba(71, 85, 105, 0.2)', handleStyle: { color: '#64748b' },
          textStyle: { color: '#94a3b8' }
        }
      ],
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#475569',
        textStyle: { color: '#e2e8f0' },
        formatter: function (params: any) {
          const candleParam = params.find((p: any) => p.seriesType === 'candlestick');
          if (!candleParam) return '';
          const volParam = params.find((p: any) => p.seriesType === 'bar');
          const data = candleParam.data;
          return `
            <div style="padding: 8px; font-size: 12px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${candleParam.name}</div>
              <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px;">
                <span>Abertura:</span><span style="color: #60a5fa;">$${data[0].toFixed(2)}</span>
                <span>Fechamento:</span><span style="color: ${data[1] >= data[0] ? '#34d399' : '#f87171'};">$${data[1].toFixed(2)}</span>
                <span>Mínima:</span><span style="color: #f87171;">$${data[2].toFixed(2)}</span>
                <span>Máxima:</span><span style="color: #34d399;">$${data[3].toFixed(2)}</span>
                ${volParam ? `<span>Volume:</span><span>${(volParam.data / 1e6).toFixed(2)}M</span>` : ''}
              </div>
            </div>
          `;
        }
      },
      series: [
        {
          name: selectedAsset, type: 'candlestick', data: candleData,
          itemStyle: { color: '#10b981', color0: '#ef4444', borderColor: '#10b981', borderColor0: '#ef4444' },
          markPoint: {
            label: { formatter: '{b}', color: '#fff', fontSize: 11, fontWeight: 'bold' },
            data: [
              ...buySignals.map(s => ({ ...s, symbol: 'arrow', symbolSize: 20, symbolRotate: 180, itemStyle: { color: '#10b981' } })),
              ...sellSignals.map(s => ({ ...s, symbol: 'arrow', symbolSize: 20, itemStyle: { color: '#ef4444' } }))
            ]
          }
        },
        {
          name: 'Volume', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: volumes,
          itemStyle: {
            color: (params: any) => {
              const index = params.dataIndex;
              if (!candleData[index]) return 'rgba(100, 116, 139, 0.5)';
              return candleData[index][1] >= candleData[index][0] ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
            }
          }
        }
      ]
    };
  }, [data, signals, selectedAsset, timezone]);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-bold text-white">Gráfico de Candlestick - {selectedAsset}</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded"></div><span className="text-sm text-slate-300">Alta</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded"></div><span className="text-sm text-slate-300">Baixa</span></div>
        </div>
      </div>
      <ReactECharts 
        option={option} 
        style={{ height: '600px', width: '100%' }} 
        opts={{ renderer: 'svg' }} 
        notMerge={true} 
        lazyUpdate={true}
        onEvents={{ 'datazoom': onDataZoom }}
      />
    </div>
  );
};

export default CandlestickChart;
