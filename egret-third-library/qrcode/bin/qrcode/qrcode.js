var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRMaskPattern = /** @class */ (function () {
        function QRMaskPattern() {
        }
        QRMaskPattern.PATTERN000 = 0;
        QRMaskPattern.PATTERN001 = 1;
        QRMaskPattern.PATTERN010 = 2;
        QRMaskPattern.PATTERN011 = 3;
        QRMaskPattern.PATTERN100 = 4;
        QRMaskPattern.PATTERN101 = 5;
        QRMaskPattern.PATTERN110 = 6;
        QRMaskPattern.PATTERN111 = 7;
        return QRMaskPattern;
    }());
    qr.QRMaskPattern = QRMaskPattern;
    __reflect(QRMaskPattern.prototype, "qr.QRMaskPattern");
})(qr || (qr = {}));
var qr;
(function (qr) {
    var QR8bitByte = /** @class */ (function () {
        function QR8bitByte(data) {
            this.mode = qr.QRMode.MODE_8BIT_BYTE;
            this.data = data;
            this.parsedData = [];
            //  UTF-8
            for (var i = 0, l = this.data.length; i < l; i++) {
                var byteArray = [];
                var code = this.data.charCodeAt(i);
                if (code > 0x10000) {
                    byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
                    byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
                    byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
                    byteArray[3] = 0x80 | (code & 0x3F);
                }
                else if (code > 0x800) {
                    byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
                    byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
                    byteArray[2] = 0x80 | (code & 0x3F);
                }
                else if (code > 0x80) {
                    byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
                    byteArray[1] = 0x80 | (code & 0x3F);
                }
                else {
                    byteArray[0] = code;
                }
                this.parsedData.push(byteArray);
            }
            this.parsedData = Array.prototype.concat.apply([], this.parsedData);
            if (this.parsedData.length != this.data.length) {
                this.parsedData.unshift(191);
                this.parsedData.unshift(187);
                this.parsedData.unshift(239);
            }
        }
        QR8bitByte.prototype.getLength = function (buffer) {
            return this.parsedData.length;
        };
        QR8bitByte.prototype.write = function (buffer) {
            for (var i = 0, l = this.parsedData.length; i < l; i++) {
                buffer.put(this.parsedData[i], 8);
            }
        };
        return QR8bitByte;
    }());
    qr.QR8bitByte = QR8bitByte;
    __reflect(QR8bitByte.prototype, "qr.QR8bitByte");
})(qr || (qr = {}));
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRCode = /** @class */ (function () {
        function QRCode() {
        }
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
        QRCode.create = function (msg, width, height, errorCorrectLevel, typeNumer, color) {
            if (width === void 0) { width = 200; }
            if (height === void 0) { height = 200; }
            if (errorCorrectLevel === void 0) { errorCorrectLevel = qr.QRErrorCorrectLevel.M; }
            if (typeNumer === void 0) { typeNumer = 4; }
            if (color === void 0) { color = 0; }
            var _htOption = {
                color: color,
                width: width,
                height: height,
                correctLevel: errorCorrectLevel,
                typeNumer: typeNumer
            };
            var _oQRCode = new qr.QRCodeModel(_htOption.typeNumer, _htOption.correctLevel);
            _oQRCode.addData(msg);
            _oQRCode.make();
            return QRCode.draw(_oQRCode, _htOption);
        };
        QRCode.draw = function (m, _htOption) {
            var sc = new egret.Sprite();
            var _htOption = _htOption;
            var nCount = m.getModuleCount();
            var nWidth = (_htOption.width / nCount);
            var nHeight = (_htOption.height / nCount);
            //画一个比二维码本身略大的白色底框
            var borderWidth = 10;
            sc.graphics.moveTo(-borderWidth, -borderWidth);
            sc.graphics.beginFill(0xffffff);
            sc.graphics.drawRect(-borderWidth, -borderWidth, _htOption.width + 2 * borderWidth, _htOption.height + 2 * borderWidth);
            sc.graphics.endFill();
            for (var row = 0; row < nCount; row++) {
                for (var col = 0; col < nCount; col++) {
                    var b = m.isDark(row, col);
                    if (b) {
                        sc.graphics.moveTo(col * nWidth, row * nHeight);
                        sc.graphics.beginFill(_htOption.color);
                        sc.graphics.drawRect(col * nWidth, row * nHeight, nWidth, nHeight);
                        sc.graphics.endFill();
                    }
                }
            }
            return sc;
        };
        return QRCode;
    }());
    qr.QRCode = QRCode;
    __reflect(QRCode.prototype, "qr.QRCode");
})(qr || (qr = {}));
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRCodeModel = /** @class */ (function () {
        function QRCodeModel(typeNumber, errorCorrectLevel) {
            this.modules = null;
            this.moduleCount = 0;
            this.dataCache = null;
            this.dataList = [];
            this.typeNumber = typeNumber;
            this.errorCorrectLevel = errorCorrectLevel;
            this.modules = null;
            this.moduleCount = 0;
            this.dataCache = null;
            this.dataList = [];
        }
        QRCodeModel.prototype.addData = function (data) {
            var newData = new qr.QR8bitByte(data);
            this.dataList.push(newData), this.dataCache = null;
        };
        QRCodeModel.prototype.isDark = function (row, col) {
            if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col)
                throw new Error(row + "," + col);
            return this.modules[row][col];
        };
        QRCodeModel.prototype.getModuleCount = function () {
            return this.moduleCount;
        };
        QRCodeModel.prototype.make = function () {
            this.makeImpl(!1, this.getBestMaskPattern());
        };
        QRCodeModel.prototype.makeImpl = function (test, maskPattern) {
            this.moduleCount = this.typeNumber * 4 + 17, this.modules = new Array(this.moduleCount);
            for (var row = 0; row < this.moduleCount; row++) {
                this.modules[row] = new Array(this.moduleCount);
                for (var col = 0; col < this.moduleCount; col++)
                    this.modules[row][col] = null;
            }
            this.setupPositionProbePattern(0, 0),
                this.setupPositionProbePattern(this.moduleCount - 7, 0),
                this.setupPositionProbePattern(0, this.moduleCount - 7),
                this.setupPositionAdjustPattern(),
                this.setupTimingPattern(),
                this.setupTypeInfo(test, maskPattern),
                this.typeNumber >= 7 && this.setupTypeNumber(test),
                this.dataCache == null && (this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList)), this.mapData(this.dataCache, maskPattern);
        };
        QRCodeModel.prototype.setupPositionProbePattern = function (row, col) {
            for (var r = -1; r <= 7; r++) {
                if (row + r <= -1 || this.moduleCount <= row + r)
                    continue;
                for (var c = -1; c <= 7; c++) {
                    if (col + c <= -1 || this.moduleCount <= col + c)
                        continue;
                    0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4 ? this.modules[row + r][col + c] = !0 : this.modules[row + r][col + c] = !1;
                }
            }
        };
        QRCodeModel.prototype.getBestMaskPattern = function () {
            var minLostPoint = 0, pattern = 0;
            for (var i = 0; i < 8; i++) {
                this.makeImpl(!0, i);
                var lostPoint = qr.QRUtil.getLostPoint(this);
                if (i == 0 || minLostPoint > lostPoint)
                    minLostPoint = lostPoint, pattern = i;
            }
            return pattern;
        };
        QRCodeModel.prototype.createMovieClip = function (target_mc, instance_name, depth) {
            var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth), cs = 1;
            this.make();
            for (var row = 0; row < this.modules.length; row++) {
                var y = row * cs;
                for (var col = 0; col < this.modules[row].length; col++) {
                    var x = col * cs, dark = this.modules[row][col];
                    dark && (qr_mc.beginFill(0, 100), qr_mc.moveTo(x, y), qr_mc.lineTo(x + cs, y), qr_mc.lineTo(x + cs, y + cs), qr_mc.lineTo(x, y + cs), qr_mc.endFill());
                }
            }
            return qr_mc;
        };
        QRCodeModel.prototype.setupTimingPattern = function () {
            for (var r = 8; r < this.moduleCount - 8; r++) {
                if (this.modules[r][6] != null)
                    continue;
                this.modules[r][6] = r % 2 == 0;
            }
            for (var c = 8; c < this.moduleCount - 8; c++) {
                if (this.modules[6][c] != null)
                    continue;
                this.modules[6][c] = c % 2 == 0;
            }
        };
        QRCodeModel.prototype.setupPositionAdjustPattern = function () {
            var pos = qr.QRUtil.getPatternPosition(this.typeNumber);
            for (var i = 0; i < pos.length; i++)
                for (var j = 0; j < pos.length; j++) {
                    var row = pos[i], col = pos[j];
                    if (this.modules[row][col] != null)
                        continue;
                    for (var r = -2; r <= 2; r++)
                        for (var c = -2; c <= 2; c++)
                            r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0 ? this.modules[row + r][col + c] = !0 : this.modules[row + r][col + c] = !1;
                }
        };
        QRCodeModel.prototype.setupTypeNumber = function (test) {
            var bits = qr.QRUtil.getBCHTypeNumber(this.typeNumber);
            for (var i = 0; i < 18; i++) {
                var mod = !test && (bits >> i & 1) == 1;
                this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
            }
            for (var i = 0; i < 18; i++) {
                var mod = !test && (bits >> i & 1) == 1;
                this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
            }
        };
        QRCodeModel.prototype.setupTypeInfo = function (test, maskPattern) {
            var data = this.errorCorrectLevel << 3 | maskPattern, bits = qr.QRUtil.getBCHTypeInfo(data);
            for (var i = 0; i < 15; i++) {
                var mod = !test && (bits >> i & 1) == 1;
                i < 6 ? this.modules[i][8] = mod : i < 8 ? this.modules[i + 1][8] = mod : this.modules[this.moduleCount - 15 + i][8] = mod;
            }
            for (var i = 0; i < 15; i++) {
                var mod = !test && (bits >> i & 1) == 1;
                i < 8 ? this.modules[8][this.moduleCount - i - 1] = mod : i < 9 ? this.modules[8][15 - i - 1 + 1] = mod : this.modules[8][15 - i - 1] = mod;
            }
            this.modules[this.moduleCount - 8][8] = !test;
        };
        QRCodeModel.prototype.mapData = function (data, maskPattern) {
            var inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0;
            for (var col = this.moduleCount - 1; col > 0; col -= 2) {
                col == 6 && col--;
                for (;;) {
                    for (var c = 0; c < 2; c++)
                        if (this.modules[row][col - c] == null) {
                            var dark = !1;
                            byteIndex < data.length && (dark = (data[byteIndex] >>> bitIndex & 1) == 1);
                            var mask = qr.QRUtil.getMask(maskPattern, row, col - c);
                            mask && (dark = !dark), this.modules[row][col - c] = dark, bitIndex--, bitIndex == -1 && (byteIndex++, bitIndex = 7);
                        }
                    row += inc;
                    if (row < 0 || this.moduleCount <= row) {
                        row -= inc, inc = -inc;
                        break;
                    }
                }
            }
        };
        QRCodeModel.createData = function (typeNumber, errorCorrectLevel, dataList) {
            var rsBlocks = qr.QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel), buffer = new qr.QRBitBuffer;
            for (var i = 0; i < dataList.length; i++) {
                var data = dataList[i];
                buffer.put(data.mode, 4), buffer.put(data.getLength(), qr.QRUtil.getLengthInBits(data.mode, typeNumber)), data.write(buffer);
            }
            var totalDataCount = 0;
            for (var i = 0; i < rsBlocks.length; i++)
                totalDataCount += rsBlocks[i].dataCount;
            if (buffer.getLengthInBits() > totalDataCount * 8)
                throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")");
            buffer.getLengthInBits() + 4 <= totalDataCount * 8 && buffer.put(0, 4);
            while (buffer.getLengthInBits() % 8 != 0)
                buffer.putBit(!1);
            for (;;) {
                if (buffer.getLengthInBits() >= totalDataCount * 8)
                    break;
                buffer.put(QRCodeModel.PAD0, 8);
                if (buffer.getLengthInBits() >= totalDataCount * 8)
                    break;
                buffer.put(QRCodeModel.PAD1, 8);
            }
            return QRCodeModel.createBytes(buffer, rsBlocks);
        };
        QRCodeModel.createBytes = function (buffer, rsBlocks) {
            var offset = 0, maxDcCount = 0, maxEcCount = 0, dcdata = new Array(rsBlocks.length), ecdata = new Array(rsBlocks.length);
            for (var r = 0; r < rsBlocks.length; r++) {
                var dcCount = rsBlocks[r].dataCount, ecCount = rsBlocks[r].totalCount - dcCount;
                maxDcCount = Math.max(maxDcCount, dcCount), maxEcCount = Math.max(maxEcCount, ecCount), dcdata[r] = new Array(dcCount);
                for (var i = 0; i < dcdata[r].length; i++)
                    dcdata[r][i] = 255 & buffer.buffer[i + offset];
                offset += dcCount;
                var rsPoly = qr.QRUtil.getErrorCorrectPolynomial(ecCount), rawPoly = new qr.QRPolynomial(dcdata[r], rsPoly.getLength() - 1), modPoly = rawPoly.mod(rsPoly);
                ecdata[r] = new Array(rsPoly.getLength() - 1);
                for (var i = 0; i < ecdata[r].length; i++) {
                    var modIndex = i + modPoly.getLength() - ecdata[r].length;
                    ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
                }
            }
            var totalCodeCount = 0;
            for (var i = 0; i < rsBlocks.length; i++)
                totalCodeCount += rsBlocks[i].totalCount;
            var data = new Array(totalCodeCount), index = 0;
            for (var i = 0; i < maxDcCount; i++)
                for (var r = 0; r < rsBlocks.length; r++)
                    i < dcdata[r].length && (data[index++] = dcdata[r][i]);
            for (var i = 0; i < maxEcCount; i++)
                for (var r = 0; r < rsBlocks.length; r++)
                    i < ecdata[r].length && (data[index++] = ecdata[r][i]);
            return data;
        };
        ////
        QRCodeModel.PAD0 = 236;
        QRCodeModel.PAD1 = 17;
        return QRCodeModel;
    }());
    qr.QRCodeModel = QRCodeModel;
    __reflect(QRCodeModel.prototype, "qr.QRCodeModel");
})(qr || (qr = {}));
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRErrorCorrectLevel = /** @class */ (function () {
        function QRErrorCorrectLevel() {
        }
        QRErrorCorrectLevel.L = 1;
        QRErrorCorrectLevel.M = 0;
        QRErrorCorrectLevel.Q = 3;
        QRErrorCorrectLevel.H = 2;
        return QRErrorCorrectLevel;
    }());
    qr.QRErrorCorrectLevel = QRErrorCorrectLevel;
    __reflect(QRErrorCorrectLevel.prototype, "qr.QRErrorCorrectLevel");
})(qr || (qr = {}));
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRBitBuffer = /** @class */ (function () {
        function QRBitBuffer() {
            this.buffer = [];
            this.length = 0;
        }
        QRBitBuffer.prototype.get = function (index) {
            var bufIndex = Math.floor(index / 8);
            return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
        };
        QRBitBuffer.prototype.put = function (num, length) {
            for (var i = 0; i < length; i++)
                this.putBit((num >>> length - i - 1 & 1) == 1);
        };
        QRBitBuffer.prototype.getLengthInBits = function () {
            return this.length;
        };
        QRBitBuffer.prototype.putBit = function (bit) {
            var bufIndex = Math.floor(this.length / 8);
            this.buffer.length <= bufIndex && this.buffer.push(0), bit && (this.buffer[bufIndex] |= 128 >>> this.length % 8), this.length++;
        };
        return QRBitBuffer;
    }());
    qr.QRBitBuffer = QRBitBuffer;
    __reflect(QRBitBuffer.prototype, "qr.QRBitBuffer");
})(qr || (qr = {}));
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRMath = /** @class */ (function () {
        function QRMath() {
        }
        QRMath.glog = function (n) {
            if (!QRMath.isInit) {
                QRMath.init();
            }
            if (n < 1)
                console.log("错误:n=" + n);
            return QRMath.LOG_TABLE[n];
        };
        QRMath.gexp = function (n) {
            if (!QRMath.isInit) {
                QRMath.init();
            }
            while (n < 0)
                n += 255;
            while (n >= 256)
                n -= 255;
            return QRMath.EXP_TABLE[n];
        };
        QRMath.init = function () {
            QRMath.isInit = true;
            for (var i = 0; i < 8; i++)
                QRMath.EXP_TABLE[i] = 1 << i;
            for (var i = 8; i < 256; i++)
                QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
            for (var i = 0; i < 255; i++)
                QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
        };
        QRMath.EXP_TABLE = new Array(256);
        QRMath.LOG_TABLE = new Array(256);
        return QRMath;
    }());
    qr.QRMath = QRMath;
    __reflect(QRMath.prototype, "qr.QRMath");
})(qr || (qr = {}));
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRMode = /** @class */ (function () {
        function QRMode() {
        }
        QRMode.MODE_NUMBER = 1;
        QRMode.MODE_ALPHA_NUM = 2;
        QRMode.MODE_8BIT_BYTE = 4;
        QRMode.MODE_KANJI = 8;
        return QRMode;
    }());
    qr.QRMode = QRMode;
    __reflect(QRMode.prototype, "qr.QRMode");
})(qr || (qr = {}));
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRPolynomial = /** @class */ (function () {
        function QRPolynomial(num, shift) {
            if (num.length == undefined)
                throw new Error(num.length + "/" + shift);
            var offset = 0;
            while (offset < num.length && num[offset] == 0)
                offset++;
            this.num = new Array(num.length - offset + shift);
            for (var i = 0; i < num.length - offset; i++)
                this.num[i] = num[i + offset];
        }
        QRPolynomial.prototype.get = function (index) {
            return this.num[index];
        };
        QRPolynomial.prototype.getLength = function () {
            return this.num.length;
        };
        QRPolynomial.prototype.multiply = function (e) {
            var num = new Array(this.getLength() + e.getLength() - 1);
            for (var i = 0; i < this.getLength(); i++)
                for (var j = 0; j < e.getLength(); j++)
                    num[i + j] ^= qr.QRMath.gexp(qr.QRMath.glog(this.get(i)) + qr.QRMath.glog(e.get(j)));
            return new QRPolynomial(num, 0);
        };
        QRPolynomial.prototype.mod = function (e) {
            if (this.getLength() - e.getLength() < 0)
                return this;
            var ratio = qr.QRMath.glog(this.get(0)) - qr.QRMath.glog(e.get(0)), num = new Array(this.getLength());
            for (var i = 0; i < this.getLength(); i++)
                num[i] = this.get(i);
            for (var i = 0; i < e.getLength(); i++)
                num[i] ^= qr.QRMath.gexp(qr.QRMath.glog(e.get(i)) + ratio);
            return (new QRPolynomial(num, 0)).mod(e);
        };
        return QRPolynomial;
    }());
    qr.QRPolynomial = QRPolynomial;
    __reflect(QRPolynomial.prototype, "qr.QRPolynomial");
})(qr || (qr = {}));
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRRSBlock = /** @class */ (function () {
        function QRRSBlock(totalCount, dataCount) {
            this.totalCount = totalCount;
            this.dataCount = dataCount;
        }
        QRRSBlock.RS_BLOCK_TABLE = [[1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9], [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16], [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13], [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9], [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12], [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15], [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14], [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15], [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13], [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16], [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13], [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15], [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12], [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13], [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12], [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16], [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15], [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15], [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14], [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16], [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17], [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13], [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16], [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17], [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16], [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17], [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16], [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16], [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16], [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16], [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16], [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16], [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16], [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17], [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16], [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16], [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16], [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16], [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16], [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]];
        QRRSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {
            var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
            if (rsBlock == undefined)
                throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
            var length = rsBlock.length / 3, list = [];
            for (var i = 0; i < length; i++) {
                var count = rsBlock[i * 3 + 0], totalCount = rsBlock[i * 3 + 1], dataCount = rsBlock[i * 3 + 2];
                for (var j = 0; j < count; j++)
                    list.push(new QRRSBlock(totalCount, dataCount));
            }
            return list;
        };
        QRRSBlock.getRsBlockTable = function (typeNumber, errorCorrectLevel) {
            switch (errorCorrectLevel) {
                case qr.QRErrorCorrectLevel.L:
                    return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
                case qr.QRErrorCorrectLevel.M:
                    return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
                case qr.QRErrorCorrectLevel.Q:
                    return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
                case qr.QRErrorCorrectLevel.H:
                    return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
                default:
                    return undefined;
            }
        };
        return QRRSBlock;
    }());
    qr.QRRSBlock = QRRSBlock;
    __reflect(QRRSBlock.prototype, "qr.QRRSBlock");
})(qr || (qr = {}));
/**
 * Created by qingzhu on 15/7/1.
 */
