package org.egret.launcher.ymblTestRuntime;

import android.content.Context;
import android.os.Build;
import android.view.WindowInsets;
import android.view.DisplayCutout;

import javax.sql.RowSetMetaData;

public class ScreenCutoutCtrl {
    public final static int DEVICE_BRAND_OPPO = 0x0001;
    public final static int DEVICE_BRAND_HUAWEI = 0x0002;
    public final static int DEVICE_BRAND_VIVO = 0x0003;

    private static int getStatusBarHeight(Context context) {
        int result = 0;
        int resourceId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {
            result = context.getResources().getDimensionPixelSize(resourceId);
        }
        return result;
    }

    private static int getCutoutHeight(WindowInsets winInsets, Context context) {
        if (winInsets == null || context == null) return 0;
        switch (NotchScreenUtil.getDeviceBrand()) {
            case DEVICE_BRAND_HUAWEI:
                if (NotchScreenUtil.hasNotchInScreenAtHuawei(context)) {
                    return NotchScreenUtil.getNotchSizeAtHuawei(context);
                }
                return 0;
            case DEVICE_BRAND_OPPO:
                if (NotchScreenUtil.hasNotchInScreenAtOppo(context)) {
                    return NotchScreenUtil.getNotchSizeAtOppo();
                }
                return 0;
            case DEVICE_BRAND_VIVO:
                if (NotchScreenUtil.hasNotchInScreenAtVivo(context)) {
                    return NotchScreenUtil.getNotchSizeAtVivo(context);
                }
                return 0;
            default:
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return 0;
                DisplayCutout cutout = winInsets.getDisplayCutout();
                if (cutout == null) return 0;
                return cutout.getSafeInsetTop();
        }
//        if(Rom.isOppo()){
//            if(NotchScreenUtil.hasNotchInScreenAtOppo(context)){
//                return NotchScreenUtil.getNotchSizeAtOppo();
//            }
//            return 0;
//        }else if(Rom.isVivo()){
//            if(NotchScreenUtil.hasNotchInScreenAtVivo(context)){
//                return NotchScreenUtil.getNotchSizeAtVivo(context);
//            }
//            return 0;
//        }else if(Rom.isMiui()){
//
//        }else if(Rom.isEmui()){
//            if(NotchScreenUtil.hasNotchInScreenAtHuawei(context)){
//                NotchScreenUtil.getNotchSizeAtHuawei(context);
//            }
//        }else if(Rom.isFlyme()){
//
//        }else if(Rom.is360()){
//
//        }else if(Rom.isSmartisan()){
//
//        }else{
//            if(Build.VERSION.SDK_INT<Build.VERSION_CODES.P) return 0;
//            DisplayCutout cutout= winInsets.getDisplayCutout();
//            if(cutout == null)return 0;
//            return cutout.getSafeInsetTop();
//        }
//        return  0;
    }
}
