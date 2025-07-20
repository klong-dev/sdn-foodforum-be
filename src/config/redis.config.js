const Redis = require('ioredis');

// Create Redis client
const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
})

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis Cloud');
});



const getAsync = (key) => redisClient.get(key);
const setAsync = (key, value, expiry = null) => {
    if (expiry) {
        return redisClient.set(key, value, 'EX', expiry);
    }
    return redisClient.set(key, value);
};
const delAsync = (key) => redisClient.del(key);
const expireAsync = (key, seconds) => redisClient.expire(key, seconds);

module.exports = {
    redisClient,
    getAsync,
    setAsync,
    delAsync,
    expireAsync
};