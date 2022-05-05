import * as fs from 'fs';
import * as path from 'path';
import * as io from '@actions/io';
import * as exec from '@actions/exec';
import * as core from '@actions/core';
import * as util from './util';
import { ExecOptions } from '@actions/exec/lib/interfaces';

export const PRIVATE_KEY_FILE = path.join(util.getTempDir(), 'private-key.asc');

const PRIVATE_KEY_FINGERPRINT_REGEX = /\w{40}/;

export async function importKey(privateKey: string) {
  fs.writeFileSync(PRIVATE_KEY_FILE, privateKey, {
    encoding: 'utf-8',
    flag: 'w'
  });

  core.info(`PRIVATE_KEY_FILE: ${PRIVATE_KEY_FILE}`);
  const lines = privateKey.split(/\r\n|\r|\n/).length;
  core.info(`Private key contains ${lines} lines`);

  let output = '';

  const options: ExecOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      }
    }
  };

  await exec.exec('gpg', ['--batch', '--verbose', '--import', PRIVATE_KEY_FILE], options);

  await io.rmRF(PRIVATE_KEY_FILE);

  const match = output.match(PRIVATE_KEY_FINGERPRINT_REGEX);
  return match && match[0];
}

export async function deleteKey(keyFingerprint: string) {
  await exec.exec('gpg', ['--batch', '--yes', '--delete-secret-and-public-key', keyFingerprint], {
    silent: true
  });
}
