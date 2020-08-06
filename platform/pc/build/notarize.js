const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
        appBundleId: 'com.bellcode.bellplanet',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: 'lanstonpeng@gmail.com',
        appleIdPassword: 'skym-fhjd-rgou-vmwh',
        ascProvider: 'NQ2JYG7N6U',
    });
}