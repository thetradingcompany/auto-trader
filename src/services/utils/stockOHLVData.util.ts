import { isEmpty } from 'lodash';
import { OHLCVData } from '../../types/ohlcv.type';

export function getStockOHLCVDataFromNSEData(symbol: string, indexDataPayload: any): OHLCVData {
  const {
    data: { data: universeData, latestData: indexData, trdVolumesum: totalTradedVolume },
  } = indexDataPayload;

  let close: number, high: number, low: number, open: number, tradedVolume: number;

  const filteredSymbolData = universeData.filter((data) => data.symbol === symbol);
  if (isEmpty(filteredSymbolData)) {
    // eslint-disable-next-line prefer-destructuring
    ({ high, low, open, ltP: close } = indexData[0]);
    tradedVolume = totalTradedVolume;
  } else {
    // eslint-disable-next-line prefer-destructuring
    ({ high, low, open, ltP: close, trdVol: tradedVolume } = filteredSymbolData[0]);
  }

  return {
    high,
    low,
    open,
    close,
    volume: tradedVolume,
  };
}
