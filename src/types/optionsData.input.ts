import { EntityInput } from './generic.type';
import { OptionsChainDataWithMetricsAndMetadataType } from './optionsData.type';

export interface OptionsDataFilters {
  symbol: string;
}

export type OptionsDataInput = EntityInput<OptionsDataFilters, OptionsChainDataWithMetricsAndMetadataType>;
