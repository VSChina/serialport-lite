"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var os = require("os");
var timers_1 = require("timers");
var SerialPortLite = /** @class */ (function () {
    function SerialPortLite() {
    }
    SerialPortLite.list = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            if (os.type() === 'Windows_NT') {
                                child_process_1.exec('wmic path Win32_SerialPort', function (error, stdout, stderr) {
                                    if (error) {
                                        reject(error);
                                        return;
                                    }
                                    var list = parseWindowsCOMList(stdout);
                                    resolve(list);
                                });
                            }
                            else if (os.type() === 'Darwin') {
                                child_process_1.exec('ls /dev/cu.usb*', function (error, stdout, stderr) { return __awaiter(_this, void 0, void 0, function () {
                                    var list;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (error) {
                                                    reject(error);
                                                    return [2 /*return*/];
                                                }
                                                return [4 /*yield*/, getMacDeviceId(parseMacCOMList(stdout))];
                                            case 1:
                                                list = _a.sent();
                                                resolve(list);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                            }
                            else if (os.type() === 'Linux') {
                                child_process_1.exec('find /sys/bus/usb/devices/usb*/ -name dev', function (error, stdout, stderr) { return __awaiter(_this, void 0, void 0, function () {
                                    var list;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (error) {
                                                    reject(error);
                                                    return [2 /*return*/];
                                                }
                                                return [4 /*yield*/, parseLinuxDeviceList(stdout)];
                                            case 1:
                                                list = _a.sent();
                                                resolve(list);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                            }
                            else {
                                reject(new Error("Unsupported OS: " + os.type()));
                            }
                            return [2 /*return*/];
                        });
                    }); })];
            });
        });
    };
    SerialPortLite.write = function (port, data, speed) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (os.type() === 'Windows_NT') {
                                child_process_1.exec("mode " + port + ":" + speed + ",n,8,1", function (error, stdout, stderr) {
                                    if (error) {
                                        reject(error);
                                        return;
                                    }
                                    var _data = ['\\r\\n'];
                                    while (data.length > 120) {
                                        _data.push(data.substr(0, 120));
                                        data = data.substr(120);
                                    }
                                    _data.push(data);
                                    var sender = timers_1.setInterval(function () {
                                        if (_data.length === 0) {
                                            clearInterval(sender);
                                            resolve(true);
                                            return;
                                        }
                                        child_process_1.exec("echo " + _data.shift() + " > \\\\.\\" + port, function (error, stdout, stderr) {
                                            if (error) {
                                                clearInterval(sender);
                                                reject(error);
                                                return;
                                            }
                                        });
                                    }, 1000);
                                });
                            }
                            else {
                                child_process_1.exec("screen -dmS devkit " + port + " " + speed, function (error, stdout, stderr) {
                                    if (error) {
                                        child_process_1.exec('screen -X -S devkit quit');
                                        reject(error);
                                        return;
                                    }
                                    var _data = ['\\r'];
                                    while (data.length > 120) {
                                        _data.push(data.substr(0, 120));
                                        data = data.substr(120);
                                    }
                                    _data.push(data);
                                    var sender = timers_1.setInterval(function () {
                                        if (_data.length === 0) {
                                            clearInterval(sender);
                                            child_process_1.exec('screen -X -S devkit quit');
                                            resolve(true);
                                            return;
                                        }
                                        child_process_1.exec("screen -S devkit -p 0 -X stuff $'" + _data.shift() + "\\n'", function (error, stdout, stderr) {
                                            if (error) {
                                                clearInterval(sender);
                                                child_process_1.exec('screen -X -S devkit quit');
                                                reject(error);
                                                return;
                                            }
                                        });
                                    }, 1000);
                                });
                            }
                            return [2 /*return*/];
                        });
                    }); })];
            });
        });
    };
    return SerialPortLite;
}());
exports.SerialPortLite = SerialPortLite;
function parseWindowsCOMList(rawList) {
    var rows = rawList.trim().split('\n');
    var list = [];
    for (var i = 1; i < rows.length; i++) {
        var row = rows[i].split(/\s{2,}/);
        var port = row[7];
        var ids = row[13];
        var vidMatches = ids.match(/VID_([A-F0-9]+)&/);
        var pidMatches = ids.match(/PID_([A-F0-9]+)&/);
        var vid = vidMatches && vidMatches.length > 1 ? vidMatches[1] : null;
        var pid = pidMatches && pidMatches.length > 1 ? pidMatches[1] : null;
        list.push({
            port: row[7],
            vendorId: vid ? Number("0x" + vid) : null,
            productId: pid ? Number("0x" + pid) : null,
        });
    }
    return list;
}
function parseMacCOMList(rawList) {
    var list = [];
    var lines = rawList.trim().split('\n');
    lines.forEach(function (line) {
        list.push({ port: line, vendorId: null, productId: null });
    });
    return list;
}
function parseLinuxDeviceList(rawList) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var list, lines, i, matches, port, devicePath, currentDevice, error_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 5, , 6]);
                                list = [];
                                lines = rawList.trim().split('\n');
                                i = 0;
                                _a.label = 1;
                            case 1:
                                if (!(i < lines.length)) return [3 /*break*/, 4];
                                if (!/ttyACM\d+\/dev$/.test(lines[i])) return [3 /*break*/, 3];
                                matches = lines[i].match(/(ttyACM\d+)\/dev$/);
                                if (!(matches && matches.length > 1)) return [3 /*break*/, 3];
                                port = "/dev/" + matches[1];
                                devicePath = lines[i].substr(0, lines[i].length - 4);
                                return [4 /*yield*/, getLinuxDeviceId(port, devicePath)];
                            case 2:
                                currentDevice = _a.sent();
                                list.push(currentDevice);
                                _a.label = 3;
                            case 3:
                                i++;
                                return [3 /*break*/, 1];
                            case 4:
                                resolve(list);
                                return [3 /*break*/, 6];
                            case 5:
                                error_1 = _a.sent();
                                reject(error_1);
                                return [3 /*break*/, 6];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
