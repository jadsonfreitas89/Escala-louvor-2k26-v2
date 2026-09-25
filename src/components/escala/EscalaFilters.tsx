import React from 'react';
import { Search, Filter, Calendar, UserCheck, X } from 'lucide-react';

export type TabPeriodo = 'proximas' | 'anteriores' | 'todas';

interface EscalaFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  periodo: TabPeriodo;
  onPeriodoChange: (periodo: TabPeriodo) => void;
  onlyMyScales: boolean;
  onOnlyMyScalesChange: (value: boolean) => void;
  selectedMonth: string;
  onSelectedMonthChange: (month: string) => void;
  availableMonths: { label: string; value: string }[];
  selectedCulto: string;
  onSelectedCultoChange: (culto: string) => void;
  availableCultos: string[];
  isUserLoggedIn: boolean;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const EscalaFilters: React.FC<EscalaFiltersProps> = ({
  searchTerm,
  onSearchChange,
  periodo,
  onPeriodoChange,
  onlyMyScales,
  onOnlyMyScalesChange,
  selectedMonth,
  onSelectedMonthChange,
  availableMonths,
  selectedCulto,
  onSelectedCultoChange,
  availableCultos,
  isUserLoggedIn,
  onClearFilters,
  hasActiveFilters
}) => {
  return (
    <div id="escala-filters-container" className="space-y-3.5">
      {/* Top row: Search input & Period tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            id="input-search-escala"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por integrante, música, data..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Period Tabs: Próximas | Anteriores | Todas */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-900 border border-zinc-800 shrink-0 self-start md:self-auto">
          <button
            id="tab-periodo-proximas"
            onClick={() => onPeriodoChange('proximas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              periodo === 'proximas'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Próximos Cultos
          </button>
          <button
            id="tab-periodo-anteriores"
            onClick={() => onPeriodoChange('anteriores')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              periodo === 'anteriores'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Anteriores
          </button>
          <button
            id="tab-periodo-todas"
            onClick={() => onPeriodoChange('todas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              periodo === 'todas'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Second row: Dropdowns & My Scales toggle */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Toggle Minhas Escalas */}
        {isUserLoggedIn && (
          <button
            id="btn-filter-my-scales"
            onClick={() => onOnlyMyScalesChange(!onlyMyScales)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border ${
              onlyMyScales
                ? 'bg-orange-500 text-zinc-950 border-orange-500 shadow-sm'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Minhas Escalas</span>
          </button>
        )}

        {/* Filter by Month */}
        {availableMonths.length > 0 && (
          <div className="relative">
            <select
              id="select-filter-month"
              value={selectedMonth}
              onChange={(e) => onSelectedMonthChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
            >
              <option value="">Todos os meses</option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        )}

        {/* Filter by Culto */}
        {availableCultos.length > 0 && (
          <div className="relative">
            <select
              id="select-filter-culto"
              value={selectedCulto}
              onChange={(e) => onSelectedCultoChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
            >
              <option value="">Todos os cultos</option>
              {availableCultos.map((culto) => (
                <option key={culto} value={culto}>
                  {culto}
                </option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            id="btn-clear-filters"
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-orange-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
