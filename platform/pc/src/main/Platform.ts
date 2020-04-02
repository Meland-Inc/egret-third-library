/**
 * @author 雪糕
 * @desc 平台相关的逻辑
 * @date 2020-02-19 11:22:49
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-23 15:12:16
 */
import querystring from 'querystring';

import { logger } from './logger';
import { util } from './util';
import message from './Message';
import config from "./Config";

enum eQueryArgsField {
    'temporary_token' = 'temporary_token',
    'class_id' = 'class_id',
    'bell_origin' = 'bell_origin',
    'package_id' = 'package_id',
    'lesson_id' = 'lesson_id',
    'back_url' = 'back_url',
    'act_id' = 'act_id',
    'internet_network' = 'internet_network',
    'local_network' = 'local_network',
    'gid' = 'gid',
    'stand_alone' = 'stand_alone',
    'gameServer' = 'gameServer',
    'token' = 'token'
}

class Platform {
    private readonly _configFields = [
        eQueryArgsField.temporary_token,
        eQueryArgsField.class_id,
        eQueryArgsField.bell_origin,
        eQueryArgsField.package_id,
        eQueryArgsField.lesson_id,
        eQueryArgsField.back_url,
        eQueryArgsField.act_id,
        eQueryArgsField.stand_alone,
    ]

    private readonly _serverCnfFields = [
        eQueryArgsField.class_id,
        eQueryArgsField.lesson_id,
        eQueryArgsField.gid
    ]

    public async init() {
        let urlValue = config.urlValue;
        //伪协议启动参数
        logger.log('platform', `初始化平台数据`, urlValue);
        let argsValue = urlValue.slice(urlValue.indexOf("?") + 1);
        //解析参数
        let argsObj = querystring.parse(argsValue);

        let queryObject: querystring.ParsedUrlQuery = {};

        logger.log('platform', 'argsObj', argsObj);

        //解析参数给native用的config
        for (const field of this._configFields) {
            let value = argsObj[field];
            let strValue: string;
            if (value) {
                if (Array.isArray(value)) {
                    strValue = value[0];
                } else {
                    strValue = value as string;
                }
            }


            switch (field) {
                case eQueryArgsField.temporary_token:
                    config.setBellTempToken(strValue);
                    break;
                case eQueryArgsField.class_id:
                    config.setClassId(+strValue);
                    break;
                case eQueryArgsField.bell_origin:
                    config.setBellApiOrigin(strValue);
                    break;
                case eQueryArgsField.package_id:
                    config.setBellPackageId(strValue);
                    break;
                case eQueryArgsField.lesson_id:
                    config.setBellLessonId(strValue);
                    break;
                case eQueryArgsField.back_url:
                    config.setBellBackUrl(strValue);
                    break;
                case eQueryArgsField.act_id:
                    config.setBellActId(strValue);
                    break;
                case eQueryArgsField.stand_alone:
                    config.setStandAlone(!!strValue);
                    break;
                default:
                    break;
            }
        }

        //解析参数给本地服务器的配置
        for (const field of this._serverCnfFields) {
            let value = argsObj[field];
            let strValue: string = "";
            if (value) {
                if (Array.isArray(value)) {
                    strValue = value[0];
                } else {
                    strValue = value as string;
                }
            }

            switch (field) {
                case eQueryArgsField.class_id:
                    util.writeServerCnfValue("classId", strValue);
                    break;
                case eQueryArgsField.lesson_id:
                    util.writeServerCnfValue("lessonId", strValue);
                    break;
                case eQueryArgsField.gid:
                    util.writeServerCnfValue("gid", strValue);
                    break;
            }
        }

        //解析参数,传入给返回数据
        for (const key in argsObj) {
            let value: string;
            if (Array.isArray(argsObj[key])) {
                value = argsObj[key][0];
            } else {
                value = argsObj[key] as string;
            }

            //过滤以下几个字段
            if (key === eQueryArgsField.temporary_token
                || key === eQueryArgsField.bell_origin
                || key === eQueryArgsField.stand_alone
                || key === eQueryArgsField.gameServer) {
                continue;
            }

            //不是单人单服模式,并且有穿透服务器地址
            if (!config.standAlone && key === eQueryArgsField.internet_network) {
                queryObject[eQueryArgsField.gameServer] = `${value}`;
                continue;
            }

            //不是单人单服模式,不存在服务器地址,并且有本地服务器地址
            if (!config.standAlone && key === eQueryArgsField.local_network && !queryObject[eQueryArgsField.gameServer]) {
                queryObject[eQueryArgsField.gameServer] = `${value}`;
                continue;
            }

            if (key === eQueryArgsField.back_url) {
                queryObject[key] = encodeURIComponent(value);
                continue;
            }

            queryObject[key] = `${value}`;
        }

        logger.log('platform', 'queryObject', queryObject);

        let token = await this.login();
        queryObject[eQueryArgsField.token] = token;

        if (queryObject[eQueryArgsField.gameServer]) {
            message.sendIpcMsg('SAVE_NATIVE_GAME_SERVER', queryObject[eQueryArgsField.gameServer]);
        }

        logger.log('platform', 'queryObject', queryObject);
        return queryObject;
    }

    /** 登陆贝尔平台 */
    private login(): Promise<string> {
        let data = { temporary_token: config.bellTempToken };
        if (config.bellToken) {
            data["token"] = config.bellToken;
        }
        logger.log('net', `请求登录贝尔平台, bellApiOrigin: ${config.bellApiOrigin}, bellTempToken:${config.bellTempToken}`);
        return new Promise((resolve, reject) => {
            util.requestPostHttps(config.bellApiOrigin, null, '/common/member/login-by-temporary-token', data, null
                , (body: any) => {
                    logger.log('net', `登陆贝尔平台返回body`, body);
                    if (body.code === 200) {
                        if (body.data.token) {
                            config.setBellToken(body.data.token);
                        }
                        this.getMemberInfo(() => {
                            resolve(config.bellToken as string)
                        }, (err: any) => { reject(err) });
                        logger.log('net', `登陆贝尔平台成功, token:${config.bellToken}`);
                    } else {
                        reject(body.msg)
                        logger.error('net', `登陆贝尔平台失败`, body.msg);
                    }
                }
                , (e: any) => {
                    reject(e)
                    logger.error('net', `登陆贝尔平台失败`, e);
                }
            );
        })
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
    private getMemberInfo(successFunc: Function, errorFunc: Function) {
        let data = { token: config.bellToken };
        let headers = { "X-Bellcode-Referer": "bellplanet" }
        logger.log('net', `请求获取贝尔平台用户信息`);
        util.requestGetHttps(config.bellApiOrigin, null, '/common/member/init', data, headers
            , (body: any) => {
                if (body.code === 200) {
                    config.setUserType(+body.data.user_info.usertype);
                    config.setRealName(body.data.user_info.real_name);
                    config.setNickName(body.data.user_info.nickname);

                    util.writeServerCnfValue("userId", body.data.user_info.userid + "");
                    util.writeServerCnfValue("schoolId", body.data.user_info.school.id + "");
                    util.writeServerCnfValue("nickName", body.data.user_info.nickname + "");

                    message.sendIpcMsg('SAVE_NATIVE_LOGIN_RESPONSE', body);
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
    public teacherUploadIp() {
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
        util.requestPostHttps(config.bellApiOrigin, null, '/teacher/bellplanet-origins.put', data, null
            , (body: any) => {
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
}

let platform = new Platform();
export default platform;