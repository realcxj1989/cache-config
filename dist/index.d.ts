import { ConnectOptions } from "mongoose";
import { RedisOptions } from "ioredis";
export interface CacheConfigInitParams {
    mongodb: {
        url: string;
        options?: ConnectOptions;
    };
    cacheType: "memory" | "redis";
    redisConfig?: RedisOptions;
    interval?: number;
}
export declare class CacheConfig {
    private url;
    private options;
    private configModel;
    private cacheType;
    private redisConfig;
    private redisClient;
    private interval;
    private cacheTTL;
    private memoryCache;
    constructor(params: CacheConfigInitParams);
    init(): Promise<void>;
    private connectDB;
    connectRedis(): Promise<void>;
    getConfigsForDb(): Promise<any>;
    getConfig(key: string): Promise<any>;
    getConfigToJsonObject(key: string): Promise<any>;
    getLastConfig(key: string): Promise<any>;
    getLastConfigToJsonObject(key: string): Promise<any>;
    setConfig(key: string, value: any): Promise<void>;
    refreshConfig(key: string): Promise<void>;
    removeConfig(key: string): Promise<void>;
}
