import { COA1SupportFromEnum } from './../enums/coa1SupportFrom.enum';
import { Index, prop as Property } from '@typegoose/typegoose';
import { COA1DirectionalSignalEnum } from './../enums/coa1DirectionalSignal.enum';
import { COA1SignalEnum } from './../enums/coa1Signal.enum';
import { MarketSignalEnum } from './../enums/marketSignal.enum';
import { OptionsSignalEnum } from './../enums/optionsSignal.enum';
import { StrikePriceInterpretationsEnum } from './../enums/strikePriceInterpretations.enum';

export type NSEOptionDataEntryType = {
  strikePrice: number;
  lastPrice: number;
  openInterest: number;
  changeinOpenInterest: number;
  change: number;
  totalTradedVolume: number;
  impliedVolatility: number;
};

export class OptionChainEntryType {
  @Property({ type: Number })
  strikePrice: number;

  @Property({ type: Number })
  lastPrice: number;

  @Property({ type: Number })
  openInterest: number;

  @Property({ type: Number })
  changeInOpenInterest: number;

  @Property({ type: Number })
  changeInPremium: number;

  @Property({ type: Number })
  totalTradedVolume: number;

  @Property({ type: Number })
  // eslint-disable-next-line id-length
  IV?: number;
}

export class OptionChainEntryWithMetricsType extends OptionChainEntryType {
  @Property({ type: String, enum: StrikePriceInterpretationsEnum })
  interpretation: StrikePriceInterpretationsEnum;
}

export class CombinedOptionsDataEntryType {
  @Property({ type: Number })
  strikePrice: number;

  @Property({ type: OptionChainEntryWithMetricsType, _id: false })
  // eslint-disable-next-line id-length
  ce?: OptionChainEntryWithMetricsType;

  @Property({ type: OptionChainEntryWithMetricsType, _id: false })
  // eslint-disable-next-line id-length
  pe?: OptionChainEntryWithMetricsType;
}

export class CombinedOptionsDataEntryWithMetricsType extends CombinedOptionsDataEntryType {
  @Property({ type: Number })
  pcr?: number;

  @Property({ type: String, enum: OptionsSignalEnum })
  volumeActionSignal?: OptionsSignalEnum;

  @Property({ type: String, enum: OptionsSignalEnum })
  priceActionSignal?: OptionsSignalEnum;

  @Property({ type: String, enum: MarketSignalEnum })
  marketSignal?: MarketSignalEnum;
}

export class OptionsChainDataType {
  @Property({ type: [CombinedOptionsDataEntryWithMetricsType], _id: false })
  byStrikes: CombinedOptionsDataEntryWithMetricsType[];
}

export class ChartOfAccuracy1MetricsType {
  @Property({ type: String, enum: COA1SignalEnum })
  COA1Signal: COA1SignalEnum;

  @Property({ type: Number })
  callSideStrikeWithHighestVolume: number;

  @Property({ type: Number })
  putSideStrikeWithHighestVolume: number;

  @Property({ type: Number })
  callSideStrikeWithSecondHighestVolume: number;

  @Property({ type: Number })
  putSideStrikeWithSecondHighestVolume: number;

  @Property({ type: Number })
  callSideStrikeWithHighestOI: number;

  @Property({ type: Number })
  putSideStrikeWithHighestOI: number;

  @Property({ type: Number })
  callSideStrikeWithSecondHighestOI: number;

  @Property({ type: Number })
  putSideStrikeWithSecondHighestOI: number;

  @Property({ type: String, enum: COA1DirectionalSignalEnum })
  callSideCOA1DirectionalSignal: COA1DirectionalSignalEnum;

  @Property({ type: String, enum: COA1DirectionalSignalEnum })
  putSideCOA1DirectionalSignal: COA1DirectionalSignalEnum;

  @Property({ type: Number })
  callSideITMStrikePrice: number;

  @Property({ type: Number })
  putSideITMStrikePrice: number;

  @Property({ type: String, enum: COA1SupportFromEnum })
  callSideSupportFrom: COA1SupportFromEnum;

  @Property({ type: String, enum: COA1SupportFromEnum })
  putSideSupportFrom: COA1SupportFromEnum;
}

export class OptionsChainDataWithMetricsType extends OptionsChainDataType {
  @Property({ type: Number })
  totalChangeInCE: number;

  @Property({ type: Number })
  totalChangeInPE: number;

  @Property({ type: Number })
  differenceInTotalChange: number;

  @Property({ type: Number })
  pcr: number;

  @Property({ type: String, enum: OptionsSignalEnum })
  volumeActionSignal: OptionsSignalEnum;

  @Property({ type: String, enum: OptionsSignalEnum })
  priceActionSignal: OptionsSignalEnum;

  @Property({ type: String, enum: MarketSignalEnum })
  marketSignal: MarketSignalEnum;

  @Property({ type: Number })
  vixUpperStrike: number;

  @Property({ type: Number })
  vixLowerStrike: number;

  @Property({ type: Number })
  vwap?: number;

  @Property({ type: Number })
  price?: number;

  @Property({ type: Number })
  vwapSignal?: number;

  @Property({ type: ChartOfAccuracy1MetricsType, _id: false })
  COA1Metrics: ChartOfAccuracy1MetricsType;
}

@Index({ symbol: 1, recordTime: -1 })
@Index({ recordTime: 1 }, { expireAfterSeconds: 24 * 60 * 60 })
export class OptionsChainDataWithMetricsAndMetadataType extends OptionsChainDataWithMetricsType {
  @Property({ type: String })
  symbol: string;

  @Property({ type: Number })
  atmStrikePrice: number;

  @Property({ type: Number })
  currentPrice: number;

  @Property({ type: String })
  expiryDate: string;

  @Property({ type: Date })
  recordTime: string;
}
