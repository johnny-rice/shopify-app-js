import * as child_process from 'child_process';
import {promisify} from 'util';

import {
  batteryOfTests,
  poll,
} from '@shopify/shopify-app-session-storage-test-utils';
import * as mongodb from 'mongodb';

import {MongoDBSessionStorage} from '../mongodb';

const exec = promisify(child_process.exec);

const dbURL = new URL(
  `mongodb://${encodeURIComponent('shop&fy')}:${encodeURIComponent(
    'passify$#',
  )}@localhost`,
);
const dbName = 'shopitest';

describe('MongoDBSessionStorage', () => {
  let storage: MongoDBSessionStorage;
  let containerId: string;
  beforeAll(async () => {
    const runCommand = await exec(
      "podman run -d -e MONGO_INITDB_DATABASE=shopitest -e MONGO_INITDB_ROOT_USERNAME='shop&fy' -e MONGO_INITDB_ROOT_PASSWORD='passify$#' -p 27017:27017 mongo:5",
      {encoding: 'utf8'},
    );
    containerId = runCommand.stdout.trim();

    await poll(
      async () => {
        try {
          const client = new (mongodb as any).MongoClient(dbURL.toString());
          await client.connect();
          await client.db().command({ping: 1});
          client.close();
        } catch {
          return false;
        }
        return true;
      },
      {interval: 500, timeout: 60000},
    );
    storage = new MongoDBSessionStorage(dbURL, dbName);
  });

  afterAll(async () => {
    await storage.disconnect();
    await exec(`podman rm -f ${containerId}`);
  });

  batteryOfTests(async () => storage);
});
