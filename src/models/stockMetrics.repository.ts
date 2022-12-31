import { getModelForClass } from '@typegoose/typegoose';
import { OptionsChainDataWithMetricsAndMetadataType } from './../types/optionsData.type';

const OptionsMetricsModel = getModelForClass(OptionsChainDataWithMetricsAndMetadataType, {
  schemaOptions: { collection: 'timeSeriesMetrics' },
});

class StockMetricsRepository {
  async createStockMetricsEntry(
    optionsChainDataWithMetricsAndMetadata: OptionsChainDataWithMetricsAndMetadataType,
  ): Promise<void> {
    const optionsMetrics = new OptionsMetricsModel(optionsChainDataWithMetricsAndMetadata);
    await optionsMetrics.save();
  }
}

export const stockMetricsRepository = new StockMetricsRepository();
