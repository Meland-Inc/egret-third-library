/**
 * @Author 雪糕
 * @Description
 * @Date 2020-07-20 10:08:06
 * @FilePath \pc\src\common\FileUtil.ts
 */
import * as fse from 'fs-extra';
import { logger } from '../main/logger';
import * as  rendererLogger from '../renderer/logger';
export default class FileUtil {
    /** 判断文件是否存在 */
    public static existsSync(path: fse.PathLike): boolean {
        try {
            return fse.existsSync(path);
        } catch (error) {
            return false;
        }
    }

    /** 读取文件 */
    public static readFileSync(path: fse.PathLike | number, options: { encoding: string; flag?: string; } | string, logError: boolean = true): string {
        try {
            return fse.readFileSync(path, options);
        } catch (error) {
            if (logError) {
                this.logError("file", `readyFileSync: ${path} error`, error);
            }
            return "";
        }
    }

    /** 写入文件 */
    public static writeFileSync(path: fse.PathLike | number, data: any, options?: fse.WriteFileOptions | string | null, logError: boolean = true): boolean {
        try {
            fse.writeFileSync(path, data, options);
            return true;
        } catch (error) {
            if (logError) {
                this.logError("file", `writeFileSync: ${path} error`, error);
            }
            return false;
        }
    }

    /** 读取目录 */
    public static readdirSync(path: fse.PathLike, options?: { encoding: BufferEncoding | null; withFileTypes?: false } | BufferEncoding | null, logError: boolean = true): string[] {
        try {
            return fse.readdirSync(path, options);
        } catch (error) {
            if (logError) {
                this.logError("file", `readdirSync: ${path} error`, error);
            }
            return [];
        }
    }

    /** 清空指定目录 */
    public static emptyDirSync(path: string): boolean {
        try {
            fse.emptyDirSync(path);
            return true;
        } catch (error) {
            this.logError("file", `statSync: ${path} error`, error);
            return false;
        }
    }

    /** 删除指定文件 */
    public static unlinkSync(path: string | Buffer): boolean {
        try {
            fse.unlinkSync(path);
            return true;
        } catch (error) {
            this.logError("file", `unlinkSync: ${path} error`, error);
            return false;
        }
    }

    /** 创建读取流 */
    public static createReadStream(path: fse.PathLike, options?: string | {
        flags?: string;
        encoding?: string;
        fd?: number;
        mode?: number;
        autoClose?: boolean;
        emitClose?: boolean;
        start?: number;
        end?: number;
        highWaterMark?: number;
    }): fse.ReadStream {
        try {
            return fse.createReadStream(path, options);
        } catch (error) {
            this.logError("file", `createReadStream: ${path} error`, error);
            return null;
        }
    }

    /** 创建写入流 */
    public static createWriteStream(path: fse.PathLike, options?: string | {
        flags?: string;
        encoding?: string;
        fd?: number;
        mode?: number;
        autoClose?: boolean;
        emitClose?: boolean;
        start?: number;
        highWaterMark?: number;
    }): fse.WriteStream {
        try {
            return fse.createWriteStream(path, options);
        } catch (error) {
            this.logError("file", `createWriteStream: ${path} error`, error);
            return null;
        }
    }

    /** 拷贝文件 */
    public static copyFileSync(src: fse.PathLike, dest: fse.PathLike, flags?: number): boolean {
        try {
            fse.copyFileSync(src, dest, flags);
            return true;
        } catch (error) {
            this.logError("file", `copyFileSync: src: ${src} dest: ${dest} error`, error);
            return false;
        }
    }

    /** 确保目录存在 */
    public static ensureDirSync(path: string, options?: fse.EnsureOptions | number): boolean {
        try {
            fse.ensureDirSync(path, options);
            return true;
        } catch (error) {
            this.logError("file", `ensureDirSync: ${path} error`, error);
            return false;
        }
    }

    /** 修改文件权限 */
    public static chmod(path: string | Buffer, mode: string | number, callback: fse.NoParamCallback): boolean {
        try {
            fse.chmod(path, mode, callback);
            return true;
        } catch (error) {
            this.logError("file", `chmod: ${path} error`, error);
            return false;
        }
    }

    private static logError(tag: string, msg: string, ...args: any[]): void {
        if (logger) {
            logger.error(tag, msg, ...args);
            return;
        }

        if (rendererLogger) {
            rendererLogger.error(tag, msg, ...args);
            
        }
    }
}