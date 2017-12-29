import {exec} from 'child_process';
import * as os from 'os';
import {setInterval} from 'timers';
import {resolve} from 'url';

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
              const list = await getMacDeviceId(parseMacCOMList(stdout));
              resolve(list);
            });
          } else if (os.type() === 'Linux') {
            exec(
                'find /sys/bus/usb/devices/usb*/ -name dev',
                async (error, stdout, stderr) => {
                  if (error) {
                    reject(error);
                    return;
                  }
                  const list = await parseLinuxDeviceList(stdout);
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

              const _data: string[] = ['\\r\\n'];

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
                `screen -dmS devkit ${port} ${speed}`,
                (error, stdout, stderr) => {
                  if (error) {
                    exec('screen -X -S devkit quit');
                    reject(error);
                    return;
                  }

                  const _data: string[] = ['\\r'];

                  while (data.length > 120) {
                    _data.push(data.substr(0, 120));
                    data = data.substr(120);
                  }

                  _data.push(data);

                  const sender = setInterval(() => {
                    if (_data.length === 0) {
                      clearInterval(sender);
                      exec('screen -X -S devkit quit');
                      resolve(true);
                      return;
                    }
                    exec(
                        `screen -S devkit -p 0 -X stuff $'${_data.shift()}\\n'`,
                        (error, stdout, stderr) => {
                          if (error) {
                            clearInterval(sender);
                            exec('screen -X -S devkit quit');
                            reject(error);
                            return;
                          }
                        });
                  }, 1000);
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

function parseMacCOMList(rawList: string): DeviceInfo[] {
  const list: DeviceInfo[] = [];
  const lines = rawList.trim().split('\n');
  lines.forEach(line => {
    list.push({port: line, vendorId: null, productId: null});
  });
  return list;
}

async function parseLinuxDeviceList(rawList: string): Promise<DeviceInfo[]> {
  return new Promise(
      async (
          resolve: (value: DeviceInfo[]) => void,
          reject: (reason: Error) => void) => {
        try {
          const list: DeviceInfo[] = [];
          const lines = rawList.trim().split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (/ttyACM\d+\/dev$/.test(lines[i])) {
              const matches = lines[i].match(/(ttyACM\d+)\/dev$/);
              if (matches && matches.length > 1) {
                const port = `/dev/${matches[1]}`;
                const devicePath = lines[i].substr(0, lines[i].length - 4);
                const currentDevice = await getLinuxDeviceId(port, devicePath);
                list.push(currentDevice);
              }
            }
          }
          resolve(list);
        } catch (error) {
          reject(error);
        }
      });
}

async function getLinuxDeviceId(
    port: string, devicePath: string): Promise<DeviceInfo> {
  return new Promise(
      async (
          resolve: (value: DeviceInfo) => void,
          reject: (reason: Error) => void) => {
        exec(
            `udevadm info -q property -p ${devicePath}`,
            (error, stdout, stderr) => {
              if (error) {
                reject(error);
                return;
              }

              const device:
                  DeviceInfo = {port, vendorId: null, productId: null};

              const lines = stdout.trim().split('\n');
              for (let i = 0; i < lines.length; i++) {
                const pidMatches = lines[i].match(/ID_MODEL_ID=(.*)/);
                const vidMatches = lines[i].match(/ID_VENDOR_ID=(.*)/);
                if (vidMatches && vidMatches.length > 1) {
                  device.vendorId = Number(`0x${vidMatches[1]}`);
                } else if (pidMatches && pidMatches.length > 1) {
                  device.productId = Number(`0x${pidMatches[1]}`);
                }
              }

              resolve(device);
            });
      });
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