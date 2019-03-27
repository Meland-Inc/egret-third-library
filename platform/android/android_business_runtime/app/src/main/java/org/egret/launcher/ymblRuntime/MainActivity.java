package org.egret.launcher.ymblRuntime;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.util.Base64;
import android.util.Log;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.egret.launcher.egret_android_launcher.NativeActivity;
import org.egret.launcher.egret_android_launcher.NativeCallback;
import org.egret.launcher.egret_android_launcher.NativeLauncher;
import org.egret.runtime.launcherInterface.INativePlayer;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends NativeActivity {
    private final String token = "c3181231f23d2218d95c0d89ca7cb4ffeb4a86c1d61e456009a3bc96ce26b04d";

    /*
    * 设置是否显示FPS面板
    *   true: 显示面板
    *   false: 隐藏面板
    * Set whether to show FPS panel
    *   true: show FPS panel
    *   false: hide FPS panel
    * */
    private final boolean showFPS = false;

    private FrameLayout rootLayout = null;
    
    private Handler handler = new Handler();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        rootLayout = (FrameLayout)findViewById(R.id.rootLayout);

        launcher.initViews(rootLayout);

        setExternalInterfaces();

        /*
        * 设置是否自动关闭启动页
        *   1: 自动关闭启动页
        *   0: 手动关闭启动页
        * Set whether to close the startup page automatically
        *   1. close the startup page automatically
        *   0. close the startup page manually
        * */
        launcher.closeLoadingViewAutomatically = 1;

        /*
        * 设置是否每次启动都重新下载游戏资源
        *   0: 版本更新才重新下载
        *   1: 每次启动都重新下载
        * Set whether to re-download game resources each time the application starts
        *   0: re-download game resources if version updated
        *   1: re-download game resources each time the application starts
        * */
        launcher.clearGameCache = 0;

        /*
        * 设置runtime代码log的等级
        *   0: Debug
        *   1: Info
        *   2: Warning
        *   3: Error
        * Set log level for runtime code
        *   0: Debug
        *   1: Info
        *   2: Warning
        *   3: Error
        * */
        launcher.logLevel = 2;

        launcher.launchPageUrl = "http://47.107.73.43/outside/business/logo.jpg";

        progressCallback = new NativeCallback() {
            @Override
            public void onCallback(String msg, int val) {
                switch (msg) {
                    case NativeLauncher.LoadingRuntime:
                        /*
                        * 下载和加载runtime
                        * Download and load runtime
                        * */
                        break;
                    case NativeLauncher.LoadingGame:
                        /*
                        * 下载和加载游戏资源
                        * Download and load game resources
                        * */
                        launcher.startRuntime(showFPS);
                        break;
                    case NativeLauncher.GameStarted:
                        /*
                        * 游戏启动
                        * Game started
                        * */
                        break;
                    case NativeLauncher.LoadRuntimeFailed:
                        /*
                        * 加载runtime和游戏信息失败
                        * Loading runtime and game resources failed
                        * */
                        break;
                    default:

                        break;
                }
            }
        };
        launcher.loadRuntime(token);
    }

       private void setExternalInterfaces() {
        launcher.setExternalInterface("sendToNative", new INativePlayer.INativeInterface() {
            @Override
            public void callback(String s) {
                Log.d("Egret Launcher", s);
                savePicture(s);
                launcher.callExternalInterface("callJS", "message from native");
            }
        });
    }
    /**保存账号密码 */
    private boolean savePicture(String base64DataStr) {
        // 1.去掉base64中的前缀
        String base64Str = base64DataStr;
        // 获取手机相册的路径地址
        String galleryPath= Environment.getExternalStorageDirectory()
                + File.separator + Environment.DIRECTORY_DCIM
                +File.separator+"Camera"+File.separator;
        //创建文件来保存，第二个参数是文件名称，可以根据自己来命名
        File file = new File(galleryPath, System.currentTimeMillis() + ".png");
        String fileName = file.toString();
        // 3. 解析保存图片
        byte[] data = Base64.decode(base64Str, Base64.DEFAULT);

        for (int i = 0; i < data.length; i++) {
            if (data[i] < 0) {
                data[i] += 256;
            }
        }
        OutputStream os = null;
        try {
            os = new FileOutputStream(fileName);
            os.write(data);
            os.flush();
            os.close();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        } finally {
            //通知相册更新
            Intent intent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
            Uri uri = Uri.fromFile(file);
            intent.setData(uri);
            Toast.makeText(getApplicationContext(), "图片已保存在相册中", Toast.LENGTH_SHORT).show();
        }
    }
}
