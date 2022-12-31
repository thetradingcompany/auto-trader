import lodash from 'lodash';
import { GetFilteredOptionsChainDataByStrikeInput } from '../../interfaces/stockSignals.interface';
import { roundToNearestMultiple } from '../../utils/calculation.util';

export function getFilteredOptionsChainDataByStrike({
  optionsData,
  symbolStrikePrice,
  symbolStrikePrices,
  expiryDate,
  strikeRangeLimit,
  strikePriceStep,
}: GetFilteredOptionsChainDataByStrikeInput): Record<string, any> {
  const inputExpiryData = optionsData.filter((data) => data.expiryDate === expiryDate);

  const optionChainDataByStrike = lodash.keyBy(inputExpiryData, (data) => data.strikePrice);

  const roundedStrikePrice = roundToNearestMultiple(symbolStrikePrice, strikePriceStep);
  const currentStrikeIndex = symbolStrikePrices.findIndex((strikePrice) => strikePrice === roundedStrikePrice);

  const strikeRange: number[] = [];
  for (let index = currentStrikeIndex - strikeRangeLimit; index <= currentStrikeIndex + strikeRangeLimit; index++) {
    strikeRange.push(symbolStrikePrices[index]);
  }

  const filteredOptionChainDataByStrike = Object.fromEntries(
    Object.entries(optionChainDataByStrike).filter(([key]) => strikeRange.includes(parseInt(key))),
  );

  return filteredOptionChainDataByStrike;
}
