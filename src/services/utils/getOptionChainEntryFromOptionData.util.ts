import { NSEOptionDataEntryType, OptionChainEntryType } from '../../types/optionsData.type';

export function getOptionChainEntryFromOptionDataEntry(
  optionDataEntry: NSEOptionDataEntryType,
): OptionChainEntryType | undefined {
  const {
    strikePrice,
    lastPrice,
    openInterest,
    changeinOpenInterest: changeInOpenInterest,
    change: changeInPremium,
    totalTradedVolume,
    impliedVolatility,
  } = optionDataEntry;

  if (!strikePrice || !lastPrice || !openInterest || !changeInOpenInterest || !changeInPremium || !totalTradedVolume) {
    return;
  }

  return {
    strikePrice,
    lastPrice,
    openInterest,
    changeInOpenInterest,
    changeInPremium,
    totalTradedVolume,
    IV: impliedVolatility,
  };
}
