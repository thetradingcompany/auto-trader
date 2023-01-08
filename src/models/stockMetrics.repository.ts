import { getModelForClass } from '@typegoose/typegoose';
import { OptionsDataInput } from '../types/optionsData.input';
import { OptionsChainDataWithMetricsAndMetadataType } from './../types/optionsData.type';
import { buildStockMetricsEntryFilterQuery } from './utils/buildStockMetricsEntryFilterQuery.util';

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

  async getStockMetricsEntry(input: OptionsDataInput): Promise<OptionsChainDataWithMetricsAndMetadataType | null> {
    const { filters, projection, sortQuery = {}, limit = 20, offset = 0 } = input;
    const filterQuery = buildStockMetricsEntryFilterQuery(filters);

    const optionsChainDataWithMetricsAndMetadata = await OptionsMetricsModel.findOne(filterQuery, projection)
      .sort(sortQuery)
      .skip(offset)
      .limit(limit)
      .exec();

    return optionsChainDataWithMetricsAndMetadata;
  }
}

export const stockMetricsRepository = new StockMetricsRepository();
