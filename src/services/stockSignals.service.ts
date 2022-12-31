import { stockMetricsRepository } from './../models/stockMetrics.repository';
import * as fs from 'fs';
import { nseController } from '../controller/nse.controller';
import { PopulateAggregatedOptionsChainMetricsInput, ProcessOptionsDataPayload } from '../interfaces/stockSignals.interface';
import { OptionChainEntryType, OptionsChainDataType } from '../types/optionsData.type';
import { roundToNearestMultiple } from '../utils/calculation.util';
import { getCurrentDataForFileName, getTimeSeriesDataEntryCurrentTime } from '../utils/dateTime.util';
import { convertJSONObjToCSVRow, writeCSVRowToFile } from '../utils/file.util';
import { StockMetrics } from './stockMetrics.service';
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
import { addMetadataToOptionsData } from './utils/addMetadataToOptionsData.util';

export class StockSignals {
  private symbol: string;
  private expiryDate: string;
  private strikeRangeLimit: number;
  private strikePriceStep: number;
  private currentTime: string;
  private currentDate: string;
  private recordTime: string;

  private readonly METADATA_FOLDER_NAME = 'metadata';
  private readonly DATA_FOLDER_NAME = 'data';

  private readonly FULL_FILTERED_DATA_FILE_NAME = 'filteredData.json';
  private readonly OPTIONS_CHAIN_DATA_FILE_NAME = 'optionsChainData.json';
  private readonly TIME_SERIES_OPTION_METRICS_CSV_FILE_NAME = 'timeSeries.csv';
  private readonly TIME_SERIES_OPTION_METRICS_JSON_FILE_NAME = 'timeSeries.json';

  constructor(symbol: string, expiryDate: string, strikeRangeLimit?: number, strikePriceStep?: number) {
    this.symbol = symbol;
    this.expiryDate = expiryDate;
    this.strikeRangeLimit = strikeRangeLimit ?? 10;
    this.strikePriceStep = strikePriceStep ?? 100;

    this.currentTime = getTimeSeriesDataEntryCurrentTime();
    this.currentDate = getCurrentDataForFileName();
    this.recordTime = new Date().toISOString();
  }

  public async populateOptionsChainSignalsData(): Promise<void> {
    const processedOptionsData = await this.processOptionsData();
    const { symbolStrikePrice, atmStrikePrice } = processedOptionsData;

    const optionsDataWithCustomMetrics = addMetricsToProcessedOptionsData(processedOptionsData);
    const { callOptionsData, putOptionsData } = optionsDataWithCustomMetrics;

    const combinedOptionsData = getCombinedOptionsDataByStrike(optionsDataWithCustomMetrics);

    const combinedOptionsDataWithCustomMetrics = addMetricsToCombinedOptionsData(combinedOptionsData);

    const currentVIXValue = await getCurrentVIXValue();

    const optionsChainData: OptionsChainDataType = { byStrikes: combinedOptionsDataWithCustomMetrics };
    const optionsChainDataWithMetrics = addMetricsToOptionsChainData({
      optionsChainData,
      callOptionsData,
      putOptionsData,
      currentVIXValue,
      strikePriceStep: this.strikePriceStep,
      atmStrikePrice,
    });

    const optionsChainDataWithMetricsAndMetadata = addMetadataToOptionsData({
      optionsChainDataWithMetrics,
      symbol: this.symbol,
      atmStrikePrice,
      symbolStrikePrice,
      expiryDate: this.expiryDate,
      recordTime: this.recordTime,
    });

    stockMetricsRepository.createStockMetricsEntry(optionsChainDataWithMetricsAndMetadata);

    fs.writeFileSync(this.optionsChainDataFileName, JSON.stringify(optionsChainDataWithMetrics, null, 2));

    this.populateAggregatedOptionsChainMetrics(optionsDataWithCustomMetrics);
    // await this.processStockData();
  }

  private async processOptionsData(): Promise<ProcessOptionsDataPayload> {
    const optionChainDataPayload = await nseController.getOptionsChainData(this.symbol);
    const {
      data: {
        records: { data: optionsData, underlyingValue: symbolStrikePrice, strikePrices: symbolStrikePrices },
      },
    } = optionChainDataPayload;

    const filteredOptionChainDataByStrike = getFilteredOptionsChainDataByStrike({
      optionsData,
      symbolStrikePrice,
      symbolStrikePrices,
      expiryDate: this.expiryDate,
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
      symbolStrikePrice,
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
}
