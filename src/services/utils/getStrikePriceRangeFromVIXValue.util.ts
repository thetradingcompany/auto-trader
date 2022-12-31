import { roundToNearestMultiple } from '../../utils/calculation.util';
import {
  GetStrikePriceRangeFromVIXValueInput,
  GetStrikePriceRangeFromVIXValuePayload,
} from './../../interfaces/stockMetrics.interface';

export function getStrikePriceRangeFromVIXValue({
  VIXValue,
  activeStrikePrice,
  strikePriceStep,
}: GetStrikePriceRangeFromVIXValueInput): GetStrikePriceRangeFromVIXValuePayload {
  const deviationPercentage = VIXValue / Math.sqrt(365) / 100;
  const activeDeviation = activeStrikePrice * deviationPercentage;

  const upperRange = activeStrikePrice + activeDeviation;
  const lowerRange = activeStrikePrice - activeDeviation;

  const upperStrikePrice = roundToNearestMultiple(upperRange, strikePriceStep);
  const lowerStrikePrice = roundToNearestMultiple(lowerRange, strikePriceStep);

  return {
    upperStrikePrice,
    lowerStrikePrice,
  };
}
