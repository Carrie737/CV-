已修复莫里索互动展览页的声音入口，并加入《纸间微光 · Gallery Reverie》原创合成钢琴与氛围音乐。

原实现并未加载音乐，只持续播放三个很轻的正弦音；不支持 AudioContext 时直接返回，没有反馈。播放失败后的状态以及快速开关也缺乏充分处理。本次用原生 audio 播放本地音频，移除了旧的振荡器逻辑。

使用方法：展览页右下角点击“音乐关闭”开始播放，再次点击关闭；旁边“···”打开音量、曲目信息和下载入口。默认 55%，只保存音量，刷新页面仍默认关闭。音频在首次点击时才加载。

音乐为 60 秒、64 BPM 的慢速循环，以柔和数字钢琴、低音与稀疏和声配合阅读，没有人声、鼓点或第三方采样。完整曲谱与合成代码见 articles/morisot/assets/audio/render-gallery-music.cjs；音频与来源说明保存在同目录。

改动文件：articles/morisot/index.html、music.js、music.css，以及 assets/audio/ 中的音乐资源。原有文章正文、画作、数据及内嵌附件已与修改前备份比较，保持完整。修改前的完整 HTML 保存在 .cv-tools/backups/2026-10-12-audio/articles-morisot-index.html。

还修复了本地预览服务器的音频 MIME、Content-Length 与 HTTP Range 响应，确保浏览器正确识别音频时长并支持定位及循环。

验证命令：

```powershell
node .cv-tools/check-music.cjs
node .cv-tools/check-link.cjs
```

Chrome 已验证真实解码的音频信号非零，60 秒时长与循环、默认不自动播放/下载、音量与键盘、快速切换、系统暂停、打印暂停/恢复、模拟触摸、播放权限拒绝、资源缺失、加载中取消、异常后重试、不支持 AudioContext 的原生播放、无 JavaScript 的音频链接、HTTP 200/206 与资源 MIME。原有文章入口、30 件作品与画廊初始化回归检查通过。

当前无头 Chrome 将测试标签页保持为可见，因此后台暂停/恢复通过注入 document.hidden 和 visibilityState 并触发真实 visibilitychange 处理器来验证。尚未进行实体手机或 Safari 测试，也未测量设备扬声器的实际音量；部分手机浏览器使用设备音量键控制媒体音量，界面会提供相应提示。

效果图：music-desktop.png、music-mobile.png。重新启动本地预览：

```powershell
node .cv-tools/preview-cv.cjs
```

打开 http://127.0.0.1:4173/articles/morisot/index.html 。无需发布或外部音乐服务。
