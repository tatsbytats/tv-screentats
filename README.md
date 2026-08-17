# ScreenTats — Movie Discovery & Streaming Webapp

A premium, dark cinematic movie discovery platform: browse, search, watch trailers, stream
full movies & TV series, and pick up right where you left off.


## Features

- **Hero / featured film** with trailer + watchlist actions
- **Trending Now** & **Popular This Week** (bento grid) collections
- **Browse by Genre** (movies & TV), with live filtered grids
- **Search** — title/actor/keyword with genre, year, and rating filters plus sorting
- **Continue Watching** — real resume support, powered by the VidKing player's progress events
- **Recommended For You** — "Because you watched…" personalization
- **Watchlist** (localStorage-persisted) and **Profile dashboard** (bento stats)
- Movie & TV **detail pages**: full credits, cast row, seasons/episodes, similar titles
- Fully responsive: desktop bento → tablet → mobile with bottom navigation
- Loading skeletons, empty states, error states, keyboard navigation, focus rings, reduced-motion support

## Tech stack

- React 19 + Vite 8 (SPA, hash routing — runs from any static folder)
- TMDB v3 API for all metadata and artwork
- Zero other runtime dependencies.

## Android TV app (no ads)

The `android-tv/` folder is a zero-dependency Android TV wrapper that loads the deployed
web app (`https://screentats.vercel.app` by default — change it in
`android-tv/app/src/main/res/values/strings.xml`). It is an ad-free WebView shell: no ad SDKs,
no trackers, nothing but the app itself. A small injected script makes every link/button
dpad-focusable so the TV remote works everywhere, and the BACK key navigates web history.

### Build

Requires the Android SDK (platform 36) and Java 17.

```sh
cd android-tv
./gradlew assembleDebug
```

The APK lands at `app/build/outputs/apk/debug/app-debug.apk` (~0.8 MB).

### Install on Google TV

1. Enable **Developer options** → **USB debugging** / **Network debugging** on the device.
2. `adb connect <tv-ip>:5555` then `adb install -r app/build/outputs/apk/debug/app-debug.apk`
3. The ScreenTats tile appears in the launcher ("Your apps" row).

### Release signing (optional, for personal use)

```sh
keytool -genkey -v -keystore screentats.jks -alias screentats -keyalg RSA -keysize 2048 -validity 10000
```

Then add a `signingConfigs` block in `android-tv/app/build.gradle` referencing the keystore and
build with `./gradlew assembleRelease`. Note the app is not eligible for the Play Store
(TMDB content), so it's a sideload-only personal app.
