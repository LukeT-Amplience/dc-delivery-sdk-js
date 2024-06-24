import { ContentClient } from './build/main/index';

import readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const proxy = {
  protocol: 'http',
  host: 'localhost',
  port: 8888,
};

const cd2FreshClient: any = new ContentClient({
  baseUrl: 'https://cdv3.fresh.content.amplience-turing.net',
  hubName: 'cdv3',
  apiKey: 'BEgRwAHdmL9NX8TFMnAtT6zNyAYUpqrO97NyvCfX',
});

cd2FreshClient.contentClient.defaults.proxy = proxy;

(async function () {
  await cd2FreshClient.getContentItemByKey('categories');
})().catch((error) => {
  if (error.status !== 429) {
    console.log(error);
    return;
  }
  console.log('\n🎉 Default retry test completed 🎉\n');
  testCustomRetries();
});

async function testCustomRetries() {
  await rl.question('\n Enter amount of retries \n', function (retries: any) {
    const retryNum = parseInt(retries);
    if (isNaN(retries)) {
      console.log('\n Must enter a number \n');
      testCustomRetries();
    } else {
      const cd2FreshCustomClient: any = new ContentClient({
        baseUrl: 'https://cdv3.fresh.content.amplience-turing.net',
        hubName: 'cdv3',
        apiKey: 'BEgRwAHdmL9NX8TFMnAtT6zNyAYUpqrO97NyvCfX',
        retryConfig: { retries: retryNum },
      });
      cd2FreshCustomClient.contentClient.defaults.proxy = proxy;
      (async function () {
        await cd2FreshCustomClient.getContentItemByKey('categories');
      })().catch((error) => {
        if (error.status !== 429) {
          console.log(error);
          return;
        }
        console.log('\n🎉 Custom retry test completed 🎉\n');
        rl.close();
        process.exit(0);
      });
    }
  });
}
