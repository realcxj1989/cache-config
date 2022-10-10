import * as mongoose from "mongoose";
import { ConnectOptions } from "mongoose";
import { getModelForClass } from "@typegoose/typegoose";
import Config from "./model/config";
import { RedisOptions } from "ioredis";
import Redis from "ioredis";
import * as NodeCache from "node-cache";

export interface CacheConfigInitParams {
  mongodb: {
    url: string;
    options?: ConnectOptions;
  };
  cacheType: "memory" | "redis";
  redisConfig?: RedisOptions;
  interval?: number;
}

export class CacheConfig {
  private url: string;
  private options: ConnectOptions;
  private configModel: any;
  private cacheType: "memory" | "redis";
  private redisConfig: RedisOptions;
  private redisClient: Redis;
  private interval: number;
  private cacheTTL: number;
  private memoryCache: NodeCache;

  constructor(params: CacheConfigInitParams) {
    const {
      mongodb: { url, options },
      cacheType,
      redisConfig,
      interval,
    } = params;
    this.interval = interval || 60; // 默认60秒
    this.url = url;
    this.options = options;
    this.cacheType = cacheType;
    this.redisConfig = redisConfig;
    this.cacheTTL = 2 * this.interval; // 2倍的interval
  }

  public async init() {
    await this.connectDB();
    if (this.cacheType === "redis") {
      this.connectRedis();
    } else {
      this.memoryCache = new NodeCache();
    }
    setInterval(async () => {
      const configs = await this.getConfigsForDb();
      for (const config of configs) {
        if (this.cacheType === "redis") {
          await this.redisClient.set(
            config.key,
            config.value,
            "EX",
            this.cacheTTL
          );
        } else {
          this.memoryCache.set(config.key, config.value, this.cacheTTL);
        }
      }
    }, this.interval * 1000);
  }

  private async connectDB() {
    const { url, options } = this;
    if (!url) {
      throw new Error("url is required");
    }
    await mongoose.connect(url, options);
    this.configModel = getModelForClass(Config);
  }

  async connectRedis() {
    const { redisConfig } = this;
    if (!redisConfig) {
      throw new Error("redisConfig is required");
    }
    this.redisClient = new Redis(redisConfig);
  }

  public async getConfigsForDb() {
    return this.configModel.find();
  }

  public async getConfig(key: string) {
    let result;
    if (this.cacheType === "redis") {
      result = await this.redisClient.get(key);
    } else {
      result = this.memoryCache.get(key);
    }
    if (!result) {
      const config = this.configModel.findOne({ key });
      result = config?.content;
    }
    return result;
  }

  public async getConfigToJsonObject(key: string) {
    const result = await this.getConfig(key);
    return JSON.parse(result);
  }

  public async getLastConfig(key: string) {
    const config = this.configModel.findOne({ key });
    return config?.content;
  }

  public async getLastConfigToJsonObject(key: string) {
    const result = await this.getLastConfig(key);
    return JSON.parse(result);
  }

  public async setConfig(key: string, value: any) {
    const config = await this.configModel.findOne({ key });
    if (config) {
      config.content = JSON.stringify(value);
      await config.save();
    } else {
      await this.configModel.create({ key, content: JSON.stringify(value) });
    }
    await this.refreshConfig(key);
  }

  public async refreshConfig(key: string) {
    const config = await this.configModel.findOne({ key });
    if (config) {
      if (this.cacheType === "redis") {
        await this.redisClient.set(
          config.key,
          config.content,
          "EX",
          this.cacheTTL
        );
      } else {
        this.memoryCache.set(config.key, config.content, this.cacheTTL);
      }
    }
  }

  public async removeConfig(key: string) {
    await this.configModel.deleteOne({ key });
    if (this.cacheType === "redis") {
      await this.redisClient.del(key);
    } else {
      this.memoryCache.del(key);
    }
  }
}
