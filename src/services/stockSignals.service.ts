import * as fs from 'fs';
import { nseController } from '../controller/nse.controller';
import {
  FetchOptionsDataPayload,
  PopulateAggregatedOptionsChainMetricsInput,
  PopulateOptionsChainSignalsDataForExpiryInput,
  ProcessOptionsDataInput,
  ProcessOptionsDataPayload,
} from '../interfaces/stockSignals.interface';
import { OptionChainEntryType, OptionsChainDataType } from '../types/optionsData.type';
import { roundToNearestMultiple } from '../utils/calculation.util';
import { getCurrentDataForFileName, getTimeSeriesDataEntryCurrentTime } from '../utils/dateTime.util';
import { convertJSONObjToCSVRow, writeCSVRowToFile } from '../utils/file.util';
import { stockMetricsRepository } from './../models/stockMetrics.repository';
import { StockMetrics } from './stockMetrics.service';
import { addMetadataToOptionsData } from './utils/addMetadataToOptionsData.util';
import {
  addMetricsToCombinedOptionsData,
  addMetricsToOptionsChainData,
  addMetricsToProcessedOptionsData,
} from './utils/addMetricsToOptionsData.util';
import { getCombinedOptionsDataByStrike } from './utils/combineOptionsDataByStrike.util';
import { getFilteredOptionsChainDataByStrike } from './utils/filterOptionsChainData.util';
import { getOptionChainEntryFromOptionDataEntry } from './utils/getOptionChainEntryFromOptionData.util';
import { getCurrentVIXValue } from './utils/getVIXValue.util';
import { getStockOHLCVDataFromNSEData } from './utils/stockOHLVData.util';

export class StockSignals {
  private TOP_EXPIRY_DATES_COUNT = 6;

  private symbol: string;
  private strikeRangeLimit: number;
  private strikePriceStep: number;
  private currentTime: string;
  private currentDate: string;
  private recordTime: string;
  private autoFillExpiries: boolean;
  private expiryDate?: string;

  private readonly METADATA_FOLDER_NAME = 'metadata';
  private readonly DATA_FOLDER_NAME = 'data';

  private readonly FULL_FILTERED_DATA_FILE_NAME = 'filteredData.json';
  private readonly OPTIONS_CHAIN_DATA_FILE_NAME = 'optionsChainData.json';
  private readonly TIME_SERIES_OPTION_METRICS_CSV_FILE_NAME = 'timeSeries.csv';
  private readonly TIME_SERIES_OPTION_METRICS_JSON_FILE_NAME = 'timeSeries.json';
  private readonly CHART_OF_ACCURACY_1_SUPPORTS_FILENAME = 'coe1Supports.json';

  constructor(
    symbol: string,
    autoFillExpiries?: boolean,
    strikeRangeLimit?: number,
    strikePriceStep?: number,
    expiryDate?: string,
  ) {
    this.symbol = symbol;
    this.expiryDate = expiryDate;
    this.strikeRangeLimit = strikeRangeLimit ?? 10;
    this.strikePriceStep = strikePriceStep ?? 100;
    this.autoFillExpiries = autoFillExpiries ?? true;

    this.currentTime = getTimeSeriesDataEntryCurrentTime();
    this.currentDate = getCurrentDataForFileName();
    this.recordTime = new Date().toISOString();
  }

