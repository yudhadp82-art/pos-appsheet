# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in Android SDK tools.
# For more details, see
#   https://developer.android.com/build/shrink-code

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all classes in the package
-keep class com.pos.appsheet.** { *; }
