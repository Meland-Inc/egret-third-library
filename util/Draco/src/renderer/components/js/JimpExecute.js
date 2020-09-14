// import * as fs from "fs";
import * as jimp from "jimp";

import * as fsExc from "./FsExecute.js";
import { Global } from "./Global.js";

// export function jimpPng(cell, input_path, output_path) {
//     return new Promise(async (resolve, reject) => {
//         const element = cell;
//         let area = element.area;
//         let texture = element.texture;
//         let filePath = input_path + "/" + texture + ".png";

//         if (!(await fsExc.exists(filePath))) {
//             // console.error("文件不存在:" + filePath);
//             resolve();
//             return;
//         }

//         jimp
//             .read(filePath)
//             .then(async originImage => {
//                 let imageWidth = originImage.bitmap.width;
//                 let imageHeight = originImage.bitmap.height;
//                 let tileWidth = 120;
//                 let tileHeight = 60;
//                 let halfTileWidth = tileWidth / 2;
//                 let halfTileHeight = tileHeight / 2;
//                 let tileRow = area.length;
//                 let tileCol = area[0].length;

//                 if (area.length == 1 && area[0].length == 1) {
//                     originImage.write(output_path + "/" + texture + ".png", (error, img) => {
//                         if (!error) {
//                             resolve();
//                         } else {
//                             reject();
//                             console.error(error);
//                         }
//                     });

//                     return;
//                 }

//                 for (let rowLen = area.length, row = rowLen - 1; row >= 0; row--) {
//                     for (let colLen = area[row].length, col = colLen - 1; col >= 0; col--) {
//                         /**
//                          * type
//                          * 
//                          * 
//                          * 1: 上下都没
//                          * rowLen > 1 && colLen > 1
//                          * row != 0 && col != 0 && row !=rowLen-1 && col != colLen-1
//                          *  /\
//                          *  \/
//                          *
//                          * 2: 上有下没
//                          * rowLen > 1 && colLen > 1
//                          * row == 0 && col == 0
//                          *  ----
//                          *  |  |
//                          *   \/
//                          *
//                          * 3: 上有下没
//                          * rowLen > 1 && colLen > 1
//                          * row != 0 && col == 0
//                          *  --
//                          *  ||
//                          *  ||
//                          *  | \
//                          *   \/
//                          * 
//                          * 4: 上有下没
//                          * rowLen > 1 && colLen > 1
//                          * row == 0 && col != 0
//                          *    --
//                          *    ||
//                          *    ||
//                          *   / |
//                          *   \/
//                          * 
//                          * 5: 上没下有
//                          * rowLen > 1 && colLen > 1
//                          * row == rowLen-1 && col == colLen-1
//                          *  /\
//                          * |  |
//                          * ----
//                          * 
//                          * 6: 上没下有
//                          * rowLen > 1 && colLen > 1
//                          * row == rowLen-1 && col != 0
//                          *  /\
//                          * | /
//                          * ||
//                          * ||
//                          * --
//                          * 
//                          * 7: 上没下有
//                          * rowLen > 1 && colLen > 1
//                          * row != 0 && col == colLen-1
//                          *  /\
//                          *  \ |
//                          *   ||
//                          *   ||
//                          *   --
//                          * 
//                          * 8: 上下都有
//                          * rowLen > 1 && colLen > 1
//                          * row = rowLen-1 && col == 0
//                          * --
//                          * ||
//                          * ||
//                          * | \
//                          * | /
//                          * ||
//                          * ||
//                          * --
//                          * 
//                          * 9: 上下都有
//                          * rowLen > 1 && colLen > 1
//                          * row == 0 && col == colLen-1
//                          *   --
//                          *   ||
//                          *   ||
//                          *  / |
//                          *  \ |
//                          *   ||
//                          *   ||
//                          *   --
//                          * 
//                          * 10: 上没下有
//                          * rowLen > 1 && colLen == 1
//                          * row == 0
//                          * ----
//                          * |  |
//                          *  \ |
//                          *   ||
//                          *   ||
//                          *   --
//                          * 
//                          * 11: 上有下没
//                          * rowLen > 1 && colLen == 1
//                          * row == rowLen -1
//                          * --
//                          * ||
//                          * ||
//                          * | \
//                          * |  |
//                          * ----
//                          * 
//                          * 12: 上下都有
//                          * rowLen > 1 && colLen == 1
//                          * row != 0 && row != rowLen-1
//                          *  --
//                          *  ||
//                          *  | \
//                          **  \ |
//                          *    ||
//                          *    ||
//                          *    --
//                          * 
//                          * 13: 上没下有
//                          * rowLen == 1 && colLen > 1
//                          * col == 0
//                          * ----
//                          * |  |
//                          * | /
//                          * ||
//                          * ||
//                          * --
//                          * 
//                          * 14: 上有下没
//                          * rowLen == 1 && colLen > 1
//                          * col == colLen - 1
//                          *     --
//                          *     ||
//                          *     ||
//                          *    / |
//                          *   |  |
//                          *   ----
//                          * 
//                          * 15: 上下都有
//                          * rowLen == 1 && colLen > 1
//                          * col != 0 && col != colLen -1
//                          *     --
//                          *     ||
//                          *    / |
//                          * * | /
//                          *   ||
//                          *   ||
//                          *   --
//                          * 
//                          */
//                         let type;
//                         let startX;
//                         let endX;
//                         /** 除去格子外,图片上面所占的高度 */
//                         let topImageHigh = imageHeight - (rowLen + colLen) * halfTileHeight;
//                         /** 格子顶端离图片的高度 */
//                         let topDistance = (row + col) * halfTileHeight + topImageHigh;
//                         /** 格子底部离图片的高度 */
//                         let bottomDistance = (rowLen - 1 - row + colLen - 1 - col) * halfTileHeight;

