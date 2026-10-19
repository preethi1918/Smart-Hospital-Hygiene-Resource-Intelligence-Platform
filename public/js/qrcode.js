// ==========================================================================
// SMART HOSPITAL HYGIENE & RESOURCE INTELLIGENCE PLATFORM
// Client-Side High-Precision QR Code Generator & Clinical Badge Renderer
// Generates: SVG, Canvas, PNG Data URL, and Clinical Asset Sticker Layouts
// ==========================================================================

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.HospitalQR = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {

  // Reed-Solomon & QR Code Matrix Generator
  const QRMode = { NUMBER: 1, ALPHA_NUM: 2, 8BIT_BYTE: 4 };
  const QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };

  function QR8bitByte(data) {
    this.mode = QRMode.8BIT_BYTE;
    this.data = data;
    this.parsedData = [];
    for (let i = 0, l = this.data.length; i < l; i++) {
      let byteArray = [];
      let code = this.data.charCodeAt(i);
      if (code > 0x10000) {
        byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
        byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
        byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
        byteArray[3] = 0x80 | (code & 0x3F);
      } else if (code > 0x800) {
        byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
        byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
        byteArray[2] = 0x80 | (code & 0x3F);
      } else if (code > 0x7F) {
        byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
        byteArray[1] = 0x80 | (code & 0x3F);
      } else {
        byteArray[0] = code;
      }
      this.parsedData.push(byteArray);
    }
    this.parsedData = Array.prototype.concat.apply([], this.parsedData);
  }

  QR8bitByte.prototype = {
    getLength: function () {
      return this.parsedData.length;
    },
    write: function (buffer) {
      for (let i = 0, l = this.parsedData.length; i < l; i++) {
        buffer.put(this.parsedData[i], 8);
      }
    }
  };

  function QRCodeModel(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }

  QRCodeModel.prototype = {
    addData: function (data) {
      let newData = new QR8bitByte(data);
      this.dataList.push(newData);
      this.dataCache = null;
    },
    isDark: function (row, col) {
      if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
        throw new Error(row + ',' + col);
      }
      return this.modules[row][col];
    },
    getModuleCount: function () {
      return this.moduleCount;
    },
    make: function () {
      this.makeImpl(false, this.getBestMaskPattern());
    },
    makeImpl: function (test, maskPattern) {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (let row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount);
        for (let col = 0; col < this.moduleCount; col++) {
          this.modules[row][col] = null;
        }
      }
      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(test, maskPattern);
      if (this.typeNumber >= 7) {
        this.setupTypeNumber(test);
      }
      if (this.dataCache == null) {
        this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
      }
      this.mapData(this.dataCache, maskPattern);
    },
    setupPositionProbePattern: function (row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;
          if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
              (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
              (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    },
    getBestMaskPattern: function () {
      let minLostPoint = 0;
      let pattern = 0;
      for (let i = 0; i < 8; i++) {
        this.makeImpl(true, i);
        let lostPoint = QRUtil.getLostPoint(this);
        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }
      return pattern;
    },
    setupTimingPattern: function () {
      for (let r = 8; r < this.moduleCount - 8; r++) {
        if (this.modules[r][6] != null) continue;
        this.modules[r][6] = (r % 2 == 0);
      }
      for (let c = 8; c < this.moduleCount - 8; c++) {
        if (this.modules[6][c] != null) continue;
        this.modules[6][c] = (c % 2 == 0);
      }
    },
    setupPositionAdjustPattern: function () {
      let pos = QRUtil.getPatternPosition(this.typeNumber);
      for (let i = 0; i < pos.length; i++) {
        for (let j = 0; j < pos.length; j++) {
          let row = pos[i];
          let col = pos[j];
          if (this.modules[row][col] != null) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              if (Math.abs(r) == 2 || Math.abs(c) == 2 || (r == 0 && c == 0)) {
                this.modules[row + r][col + c] = true;
              } else {
                this.modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    },
    setupTypeNumber: function (test) {
      let bits = QRUtil.getBCHTypeNumber(this.typeNumber);
      for (let i = 0; i < 18; i++) {
        let mod = (!test && ((bits >> i) & 1) == 1);
        this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
      }
      for (let i = 0; i < 18; i++) {
        let mod = (!test && ((bits >> i) & 1) == 1);
        this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    },
    setupTypeInfo: function (test, maskPattern) {
      let data = (this.errorCorrectLevel << 3) | maskPattern;
      let bits = QRUtil.getBCHTypeInfo(data);
      for (let i = 0; i < 15; i++) {
        let mod = (!test && ((bits >> i) & 1) == 1);
        if (i < 6) {
          this.modules[i][8] = mod;
        } else if (i < 8) {
          this.modules[i + 1][8] = mod;
        } else {
          this.modules[this.moduleCount - 15 + i][8] = mod;
        }
      }
      for (let i = 0; i < 15; i++) {
        let mod = (!test && ((bits >> i) & 1) == 1);
        if (i < 8) {
          this.modules[8][this.moduleCount - i - 1] = mod;
        } else if (i < 9) {
          this.modules[8][15 - i - 1 + 1] = mod;
        } else {
          this.modules[8][15 - i - 1] = mod;
        }
      }
      this.modules[this.moduleCount - 8][8] = (!test);
    },
    mapData: function (data, maskPattern) {
      let inc = -1;
      let row = this.moduleCount - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      let maskFunc = QRUtil.getMaskFunction(maskPattern);
      for (let col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col == 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (this.modules[row][col - c] == null) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
              }
              let mask = maskFunc(row, col - c);
              if (mask) dark = !dark;
              this.modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex == -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
  };

  QRCodeModel.createData = function (typeNumber, errorCorrectLevel, dataList) {
    let rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    let buffer = new QRBitBuffer();
    for (let i = 0; i < dataList.length; i++) {
      let data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }
    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error('Code length overflow. (' + buffer.getLengthInBits() + '>' + totalDataCount * 8 + ')');
    }
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }
    while (buffer.getLengthInBits() % 8 != 0) {
      buffer.putBit(false);
    }
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0xEC, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }
    return QRCodeModel.createBytes(buffer, rsBlocks);
  };

  QRCodeModel.createBytes = function (buffer, rsBlocks) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    let dcdata = new Array(rsBlocks.length);
    let ecdata = new Array(rsBlocks.length);
    for (let r = 0; r < rsBlocks.length; r++) {
      let dcCount = rsBlocks[r].dataCount;
      let ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xFF & buffer.buffer[i + offset];
      }
      offset += dcCount;
      let rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      let rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      let modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        let modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
      }
    }
    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalCodeCount += rsBlocks[i].totalCount;
    }
    let data = new Array(totalCodeCount);
    let index = 0;
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) data[index++] = dcdata[r][i];
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) data[index++] = ecdata[r][i];
      }
    }
    return data;
  };

  // Math & Polynomial Utilities
  let QRMode_NUMBER = 1, QRMode_ALPHA_NUM = 2, QRMode_8BIT_BYTE = 4;
  let QRMaskPattern = {
    PATTERN000: 0, PATTERN001: 1, PATTERN010: 2, PATTERN011: 3,
    PATTERN100: 4, PATTERN101: 5, PATTERN110: 6, PATTERN111: 7
  };

  let QRUtil = {
    PATTERN_POSITION_TABLE: [
      [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
      [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54]
    ],
    G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
    getBCHTypeInfo: function (data) {
      let d = data << 10;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
        d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
      }
      return ((data << 10) | d) ^ QRUtil.G15_MASK;
    },
    getBCHTypeNumber: function (data) {
      let d = data << 12;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
        d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18)));
      }
      return (data << 12) | d;
    },
    getBCHDigit: function (data) {
      let digit = 0;
      while (data != 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    },
    getPatternPosition: function (typeNumber) {
      return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
    },
    getMaskFunction: function (maskPattern) {
      switch (maskPattern) {
        case 0: return function (i, j) { return (i + j) % 2 == 0; };
        case 1: return function (i, j) { return i % 2 == 0; };
        case 2: return function (i, j) { return j % 3 == 0; };
        case 3: return function (i, j) { return (i + j) % 3 == 0; };
        case 4: return function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0; };
        case 5: return function (i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
        case 6: return function (i, j) { return ((i * j) % 2 + (i * j) % 3) % 2 == 0; };
        case 7: return function (i, j) { return ((i * j) % 3 + (i + j) % 2) % 2 == 0; };
        default: throw new Error('bad maskPattern:' + maskPattern);
      }
    },
    getErrorCorrectPolynomial: function (errorCorrectLength) {
      let a = new QRPolynomial([1], 0);
      for (let i = 0; i < errorCorrectLength; i++) {
        a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      }
      return a;
    },
    getLengthInBits: function (mode, type) {
      if (1 <= type && type < 10) {
        switch (mode) {
          case 1: return 10;
          case 2: return 9;
          case 4: return 8;
          default: throw new Error('mode:' + mode);
        }
      }
      return 16;
    },
    getLostPoint: function (qrCode) {
      let moduleCount = qrCode.getModuleCount();
      let lostPoint = 0;
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          let sameCount = 0;
          let dark = qrCode.isDark(row, col);
          for (let r = -1; r <= 1; r++) {
            if (row + r < 0 || moduleCount <= row + r) continue;
            for (let c = -1; c <= 1; c++) {
              if (col + c < 0 || moduleCount <= col + c || (r == 0 && c == 0)) continue;
              if (dark == qrCode.isDark(row + r, col + c)) sameCount++;
            }
          }
          if (sameCount > 5) lostPoint += (3 + sameCount - 5);
        }
      }
      return lostPoint;
    }
  };

  let QRMath = {
    glog: function (n) {
      if (n < 1) throw new Error('glog(' + n + ')');
      return QRMath.LOG_TABLE[n];
    },
    gexp: function (n) {
      while (n < 0) n += 255;
      while (n >= 256) n -= 255;
      return QRMath.EXP_TABLE[n];
    },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };
  for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
  for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

  function QRPolynomial(num, shift) {
    if (num.length == undefined) throw new Error(num.length + '/' + shift);
    let offset = 0;
    while (offset < num.length && num[offset] == 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  QRPolynomial.prototype = {
    get: function (index) { return this.num[index]; },
    getLength: function () { return this.num.length; },
    multiply: function (e) {
      let num = new Array(this.getLength() + e.getLength() - 1);
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }
      return new QRPolynomial(num, 0);
    },
    mod: function (e) {
      if (this.getLength() - e.getLength() < 0) return this;
      let ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      let num = new Array(this.getLength());
      for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (let i = 0; i < e.getLength(); i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }
      return new QRPolynomial(num, 0).mod(e);
    }
  };

  function QRRSBlock(totalCount, dataCount) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }
  QRRSBlock.RS_BLOCK_TABLE = [
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15]
  ];
  QRRSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {
    let rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
    if (rsBlock == undefined) throw new Error('bad rs block @ typeNumber:' + typeNumber + '/errorCorrectLevel:' + errorCorrectLevel);
    let length = rsBlock.length / 3;
    let list = [];
    for (let i = 0; i < length; i++) {
      let count = rsBlock[i * 3 + 0];
      let totalCount = rsBlock[i * 3 + 1];
      let dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) list.push(new QRRSBlock(totalCount, dataCount));
    }
    return list;
  };
  QRRSBlock.getRsBlockTable = function (typeNumber, errorCorrectLevel) {
    switch (errorCorrectLevel) {
      case QRErrorCorrectLevel.L: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectLevel.M: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectLevel.Q: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectLevel.H: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default: return undefined;
    }
  };

  function QRBitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  QRBitBuffer.prototype = {
    get: function (index) {
      let bufIndex = Math.floor(index / 8);
      return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1;
    },
    put: function (num, length) {
      for (let i = 0; i < length; i++) {
        this.putBit(((num >>> (length - i - 1)) & 1) == 1);
      }
    },
    getLengthInBits: function () { return this.length; },
    putBit: function (bit) {
      let bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      this.length++;
    }
  };

  // High-level Helper: Auto-fit QR Version
  function generateQRCodeModel(text) {
    let errorCorrectLevel = QRErrorCorrectLevel.M;
    for (let typeNumber = 1; typeNumber <= 10; typeNumber++) {
      try {
        let qr = new QRCodeModel(typeNumber, errorCorrectLevel);
        qr.addData(text);
        qr.make();
        return qr;
      } catch (e) {
        // Continue to next larger version
      }
    }
    let fallback = new QRCodeModel(10, QRErrorCorrectLevel.L);
    fallback.addData(text);
    fallback.make();
    return fallback;
  }

  // ==========================================================================
  // Public Hospital QR API
  // ==========================================================================
  return {
    // Generate standalone SVG markup
    generateSvg: function (text, size = 180, fgColor = '#000000', bgColor = '#ffffff') {
      let qr = generateQRCodeModel(text);
      let count = qr.getModuleCount();
      let cellSize = size / count;

      let rects = '';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${fgColor}" />`;
          }
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
        <rect width="${size}" height="${size}" fill="${bgColor}" />
        ${rects}
      </svg>`;
    },

    // Draw directly to an HTML5 Canvas
    drawToCanvas: function (text, canvas, size = 200, fgColor = '#000000', bgColor = '#ffffff') {
      if (!canvas) return;
      let qr = generateQRCodeModel(text);
      let count = qr.getModuleCount();
      canvas.width = size;
      canvas.height = size;
      let ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);

      let cellSize = size / count;
      ctx.fillStyle = fgColor;
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(Math.floor(c * cellSize), Math.floor(r * cellSize), Math.ceil(cellSize), Math.ceil(cellSize));
          }
        }
      }
    },

    // Generate high-resolution Data URL (PNG)
    toDataUrl: function (text, size = 300) {
      let canvas = document.createElement('canvas');
      this.drawToCanvas(text, canvas, size);
      return canvas.toDataURL('image/png');
    },

    // Generate Complete Hospital Clinical Badge Label (Sticker Format)
    createPrintableBadgeCanvas: function (resource, width = 600, height = 750) {
      let canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      let ctx = canvas.getContext('2d');

      // 1. Background (White high-contrast clinical sticker)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Outer Border
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#0284c7';
      ctx.strokeRect(3, 3, width - 6, height - 6);

      // 2. Top Header Bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 6, width - 12, 105);

      // Hospital Shield Icon & Title
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText('🏥 SMART HOSPITAL PLATFORM', 30, 48);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillText('CLINICAL IDENTIFICATION & TELEMETRY BADGE', 30, 80);

      // 3. Resource Category Tag Banner
      let typeColors = {
        'ROOM': '#0284c7',
        'BED': '#2563eb',
        'LINEN': '#059669',
        'EQUIPMENT': '#7c3aed',
        'WASTE_BIN': '#dc2626'
      };
      let categoryColor = typeColors[resource.resourceType] || '#0284c7';
      ctx.fillStyle = categoryColor;
      ctx.fillRect(30, 130, width - 60, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((resource.resourceType || 'RESOURCE').replace(/_/g, ' ') + ' ASSET IDENTIFIER', width / 2, 160);

      // 4. Render QR Code in Center
      let qrSize = 320;
      let qrX = (width - qrSize) / 2;
      let qrY = 195;

      // QR quiet zone box
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

      // Draw QR inside
      let tempCanvas = document.createElement('canvas');
      this.drawToCanvas(resource.qrCodeIdentifier || 'RESOURCE', tempCanvas, qrSize);
      ctx.drawImage(tempCanvas, qrX, qrY);

      // 5. Human-Readable Identifier (Large font)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(resource.qrCodeIdentifier || 'ID', width / 2, 570);

      // 6. Name / Subtitle Details
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText(resource.resourceName || '', width / 2, 608);

      // Location string
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Arial, sans-serif';
      let loc = resource.location ? '📍 ' + resource.location : '';
      ctx.fillText(loc, width / 2, 638);

      // 7. Footer Divider & Verification Security Text
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 665);
      ctx.lineTo(width - 30, 665);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Issued: ' + new Date().toISOString().split('T')[0] + ' • Auth Verified', 30, 695);
      ctx.fillText('Scan via Platform for Live Operational Status', 30, 715);

      ctx.textAlign = 'right';
      ctx.fillText('Protected Clinical Asset', width - 30, 695);
      ctx.fillText('Strictly Non-Patient Sensitive', width - 30, 715);

      return canvas;
    },

    // Trigger Browser Download for Badge
    downloadBadge: function (resource, filename) {
      let canvas = this.createPrintableBadgeCanvas(resource);
      let dataUrl = canvas.toDataURL('image/png');
      let link = document.createElement('a');
      link.download = filename || `${resource.qrCodeIdentifier || 'qr_badge'}_sticker.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
});
