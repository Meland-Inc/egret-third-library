//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

class Main extends eui.UILayer {


  protected createChildren(): void {
    super.createChildren();

    egret.lifecycle.addLifecycleListener((context) => {
      // custom lifecycle plugin
    });

    egret.lifecycle.onPause = () => {
      egret.ticker.pause();
    };

    egret.lifecycle.onResume = () => {
      egret.ticker.resume();
    };

    //inject the custom material parser
    //?????????????????????????????????
    let assetAdapter = new AssetAdapter();
    egret.registerImplementation("eui.IAssetAdapter", assetAdapter);
    egret.registerImplementation("eui.IThemeAdapter", new ThemeAdapter());


    this.runGame().catch(e => {
      console.log(e);
    })
  }

  private async runGame() {
    await this.loadResource();
    this.createGameScene();
    const result = await RES.getResAsync("description_json")
    this.startAnimation(result);
    await platform.login();
    const userInfo = await platform.getUserInfo();
    console.log(userInfo);

  }

  private async loadResource() {
    try {
      const loadingView = new LoadingUI();
      this.stage.addChild(loadingView);
      await RES.loadConfig("resource/default.res.json", "resource/");
      await this.loadTheme();
      await RES.loadGroup("preload", 0, loadingView);
      this.stage.removeChild(loadingView);
    }
    catch (e) {
      console.error(e);
    }
  }

  private loadTheme() {
    return new Promise((resolve, reject) => {
      // load skin theme configuration file, you can manually modify the file. And replace the default skin.
      //??????????????????????????????,??????????????????????????????????????????????????????
      let theme = new eui.Theme("resource/default.thm.json", this.stage);
      theme.addEventListener(eui.UIEvent.COMPLETE, () => {
        resolve();
      }, this);

    })
  }

  private textfield: egret.TextField;
  private ymrtc: RTC;

  /**
   * ??????????????????
   * Create scene interface
   */
  protected createGameScene(): void {
    let stageW = this.stage.stageWidth;
    let stageH = this.stage.stageHeight;

    let topMask = new egret.Shape();
    topMask.graphics.beginFill(0x000000, 0.5);
    topMask.graphics.drawRect(0, 0, stageW, stageH);
    topMask.graphics.endFill();
    this.addChild(topMask);

    let icon: egret.Bitmap = this.createBitmapByName("egret_icon_png");
    this.addChild(icon);
    icon.x = stageW / 2 - 180;
    icon.y = 80;

    let icon_ym: egret.Bitmap = this.createBitmapByName('youmilogo_png');
    this.addChild(icon_ym);
    icon_ym.scaleX = 1.5;
    icon_ym.scaleY = 1.5;
    icon_ym.x = stageW / 2 + 70;
    icon_ym.y = 123;


    let line = new egret.Shape();
    line.graphics.lineStyle(2, 0xffffff);
    line.graphics.moveTo(0, 0);
    line.graphics.lineTo(0, 117);
    line.graphics.endFill();
    line.x = stageW / 2;
    line.y = 104;
    this.addChild(line);

    var gp = new eui.Group();
    gp.horizontalCenter = 0;
    gp.verticalCenter = 0;
    var ly = new eui.VerticalLayout();
    ly.horizontalAlign = egret.HorizontalAlign.CENTER;
    ly.gap = 20;
    gp.layout = ly;
    this.addChild(gp);

    let wid = 200;

    var btnLogin = new eui.Button();
    btnLogin.width = wid;
    btnLogin.label = '????????????';
    gp.addChild(btnLogin);

    btnLogin.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
      if (!this.ymrtc) {
        // ????????????????????????
        var testAccount = [
          'sanji',
          'fantasy',
          '9999',
          'zoro3000',
          'youme_test201701',
          'youme_test201702'
        ];

        this.ymrtc = new RTC();
        var index = Math.floor(Math.random() * 6);
        var userName = testAccount[index];
        this.ymrtc.login(userName);
      }
    }, this)

    var btnCreatRoom = new eui.Button();
    btnCreatRoom.width = wid;
    btnCreatRoom.label = '??????/????????????';
    gp.addChild(btnCreatRoom);
    btnCreatRoom.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
      if (this.ymrtc) {
        this.ymrtc.joinRoom();
      }
    }, this)

    var btnStartLocalMedia = new eui.Button();
    btnStartLocalMedia.width = wid;
    btnStartLocalMedia.label = '????????????';
    gp.addChild(btnStartLocalMedia);
    btnStartLocalMedia.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
      if (this.ymrtc) {
        this.ymrtc.startLocalMedia()
      }
    }, this)

    var btnOpen = new eui.Button();
    btnOpen.width = wid;
    btnOpen.label = '???????????????';
    gp.addChild(btnOpen);
    btnOpen.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
      if (this.ymrtc) {
        this.ymrtc.openMic();
      }
    }, this)

    var btnClose = new eui.Button();
    btnClose.width = wid;
    btnClose.label = '???????????????';
    gp.addChild(btnClose);
    btnClose.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
      if (this.ymrtc) {
        this.ymrtc.closeMic();
      }
    }, this)

    var btnLeaveRoom = new eui.Button();
    btnLeaveRoom.width = wid;
    btnLeaveRoom.label = '????????????'
    gp.addChild(btnLeaveRoom);
    btnLeaveRoom.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
      if (this.ymrtc) {
        this.ymrtc.levelRoom()
      }
    }, this)

    var btnQuit = new eui.Button();
    btnQuit.width = wid;
    btnQuit.label = '??????';
    gp.addChild(btnQuit);
    btnQuit.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
      if (this.ymrtc) {
        this.ymrtc.quit();
      }
    }, this)

  }

  /**
   * ??????name?????????????????????Bitmap?????????name???????????????resources/resource.json????????????????????????
   * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
   */
  private createBitmapByName(name: string): egret.Bitmap {
    let result = new egret.Bitmap();
    let texture: egret.Texture = RES.getRes(name);
    result.texture = texture;
    return result;
  }

  /**
   * ?????????????????????????????????????????????
   * Description file loading is successful, start to play the animation
   */
  private startAnimation(result: Array<any>): void {
    let parser = new egret.HtmlTextParser();

    let textflowArr = result.map(text => parser.parse(text));
    let textfield = this.textfield;
    let count = -1;
    let change = () => {
      count++;
      if (count >= textflowArr.length) {
        count = 0;
      }
      let textFlow = textflowArr[count];

      // ??????????????????
      // Switch to described content
      textfield.textFlow = textFlow;
      let tw = egret.Tween.get(textfield);
      tw.to({"alpha": 1}, 200);
      tw.wait(2000);
      tw.to({"alpha": 0}, 200);
      tw.call(change, this);
    };

    change();
  }

  /**
   * ????????????
   * Click the button
   */
  private onButtonClick(e: egret.TouchEvent) {
    let panel = new eui.Panel();
    panel.title = "Title";
    panel.horizontalCenter = 0;
    panel.verticalCenter = 0;
    this.addChild(panel);
  }
}
