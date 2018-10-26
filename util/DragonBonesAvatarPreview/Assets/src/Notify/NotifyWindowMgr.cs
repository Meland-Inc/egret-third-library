using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

public class NotifyWindowMgr : MonoBehaviour
{
    public Transform tsmMask;
    public Text txtContent;
    public Button btnClose;
    private static NotifyWindowMgr _instance;
    private static Queue<string> infos = new Queue<string>();//消息队列

    private static NotifyWindowMgr instance
    {
        get
        {
            if (!_instance)
            {
                GameObject uiRoot = GameObject.Find("/UIRoot");

                Object prefab = Resources.Load("WinNotify") as GameObject;
                GameObject go = GameObject.Instantiate(prefab) as GameObject;
                go.SetActive(false);
                _instance = go.GetComponent<NotifyWindowMgr>();
                go.transform.parent = uiRoot.transform;
                go.transform.localPosition = Vector3.zero;
            }
            return _instance;
        }
    }

    void Start()
    {
        btnClose.onClick.AddListener(OnClickClose);
        tsmMask.localScale = new Vector3(Screen.currentResolution.width, Screen.currentResolution.height, 0);
    }

    private void OnClickClose()
    {
        if (infos.Count > 0)
        {
            showView(infos.Dequeue());
        }
        else
        {
            HideView();
        }
    }

    private void showView(string info)
    {
        if (!instance.gameObject.activeSelf)
        {
            gameObject.SetActive(true);
        }
        else
        {
            //重新播下动画
            gameObject.SetActive(false);
            gameObject.SetActive(true);
        }

        txtContent.text = info;
    }

    private void HideView()
    {
        gameObject.SetActive(false);
    }

    public static void Show(string content, bool error = false)
    {
        if (string.IsNullOrEmpty(content))
        {
            return;
        }
        infos.Enqueue(content);
        if (!instance.gameObject.activeSelf)
        {
            instance.showView(infos.Dequeue());
        }
        // Debug.LogError(content);
        //GameObject go = Instantiate(prefabToast.gameObject);
        //go.transform.parent = root;
        //go.transform.localPosition = Vector3.zero;

        //ToastMono mono = go.GetComponent<ToastMono>();
        //mono.Show(content, time);
    }
}
