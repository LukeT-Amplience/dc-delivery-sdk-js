import MockAdapter from 'axios-mock-adapter';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ContentMapper } from '../mapper/ContentMapper';
import { GetContentItemV2Impl } from './GetContentItemV2Impl';
import * as NO_RESULTS from './__fixtures__/v2/NO_RESULTS.json';
import * as RESULT from './__fixtures__/v2/RESULT.json';
import { ContentMeta } from '../model/ContentMeta';
import { Image } from '../../media/Image';
import { HttpError } from '../model/HttpError';
import { ContentNotFoundError } from '../model/ContentNotFoundError';

use(chaiAsPromised);

function createCoordinator(
  hubName: string,
  locale?: string,
  apiKey?: string,
  retryConfig?: Record<string, unknown>
): [MockAdapter, GetContentItemV2Impl] {
  const mocks = new MockAdapter(null);

  const config = {
    hubName,
    adaptor: mocks.adapter(),
    locale,
    apiKey,
    retryConfig,
  };
  const client = new GetContentItemV2Impl(config, new ContentMapper(config));
  return [mocks, client];
}

const cd2RunConfig = {
  type: 'cdn',
  endpoint: 'https://hub.cdn.content.amplience.net/content/filter',
  config: { hubName: 'hub' },
};

const freshRunConfig = {
  type: 'fresh',
  endpoint: 'https://hub.fresh.content.amplience.net/content/filter',
  config: { hubName: 'hub', apiKey: 'key' },
};

const runs = [cd2RunConfig, freshRunConfig];

