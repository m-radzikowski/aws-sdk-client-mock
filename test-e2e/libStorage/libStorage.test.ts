import {mockClient} from 'aws-sdk-client-mock';
import {mockLibStorageUpload} from 'aws-sdk-client-mock/libStorage';
import {S3Client} from '@aws-sdk/client-s3';
import {Progress, Upload} from '@aws-sdk/lib-storage';

it('mocks SNS client', async () => {
    const s3Mock = mockClient(S3Client);
    mockLibStorageUpload(s3Mock);

    const s3Upload = new Upload({
        client: new S3Client({}),
        params: {
            Bucket: 'mock',
            Key: 'test',
            Body: 'qwe',
        },
    });

    const uploadProgress: Progress[] = [];
    s3Upload.on('httpUploadProgress', (progress) => {
        uploadProgress.push(progress);
    });

    await s3Upload.done();

    expect(uploadProgress).toHaveLength(1);
});
