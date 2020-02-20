/**
 * @author 雪糕
 * @desc 平台相关的逻辑
 * @date 2020-02-19 11:22:49
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-20 10:55:59
 */
const process = require('process');
const querystring = require('querystring');
const config = require('./config.js');
const util = require('./util.js');
const logger = require('./logger.js');

function init(queryValue) {
    //添加伪协议启动参数
    let urlValue = process.argv[process.argv.length - 1];
    let protocolName = "bellplanet://"
    //平台进入游戏
    if (urlValue.indexOf(protocolName) != -1) {
        config.channel = config.constChannelLesson;
        let argsValue = urlValue.slice(urlValue.indexOf("?") + 1);

        //解析参数
        let argsObj = querystring.parse(argsValue);
        for (const key in argsObj) {
            const value = argsObj[key];

            if (key === 'temporary_token') {
                config.bellTempToken = value;
                continue;
            }

            if (key === 'class_id') {
                queryValue[key] = `${value}`;
                continue;
            }

            if (key === 'bell_origin') {
                queryValue['bellApiOrigin'] = `${value}`;
                config.bellApiOrigin = value;
                continue;
            }

            queryValue[key] = `${value}`;
        }
        login();
    }

    return queryValue;
}

/** 登陆贝尔平台 */
function login() {
    let data = { temporary_token: config.bellTempToken };
    util.requstPostHttp(config.bellApiOrigin, null, '/common/member/login-by-temporary-token', data
        , (body) => {
            let bodyObj = JSON.parse(body);
            config.bellToken = bodyObj.token;
            getMemberInfo();
            logger.log('net', `登陆贝尔平台成功`);
        }
        , () => {
            logger.error('net', `登陆贝尔平台失败`);
        }
    );
}

/** 获取用户信息 */
function getMemberInfo() {
    util.requestGetHttp(config.bellApiOrigin, null, '/common/member/init', null
        , (body) => {
            let bodyObj = JSON.parse(body);
            config.userType = bodyObj.user_info.usertype;
            config.realName = bodyObj.user_info.real_name;
            config.nickName = bodyObj.user_info.nickname;
            logger.log('net', `获取贝尔平台用户信息成功`, body);
        }
        , () => {
            logger.error('net', `获取贝尔平台用户信息失败`);
        }
    );
}

/** 老师上报ip */
function teacherUploadIp() {
    let data = { local_network: `${config.gameServerIp}:${config.gameServerPort}` };
    util.requestGetHttp(config.bellApiOrigin, null, '/teacher/bellplanet-origins.put', data
        , (body) => {
            logger.log('net', `上报老师ip成功`);
        }
        , () => {
            logger.error('net', `上报老师ip失败`);
        }
    );
}

// function test() {
//     let data = { testData: "ddd" };
//     util.requestGetHttp(config.localIp, config.nativeServerPort, '/test', data
//         , (body) => {
//             logger.log('net', `测试成功`, body);
//         }
//         , () => {
//             logger.error('net', `测试失败`);
//         }
//     );
// }

exports.init = init;
exports.login = login;
exports.getMemberInfo = getMemberInfo;
exports.teacherUploadIp = teacherUploadIp;

// exports.test = test;