//                         let topGridHigh = 0;    //切图后 格子顶部离图片的高度
//                         let bottomGridHigh = 0; //切图后 格子底部离图片的高度
//                         if (rowLen > 1 && colLen > 1) {
//                             if (row != 0 && col != 0 && row != rowLen - 1 && col != colLen - 1) {
//                                 type = 1;
//                                 startX = 0;
//                                 endX = 0;
//                             } else if (row == 0 && col == 0) {
//                                 type = 2;
//                                 startX = -halfTileWidth;
//                                 endX = halfTileWidth;
//                                 topGridHigh = topDistance;
//                             } else if (row != 0 && col == 0) {
//                                 type = 3;
//                                 startX = -halfTileWidth;
//                                 endX = 0;
//                                 topGridHigh = topDistance;
//                             } else if (row == 0 && col != 0) {
//                                 type = 4;
//                                 startX = 0;
//                                 endX = halfTileWidth;
//                                 topGridHigh = topDistance;
//                             } else if (row == rowLen - 1 && col == colLen - 1) {
//                                 type = 5;
//                                 startX = 0;
//                                 endX = 0;
//                                 bottomGridHigh = bottomDistance;
//                             } else if (row == rowLen - 1 && col != 0) {
//                                 type = 6;
//                                 startX = 0;
//                                 endX = 0;
//                                 bottomGridHigh = bottomDistance;
//                             } else if (row != 0 && col == colLen - 1) {
//                                 type = 7;
//                                 startX = 0;
//                                 endX = 0;
//                                 bottomGridHigh = bottomDistance;
//                             } else if (row == rowLen - 1 && col == 0) {
//                                 type = 8;
//                                 startX = -halfTileWidth;
//                                 endX = 0;
//                                 topGridHigh = topDistance;
//                                 bottomGridHigh = bottomDistance;
//                             } else if (row == 0 && col == colLen - 1) {
//                                 type = 9;
//                                 startX = 0;
//                                 endX = halfTileWidth;
//                                 topGridHigh = topDistance;
//                                 bottomGridHigh = bottomDistance;
//                             } else {
//                                 //reserve
//                             }
//                         } else if (rowLen > 1 && colLen == 1) {
//                             if (row == 0) {
//                                 type = 10;
//                                 startX = -halfTileWidth;
//                                 endX = halfTileWidth;
//                             } else if (row == rowLen - 1) {
//                                 type = 11;
//                                 startX = -halfTileWidth;
//                                 endX = 0;
//                             } else {
//                                 type = 12;
//                                 startX = -halfTileWidth;
//                                 endX = 0;
//                             }
//                             topGridHigh = topDistance;
//                             bottomGridHigh = bottomDistance;
//                         } else if (rowLen == 1 && colLen > 1) {
//                             if (col == 0) {
//                                 type = 13;
//                                 startX = -halfTileWidth;
//                                 endX = halfTileWidth;
//                             } else if (col == colLen - 1) {
//                                 type = 14;
//                                 startX = 0;
//                                 endX = halfTileWidth;
//                             } else {
//                                 type = 15;
//                                 startX = 0;
//                                 endX = halfTileWidth;
//                             }
//                             topGridHigh = topDistance;
//                             bottomGridHigh = bottomDistance;
//                         } else {
//                             //reserve
//                         }


