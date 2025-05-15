import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || '',
  }
});

export const BUCKET_NAME= process.env.BUCKET_NAME;

export async function deleteImagesFromS3(keys: string[]) {
  const params = {
    Bucket: BUCKET_NAME,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
      Quiet: true,
    },
  };
  await s3Client.send(new DeleteObjectsCommand(params));
}
