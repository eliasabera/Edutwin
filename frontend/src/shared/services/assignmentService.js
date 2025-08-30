import { api } from "./api";

export const assignmentService = {
  async createAssignment(assignmentData) {
    try {
      const response = await api.post("/assignments", assignmentData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create assignment"
      );
    }
  },

  async getTeacherAssignments(params = {}) {
    try {
      const response = await api.get("/assignments/teacher/my-assignments", {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch assignments"
      );
    }
  },

  async getAssignmentById(assignmentId) {
    try {
      const response = await api.get(`/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch assignment"
      );
    }
  },

  async updateAssignment(assignmentId, updates) {
    try {
      const response = await api.put(`/assignments/${assignmentId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update assignment"
      );
    }
  },

  async deleteAssignment(assignmentId) {
    try {
      const response = await api.delete(`/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete assignment"
      );
    }
  },

  async publishAssignment(assignmentId) {
    try {
      const response = await api.patch(`/assignments/${assignmentId}/publish`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to publish assignment"
      );
    }
  },

  async getClassAssignments(classId, params = {}) {
    try {
      const response = await api.get(`/assignments/class/${classId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch class assignments"
      );
    }
  },

  async getStudentAssignments(params = {}) {
    try {
      const response = await api.get("/assignments/student/my-assignments", {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch student assignments"
      );
    }
  },

  async submitAssignment(assignmentId, submissionData) {
    try {
      const response = await api.post(
        `/assignments/${assignmentId}/submit`,
        submissionData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to submit assignment"
      );
    }
  },

  async getSubmissions(assignmentId, params = {}) {
    try {
      const response = await api.get(
        `/assignments/${assignmentId}/submissions`,
        {
          params,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch submissions"
      );
    }
  },

  async gradeSubmission(assignmentId, submissionId, gradeData) {
    try {
      const response = await api.patch(
        `/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        gradeData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to grade submission"
      );
    }
  },

  async getAssignmentAnalytics(assignmentId) {
    try {
      const response = await api.get(`/assignments/${assignmentId}/analytics`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch assignment analytics"
      );
    }
  },

  async duplicateAssignment(assignmentId) {
    try {
      const response = await api.post(`/assignments/${assignmentId}/duplicate`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to duplicate assignment"
      );
    }
  },

  async exportAssignmentGrades(assignmentId, format = "csv") {
    try {
      const response = await api.get(`/assignments/${assignmentId}/export`, {
        params: { format },
        responseType: "blob", // For file downloads
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to export grades"
      );
    }
  },

  async uploadAssignmentFile(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/assignments/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to upload assignment file"
      );
    }
  },

  async downloadAssignmentFile(assignmentId, fileId) {
    try {
      const response = await api.get(
        `/assignments/${assignmentId}/files/${fileId}`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to download file"
      );
    }
  },
};

export default assignmentService;
