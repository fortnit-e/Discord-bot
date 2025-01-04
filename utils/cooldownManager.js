export class CooldownManager {
    constructor() {
        this.cooldowns = new Map();
    }

    setCooldown(userId, commandName, duration) {
        const key = `${userId}-${commandName}`;
        const expirationTime = Date.now() + duration;
        this.cooldowns.set(key, expirationTime);
    }

    checkCooldown(userId, commandName) {
        const key = `${userId}-${commandName}`;
        const expirationTime = this.cooldowns.get(key);
        if (!expirationTime) return 0;
        
        const timeLeft = expirationTime - Date.now();
        if (timeLeft <= 0) {
            this.cooldowns.delete(key);
            return 0;
        }
        return timeLeft;
    }
} 