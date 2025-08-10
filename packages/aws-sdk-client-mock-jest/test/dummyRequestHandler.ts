import { HttpHandlerOptions, RequestHandler } from '@smithy/types';

export const dummyRequestHandler: RequestHandler<any, any, HttpHandlerOptions> = {
    handle() {
        return Promise.resolve({
            response: {
                statusCode: 200,
                headers: new Headers({ 'content-type': 'text/xml'}),
                body: (Buffer.from(`<ListQueuesResponse><ListQueuesResult><NextToken></NextToken><QueueUrls></QueueUrls></ListQueuesResult></ListQueuesResponse>`)),
            }, 
        });
    },
};
