package org.egret.launcher.ymblTestRuntime;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.util.Log;
import android.util.TypedValue;
import android.view.DisplayCutout;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;

import java.lang.reflect.Method;

public final class NotchScreenUtil {

    /**
     * 华为start
     */
    // 判断是否是华为刘海屏
    public static boolean hasNotchInScreenAtHuawei(Context context) {
        boolean ret = false;
        try {
            ClassLoader cl = context.getClassLoader();
            Class<?> HwNotchSizeUtil = cl.loadClass("com.huawei.android.util.HwNotchSizeUtil");
            Method get = HwNotchSizeUtil.getMethod("hasNotchInScreen");
            ret = (Boolean) get.invoke(HwNotchSizeUtil);
            Log.d("NotchScreenUtil", "this Huawei device has notch in screen？"+ret);
        } catch (ClassNotFoundException e) {
            Log.e("NotchScreenUtil", "hasNotchInScreen ClassNotFoundException", e);
        } catch (NoSuchMethodException e) {
            Log.e("NotchScreenUtil", "hasNotchInScreen NoSuchMethodException", e);
        } catch (Exception e) {
            Log.e("NotchScreenUtil", "hasNotchInScreen Exception", e);
        }
        return ret;
    }

    /**
     * 获取华为刘海的高
     * @param context
     * @return
     */
    public static int getNotchSizeAtHuawei(Context context) {
        int[] ret = new int[] { 0, 0 };
        try {
            ClassLoader cl = context.getClassLoader();
            Class<?> HwNotchSizeUtil = cl.loadClass("com.huawei.android.util.HwNotchSizeUtil");
            Method get = HwNotchSizeUtil.getMethod("getNotchSize");
            ret = (int[]) get.invoke(HwNotchSizeUtil);

        } catch (ClassNotFoundException e) {
            Log.e("NotchScreenUtil", "getNotchSize ClassNotFoundException");
        } catch (NoSuchMethodException e) {
            Log.e("NotchScreenUtil", "getNotchSize NoSuchMethodException");
        } catch (Exception e) {
            Log.e("NotchScreenUtil", "getNotchSize Exception");
        }
        return ret[1];
    }

    /**
     * 华为end
     */

    /**
     * Oppo start
     */
    public static boolean hasNotchInScreenAtOppo(Context context) {
        boolean hasNotch = context.getPackageManager().hasSystemFeature("com.oppo.feature.screen.heteromorphism");
        Log.d("NotchScreenUtil", "this OPPO device has notch in screen？"+hasNotch);
        return hasNotch;
    }

    public static int getNotchSizeAtOppo() {
        return 80;
    }

    /**
     * Oppo end
     */

    /**
     * vivo start
     */
    public static final int NOTCH_IN_SCREEN_VOIO = 0x00000020;// 是否有凹槽
    public static final int ROUNDED_IN_SCREEN_VOIO = 0x00000008;// 是否有圆角

    public static boolean hasNotchInScreenAtVivo(Context context) {
        boolean ret = false;
        try {
            ClassLoader cl = context.getClassLoader();
            Class<?> FtFeature = cl.loadClass("com.util.FtFeature");
            Method get = FtFeature.getMethod("isFeatureSupport", int.class);
            ret = (Boolean) get.invoke(FtFeature, NOTCH_IN_SCREEN_VOIO);
            Log.d("NotchScreenUtil", "this VIVO device has notch in screen？" + ret);
        } catch (ClassNotFoundException e) {
            Log.e("NotchScreenUtil", "hasNotchInScreen ClassNotFoundException", e);
        } catch (NoSuchMethodException e) {
            Log.e("NotchScreenUtil", "hasNotchInScreen NoSuchMethodException", e);
        } catch (Exception e) {
            Log.e("NotchScreenUtil", "hasNotchInScreen Exception", e);
        }
        return ret;
    }

    public static int getNotchSizeAtVivo(Context context){
        return dp2px(context, 32);
    }

    /**
     * vivo end
     */


    /**
     * dp转px
     * @param context
     * @param dpValue
     * @return
     */
    private static int dp2px(Context context, int dpValue) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dpValue,context.getResources().getDisplayMetrics());
    }

    /**
     * 获取手机厂商
     *
     * @return  手机厂商
     */

    public final static int DEVICE_BRAND_OPPO = 0x0001;
    public final static int DEVICE_BRAND_HUAWEI = 0x0002;
    public final static int DEVICE_BRAND_VIVO = 0x0003;


    @SuppressLint("DefaultLocale")
    public static int getDeviceBrand() {
        String brand = android.os.Build.BRAND.trim().toUpperCase();
        if (brand.contains("HUAWEI")) {
            Log.d("device brand", "HUAWEI");
            return DEVICE_BRAND_HUAWEI;
        }else if (brand.contains("OPPO")) {
            Log.d("device brand", "OPPO");
            return DEVICE_BRAND_OPPO;
        }else if (brand.contains("VIVO")) {
            Log.d("device brand", "VIVO");
            return DEVICE_BRAND_VIVO;
        }
        return 0;
    }

    public static int getCutoutHeight(WindowInsets winInsets, Context context) {
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

    public static void showFullScreen(Activity mAc){
        mAc.requestWindowFeature(Window.FEATURE_NO_TITLE);
        WindowManager.LayoutParams lp = mAc.getWindow().getAttributes();
        lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        mAc.getWindow().setAttributes(lp);
        View decorView = mAc.getWindow().getDecorView();
        int systemUiVisibility = decorView.getSystemUiVisibility();
        int flags = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN;
        systemUiVisibility |= flags;
        mAc.getWindow().getDecorView().setSystemUiVisibility(systemUiVisibility);
    }

}