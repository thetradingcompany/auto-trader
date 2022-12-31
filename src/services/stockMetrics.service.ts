import { StrikePriceInterpretationsEnum } from '../enums/strikePriceInterpretations.enum';
import { OHLCVData } from '../types/ohlcv.type';
import { MarketSignalEnum } from './../enums/marketSignal.enum';
import { OptionsSignalEnum } from './../enums/optionsSignal.enum';
import {
  GetCurrentStrikePriceInterpretationInput,
  GetDefaultPriceActionSignalFromCurrentStrikeImplementationsInput,
  GetMarketSignalInput,
  GetOverallMarketSignalInput,
  GetPriceActionSignalFromCurrentStrikeImplementationsInput,
  GetPriceActionSignalInput,
  GetVolumeActionSignalInput,
} from './../interfaces/stockMetrics.interface';

export type OptionMetrics = {
  time: string;
  totalChangeInCE: number;
  totalChangeInPE: number;
  differenceInTotalChange: number;
  pcr: number;
  optionSignal: OptionsSignalEnum;
  vwap?: number;
  price?: number;
  vwapSignal?: number;
};

export class StockMetrics {
  public static getDifferenceInTotalOptionsChange(noOfCEContracts: number, noOfPEContracts: number): number {
    return noOfCEContracts - noOfPEContracts;
  }

  public static getPCR(noOfCEContracts: number, noOfPEContracts: number): number {
    if (noOfCEContracts === 0) {
      return 0;
    }

    return noOfPEContracts / noOfCEContracts;
  }

  public static getVolumeActionSignal({ noOfCEContracts, noOfPEContracts }: GetVolumeActionSignalInput): OptionsSignalEnum {
    const pcr = this.getPCR(noOfCEContracts, noOfPEContracts);
    if (pcr > 2) {
      return OptionsSignalEnum.UP_PLUS;
    } else if (pcr >= 1) {
      return OptionsSignalEnum.UP;
    } else if (pcr < 0 && noOfPEContracts > 0) {
      return OptionsSignalEnum.UP;
    } else if (pcr <= 0.5) {
      return OptionsSignalEnum.DOWN_PLUS;
    }

    return OptionsSignalEnum.DOWN;
  }

  public static getVWAP(ohlvData: OHLCVData, cumulativeVolume: number): number {
    const { open, high, close, volume } = ohlvData;
    const typicalPrice = (open + high + close) / 3;
    const vwap = (typicalPrice / cumulativeVolume) * volume;

    return vwap;
  }

  public static getCurrentStrikePriceInterpretation({
    changeInOpenInterest,
    changeInPremium,
  }: GetCurrentStrikePriceInterpretationInput): StrikePriceInterpretationsEnum {
    if (changeInPremium > 0) {
      if (changeInOpenInterest > 0) {
        return StrikePriceInterpretationsEnum.BUYING_CONTRACTS;
      } else if (changeInOpenInterest < 0) {
        return StrikePriceInterpretationsEnum.SQUARE_OFF_SOLD_CONTRACTS;
      }
    } else if (changeInPremium < 0) {
      if (changeInOpenInterest > 0) {
        return StrikePriceInterpretationsEnum.SELLING_CONTRACTS;
      } else if (changeInOpenInterest < 0) {
        return StrikePriceInterpretationsEnum.SQUARE_OFF_BOUGHT_CONTRACTS;
      }
    }

    return StrikePriceInterpretationsEnum.NO_SIGNIFICANT_MOVEMENT;
  }

