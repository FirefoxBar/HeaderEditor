import { execFile } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

function quotePath(p) {
  return '"' + p + '"';
}

function exec(command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function createZip(inPath, outPath) {
  if (process.platform === 'win32') {
    await fs.rm(outPath, { recursive: true, maxRetries: 3 });
    return exec(
      'powershell.exe',
      [
        '-nologo',
        '-noprofile',
        '-command',
        '& { param([String]$myInPath, [String]$myOutPath); Add-Type -A "System.IO.Compression.FileSystem"; [IO.Compression.ZipFile]::CreateFromDirectory($myInPath, $myOutPath); exit !$? }',
        '-myInPath',
        quotePath(inPath),
        '-myOutPath',
        quotePath(outPath),
      ],
      {
        cwd: path.dirname(inPath),
        maxBuffer: Infinity,
      },
    );
  }
  return exec('zip', ['-r', '-y', outPath, '.'], {
    cwd: inPath,
    maxBuffer: Infinity,
  });
}
