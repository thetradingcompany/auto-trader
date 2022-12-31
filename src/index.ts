import { AutoTraderServer } from './app/index';

try {
  AutoTraderServer.start();
} catch (err) {
  console.log(err);
  process.exit(1);
}
