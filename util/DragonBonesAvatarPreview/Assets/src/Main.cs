using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.UI;
using DragonBones;
using Transform = UnityEngine.Transform;
using System.Linq;

public class Main : MonoBehaviour
{
    private const string PATH_CONFIG = "config.json";
    private const string PATH_ARMATURE = "armature";
    private const string PATH_ELEMENT = "element";

    public Button BtnRefresh;
    public Transform tsmAvatarPreview;
    public OptionMono RoleOption;
    public OptionMono ArmatureOption;
    public OptionMono AnimOption;
    public Transform tsmPartOptionContainer;
    public int PartOptionSpace = 30;

    private string _resRootPath;
    private Config _curConfig;
    private List<AvatarAssetFileInfo> _allAssetFileList = new List<AvatarAssetFileInfo>();

    private List<OptionMono> _partOptionList = new List<OptionMono>();
    private UnityArmatureComponent _curArmatureCpt;
    private List<Slot> _curSlotList = new List<Slot>();
    private string _curArmatureName = "";


    // Use this for initialization
    void Start()
    {
        Init();

        BtnRefresh.onClick.AddListener(
            () =>
            {
                RefreshConfigAndFileInfo();
                RefreshView();
            });
    }

    private void Init()
    {
        _resRootPath = Application.streamingAssetsPath;
        RoleOption.OnChangeCB = OnRoleOptionChanged;
        ArmatureOption.OnChangeCB = OnAvatarOptionChanged;
        AnimOption.OnChangeCB = OnAnimOptionChanged;

        RefreshConfigAndFileInfo();
        RefreshView();
    }

    //刷新配置和文件信息
    private void RefreshConfigAndFileInfo()
    {
        //清理
        _curConfig = null;
        _allAssetFileList.Clear();

        string path = Path.Combine(_resRootPath, PATH_CONFIG);
        //读配置
        try
        {
            string strConfig = File.ReadAllText(path, Encoding.UTF8);
            _curConfig = JsonUtility.FromJson<Config>(strConfig);
        }
        catch (Exception e)
        {
            NotifyWindowMgr.Show(string.Format("配置解析出错，原因={0}", e.ToString()));
            _curConfig = null;
            return;
        }

        if (_curConfig == null)
        {
            return;
        }

        if (string.IsNullOrEmpty(_curConfig.MainArmature)
            || _curConfig.RoleNameList == null || _curConfig.RoleNameList.Count == 0
            || _curConfig.PartNameList == null || _curConfig.PartNameList.Count == 0)
        {
            NotifyWindowMgr.Show(string.Format("配置信息错误 path={0}", path));
            _curConfig = null;
            return;
        }

        //读文件
        var files = GetAllDBFileNamesFromDirName(PATH_ARMATURE);
        _allAssetFileList.AddRange(files);
        files = GetAllDBFileNamesFromDirName(PATH_ELEMENT);
        _allAssetFileList.AddRange(files);
    }

    //清理界面
    private void ClearView()
    {
        RoleOption.gameObject.SetActive(false);
        ClearAvatarOptionView();
    }

    //清理avatar换装各选项界面
    private void ClearAvatarOptionView()
    {
        ArmatureOption.gameObject.SetActive(false);
        AnimOption.gameObject.SetActive(false);
        foreach (var partOption in _partOptionList)
        {
            Destroy(partOption.gameObject);
        }
        _partOptionList.Clear();
    }

    //刷新面板
    private void RefreshView()
    {
        //清理界面
        ClearView();

        if (_curConfig == null)
        {
            return;
        }

        //角色选项
        RoleOption.gameObject.SetActive(true);
        var roleOptionStrData = _curConfig.RoleNameList.GetRange(0, _curConfig.RoleNameList.Count);
        RoleOption.ResetStrData(roleOptionStrData);

        RefreshAvatarOption();
    }

    //刷新拼装avatar的选项
    private void RefreshAvatarOption()
    {
        ClearAvatarOptionView();

        if (_curConfig == null)
        {
            return;
        }
        if (RoleOption.gameObject.activeSelf == false)
        {
            return;
        }

        string curRoleName = RoleOption.GetCurValue() as string;

        //骨架选项
        ArmatureOption.gameObject.SetActive(true);
        var roleArmatureFiles = _allAssetFileList.Where((file) => { return file.IsMainArmature && file.roleName == curRoleName; }).ToList();
        ArmatureOption.ResetFileInfoData(roleArmatureFiles);

        //部件
        for (int i = 0; i < _curConfig.PartNameList.Count; i++)
        {
            string partName = _curConfig.PartNameList[i];
            GameObject go = Instantiate<GameObject>(ArmatureOption.gameObject);
            go.transform.parent = tsmPartOptionContainer;
            go.transform.localPosition = new Vector3(0, -PartOptionSpace * i, 0);
            OptionMono mono = go.GetComponent<OptionMono>();
            var files = _allAssetFileList.Where((file) => { return file.part == partName && (file.roleName == curRoleName || file.roleName == AvatarAssetFileInfo.ROLE_NAME_GENERAL); }).ToList();
            mono.ResetFileInfoData(files);
            mono.Label.text = partName;
            mono.OnChangeCB = OnAvatarOptionChanged;
            _partOptionList.Add(mono);
        }
    }

