export interface DeviceInfo {
    port: string;
    vendorId: number | null;
    productId: number | null;
}
export declare class SerialPortLite {
    static list(): Promise<DeviceInfo[]>;
    static write(port: string, data: string, speed: number): Promise<boolean>;
}
