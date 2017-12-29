import {SerialPortLite} from './index';

try {
  SerialPortLite.list().then(list => {
    console.log(list);
    list.forEach(device => {
      if (device.vendorId === 0x0483 && device.productId === 0x374b) {
        SerialPortLite.write(device.port, 'set_wifissid sneezry\r', 115200);
      }
    });
  });
} catch (e) {
  console.log(e);
}