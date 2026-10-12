本次升级保留原有九章 CV 文本、章节顺序、低饱和配色、字体系统、图片、PDF 和文章链接，在原有 HTML/CSS/JavaScript 架构中完善交互动效。未添加前端依赖，也未修改 articles/morisot 中已有的未提交内容。

修改的源文件为 index.html、cv-enhancements.css 和 cv-enhancements.js。原始版本保存在 .cv-tools/backups/2026-10-12-follow-art/，可逐个复制回项目根目录恢复。

参考 [FOLLOW.ART](https://follow.art/) 及任务中指定的交互方向，完成以下对应关系：

| 参考方向 | 本站实现 |
| --- | --- |
| Kinetic Typography | 姓名逐字揭示，简介、说明和按钮错时入场；文字仍可选择 |
| 空间叙事 | 保留全部 poses 坐标；统一使用 Web Animations API 控制画布拉远、平移和推近；快速导航从当前镜头位置继续 |
| Curved UI / 3D Depth | 项目卡片约 3.5° 倾斜、标题和支柱浅景深；概念图约 3° 视差；发表卡片约 1.6° 倾斜 |
| 图像揭示 | 保留裁切式图像揭示；首页原图叠加最多约 9px 位移与 1.04 倍缩放 |
| Brush Stroke Hover | 使用原有蓝灰色的细线绘制、链接箭头移动和可见键盘焦点 |

教育信息按阅读顺序出现，分隔线延伸，成绩条填充到原来的 85.29%。研究数字在 159、108、51 之间平滑变化，图录条保持 108:51 的比例，并同步调整选中反馈；快速筛选取消旧数字动画。底部进度线、当前章节高亮和计数器提供过渡反馈。

画布模式在章节进入及章内滚动时揭示可见元素；阅读模式使用 IntersectionObserver。已揭示元素不会反复播放。模式切换、减少动态、页面隐藏和打印会清理动画。820px 以下及触摸设备禁用鼠标视差和卡片倾斜。镜头只有一个动画控制源，不再用根页面截图淡入淡出替代项目章节镜头。

在项目根目录运行本地预览：

```powershell
node .cv-tools/preview-cv.cjs
```

打开 http://127.0.0.1:4173 ，按 Ctrl+C 结束服务。

验证命令：

```powershell
node .cv-tools/check-cv.cjs
node .cv-tools/check-motion.cjs
node .cv-tools/check-link.cjs
```

Chrome 自动化检查已通过：1440、1024、768、390px 的九章布局和双模式切换；URL Hash、前进后退、总览、键盘与触摸滑动；快速导航镜头连续性及单一动画实例；照片视差的尺寸稳定与复位；项目倾斜和切换清理；研究 Tabs、159/108/51 筛选、经历 details；系统及按钮减少动态；打印和无 JavaScript 展示。

原始 CV 的页面标记和内联样式已与备份比对一致；内联与外部 JavaScript 语法检查通过。CV 的本地资源请求均返回 200，文章的 30 件原始作品资源存在，文章画廊初始化正常，没有捕获到浏览器脚本异常或本地资源 404。

cv-reading-1440.png、cv-reading-1024.png、cv-reading-768.png、cv-reading-390.png 为阅读模式截图，cv-print.pdf 为 Chrome 打印结果。测试使用本机 Chrome 和模拟触摸输入；未进行 Safari、Firefox、实体手机或持续帧率测量。
