import {SerialPortLite} from './index';

SerialPortLite.list().then(list => {
    console.log(list);
});