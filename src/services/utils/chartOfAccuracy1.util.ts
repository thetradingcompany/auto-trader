import { COA1DirectionalSignalEnum } from '../../enums/coa1DirectionalSignal.enum';
import { COA1SignalEnum } from './../../enums/coa1Signal.enum';
import { COA1SupportFromEnum } from './../../enums/coa1SupportFrom.enum';
import {
  GetChartOfAccuracy1MetricsInput,
  GetCOA1DirectionalSignalInput,
  GetCOA1SupportFromMetricInput,
} from './../../interfaces/coa1.interface';
import { ChartOfAccuracy1MetricsType } from './../../types/optionsData.type';
import * as fs from 'fs';

export const JUMP_TO_NEXT_BEST_STRIKE_PRICE_ON_PERCENT_DIFF_LTE = 20;

const sortDescendingFn = (num1, num2) => num2 - num1;

function isMaxDataStrikePriceWeak(maxDataPoint: number, secondMaxDataPoint: number): boolean {
  const difference = Math.abs(maxDataPoint - secondMaxDataPoint);
  const percentageDifference = (difference / maxDataPoint) * 100;

  // support / resistance is building up at next strike price
  if (percentageDifference <= JUMP_TO_NEXT_BEST_STRIKE_PRICE_ON_PERCENT_DIFF_LTE) {
    return true;
  }

  return false;
}

function getCOA1SupportFromMetric({
  strikeWithHighestVolume,
  strikeWithHighestOI,
  ITMStrikePrice,
}: GetCOA1SupportFromMetricInput): COA1SupportFromEnum {
  let supportFrom: COA1SupportFromEnum;
  if (strikeWithHighestVolume === strikeWithHighestOI) {
    supportFrom = COA1SupportFromEnum.BOTH;
  } else if (Math.abs(strikeWithHighestVolume - ITMStrikePrice) < Math.abs(strikeWithHighestOI - ITMStrikePrice)) {
    supportFrom = COA1SupportFromEnum.VOLUME;
  } else {
    supportFrom = COA1SupportFromEnum.OI;
  }

  return supportFrom;
}

function getCOA1DirectionalSignal({
  supportFrom,
  isMaxVolumeWeak,
  isMaxOIWeak,
  strikeWithHighestVolume,
  strikeWithSecondHighestVolume,
  strikeWithHighestOI,
  strikeWithSecondHighestOI,
}: GetCOA1DirectionalSignalInput): COA1DirectionalSignalEnum {
  // eslint-disable-next-line prefer-destructuring
  let COA1DirectionalSignal = COA1DirectionalSignalEnum.NEUTRAL;

  switch (supportFrom) {
    case COA1SupportFromEnum.VOLUME: {
      if (isMaxVolumeWeak) {
        if (strikeWithSecondHighestVolume < strikeWithHighestVolume) {
          COA1DirectionalSignal = COA1DirectionalSignalEnum.WTB;
        } else {
          COA1DirectionalSignal = COA1DirectionalSignalEnum.WTT;
        }
      } else {
        COA1DirectionalSignal = COA1DirectionalSignalEnum.STRONG;
      }
      break;
    }
    case COA1SupportFromEnum.OI: {
      if (isMaxOIWeak) {
        if (strikeWithSecondHighestOI < strikeWithHighestOI) {
          COA1DirectionalSignal = COA1DirectionalSignalEnum.WTB;
        } else {
          COA1DirectionalSignal = COA1DirectionalSignalEnum.WTT;
        }
      } else {
        COA1DirectionalSignal = COA1DirectionalSignalEnum.STRONG;
      }
      break;
    }
    case COA1SupportFromEnum.BOTH: {
      if (isMaxVolumeWeak && isMaxOIWeak) {
        if (strikeWithSecondHighestVolume < strikeWithHighestVolume && strikeWithSecondHighestOI < strikeWithHighestOI) {
          COA1DirectionalSignal = COA1DirectionalSignalEnum.WTB;
        } else if (
          strikeWithSecondHighestVolume > strikeWithHighestVolume &&
          strikeWithSecondHighestOI > strikeWithHighestOI
        ) {
          COA1DirectionalSignal = COA1DirectionalSignalEnum.WTT;
        } else {
          COA1DirectionalSignal = COA1DirectionalSignalEnum.WEAK;
        }
      } else {
        COA1DirectionalSignal = COA1DirectionalSignalEnum.STRONG;
      }
      break;
    }
    default: {
      break;
    }
  }

  return COA1DirectionalSignal;
}

