import React from 'react';

interface LoadingStateProps {
  message?: string;
  description?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando dados...',
  description = 'Sincronizando com a escala oficial...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-5">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-zinc-200">{message}</h3>
      {description && <p className="text-xs text-zinc-500 mt-1 max-w-xs">{description}</p>}
    </div>
  );
};
