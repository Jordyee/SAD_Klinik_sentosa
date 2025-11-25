// API Integration Helper for Frontend
// Base API configuration

const API_BASE_URL = 'http://localhost:3000/api';

// Get auth token from localStorage
function getAuthToken() {
    const session = localStorage.getItem('userSession');
    if (session) {
        const userData = JSON.parse(session);
        return userData.token || null;
    }
    return null;
}

// Save auth token to localStorage
function saveAuthToken(token, userData) {
    const session = {
        ...userData,
        token,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('userSession', JSON.stringify(session));
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
const authAPI = {
    async login(username, password) {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.success && response.token) {
            saveAuthToken(response.token, response.user);
        }
        
        return response;
    },
    
    async register(userData) {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.success && response.token) {
            saveAuthToken(response.token, response.user);
        }
        
        return response;
    },
    
    async getMe() {
        return await apiRequest('/auth/me');
    }
};

// Patient API
const patientAPI = {
    async getAll() {
        return await apiRequest('/patients');
    },
    
    async getById(id) {
        return await apiRequest(`/patients/${id}`);
    },
    
    async create(patientData) {
        return await apiRequest('/patients', {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
    },
    
    async update(id, patientData) {
        return await apiRequest(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(patientData)
        });
    },
    
    async delete(id) {
        return await apiRequest(`/patients/${id}`, {
            method: 'DELETE'
        });
    },
    
    async search(query) {
        return await apiRequest(`/patients/search?q=${encodeURIComponent(query)}`);
    }
};

// Medicine API
const medicineAPI = {
    async getAll() {
        return await apiRequest('/medicines');
    },
    
    async getById(id) {
        return await apiRequest(`/medicines/${id}`);
    },
    
    async create(medicineData) {
        return await apiRequest('/medicines', {
            method: 'POST',
            body: JSON.stringify(medicineData)
        });
    },
    
    async update(id, medicineData) {
        return await apiRequest(`/medicines/${id}`, {
            method: 'PUT',
            body: JSON.stringify(medicineData)
        });
    },
    
    async updateStock(id, quantity, operation = 'set') {
        return await apiRequest(`/medicines/${id}/stock`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity, operation })
        });
    }
};

// Appointment API
const appointmentAPI = {
    async getAll(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiRequest(`/appointments${queryParams ? '?' + queryParams : ''}`);
    },
    
    async getById(id) {
        return await apiRequest(`/appointments/${id}`);
    },
    
    async create(appointmentData) {
        return await apiRequest('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
    },
    
    async update(id, appointmentData) {
        return await apiRequest(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(appointmentData)
        });
    },
    
    async updateVitals(id, vitalsData) {
        return await apiRequest(`/appointments/${id}/vitals`, {
            method: 'PATCH',
            body: JSON.stringify(vitalsData)
        });
    },
    
    async updateConsultation(id, consultationData) {
        return await apiRequest(`/appointments/${id}/consultation`, {
            method: 'PATCH',
            body: JSON.stringify(consultationData)
        });
    }
};

// Prescription API
const prescriptionAPI = {
    async getAll(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiRequest(`/prescriptions${queryParams ? '?' + queryParams : ''}`);
    },
    
    async getById(id) {
        return await apiRequest(`/prescriptions/${id}`);
    },
    
    async create(prescriptionData) {
        return await apiRequest('/prescriptions', {
            method: 'POST',
            body: JSON.stringify(prescriptionData)
        });
    },
    
    async process(id) {
        return await apiRequest(`/prescriptions/${id}/process`, {
            method: 'PATCH'
        });
    }
};

// Doctor API
const doctorAPI = {
    async getAll() {
        return await apiRequest('/doctors');
    },
    
    async getById(id) {
        return await apiRequest(`/doctors/${id}`);
    }
};

// Export API modules
if (typeof window !== 'undefined') {
    window.api = {
        auth: authAPI,
        patients: patientAPI,
        medicines: medicineAPI,
        appointments: appointmentAPI,
        prescriptions: prescriptionAPI,
        doctors: doctorAPI
    };
}

// For Node.js environment (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        authAPI,
        patientAPI,
        medicineAPI,
        appointmentAPI,
        prescriptionAPI,
        doctorAPI,
        apiRequest,
        getAuthToken,
        saveAuthToken
    };
}

