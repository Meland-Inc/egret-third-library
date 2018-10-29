using UnityEngine.UI;
using UnityEngine;
using DG.Tweening;

//单个Toast
public class ToastMono : MonoBehaviour
{
    public Text txtContent;

    public void Show(string content, float time)
    {
        txtContent.text = content;
        Vector3 oldPos = transform.localPosition;
        transform.localPosition -= new Vector3(0, 100, 0);
        transform.DOMoveY(oldPos.y, time);

        Destroy(gameObject, time);
    }
}
