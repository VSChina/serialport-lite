import {exec} from 'child_process';
import * as os from 'os';

export interface DeviceInfo {
  port: string;
  vendorId: number|null;
  productId: number|null;
}

export class SerialPortLite {
  static async list(): Promise<DeviceInfo[]> {
    return new Promise(
        async (
            resolve: (value: DeviceInfo[]) => void,
            reject: (reason: Error) => void) => {
          if (os.type() === 'Windows_NT') {
            exec('wmic path Win32_SerialPort', (error, stdout, stderr) => {
              if (error) {
                reject(error);
                return;
              }
              const list = parseWindowsCOMList(stdout);
              resolve(list);
            });
          } else if (os.type() === 'Darwin') {
            exec('ls -l /dev/tty.*', (error, stdout, stderr) => {
              if (error) {
                reject(error);
                return;
              }
              const list = parseUnixCOMList(stdout);
              resolve(list);
            });
          } else if (os.type() === 'Linux') {
            exec('ls -l /dev/tty.*', (error, stdout, stderr) => {
              if (error) {
                reject(error);
                return;
              }
              const list = parseUnixCOMList(stdout);
              resolve(list);
            });
          } else {
            reject(new Error(`Unsupported OS: ${os.type()}`));
          }
        });
  }

  static async write(port: string, data: string, speed: number):
      Promise<boolean> {
    return new Promise(
        async (
            resolve: (value: boolean) => void,
            reject: (resaon: Error) => void) => {
          if (os.type() === 'Windows_NT') {
            exec(`mode ${port}:${speed},n,8,1`, (error, stdout, stderr) => {
              if (error) {
                reject(error);
                return;
              }
              exec(`echo ${data} > \\\\.\\${port}`, (error, stdout, stderr) => {
                if (error) {
                  reject(error);
                  return;
                }

                resolve(true);
              });
            });
          } else {
            exec(`stty -speed ${speed} < ${port}`, (error, stdout, stderr) => {
              if (error) {
                reject(error);
                return;
              }
              exec(`echo '${data}' > ${port}`, (error, stdout, stderr) => {
                if (error) {
                  reject(error);
                  return;
                }

                resolve(true);
              });
            });
          }
        });
  }
}

function parseWindowsCOMList(rawList: string): DeviceInfo[] {
  const rows = rawList.trim().split('\n');
  const list: DeviceInfo[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split(/\s{2,}/);
    const port = row[7];
    const ids = row[13];
    const vidMatches = ids.match(/VID_([A-F0-9]+)&/);
    const pidMatches = ids.match(/PID_([A-F0-9]+)&/);
    const vid = vidMatches && vidMatches.length > 1 ? vidMatches[1] : null;
    const pid = pidMatches && pidMatches.length > 1 ? pidMatches[1] : null;

    list.push({
      port: row[7],
      vendorId: vid ? Number(`0x${vid}`) : null,
      productId: pid ? Number(`0x${pid}`) : null,
    });
  }

  return list;
}

function parseUnixCOMList(rawList: string): DeviceInfo[] {
  const list: DeviceInfo[] = [];
  const lines = rawList.trim().split('\n');
  lines.forEach(line => {
    list.push({port: line, vendorId: null, productId: null});
  });
  return list;
}