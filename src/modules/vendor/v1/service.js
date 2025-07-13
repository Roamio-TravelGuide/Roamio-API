import { VendorRepository } from './repository.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class VendorService {
    constructor() {
        this.vendorRepository = new VendorRepository();
        this.s3 = new S3Client({ region: process.env.AWS_REGION });
    }

    // ... (keep existing getVendorProfile and updateVendorProfile methods)

    async uploadLogo(userId, file) {
        const fileExt = file.originalname.split('.').pop();
        const key = `vendor-logos/${userId}/${uuidv4()}.${fileExt}`;
        
        await this.s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        }));

        const logoUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
        const media = await this.createMediaRecord(userId, logoUrl, key, file);
        
        await this.vendorRepository.updateVendorProfile(userId, {
            logo_id: media.id
        });

        return logoUrl;
    }

    async uploadCoverImage(userId, file) {
        const fileExt = file.originalname.split('.').pop();
        const key = `vendor-covers/${userId}/${uuidv4()}.${fileExt}`;
        
        await this.s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        }));

        const coverUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
        const media = await this.createMediaRecord(userId, coverUrl, key, file);
        
        await this.vendorRepository.updateVendorProfile(userId, {
            cover_image_id: media.id
        });

        return coverUrl;
    }

    async createMediaRecord(userId, url, s3Key, file) {
        return this.vendorRepository.createMedia({
            url,
            s3_key: s3Key,
            media_type: 'image',
            uploaded_by_id: userId,
            file_size: file.size,
            format: file.mimetype.split('/')[1],
            width: 0, // Can extract from image if needed
            height: 0
        });
    }
}