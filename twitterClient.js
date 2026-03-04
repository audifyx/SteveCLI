const { TwitterApi } = require('twitter-api-v2');

class TwitterClient {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return this.client;

    const appKey = process.env.TWITTER_APP_KEY || process.env.CONSUMER_KEY;
    const appSecret = process.env.TWITTER_APP_SECRET || process.env.CONSUMER_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
      return null;
    }

    try {
      this.client = new TwitterApi({
        appKey: appKey,
        appSecret: appSecret,
        accessToken: accessToken,
        accessSecret: accessSecret
      });
      this.initialized = true;
      return this.client;
    } catch (err) {
      return null;
    }
  }

  async tweet(text) {
    const client = await this.init();
    if (!client) return { success: false, error: 'Twitter not configured. Set environment variables.' };

    try {
      const tweet = await client.v2.tweet(text);
      return { success: true, tweet };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async timeline(count = 10) {
    const client = await this.init();
    if (!client) return { success: false, error: 'Twitter not configured.' };

    try {
      const tweets = await client.v2.homeTimeline({ max_results: count });
      return { success: true, tweets: tweets.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async userTimeline(username, count = 10) {
    const client = await this.init();
    if (!client) return { success: false, error: 'Twitter not configured.' };

    try {
      const user = await client.v2.userByUsername(username);
      const tweets = await client.v2.userTimeline(user.data.id, { max_results: count });
      return { success: true, tweets: tweets.data, user: user.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async search(query, count = 10) {
    const client = await this.init();
    if (!client) return { success: false, error: 'Twitter not configured.' };

    try {
      const results = await client.v2.search(query, { max_results: count });
      return { success: true, tweets: results.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getUser(username) {
    const client = await this.init();
    if (!client) return { success: false, error: 'Twitter not configured.' };

    try {
      const user = await client.v2.userByUsername(username);
      return { success: true, user: user.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async checkConfig() {
    const appKey = process.env.TWITTER_APP_KEY || process.env.CONSUMER_KEY;
    const appSecret = process.env.TWITTER_APP_SECRET || process.env.CONSUMER_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    const configured = !!(appKey && appSecret && accessToken && accessSecret);
    
    if (configured) {
      try {
        const client = await this.init();
        if (client) {
          return { success: true, configured: true, message: 'Twitter API configured and connected' };
        }
      } catch (e) {
        return { success: false, configured: true, message: 'Credentials set but connection failed' };
      }
    }
    
    return { 
      success: false, 
      configured: false, 
      message: 'Twitter not configured. Set env vars: TWITTER_APP_KEY, TWITTER_APP_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET' 
    };
  }
}

module.exports = new TwitterClient();