//                         // let gridHeight = imageHeight - (tileRow + tileCol) * halfTileHeight + topDistance + bottomDistance;
//                         // let lengthY = gridHeight + tileHeight;
//                         // let originX = imageWidth - tileRow * halfTileHeight - halfTileWidth;
//                         // let originY = imageHeight - tileHeight - gridHeight;
//                         // let itemX = originX + (area.length - 1 - row - area[row].length - 1 - col) * halfTileWidth;
//                         // let itemY = originY - (area.length - 1 - row + area[row].length - 1 - col) * halfTileHeight;


//                         let itemX = (rowLen - row + col) * halfTileWidth;
//                         // let itemY = (row + col) * halfTileHeight;

//                         // let startY = topDistance - topGridHigh;
//                         // let endY = topDistance + tileHeight + bottomDistance;

//                         let gapY = 2;
//                         let startY = -gapY;
//                         let endY = topGridHigh + tileHeight + bottomDistance;
//                         let itemY = topDistance - topGridHigh;

//                         let newImage = new jimp(tileWidth, topGridHigh + tileHeight + bottomGridHigh + gapY);
//                         for (let pointY = startY; pointY <= endY; pointY++) {
//                             let pixelY = itemY + pointY;
//                             // for (let pointX = originStartX; pointX <= originEndX; pointX++) {
//                             for (let pointX = startX; pointX <= endX; pointX++) {
//                                 let pixelX = itemX + pointX;
//                                 let hex;
//                                 if (pixelX < 0 || pixelX > imageWidth || pixelY < 0 || pixelY > imageHeight) {
//                                     hex = 0;
//                                 } else {
//                                     hex = originImage.getPixelColor(pixelX, pixelY);
//                                 }

//                                 // if (row == 0 && col == 0) {
//                                 //     console.log(`pointX:${pointX}, pointY:${pointY}, hex:${hex}`);
//                                 // }
//                                 // hex = 3904926462;
//                                 newImage.setPixelColor(hex, pointX + halfTileWidth, pointY + gapY);
//                             }

//                             //上部分
//                             //上半格子
//                             if (pixelY > topDistance - gapY
//                                 && pixelY <= topDistance + halfTileHeight - gapY) {
//                                 switch (type) {
//                                     case 1:
//                                     case 5:
//                                     case 6:
//                                     case 7:
//                                         //形状为 /\
//                                         //x向两边扩张
//                                         startX -= 2;
//                                         endX = Math.abs(startX);
//                                         break;
//                                     case 3:
//                                         endX += 2;
//                                         break;
//                                     case 4:
//                                         startX -= 2;
//                                         break;
//                                     case 8:
//                                         endX += 2;
//                                         break;
//                                     case 9:
//                                         startX -= 2;
//                                         break;
//                                     case 11:
//                                         endX += 2;
//                                         break;
//                                     case 12:
//                                         endX += 2;
//                                         break;
//                                     case 14:
//                                         startX -= 2;
//                                         break;
//                                     case 15:
//                                         startX -= 2;
//                                         break;
//                                     default:
//                                         break;
//                                 }
//                             }

