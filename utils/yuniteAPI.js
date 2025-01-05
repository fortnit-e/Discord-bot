import fetch from 'node-fetch';
import { logError } from './errorLogger.js';

export class YuniteAPI {
  constructor(apiKey, client) {
    if (!apiKey) {
      throw new Error('Yunite API key is required');
    }
    this.apiKey = apiKey;
    this.client = client;
    this.baseURL = 'https://yunite.xyz/api/v3';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        method: options.method || 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.endpoint = endpoint;
        throw error;
      }

      return data;
    } catch (error) {
      await logError(this.client, error, {
        command: 'Yunite API',
        endpoint: endpoint,
        method: options.method || 'GET',
        error: error.message
      });
      throw error;
    }
  }

  async getEpicId(guildId, discordId) {
    if (!guildId || !discordId) {
      throw new Error('Guild ID and Discord ID are required');
    }

    try {
      const response = await this.makeRequest(`/guild/${guildId}/registration/links`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'DISCORD'
        })
      });

      const userLink = response.find(link => link.discordId === discordId);
      return userLink ? userLink.epicId : null;
    } catch (error) {
      console.error('Error getting Epic ID:', error);
      throw error;
    }
  }
}