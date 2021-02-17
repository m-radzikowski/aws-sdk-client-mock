import {Client, Command} from '@aws-sdk/types';
import {SinonStub, stub} from 'sinon';
import {isSinonStub} from './sinon';
import {AwsClientStub} from './awsClientStub';

/**
 * Creates and attaches a stub of the `Client#send()` method. Only this single method is mocked.
 * If method is already a stub, it's replaced.
 * @param client `Client` type or instance to replace the method
 * @return Stub allowing to configure Client's behavior
 */
export const mockClient = <TClient extends AwsClient>(
    client: TClient | Constructor<TClient>,
): AwsClientStub<TClient> => {
    const instance = isClientInstance(client) ? client : client.prototype;

    const send = instance.send;
    if (isSinonStub(send)) {
        send.restore();
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore // TODO Resolve - see: https://stackoverflow.com/questions/56505560/could-be-instantiated-with-a-different-subtype-of-constraint-object-ts2322
    const sendStub: SinonStub<[Command<any, any, any, any, any>], unknown> = stub(instance, 'send');

    return new AwsClientStub<TClient>(sendStub);
};

type Constructor<T> = {
    new(...args: never[]): T;
    prototype: T;
};

type AwsClient = Client<any, any, any>;

/**
 * Type guard to differentiate `Client` instance from a type.
 */
const isClientInstance = <TClient extends AwsClient>(obj: TClient | Constructor<TClient>): obj is TClient =>
    (obj as TClient).send !== undefined;
