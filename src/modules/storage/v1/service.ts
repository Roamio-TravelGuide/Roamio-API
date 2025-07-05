// // src/modules/storage/v1/service.ts
// import { Upload } from '@aws-sdk/lib-storage';
// import { s3Client, bucketName } from '../../../config/s3.config';
// import { v4 as uuidv4 } from 'uuid';
// import { MediaRepository } from './repository';
// import { IMediaUpload, IMediaResponse } from './interface';

// export class MediaService {
//   static async upload({ file, userId }: IMediaUpload): Promise<IMediaResponse> {
//     try {
//       // Generate unique S3 key
//       const extension = file.originalname.split('.').pop();
//       const key = `user_${userId}/${uuidv4()}.${extension}`;

//       // Upload to S3
//       await new Upload({
//         client: s3Client,
//         params: {
//           Bucket: bucketName,
//           Key: key,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//           Metadata: {
//             uploadedBy: userId.toString()
//           }
//         }
//       }).done();

//       // Save to database
//       const media = await MediaRepository.create({
//         url: `https://${bucketName}.s3.amazonaws.com/${key}`,
//         s3_key: key,
//         media_type: file.mimetype.startsWith('image/') ? 'image' : 'audio',
//         uploaded_by_id: userId,
//         file_size: BigInt(file.size),
//         format: extension
//       });

//       return { success: true, data: media };
//     } catch (error) {
//       console.error('Upload failed:', error);
//       return { success: false, error: 'Failed to upload media' };
//     }
//   }
// }