export function getChartOfAccuracy1Metrics({
  symbolStrikePrice,
  atmStrikePrice,
  strikePriceStep,
  optionsChainData,
  COA1SupportsFileName,
}: GetChartOfAccuracy1MetricsInput): ChartOfAccuracy1MetricsType {
  let callSideITMStrikePrice: number, putSideITMStrikePrice: number;

  // choosing ITM strike prices based on imaginary line strike pairs
  if (symbolStrikePrice < atmStrikePrice) {
    // Imaginary line is above the rounded strike price
    callSideITMStrikePrice = atmStrikePrice - strikePriceStep;
    putSideITMStrikePrice = atmStrikePrice;
  } else {
    // Imaginary line is below the rounded strike price
    callSideITMStrikePrice = atmStrikePrice;
    putSideITMStrikePrice = atmStrikePrice + strikePriceStep;
  }

  const callSideVolumeToStrikePriceMap = new Map<number, number>();
  const putSideVolumeToStrikePriceMap = new Map<number, number>();

  const callSideOIToStrikePriceMap = new Map<number, number>();
  const putSideOIToStrikePriceMap = new Map<number, number>();

  optionsChainData.byStrikes.forEach((strikeData) => {
    const { strikePrice, ce: callChainData, pe: putChainData } = strikeData;
    // bounding both call and put side with strikePrice pairs selected based on imaginary line
    if (callChainData && strikePrice >= callSideITMStrikePrice) {
      callSideVolumeToStrikePriceMap.set(callChainData.totalTradedVolume, strikePrice);
      callSideOIToStrikePriceMap.set(callChainData.openInterest, strikePrice);
    }
    if (putChainData && strikePrice <= putSideITMStrikePrice) {
      putSideVolumeToStrikePriceMap.set(putChainData.totalTradedVolume, strikePrice);
      putSideOIToStrikePriceMap.set(putChainData.openInterest, strikePrice);
    }
  });

  const callSideVolumes = Array.from(callSideVolumeToStrikePriceMap.keys());
  callSideVolumes.sort(sortDescendingFn);
  const [callSideMaxVolume, callSideSecondMaxVolume] = callSideVolumes;
  const callSideStrikeWithHighestVolume = callSideVolumeToStrikePriceMap.get(callSideMaxVolume) ?? -1;
  const callSideStrikeWithSecondHighestVolume = callSideVolumeToStrikePriceMap.get(callSideSecondMaxVolume) ?? -1;

  const putSideVolumes = Array.from(putSideVolumeToStrikePriceMap.keys());
  putSideVolumes.sort(sortDescendingFn);
  const [putSideMaxVolume, putSideSecondMaxVolume] = putSideVolumes;
  const putSideStrikeWithHighestVolume = putSideVolumeToStrikePriceMap.get(putSideMaxVolume) ?? -1;
  const putSideStrikeWithSecondHighestVolume = putSideVolumeToStrikePriceMap.get(putSideSecondMaxVolume) ?? -1;

  const callSideOIs = Array.from(callSideOIToStrikePriceMap.keys());
  callSideOIs.sort(sortDescendingFn);
  const [callSideMaxOI, callSideSecondMaxOI] = callSideOIs;
  const callSideStrikeWithHighestOI = callSideOIToStrikePriceMap.get(callSideMaxOI) ?? -1;
  const callSideStrikeWithSecondHighestOI = callSideOIToStrikePriceMap.get(callSideSecondMaxOI) ?? -1;

  const putSideOIs = Array.from(putSideOIToStrikePriceMap.keys());
  putSideOIs.sort(sortDescendingFn);
  const [putSideMaxOI, putSideSecondMaxOI] = putSideOIs;
  const putSideStrikeWithHighestOI = putSideOIToStrikePriceMap.get(putSideMaxOI) ?? -1;
  const putSideStrikeWithSecondHighestOI = putSideOIToStrikePriceMap.get(putSideSecondMaxOI) ?? -1;

  let callSideSupportFrom = getCOA1SupportFromMetric({
    strikeWithHighestVolume: callSideStrikeWithHighestVolume,
    strikeWithHighestOI: callSideStrikeWithHighestOI,
    ITMStrikePrice: callSideITMStrikePrice,
  });
  let putSideSupportFrom = getCOA1SupportFromMetric({
    strikeWithHighestVolume: putSideStrikeWithHighestVolume,
    strikeWithHighestOI: putSideStrikeWithHighestOI,
    ITMStrikePrice: putSideITMStrikePrice,
  });

  // TODO: Do this via db call
  if (fs.existsSync(COA1SupportsFileName)) {
    const { callSideSupportFrom: parsedCallSideSupportFrom, putSideSupportFrom: parsedPutSideSupportFrom } = JSON.parse(
      fs.readFileSync(COA1SupportsFileName).toString(),
    );

    if (parsedCallSideSupportFrom !== COA1SupportFromEnum.BOTH) {
      callSideSupportFrom = parsedCallSideSupportFrom;
    } else {
      fs.writeFileSync(COA1SupportsFileName, JSON.stringify({ callSideSupportFrom, putSideSupportFrom }, null, 2), {
        flag: 'w',
      });
    }

    if (parsedPutSideSupportFrom !== COA1SupportFromEnum.BOTH) {
      putSideSupportFrom = parsedPutSideSupportFrom;
    } else {
      fs.writeFileSync(COA1SupportsFileName, JSON.stringify({ callSideSupportFrom, putSideSupportFrom }, null, 2), {
        flag: 'w',
      });
    }
  } else {
    fs.writeFileSync(COA1SupportsFileName, JSON.stringify({ callSideSupportFrom, putSideSupportFrom }, null, 2));
  }

  // find percentage difference of highest and second highest
  const isCallSideMaxVolumeWeak = isMaxDataStrikePriceWeak(callSideMaxVolume, callSideSecondMaxVolume);
  const isPutSideMaxVolumeWeak = isMaxDataStrikePriceWeak(putSideMaxVolume, putSideSecondMaxVolume);

  const isCallSideMaxOIWeak = isMaxDataStrikePriceWeak(callSideMaxOI, callSideSecondMaxOI);
  const isPutSideMaxOIWeak = isMaxDataStrikePriceWeak(putSideMaxOI, putSideSecondMaxOI);

  // decide COA1 signal type
  const callSideCOA1DirectionalSignal = getCOA1DirectionalSignal({
    supportFrom: callSideSupportFrom,
    isMaxVolumeWeak: isCallSideMaxVolumeWeak,
    isMaxOIWeak: isCallSideMaxOIWeak,
    strikeWithHighestVolume: callSideStrikeWithHighestVolume,
    strikeWithSecondHighestVolume: callSideStrikeWithSecondHighestVolume,
    strikeWithHighestOI: callSideStrikeWithHighestOI,
    strikeWithSecondHighestOI: callSideStrikeWithSecondHighestOI,
  });

  const putSideCOA1DirectionalSignal = getCOA1DirectionalSignal({
    supportFrom: putSideSupportFrom,
    isMaxVolumeWeak: isPutSideMaxVolumeWeak,
    isMaxOIWeak: isPutSideMaxOIWeak,
    strikeWithHighestVolume: putSideStrikeWithHighestVolume,
    strikeWithSecondHighestVolume: putSideStrikeWithSecondHighestVolume,
    strikeWithHighestOI: putSideStrikeWithHighestOI,
    strikeWithSecondHighestOI: putSideStrikeWithSecondHighestOI,
  });

  // eslint-disable-next-line prefer-destructuring
  let COA1Signal = COA1SignalEnum.NEUTRAL;
  switch (callSideCOA1DirectionalSignal) {
    case COA1DirectionalSignalEnum.STRONG: {
      switch (putSideCOA1DirectionalSignal) {
        case COA1DirectionalSignalEnum.STRONG: {
          COA1Signal = COA1SignalEnum.EOB;
          break;
        }
        case COA1DirectionalSignalEnum.WTT: {
          COA1Signal = COA1SignalEnum.EOS;
          break;
        }
        case COA1DirectionalSignalEnum.WTB: {
          COA1Signal = COA1SignalEnum.EOR;
          break;
        }
      }
      break;
    }
    case COA1DirectionalSignalEnum.WTT: {
      switch (putSideCOA1DirectionalSignal) {
        case COA1DirectionalSignalEnum.STRONG: {
          COA1Signal = COA1SignalEnum.EOS;
          break;
        }
        case COA1DirectionalSignalEnum.WTT: {
          COA1Signal = COA1SignalEnum.BULLISH;
          break;
        }
        case COA1DirectionalSignalEnum.WTB: {
          COA1Signal = COA1SignalEnum.NEUTRAL;
          break;
        }
      }
      break;
    }
    case COA1DirectionalSignalEnum.WTB: {
      switch (putSideCOA1DirectionalSignal) {
        case COA1DirectionalSignalEnum.STRONG: {
          COA1Signal = COA1SignalEnum.EOR;
          break;
        }
        case COA1DirectionalSignalEnum.WTT: {
          COA1Signal = COA1SignalEnum.NEUTRAL;
          break;
        }
        case COA1DirectionalSignalEnum.WTB: {
          COA1Signal = COA1SignalEnum.BEARISH;
          break;
        }
      }
      break;
    }
  }

  return {
    COA1Signal,
    callSideStrikeWithHighestVolume,
    putSideStrikeWithHighestVolume,
    callSideStrikeWithHighestOI,
    putSideStrikeWithHighestOI,
    callSideStrikeWithSecondHighestVolume,
    putSideStrikeWithSecondHighestVolume,
    callSideStrikeWithSecondHighestOI,
    putSideStrikeWithSecondHighestOI,
    callSideCOA1DirectionalSignal,
    putSideCOA1DirectionalSignal,
    callSideITMStrikePrice,
    putSideITMStrikePrice,
    callSideSupportFrom,
    putSideSupportFrom,
  };
}
