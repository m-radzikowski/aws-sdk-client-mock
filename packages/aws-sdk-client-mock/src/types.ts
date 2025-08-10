import { Command, MetadataBearer} from '@smithy/types';

export type AwsCommand<Input extends ClientInput, Output extends ClientOutput, ClientInput extends object = any, ClientOutput extends MetadataBearer = any> = Command<ClientInput, Input, ClientOutput, Output, any>;
export type CommandResponse<TOutput> = Partial<TOutput> | PromiseLike<Partial<TOutput>>;

export interface AwsError extends Partial<Error>, Partial<MetadataBearer> {
    Type?: string;
    Code?: string;
    $fault?: 'client' | 'server';
    $service?: string;
}
