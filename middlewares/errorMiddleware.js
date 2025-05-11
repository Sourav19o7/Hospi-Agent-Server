/**
 * Middleware for handling 404 errors
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
  /**
   * Middleware for handling errors
   */
  const errorHandler = (err, req, res, next) => {
    // Set status code (use response status code or default to 500)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Set response status
    res.status(statusCode);
    
    // Send error response
    res.json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  };
  
  module.exports = { notFound, errorHandler };