<div align="center">

# Yohaku App for Android

_把你自己的 Yohaku 博客，打包成一个 Android App。_

[上游 Yohaku](https://github.com/Innei/Yohaku) · [Android 移植说明](./apps/mobile/README.android.md) · MIT

</div>

---

## 这是什么

这是 [Yohaku](https://github.com/Innei/Yohaku) 的 **Android 移植模板**。

Yohaku 是 Innei 做的一套面向个人写作的跨端出版产品：以 [mx-core](https://github.com/mx-space/core)
为内容后端，在 Web 与 iOS 上呈现文章、手记、思考与时间线。上游仓库公开发布的是
**iOS 客户端**（App Store 上那个 Yohaku 的源码），MIT 许可。

本仓库在上游代码的基础上补上了 Android 支持：原生工程配置、导航与排版适配、
登录链路（邮箱 / 社交 / 登出）、正文渲染，以及一个把站点地址收敛到单个配置文件的改动。
**iOS 侧的行为没有被改动**，Android 的差异全部通过 `Platform.OS` 分支或 `index` 派发隔离。

> 本仓库是非官方移植，由社区维护，不代表 Innei 或 Yohaku 官方。
> 上游版权与设计归 Innei 所有，本项目同样以 MIT 发布。

## 与上游的关系

| 项目 | 上游 `Innei/Yohaku` | 本仓库 |
| --- | --- | --- |
| 平台 | iOS 18+ | iOS + **Android 8.0+（API 26）** |
| 定位 | 单一站点的原生阅读客户端 | 同上，附带一份可直接 fork 的 Android 模板 |
| 站点配置 | 通过 `apps/mobile-overlay/` 覆盖 | 新增 `apps/mobile/site.config.json`，一个文件搞定 |
| 登录 | YohakuKit（ASWebAuthenticationSession） | Android 走 Custom Tabs + `Linking` 回跳 |
| 正文渲染 | Lexical 原生块 | 优先 Markdown，Lexical 兜底 |

具体的 Android 改动清单（构建、导航、视觉、登录、正文、已知差异）在
[`apps/mobile/README.android.md`](./apps/mobile/README.android.md)。

## Fork 之后，三步变成你自己的 App

### 1. Fork 或克隆

```bash
git clone https://github.com/<you>/Yohaku-App-for-Android.git
cd Yohaku-App-for-Android
pnpm install
```

### 2. 改一个文件

编辑 `apps/mobile/site.config.json`：

```json
{
  "appName": "我的博客",
  "androidPackage": "com.example.myblog",
  "bundleId": "dev.yohaku.app",
  "scheme": "yohaku",
  "siteUrl": "https://blog.example.com",
  "apiUrl": "https://blog.example.com/api/v3",
  "privacyUrl": "",
  "siteHosts": ["blog.example.com"]
}
```

| 字段 | 说明 |
| --- | --- |
| `appName` | 桌面图标下显示的名字，也可以写中文 |
| `androidPackage` | Android 包名。**一旦上架 Google Play 就不能再改** |
| `bundleId` | iOS bundle id；只做 Android 可以不动 |
| `scheme` | 自定义 URL scheme，登录回跳使用，必须与后端回调一致 |
| `siteUrl` | 站点前台地址 |
| `apiUrl` | mx-core 的 API 根地址，通常是 `站点地址/api/v3` |
| `privacyUrl` | 留空则自动用 `siteUrl + /privacy` |
| `siteHosts` | 站点域名，用于把 https 链接收进 App（深链） |

想换图标就替换 `apps/mobile/assets/images/` 下的
`icon.png`、`adaptive` 三件套（`android-icon-foreground/background/monochrome.png`）
和 `splash-icon.png`。

### 3. 构建

需要一个 Android 构建环境：**Node 20+、pnpm、JDK 17、Android SDK Platform 37**。

```bash
cd apps/mobile
npx expo prebuild -p android --clean

cd android
./gradlew :app:assembleRelease
```

产物：`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

`expo prebuild` 会根据 `app.config.ts` 生成 `AndroidManifest.xml`，把包名、
scheme、站点域名的 https 深链、图标和权限都写进去，所以**改完配置一定要重新 prebuild**。

本地调试如果没配签名，可以先把 `android/app/build.gradle` 里的
`signingConfigs.release` 指向 debug keystore；正式发布请换成自己的 keystore，
并保管好 `*.jks`（已在 `.gitignore` 中忽略）。

### 可选：构建参数

| 环境变量 | 作用 | 默认 |
| --- | --- | --- |
| `YOHAKU_ANDROID_ABIS` | 打进 APK 的 ABI 集合 | `arm64-v8a,x86_64` |
| `YOHAKU_CMAKE_STAGING` | CMake 中间目录（Windows 路径过长时改这个） | `android/.cxx-staging` |

只想发到应用商店、要兼容老设备时，加上 `armeabi-v7a`：
`YOHAKU_ANDROID_ABIS=armeabi-v7a,arm64-v8a,x86_64 ./gradlew :app:assembleRelease`

也可以直接用 EAS：

```bash
npx eas build -p android --profile production
```

## 后端要求

App 只是客户端，内容仍然来自你的 mx-core：

- mx-core **v12 或以上**
- 开启了 better-auth，并提供 `/api/v3/auth/*`
- 暴露 `set-auth-token` 响应头（`access-control-expose-headers`）——
  Android 的 RN `fetch` 读不到 `set-cookie`，登录就是靠这个头完成的
- 提供 `/api/v3/auth/expo-authorization-proxy`（社交登录在 Custom Tabs 里走这个代理）
- 社交登录的回调地址与 `site.config.json` 的 `scheme` 对应（默认 `yohaku://`）

如果后端不是 mx-core，需要自己实现等价的 `/api/v3` 接口与认证端点。

## 常见问题

**正文空白 / 只显示标题**
Lexical 文档里出现未注册的节点类型时，整篇会解析失败。本仓库已注册
`@lexical/link` 并对空渲染加了 Markdown 降级；如果你改过渲染层，先确认
`apps/mobile/src/rich/lexical/rich-document.tsx` 的 `extraNodes` 是否还完整。

**登录成功但回到 App 还是未登录**
检查后端是否暴露了 `set-auth-token`，以及 `scheme` 与后端回调是否一致。
Android 上 cookie 由 `set-auth-token` 自行拼装，不依赖 `set-cookie`。

**构建时报 `Cannot find module 'expo-web-browser'`**
Android 必须使用真实的 `expo-web-browser`（Custom Tabs）。确认
`metro.config.js` 里那个 shim **只在 `platform === 'ios'` 时生效**，
并且 `expo-web-browser` 已在 `package.json` 里。

**点开链接没有进 App**
`intentFilters` 里的 host 来自 `site.config.json` 的 `siteUrl`，
改完需要重新 `expo prebuild`；Android 12+ 还需要 `autoVerify` 校验通过。

**`formSheet` 页面上的按钮点不动**
Android 的 `formSheet` 不会屏蔽下层页面，登录页已经改成 `fullScreenModal`。
自定义新页面时同理。

## 已知限制

- iOS 专属的动效（玻璃材质、SF Symbols、Live Activity）在 Android 上退化为静态实现。
- 打印 / 导出 PDF 使用 RN 侧排版，与 iOS 不完全一致。
- 社交登录依赖后端代理端点，纯前端换后端需要自己补。
- 目前只适配手机竖屏，平板未做布局。

## 致谢与许可

- 原始项目：[Innei/Yohaku](https://github.com/Innei/Yohaku)（iOS 客户端与设计系统），MIT。
  本仓库的绝大部分代码来自上游，Android 支持是在其之上补充的。
- 内容后端：[mx-space/core](https://github.com/mx-space/core)。
- 本仓库同样以 **MIT** 发布。如果你二次分发，请保留上游版权声明。

---

<details>
<summary>English</summary>

**Yohaku App for Android** is a community Android port of [Innei's Yohaku](https://github.com/Innei/Yohaku)
(the MIT-licensed iOS client published upstream). The iOS code paths are untouched; every Android
difference sits behind `Platform.OS` checks.

To make it your own: fork, edit `apps/mobile/site.config.json` (site URL, API URL, package id,
app name), then run `npx expo prebuild -p android --clean` and `./gradlew :app:assembleRelease`.

Requirements: mx-core v12+, better-auth with the `set-auth-token` header exposed, and the
`/auth/expo-authorization-proxy` endpoint for social sign-in.

Not an official Yohaku release. Upstream copyright belongs to Innei. MIT.

</details>
