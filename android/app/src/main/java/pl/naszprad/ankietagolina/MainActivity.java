package pl.naszprad.ankietagolina;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER = 4001;
    private static final int CAMERA_PERMISSION = 4002;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraUri;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> {
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(request.getResources());
                    } else {
                        ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION);
                        request.deny();
                    }
                });
            }

            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                openImageChooser(params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                return true;
            }
        });
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION);
        }
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void openImageChooser(boolean multiple) {
        Intent gallery = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        gallery.addCategory(Intent.CATEGORY_OPENABLE);
        gallery.setType("image/*");
        gallery.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple);

        Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        ArrayList<Intent> initial = new ArrayList<>();
        if (camera.resolveActivity(getPackageManager()) != null) {
            try {
                File dir = new File(getCacheDir(), "camera");
                if (!dir.exists()) dir.mkdirs();
                File photo = File.createTempFile("audit_", ".jpg", dir);
                cameraUri = FileProvider.getUriForFile(this, getPackageName() + ".files", photo);
                camera.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                initial.add(camera);
            } catch (IOException ignored) { cameraUri = null; }
        }

        Intent chooser = new Intent(Intent.ACTION_CHOOSER);
        chooser.putExtra(Intent.EXTRA_INTENT, gallery);
        chooser.putExtra(Intent.EXTRA_TITLE, "Zrób zdjęcie lub wybierz z galerii");
        chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, initial.toArray(new Intent[0]));
        try { startActivityForResult(chooser, FILE_CHOOSER); }
        catch (ActivityNotFoundException e) { fileCallback.onReceiveValue(null); fileCallback = null; }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER || fileCallback == null) return;
        ArrayList<Uri> result = new ArrayList<>();
        if (resultCode == RESULT_OK) {
            if (data != null && data.getClipData() != null) {
                for (int i = 0; i < data.getClipData().getItemCount(); i++) result.add(data.getClipData().getItemAt(i).getUri());
            } else if (data != null && data.getData() != null) result.add(data.getData());
            else if (cameraUri != null) result.add(cameraUri);
        }
        fileCallback.onReceiveValue(result.isEmpty() ? null : result.toArray(new Uri[0]));
        fileCallback = null;
        cameraUri = null;
    }

    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
}