    //选了角色
    private void OnRoleOptionChanged(OptionMono target, object value)
    {
        RefreshAvatarOption();
    }

    //选了avatar换装的选项
    private void OnAvatarOptionChanged(OptionMono target, object value)
    {
        AvatarAssetFileInfo armatrueFile = ArmatureOption.GetCurValue() as AvatarAssetFileInfo;
        if (armatrueFile == null || _curArmatureName != armatrueFile.key)
        {
            if (string.IsNullOrEmpty(_curArmatureName) == false)
            {
                _curArmatureCpt.armature.Dispose();
                GameObject.Destroy(_curArmatureCpt.gameObject);
                _curArmatureCpt = null;
                _curArmatureName = "";
                AnimOption.gameObject.SetActive(false);
            }
        }

        if (armatrueFile != null && string.IsNullOrEmpty(_curArmatureName))
        {
            loadArmature(armatrueFile);
        }

        if (_curArmatureCpt == null)
        {
            return;
        }

        //老的部件要全部脱下来
        foreach (Slot slot in _curSlotList)
        {
            slot.display = null;
        }
        _curSlotList.Clear();

        //换上新的部件
        foreach (var optionMono in _partOptionList)
        {
            var file = optionMono.GetCurValue() as AvatarAssetFileInfo;
            if (file != null)
            {
                loadElement(file);
            }
        }
    }

    //动画选项改变
    private void OnAnimOptionChanged(OptionMono target, object value)
    {
        if (string.IsNullOrEmpty(_curArmatureName))
        {
            return;
        }

        string animName = value as string;
        if (string.IsNullOrEmpty(animName))
        {
            _curArmatureCpt.animation.Stop();
        }
        else
        {
            _curArmatureCpt.animation.FadeIn(animName, 0.1f);
        }
    }

    //加载某个部件
    private void loadElement(AvatarAssetFileInfo assetFile)
    {
        if (_curArmatureCpt == null)
        {
            return;
        }

        PraseDragonBonesAsset.LoadPraseArmatureAsset(assetFile.ArmatureFilePath);
        PraseDragonBonesAsset.LoadPraseTextAtlasAsset(assetFile.TextureAtlasFilePath);
        ArmatureData armatrueData = UnityFactory.factory.GetArmatureData(_curConfig.MainArmature, assetFile.key);

        List<SlotData> elementSolts = armatrueData.sortedSlots;
        foreach (var solt in elementSolts)
        {
            if (solt.displayIndex < 0)
            {
                continue;
            }

            Slot mainSlot = _curArmatureCpt.armature.GetSlot(solt.name);
            if (mainSlot == null)
            {
                //说明是部件自己的插槽  不是和主骨架的连接插槽 不需拼接
                continue;
            }

            UnityFactory.factory.ReplaceSlotDisplayList(assetFile.key, _curConfig.MainArmature, solt.name, mainSlot);
            mainSlot.displayIndex = solt.displayIndex;
            if (_curSlotList.Contains(mainSlot) == false)
            {
                _curSlotList.Add(mainSlot);
            }
        }
    }

    //加载主骨架
    private void loadArmature(AvatarAssetFileInfo assetFile)
    {
        PraseDragonBonesAsset.LoadPraseArmatureAsset(assetFile.ArmatureFilePath);
        PraseDragonBonesAsset.LoadPraseTextAtlasAsset(assetFile.TextureAtlasFilePath);
        _curArmatureCpt = UnityFactory.factory.BuildArmatureComponent(_curConfig.MainArmature, assetFile.key);
        if (_curArmatureCpt == null)
        {
            NotifyWindowMgr.Show(string.Format("骨架加载失败，请检查 ={0}", assetFile.key));
            return;
        }
        _curArmatureName = assetFile.key;
        _curArmatureCpt.transform.parent = tsmAvatarPreview;
        _curArmatureCpt.transform.localPosition = Vector3.zero;

        var animNameList = _curArmatureCpt.animation.animationNames.GetRange(0, _curArmatureCpt.animation.animationNames.Count);
        AnimOption.gameObject.SetActive(true);
        AnimOption.ResetStrData(animNameList);
        if (animNameList.Count > 0)
        {
            AnimOption.OptionDropdown.value = 1;
        }
    }

    //获取某个文件夹下所有正确命名的DB文件
    private List<AvatarAssetFileInfo> GetAllDBFileNamesFromDirName(string dirName)
    {
        string dirPath = Path.Combine(_resRootPath, dirName);
        if (!Directory.Exists(dirPath))
        {
            Directory.CreateDirectory(dirPath);
        }

        bool isMainArmatrueDir = dirName == PATH_ARMATURE;

        List<AvatarAssetFileInfo> infos = new List<AvatarAssetFileInfo>();
        string[] fileNames = Directory.GetFiles(dirPath, "*" + AvatarAssetFileInfo.EXTENSION_DB, SearchOption.AllDirectories);
        foreach (var fileName in fileNames)
        {
            AvatarAssetFileInfo info = new AvatarAssetFileInfo();
            if (info.InitFileAbsolutePath(fileName, isMainArmatrueDir) == false)
            {
                continue;
            }

            infos.Add(info);
        }
        return infos;
    }
}
