import {mockClient} from '../src';
import {DynamoDBClient, paginateQuery, QueryCommand} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, QueryCommand as DocumentQueryCommand} from '@aws-sdk/lib-dynamodb';
import {marshall} from '@aws-sdk/util-dynamodb';

it('mocks classic DynamoDB client', async () => {
    const mock = mockClient(DynamoDBClient);
    mock.on(QueryCommand).resolves({
        Items: [marshall({pk: 'a', sk: 'b'})],
    });

    const dynamodb = new DynamoDBClient({});
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

    const dynamodb = new DynamoDBClient({});
    const ddb = DynamoDBDocumentClient.from(dynamodb);

    const query = await ddb.send(new DocumentQueryCommand({
        TableName: 'mock',
    }));

    expect(query.Items).toHaveLength(1);
    expect(query.Items?.[0]).toStrictEqual({pk: 'a', sk: 'b'});
});

it('mocks paginated operation', async () => {
    const mock = mockClient(DynamoDBClient);
    mock.on(QueryCommand, {TableName: 'mock', ExclusiveStartKey: undefined, Limit: 1}).resolves({
        Items: [
            marshall({pk: 'a', sk: 'b'}),
        ],
        LastEvaluatedKey: marshall({pk: 'a', sk: 'b'}),
    }).on(QueryCommand, {TableName: 'mock', ExclusiveStartKey: marshall({pk: 'a', sk: 'b'}), Limit: 1}).resolves({
        Items: [
            marshall({pk: 'c', sk: 'd'}),
        ],
    });

    const dynamodb = new DynamoDBClient({});
    const paginator = paginateQuery({client: dynamodb, pageSize: 1}, {TableName: 'mock'});

    const items = [];
    for await (const page of paginator) {
        items.push(...page.Items || []);
    }

    expect(items).toHaveLength(2);
    expect(items?.[1]).toStrictEqual({pk: {S: 'c'}, sk: {S: 'd'}});
});
