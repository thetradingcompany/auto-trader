import axios, { AxiosResponse } from 'axios';

class NSEController {
  async getOptionsChainData(symbol: string): Promise<AxiosResponse<any, any>> {
    const optionChainData = await axios.get(`https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`);
    return optionChainData;
  }

  async getIndexData(stockSymbol: string): Promise<AxiosResponse<any, any>> {
    const baseUrl = 'https://www1.nseindia.com/live_market/dynaContent/live_watch/stock_watch';
    let indexFileName: string;

    switch (stockSymbol) {
      case 'NIFTY': {
        indexFileName = 'niftyStockWatch.json';
        break;
      }
      case 'BANKNIFTY': {
        indexFileName = 'bankNiftyStockWatch.json';
        break;
      }
      default: {
        // fallback to nifty 50 universe
        indexFileName = 'niftyStockWatch.json';
        break;
      }
    }

    const indexData = await axios.get(`${baseUrl}/${indexFileName}`);

    return indexData;
  }

  async getVIXData(): Promise<AxiosResponse<any, any>> {
    const vixData = await axios.get('https://www1.nseindia.com/live_market/dynaContent/live_watch/VixDetails.json');
    return vixData;
  }
}

export const nseController = new NSEController();
