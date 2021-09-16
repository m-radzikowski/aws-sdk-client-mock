import {AwsClientStub} from './awsClientStub';
import {CreateMultipartUploadCommand, S3Client, UploadPartCommand} from '@aws-sdk/client-s3';
import {mockClient} from './mockClient';

/**
 * Configures required command mocks of the S3Client mock to support Lib Storage Upload helper
 * for multipart file upload.
 *
 * If S3Client mocks is not provided, a new one is created.
 * @param s3Mock S3Client mock created with {@link mockClient} function
 */
export const mockLibStorageUpload = (s3Mock?: AwsClientStub<S3Client>): AwsClientStub<S3Client> => {
    if (!s3Mock) {
        s3Mock = mockClient(S3Client);
    }

    s3Mock.on(CreateMultipartUploadCommand).resolves({UploadId: '1'});
    s3Mock.on(UploadPartCommand).resolves({ETag: '1'});

    return s3Mock;
};
