import { mongoConnect } from '../connections/mongo.connection';
import { StockSignals } from './../services/stockSignals.service';

export type StockInputType = {
  symbol: string;
  autoFillExpiries?: boolean;
  strikeRange?: number;
  strikePriceStep?: number;
  expiry?: string;
};

export class AutoTraderServer {
  private static readonly stocksData: StockInputType[] = [
    {
      symbol: 'NIFTY',
      autoFillExpiries: true,
      strikeRange: 10, // 10 strikes above and below data
      strikePriceStep: 50,
    },
    {
      symbol: 'BANKNIFTY',
      autoFillExpiries: true,
      strikeRange: 10,
      strikePriceStep: 100,
    },
  ];

  private static readonly runFrequency = 5 * 60 * 1000;

  private static async processStockData(stockData: StockInputType): Promise<void> {
    const { symbol, autoFillExpiries, strikeRange, strikePriceStep } = stockData;
    const stockSignals = new StockSignals(symbol, autoFillExpiries, strikeRange, strikePriceStep);
    await stockSignals.populateOptionsChainSignalsData();

    return;
  }

  private static async process() {
    try {
      console.log('starting');

      for (const stockData of this.stocksData) {
        try {
          await AutoTraderServer.processStockData(stockData);
        } catch (err) {
          console.log(`Faced error. Trying again for stock - ${stockData.symbol}`);
          try {
            await AutoTraderServer.processStockData(stockData);
          } catch (error) {
            throw error;
          }
        }
      }

      console.log('completed. waiting now.');
    } catch (err) {
      console.log(`Faced error at ${new Date().toTimeString()}. Try again.`);
      // console.error(err);
    }
  }

  private static async initializeMongo(): Promise<void> {
    await mongoConnect();
  }

  public static async start() {
    await AutoTraderServer.initializeMongo();
    await AutoTraderServer.process();
    setInterval(() => {
      AutoTraderServer.process();
    }, AutoTraderServer.runFrequency);
  }
}
