import * as os from 'os';
import {exec} from 'child_process';

interface DeviceInfo {
    path: string,
    vendorId: number
    productId: number
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
                exec('system_profiler SPUSBDataType', (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    let list = parseUnixCOMList(stdout);
                    resolve(list);
                });
            } else if (os.type() === 'Linux') {
                resolve([]);
            } else {
                reject(new Error(`Unsupported OS: ${os.type()}`));
            }
        });
    }
}

function parseWindowsCOMList(rawList: string): DeviceInfo[] {
    let rows = rawList.trim().split('\n');
    let list: DeviceInfo[] = [];
    for (var i = 1; i < rows.length; i++) {
        let row = rows[i].split(/\s{2,}/);
        let path = row[7];
        let ids = row[13];
        console.log(ids)
        let vidMatches = ids.match(/VID_([A-F0-9]+)&/);
        let pidMatches = ids.match(/PID_([A-F0-9]+)&/);
        let vid = vidMatches && vidMatches.length > 1 ? vidMatches[1] : null;
        let pid = pidMatches && pidMatches.length > 1 ? pidMatches[1] : null;

        list.push({
            path: row[7],
            vendorId: vid ? parseInt(vid, 16) : null,
            productId: pid ? parseInt(pid, 16) : null,
        })
    }

    return list;
}

function parseUnixCOMList(rawList: string): DeviceInfo[] {
    let list: DeviceInfo[] = [];
    let lines = rawList.split('\n');
    return list;
}