function getLinuxDeviceId(port, devicePath) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        child_process_1.exec("udevadm info -q property -p " + devicePath, function (error, stdout, stderr) {
                            if (error) {
                                reject(error);
                                return;
                            }
                            var device = { port: port, vendorId: null, productId: null };
                            var lines = stdout.trim().split('\n');
                            for (var i = 0; i < lines.length; i++) {
                                var pidMatches = lines[i].match(/ID_MODEL_ID=(.*)/);
                                var vidMatches = lines[i].match(/ID_VENDOR_ID=(.*)/);
                                if (vidMatches && vidMatches.length > 1) {
                                    device.vendorId = Number("0x" + vidMatches[1]);
                                }
                                else if (pidMatches && pidMatches.length > 1) {
                                    device.productId = Number("0x" + pidMatches[1]);
                                }
                            }
                            resolve(device);
                        });
                        return [2 /*return*/];
                    });
                }); })];
        });
    });
}
function getMacDeviceId(list) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        child_process_1.exec('system_profiler SPUSBDataType', function (error, stdout, stderr) {
                            if (error) {
                                reject(error);
                                return;
                            }
                            var lines = stdout.split('\n');
                            var devices = [];
                            var currentDevice = { name: null, vid: null, pid: null, location: null };
                            for (var i = 0; i < lines.length; i++) {
                                var line = lines[i];
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
                                }
                                else if (/Product ID:/.test(line)) {
                                    var pidMatches = line.match(/Product ID:\s*(0x[0-9A-Za-z]+)/);
                                    if (pidMatches && pidMatches.length > 1) {
                                        currentDevice.pid = Number(pidMatches[1]);
                                    }
                                }
                                else if (/Vendor ID:/.test(line)) {
                                    var vidMatches = line.match(/Vendor ID:\s*(0x[0-9A-Za-z]+)/);
                                    if (vidMatches && vidMatches.length > 1) {
                                        currentDevice.vid = Number(vidMatches[1]);
                                    }
                                }
                                else if (/Location ID:/.test(line)) {
                                    var vidMatches = line.match(/Location ID:\s*0x([0-9A-Za-z]{3})/);
                                    if (vidMatches && vidMatches.length > 1) {
                                        currentDevice.location = vidMatches[1].toLowerCase();
                                    }
                                }
                            }
                            if (currentDevice.name) {
                                devices.push(currentDevice);
                            }
                            for (var i = 0; i < list.length; i++) {
                                var item = list[i];
                                var location = item.port.substr(-4, 3).toLowerCase();
                                for (var j = 0; j < devices.length; j++) {
                                    if (location === devices[j].location) {
                                        item.vendorId = devices[j].vid;
                                        item.productId = devices[j].pid;
                                        break;
                                    }
                                }
                            }
                            resolve(list);
                        });
                        return [2 /*return*/];
                    });
                }); })];
        });
    });
}
//# sourceMappingURL=index.js.map