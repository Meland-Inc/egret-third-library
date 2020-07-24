/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRMaskPattern {
        static PATTERN000: number;
        static PATTERN001: number;
        static PATTERN010: number;
        static PATTERN011: number;
        static PATTERN100: number;
        static PATTERN101: number;
        static PATTERN110: number;
        static PATTERN111: number;
    }
}
declare module qr {
    class QR8bitByte {
        private mode;
        private data;
        private parsedData;
        constructor(data: any);
        getLength(buffer: any): number;
        write(buffer: any): void;
    }
}
/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRCode {
        /**
         * msg
         * width,height 二维码宽度，高度
         * color 颜色
         *
         * errorCorrectLevel:
         * level L : 最大 7% 的错误能够被纠正；
         * level M : 最大 15% 的错误能够被纠正；
         * level Q : 最大 25% 的错误能够被纠正；
         * level H : 最大 30% 的错误能够被纠正；
         *
         * typeNumber:
         * QR图的大小(size)被定义为版本（Version)，版本号从1到40。版本1就是一个21*21的矩阵，每增加一个版本号，矩阵的大小就增加4个模块(Module)，
         * 因此，版本40就是一个177*177的矩阵。（版本越高，意味着存储的内容越多，纠错能力也越强）。
         * */
        static create(msg: string, width?: number, height?: number, errorCorrectLevel?: number, typeNumer?: number, color?: number): egret.Sprite;
        static draw(m: qr.QRCodeModel, _htOption: any): egret.Sprite;
    }
}
/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRCodeModel {
        typeNumber: number;
        errorCorrectLevel: any;
        modules: any;
        moduleCount: number;
        dataCache: any;
        dataList: any[];
        constructor(typeNumber: any, errorCorrectLevel: any);
        addData(data: any): void;
        isDark(row: any, col: any): any;
        getModuleCount(): number;
        make(): void;
        makeImpl(test: any, maskPattern: any): void;
        setupPositionProbePattern(row: any, col: any): void;
        getBestMaskPattern(): number;
        createMovieClip(target_mc: any, instance_name: any, depth: any): any;
        setupTimingPattern(): void;
        setupPositionAdjustPattern(): void;
        setupTypeNumber(test: any): void;
        setupTypeInfo(test: any, maskPattern: any): void;
        mapData(data: any, maskPattern: any): void;
        static PAD0: number;
        static PAD1: number;
        static createData(typeNumber: any, errorCorrectLevel: any, dataList: any): any[];
        static createBytes(buffer: any, rsBlocks: any): any[];
    }
}
/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRErrorCorrectLevel {
        static L: number;
        static M: number;
        static Q: number;
        static H: number;
    }
}
/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRBitBuffer {
        buffer: any;
        length: number;
        constructor();
        get(index: any): boolean;
        put(num: any, length: any): void;
        getLengthInBits(): number;
        putBit(bit: any): void;
    }
}
/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRMath {
        static isInit: boolean;
        static glog(n: any): any;
        static gexp(n: any): any;
        static EXP_TABLE: any[];
        static LOG_TABLE: any[];
        static init(): void;
    }
}
/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRMode {
        static MODE_NUMBER: number;
        static MODE_ALPHA_NUM: number;
        static MODE_8BIT_BYTE: number;
        static MODE_KANJI: number;
    }
}
/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRPolynomial {
        num: any;
        constructor(num: any, shift: any);
        get(index: any): any;
        getLength(): any;
        multiply(e: any): QRPolynomial;
        mod(e: any): any;
    }
}
/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRRSBlock {
        totalCount: any;
        dataCount: any;
        constructor(totalCount: any, dataCount: any);
        static RS_BLOCK_TABLE: number[][];
        static getRSBlocks: (typeNumber: any, errorCorrectLevel: any) => any[];
        static getRsBlockTable: (typeNumber: any, errorCorrectLevel: any) => number[];
    }
}
/**
 * Created by qingzhu on 15/7/1.
 */
declare module qr {
    class QRUtil {
        static PATTERN_POSITION_TABLE: number[][];
        static G15: number;
        static G18: number;
        static G15_MASK: number;
        static getBCHTypeInfo(data: any): number;
        static getBCHTypeNumber(data: any): number;
        static getBCHDigit(data: any): number;
        static getPatternPosition(typeNumber: any): number[];
        static getMask(maskPattern: any, i: any, j: any): boolean;
        static getErrorCorrectPolynomial(errorCorrectLength: any): QRPolynomial;
        static getLengthInBits(mode: any, type: any): 12 | 8 | 10 | 9 | 11 | 16 | 14 | 13;
        static getLostPoint(qrCode: any): number;
        static QRCodeLimitLength: number[][];
        static_isSupportCanvas(): boolean;
        static _getTypeNumber(sText: any, nCorrectLevel: any): number;
        static _getUTF8Length(sText: any): number;
    }
}
