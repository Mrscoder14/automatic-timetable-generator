const API_BASE_URL = 'http://localhost:5001/api';

export const api = {
    // Auth
    signup: async (user: any) => {
        const res = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Signup failed');
        return data;
    },
    login: async (credentials: any) => {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        return data;
    },

    // Teachers
    getTeachers: async () => {
        const res = await fetch(`${API_BASE_URL}/teachers`);
        return res.json();
    },
    saveTeacher: async (teacher: any) => {
        const res = await fetch(`${API_BASE_URL}/teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teacher)
        });
        return res.json();
    },

    // Subjects
    getSubjects: async () => {
        const res = await fetch(`${API_BASE_URL}/subjects`);
        return res.json();
    },
    saveSubject: async (subject: any) => {
        const res = await fetch(`${API_BASE_URL}/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subject)
        });
        return res.json();
    },

    // Rooms
    getRooms: async () => {
        const res = await fetch(`${API_BASE_URL}/rooms`);
        return res.json();
    },
    saveRoom: async (room: any) => {
        const res = await fetch(`${API_BASE_URL}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(room)
        });
        return res.json();
    },

    // Allocations
    getAllocations: async () => {
        const res = await fetch(`${API_BASE_URL}/allocations`);
        return res.json();
    },
    saveAllocation: async (allocation: any) => {
        const res = await fetch(`${API_BASE_URL}/allocations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allocation)
        });
        return res.json();
    },
    saveAllocationsForYear: async (year: string, allocations: any[]) => {
        const res = await fetch(`${API_BASE_URL}/allocations/save-year`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year, allocations })
        });
        return res.json();
    },

    // Bulk Sync
    syncAll: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/sync-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    }
};
