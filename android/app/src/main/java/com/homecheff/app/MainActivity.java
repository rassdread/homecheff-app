package com.homecheff.app;

import android.graphics.Color;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // WebView default is zwart; wit tot eerste frame van de site geladen is.
        getWindow().getDecorView().setBackgroundColor(Color.WHITE);
    }
}
