import { api } from "./api";

export const resourceService = {
  async createResource(resourceData) {
    try {
      const response = await api.post("/resources", resourceData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create resource"
      );
    }
  },

  async getTeacherResources(params = {}) {
    try {
      const response = await api.get("/resources/teacher/my-resources", {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch resources"
      );
    }
  },

  async getResourceById(resourceId) {
    try {
      const response = await api.get(`/resources/${resourceId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch resource"
      );
    }
  },

  async updateResource(resourceId, updates) {
    try {
      const response = await api.put(`/resources/${resourceId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update resource"
      );
    }
  },

  async deleteResource(resourceId) {
    try {
      const response = await api.delete(`/resources/${resourceId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete resource"
      );
    }
  },

  async publishResource(resourceId) {
    try {
      const response = await api.patch(`/resources/${resourceId}/publish`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to publish resource"
      );
    }
  },

  async getPublicResources(params = {}) {
    try {
      const response = await api.get("/resources/public", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch public resources"
      );
    }
  },

  async getResourcesBySubject(subject, params = {}) {
    try {
      const response = await api.get(`/resources/subject/${subject}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch resources by subject"
      );
    }
  },

  async incrementViews(resourceId) {
    try {
      const response = await api.get(`/resources/${resourceId}/view`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to increment views"
      );
    }
  },

  async incrementDownloads(resourceId) {
    try {
      const response = await api.patch(`/resources/${resourceId}/download`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to increment downloads"
      );
    }
  },

  async rateResource(resourceId, ratingData) {
    try {
      const response = await api.post(
        `/resources/${resourceId}/rate`,
        ratingData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to rate resource"
      );
    }
  },

  async uploadFile(file) {
    try {
      // This would be your actual file upload implementation
      // For now, we'll simulate it
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to upload file");
    }
  },
};
