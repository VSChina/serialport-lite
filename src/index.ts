import * as os from 'os';
import {exec} from 'child_process';

interface DeviceInfo {
    port: string;
    vendorId: number;
    productId: number;
}

export class SerialPortLite {
    static async list(): Promise<DeviceInfo[]> {
        return new Promise(async (resolve: (value: DeviceInfo[]) => void, reject: (reason: Error) => void) => {
            if (os.type() === 'Windows_NT') {
                exec('wmic path Win32_SerialPort', (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    let list = parseWindowsCOMList(stdout);
                    resolve(list);
                });
            } else if (os.type() === 'Darwin') {
                exec('ls -l /dev/tty.*', (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    let list = parseUnixCOMList(stdout);
                    resolve(list);
                });
            } else if (os.type() === 'Linux') {
                exec('ls -l /dev/tty.*', (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    let list = parseUnixCOMList(stdout);
                    resolve(list);
                });
            } else {
                reject(new Error(`Unsupported OS: ${os.type()}`));
            }
        });
    }

    static async write(port: string, data: string, speed: number): Promise<boolean> {
        return new Promise(async (resolve: (value: boolean) => void, reject: (resaon: Error) => void) => {
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
                    exec(`echo -ne '${data}' > ${port}`, (error, stdout, stderr) => {
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
    let rows = rawList.trim().split('\n');
    let list: DeviceInfo[] = [];
    for (var i = 1; i < rows.length; i++) {
        let row = rows[i].split(/\s{2,}/);
        let port = row[7];
        let ids = row[13];
        let vidMatches = ids.match(/VID_([A-F0-9]+)&/);
        let pidMatches = ids.match(/PID_([A-F0-9]+)&/);
        let vid = vidMatches && vidMatches.length > 1 ? vidMatches[1] : null;
        let pid = pidMatches && pidMatches.length > 1 ? pidMatches[1] : null;

        list.push({
            port: row[7],
            vendorId: vid ? parseInt(vid, 16) : null,
            productId: pid ? parseInt(pid, 16) : null,
        })
    }

    return list;
}

function parseUnixCOMList(rawList: string): DeviceInfo[] {
    let list: DeviceInfo[] = [];
    let lines = rawList.trim().split('\n');
    lines.forEach(line => {
        list.push({
            port: line,
            vendorId: null,
            productId: null
        })
    })
    return list;
}