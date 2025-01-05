import fetch from 'node-fetch';
import { logError } from './errorLogger.js';

export class YuniteAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
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
      // Add context to the error
      error.apiEndpoint = endpoint;
      error.requestDetails = {
        url,
        method: options.method || 'GET',
        headers: { ...headers, Authorization: '[REDACTED]' }
      };
      throw error;
    }
  }

  async validateToken() {
    try {
      const response = await this.makeRequest('/guild/validate', {
        method: 'GET'
      });
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  }

  async getRegistrationLinks(guildId) {
    if (!guildId) throw new Error('Guild ID is required');
    return this.makeRequest(`/guild/${guildId}/registration/links`, { method: 'POST' });
  }

  async getEpicId(guildId, userId) {
    if (!guildId || !userId) throw new Error('Guild ID and User ID are required');
    try {
      const data = await this.getRegistrationLinks(guildId);
      const userLink = data.find(link => link.discordId === userId);
      return userLink ? userLink.epicId : null;
    } catch (error) {
      console.error('Error getting Epic ID:', {
        guildId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async getLinkedUsers(guildId, type = 'DISCORD') {
    if (!guildId) throw new Error('Guild ID is required');
    
    const data = {
      type: type.toUpperCase()
    };

    try {
      const response = await this.makeRequest(`/guild/${guildId}/registration/links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Error getting linked users:', error);
      throw error;
    }
  }

  async isUserLinked(guildId, userId) {
    try {
      const linkedUsers = await this.getLinkedUsers(guildId, 'DISCORD');
      return linkedUsers.userIds.includes(userId);
    } catch (error) {
      console.error('Error checking user link status:', error);
      throw error;
    }
  }

  async getEpicIdForUser(guildId, discordId) {
    try {
      // First get all Discord IDs
      const discordIds = await this.getLinkedUsers(guildId, 'DISCORD');
      
      // Debug logging
      console.log('Discord IDs response:', discordIds);
      
      if (!discordIds || !discordIds.userIds || !discordIds.userIds.includes(discordId)) {
        return null; // User not linked
      }

      // Then get all Epic IDs
      const epicIds = await this.getLinkedUsers(guildId, 'EPIC');
      
      // Debug logging
      console.log('Epic IDs response:', epicIds);
      
      if (!epicIds || !epicIds.userIds) {
        return null;
      }

      // The index should match between the two arrays
      const index = discordIds.userIds.indexOf(discordId);
      return index !== -1 ? epicIds.userIds[index] : null;
    } catch (error) {
      console.error('Error getting Epic ID:', error);
      throw error;
    }
  }
}