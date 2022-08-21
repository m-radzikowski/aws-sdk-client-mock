import {execSync} from 'child_process';
import {version as libVersion} from '../../packages/aws-sdk-client-mock/package.json';

const exec = (cmd: string) => execSync(cmd, {
    cwd: __dirname,
    stdio: 'inherit',
});

// use npm because when running this script from yarn and using yarn
// it did not accept private registry parameter set in other way than in a project-level .yarnrc file
exec('npm init -y');
exec('npm install --registry=http://localhost:4873' +
    ` aws-sdk-client-mock@${libVersion}` +
    ` aws-sdk-client-mock-jest@${libVersion}` +
    ' @aws-sdk/client-sns@latest' +
    ' jest' +
    ' typescript' +
    ' ts-jest');
exec('npx jest');