  public async populateOptionsChainSignalsData(): Promise<void> {
    const optionsDataPromise = this.fetchOptionsData();
    const VIXValuePromise = getCurrentVIXValue();

    const [{ optionsData, symbolStrikePrice, symbolStrikePrices, validExpiryDates }, currentVIXValue] = await Promise.all([
      optionsDataPromise,
      VIXValuePromise,
    ]);

    if (!this.autoFillExpiries) {
      if (!this.expiryDate) {
        throw new Error(
          'StockSignals.populateOptionsChainSignalsData: No expiry date provided when autoFillExpiries is set as false.',
        );
      }

      await this.populateOptionsChainSignalsDataForExpiry({
        optionsData,
        symbolStrikePrice,
        symbolStrikePrices,
        expiryDate: this.expiryDate,
        currentVIXValue,
      });
      return;
    }

    const populateOptionsMetricsForExpiryPromises: Promise<void>[] = [];
    for (const expiryDate of validExpiryDates) {
      const populateOptionsChainSignalsDataForExpiryPromise = this.populateOptionsChainSignalsDataForExpiry({
        optionsData,
        symbolStrikePrice,
        symbolStrikePrices,
        expiryDate,
        currentVIXValue,
      });

      populateOptionsMetricsForExpiryPromises.push(populateOptionsChainSignalsDataForExpiryPromise);
    }

    await Promise.all(populateOptionsMetricsForExpiryPromises);

    return;
  }

  private async populateOptionsChainSignalsDataForExpiry({
    optionsData,
    symbolStrikePrice,
    symbolStrikePrices,
    expiryDate,
    currentVIXValue,
  }: PopulateOptionsChainSignalsDataForExpiryInput): Promise<void> {
    const COA1SupportsFileName = this.getCOA1SupportsJSONFileName(expiryDate);

    const processedOptionsData = this.processOptionsData({
      optionsData,
      symbolStrikePrice,
      symbolStrikePrices,
      expiryDate,
    });
    const { atmStrikePrice } = processedOptionsData;

    const optionsDataWithCustomMetrics = addMetricsToProcessedOptionsData(processedOptionsData);
    const { callOptionsData, putOptionsData } = optionsDataWithCustomMetrics;

    const combinedOptionsData = getCombinedOptionsDataByStrike(optionsDataWithCustomMetrics);

    const combinedOptionsDataWithCustomMetrics = addMetricsToCombinedOptionsData(combinedOptionsData);

    const optionsChainData: OptionsChainDataType = { byStrikes: combinedOptionsDataWithCustomMetrics };
    const optionsChainDataWithMetrics = addMetricsToOptionsChainData({
      optionsChainData,
      callOptionsData,
      putOptionsData,
      currentVIXValue,
      strikePriceStep: this.strikePriceStep,
      atmStrikePrice,
      symbolStrikePrice,
      COA1SupportsFileName,
    });

    const optionsChainDataWithMetricsAndMetadata = addMetadataToOptionsData({
      optionsChainDataWithMetrics,
      symbol: this.symbol,
      atmStrikePrice,
      symbolStrikePrice,
      expiryDate,
      recordTime: this.recordTime,
    });

    await stockMetricsRepository.createStockMetricsEntry(optionsChainDataWithMetricsAndMetadata);

    // fs.writeFileSync(this.optionsChainDataFileName, JSON.stringify(optionsChainDataWithMetrics, null, 2));

    // this.populateAggregatedOptionsChainMetrics(optionsDataWithCustomMetrics);
    // await this.processStockData();

    return;
  }

  private async fetchOptionsData(): Promise<FetchOptionsDataPayload> {
    const optionChainDataPayload = await nseController.getOptionsChainData(this.symbol);
    const {
      data: {
        records: {
          data: optionsData,
          underlyingValue: symbolStrikePrice,
          strikePrices: symbolStrikePrices = [],
          expiryDates = [],
        },
      },
    } = optionChainDataPayload;

    const validExpiryDates: string[] = [];
    expiryDates.forEach((expiryDate, index) => {
      if (index < this.TOP_EXPIRY_DATES_COUNT) {
        validExpiryDates.push(expiryDate);
      }
    });

    return {
      optionsData,
      symbolStrikePrice,
      symbolStrikePrices,
      validExpiryDates,
    };
  }

