import React from 'react';
import { Asset } from '../types';
import { BarChart3 } from 'lucide-react';

interface AssetSelectorProps {
  assets: string[];
  selectedAsset: string;
  onSelectAsset: (symbol: string) => void;
  assetData: Asset[];
}

const AssetSelector: React.FC<AssetSelectorProps> = ({ assets, selectedAsset, onSelectAsset, assetData }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Selecionar Ativo</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {assets.map((symbol) => {
          const data = assetData.find(a => a.symbol === symbol);
          const changePercent = data ? data.changePercent : 0;
          
          return (
            <button
              key={symbol}
              onClick={() => onSelectAsset(symbol)}
              className={`px-3 py-3 rounded-lg border text-center transition-all duration-200 ${
                selectedAsset === symbol
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="font-bold text-sm">{symbol}</div>
              {data ? (
                <div className={`text-xs mt-1 ${
                  changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                </div>
              ) : (
                <div className="text-xs mt-1 text-slate-500">...</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AssetSelector;
