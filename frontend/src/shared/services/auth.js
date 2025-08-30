import { api } from "./api";

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post("/auth/login", { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  },

  async register(userData) {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  },

  async verifyToken() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      throw new Error("Token verification failed");
    }
  },

  logout() {
    localStorage.removeItem("token");
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put("/auth/profile", profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Profile update failed");
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await api.put("/auth/password", passwordData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Password change failed"
      );
    }
  },
  async getProfile() {
    try {
      const response = await api.get("/profile");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put("/profile", profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Profile update failed");
    }
  },

  async updateEmail(emailData) {
    try {
      const response = await api.put("/profile/email", emailData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Email update failed");
    }
  },

  async uploadAvatar(avatarUrl) {
    try {
      const response = await api.post("/profile/avatar", { avatarUrl });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Avatar upload failed");
    }
  },

  async deleteAccount(password) {
    try {
      const response = await api.delete("/profile", { data: { password } });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Account deletion failed"
      );
    }
  },
};
