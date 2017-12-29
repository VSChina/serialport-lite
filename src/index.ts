import {exec} from 'child_process';
import * as os from 'os';
import {setInterval} from 'timers';
import * as XMLJS from 'xml-js';

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
            exec('ls /dev/cu.usb*', async (error, stdout, stderr) => {
              if (error) {
                reject(error);
                return;
              }
              const list = await getMacDeviceId(parseUnixCOMList(stdout));
              resolve(list);
            });
          } else if (os.type() === 'Linux') {
            exec('ls /dev/tty.*', (error, stdout, stderr) => {
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

              const _data: string[] = [];

              while (data.length > 120) {
                _data.push(data.substr(0, 120));
                data = data.substr(120);
              }

              _data.push(data);

              const sender = setInterval(() => {
                if (_data.length === 0) {
                  clearInterval(sender);
                  resolve(true);
                  return;
                }
                exec(
                    `echo ${_data.shift()} > \\\\.\\${port}`,
                    (error, stdout, stderr) => {
                      if (error) {
                        clearInterval(sender);
                        reject(error);
                        return;
                      }
                    });
              }, 1000);
            });
          } else {
            exec(
                `stty -f ${port} cs8 ${
                    speed} ignbrk -brkint -icrnl -imaxbel -opost -onlcr -isig -icanon -iexten -echo -echoe -echok -echoctl -echoke noflsh -ixon -crtscts`,
                (error, stdout, stderr) => {
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

export interface MacDeviceInfo {
  name: string|null;
  vid: number|null;
  pid: number|null;
  location: string|null;
}

async function getMacDeviceId(list: DeviceInfo[]): Promise<DeviceInfo[]> {
  return new Promise(
      async (
          resolve: (value: DeviceInfo[]) => void,
          reject: (reason: Error) => void) => {
        exec('system_profiler SPUSBDataType', (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }

          const lines = stdout.split('\n');
          const devices = [];
          let currentDevice: MacDeviceInfo =
              {name: null, vid: null, pid: null, location: null};

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) {
              continue;
            }
            if (/:$/.test(line)) {
              if (currentDevice.name) {
                devices.push(currentDevice);
              }
              currentDevice = {
                name: line.substr(0, line.length - 1).trim(),
                vid: null,
                pid: null,
                location: null
              };
            } else if (/Product ID:/.test(line)) {
              const pidMatches = line.match(/Product ID:\s*(0x[0-9A-Za-z]+)/);
              if (pidMatches && pidMatches.length > 1) {
                currentDevice.pid = Number(pidMatches[1]);
              }
            } else if (/Vendor ID:/.test(line)) {
              const vidMatches = line.match(/Vendor ID:\s*(0x[0-9A-Za-z]+)/);
              if (vidMatches && vidMatches.length > 1) {
                currentDevice.vid = Number(vidMatches[1]);
              }
            } else if (/Location ID:/.test(line)) {
              const vidMatches =
                  line.match(/Location ID:\s*0x([0-9A-Za-z]{3})/);
              if (vidMatches && vidMatches.length > 1) {
                currentDevice.location = vidMatches[1].toLowerCase();
              }
            }
          }

          if (currentDevice.name) {
            devices.push(currentDevice);
          }

          for (let i = 0; i < list.length; i++) {
            const item = list[i];
            const location = item.port.substr(-4, 3).toLowerCase();
            for (let j = 0; j < devices.length; j++) {
              if (location === devices[j].location) {
                item.vendorId = devices[j].vid;
                item.productId = devices[j].pid;
                break;
              }
            }
          }

          resolve(list);
        });
      });
}