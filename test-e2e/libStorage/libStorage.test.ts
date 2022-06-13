import {mockClient} from 'aws-sdk-client-mock';
import {mockLibStorageUpload} from 'aws-sdk-client-mock/libStorage';
import {S3Client} from '@aws-sdk/client-s3';
import {Progress, Upload} from '@aws-sdk/lib-storage';

it('mocks S3 Client Upload', async () => {
    const s3Mock = mockClient(S3Client);
    mockLibStorageUpload(s3Mock);

    const s3Upload = new Upload({
        client: new S3Client({}),
        partSize: 5 * 1024 * 1024, // 5 MB
        params: {
            Bucket: 'mock',
            Key: 'test',
            Body: 'x'.repeat(6 * 1024 * 1024), // 6 MB
        },
    });

    const uploadProgress: Progress[] = [];
    s3Upload.on('httpUploadProgress', (progress) => {
        uploadProgress.push(progress);
    });

    await s3Upload.done();

    expect(uploadProgress).toHaveLength(2);
});
