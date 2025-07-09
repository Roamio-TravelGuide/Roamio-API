import 'dotenv/config';
import { s3Client, bucketName } from '../config/s3.config.js';
import { ListBucketsCommand } from '@aws-sdk/client-s3';

async function testS3Connection() {
  try {
    console.log('Testing with credentials:', {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      region: process.env.AWS_REGION
    });
    
    const data = await s3Client.send(new ListBucketsCommand({}));
    console.log('✅ S3 Connection Successful');
    console.log('📦 Available buckets:', data.Buckets);
    console.log(`🔗 Your configured bucket: ${bucketName}`);
  } catch (err) {
    // Proper error type checking
    if (err instanceof Error) {
      console.error('❌ S3 Connection Failed:', err.message);
    } else {
      console.error('❌ Unknown error occurred:', err);
    }
    
    console.log('ℹ️ Current environment:', {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'exists' : 'missing',
      AWS_REGION: process.env.AWS_REGION
    });
  }
}

testS3Connection();