//                             //下部分
//                             //下半格子
//                             if (pixelY > topDistance + halfTileHeight
//                                 && pixelY <= topDistance + tileHeight) {
//                                 switch (type) {
//                                     case 1:
//                                     case 2:
//                                     case 3:
//                                     case 4:
//                                         //x向里缩进
//                                         startX += 2;
//                                         endX = Math.abs(startX);
//                                         break;
//                                     case 6:
//                                         endX -= 2;
//                                         break;
//                                     case 7:
//                                         startX += 2;
//                                         break;
//                                     case 8:
//                                         endX -= 2;
//                                         break;
//                                     case 9:
//                                         startX += 2;
//                                         break;
//                                     case 10:
//                                         startX -= 2;
//                                         break;
//                                     case 12:
//                                         startX += 2;
//                                         break;
//                                     case 13:
//                                         endX -= 2;
//                                         break;
//                                     case 15:
//                                         endX -= 2;
//                                         break;
//                                     default:
//                                         break;
//                                 }
//                             }
//                         }

//                         await newImage.write(output_path + "/" + texture + "_" + row + "_" + col + ".png");
//                     }
//                 }

//                 resolve();
//             }).catch(error => {
//                 Global.snack(`裁剪纹理错误 id:${element.id}`, error);
//                 resolve();
//             });
//     });
// }

/**
 * 
 * @param {number} type 类型 1.object表 2.varia表 3.material表
 * @param {*} cell1 
 * @param {*} input_path 
 * @param {*} output_path 
 */
export async function jimpCell(type, cell, texture, input_path, output_path) {
    for (const iterator of texture) {
        let area = cell.area;
        if (type == 2) {
            let rowCount = cell.shape[0];
            let colCount = cell.shape[1];
            area = [];
            for (let i = 0; i < rowCount; i++) {
                area[i] = [];
                for (let j = 0; j < colCount; j++) {
                    if (cell.area[i] != undefined
                        && cell.area[i][j] != undefined) {
                        area[i][j] = cell.area[i][j];
                    } else {
                        area[i][j] = cell.shape[2];
                    }
                }
            }
        }

        let texturePath = input_path + "/" + iterator + ".png";
        if (!(await fsExc.exists(texturePath))) {
            console.error(`配置错误:${cell.id} 文件不存在:${iterator}.png`);
            continue;
        }

        if (area.length == 1 && area[0].length == 1) {
            await fsExc.copyFile(texturePath, output_path);
        } else if (cell.isMultiPicture) {
            await jimpMultiPng(cell.id, iterator, input_path, output_path);
        } else {
            await jimpPng(cell.id, area, iterator, input_path, output_path);
        }
    }
}

export async function jimp2dCell(type, cell, texture, input_path, output_path) {
    for (const iterator of texture) {
        let area = cell.area;
        if (type == 2) {
            let rowCount = cell.shape[0];
            let colCount = cell.shape[1];
            area = [];
            for (let i = 0; i < rowCount; i++) {
                area[i] = [];
                for (let j = 0; j < colCount; j++) {
                    if (cell.area[i] != undefined
                        && cell.area[i][j] != undefined) {
                        area[i][j] = cell.area[i][j];
                    } else {
                        area[i][j] = cell.shape[2];
                    }
                }
            }
        }

        let texturePath = input_path + "/" + iterator + ".png";
        if (!(await fsExc.exists(texturePath))) {
            console.error(`配置错误:${cell.id} 文件不存在:${iterator}.png`);
            continue;
        }

        if (area.length == 1 && area[0].length == 1) {
            await fsExc.copyFile(texturePath, output_path);
        } else {
            await jimp2dPng(cell.id, area, iterator, input_path, output_path);
        }
    }
}

