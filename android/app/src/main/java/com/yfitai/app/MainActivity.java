package com.yfitai.app;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable WebView debugging for Chrome DevTools
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        
        // Configure WebView with aggressive cache-busting
        configureWebViewCaching();
    }
    
    @Override
    public void onResume() {
        super.onResume();
        
        // Clear cache every time app resumes (comes to foreground)
        WebView webView = getBridge().getWebView();
        webView.clearCache(true);
        
        // Force reload the current page to fetch fresh content
        webView.reload();
    }
    
    private void configureWebViewCaching() {
        WebView webView = getBridge().getWebView();
        WebSettings webSettings = webView.getSettings();
        
        // Disable all forms of caching
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        // Note: setAppCacheEnabled() is deprecated and removed in API 33+
        webSettings.setDomStorageEnabled(true); // Keep for functionality
        webSettings.setDatabaseEnabled(false);
        
        // Disable save form data
        webSettings.setSaveFormData(false);
        
        // Enable mixed content (for HTTPS with HTTP resources)
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Clear all caches on startup
        webView.clearCache(true);
        webView.clearHistory();
        webView.clearFormData();
        
        // Clear cookies (but keep session for login)
        // android.webkit.CookieManager.getInstance().removeAllCookies(null);
    }
}
