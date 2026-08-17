package com.screentats.tv

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private var errorShown = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.setBackgroundColor(Color.BLACK)
        setContentView(webView)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.javaScriptCanOpenWindowsAutomatically = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.userAgentString = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 ScreenTatsTV/1.0"
            )

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                errorShown = false
                view?.evaluateJavascript(FOCUS_BRIDGE, null)
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request?.isForMainFrame == true) showErrorPage()
            }
        }

        webView.requestFocus()
        webView.loadUrl(getString(R.string.app_url))

        hideSystemBars()
    }

    override fun onBackPressed() {
        if (errorShown) {
            errorShown = false
            webView.reload()
            return
        }
        if (webView.canGoBack()) {
            webView.goBack()
            return
        }
        super.onBackPressed()
    }

    override fun onResume() {
        super.onResume()
        hideSystemBars()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    private fun hideSystemBars() {
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    }

    private fun showErrorPage() {
        if (errorShown) return
        errorShown = true
        val html = """
            <html><head><meta charset="utf-8">
            <style>
              body { margin:0; height:100vh; display:flex; flex-direction:column;
                     align-items:center; justify-content:center; background:#050505;
                     color:#fff; font-family:system-ui,sans-serif; text-align:center; }
              h1 { font-size:44px; margin:0 0 16px; }
              p  { font-size:28px; color:#9aa4ab; margin:0; }
            </style></head>
            <body>
              <h1>Cannot reach ScreenTats</h1>
              <p>Check your internet connection, then press BACK to retry.</p>
            </body></html>
        """.trimIndent()
        webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
    }

    companion object {
        private const val FOCUS_BRIDGE = """
            (function () {
              function makeFocusable() {
                var els = document.querySelectorAll('a, button, [role="button"]');
                for (var i = 0; i < els.length; i++) {
                  var el = els[i];
                  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
                }
              }
              makeFocusable();
              document.addEventListener('focusin', function (e) {
                var el = e.target;
                if (el && typeof el.scrollIntoView === 'function') {
                  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                }
              });
              new MutationObserver(makeFocusable).observe(
                document.documentElement, { childList: true, subtree: true }
              );
            })();
        """
    }
}