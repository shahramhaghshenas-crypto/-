import React from 'react';
import { Blocks, CheckCircle2, Circle } from 'lucide-react';
import { PluginModule, FeatureAccess } from '../types';

interface PluginsCardProps {
  plugins: PluginModule[];
  onTogglePlugin: (id: string) => void;
  access: FeatureAccess;
}

export const PluginsCard: React.FC<PluginsCardProps> = ({
  plugins,
  onTogglePlugin,
  access
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <Blocks className="w-5 h-5 text-blue-600" />
          سیستم افزونه‌ها و ماژول‌های توسعه‌پذیر
        </h2>
        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
          معماری ماژولار
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            onClick={() => !isReadOnly && onTogglePlugin(plugin.id)}
            className={`p-3.5 rounded-xl border transition cursor-pointer select-none flex items-start gap-3 ${
              plugin.enabled
                ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            {plugin.enabled ? (
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
            )}
            <div>
              <span className={`text-xs font-bold block ${plugin.enabled ? 'text-blue-950' : 'text-slate-600'}`}>
                {plugin.name}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                {plugin.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