export function jimpMultiPng(id, texture, input_path, output_path) {
    return new Promise(async (resolve, reject) => {
        let filePath = input_path + "/" + texture + ".png";
        let maxWidth = 1024;
        let maxHeight = 1024;
        let imgInfo = {
            file: `${texture}.png`,
            frames: []
        };

        jimp
            .read(filePath)
            .then(async originImage => {
                let originWidth = originImage.bitmap.width;
                let originHeight = originImage.bitmap.height;
                if (originWidth <= maxWidth
                    && originHeight <= maxHeight) {
                    //没超出尺寸
                    imgInfo.frames.push({ file: `${texture}`, x: 0, y: 0, w: originWidth, h: originHeight });
                    let texturePath = `${input_path}/${texture}.png`;
                    await fsExc.copyFile(texturePath, output_path);
                } else {
                    //超出尺寸
                    let colCount = Math.ceil(originWidth / maxWidth);
                    let rowCount = Math.ceil(originHeight / maxHeight);
                    for (let i = 0; i < colCount; i++) {
                        for (let j = 0; j < rowCount; j++) {
                            let imgWidth = maxWidth;
                            let imgHeight = maxHeight;
                            let imgX = i * maxWidth;
                            let imgY = j * maxHeight;
                            let fileName = `${texture}_${i}_${j}`;
                            if (i == colCount - 1) {
                                imgWidth = originWidth - i * maxWidth;
                            }

                            if (j == rowCount - 1) {
                                imgHeight = originHeight - j * maxHeight;
                            }

                            imgInfo.frames.push({ file: fileName, x: imgX, y: imgY, w: imgWidth, h: imgHeight });

                            let newImage = new jimp(imgWidth, imgHeight);

                            for (let x = 0; x < imgWidth; x++) {
                                for (let y = 0; y < imgHeight; y++) {
                                    getSetPixel(originImage, newImage, x, y, imgX, imgY);
                                }

                            }
                            await newImage.write(`${output_path}/${fileName}.png`);
                        }
                    }
                }


                let imgStr = JSON.stringify(imgInfo);
                await fsExc.writeFile(`${output_path}/${texture}.json`, imgStr);
                resolve();
            })
            .catch(error => {
                Global.snack(`裁剪多格纹理错误 id:${id}`, error);
                resolve();
            });
    });
}

