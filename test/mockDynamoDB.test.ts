import {mockClient} from '../src';
import {DynamoDB, QueryCommand} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, QueryCommand as DocumentQueryCommand} from '@aws-sdk/lib-dynamodb';
import {marshall} from '@aws-sdk/util-dynamodb';

it('mocks classic DynamoDB client', async () => {
    const mock = mockClient(DynamoDB);
    mock.on(QueryCommand).resolves({
        Items: [marshall({pk: 'a', sk: 'b'})],
    });

    const dynamodb = new DynamoDB({});
    const query = await dynamodb.send(new QueryCommand({
        TableName: 'mock',
    }));

    expect(query.Items).toHaveLength(1);
    expect(query.Items?.[0]).toStrictEqual({pk: {S: 'a'}, sk: {S: 'b'}});
});

it('mocks DynamoDB DocumentClient', async () => {
    const mock = mockClient(DynamoDBDocumentClient);
    mock.on(DocumentQueryCommand).resolves({
        Items: [{pk: 'a', sk: 'b'}],
    });

    const dynamodb = new DynamoDB({});
    const ddb = DynamoDBDocumentClient.from(dynamodb);

    const query = await ddb.send(new DocumentQueryCommand({
        TableName: 'mock',
    }));

    expect(query.Items).toHaveLength(1);
    expect(query.Items?.[0]).toStrictEqual({pk: 'a', sk: 'b'});
});
