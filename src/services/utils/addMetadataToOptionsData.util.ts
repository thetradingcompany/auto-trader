import { AddMetadataToOptionsDataInput } from './../../interfaces/stockSignals.interface';
import { OptionsChainDataWithMetricsAndMetadataType } from './../../types/optionsData.type';

export function addMetadataToOptionsData({
  optionsChainDataWithMetrics,
  symbol,
  atmStrikePrice,
  symbolStrikePrice,
  expiryDate,
  recordTime,
}: AddMetadataToOptionsDataInput): OptionsChainDataWithMetricsAndMetadataType {
  return {
    ...optionsChainDataWithMetrics,
    symbol,
    atmStrikePrice,
    currentPrice: symbolStrikePrice,
    expiryDate,
    recordTime,
  };
}
