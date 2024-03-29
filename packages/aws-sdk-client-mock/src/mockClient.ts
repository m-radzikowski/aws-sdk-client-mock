import {Client, Command, MetadataBearer} from '@smithy/types';
import sinon, {SinonSandbox, SinonStub} from 'sinon';
import {isSinonStub} from './sinon';
import {AwsClientStub, AwsStub} from './awsClientStub';

/**
 * Creates and attaches a stub of the `Client#send()` method. Only this single method is mocked.
 * If method is already a stub, it's replaced.
 * @param client `Client` type or instance to replace the method
 * @param sandbox Optional sinon sandbox to use
 * @return Stub allowing to configure Client's behavior
 */
export const mockClient = <TInput extends object, TOutput extends MetadataBearer, TConfiguration>(
    client: InstanceOrClassType<Client<TInput, TOutput, TConfiguration>>,
    {sandbox}: { sandbox?: SinonSandbox } = {},
): AwsClientStub<Client<TInput, TOutput, TConfiguration>> => {
    const instance = isClientInstance(client) ? client : client.prototype;

    const send = instance.send;
    if (isSinonStub(send)) {
        send.restore();
    }

    const sinonSandbox = sandbox || sinon;
    const sendStub = sinonSandbox.stub(instance, 'send') as SinonStub<[Command<TInput, any, TOutput, any, any>], Promise<TOutput>>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new AwsStub<TInput, TOutput, TConfiguration>(instance, sendStub);
};

type ClassType<T> = {
    prototype: T;
};

type InstanceOrClassType<T> = T | ClassType<T>;

/**
 * Type guard to differentiate `Client` instance from a type.
 */
const isClientInstance = <TClient extends Client<any, any, any>>(obj: InstanceOrClassType<TClient>): obj is TClient =>
    (obj as TClient).send !== undefined;
