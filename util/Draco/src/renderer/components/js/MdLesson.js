var policyNum;
export function getPolicyNum() { return policyNum; }
export function setPolicyNum(value) { policyNum = value; }

export function applyPolicyNum() {
    return new Promise((resolve, reject) => {
        if (!policyNum) {
            Global.snack(`请先设置策略版本`);
            resolve();
            return;
        }

        if (channel === 'bian_lesson') {
            let lessonUrl = "http://api.bellplanet.bellcode.com";
            let parseUrl = url.parse(lessonUrl);
            let getLessonData = `?policy_version=${policyNum}&description="aaa"`
            let lessonOptions = {
                host: parseUrl.hostname, // 请求地址 域名，google.com等..
                // port: 80,
                path: '/bell-planet.change-policy-version' + getLessonData, // 具体路径eg:/upload
                method: 'GET', // 请求方式
                headers: { // 必选信息,  可以抓包工看一下
                    'Authorization': 'Basic YmVsbGNvZGU6ZDNuSDh5ZERESw=='
                }
            };
            http.get(lessonOptions, (response) => {
                let resData = "";
                response.on("data", (data) => {
                    resData += data;
                });
                response.on("end", async () => {
                    console.log(resData);
                    resolve();
                });
                response.on("error", async (err) => {
                    Global.snack(`应用平台版本号错误`, err);
                    reject();
                });
            });
        }
    });
}