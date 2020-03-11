/**
 * @author 雪糕
 * @desc 平台相关的逻辑
 * @date 2020-02-19 11:22:49
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-11 23:42:18
 */
const querystring = require('querystring');
const config = require('./config.js');
const util = require('./util.js');
const logger = require('./logger.js');
const message = require('./message.js');

async function init(queryValue) {
    return new Promise((resolve, reject) => {
        let urlValue = config.urlValue;
        //伪协议启动参数
        logger.log('server', `初始化平台数据`);
        config.channel = queryValue['gameChannel'] = config.constChannelLesson;
        let argsValue = urlValue.slice(urlValue.indexOf("?") + 1);

        //解析参数
        let argsObj = querystring.parse(argsValue);
        //原始服务器地址
        // let originGameServer;
        for (const key in argsObj) {
            const value = argsObj[key];

            if (key === 'temporary_token') {
                config.bellTempToken = value;
                continue;
            }

            if (key === 'class_id') {
                queryValue[key] = `${value}`;
                config.classId = +value;
                util.writeServerCnfValue("classId", value);
                continue;
            }

            if (key === 'bell_origin') {
                config.bellApiOrigin = value;
                continue;
            }

            if (key === 'package_id') {
                config.bellPackageId = value;
                queryValue['package_id'] = `${value}`;
                continue;
            }

            if (key === 'lesson_id') {
                config.bellLessonId = value;
                queryValue['lesson_id'] = `${value}`;
                util.writeServerCnfValue("lessonId", value);
                continue;
            }

            if (key === 'back_url') {
                config.bellBackUrl = value;
                queryValue['back_url'] = `${value}`;
                continue;
            }

            if (key === 'act_id') {
                config.bellActId = value;
                queryValue['act_id'] = `${value}`;
                continue;
            }

            if (key === 'local_network') {
                queryValue['gameServer'] = `${value}`;
                continue;
            }

            //有公网地址,且不存在服务器地址的情况下,赋值
            if (key === 'internet_network' && !queryValue['gameServer']) {
                queryValue['gameServer'] = `${value}`;
                continue;
            }

            if (key === 'gid') {
                queryValue[key] = `${value}`;
                util.writeServerCnfValue("gid", value);
                continue;
            }
            queryValue[key] = `${value}`;
        }

        // if(!queryValue['gameServer'] && originGameServer){
        //     originGameServer = queryValue['gameServer'];
        // }
        login(queryValue, resolve, reject);
    });

}

/** 登陆贝尔平台 */
function login(queryValue, successFunc, errorFunc) {
    let data = { temporary_token: config.bellTempToken };
    logger.log('net', `请求登录贝尔平台`);
    util.requestPostHttp(config.bellApiOrigin, null, '/common/member/login-by-temporary-token', data, null
        , (body) => {
            logger.log('net', `登陆贝尔平台返回body`, body);
            if (body.code === 200) {
                queryValue['token'] = config.bellToken = body.data.token;
                getMemberInfo(successFunc, errorFunc);
                logger.log('net', `登陆贝尔平台成功, token:${config.bellToken}`);
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
    logger.log('net', `请求获取贝尔平台用户信息`);
    util.requestGetHttp(config.bellApiOrigin, null, '/common/member/init', data, headers
        , (body) => {
            if (body.code === 200) {
                config.userType = +body.data.user_info.usertype;
                config.realName = body.data.user_info.real_name;
                config.nickName = body.data.user_info.nickname;

                util.writeServerCnfValue("userId", body.data.user_info.userid);
                util.writeServerCnfValue("schoolId", body.data.user_info.school.id);

                message.sendMsg('SAVE_NATIVE_LOGIN_RESPONSE', body);
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
    let data = { token: config.bellToken, class_id: config.classId };

    //公网连接方式
    if (config.gameServerNatUrl && config.gameServerNatPort) {
        data['internet_network'] = `${config.gameServerNatUrl}:${config.gameServerNatPort}`;
    } else {
        data['internet_network'] = ``;
    }

    //局域网连接方式
    if (config.gameServerLocalIp && config.gameServerLocalPort) {
        data['local_network'] = `${config.gameServerLocalIp}:${config.gameServerLocalPort}`;
    } else {
        data['local_network'] = ``;
    }

    logger.log('net', `请求上报老师ip`);
    util.requestPostHttp(config.bellApiOrigin, null, '/teacher/bellplanet-origins.put', data, null
        , (body) => {
            if (body.code === 200) {
                logger.log('net', `上报老师ip成功`);
            } else {
                logger.error('net', `上报老师ip失败`);
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