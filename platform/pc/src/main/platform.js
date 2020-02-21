/**
 * @author 雪糕
 * @desc 平台相关的逻辑
 * @date 2020-02-19 11:22:49
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-22 04:23:00
 */
const querystring = require('querystring');
const config = require('./config.js');
const util = require('./util.js');
const logger = require('./logger.js');

async function init(queryValue) {
    return new Promise((resolve, reject) => {
        let urlValue = config.urlValue;
        //伪协议启动参数
        logger.log('net', `平台打开native程序`)
        config.channel = queryValue['gameChannel'] = config.constChannelLesson;
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
                config.classId = +value;
                continue;
            }

            if (key === 'bell_origin') {
                queryValue['bellApiOrigin'] = `${value}`;
                config.bellApiOrigin = value;
                continue;
            }

            queryValue[key] = `${value}`;
        }
        login(resolve, reject);
    });

}

/** 登陆贝尔平台 */
function login(successFunc, errorFunc) {
    let data = { temporary_token: config.bellTempToken };
    util.requestPostHttp(config.bellApiOrigin, null, '/common/member/login-by-temporary-token', data, null
        , (body) => {
            if (body.code === 200) {
                config.bellToken = body.data.token;
                getMemberInfo(successFunc, errorFunc);
                logger.log('net', `登陆贝尔平台成功`);
            } else {
                errorFunc();
                logger.error('net', `登陆贝尔平台失败`, body.msg);
            }
        }
        , () => {
            errorFunc();
            logger.error('net', `登陆贝尔平台失败`);
        }
    );
}

/* let memberInfo = `{
    "user_info": {
        "hash_id": "AWRl2okDEQ",
        "userid": 364021,
        "username": "wx523532",
        "real_name": "wx523532",
        "usertype": "1",
        "avator": "https:\/\/thirdwx.qlogo.cn\/mmopen\/DZ05nsLmIvm1Box6FqiaWeNDgLib0V3n1jLtkicNYs2u5bicnC5PDRVoQz1z0JWwXeMppfPhQJFUCQClNwPsGsYcB9p1MM52eoQib\/132",
        "nickname": "Albert",
        "gold_num": 80,
        "code_num": 40,
        "conch_num": 0,
        "sex": 1,
        "age": 0,
        "is_incharge_teacher": 0,
        "is_registration_finished": false,
        "school": {
            "id": 6,
            "name": "\u6d4b\u8bd5\u5b66\u6821",
            "school_type": 1,
            "cooperation_type": "makcoo_joined",
            "hash_id": "JMzR3lqrYk"
        },
        "phone": "",
        "is_offline_business_user": 0,
        "unlocked_level": 0,
        "current_level": 0,
        "is_certified_teacher": 0,
        "is_wx_site_connected": false,
        "is_wx_official_connected": true
    },
    "sys_info": { "lan": "cn" }
}` */
/** 获取用户信息 */
function getMemberInfo(successFunc, errorFunc) {
    let data = { token: config.bellToken };
    let headers = { "X-Bellcode-Referer": "bellplanet" }
    util.requestGetHttp(config.bellApiOrigin, null, '/common/member/init', data, headers
        , (body) => {
            if (body.code === 200) {
                config.userType = +body.data.user_info.usertype;
                config.realName = body.data.user_info.real_name;
                config.nickName = body.data.user_info.nickname;

                util.setGlobalConfigValue('nativeLoginResponse', body);
                logger.log('net', `获取贝尔平台用户信息成功`);
                successFunc();
            } else {
                errorFunc();
                logger.error('net', `获取贝尔平台用户信息失败`, body.msg);
            }
        }
        , () => {
            errorFunc();
            logger.error('net', `获取贝尔平台用户信息失败`);
        }
    );
}

/** 老师上报ip */
function teacherUploadIp() {
    let data = { token: config.bellToken, class_id: config.classId, local_network: `${config.gameServerIp}:${config.gameServerPort}` };
    util.requestPostHttp(config.bellApiOrigin, null, '/teacher/bellplanet-origins.put', data, null
        , (body) => {
            if (body.code === 200) {
                logger.log('net', `上报老师ip成功`);
            } else {
                logger.error('net', `上报老师ip失败`, body.msg);
            }
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
exports.teacherUploadIp = teacherUploadIp;

// exports.test = test;