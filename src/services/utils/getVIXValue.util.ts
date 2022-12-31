import { nseController } from './../../controller/nse.controller';

export async function getCurrentVIXValue(): Promise<number> {
  const vixData = await nseController.getVIXData();
  const {
    data: { currentVixSnapShot },
  } = vixData;
  const [latestSnapshot] = currentVixSnapShot;

  return parseInt(latestSnapshot.CURRENT_PRICE);
}
