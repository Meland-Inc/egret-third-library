using UnityEngine;
using System.IO;

/// <summary>
/// avatar资源文件信息
/// </summary>
public class AvatarAssetFileInfo
{
    public const string ROLE_NAME_GENERAL = "general";
    public const string EXTENSION_DB = ".dbbin";
    public const string EXTENSION_JSON = ".json";
    public string key;//没有后缀 没有白鹭后缀  general_single_weapon_handGunShoot
    public bool IsMainArmature = false;//是不是主骨架
    public string roleName;//general 代表通用
    public string assetType;//single
    public string part;//weapon
    public string simpleDes;//handGunShoot
    public string AbsolutePathNoExtension;//没有后缀 没有白鹭后缀 E:\xx\xx\general_single_weapon_handGunShoot

    /// <summary>
    /// 骨架绝对路径
    /// </summary>
    public string ArmatureFilePath
    {
        get
        {
            return AbsolutePathNoExtension + "_ske" + EXTENSION_DB;
        }
    }

    /// <summary>
    /// 图集绝对路径
    /// </summary>
    public string TextureAtlasFilePath
    {
        get
        {
            return AbsolutePathNoExtension + "_tex.json";
        }
    }

    //初始化文件完整绝对路径
    public bool InitFileAbsolutePath(string absolutePath, bool tIsMainArmature)
    {
        string filePath = Path.GetFileName(absolutePath);
        IsMainArmature = tIsMainArmature;
        int extensionIndex = absolutePath.LastIndexOf("_");
        if (extensionIndex < 0)
        {
            NotifyWindowMgr.Show(string.Format("文件后缀出错 file={0}", filePath));
            return false;
        }

        AbsolutePathNoExtension = absolutePath.Substring(0, extensionIndex);
        extensionIndex = filePath.LastIndexOf("_");
        key = filePath.Substring(0, extensionIndex);

        if (IsMainArmature)
        {
            string[] keyWords = key.Split('_');
            if (keyWords.Length != 2)
            {
                NotifyWindowMgr.Show(string.Format("骨架资源格式不对 file={0}", filePath));
                return false;
            }
            roleName = keyWords[0];
            simpleDes = keyWords[1];
            return true;
        }
        else
        {
            string[] keyWords = key.Split('_');
            if (keyWords.Length != 4)
            {
                NotifyWindowMgr.Show(string.Format("部件资源格式不对 file={0}", filePath));
                return false;
            }
            roleName = keyWords[0];
            assetType = keyWords[1];
            part = keyWords[2];
            simpleDes = keyWords[3];
            return true;
        }
    }
}
