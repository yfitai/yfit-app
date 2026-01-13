package com.yfitai.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView to disable caching for development
        // This ensures the app always fetches the latest version from Vercel
        WebView webView = getBridge().getWebView();
        WebSettings webSettings = webView.getSettings();
        
        // Disable all caching
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webSettings.setAppCacheEnabled(false);
        
        // Clear existing cache on app start
        webView.clearCache(true);
        webView.clearHistory();
    }
}