  private processOptionsData({
    optionsData,
    symbolStrikePrice,
    symbolStrikePrices,
    expiryDate,
  }: ProcessOptionsDataInput): ProcessOptionsDataPayload {
    const filteredOptionChainDataByStrike = getFilteredOptionsChainDataByStrike({
      optionsData,
      symbolStrikePrice,
      symbolStrikePrices,
      expiryDate,
      strikeRangeLimit: this.strikeRangeLimit,
      strikePriceStep: this.strikePriceStep,
    });

    // fs.writeFileSync(this.fullFilteredDataFileName, JSON.stringify(filteredOptionChainDataByStrike, null, 2));

    const callOptionsData: OptionChainEntryType[] = [];
    const putOptionsData: OptionChainEntryType[] = [];

    Object.entries(filteredOptionChainDataByStrike).forEach(([, data]) => {
      const { CE: ceData, PE: peData } = data;
      if (ceData) {
        const optionChainEntry = getOptionChainEntryFromOptionDataEntry(ceData);
        if (optionChainEntry) {
          callOptionsData.push(optionChainEntry);
        }
      }
      if (peData) {
        const optionChainEntry = getOptionChainEntryFromOptionDataEntry(peData);
        if (optionChainEntry) {
          putOptionsData.push(optionChainEntry);
        }
      }
    });

    const atmStrikePrice = roundToNearestMultiple(symbolStrikePrice, this.strikePriceStep);

    return {
      callOptionsData,
      putOptionsData,
      atmStrikePrice,
    };
  }

  private async processStockData(): Promise<void> {
    const indexDataPayload = await nseController.getIndexData(this.symbol);
    const { open, high, low, volume } = getStockOHLCVDataFromNSEData(this.symbol, indexDataPayload);

    return;
  }

  private populateAggregatedOptionsChainMetrics({
    callOptionsData,
    putOptionsData,
  }: PopulateAggregatedOptionsChainMetricsInput) {
    // CE Metrics
    const ceTotalChangeInOI = callOptionsData.reduce((total, ceData) => {
      return total + ceData.changeInOpenInterest;
    }, 0);

    // PE Metrics
    const peTotalChangeInOI = putOptionsData.reduce((total, peData) => {
      return total + peData.changeInOpenInterest;
    }, 0);

    const timeSeriesEntry = StockMetrics.timeSeriesEntry(ceTotalChangeInOI, peTotalChangeInOI, this.currentTime);
    const timeSeriesCSVRow = convertJSONObjToCSVRow(timeSeriesEntry);

    writeCSVRowToFile(timeSeriesCSVRow, this.timeSeriesOptionMetricsCSVFileName);
    // writeJSONObjToFile(timeSeriesEntry, this.timeSeriesOptionMetricsJSONFileName);
  }

  private get fullFilteredDataFileName(): string {
    return `${this.METADATA_FOLDER_NAME}/${this.symbol}_${this.currentDate}_${this.FULL_FILTERED_DATA_FILE_NAME}`;
  }

  private get optionsChainDataFileName(): string {
    return `${this.DATA_FOLDER_NAME}/${this.symbol}_${this.currentDate}_${this.currentTime}_${this.OPTIONS_CHAIN_DATA_FILE_NAME}`;
  }

  private get timeSeriesOptionMetricsCSVFileName(): string {
    return `${this.DATA_FOLDER_NAME}/${this.symbol}_${this.currentDate}_${this.TIME_SERIES_OPTION_METRICS_CSV_FILE_NAME}`;
  }

  private get timeSeriesOptionMetricsJSONFileName(): string {
    return `${this.DATA_FOLDER_NAME}/${this.symbol}_${this.currentDate}_${this.TIME_SERIES_OPTION_METRICS_JSON_FILE_NAME}`;
  }

  private getCOA1SupportsJSONFileName(expiryDate: string): string {
    return `${this.DATA_FOLDER_NAME}/${this.symbol}_${expiryDate}_${this.currentDate}_${this.CHART_OF_ACCURACY_1_SUPPORTS_FILENAME}`;
  }
}