var qr;
(function (qr) {
    var QRUtil = /** @class */ (function () {
        function QRUtil() {
        }
        QRUtil.getBCHTypeInfo = function (data) {
            var d = data << 10;
            while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0)
                d ^= QRUtil.G15 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15);
            return (data << 10 | d) ^ QRUtil.G15_MASK;
        };
        QRUtil.getBCHTypeNumber = function (data) {
            var d = data << 12;
            while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0)
                d ^= QRUtil.G18 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18);
            return data << 12 | d;
        };
        QRUtil.getBCHDigit = function (data) {
            var digit = 0;
            while (data != 0)
                digit++, data >>>= 1;
            return digit;
        };
        QRUtil.getPatternPosition = function (typeNumber) {
            return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
        };
        QRUtil.getMask = function (maskPattern, i, j) {
            switch (maskPattern) {
                case qr.QRMaskPattern.PATTERN000:
                    return (i + j) % 2 == 0;
                case qr.QRMaskPattern.PATTERN001:
                    return i % 2 == 0;
                case qr.QRMaskPattern.PATTERN010:
                    return j % 3 == 0;
                case qr.QRMaskPattern.PATTERN011:
                    return (i + j) % 3 == 0;
                case qr.QRMaskPattern.PATTERN100:
                    return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
                case qr.QRMaskPattern.PATTERN101:
                    return i * j % 2 + i * j % 3 == 0;
                case qr.QRMaskPattern.PATTERN110:
                    return (i * j % 2 + i * j % 3) % 2 == 0;
                case qr.QRMaskPattern.PATTERN111:
                    return (i * j % 3 + (i + j) % 2) % 2 == 0;
                default:
                    throw new Error("bad maskPattern:" + maskPattern);
            }
        };
        QRUtil.getErrorCorrectPolynomial = function (errorCorrectLength) {
            var a = new qr.QRPolynomial([1], 0);
            for (var i = 0; i < errorCorrectLength; i++)
                a = a.multiply(new qr.QRPolynomial([1, qr.QRMath.gexp(i)], 0));
            return a;
        };
        QRUtil.getLengthInBits = function (mode, type) {
            if (1 <= type && type < 10)
                switch (mode) {
                    case qr.QRMode.MODE_NUMBER:
                        return 10;
                    case qr.QRMode.MODE_ALPHA_NUM:
                        return 9;
                    case qr.QRMode.MODE_8BIT_BYTE:
                        return 8;
                    case qr.QRMode.MODE_KANJI:
                        return 8;
                    default:
                        throw new Error("mode:" + mode);
                }
            else if (type < 27)
                switch (mode) {
                    case qr.QRMode.MODE_NUMBER:
                        return 12;
                    case qr.QRMode.MODE_ALPHA_NUM:
                        return 11;
                    case qr.QRMode.MODE_8BIT_BYTE:
                        return 16;
                    case qr.QRMode.MODE_KANJI:
                        return 10;
                    default:
                        throw new Error("mode:" + mode);
                }
            else {
                if (!(type < 41))
                    throw new Error("type:" + type);
                switch (mode) {
                    case qr.QRMode.MODE_NUMBER:
                        return 14;
                    case qr.QRMode.MODE_ALPHA_NUM:
                        return 13;
                    case qr.QRMode.MODE_8BIT_BYTE:
                        return 16;
                    case qr.QRMode.MODE_KANJI:
                        return 12;
                    default:
                        throw new Error("mode:" + mode);
                }
            }
        };
        QRUtil.getLostPoint = function (qrCode) {
            var moduleCount = qrCode.getModuleCount(), lostPoint = 0;
            for (var row = 0; row < moduleCount; row++)
                for (var col = 0; col < moduleCount; col++) {
                    var sameCount = 0, dark = qrCode.isDark(row, col);
                    for (var r = -1; r <= 1; r++) {
                        if (row + r < 0 || moduleCount <= row + r)
                            continue;
                        for (var c = -1; c <= 1; c++) {
                            if (col + c < 0 || moduleCount <= col + c)
                                continue;
                            if (r == 0 && c == 0)
                                continue;
                            dark == qrCode.isDark(row + r, col + c) && sameCount++;
                        }
                    }
                    sameCount > 5 && (lostPoint += 3 + sameCount - 5);
                }
            for (var row = 0; row < moduleCount - 1; row++)
                for (var col = 0; col < moduleCount - 1; col++) {
                    var count = 0;
                    qrCode.isDark(row, col) && count++, qrCode.isDark(row + 1, col) && count++, qrCode.isDark(row, col + 1) && count++, qrCode.isDark(row + 1, col + 1) && count++;
                    if (count == 0 || count == 4)
                        lostPoint += 3;
                }
            for (var row = 0; row < moduleCount; row++)
                for (var col = 0; col < moduleCount - 6; col++)
                    qrCode.isDark(row, col) && !qrCode.isDark(row, col + 1) && qrCode.isDark(row, col + 2) && qrCode.isDark(row, col + 3) && qrCode.isDark(row, col + 4) && !qrCode.isDark(row, col + 5) && qrCode.isDark(row, col + 6) && (lostPoint += 40);
            for (var col = 0; col < moduleCount; col++)
                for (var row = 0; row < moduleCount - 6; row++)
                    qrCode.isDark(row, col) && !qrCode.isDark(row + 1, col) && qrCode.isDark(row + 2, col) && qrCode.isDark(row + 3, col) && qrCode.isDark(row + 4, col) && !qrCode.isDark(row + 5, col) && qrCode.isDark(row + 6, col) && (lostPoint += 40);
            var darkCount = 0;
            for (var col = 0; col < moduleCount; col++)
                for (var row = 0; row < moduleCount; row++)
                    qrCode.isDark(row, col) && darkCount++;
            var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
            return lostPoint += ratio * 10, lostPoint;
        };
        QRUtil.prototype.static_isSupportCanvas = function () {
            return typeof CanvasRenderingContext2D != "undefined";
        };
        QRUtil._getTypeNumber = function (sText, nCorrectLevel) {
            var nType = 1;
            var length = QRUtil._getUTF8Length(sText);
            for (var i = 0, len = QRUtil.QRCodeLimitLength.length; i <= len; i++) {
                var nLimit = 0;
                switch (nCorrectLevel) {
                    case qr.QRErrorCorrectLevel.L:
                        nLimit = QRUtil.QRCodeLimitLength[i][0];
                        break;
                    case qr.QRErrorCorrectLevel.M:
                        nLimit = QRUtil.QRCodeLimitLength[i][1];
                        break;
                    case qr.QRErrorCorrectLevel.Q:
                        nLimit = QRUtil.QRCodeLimitLength[i][2];
                        break;
                    case qr.QRErrorCorrectLevel.H:
                        nLimit = QRUtil.QRCodeLimitLength[i][3];
                        break;
                }
                if (length <= nLimit) {
                    break;
                }
                else {
                    nType++;
                }
            }
            if (nType > QRUtil.QRCodeLimitLength.length) {
                throw new Error("Too long data");
            }
            return nType;
        };
        QRUtil._getUTF8Length = function (sText) {
            var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
            return replacedText.length + (replacedText.length != sText ? 3 : 0);
        };
        QRUtil.PATTERN_POSITION_TABLE = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]];
        QRUtil.G15 = 1335;
        QRUtil.G18 = 7973;
        QRUtil.G15_MASK = 21522;
        ///////////////////////////
        QRUtil.QRCodeLimitLength = [[17, 14, 11, 7], [32, 26, 20, 14], [53, 42, 32, 24], [78, 62, 46, 34], [106, 84, 60, 44], [134, 106, 74, 58], [154, 122, 86, 64], [192, 152, 108, 84], [230, 180, 130, 98], [271, 213, 151, 119], [321, 251, 177, 137], [367, 287, 203, 155], [425, 331, 241, 177], [458, 362, 258, 194], [520, 412, 292, 220], [586, 450, 322, 250], [644, 504, 364, 280], [718, 560, 394, 310], [792, 624, 442, 338], [858, 666, 482, 382], [929, 711, 509, 403], [1003, 779, 565, 439], [1091, 857, 611, 461], [1171, 911, 661, 511], [1273, 997, 715, 535], [1367, 1059, 751, 593], [1465, 1125, 805, 625], [1528, 1190, 868, 658], [1628, 1264, 908, 698], [1732, 1370, 982, 742], [1840, 1452, 1030, 790], [1952, 1538, 1112, 842], [2068, 1628, 1168, 898], [2188, 1722, 1228, 958], [2303, 1809, 1283, 983], [2431, 1911, 1351, 1051], [2563, 1989, 1423, 1093], [2699, 2099, 1499, 1139], [2809, 2213, 1579, 1219], [2953, 2331, 1663, 1273]];
        return QRUtil;
    }());
    qr.QRUtil = QRUtil;
    __reflect(QRUtil.prototype, "qr.QRUtil");
})(qr || (qr = {}));
