"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheConfig = void 0;
const mongoose = require("mongoose");
const typegoose_1 = require("@typegoose/typegoose");
const config_1 = require("./model/config");
const ioredis_1 = require("ioredis");
const NodeCache = require("node-cache");
class CacheConfig {
    constructor(params) {
        const { mongodb: { url, options }, cacheType, redisConfig, interval, } = params;
        this.interval = interval || 60;
        this.url = url;
        this.options = options;
        this.cacheType = cacheType;
        this.redisConfig = redisConfig;
        this.cacheTTL = 2 * this.interval;
    }
    async init() {
        await this.connectDB();
        if (this.cacheType === "redis") {
            this.connectRedis();
        }
        else {
            this.memoryCache = new NodeCache();
        }
        setInterval(async () => {
            const configs = await this.getConfigsForDb();
            for (const config of configs) {
                if (this.cacheType === "redis") {
                    await this.redisClient.set(config.key, config.value, "EX", this.cacheTTL);
                }
                else {
                    this.memoryCache.set(config.key, config.value, this.cacheTTL);
                }
            }
        }, this.interval * 1000);
    }
    async connectDB() {
        const { url, options } = this;
        if (!url) {
            throw new Error("url is required");
        }
        await mongoose.connect(url, options);
        this.configModel = (0, typegoose_1.getModelForClass)(config_1.default);
    }
    async connectRedis() {
        const { redisConfig } = this;
        if (!redisConfig) {
            throw new Error("redisConfig is required");
        }
        this.redisClient = new ioredis_1.default(redisConfig);
    }
    async getConfigsForDb() {
        return this.configModel.find();
    }
    async getConfig(key) {
        let result;
        if (this.cacheType === "redis") {
            result = await this.redisClient.get(key);
        }
        else {
            result = this.memoryCache.get(key);
        }
        if (!result) {
            const config = this.configModel.findOne({ key });
            result = config === null || config === void 0 ? void 0 : config.content;
        }
        return result;
    }
    async getConfigToJsonObject(key) {
        const result = await this.getConfig(key);
        return JSON.parse(result);
    }
    async getLastConfig(key) {
        const config = this.configModel.findOne({ key });
        return config === null || config === void 0 ? void 0 : config.content;
    }
    async getLastConfigToJsonObject(key) {
        const result = await this.getLastConfig(key);
        return JSON.parse(result);
    }
    async setConfig(key, value) {
        const config = await this.configModel.findOne({ key });
        if (config) {
            config.content = JSON.stringify(value);
            await config.save();
        }
        else {
            await this.configModel.create({ key, content: JSON.stringify(value) });
        }
        await this.refreshConfig(key);
    }
    async refreshConfig(key) {
        const config = await this.configModel.findOne({ key });
        if (config) {
            if (this.cacheType === "redis") {
                await this.redisClient.set(config.key, config.content, "EX", this.cacheTTL);
            }
            else {
                this.memoryCache.set(config.key, config.content, this.cacheTTL);
            }
        }
    }
    async removeConfig(key) {
        await this.configModel.deleteOne({ key });
        if (this.cacheType === "redis") {
            await this.redisClient.del(key);
        }
        else {
            this.memoryCache.del(key);
        }
    }
}
exports.CacheConfig = CacheConfig;
//# sourceMappingURL=index.js.map