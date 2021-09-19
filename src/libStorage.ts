import {AwsClientStub} from './awsClientStub';
import type {S3Client as S3ClientType} from '@aws-sdk/client-s3';
import {mockClient} from './mockClient';

/**
 * Configures required command mocks of the S3Client mock to support Lib Storage Upload helper
 * for multipart file upload.
 *
 * If S3Client mocks is not provided, a new one is created.
 * @param s3Mock S3Client mock created with {@link mockClient} function
 */
export const mockLibStorageUpload = (s3Mock?: AwsClientStub<S3ClientType>): AwsClientStub<S3ClientType> => {
    /*
     * Not all library consumers also use @aws-sdk/client-s3. Importing it in a standard TS way
     * would cause errors for them, as the module would be tried to found and import.
     * Instead, we require classes from it dynamically in the scope of the function.
     *
     * Another solution would be to not export this function in the index.ts
     * and instead have consumers to import it from 'aws-sdk-client-mock/libStorage'.
     * This however turned out to be complicated to achieve in terms of exposing modules properly
     * for CommonJS and ES modules.
     */
    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
    const {CreateMultipartUploadCommand, S3Client, UploadPartCommand} = require('@aws-sdk/client-s3');

    if (!s3Mock) {
        s3Mock = mockClient(S3Client);
    }

    s3Mock.on(CreateMultipartUploadCommand).resolves({UploadId: '1'});
    s3Mock.on(UploadPartCommand).resolves({ETag: '1'});

    return s3Mock;
};
