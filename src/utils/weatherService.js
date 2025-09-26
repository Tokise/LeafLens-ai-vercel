import { notificationService } from './notificationService';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

// OpenWeatherMap API configuration
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

if (!WEATHER_API_KEY) {
    console.error('Weather API key is not configured. Please set VITE_WEATHER_API_KEY in your .env');
}

class WeatherService {
    constructor() {
        this.currentLocation = null;
        this.weatherUpdateInterval = null;
        this.remoteUnsubscribe = null;
    }

    async init() {
        try {
            await this.updateLocation();
            this.startWeatherUpdates();
        } catch (error) {
            console.error('Failed to initialize weather service:', error);
        }
    }

    async updateLocation() {
        return new Promise((resolve, reject) => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        this.currentLocation = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        resolve(this.currentLocation);
                    },
                    error => {
                        console.error('Error getting location:', error);
                        reject(error);
                    }
                );
            } else {
                reject(new Error('Geolocation is not supported by this browser.'));
            }
        });
    }

    async getWeather() {
        if (!this.currentLocation) {
            await this.updateLocation();
        }

        try {
            const response = await fetch(
                `${WEATHER_API_BASE_URL}/weather?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}&units=metric&appid=${WEATHER_API_KEY}`
            );

            if (!response.ok) {
                throw new Error('Weather API request failed');
            }

            const data = await response.json();

            // Use a stable dedupe key combining date hour and coordinates
            const hourKey = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
            const dedupeKey = `weather-${hourKey}-${this.currentLocation.lat.toFixed(2)}-${this.currentLocation.lon.toFixed(2)}`;
            this.lastWeatherKey = dedupeKey;

            return {
                condition: data.weather[0].main,
                description: data.weather[0].description,
                temperature: Math.round(data.main.temp),
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                icon: this.getWeatherIcon(data.weather[0].icon),
                dedupeKey
            };
        } catch (error) {
            console.error('Error fetching weather data:', error);
            throw error;
        }
    }

    getWeatherIcon(iconCode) {
        const iconMap = {
            '01d': '☀️', // clear sky day
            '01n': '🌙', // clear sky night
            '02d': '⛅', // few clouds day
            '02n': '☁️', // few clouds night
            '03d': '☁️', // scattered clouds
            '03n': '☁️',
            '04d': '☁️', // broken clouds
            '04n': '☁️',
            '09d': '🌧️', // shower rain
            '09n': '🌧️',
            '10d': '🌦️', // rain
            '10n': '🌧️',
            '11d': '⛈️', // thunderstorm
            '11n': '⛈️',
            '13d': '🌨️', // snow
            '13n': '🌨️',
            '50d': '🌫️', // mist
            '50n': '🌫️'
        };
        return iconMap[iconCode] || '🌡️';
    }

    startWeatherUpdates() {
        // Clear any existing interval
        if (this.weatherUpdateInterval) {
            clearInterval(this.weatherUpdateInterval);
        }

        // Set up periodic weather updates (every 30 minutes)
        this.weatherUpdateInterval = setInterval(async () => {
            try {
                const weatherData = await this.getWeather();
                this.notifyWeatherUpdate(weatherData);
            } catch (error) {
                console.error('Failed to update weather:', error);
            }
        }, 30 * 60 * 1000); // 30 minutes

        // Trigger initial update
        this.getWeather().then(weatherData => this.notifyWeatherUpdate(weatherData));
    }

    stopWeatherUpdates() {
        if (this.weatherUpdateInterval) {
            clearInterval(this.weatherUpdateInterval);
            this.weatherUpdateInterval = null;
        }
        if (this.remoteUnsubscribe) {
            this.remoteUnsubscribe();
            this.remoteUnsubscribe = null;
        }
    }

    notifyWeatherUpdate(weatherData) {
        // Pass dedupe key into notification to avoid duplicates across reloads within the same hour
        notificationService.addNotification({
            type: 'in-app',
            category: 'weather',
            title: 'Weather Update',
            message: `Current weather: ${weatherData.condition}, ${weatherData.temperature}°C`,
            icon: '🌤️',
            data: weatherData,
            key: weatherData.dedupeKey
        });

        // Persist to Firestore per user for history
        try {
            const user = auth.currentUser;
            if (user) {
                addDoc(collection(db, 'users', user.uid, 'weather_notifications'), {
                    createdAt: serverTimestamp(),
                    dedupeKey: weatherData.dedupeKey,
                    condition: weatherData.condition,
                    temperature: weatherData.temperature,
                    humidity: weatherData.humidity,
                    windSpeed: weatherData.windSpeed
                });
            }
        } catch (e) {
            console.warn('Failed to persist weather notification:', e);
        }
    }

    subscribeToRemoteWeather(userId) {
        if (this.remoteUnsubscribe) {
            this.remoteUnsubscribe();
            this.remoteUnsubscribe = null;
        }
        if (!userId) {
            return;
        }
        const q = query(
            collection(db, 'users', userId, 'weather_notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
        this.remoteUnsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const d = change.doc.data();
                    const n = {
                        condition: d.condition,
                        temperature: d.temperature,
                        humidity: d.humidity,
                        windSpeed: d.windSpeed,
                        dedupeKey: d.dedupeKey
                    };
                    // Will dedupe if already present
                    notificationService.addNotification({
                        type: 'in-app',
                        category: 'weather',
                        title: 'Weather Update',
                        message: `Current weather: ${n.condition}, ${n.temperature}°C`,
                        icon: '🌤️',
                        data: n,
                        key: n.dedupeKey
                    });
                }
            });
        });
    }
}

// Export a singleton instance
export const weatherService = new WeatherService();