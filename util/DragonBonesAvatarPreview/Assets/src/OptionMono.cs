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

    //设置显示内容 找不到就不管
    public void SetShowContent(string content)
    {
        if (string.IsNullOrEmpty(content))
        {
            OptionDropdown.value = 0;
            OnChange(OptionDropdown.value);
            return;
        }

        int index = -1;

        if (_curStrData != null)
        {
            index = _curStrData.FindIndex((o) => o == content);
        }
        else if (_curFileInfoData != null)
        {
            index = _curFileInfoData.FindIndex((o) => o != null && o.key == content);
        }

        if (index >= 0)
        {
            OptionDropdown.value = index; //0下标是空的
        }
        else
        {
            OptionDropdown.value = 0;
        }

        //发现有时候 设置value后不会触发OnChange  可能是没初始化 这了手动调用
        OnChange(OptionDropdown.value);
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
        // OptionDropdown.value = 0;
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
        // OptionDropdown.value = 0;
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
