/** 
 * @Author 雪糕
 * @Description 平台相关的逻辑
 * @Date 2020-02-19 11:22:49
 * @FilePath \pc\src\main\Platform.ts
 */
import querystring from 'querystring';
import http from 'http';

import MsgId from '../common/MsgId';

import { logger } from './logger';
import { util } from './util';
import message from './Message';
import mainModel from "./MainModel";
import { CommonDefine } from '../common/CommonDefine';

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

/** 获取临时token返回数据结构 */
interface IRspTemporaryToken {
    code: number,
    data: {
        token: string
    },
    msg: string
}

interface IRspMemberInfo {
    code: number,
    data: {
        user_info: {
            usertype: CommonDefine.eUserType,
            real_name: string,
            nickname: string,
            userid: number,
            school: {
                id: number
            }
        }
    },
    msg: string
}

class Platform {
    private readonly _configFields: string[] = [
        eQueryArgsField.temporary_token,
        eQueryArgsField.class_id,
        eQueryArgsField.bell_origin,
        eQueryArgsField.package_id,
        eQueryArgsField.lesson_id,
        eQueryArgsField.back_url,
        eQueryArgsField.act_id,
        eQueryArgsField.stand_alone,
    ]

    private readonly _serverCnfFields: string[] = [
        eQueryArgsField.class_id,
        eQueryArgsField.lesson_id,
        eQueryArgsField.gid
    ]

    public async init(): Promise<querystring.ParsedUrlQuery> {
        const urlValue = mainModel.urlValue;
        //伪协议启动参数
        logger.log('platform', `初始化平台数据`, urlValue);
        const argsValue = urlValue.slice(urlValue.indexOf("?") + 1);
        //解析参数
        const argsObj = querystring.parse(argsValue);

        const queryObject: querystring.ParsedUrlQuery = {};

        logger.log('platform', 'argsObj', argsObj);

        //解析参数给native用的config
        for (const field of this._configFields) {
            const value = argsObj[field];
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
                    mainModel.setBellTempToken(strValue);
                    break;
                case eQueryArgsField.class_id:
                    mainModel.setClassId(+strValue);
                    break;
                case eQueryArgsField.bell_origin:
                    mainModel.setBellApiOrigin(strValue);
                    break;
                case eQueryArgsField.package_id:
                    mainModel.setBellPackageId(strValue);
                    break;
                case eQueryArgsField.lesson_id:
                    mainModel.setBellLessonId(strValue);
                    break;
                case eQueryArgsField.back_url:
                    mainModel.setBellBackUrl(strValue);
                    break;
                case eQueryArgsField.act_id:
                    mainModel.setBellActId(strValue);
                    break;
                case eQueryArgsField.stand_alone:
                    mainModel.setStandAlone(!!strValue);
                    break;
                default:
                    break;
            }
        }

