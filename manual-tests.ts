import { ContentClient } from './build/main/index';

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
  console.log('\n🎉 All manual tests completed 🎉\n');
});
