using UnityEngine;
using System.IO;
using System;

/// <summary>
/// unity用来加载资源工具
/// </summary>
public class UnityLoadUtil
{
    /// <summary>
    /// 加载一个文本资源
    /// </summary>
    /// <param name="absolutePath">绝对路径</param>
    /// <returns></returns>
    public static TextAsset LoadTextAsset(string absolutePath)
    {
        if (!File.Exists(absolutePath))
        {
            NotifyWindowMgr.Show(string.Format("加载文本资源 路径不存在 path={0}", absolutePath));
            return null; ;
        }

        try
        {
            string str = File.ReadAllText(absolutePath);
            TextAsset ta = new TextAsset(str);
            return ta;
        }
        catch (Exception e)
        {
            NotifyWindowMgr.Show(string.Format("加载文本资源出错 path={0}\nerror={1}", absolutePath, e.ToString()));
            return null;
        }
    }

    /// <summary>
    /// 加载一个贴图资源
    /// </summary>
    /// <param name="absolutePath">绝对路径</param>
    /// <returns></returns>
    public static Texture2D LoadTexture2D(string absolutePath)
    {
        if (!File.Exists(absolutePath))
        {
            NotifyWindowMgr.Show(string.Format("加载贴图 路径不存在 path={0}", absolutePath));
            return null; ;
        }

        try
        {
            Texture2D t2D = new Texture2D(1, 1);
            byte[] bytes = File.ReadAllBytes(absolutePath);
            t2D.LoadImage(bytes);
            return t2D;
        }
        catch (Exception e)
        {
            NotifyWindowMgr.Show(string.Format("加载贴图 path={0}\nerror={1}", absolutePath, e.ToString()));
            return null;
        }
    }
}
