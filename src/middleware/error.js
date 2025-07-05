const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error('ERROR:', err.stack);

  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
    return;
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Something went wrong'
  });
};

export {errorHandler};