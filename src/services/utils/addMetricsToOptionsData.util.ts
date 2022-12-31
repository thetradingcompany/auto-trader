import { MarketSignalEnum } from '../../enums/marketSignal.enum';
import { StockMetrics } from '../stockMetrics.service';
import {
  GetMarketSignalsPercentageFromOptionsChainDataInput,
  GetMarketSignalsPercentageFromOptionsChainDataPayload,
} from './../../interfaces/stockMetrics.interface';
import {
  AddMetricsToOptionsChainDataInput,
  AddMetricsToProcessedOptionsDataPayload,
  ProcessOptionsDataPayload,
} from './../../interfaces/stockSignals.interface';
import {
  CombinedOptionsDataEntryType,
  CombinedOptionsDataEntryWithMetricsType,
  OptionChainEntryType,
  OptionChainEntryWithMetricsType,
  OptionsChainDataType,
  OptionsChainDataWithMetricsType,
} from './../../types/optionsData.type';
import { getStrikePriceRangeFromVIXValue } from './getStrikePriceRangeFromVIXValue.util';

/**
 * Option level metrics injection
 */

function addMetricsToOptionsDataEntry(data: OptionChainEntryType): OptionChainEntryWithMetricsType {
  const { changeInOpenInterest, changeInPremium } = data;
  const interpretation = StockMetrics.getCurrentStrikePriceInterpretation({ changeInOpenInterest, changeInPremium });

  return {
    ...data,
    interpretation,
  };
}

function addMetricsToOptionsData(data: OptionChainEntryType[]): OptionChainEntryWithMetricsType[] {
  return data.map((dataEntry) => addMetricsToOptionsDataEntry(dataEntry));
}

export function addMetricsToProcessedOptionsData(
  optionsData: ProcessOptionsDataPayload,
): AddMetricsToProcessedOptionsDataPayload {
  const { callOptionsData, putOptionsData } = optionsData;

  const callOptionsDataWithMetrics = addMetricsToOptionsData(callOptionsData);
  const putOptionsDataWithMetrics = addMetricsToOptionsData(putOptionsData);

  return {
    callOptionsData: callOptionsDataWithMetrics,
    putOptionsData: putOptionsDataWithMetrics,
  };
}

/**
 * Strike price level metrics injection
 */

function addMetricsToCombinedOptionsDataEntry(
  combinedOptionsData: CombinedOptionsDataEntryType,
): CombinedOptionsDataEntryWithMetricsType {
  const { ce, pe } = combinedOptionsData;
  if (!ce || !pe) {
    return combinedOptionsData;
  }

  const pcr = StockMetrics.getPCR(ce.changeInOpenInterest, pe.changeInOpenInterest);
  const volumeActionSignal = StockMetrics.getVolumeActionSignal({
    noOfCEContracts: ce.changeInOpenInterest,
    noOfPEContracts: pe.changeInOpenInterest,
  });
  const priceActionSignal = StockMetrics.getPriceActionSignal({
    callSideInterpretation: ce.interpretation,
    putSideInterpretation: pe.interpretation,
    noOfCEContracts: ce.changeInOpenInterest,
    noOfPEContracts: pe.changeInOpenInterest,
  });
  const marketSignal = StockMetrics.getMarketSignal({ volumeActionSignal, priceActionSignal });

  return {
    ...combinedOptionsData,
    pcr,
    volumeActionSignal,
    priceActionSignal,
    marketSignal,
  };
}

export function addMetricsToCombinedOptionsData(
  combinedOptionsData: CombinedOptionsDataEntryType[],
): CombinedOptionsDataEntryWithMetricsType[] {
  return combinedOptionsData.map((data) => addMetricsToCombinedOptionsDataEntry(data));
}

/**
 * Options chain level data injection
 */

