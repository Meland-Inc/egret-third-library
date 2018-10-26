using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using System;

/// <summary>
/// 单个的选项控制脚本
/// </summary>
public class OptionMono : MonoBehaviour
{
    public Dropdown OptionDropdown;
    public Text Label;
    public Action<OptionMono, object> OnChangeCB;
    private List<string> _curStrData;
    private List<AvatarAssetFileInfo> _curFileInfoData;
    // Use this for initialization
    void Start()
    {
        OptionDropdown.onValueChanged.AddListener(OnChange);
    }

    private void OnChange(int index)
    {
        if (OnChangeCB != null)
        {
            OnChangeCB(this, GetCurValue());
        }
    }

    public void ResetStrData(List<string> strDatas)
    {
        Clear();

        _curStrData = strDatas;
        List<string> lables = strDatas.GetRange(0, strDatas.Count);//显示的直接是数据

        _curStrData.Insert(0, "");
        lables.Insert(0, "无");

        OptionDropdown.AddOptions(lables);
        OptionDropdown.value = 0;
    }

    public void ResetFileInfoData(List<AvatarAssetFileInfo> fileDatas)
    {
        Clear();

        _curFileInfoData = fileDatas;
        List<string> lables = new List<string>();
        for (int i = 0; i < fileDatas.Count; i++)
        {
            lables.Add(fileDatas[i].key);
        }

        _curFileInfoData.Insert(0, null);
        lables.Insert(0, "无");

        OptionDropdown.AddOptions(lables);
        OptionDropdown.value = 0;
    }

    private void Clear()
    {
        OptionDropdown.ClearOptions();
        _curFileInfoData = null;
        _curStrData = null;
    }

    /// <summary>
    /// 获取选项值
    /// </summary>
    /// <returns></returns>
    public object GetCurValue()
    {
        int index = OptionDropdown.value;

        if (_curStrData != null)
        {
            return _curStrData[index];
        }

        if (_curFileInfoData != null)
        {
            return _curFileInfoData[index];
        }

        return null;
    }
}
