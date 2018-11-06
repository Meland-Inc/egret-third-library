using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DragonBones;
using System.IO;

/// <summary>
/// 解析龙骨资源
/// </summary>
public class PraseDragonBonesAsset
{
    private static List<string> _processedAssetPath = new List<string>();//已经处理过的资源路径 不要重复处理

    /// <summary>
    /// 解析骨架资源
    /// </summary>
    /// <param name="absolutePath"></param>
    public static void LoadPraseArmatureAsset(string absolutePath)
    {
        if (_processedAssetPath.Contains(absolutePath))
        {
            return;
        }
        if (!File.Exists(absolutePath))
        {
            NotifyWindowMgr.Show(string.Format("加载骨架资源 路径不存在 path={0}", absolutePath));
            return;
        }
        byte[] bytes = File.ReadAllBytes(absolutePath);
        DragonBonesData dbData = UnityFactory.factory.ParseDragonBonesData(bytes);
        UnityFactory.factory.AddDragonBonesData(dbData);
        //TextAsset ta = UnityLoadUtil.LoadTextAsset(absolutePath);
        //if (ta == null)
        //{
        //    return;
        //}
        //UnityFactory.factory.LoadDragonBonesData(ta);
        _processedAssetPath.Add(absolutePath);
    }

    /// <summary>
    /// 解析图集数据
    /// </summary>
    /// <param name="jsonAbsolutePath">绝对路径 会自动去掉后缀</param>
    public static void LoadPraseTextAtlasAsset(string jsonAbsolutePath)
    {
        string noExsionPath = jsonAbsolutePath;
        int index = jsonAbsolutePath.LastIndexOf(".");
        if (index > 0)
        {
            noExsionPath = jsonAbsolutePath.Substring(0, index);
        }

        string fileName = Path.GetFileName(jsonAbsolutePath);

        if (_processedAssetPath.Contains(noExsionPath))
        {
            return;
        }

        string taPath = noExsionPath + AvatarAssetFileInfo.EXTENSION_JSON;
        TextAsset ta = UnityLoadUtil.LoadTextAsset(taPath);
        if (ta == null)
        {
            return;
        }

        Dictionary<string, object> textureJSONData = (Dictionary<string, object>)MiniJSON.Json.Deserialize(ta.text);
        UnityTextureAtlasData textureAtlasData = UnityFactory.factory.ParseTextureAtlasData(textureJSONData, null) as UnityTextureAtlasData;
        if (textureAtlasData == null)
        {
            NotifyWindowMgr.Show(string.Format("解析图集描述文件错误 path={0}", taPath));
            return;
        }
        textureAtlasData.imagePath = noExsionPath + ".png";
        Texture2D textureAtlas = UnityLoadUtil.LoadTexture2D(textureAtlasData.imagePath);
        if (textureAtlas == null)
        {
            return;
        }
        textureAtlasData._disposeEnabled = true;
        Material material = UnityFactoryHelper.GenerateMaterial("UI/Default", fileName + "_UI_Mat", textureAtlas);
        textureAtlasData.texture = material;

        _processedAssetPath.Add(noExsionPath);
    }
}
