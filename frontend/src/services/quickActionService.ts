import api from './api';

export interface CallbackRequestData {
    name: string;
    phone: string;
    department?: string;
    preferredTime?: string;
    message?: string;
}

export interface EmergencyRequestData {
    name: string;
    phone: string;
    location?: string;
    message?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
}

const quickActionService = {
    // Create callback request
    requestCallback: async (data: CallbackRequestData) => {
        try {
            const response = await api.post('/callback', data);
            return response.data;
        } catch (error) {
            console.error('Error requesting callback:', error);
            throw error;
        }
    },

    // Create emergency request
    requestEmergency: async (data: EmergencyRequestData) => {
        try {
            const response = await api.post('/emergency', data);
            return response.data;
        } catch (error) {
            console.error('Error creating emergency request:', error);
            throw error;
        }
    }
};

export default quickActionService;
