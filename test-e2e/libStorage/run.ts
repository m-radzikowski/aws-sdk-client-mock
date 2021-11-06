import {execSync} from 'child_process';
import * as packageJson from '../../package.json';

const libVersion = packageJson.version;

const exec = (cmd: string) => execSync(cmd, {
    cwd: __dirname,
    stdio: 'inherit',
});

// use npm because when running this script from yarn and using yarn
// it did not accept private registry parameter set in other way than in a project-level .yarnrc file
exec('npm init -y');
exec(`npm install --registry=http://localhost:4873 aws-sdk-client-mock@${libVersion} @aws-sdk/client-s3@latest @aws-sdk/lib-storage@latest jest typescript ts-jest`);
exec('npx jest');
