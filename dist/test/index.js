"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
try {
    index_1.SerialPortLite.list().then(function (list) {
        console.log(list);
        list.forEach(function (device) {
            if (device.vendorId === 0x0483 && device.productId === 0x374b) {
                index_1.SerialPortLite.write(device.port, 'set_wifissid sneezry\r', 115200);
            }
        });
    });
}
catch (e) {
    console.log(e);
}
//# sourceMappingURL=index.js.map