export function jimpPng(id, area, texture, input_path, output_path) {
    return new Promise(async (resolve, reject) => {
        let filePath = input_path + "/" + texture + ".png";

        jimp
            .read(filePath)
            .then(async originImage => {
                let imageWidth = originImage.bitmap.width;
                let imageHeight = originImage.bitmap.height;
                let tileWidth = 120;
                let tileHeight = 60;
                let halfTileWidth = tileWidth / 2;
                let halfTileHeight = tileHeight / 2;

                let rowLen = area.length;
                let colLen = area[0].length;
                // let gapY = 10;
                let gapY = imageHeight - (rowLen + colLen) * halfTileHeight;
                gapY = gapY < 0 ? 0 : gapY;
                gapY = Math.min(10, gapY)

                for (let row = 0; row <= rowLen - 1; row++) {
                    for (let col = 0; col <= colLen - 1; col++) {
                        let topImageHigh = imageHeight - (rowLen + colLen) * halfTileHeight;
                        let topDistance = 0;
                        let bottomDistance = 0;

                        let hasTopLeft = false;
                        let hasTopRight = false;
                        let hasBottomLeft = false;
                        let hasBottomRight = false;

                        //      ______
                        //      ||  ||
                        //      ||  ||
                        //      ||  ||
                        //      ||/\||
                        //      |/\/\|
                        //      |\/\/|
                        //      ||\/||
                        //      ￣￣￣


                        if (row == 0) {
                            //右上三角 右上方形(c)
                            topDistance = col * halfTileHeight + topImageHigh;
                            hasTopRight = true;
                        }

                        if (col == 0) {
                            //左上三角 左上方形(r)
                            topDistance = row * halfTileHeight + topImageHigh;
                            hasTopLeft = true;
                        }

                        if (row == rowLen - 1) {
                            //左下三角 左下方形(colLen-1-col)
                            bottomDistance = (colLen - 1 - col) * halfTileHeight;
                            hasBottomLeft = true;
                        }

                        if (col == colLen - 1) {
                            //右下三角 右下方形(rowLen-1-row)
                            bottomDistance = (rowLen - 1 - row) * halfTileHeight;
                            hasBottomRight = true;
                        }

                        // hasTopLeft = false;
                        // hasTopRight = false;
                        // hasBottomLeft = false;
                        // hasBottomRight = false;

                        let deviationX = -1;     //x轴偏差值
                        let deviationY = 0;     //y轴偏差值

                        let newImage = new jimp(tileWidth, topDistance + tileHeight + bottomDistance + gapY + deviationY);
                        let cutImgX = (rowLen - 1 - row + col) * halfTileWidth;             //完整图片中,当前图片所在的起点X
                        let cutImgY = topImageHigh + (row + col) * halfTileHeight;          //完整图片中,当前图片所在的起点Y

                        //所有图片都有的菱形区域
                        // _______
                        // | / \ |
                        // |/   \|
                        // |\   /|
                        // | \ / |
                        // ￣￣￣￣
                        let diamondSX = halfTileWidth + deviationX;                         //菱形开始X
                        let diamondEX = halfTileWidth;                                      //菱形结束X    
                        let diamondSY = (row + col) * halfTileHeight - gapY;                //菱形开始Y
                        // let diamondSY = (row + col) * halfTileHeight;                //菱形开始Y
                        let diamondEY = diamondSY + tileHeight + gapY + deviationY;         //菱形结束Y

                        let startX = diamondSX;                                             //当前新创建图片菱形的开始X
                        let endX = diamondEX;                                               //当前新创建图片菱形的结束X
                        let startY = diamondSY;                                             //当前新创建图片的开始Y
                        let endY = diamondEY;                                               //当前新创建图片的结束Y
                        for (let y = startY; y <= endY; y++) {
                            for (let x = startX; x <= endX; x++) {
                                getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY, topDistance, gapY);
                            }
                            if (y < halfTileHeight + startY) {
                                startX -= 2;
                                endX += 2;
                            }

                            if (y > halfTileHeight + startY) {
                                startX += 2;
                                endX -= 2;
                            }
                        }

                        //左上三角和方形
                        if (hasTopLeft) {
                            // _______
                            // |  |  |
                            // |  |  |
                            // |__|  |
                            // | / \ |
                            // |/   \|
                            // ￣￣￣￣

                            //左上三角
                            startX = diamondSX - halfTileWidth;
                            endX = diamondEX;
                            startY = diamondSY;
                            endY = diamondSY + halfTileHeight;
                            for (let y = startY; y <= endY; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY, topDistance, gapY);
                                }

                                if (y <= halfTileHeight + startY) {
                                    endX -= 2;
                                }
                            }

                            //左上方形
                            startX = diamondSX - halfTileWidth;
                            endX = diamondEX;
                            startY = -topImageHigh;
                            endY = diamondSY;
                            for (let y = startY; y <= endY; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY, topDistance, gapY);
                                }
                            }
                        }

                        //右上三角和方形
                        if (hasTopRight) {
                            // _______
                            // |  |  |
                            // |  |  |
                            // |  |__|
                            // | / \ |
                            // |/   \|
                            // ￣￣￣￣

                            //右上三角
                            startX = diamondSX;
                            endX = diamondEX + halfTileWidth;
                            startY = diamondSY;
                            endY = diamondSY + halfTileHeight;
                            for (let y = startY; y <= endY; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY, topDistance, gapY);
                                }

                                if (y <= halfTileHeight + startY) {
                                    startX += 2;
                                }
                            }

                            //右上方形
                            startX = diamondSX;
                            endX = diamondEX + halfTileWidth;
                            startY = -topImageHigh;
                            endY = diamondSY;
                            for (let y = startY; y <= endY; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY, topDistance, gapY);
                                }
                            }
                        }

                        //左下三角和方形
                        if (hasBottomLeft) {
                            // _______
                            // |\   /|
                            // | \ / |
                            // |▔|  | 
                            // |  |  |
                            // |__|__|

                            //左下三角
                            startX = diamondSX - halfTileWidth;
                            endX = diamondEX - halfTileWidth;
                            startY = diamondSY + halfTileHeight;
                            endY = diamondEY;
                            for (let y = startY; y < endY; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY, topDistance, gapY);
                                }

                                if (y <= halfTileHeight + startY) {
                                    endX += 2;
                                }
                            }

                            //左下方形
                            startX = diamondSX - halfTileWidth;
                            endX = diamondEX;
                            startY = diamondEY;
                            endY = imageHeight;
                            for (let y = startY; y <= endY; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY, topDistance, gapY);
                                }
                            }
                        }

                        //右下三角和方形
                        if (hasBottomRight) {
                            // _______
                            // |\   /|
                            // | \ / |
                            // |  |▔| 
                            // |  |  |
                            // |__|__|

                            //右下三角
                            startX = diamondSX + halfTileWidth;
                            endX = diamondEX + halfTileWidth;
                            startY = diamondSY + halfTileHeight;
                            endY = diamondEY;
                            for (let y = startY; y < endY; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY, topDistance, gapY);
                                }

                                if (y <= halfTileHeight + startY) {
                                    startX -= 2;
                                }
                            }

                            //右下方形
                            startX = diamondSX;
                            endX = diamondEX + halfTileWidth;
                            startY = diamondEY;
                            endY = imageHeight;
                            for (let y = endY + halfTileHeight; y <= imageHeight; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY, topDistance, gapY);
                                }
                            }
                        }

                        await newImage.write(output_path + "/" + texture + "_" + row + "_" + col + ".png");
                    }
                }
                resolve();
            }).catch(error => {
                Global.snack(`裁剪纹理错误 id:${id}`, error);
                resolve();
            });
    });
}