        //解析参数给本地服务器的配置
        for (const field of this._serverCnfFields) {
            const value = argsObj[field];
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
                default:
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
            if (!mainModel.standAlone && key === eQueryArgsField.internet_network) {
                queryObject[eQueryArgsField.gameServer] = `${value}`;
                continue;
            }

            //不是单人单服模式,不存在服务器地址,并且有本地服务器地址
            if (!mainModel.standAlone && key === eQueryArgsField.local_network && !queryObject[eQueryArgsField.gameServer]) {
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

        const token = await this.login();
        queryObject[eQueryArgsField.token] = token;

        if (queryObject[eQueryArgsField.gameServer]) {
            message.sendIpcMsg(MsgId.SAVE_NATIVE_GAME_SERVER, queryObject[eQueryArgsField.gameServer]);
        }

        logger.log('platform', 'queryObject', queryObject);
        return queryObject;
    }

    /** 登陆贝尔平台 */
    private login(): Promise<string> {
        const data = { temporary_token: mainModel.bellTempToken };
        if (mainModel.bellToken) {
            data["token"] = mainModel.bellToken;
        }
        logger.log('net', `请求登录贝尔平台, bellApiOrigin: ${mainModel.bellApiOrigin}, bellTempToken:${mainModel.bellTempToken}`);
        return new Promise((tResolve: (tValue: string) => void, tReject: (tValue: unknown) => void) => {
            util.requestPostHttps(mainModel.bellApiOrigin, null, '/common/member/login-by-temporary-token', data, null
                , (tBody: IRspTemporaryToken, tResponse: http.IncomingMessage) => {
                    logger.log('net', `登陆贝尔平台返回body`, tBody);
                    message.sendIpcMsg(MsgId.SAVE_NATIVE_HEADER_SET_COOKIE, tResponse.headers["set-cookie"]);

                    if (tBody.code === 200) {
                        if ((tBody.data).token) {
                            mainModel.setBellToken(tBody.data.token);
                        }
                        this.getMemberInfo(() => {
                            tResolve(mainModel.bellToken as string);
                        }, (tErr: unknown) => { tReject(tErr); });
                        logger.log('net', `登陆贝尔平台成功, token:${mainModel.bellToken}`);
                    } else {
                        tReject(tBody.msg);
                        logger.error('net', `登陆贝尔平台失败`, tBody.msg);
                    }
                }
                , (tError: unknown) => {
                    tReject(tError);
                    logger.error('net', `登陆贝尔平台失败`, tError);
                }
            );
        });
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
    private getMemberInfo(tSuccessFunc: () => void, tErrorFunc: (...tParam: unknown[]) => void): void {
        const data = { token: mainModel.bellToken };
        const headers = { "X-Bellcode-Referer": "bellplanet" };
        logger.log('net', `请求获取贝尔平台用户信息`);
        util.requestGetHttps(mainModel.bellApiOrigin, null, '/common/member/init', data, headers
            , (tBody: IRspMemberInfo) => {
                if (tBody.code === 200) {
                    mainModel.setUserType(+tBody.data.user_info.usertype);
                    mainModel.setRealName(tBody.data.user_info.real_name);
                    mainModel.setNickName(tBody.data.user_info.nickname);

                    util.writeServerCnfValue("userId", tBody.data.user_info.userid + "");
                    util.writeServerCnfValue("schoolId", tBody.data.user_info.school.id + "");
                    util.writeServerCnfValue("nickName", tBody.data.user_info.nickname + "");

                    message.sendIpcMsg(MsgId.SAVE_NATIVE_LOGIN_RESPONSE, tBody);
                    logger.log('net', `获取贝尔平台用户信息成功`);
                    tSuccessFunc();
                } else {
                    tErrorFunc();
                    logger.error('net', `获取贝尔平台用户信息失败`, tBody.msg);
                }
            }
            , () => {
                tErrorFunc();
                logger.error('net', `获取贝尔平台用户信息失败`);
            }
        );
    }

    /** 老师上报ip */
    public teacherUploadIp(): void {
        const data = { token: mainModel.bellToken, class_id: mainModel.classId };

        //公网连接方式
        if (mainModel.gameServerNatUrl && mainModel.gameServerNatPort) {
            data['internet_network'] = `${mainModel.gameServerNatUrl}:${mainModel.gameServerNatPort}`;
        } else {
            data['internet_network'] = ``;
        }

        //局域网连接方式
        if (mainModel.gameServerLocalIp && mainModel.gameServerLocalPort) {
            data['local_network'] = `${mainModel.gameServerLocalIp}:${mainModel.gameServerLocalPort}`;
        } else {
            data['local_network'] = ``;
        }

        logger.log('net', `请求上报老师ip`);
        util.requestPostHttps(mainModel.bellApiOrigin, null, '/teacher/bellplanet-origins.put', data, null
            , (tBody: { code: number }) => {
                if (tBody.code === 200) {
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

const platform = new Platform();
export default platform;