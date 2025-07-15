import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user to request object
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ 
      error: 'Invalid token',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};

export default authenticate;