  private static getDefaultPriceActionSignalFromCurrentStrikeImplementations({
    callSideSignal,
    putSideSignal,
  }: GetDefaultPriceActionSignalFromCurrentStrikeImplementationsInput): OptionsSignalEnum {
    if (callSideSignal === OptionsSignalEnum.UP && putSideSignal === OptionsSignalEnum.UP) {
      return OptionsSignalEnum.UP_PLUS;
    } else if (callSideSignal === OptionsSignalEnum.UP && putSideSignal === OptionsSignalEnum.DOWN) {
      return OptionsSignalEnum.NEUTRAL;
    } else if (callSideSignal === OptionsSignalEnum.DOWN && putSideSignal === OptionsSignalEnum.UP) {
      return OptionsSignalEnum.NEUTRAL;
    } else if (callSideSignal === OptionsSignalEnum.DOWN && putSideSignal === OptionsSignalEnum.DOWN) {
      return OptionsSignalEnum.DOWN_PLUS;
    }

    return OptionsSignalEnum.NEUTRAL;
  }

  private static getPriceActionSignalFromCurrentStrikeImplementations({
    callSideSignal,
    putSideSignal,
    noOfCEContracts,
    noOfPEContracts,
  }: GetPriceActionSignalFromCurrentStrikeImplementationsInput): OptionsSignalEnum {
    const pcr = StockMetrics.getPCR(noOfCEContracts, noOfPEContracts);
    const totalChangeInContracts = noOfCEContracts + noOfPEContracts;

    if (pcr > 2) {
      return putSideSignal;
    } else if (pcr < 1 && pcr > 0) {
      return callSideSignal;
    } else if (pcr < 0 && totalChangeInContracts < noOfPEContracts && totalChangeInContracts > 0) {
      return putSideSignal;
    } else if (pcr < 0 && totalChangeInContracts > noOfPEContracts) {
      return callSideSignal;
    } else if (pcr < 0 && totalChangeInContracts < 0) {
      return callSideSignal;
    }

    return StockMetrics.getDefaultPriceActionSignalFromCurrentStrikeImplementations({ callSideSignal, putSideSignal });
  }

  private static getCallSidePriceActionSignal(callSideInterpretation: StrikePriceInterpretationsEnum): OptionsSignalEnum {
    switch (callSideInterpretation) {
      case StrikePriceInterpretationsEnum.BUYING_CONTRACTS: {
        return OptionsSignalEnum.UP;
      }
      case StrikePriceInterpretationsEnum.SELLING_CONTRACTS: {
        return OptionsSignalEnum.DOWN;
      }
      case StrikePriceInterpretationsEnum.SQUARE_OFF_BOUGHT_CONTRACTS: {
        return OptionsSignalEnum.DOWN;
      }
      case StrikePriceInterpretationsEnum.SQUARE_OFF_SOLD_CONTRACTS: {
        return OptionsSignalEnum.UP;
      }
      case StrikePriceInterpretationsEnum.NO_SIGNIFICANT_MOVEMENT: {
        return OptionsSignalEnum.NEUTRAL;
      }
    }
  }

  private static getPutSidePriceActionSignal(putSideInterpretation: StrikePriceInterpretationsEnum): OptionsSignalEnum {
    switch (putSideInterpretation) {
      case StrikePriceInterpretationsEnum.BUYING_CONTRACTS: {
        return OptionsSignalEnum.DOWN;
      }
      case StrikePriceInterpretationsEnum.SELLING_CONTRACTS: {
        return OptionsSignalEnum.UP;
      }
      case StrikePriceInterpretationsEnum.SQUARE_OFF_BOUGHT_CONTRACTS: {
        return OptionsSignalEnum.UP;
      }
      case StrikePriceInterpretationsEnum.SQUARE_OFF_SOLD_CONTRACTS: {
        return OptionsSignalEnum.DOWN;
      }
      case StrikePriceInterpretationsEnum.NO_SIGNIFICANT_MOVEMENT: {
        return OptionsSignalEnum.NEUTRAL;
      }
    }
  }

