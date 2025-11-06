import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { IndicatorData } from '../types';
import { Activity, TrendingUp, LineChart } from 'lucide-react';

interface TechnicalMetricsProps {
  indicators: IndicatorData;
  adxHistory: number[];
  gogHistory: number[];
  slopeHistory: number[];
}

// Normaliza uma série de dados para o intervalo [0, 1] para comparação visual
const normalizeData = (data: number[]): number[] => {
    const validData = data.filter(v => !isNaN(v));
    if (validData.length < 2) return Array(data.length).fill(0.5);
    
    const min = Math.min(...validData);
    const max = Math.max(...validData);

    if (max === min) return data.map(v => isNaN(v) ? NaN : 0.5);

    return data.map(v => isNaN(v) ? NaN : (v - min) / (max - min));
};


const TechnicalMetrics: React.FC<TechnicalMetricsProps> = ({ 
  indicators, 
  adxHistory, 
  gogHistory, 
  slopeHistory 
}) => {

  const combinedChartOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      grid: { left: '3%', right: '3%', top: '10%', bottom: '20%' },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#475569',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any[]) => {
          const pointIndex = params[0]?.dataIndex;
          if (typeof pointIndex === 'undefined') return '';
          
          let tooltipHtml = `<div style="padding: 8px;">`;
          params.forEach(param => {
            const seriesName = param.seriesName;
            const color = param.color;
            let originalValue;
            
            if (seriesName === 'ADX') originalValue = adxHistory[pointIndex];
            else if (seriesName === 'GOG') originalValue = gogHistory[pointIndex];
            else if (seriesName === 'Slope') originalValue = slopeHistory[pointIndex];

            if (typeof originalValue !== 'undefined' && !isNaN(originalValue)) {
              tooltipHtml += `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${color};"></span>
                  <span>${seriesName}:</span>
                  <span style="font-weight: bold;">${originalValue.toFixed(4)}</span>
                </div>
              `;
            }
          });
          tooltipHtml += `</div>`;
          return tooltipHtml;
        }
      },
      legend: {
        data: ['ADX', 'GOG', 'Slope'],
        bottom: 0,
        textStyle: { color: '#94a3b8' },
        icon: 'circle'
      },
      xAxis: { type: 'category', show: false, boundaryGap: false },
      yAxis: { type: 'value', show: false, min: 0, max: 1 },
      series: [
        {
          name: 'ADX', type: 'line', data: normalizeData(adxHistory),
          smooth: true, showSymbol: false, lineStyle: { color: '#60a5fa', width: 2 }
        },
        {
          name: 'GOG', type: 'line', data: normalizeData(gogHistory),
          smooth: true, showSymbol: false, lineStyle: { color: '#a78bfa', width: 2 }
        },
        {
          name: 'Slope', type: 'line', data: normalizeData(slopeHistory),
          smooth: true, showSymbol: false, lineStyle: { color: '#34d399', width: 2 }
        }
      ]
    };
  }, [adxHistory, gogHistory, slopeHistory]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl border border-blue-500/30 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-blue-200">ADX</h3>
              </div>
            </div>
            <span className="text-4xl font-bold text-white">{indicators.adx.toFixed(2)}</span>
          </div>
          <div className="mt-3 text-xs text-blue-300">
            {indicators.adx > 25 ? 'Tendência Forte' : indicators.adx > 20 ? 'Tendência Moderada' : 'Tendência Fraca'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl border border-purple-500/30 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-purple-200">GOG</h3>
              </div>
            </div>
            <span className="text-4xl font-bold text-white">{indicators.gog.toFixed(4)}</span>
          </div>
          <div className="mt-3 text-xs text-purple-300">
            {indicators.gog > 0 ? 'Acelerando Alta' : 'Acelerando Baixa'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-xl border border-emerald-500/30 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-200">Slope</h3>
              </div>
            </div>
            <span className="text-4xl font-bold text-white">{indicators.slope.toFixed(4)}</span>
          </div>
          <div className="mt-3 text-xs text-emerald-300">
            {indicators.slope > 0 ? 'Tendência de Alta' : 'Tendência de Baixa'}
          </div>
        </div>
      </div>
      
      <div className="mt-4 bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <h3 className="text-lg font-bold text-white mb-2 px-2">Análise Comparativa de Indicadores</h3>
        <ReactECharts
          option={combinedChartOption}
          style={{ height: '200px', width: '100%' }}
          opts={{ renderer: 'svg' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
};

export default TechnicalMetrics;
