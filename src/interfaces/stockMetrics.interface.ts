import { OptionsChainDataType } from './../types/optionsData.type';
import { OptionsSignalEnum } from './../enums/optionsSignal.enum';
import { StrikePriceInterpretationsEnum } from './../enums/strikePriceInterpretations.enum';

export interface GetCurrentStrikePriceInterpretationInput {
  changeInOpenInterest: number;
  changeInPremium: number;
}

export interface GetVolumeActionSignalInput {
  noOfCEContracts: number;
  noOfPEContracts: number;
}

export interface GetPriceActionSignalInput {
  callSideInterpretation: StrikePriceInterpretationsEnum;
  putSideInterpretation: StrikePriceInterpretationsEnum;
  noOfCEContracts: number;
  noOfPEContracts: number;
}

export interface GetPriceActionSignalFromCurrentStrikeImplementationsInput {
  callSideSignal: OptionsSignalEnum;
  putSideSignal: OptionsSignalEnum;
  noOfCEContracts: number;
  noOfPEContracts: number;
}

export interface GetDefaultPriceActionSignalFromCurrentStrikeImplementationsInput {
  callSideSignal: OptionsSignalEnum;
  putSideSignal: OptionsSignalEnum;
}

export interface GetMarketSignalInput {
  volumeActionSignal: OptionsSignalEnum;
  priceActionSignal: OptionsSignalEnum;
}

export interface GetMarketSignalsPercentageFromOptionsChainDataPayload {
  bullishSignalsPercentage: number;
  bearishSignalsPercentage: number;
  sidewaysSignalsPercentage: number;
}

export interface GetOverallMarketSignalInput {
  bullishSignalsPercentage: number;
  bearishSignalsPercentage: number;
  sidewaysSignalsPercentage: number;
}

export interface GetStrikePriceRangeFromVIXValuePayload {
  upperStrikePrice: number;
  lowerStrikePrice: number;
}

export interface GetStrikePriceRangeFromVIXValueInput {
  VIXValue: number;
  activeStrikePrice: number;
  strikePriceStep: number;
}

export interface GetMarketSignalsPercentageFromOptionsChainDataInput {
  optionsChainData: OptionsChainDataType;
  VIXUpperLimit: number;
  VIXLowerLimit: number;
}
