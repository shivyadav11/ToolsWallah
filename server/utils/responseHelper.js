// =========================================================
//  utils/responseHelper.js
//  Consistent API response format across all controllers
// =========================================================

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.SERVER_URL || ""
    : `http://localhost:${process.env.PORT || 5000}`;

// Send file download response
const fileResponse = (res, filename, message = "Done") => {
  res.json({
    success: true,
    message,
    filename,
    downloadUrl: `https://toolswallah-backend.onrender.com/uploads/temp/${filename}`,
  });
};

// Send generic success response
const successResponse = (res, data, message = "Success") => {
  res.json({ success: true, message, data });
};

// Create an API error (thrown in controllers, caught by errorHandler)
const apiError = (message, status = 400) => {
  const err  = new Error(message);
  err.status = status;
  return err;
};

module.exports = { fileResponse, successResponse, apiError };