  public static getPriceActionSignal(input: GetPriceActionSignalInput): OptionsSignalEnum {
    const { callSideInterpretation, putSideInterpretation, noOfCEContracts, noOfPEContracts } = input;
    const callSideSignal = StockMetrics.getCallSidePriceActionSignal(callSideInterpretation);
    const putSideSignal = StockMetrics.getPutSidePriceActionSignal(putSideInterpretation);

    return StockMetrics.getPriceActionSignalFromCurrentStrikeImplementations({
      callSideSignal,
      putSideSignal,
      noOfCEContracts,
      noOfPEContracts,
    });
  }

  public static getMarketSignal({ volumeActionSignal, priceActionSignal }: GetMarketSignalInput): MarketSignalEnum {
    switch (volumeActionSignal) {
      case OptionsSignalEnum.UP_PLUS: {
        switch (priceActionSignal) {
          case OptionsSignalEnum.UP: {
            return MarketSignalEnum.BULLISH;
          }
          case OptionsSignalEnum.DOWN: {
            return MarketSignalEnum.SIDEWAYS;
          }
          default: {
            return MarketSignalEnum.SIDEWAYS;
          }
        }
      }
      case OptionsSignalEnum.UP: {
        switch (priceActionSignal) {
          case OptionsSignalEnum.UP: {
            return MarketSignalEnum.BULLISH;
          }
          case OptionsSignalEnum.DOWN: {
            return MarketSignalEnum.SIDEWAYS;
          }
          default: {
            return MarketSignalEnum.SIDEWAYS;
          }
        }
      }
      case OptionsSignalEnum.DOWN_PLUS: {
        switch (priceActionSignal) {
          case OptionsSignalEnum.UP: {
            return MarketSignalEnum.SIDEWAYS;
          }
          case OptionsSignalEnum.DOWN: {
            return MarketSignalEnum.BEARISH;
          }
          default: {
            return MarketSignalEnum.SIDEWAYS;
          }
        }
      }
      case OptionsSignalEnum.DOWN: {
        switch (priceActionSignal) {
          case OptionsSignalEnum.UP: {
            return MarketSignalEnum.SIDEWAYS;
          }
          case OptionsSignalEnum.DOWN: {
            return MarketSignalEnum.BEARISH;
          }
          default: {
            return MarketSignalEnum.SIDEWAYS;
          }
        }
      }
      default: {
        return MarketSignalEnum.SIDEWAYS;
      }
    }
  }

  public static getOverallMarketSignal({
    bullishSignalsPercentage,
    bearishSignalsPercentage,
    sidewaysSignalsPercentage,
  }: GetOverallMarketSignalInput): MarketSignalEnum {
    // eslint-disable-next-line prefer-destructuring
    let overallMarketSignal = MarketSignalEnum.SIDEWAYS;
    if (bullishSignalsPercentage > 50) {
      overallMarketSignal = MarketSignalEnum.BULLISH;
    } else if (bearishSignalsPercentage > 50) {
      overallMarketSignal = MarketSignalEnum.BEARISH;
    } else if (sidewaysSignalsPercentage > 20) {
      if (bullishSignalsPercentage > bearishSignalsPercentage) {
        overallMarketSignal = MarketSignalEnum.SIDEWAYS_WITH_SLIGHT_BULLISH;
      } else if (bullishSignalsPercentage < bearishSignalsPercentage) {
        overallMarketSignal = MarketSignalEnum.SIDEWAYS_WITH_SLIGHT_BEARISH;
      }
    }

    return overallMarketSignal;
  }

  public static timeSeriesEntry(changeInCE: number, changeInPE: number, currentTime: string): OptionMetrics {
    return {
      time: currentTime,
      totalChangeInCE: changeInCE,
      totalChangeInPE: changeInPE,
      differenceInTotalChange: this.getDifferenceInTotalOptionsChange(changeInCE, changeInPE),
      pcr: this.getPCR(changeInCE, changeInPE),
      optionSignal: this.getVolumeActionSignal({
        noOfCEContracts: changeInCE,
        noOfPEContracts: changeInPE,
      }),
    };
  }
}
