/* eslint-disable no-console */

/*
 * Checks if all AWS SDK v3 clients can be mocked properly based on their types.
 */

import child_process from 'child_process';
import * as fs from 'fs';
import tsd from 'tsd';
import packageJson from '../package.json';

const dir = './compatibility/';
const packagePrefix = '@aws-sdk/client-';

const main = async () => {
    const clients = listClients();

    console.log(`Found ${clients.length} clients:`);
    console.log(clients.map(c => `${c.packageName}@${c.packageVersion}`).join('\n'));
    console.log();

    setupProject();
    installClients(clients);
    console.log();

    createTests(clients);

    const results = await runTests();
    console.log(`Found ${results.length} type errors`);

    writeResults(clients, results);
};

const listClients = (): Client[] => {
    const packages: NpmPackage[] = [];

    const size = 250;
    let from = 0;
    let lastCount = 0;
    do {
        const found = JSON.parse(child_process.execSync(
            `npms search -o json -s ${size} -f ${from} ${packagePrefix}`,
        ).toString()) as [];
        packages.push(...found);

        lastCount = found.length;
        from += size;
    } while (lastCount === size);

    const filteredPackages = packages
        .map(client => `${client.package.name}@${client.package.version}`)
        .filter(client =>
            client.startsWith(packagePrefix)
            && !client.includes('browser')
            && !client.includes('node')
            && !client.includes('documentation-generator')
            && !client.includes('client-commander'),
        )
        .sort();

    return filteredPackages.map(p => ({
        packageName: p.split('@3')[0],
        packageVersion: '3' + p.split('@3')[1],
        clientName: toClientName(p),
    }));
};

const toClientName = (packageName: string): string => {
    let client = packageName.substr(packagePrefix.length).split('@3')[0];

    client = client.charAt(0).toUpperCase() + client.slice(1);
    client = client.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());

    if (client.length <= 3) {
        client = client.toUpperCase();
    }

    const correctCase = [
        'AccessAnalyzer', 'ACMPCA', 'Amp', 'AmplifyBackend',
        'AppConfig', 'AppIntegrations', 'AppStream', 'AppSync',
        'CloudDirectory', 'CloudHSM', 'CloudSearch', 'CloudTrail',
        'CodeCommit', 'CodeBuild', 'CodePipeline', 'CodeDeploy', 'CodeGuru', 'CodeGuruProfiler', 'CodeStar',
        'CodestarNotifications',
        'ComprehendMedical', 'ConnectParticipant',
        'DataBrew', 'DataExchange', 'DataSync', 'DevOps',
        'DocDB', 'EC2', 'ECR', 'EMR', 'Fis', 'FraudDetector', 'FSx', 'GameLift',
        'ECRPUBLIC', 'Secrets',
        'GroundStation', 'GuardDuty', 'HealthLake',
        'IoT', '1Click', 'Analytics', 'IotDeviceAdvisor', 'FleetHub', 'SecureTunneling', 'SiteWise', 'ThingsGraph',
        'Ivs', 'LakeFormation', 'Equipment', 'Metrics', 'Vision', 'Blockchain',
        'Connect', 'Convert', 'Live', 'Package', 'Store', 'Tailor', 'Hub', 'Mgn',
        'Mq', 'MTurk', 'MWAA', 'Manager', 'OpsWorks', 'OpsWorksCM',
        'SMS', 'DynamoDB', 'CloudFormation', 'CloudFront', 'CloudWatch',
        'APIGateway', 'V2', 'ApiGatewayV2', 'ApiGatewayManagementApi',
        'ElastiCache', 'EventBridge', 'XRay',
        'QLDB', 'QuickSight', 'RDS', 'ResourceGroupsTaggingAPI',
        'RoboMaker', 'Resolver', 'Outposts', 'SageMaker', 'SagemakerEdge', 'A2I',
        'ServerlessApplicationRepository', 'AppRegistry', 'Discovery', 'SES', 'SSM', 'SSO', 'OIDC',
        'Identitystore', 'SESv2', 'TimestreamQuery', 'WAF', 'Session',
        'Architected', 'Docs', 'Link', 'WorkMail', 'MessageFlow', 'Spaces',
    ];
    correctCase.forEach(correct => {
        const re = new RegExp(correct, 'gi');
        client = client.replace(re, correct);
    });

    return client + 'Client';
};

const setupProject = () => {
    fs.mkdirSync(dir, {recursive: true});

    const tsconfig = JSON.stringify({
        'compilerOptions': {
            'module': 'CommonJS',
            'target': 'ES2018',
            'lib': [
                'ESNext',
                'DOM',
            ],
            'moduleResolution': 'node',
            'strict': true,
            'skipLibCheck': true,
        },
    });
    fs.writeFileSync(`${dir}tsconfig.json`, tsconfig);
};

const installClients = (clients: Client[]): void => {
    child_process.execSync('yarn init -y', {cwd: dir, stdio: 'inherit'});

    const packages = clients.map(c => `${c.packageName}@${c.packageVersion}`);
    child_process.execSync(`yarn add ${packages.join(' ')}`, {cwd: dir, stdio: 'inherit'});
};

const createTests = (clients: Client[]): void => {
    let data =
        'import {AwsClientStub, mockClient} from \'../src\';\n' +
        'import {expectType} from \'tsd\';\n\n';

    data += clients
        .map(client => `import {${client.clientName}} from '${client.packageName}';`)
        .join('\n') + '\n\n';

    data += clients
        .map(client => `expectType<AwsClientStub<${client.clientName}>>(mockClient(${client.clientName}));`)
        .join('\n');

    fs.writeFileSync(`${dir}types.ts`, data);
};

const runTests = async (): Promise<string[]> => {
    const diagnostics = await tsd({
        cwd: dir,
        typingsFile: '../dist/types/index.d.ts',
        testFiles: ['types.ts'],
    });

    return diagnostics
        .filter(d => d.severity === 'error')
        .map(d => d.message);
};

const writeResults = (clients: Client[], results: string[]): void => {
    const clientsResults = clients.map(client => {
        const errorFound = results.some(result => result.includes(`Type '${client.clientName}'`));
        return {
            ...client,
            compatible: !errorFound,
        };
    });

    const compatibleCount = clientsResults.filter(r => r.compatible).length;

    const data = '# Compatibility table\n\n' +
        `Generated automatically for **AWS SDK v3 Client mock v${packageJson.version}**\n\n` +
        `Compatible clients: ${compatibleCount} of ${clients.length}\n\n` +
        '| Client | Package | Version | Compatible |\n' +
        '|---|---|---|---|\n' +
        clientsResults.map(res =>
            `| ${res.clientName.substring(0, res.clientName.length - 'Client'.length)} ` +
            `| [${res.packageName}](https://www.npmjs.com/package/${res.packageName}) ` +
            `| ${res.packageVersion} ` +
            `| ${res.compatible ? 'Yes ✅' : 'No ❌'} |`,
        ).join('\n');
    fs.writeFileSync('compatibility.md', data);
};

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });

interface NpmPackage {
    package: {
        name: string;
        version: string;
    };
}

interface Client {
    packageName: string;
    packageVersion: string;
    clientName: string;
}
