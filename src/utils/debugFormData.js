// utils/debugFormData.js
export const debugFormData = (req, title = 'FormData Debug Info') => {
  console.log(`=== ${title} ===`);
  console.log('Body fields:', req.body);
  console.log('Files:', req.files);
  
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      console.log(`File ${key}:`, req.files[key].map(f => ({
        originalname: f.originalname,
        size: f.size,
        mimetype: f.mimetype
      })));
    });
  }
};