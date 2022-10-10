# cache-config

## Install

```bash
$ npm i cache-config --save
```

## Usage

```js
import CacheConfig from 'cache-config';

const cacheConfig = new CacheConfig({
    mongodb: {
        url: 'mongodb://localhost:27017/test',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    cacheType: "redis", // redis or memory
    redisConfig: {
        host: 'localhost',
        port: 6379,
        password: '',
        db: 0,
    },
    interval: 60 // seconds
});
cacheConfig.init();
let config = await cacheConfig.getConfig('test'); // undefined
await cacheConfig.setConfig('test', {a: 1});
config = await cacheConfig.getConfig('test'); // '{"a": 1}'
await cacheConfig.setConfig('test', {a: 2});
config = await cacheConfig.getConfigToJsonObject('test'); // {a: 2}
```

## Configuration

```ts
interface CacheConfigOptions {
  mongodb: {
    url: string;
    options: ConnectionOptions;
  };
  cacheType: "redis" | "memory";
  redisConfig?: RedisOptions;
  interval?: number;
}
```

## Methods

```ts
interface CacheConfig {
  init(): Promise<void>;

  getConfig(key: string): Promise<string>;

  getConfigToJsonObject(key: string): Promise<any>;

  getLastConfig(key: string): Promise<string>;

  getLastConfigToJsonObject(key: string): Promise<any>;

  setConfig(key: string, value: any): Promise<void>;

  refreshConfig(key: string): Promise<void>;

  removeConfig(key: string): Promise<void>;
}
```