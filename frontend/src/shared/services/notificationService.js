// Optional: Service for standardized notification messages
export const notificationMessages = {
  // Assignment related
  ASSIGNMENT_CREATED: "Assignment created successfully",
  ASSIGNMENT_UPDATED: "Assignment updated successfully",
  ASSIGNMENT_DELETED: "Assignment deleted successfully",
  ASSIGNMENT_PUBLISHED: "Assignment published successfully",
  ASSIGNMENT_UNPUBLISHED: "Assignment unpublished successfully",

  // Resource related
  RESOURCE_CREATED: "Resource created successfully",
  RESOURCE_UPDATED: "Resource updated successfully",

  // Error messages
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",

  // Auth messages
  LOGIN_SUCCESS: "Logged in successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  UNAUTHORIZED: "You are not authorized to perform this action",
};

export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return notificationMessages.SERVER_ERROR;
};
