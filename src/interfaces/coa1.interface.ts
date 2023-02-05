import { COA1SupportFromEnum } from './../enums/coa1SupportFrom.enum';
import { OptionsChainDataType } from './../types/optionsData.type';

export interface GetChartOfAccuracy1MetricsInput {
  symbolStrikePrice: number;
  atmStrikePrice: number;
  strikePriceStep: number;
  optionsChainData: OptionsChainDataType;
  COA1SupportsFileName: string;
}

export interface GetCOA1SupportFromMetricInput {
  strikeWithHighestVolume: number;
  strikeWithHighestOI: number;
  ITMStrikePrice: number;
}

export interface GetCOA1DirectionalSignalInput {
  supportFrom: COA1SupportFromEnum;
  isMaxVolumeWeak: boolean;
  isMaxOIWeak: boolean;
  strikeWithHighestVolume: number;
  strikeWithSecondHighestVolume: number;
  strikeWithHighestOI: number;
  strikeWithSecondHighestOI: number;
}