describe('GetContentItemV2Impl', () => {
  runs.forEach(({ type }) => {
    describe(`${type}`, () => {
      context('getContentItemById', () => {
        it('should reject if content item not found', (done) => {
          let [mocks, coordinator] = createCoordinator('test', 'en_US');
          if (type === freshRunConfig.type) {
            [mocks, coordinator] = createCoordinator(
              'test',
              'en_US',
              'test-key'
            );
          }
          mocks
            .onGet(
              `https://test.${type}.content.amplience.net/content/id/2c7efa09-7e31-4503-8d00-5a150ff82f17?depth=all&format=inlined&locale=en_US`
            )
            .reply(404, NO_RESULTS);
          expect(
            coordinator.getContentItemById(
              '2c7efa09-7e31-4503-8d00-5a150ff82f17'
            )
          )
            .to.eventually.rejectedWith(
              ContentNotFoundError,
              'Content item "2c7efa09-7e31-4503-8d00-5a150ff82f17" was not found'
            )
            .and.notify(done);
        });

        it('should resolve if content item is found', async () => {
          let [mocks, coordinator] = createCoordinator('test', 'en_US');
          if (type === freshRunConfig.type) {
            [mocks, coordinator] = createCoordinator(
              'test',
              'en_US',
              'test-key'
            );
          }

          mocks
            .onGet(
              `https://test.${type}.content.amplience.net/content/id/2c7efa09-7e31-4503-8d00-5a150ff82f17?depth=all&format=inlined&locale=en_US`
            )
            .reply(200, RESULT);

          const response = await coordinator.getContentItemById(
            '2c7efa09-7e31-4503-8d00-5a150ff82f17'
          );

          expect(response.toJSON()).to.deep.eq(RESULT['content']);
          expect(response.body._meta).to.be.instanceOf(ContentMeta);
        });

        it('should use hubName as the subdomain in the hostname', async () => {
          let [mocks, coordinator] = createCoordinator('another-hub');
          if (type === freshRunConfig.type) {
            [mocks, coordinator] = createCoordinator(
              'another-hub',
              null,
              'test-key'
            );
          }

          mocks
            .onGet(
              `https://another-hub.${type}.content.amplience.net/content/id/2c7efa09-7e31-4503-8d00-5a150ff82f17?depth=all&format=inlined`
            )
            .reply(200, RESULT);

          const response = await coordinator.getContentItemById(
            '2c7efa09-7e31-4503-8d00-5a150ff82f17'
          );

          expect(response.toJSON()).to.deep.eq(RESULT['content']);
        });

        it('should use locale as the subdomain in the hostname', async () => {
          let [mocks, coordinator] = createCoordinator('test', 'fr_FR');
          if (type === freshRunConfig.type) {
            [mocks, coordinator] = createCoordinator(
              'test',
              'fr_FR',
              'test-key'
            );
          }

          mocks
            .onGet(
              `https://test.${type}.content.amplience.net/content/id/2c7efa09-7e31-4503-8d00-5a150ff82f17?depth=all&format=inlined&locale=fr_FR`
            )
            .reply(200, RESULT);

          const response = await coordinator.getContentItemById(
            '2c7efa09-7e31-4503-8d00-5a150ff82f17'
          );

          expect(response.toJSON()).to.deep.eq(RESULT['content']);
        });

        if (type === freshRunConfig.type) {
          it('should throw "Exceeded rate limit" if retries failed', async () => {
            const [mocks, coordinator] = createCoordinator(
              'test',
              'en_US',
              'test',
              {
                retryDelay: () => 0,
              }
            );

            const data = {
              error: {
                type: 'THROTTLED_REQUEST',
                message: 'Exceeded rate limit',
              },
            };

            mocks
              .onGet(
                'https://test.fresh.content.amplience.net/content/id/2c7efa09-7e31-4503-8d00-5a150ff82f17?depth=all&format=inlined&locale=en_US'
              )
              .replyOnce(429, data)
              .onGet(
                'https://test.fresh.content.amplience.net/content/id/2c7efa09-7e31-4503-8d00-5a150ff82f17?depth=all&format=inlined&locale=en_US'
              )
              .replyOnce(429, data)
              .onGet(
                'https://test.fresh.content.amplience.net/content/id/2c7efa09-7e31-4503-8d00-5a150ff82f17?depth=all&format=inlined&locale=en_US'
              )
              .replyOnce(429, data)
              .onGet(
                'https://test.fresh.content.amplience.net/content/id/2c7efa09-7e31-4503-8d00-5a150ff82f17?depth=all&format=inlined&locale=en_US'
              )
              .replyOnce(429, data);

            expect(
              coordinator.getContentItemById(
                '2c7efa09-7e31-4503-8d00-5a150ff82f17'
              )
            ).to.be.rejectedWith('Exceeded rate limit');
          });
        }
      });

      context('getContentItemByKey', () => {
        it('should reject if content item not found', (done) => {
          let [mocks, coordinator] = createCoordinator('test', 'en_US');
          if (type === freshRunConfig.type) {
            [mocks, coordinator] = createCoordinator(
              'test',
              'en_US',
              'test-key'
            );
          }
          mocks
            .onGet(
              `https://test.${type}.content.amplience.net/content/key/a-delivery-key?depth=all&format=inlined&locale=en_US`
            )
            .reply(404, NO_RESULTS);
          expect(coordinator.getContentItemByKey('a-delivery-key'))
            .to.eventually.rejectedWith(
              ContentNotFoundError,
              'Content item "a-delivery-key" was not found'
            )
            .and.notify(done);
        });

        it('should reject if request fails', (done) => {
          let [mocks, coordinator] = createCoordinator('test', 'en_US');
          if (type === freshRunConfig.type) {
            [mocks, coordinator] = createCoordinator(
              'test',
              'en_US',
              'test-key'
            );
          }
          mocks
            .onGet(
              `https://test.${type}.content.amplience.net/content/key/a-delivery-key?depth=all&format=inlined&locale=en_US`
            )
            .reply(500, 'Internal Server Error');
          expect(coordinator.getContentItemByKey('a-delivery-key'))
            .to.eventually.rejectedWith(HttpError, 'Internal Server Error')
            .and.notify(done);
        });

        it('should resolve if content item is found', async () => {
          let [mocks, coordinator] = createCoordinator('test', 'en_US');
          if (type === freshRunConfig.type) {
            [mocks, coordinator] = createCoordinator(
              'test',
              'en_US',
              'test-key'
            );
          }
          mocks
            .onGet(
              `https://test.${type}.content.amplience.net/content/key/a-delivery-key?depth=all&format=inlined&locale=en_US`
            )
            .reply(200, RESULT);

          const response = await coordinator.getContentItemByKey(
            'a-delivery-key'
          );

          expect(response.toJSON()).to.deep.eq(RESULT['content']);
          expect(response.body._meta).to.be.instanceOf(ContentMeta);
          expect(response.body['image'].image).to.be.instanceOf(Image);
          expect(response.body['authors'][0].avatar.image).to.be.instanceOf(
            Image
          );
        });

        it('should use hubName as the subdomain in the hostname', async () => {
          let [mocks, coordinator] = createCoordinator('another-hub');
          if (type === freshRunConfig.type) {
            [mocks, coordinator] = createCoordinator(
              'another-hub',
              null,
              'test-key'
            );
          }
          mocks
            .onGet(
              `https://another-hub.${type}.content.amplience.net/content/key/a-delivery-key?depth=all&format=inlined`
            )
            .reply(200, RESULT);

          const response = await coordinator.getContentItemByKey(
            'a-delivery-key'
          );

          expect(response.toJSON()).to.deep.eq(RESULT['content']);
        });

        it('should use locale as the subdomain in the hostname', async () => {
          let [mocks, coordinator] = createCoordinator('test', 'fr_FR');
          if (type === freshRunConfig.type) {
            [mocks, coordinator] = createCoordinator(
              'test',
              'fr_FR',
              'test-key'
            );
          }
          mocks
            .onGet(
              `https://test.${type}.content.amplience.net/content/key/a-delivery-key?depth=all&format=inlined&locale=fr_FR`
            )
            .reply(200, RESULT);

          const response = await coordinator.getContentItemByKey(
            'a-delivery-key'
          );

          expect(response.toJSON()).to.deep.eq(RESULT['content']);
        });
        if (type === freshRunConfig.type) {
          it('should throw "Exceeded rate limit" if retries failed', async () => {
            const [mocks, coordinator] = createCoordinator(
              'test',
              'en_US',
              'test',
              {
                retryDelay: () => 0,
              }
            );

            const data = {
              error: {
                type: 'THROTTLED_REQUEST',
                message: 'Exceeded rate limit',
              },
            };

            mocks
              .onGet(
                'https://test.fresh.content.amplience.net/content/key/a-delivery-key?depth=all&format=inlined&locale=en_US'
              )
              .replyOnce(429, data)
              .onGet(
                'https://test.fresh.content.amplience.net/content/key/a-delivery-key?depth=all&format=inlined&locale=en_US'
              )
              .replyOnce(429, data)
              .onGet(
                'https://test.fresh.content.amplience.net/content/key/a-delivery-key?depth=all&format=inlined&locale=en_US'
              )
              .replyOnce(429, data)
              .onGet(
                'https://test.fresh.content.amplience.net/content/key/a-delivery-key?depth=all&format=inlined&locale=en_US'
              )
              .replyOnce(429, data);

            expect(
              coordinator.getContentItemByKey('a-delivery-key')
            ).to.be.rejectedWith('Exceeded rate limit');
          });
        }
      });
    });
  });
});
