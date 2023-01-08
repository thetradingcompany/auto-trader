import {
  OptionChainEntryType,
  OptionChainEntryWithMetricsType,
  OptionsChainDataType,
  OptionsChainDataWithMetricsType,
} from './../types/optionsData.type';

export interface FetchOptionsDataPayload {
  optionsData: Record<string, any>;
  symbolStrikePrice: number; // Current price
  symbolStrikePrices: number[];
  validExpiryDates: string[];
}

export interface PopulateOptionsChainSignalsDataForExpiryInput {
  optionsData: Record<string, any>;
  symbolStrikePrice: number;
  symbolStrikePrices: number[];
  expiryDate: string;
  currentVIXValue: number;
}

export interface ProcessOptionsDataInput {
  optionsData: Record<string, any>;
  symbolStrikePrice: number;
  symbolStrikePrices: number[];
  expiryDate: string;
}

export interface ProcessOptionsDataPayload {
  callOptionsData: OptionChainEntryType[];
  putOptionsData: OptionChainEntryType[];
  atmStrikePrice: number; // At the money strike price
}

export interface GetFilteredOptionsChainDataByStrikeInput {
  optionsData: any;
  symbolStrikePrice: number;
  symbolStrikePrices: number[];
  expiryDate: string;
  strikeRangeLimit: number;
  strikePriceStep: number;
}

export interface AddMetricsToProcessedOptionsDataPayload {
  callOptionsData: OptionChainEntryWithMetricsType[];
  putOptionsData: OptionChainEntryWithMetricsType[];
}

export interface GetCombinedOptionsDataByStrikeInput {
  callOptionsData: OptionChainEntryWithMetricsType[];
  putOptionsData: OptionChainEntryWithMetricsType[];
}

export interface PopulateAggregatedOptionsChainMetricsPayload {
  callOptionsData: OptionChainEntryWithMetricsType[];
  putOptionsData: OptionChainEntryWithMetricsType[];
}

export interface PopulateAggregatedOptionsChainMetricsInput {
  callOptionsData: OptionChainEntryWithMetricsType[];
  putOptionsData: OptionChainEntryWithMetricsType[];
}

export interface AddMetricsToOptionsChainDataInput {
  optionsChainData: OptionsChainDataType;
  // these are added just to simplify things. else, can be constructed from above data object.
  callOptionsData: OptionChainEntryWithMetricsType[];
  putOptionsData: OptionChainEntryWithMetricsType[];
  currentVIXValue: number;
  strikePriceStep: number;
  atmStrikePrice: number;
}

export interface AddMetadataToOptionsDataInput {
  optionsChainDataWithMetrics: OptionsChainDataWithMetricsType;
  symbol: string;
  atmStrikePrice: number;
  symbolStrikePrice: number;
  expiryDate: string;
  recordTime: string;
}