export function jimp2dPng(id, area, texture, input_path, output_path) {
    return new Promise(async (resolve, reject) => {
        let filePath = input_path + "/" + texture + ".png";

        jimp
            .read(filePath)
            .then(async originImage => {
                let imageWidth = originImage.bitmap.width;
                let imageHeight = originImage.bitmap.height;
                let tileWidth = 60;
                let tileHeight = 60;

                let rowLen = area.length;
                let colLen = area[0].length;

                for (let row = 0; row <= rowLen - 1; row++) {
                    for (let col = 0; col <= colLen - 1; col++) {
                        let topImageHigh = imageHeight - rowLen * tileHeight;
                        let topDistance = row === 0 ? 0 : topImageHigh;

                        let deviationX = 1;     //x轴偏差值
                        let deviationY = 1;     //y轴偏差值

                        let newImageHeight = row === 0 ? topImageHigh + tileHeight + deviationY : tileHeight + deviationY;
                        let newImageWidth = col === colLen - 1 ? imageWidth - (colLen - 1) * tileWidth + deviationX : tileWidth + deviationX;
                        let newImage = new jimp(newImageWidth, newImageHeight);
                        let cutImgX = col * tileWidth;             //完整图片中,当前图片所在的起点X
                        let cutImgY = topDistance + row * tileHeight;          //完整图片中,当前图片所在的起点Y

                        //      _______
                        //      |__|__|
                        //      |__|__|
                        //      |__|__|
                        for (let y = 0; y <= newImageHeight; y++) {
                            for (let x = 0; x <= newImageWidth; x++) {
                                getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY);
                            }
                        }

                        await newImage.write(output_path + "/" + texture + "_" + row + "_" + col + ".png");
                    }
                }
                resolve();
            }).catch(error => {
                Global.snack(`裁剪纹理错误 id:${id}`, error);
                resolve();
            });
    });
}

function getSetPixel(originImage, newImage, x, y, cutImgX, cutImgY, diamondSY = 0, topDistance = 0, gapY = 0, canConsole = false) {
    let imageWidth = originImage.bitmap.width;
    let imageHeight = originImage.bitmap.height;
    let hex;
    let getPixelX = cutImgX + x;
    let getPixelY = cutImgY + y - diamondSY - gapY;
    // let getPixelY = cutImgY + y;
    if (getPixelX < 0 || getPixelX > imageWidth || getPixelY < 0 || getPixelY > imageHeight) {
        hex = 0;
    } else {
        hex = originImage.getPixelColor(getPixelX, getPixelY);
    }

    let setPixelX = x;
    // let setPixelY = y + topDistance - diamondSY + gapY;
    let setPixelY = y + topDistance - diamondSY;

    if (hex != 0) {
        newImage.setPixelColor(hex, setPixelX, setPixelY);
    }

    if (canConsole) {
        // console.log(`-----------getPixelX:${getPixelX}, getPixelY:${getPixelY}`);

        // console.log(`-----------setPixelX:${setPixelX}, setPixelY:${setPixelY}`);
    }
}