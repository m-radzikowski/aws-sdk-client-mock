import {Progress, Upload} from '@aws-sdk/lib-storage';
import {S3Client} from '@aws-sdk/client-s3';
import {AwsClientStub, mockClient, mockLibStorageUpload} from '../src';

let s3Mock: AwsClientStub<S3Client>;

afterEach(() => {
    s3Mock.restore();
});

it('mocks small file upload to S3', async () => {
    s3Mock = mockClient(S3Client);
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
    expect(uploadProgress[0]).toStrictEqual({
        Bucket: 'mock',
        Key: 'test',
        loaded: 3,
        total: 3,
        part: 1,
    });
});

it('mocks multipart upload to S3', async () => {
    s3Mock = mockClient(S3Client);
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

it('mocks multipart upload to S3 without explicit client mock', async () => {
    const localS3Mock = mockLibStorageUpload();

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

    localS3Mock.restore();
});
