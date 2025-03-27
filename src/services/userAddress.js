import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'http://localhost:8080/api/v1';
const API_BASE_ADDRESS_URL = 'https://vn-public-apis.fpo.vn';
const GET_PROVINCES = `${API_BASE_ADDRESS_URL}/provinces/getAll?limit=-1`;
const GET_DISTRICTS = `${API_BASE_ADDRESS_URL}/districts/getAll?limit=-1`;
const GET_WARDS = `${API_BASE_ADDRESS_URL}/wards/getAll?limit=-1`;
const GET_DISTRICTS_BY_PROVINCE = (provinceCode) => `${API_BASE_ADDRESS_URL}/districts/getByProvince?provinceCode=${provinceCode}&limit=-1`;
const GET_WARDS_BY_DISTRICT = (districtCode) => `${API_BASE_ADDRESS_URL}/wards/getByDistrict?districtCode=${districtCode}&limit=-1`;
const CREATE_USER_ADDRESS = `${API_BASE_URL}/user-address`;
const GET_USER_ADDRESS = `${API_BASE_URL}/user-address`;
const GET_USER_ADDRESS_BY_ID = (addressId) => `${API_BASE_URL}/user-address/${addressId}`;
const UPDATE_USER_ADDRESS = (addressId) => `${API_BASE_URL}/user-address/${addressId}`;
const DELETE_USER_ADDRESS = (addressId) => `${API_BASE_URL}/user-address/${addressId}`;

// Fetch provinces
export const fetchProvinces = async () => {
    try {
        const response = await fetch(GET_PROVINCES);
        if (!response.ok) {
            throw new Error(`Failed to fetch provinces: ${response.statusText}`);
        }
        const data = await response.json();
        // Lọc chỉ lấy name và code
        return data.data.data.map((province) => ({
            name: province.name,
            code: province.code
        }));
    } catch (error) {
        console.error('Error fetching provinces:', error);
        throw error;
    }
};

// Fetch districts
export const fetchDistricts = async () => {
    try {
        const response = await fetch(GET_DISTRICTS);
        if (!response.ok) {
            throw new Error(`Failed to fetch districts: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching districts:', error);
        throw error;
    }
};

// Fetch wards
export const fetchWards = async () => {
    try {
        const response = await fetch(GET_WARDS);
        if (!response.ok) {
            throw new Error(`Failed to fetch wards: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching wards:', error);
        throw error;
    }
};

// Fetch districts by province code
export const fetchDistrictsByProvince = async (provinceCode) => {
    try {
        const response = await fetch(GET_DISTRICTS_BY_PROVINCE(provinceCode));
        if (!response.ok) {
            throw new Error(`Failed to fetch districts by province: ${response.statusText}`);
        }
        const data = await response.json();
        // Lọc chỉ lấy name và code
        return data.data.data.map((district) => ({
            name: district.name,
            code: district.code
        }));
    } catch (error) {
        console.error('Error fetching districts by province:', error);
        throw error;
    }
};

// Fetch wards by district code
export const fetchWardsByDistrict = async (districtCode) => {
    try {
        const response = await fetch(GET_WARDS_BY_DISTRICT(districtCode));
        if (!response.ok) {
            throw new Error(`Failed to fetch wards by district: ${response.statusText}`);
        }
        const data = await response.json();
        // Lọc chỉ lấy name và code
        return data.data.data.map((ward) => ({
            name: ward.name,
            code: ward.code
        }));
    } catch (error) {
        console.error('Error fetching wards by district:', error);
        throw error;
    }
};

// Create user address
export const createUserAddress = async (addressData) => {
    try {
        const token = await tokenManager.getValidToken();
        const response = await fetch(CREATE_USER_ADDRESS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(addressData)
        });
        if (!response.ok) {
            throw new Error(`Failed to create user address: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating user address:', error);
        throw error;
    }
};

// Get user address
export const getUserAddress = async () => {
    try {
        const token = await tokenManager.getValidToken();
        const response = await fetch(GET_USER_ADDRESS, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get user address: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('API response:', data); // Debug API response
        return data.data; // Chỉ trả về danh sách địa chỉ
    } catch (error) {
        console.error('Error getting user address:', error);
        throw error;
    }
};

// Get user address by ID
export const getUserAddressById = async (addressId) => {
    try {
        const token = await tokenManager.getValidToken();
        const response = await fetch(GET_USER_ADDRESS_BY_ID(addressId), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get user address by ID: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error getting user address by ID:', error);
        throw error;
    }
};

// Update user address
export const updateUserAddress = async (addressId, addressData) => {
    try {
        const token = await tokenManager.getValidToken();
        const response = await fetch(UPDATE_USER_ADDRESS(addressId), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(addressData)
        });
        if (!response.ok) {
            throw new Error(`Failed to update user address: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating user address:', error);
        throw error;
    }
};

// Delete user address
export const deleteUserAddress = async (addressId) => {
    try {
        const token = await tokenManager.getValidToken();
        const response = await fetch(DELETE_USER_ADDRESS(addressId), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to delete user address: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting user address:', error);
        throw error;
    }
};