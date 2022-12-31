import { CombinedOptionsDataEntryType, OptionChainEntryType } from './../../types/optionsData.type';
import { isEmpty, keyBy } from 'lodash';
import { GetCombinedOptionsDataByStrikeInput } from '../../interfaces/stockSignals.interface';

export function getCombinedOptionsDataByStrike({
  callOptionsData,
  putOptionsData,
}: GetCombinedOptionsDataByStrikeInput): Array<CombinedOptionsDataEntryType> {
  const callDataByStrike = keyBy(callOptionsData, (data) => data.strikePrice);
  const putDataByStrike = keyBy(putOptionsData, (data) => data.strikePrice);

  const strikePriceSet = new Set<string>();
  Object.keys(callDataByStrike).forEach((strikePrice) => {
    strikePriceSet.add(strikePrice);
  });
  Object.keys(putDataByStrike).forEach((strikePrice) => {
    strikePriceSet.add(strikePrice);
  });

  const combinedOptionsData: CombinedOptionsDataEntryType[] = [];
  Array.from(strikePriceSet).forEach((strikePrice) => {
    const data: Record<string, OptionChainEntryType> = {};
    if (callDataByStrike[strikePrice]) {
      data.ce = callDataByStrike[strikePrice];
    }
    if (putDataByStrike[strikePrice]) {
      data.pe = putDataByStrike[strikePrice];
    }

    if (!isEmpty(data)) {
      combinedOptionsData.push({ strikePrice: parseInt(strikePrice), ...data });
    }
  });

  return combinedOptionsData;
}
