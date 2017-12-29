import {SerialPortLite} from './index';

try {
    SerialPortLite.list().then(list => {
        console.log(list);
    });

    SerialPortLite.write('COM30', 'help\r\n', 115200);
} catch(e) {
    console.log(e)
}