import { FilterQuery } from 'mongoose';
import { OptionsDataFilters } from './../../types/optionsData.input';
import { OptionsChainDataWithMetricsAndMetadataType } from './../../types/optionsData.type';

export function buildStockMetricsEntryFilterQuery(
  filters: OptionsDataFilters,
): FilterQuery<OptionsChainDataWithMetricsAndMetadataType> {
  const query: FilterQuery<OptionsChainDataWithMetricsAndMetadataType> = {};
  for (const key in filters) {
    switch (key as keyof OptionsChainDataWithMetricsAndMetadataType) {
      case 'symbol': {
        query[key] = filters[key];
        break;
      }
      default: {
        break;
      }
    }
  }

  return query;
}