function getMarketSignalsPercentageFromOptionsChainData({
  optionsChainData,
  VIXUpperLimit,
  VIXLowerLimit,
}: GetMarketSignalsPercentageFromOptionsChainDataInput): GetMarketSignalsPercentageFromOptionsChainDataPayload {
  let bearishSignals = 0,
    bullishSignals = 0,
    sidewaysSignals = 0;

  const { byStrikes } = optionsChainData;
  const filteredByStrikesData = byStrikes.filter(
    (byStrikeData) => byStrikeData.strikePrice >= VIXLowerLimit && byStrikeData.strikePrice <= VIXUpperLimit,
  );

  filteredByStrikesData.forEach((strikeData) => {
    if (!strikeData.marketSignal) {
      return;
    }

    switch (strikeData.marketSignal) {
      case MarketSignalEnum.BULLISH: {
        bullishSignals++;
        break;
      }
      case MarketSignalEnum.BEARISH: {
        bearishSignals++;
        break;
      }
      case MarketSignalEnum.SIDEWAYS: {
        sidewaysSignals++;
        break;
      }
    }
  });

  const totalSignals = bullishSignals + bearishSignals + sidewaysSignals;
  const bullishSignalsPercentage = (bullishSignals / totalSignals) * 100;
  const bearishSignalsPercentage = (bearishSignals / totalSignals) * 100;
  const sidewaysSignalsPercentage = (sidewaysSignals / totalSignals) * 100;

  return {
    bullishSignalsPercentage,
    bearishSignalsPercentage,
    sidewaysSignalsPercentage,
  };
}

export function addMetricsToOptionsChainData({
  optionsChainData,
  callOptionsData,
  putOptionsData,
  currentVIXValue,
  strikePriceStep,
  atmStrikePrice,
}: AddMetricsToOptionsChainDataInput): OptionsChainDataWithMetricsType {
  // CE Metrics
  const ceTotalChangeInOI = callOptionsData.reduce((total, ceData) => {
    return total + ceData.changeInOpenInterest;
  }, 0);
  const ceTotalChangeInPremium = callOptionsData.reduce((total, ceData) => {
    return total + ceData.changeInPremium;
  }, 0);
  const ceInterpretation = StockMetrics.getCurrentStrikePriceInterpretation({
    changeInOpenInterest: ceTotalChangeInOI,
    changeInPremium: ceTotalChangeInPremium,
  });

  // PE Metrics
  const peTotalChangeInOI = putOptionsData.reduce((total, peData) => {
    return total + peData.changeInOpenInterest;
  }, 0);
  const peTotalChangeInPremium = putOptionsData.reduce((total, peData) => {
    return total + peData.changeInPremium;
  }, 0);
  const peInterpretation = StockMetrics.getCurrentStrikePriceInterpretation({
    changeInOpenInterest: peTotalChangeInOI,
    changeInPremium: peTotalChangeInPremium,
  });

  const volumeActionSignal = StockMetrics.getVolumeActionSignal({
    noOfCEContracts: ceTotalChangeInOI,
    noOfPEContracts: peTotalChangeInOI,
  });
  const priceActionSignal = StockMetrics.getPriceActionSignal({
    callSideInterpretation: ceInterpretation,
    putSideInterpretation: peInterpretation,
    noOfCEContracts: ceTotalChangeInOI,
    noOfPEContracts: peTotalChangeInOI,
  });

  // Options Chain Data Metrics
  const { upperStrikePrice, lowerStrikePrice } = getStrikePriceRangeFromVIXValue({
    VIXValue: currentVIXValue,
    activeStrikePrice: atmStrikePrice,
    strikePriceStep,
  });

  const { bullishSignalsPercentage, bearishSignalsPercentage, sidewaysSignalsPercentage } =
    getMarketSignalsPercentageFromOptionsChainData({
      optionsChainData,
      VIXUpperLimit: upperStrikePrice,
      VIXLowerLimit: lowerStrikePrice,
    });
  const overallMarketSignal = StockMetrics.getOverallMarketSignal({
    bullishSignalsPercentage,
    bearishSignalsPercentage,
    sidewaysSignalsPercentage,
  });

  return {
    ...optionsChainData,
    totalChangeInCE: ceTotalChangeInOI,
    totalChangeInPE: peTotalChangeInOI,
    differenceInTotalChange: StockMetrics.getDifferenceInTotalOptionsChange(ceTotalChangeInOI, peTotalChangeInOI),
    pcr: StockMetrics.getPCR(ceTotalChangeInOI, peTotalChangeInOI),
    volumeActionSignal,
    priceActionSignal,
    marketSignal: overallMarketSignal,
    vixUpperStrike: upperStrikePrice,
    vixLowerStrike: lowerStrikePrice,
  };
}
