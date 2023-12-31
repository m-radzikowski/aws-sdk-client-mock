import {Command, MetadataBearer} from '@smithy/types';

export type AwsCommand<Input extends ClientInput, Output extends ClientOutput, ClientInput extends object = any, ClientOutput extends MetadataBearer = any> = Command<ClientInput, Input, ClientOutput, Output, any>;
